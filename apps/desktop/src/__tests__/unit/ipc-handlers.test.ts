// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available in vi.mock factories (which are hoisted to top)
const { mockSearch, mockGetJobDetails, mockShowOpenDialog, mockPdfParse, mockParseWithGemini } =
  vi.hoisted(() => ({
    mockSearch: vi.fn(),
    mockGetJobDetails: vi.fn(),
    mockShowOpenDialog: vi.fn(),
    mockPdfParse: vi.fn(),
    mockParseWithGemini: vi.fn(),
  }));

// Mock @job-hunt/core before importing handlers
vi.mock('@job-hunt/core', () => {
  const MockJSearchClient = class {
    constructor(_key: string) {
      void _key;
    }
    search = mockSearch;
    getJobDetails = mockGetJobDetails;
  };

  return {
    JSearchClient: MockJSearchClient,
    checkRateLimit: vi.fn().mockResolvedValue(undefined),
    getQuotaStatus: vi.fn().mockResolvedValue({
      weeklyUsed: 5,
      weeklyLimit: 50,
      weeklyRemaining: 45,
      monthlyUsed: 20,
      monthlyLimit: 200,
      monthlyRemaining: 180,
      weeklyResetsAt: null,
      monthlyResetsAt: null,
    }),
    recordApiRequest: vi.fn().mockResolvedValue(undefined),
    RateLimitError: class RateLimitError extends Error {
      type: string;
      quota: unknown;
      constructor(type: string, quota: unknown) {
        super(`${type} rate limit reached`);
        this.name = 'RateLimitError';
        this.type = type;
        this.quota = quota;
      }
    },
    applyPostFilters: vi.fn((jobs: unknown[]) => jobs),
    deduplicateJobs: vi.fn((jobs: unknown[]) => jobs),
  };
});

// Mock electron safeStorage, dialog, and fs
vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(false),
    encryptString: vi.fn((s: string) => Buffer.from(s)),
    decryptString: vi.fn((b: Buffer) => b.toString()),
  },
  dialog: {
    showOpenDialog: mockShowOpenDialog,
  },
}));

vi.mock('pdf-parse/lib/pdf-parse.js', () => ({
  default: mockPdfParse,
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('../../main/gemini-parser.ts', () => ({
  parseWithGemini: mockParseWithGemini,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
  };
});

import {
  handleSearch,
  handleGetJobDetails,
  handleGetQuota,
  handleSaveApiKey,
  handleGetApiKeyStatus,
  handleRemoveApiKey,
  handlePickResumeFile,
  handleParseResumeText,
  handleSaveGeminiKey,
  handleGetGeminiKeyStatus,
  handleRemoveGeminiKey,
} from '../../main/ipc-handlers.js';
import { checkRateLimit, getQuotaStatus } from '@job-hunt/core';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cached keys from previous tests
    handleRemoveApiKey();
    handleRemoveGeminiKey();
  });

  describe('handleSearch', () => {
    it('calls client.search and returns data + quota', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      const { readFileSync } = await import('node:fs');
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('test-key'));

      const mockJobs = [{ job_id: '1', job_title: 'Test' }];
      mockSearch.mockResolvedValue({ status: 'OK', data: mockJobs });

      const result = await handleSearch({ query: 'react developer' });

      expect(checkRateLimit).toHaveBeenCalled();
      expect(mockSearch).toHaveBeenCalledWith({ query: 'react developer' });
      expect(result.data).toEqual(mockJobs);
      expect(result.quota).toBeDefined();
      expect(result.quota.weeklyRemaining).toBe(45);
    });

    it('passes filters to applyPostFilters', async () => {
      mockSearch.mockResolvedValue({ status: 'OK', data: [] });
      const { applyPostFilters } = await import('@job-hunt/core');

      await handleSearch({ query: 'test' }, { minSalary: 100000 });

      expect(applyPostFilters).toHaveBeenCalledWith([], { minSalary: 100000 });
    });

    it('deduplicates results', async () => {
      mockSearch.mockResolvedValue({ status: 'OK', data: [{ job_id: '1' }] });
      const { deduplicateJobs } = await import('@job-hunt/core');

      await handleSearch({ query: 'test' });

      expect(deduplicateJobs).toHaveBeenCalled();
    });

    it('throws when rate limit exceeded', async () => {
      const { RateLimitError } = await import('@job-hunt/core');
      (checkRateLimit as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new RateLimitError('weekly', {
          weeklyRemaining: 0,
        } as unknown as import('@job-hunt/core').QuotaStatus)
      );

      await expect(handleSearch({ query: 'test' })).rejects.toThrow('rate limit reached');
    });
  });

  describe('handleGetJobDetails', () => {
    it('calls client.getJobDetails', async () => {
      const mockDetails = { status: 'OK', data: [{ job_id: 'abc' }] };
      mockGetJobDetails.mockResolvedValue(mockDetails);

      const result = await handleGetJobDetails('abc');

      expect(mockGetJobDetails).toHaveBeenCalledWith('abc');
      expect(result).toEqual(mockDetails);
    });
  });

  describe('handleGetQuota', () => {
    it('returns quota status', async () => {
      const result = await handleGetQuota();

      expect(getQuotaStatus).toHaveBeenCalled();
      expect(result.weeklyRemaining).toBe(45);
      expect(result.monthlyRemaining).toBe(180);
    });
  });

  describe('handleSaveApiKey', () => {
    it('validates and saves key on success', async () => {
      mockSearch.mockResolvedValue({ status: 'OK', data: [] });

      const result = await handleSaveApiKey('valid-key');

      expect(result.success).toBe(true);
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('returns error when validation fails', async () => {
      mockSearch.mockRejectedValue(new Error('Unauthorized'));

      const result = await handleSaveApiKey('bad-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('handleGetApiKeyStatus', () => {
    it('returns hasKey false when no key file', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const result = handleGetApiKeyStatus();
      expect(result).toEqual({ success: true, hasKey: false });
    });
  });

  describe('handleRemoveApiKey', () => {
    it('returns success', () => {
      const result = handleRemoveApiKey();
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleSaveGeminiKey', () => {
    it('saves key and returns success', () => {
      const result = handleSaveGeminiKey('gemini-key-123');
      expect(result).toEqual({ success: true });
      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  describe('handleGetGeminiKeyStatus', () => {
    it('returns hasKey false when no key file', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const result = handleGetGeminiKeyStatus();
      expect(result).toEqual({ success: true, hasKey: false });
    });

    it('returns hasKey true when key file exists', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('enc-key'));

      const result = handleGetGeminiKeyStatus();
      expect(result).toEqual({ success: true, hasKey: true });
    });
  });

  describe('handleRemoveGeminiKey', () => {
    it('returns success', () => {
      const result = handleRemoveGeminiKey();
      expect(result).toEqual({ success: true });
    });
  });

  describe('handlePickResumeFile', () => {
    it('returns geminiKeyMissing when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handlePickResumeFile();
      expect(result.success).toBe(false);
      expect(result.geminiKeyMissing).toBe(true);
    });

    it('returns cancelled when dialog is dismissed', async () => {
      // Set up Gemini key
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('gemini-key'));
      handleSaveGeminiKey('gemini-key');

      mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });

      const result = await handlePickResumeFile();
      expect(result).toEqual({ success: true, cancelled: true });
    });

    it('extracts text from PDF files', async () => {
      handleSaveGeminiKey('gemini-key');

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/tmp/resume.pdf'],
      });
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('mock-pdf'));
      mockPdfParse.mockResolvedValue({ text: 'John Doe\nSoftware Engineer' });

      const result = await handlePickResumeFile();
      expect(result.success).toBe(true);
      expect(result.text).toBe('John Doe\nSoftware Engineer');
    });

    it('extracts text from DOCX files', async () => {
      handleSaveGeminiKey('gemini-key');

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/tmp/resume.docx'],
      });
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('mock-docx'));
      const mammoth = (await import('mammoth')).default;
      (mammoth.extractRawText as ReturnType<typeof vi.fn>).mockResolvedValue({
        value: 'Jane Smith\njane@test.com',
      });

      const result = await handlePickResumeFile();
      expect(result.success).toBe(true);
      expect(result.text).toBe('Jane Smith\njane@test.com');
    });

    it('returns error for unsupported file types', async () => {
      handleSaveGeminiKey('gemini-key');

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/tmp/resume.txt'],
      });

      const result = await handlePickResumeFile();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('returns error when file read fails', async () => {
      handleSaveGeminiKey('gemini-key');

      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/tmp/corrupt.pdf'],
      });
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('bad'));
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));

      const result = await handlePickResumeFile();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PDF');
    });
  });

  describe('handleParseResumeText', () => {
    it('returns error when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handleParseResumeText('some text');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API key not configured');
    });

    it('parses text with Gemini and returns data', async () => {
      handleSaveGeminiKey('gemini-key');
      mockParseWithGemini.mockResolvedValue({
        personalInfo: { fullName: 'John Doe' },
      });

      const result = await handleParseResumeText('John Doe\nSoftware Engineer');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ personalInfo: { fullName: 'John Doe' } });
      expect(mockParseWithGemini).toHaveBeenCalledWith('John Doe\nSoftware Engineer', 'gemini-key');
    });

    it('returns error when Gemini parsing fails', async () => {
      handleSaveGeminiKey('gemini-key');
      mockParseWithGemini.mockRejectedValue(new Error('Gemini API error (429)'));

      const result = await handleParseResumeText('some text');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API error (429)');
    });
  });
});

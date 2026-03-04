// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available in vi.mock factories (which are hoisted to top)
const {
  mockSearch,
  mockGetJobDetails,
  mockShowOpenDialog,
  mockGetPath,
  mockOpenPath,
  mockPdfParse,
  mockParseWithGemini,
  mockGenerateTailoredResume,
  mockGenerateTailoredCV,
  mockGenerateTailoredResumeDocx,
  mockGenerateTailoredCVDocx,
} = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockGetJobDetails: vi.fn(),
  mockShowOpenDialog: vi.fn(),
  mockGetPath: vi.fn().mockReturnValue('/tmp/downloads'),
  mockOpenPath: vi.fn().mockResolvedValue(''),
  mockPdfParse: vi.fn(),
  mockParseWithGemini: vi.fn(),
  mockGenerateTailoredResume: vi.fn(),
  mockGenerateTailoredCV: vi.fn(),
  mockGenerateTailoredResumeDocx: vi.fn(),
  mockGenerateTailoredCVDocx: vi.fn(),
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
  app: { getPath: mockGetPath },
  ipcMain: { handle: vi.fn() },
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(false),
    encryptString: vi.fn((s: string) => Buffer.from(s)),
    decryptString: vi.fn((b: Buffer) => b.toString()),
  },
  shell: { openPath: mockOpenPath },
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

vi.mock('../../main/document-generator.ts', () => ({
  generateTailoredResume: mockGenerateTailoredResume,
  generateTailoredCV: mockGenerateTailoredCV,
  generateTailoredResumeDocx: mockGenerateTailoredResumeDocx,
  generateTailoredCVDocx: mockGenerateTailoredCVDocx,
}));

vi.mock('../../main/updater.ts', () => ({
  updaterService: {
    checkForUpdates: vi.fn().mockResolvedValue(null),
    downloadUpdate: vi.fn().mockResolvedValue(undefined),
    quitAndInstall: vi.fn(),
    getVersion: vi.fn().mockReturnValue('0.0.1'),
    getStatus: vi.fn().mockReturnValue({ status: 'idle' }),
    initialize: vi.fn(),
  },
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
  handleGenerateResume,
  handleGenerateCV,
  handleGenerateResumeDocx,
  handleGenerateCVDocx,
  handleSaveResume,
  handleLoadResume,
  registerIpcHandlers,
} from '../../main/ipc-handlers.js';
import { checkRateLimit, getQuotaStatus } from '@job-hunt/core';
import { ipcMain } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { updaterService } from '../../main/updater.ts';

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

    it('handles null data in search response', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('test-key'));
      mockSearch.mockResolvedValue({ status: 'OK', data: null });

      const result = await handleSearch({ query: 'test' });
      expect(result.data).toEqual([]);
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

    it('uses safeStorage encryption when available', async () => {
      const { safeStorage } = await import('electron');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockSearch.mockResolvedValue({ status: 'OK', data: [] });

      const result = await handleSaveApiKey('enc-key');
      expect(result.success).toBe(true);
      expect(safeStorage.encryptString).toHaveBeenCalledWith('enc-key');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false);
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

    it('returns hasKey true and uses decryption when encryption available', async () => {
      const { safeStorage } = await import('electron');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('encrypted-data'));

      // Clear cached key first
      handleRemoveApiKey();
      const result = handleGetApiKeyStatus();
      expect(result).toEqual({ success: true, hasKey: true });
      expect(safeStorage.decryptString).toHaveBeenCalled();
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false);
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

    it('uses safeStorage encryption when available', async () => {
      const { safeStorage } = await import('electron');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = handleSaveGeminiKey('gemini-enc');
      expect(result).toEqual({ success: true });
      expect(safeStorage.encryptString).toHaveBeenCalledWith('gemini-enc');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false);
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

    it('uses decryption when encryption is available', async () => {
      const { safeStorage } = await import('electron');
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('encrypted'));

      handleRemoveGeminiKey();
      const result = handleGetGeminiKeyStatus();
      expect(result).toEqual({ success: true, hasKey: true });
      expect(safeStorage.decryptString).toHaveBeenCalled();
      (safeStorage.isEncryptionAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false);
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

  const sampleJobData = {
    title: 'Engineer',
    company: 'Acme',
    description: 'Build things',
    requiredSkills: null,
    employmentType: 'FULLTIME',
    isRemote: false,
    location: 'NYC',
    highlights: null,
  };

  const sampleResumeData = {
    personalInfo: { fullName: 'Jane', email: 'j@t.com' },
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
  };

  describe('handleGenerateResume', () => {
    it('returns geminiKeyMissing when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handleGenerateResume(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.geminiKeyMissing).toBe(true);
    });

    it('returns error when no resume data', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateResume(sampleJobData, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('returns error when resumeData is null', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateResume(
        sampleJobData,
        null as unknown as Record<string, unknown>
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('generates resume PDF and returns file path', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredResume.mockResolvedValue(Buffer.from('pdf-data'));

      const result = await handleGenerateResume(sampleJobData, sampleResumeData);
      expect(result.success).toBe(true);
      expect(result.filePath).toContain('Jane - Engineer Resume.pdf');
      expect(mockGenerateTailoredResume).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled();
      expect(mockOpenPath).toHaveBeenCalled();
    });

    it('returns error when generation fails', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredResume.mockRejectedValue(new Error('Gemini rate limit'));

      const result = await handleGenerateResume(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini rate limit');
    });
  });

  describe('handleGenerateCV', () => {
    it('returns geminiKeyMissing when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handleGenerateCV(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.geminiKeyMissing).toBe(true);
    });

    it('returns error when no resume data', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateCV(sampleJobData, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('returns error when resumeData is null', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateCV(
        sampleJobData,
        null as unknown as Record<string, unknown>
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('generates CV PDF and returns file path', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredCV.mockResolvedValue(Buffer.from('pdf-data'));

      const result = await handleGenerateCV(sampleJobData, sampleResumeData);
      expect(result.success).toBe(true);
      expect(result.filePath).toContain('Jane - Engineer CV.pdf');
      expect(mockGenerateTailoredCV).toHaveBeenCalled();
    });

    it('returns error when generation fails', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredCV.mockRejectedValue(new Error('API error'));

      const result = await handleGenerateCV(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('API error');
    });
  });

  describe('handleGenerateResumeDocx', () => {
    it('returns geminiKeyMissing when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handleGenerateResumeDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.geminiKeyMissing).toBe(true);
    });

    it('returns error when no resume data', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateResumeDocx(sampleJobData, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('returns error when resumeData is null', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateResumeDocx(
        sampleJobData,
        null as unknown as Record<string, unknown>
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('generates DOCX resume and returns file path', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredResumeDocx.mockResolvedValue(Buffer.from('docx-data'));

      const result = await handleGenerateResumeDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(true);
      expect(result.filePath).toContain('.docx');
      expect(mockGenerateTailoredResumeDocx).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled();
      expect(mockOpenPath).toHaveBeenCalled();
    });

    it('returns error when generation fails', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredResumeDocx.mockRejectedValue(new Error('Gemini rate limit'));

      const result = await handleGenerateResumeDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini rate limit');
    });
  });

  describe('handleGenerateCVDocx', () => {
    it('returns geminiKeyMissing when no Gemini key', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await handleGenerateCVDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.geminiKeyMissing).toBe(true);
    });

    it('returns error when no resume data', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateCVDocx(sampleJobData, {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('returns error when resumeData is null', async () => {
      handleSaveGeminiKey('gemini-key');

      const result = await handleGenerateCVDocx(
        sampleJobData,
        null as unknown as Record<string, unknown>
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('No resume data');
    });

    it('generates DOCX CV and returns file path', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredCVDocx.mockResolvedValue(Buffer.from('docx-data'));

      const result = await handleGenerateCVDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(true);
      expect(result.filePath).toContain('CV.docx');
      expect(mockGenerateTailoredCVDocx).toHaveBeenCalled();
    });

    it('returns error when generation fails', async () => {
      handleSaveGeminiKey('gemini-key');
      mockGenerateTailoredCVDocx.mockRejectedValue(new Error('API error'));

      const result = await handleGenerateCVDocx(sampleJobData, sampleResumeData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('API error');
    });
  });

  describe('handleSaveResume', () => {
    it('writes resume data to file', () => {
      const data = { personalInfo: { fullName: 'Test' } };
      const result = handleSaveResume(data);
      expect(result.success).toBe(true);
      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  describe('handleLoadResume', () => {
    it('returns null when file does not exist', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = handleLoadResume();
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('returns parsed data when file exists', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({ personalInfo: { fullName: 'Test' } })
      );

      const result = handleLoadResume();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ personalInfo: { fullName: 'Test' } });
    });

    it('returns null on parse error', () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (readFileSync as ReturnType<typeof vi.fn>).mockReturnValue('invalid json');

      const result = handleLoadResume();
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('registerIpcHandlers', () => {
    it('registers all IPC handlers', () => {
      const handleSpy = ipcMain.handle as ReturnType<typeof vi.fn>;
      handleSpy.mockClear();

      registerIpcHandlers();

      const channels = handleSpy.mock.calls.map((call: unknown[]) => call[0] as string);
      expect(channels).toContain('api:search');
      expect(channels).toContain('api:job-details');
      expect(channels).toContain('api:quota');
      expect(channels).toContain('settings:save-api-key');
      expect(channels).toContain('settings:get-api-key-status');
      expect(channels).toContain('settings:remove-api-key');
      expect(channels).toContain('settings:save-gemini-key');
      expect(channels).toContain('settings:get-gemini-key-status');
      expect(channels).toContain('settings:remove-gemini-key');
      expect(channels).toContain('resume:save');
      expect(channels).toContain('resume:load');
      expect(channels).toContain('resume:pick-file');
      expect(channels).toContain('resume:parse-text');
      expect(channels).toContain('document:generate-resume');
      expect(channels).toContain('document:generate-cv');
      expect(channels).toContain('document:generate-resume-docx');
      expect(channels).toContain('document:generate-cv-docx');
      expect(channels).toContain('updater:check');
      expect(channels).toContain('updater:download');
      expect(channels).toContain('updater:install');
      expect(channels).toContain('updater:get-version');
    });
  });

  describe('updater IPC handlers', () => {
    function getRegisteredHandler(channel: string) {
      const handleSpy = ipcMain.handle as ReturnType<typeof vi.fn>;
      handleSpy.mockClear();
      registerIpcHandlers();
      const call = handleSpy.mock.calls.find((c: unknown[]) => c[0] === channel);
      return call ? call[1] : undefined;
    }

    it('updater:check returns null when no update', async () => {
      (updaterService.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const handler = getRegisteredHandler('updater:check');
      const result = await handler();
      expect(result).toBeNull();
    });

    it('updater:check returns update info with string release notes', async () => {
      (updaterService.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '2.0.0',
        releaseDate: '2026-03-01',
        releaseNotes: 'Bug fixes',
      });

      const handler = getRegisteredHandler('updater:check');
      const result = await handler();

      expect(result).toEqual({
        version: '2.0.0',
        releaseDate: '2026-03-01',
        releaseNotes: 'Bug fixes',
      });
    });

    it('updater:check handles array release notes', async () => {
      (updaterService.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '2.0.0',
        releaseDate: '2026-03-01',
        releaseNotes: [
          { version: '2.0.0', note: 'Fix A' },
          { version: '1.9.0', note: null },
          { version: '1.8.0', note: 'Fix B' },
        ],
      });

      const handler = getRegisteredHandler('updater:check');
      const result = await handler();

      expect(result.releaseNotes).toBe('2.0.0: Fix A\n1.8.0: Fix B');
    });

    it('updater:check handles undefined release notes', async () => {
      (updaterService.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '2.0.0',
        releaseDate: '2026-03-01',
        releaseNotes: undefined,
      });

      const handler = getRegisteredHandler('updater:check');
      const result = await handler();

      expect(result.releaseNotes).toBeUndefined();
    });

    it('updater:download calls downloadUpdate', async () => {
      const handler = getRegisteredHandler('updater:download');
      await handler();

      expect(updaterService.downloadUpdate).toHaveBeenCalled();
    });

    it('updater:install calls quitAndInstall', () => {
      const handler = getRegisteredHandler('updater:install');
      handler();

      expect(updaterService.quitAndInstall).toHaveBeenCalled();
    });

    it('updater:get-version returns app version', () => {
      const handler = getRegisteredHandler('updater:get-version');
      const result = handler();

      expect(result).toBe('0.0.1');
      expect(updaterService.getVersion).toHaveBeenCalled();
    });
  });
});

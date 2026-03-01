import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @job-hunt/core before importing handlers
const mockSearch = vi.fn();
const mockGetJobDetails = vi.fn();

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

// Set env before importing
process.env.RAPIDAPI_KEY = 'test-key';

import { handleSearch, handleGetJobDetails, handleGetQuota } from '../../main/ipc-handlers.js';
import { checkRateLimit, getQuotaStatus } from '@job-hunt/core';

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSearch', () => {
    it('calls client.search and returns data + quota', async () => {
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
        new RateLimitError('weekly', { weeklyRemaining: 0 })
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
});

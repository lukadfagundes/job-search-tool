import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage module before importing client
vi.mock('../storage/index.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined),
  recordApiRequest: vi.fn().mockResolvedValue(undefined),
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
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { JSearchClient } from '../api/client.js';
import { checkRateLimit, recordApiRequest } from '../storage/index.js';

describe('JSearchClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if no API key provided', () => {
    expect(() => new JSearchClient('')).toThrow('RapidAPI key is required');
  });

  it('constructs with valid API key', () => {
    const client = new JSearchClient('test-key');
    expect(client).toBeDefined();
  });

  it('returns null for remaining requests initially', () => {
    const client = new JSearchClient('test-key');
    expect(client.getRemainingRequests()).toBeNull();
  });

  describe('search', () => {
    it('calls the search endpoint with correct params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['x-ratelimit-requests-remaining', '95']]),
        json: () => Promise.resolve({ status: 'OK', data: [], parameters: {}, request_id: '123' }),
      });

      const client = new JSearchClient('test-key');
      const result = await client.search({ query: 'react developer' });

      expect(checkRateLimit).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?query=react+developer'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-RapidAPI-Key': 'test-key',
          }),
        })
      );
      expect(recordApiRequest).toHaveBeenCalled();
      expect(result.status).toBe('OK');
    });

    it('includes optional search parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({ status: 'OK', data: [], parameters: {}, request_id: '123' }),
      });

      const client = new JSearchClient('test-key');
      await client.search({
        query: 'engineer',
        page: 2,
        num_pages: 3,
        date_posted: 'week',
        remote_jobs_only: true,
        employment_types: 'FULLTIME',
        job_requirements: 'under_3_years_experience',
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('num_pages=3');
      expect(url).toContain('date_posted=week');
      expect(url).toContain('remote_jobs_only=true');
      expect(url).toContain('employment_types=FULLTIME');
      expect(url).toContain('job_requirements=under_3_years_experience');
    });

    it('throws on non-OK response after retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
      });

      const client = new JSearchClient('test-key');
      await expect(client.search({ query: 'test' })).rejects.toThrow('JSearch API error: 500');
    });

    it('tracks remaining requests from response headers', async () => {
      const headers = new Map([['x-ratelimit-requests-remaining', '42']]);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        json: () => Promise.resolve({ status: 'OK', data: [], parameters: {}, request_id: '123' }),
      });

      const client = new JSearchClient('test-key');
      await client.search({ query: 'test' });

      expect(client.getRemainingRequests()).toBe(42);
    });
  });

  describe('getJobDetails', () => {
    it('calls job-details endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({ status: 'OK', data: [], request_id: '123' }),
      });

      const client = new JSearchClient('test-key');
      await client.getJobDetails('test-job-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/job-details?job_id=test-job-id'),
        expect.any(Object)
      );
    });
  });

  describe('getQuotaStatus', () => {
    it('returns quota from storage', async () => {
      const client = new JSearchClient('test-key');
      const quota = await client.getQuotaStatus();

      expect(quota.weeklyRemaining).toBe(45);
      expect(quota.monthlyRemaining).toBe(180);
    });
  });
});

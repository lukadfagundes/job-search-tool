import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StorageData, JobResult } from '../api/types.js';

// Mock node:fs/promises, node:os, and node:path before importing storage
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();

vi.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}));

vi.mock('node:os', () => ({
  homedir: () => '/mock-home',
}));

const emptyStorage: StorageData = {
  savedJobs: [],
  profiles: [],
  seenJobIds: [],
  rateLimitLog: [],
};

function makeJob(id: string): JobResult {
  return {
    job_id: id,
    job_title: 'Test Job',
    employer_name: 'Test Corp',
    employer_logo: null,
    employer_website: null,
    employer_company_type: null,
    employer_linkedin: null,
    job_publisher: 'Test',
    job_employment_type: 'FULLTIME',
    job_apply_link: 'https://example.com',
    job_apply_is_direct: false,
    job_apply_quality_score: null,
    job_description: 'Test description',
    job_is_remote: false,
    job_city: 'Test City',
    job_state: 'TS',
    job_country: 'US',
    job_latitude: null,
    job_longitude: null,
    job_posted_at_timestamp: null,
    job_posted_at_datetime_utc: '2026-02-28T00:00:00.000Z',
    job_offer_expiration_datetime_utc: null,
    job_offer_expiration_timestamp: null,
    job_min_salary: null,
    job_max_salary: null,
    job_salary_currency: null,
    job_salary_period: null,
    job_benefits: null,
    job_google_link: null,
    job_required_experience: {
      no_experience_required: false,
      required_experience_in_months: null,
      experience_mentioned: false,
      experience_preferred: false,
    },
    job_required_skills: null,
    job_required_education: {
      postgraduate_degree: false,
      professional_certification: false,
      high_school: false,
      associates_degree: false,
      bachelors_degree: false,
      degree_mentioned: false,
      degree_preferred: false,
      professional_certification_mentioned: false,
    },
    job_experience_in_place_of_education: null,
    job_highlights: null,
    job_posting_language: null,
    job_onet_soc: null,
    job_onet_job_zone: null,
    job_occupational_categories: null,
    job_naics_code: null,
    job_naics_name: null,
    apply_options: [],
  };
}

describe('Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  describe('saveJob', () => {
    it('saves a new job', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { saveJob } = await import('../storage/index.js');
      await saveJob(makeJob('job-1'));

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.savedJobs).toHaveLength(1);
      expect(written.savedJobs[0].job.job_id).toBe('job-1');
    });

    it('does not duplicate existing job', async () => {
      const existing: StorageData = {
        ...emptyStorage,
        savedJobs: [{ job: makeJob('job-1'), savedAt: '2026-01-01T00:00:00.000Z' }],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(existing));
      const { saveJob } = await import('../storage/index.js');
      await saveJob(makeJob('job-1'));

      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('getSavedJobs', () => {
    it('returns saved jobs', async () => {
      const data: StorageData = {
        ...emptyStorage,
        savedJobs: [
          { job: makeJob('job-1'), savedAt: '2026-01-01T00:00:00.000Z' },
          { job: makeJob('job-2'), savedAt: '2026-01-02T00:00:00.000Z' },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { getSavedJobs } = await import('../storage/index.js');
      const result = await getSavedJobs();

      expect(result).toHaveLength(2);
    });

    it('returns empty array when no storage file exists', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const { getSavedJobs } = await import('../storage/index.js');
      const result = await getSavedJobs();

      expect(result).toEqual([]);
    });
  });

  describe('removeSavedJob', () => {
    it('removes an existing job', async () => {
      const data: StorageData = {
        ...emptyStorage,
        savedJobs: [{ job: makeJob('job-1'), savedAt: '2026-01-01T00:00:00.000Z' }],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { removeSavedJob } = await import('../storage/index.js');
      const result = await removeSavedJob('job-1');

      expect(result).toBe(true);
      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.savedJobs).toHaveLength(0);
    });

    it('returns false when job not found', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { removeSavedJob } = await import('../storage/index.js');
      const result = await removeSavedJob('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('Profiles', () => {
    it('saves a profile', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { saveProfile } = await import('../storage/index.js');
      await saveProfile('my-search', { query: 'react developer' });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.profiles).toHaveLength(1);
      expect(written.profiles[0].name).toBe('my-search');
    });

    it('overwrites existing profile with same name', async () => {
      const data: StorageData = {
        ...emptyStorage,
        profiles: [
          { name: 'my-search', params: { query: 'old' }, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { saveProfile } = await import('../storage/index.js');
      await saveProfile('my-search', { query: 'new' });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.profiles).toHaveLength(1);
      expect(written.profiles[0].params.query).toBe('new');
    });

    it('gets profiles', async () => {
      const data: StorageData = {
        ...emptyStorage,
        profiles: [
          { name: 'search-1', params: { query: 'react' }, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { getProfiles } = await import('../storage/index.js');
      const result = await getProfiles();

      expect(result).toHaveLength(1);
    });

    it('gets a specific profile by name', async () => {
      const data: StorageData = {
        ...emptyStorage,
        profiles: [
          { name: 'search-1', params: { query: 'react' }, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { getProfile } = await import('../storage/index.js');
      const result = await getProfile('search-1');

      expect(result?.name).toBe('search-1');
    });

    it('returns undefined for nonexistent profile', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { getProfile } = await import('../storage/index.js');
      const result = await getProfile('nonexistent');

      expect(result).toBeUndefined();
    });

    it('removes a profile', async () => {
      const data: StorageData = {
        ...emptyStorage,
        profiles: [
          { name: 'search-1', params: { query: 'react' }, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { removeProfile } = await import('../storage/index.js');
      const result = await removeProfile('search-1');

      expect(result).toBe(true);
    });
  });

  describe('Seen Jobs', () => {
    it('marks jobs as seen', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { markJobsSeen } = await import('../storage/index.js');
      await markJobsSeen(['id-1', 'id-2']);

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.seenJobIds).toContain('id-1');
      expect(written.seenJobIds).toContain('id-2');
    });

    it('returns seen job IDs as a Set', async () => {
      const data: StorageData = {
        ...emptyStorage,
        seenJobIds: ['id-1', 'id-2'],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { getSeenJobIds } = await import('../storage/index.js');
      const result = await getSeenJobIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.has('id-1')).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('records an API request', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { recordApiRequest } = await import('../storage/index.js');
      await recordApiRequest();

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      expect(written.rateLimitLog).toHaveLength(1);
    });

    it('returns quota status with zero usage', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { getQuotaStatus } = await import('../storage/index.js');
      const quota = await getQuotaStatus();

      expect(quota.weeklyUsed).toBe(0);
      expect(quota.weeklyLimit).toBe(50);
      expect(quota.weeklyRemaining).toBe(50);
      expect(quota.monthlyUsed).toBe(0);
      expect(quota.monthlyLimit).toBe(200);
      expect(quota.monthlyRemaining).toBe(200);
    });

    it('counts recent requests in quota', async () => {
      const now = new Date().toISOString();
      const data: StorageData = {
        ...emptyStorage,
        rateLimitLog: [now, now, now],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { getQuotaStatus } = await import('../storage/index.js');
      const quota = await getQuotaStatus();

      expect(quota.weeklyUsed).toBe(3);
      expect(quota.weeklyRemaining).toBe(47);
      expect(quota.monthlyUsed).toBe(3);
      expect(quota.monthlyRemaining).toBe(197);
    });

    it('throws RateLimitError when weekly limit reached', async () => {
      const now = new Date().toISOString();
      const data: StorageData = {
        ...emptyStorage,
        rateLimitLog: Array(50).fill(now),
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { checkRateLimit } = await import('../storage/index.js');

      await expect(checkRateLimit()).rejects.toThrow('Weekly rate limit reached');
    });

    it('throws RateLimitError when monthly limit reached', async () => {
      const now = new Date().toISOString();
      const data: StorageData = {
        ...emptyStorage,
        rateLimitLog: Array(200).fill(now),
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { checkRateLimit } = await import('../storage/index.js');

      await expect(checkRateLimit()).rejects.toThrow('rate limit reached');
    });

    it('passes when under limits', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(emptyStorage));
      const { checkRateLimit } = await import('../storage/index.js');

      await expect(checkRateLimit()).resolves.toBeUndefined();
    });

    it('prunes entries older than 30 days', async () => {
      const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      const recent = new Date().toISOString();
      const data: StorageData = {
        ...emptyStorage,
        rateLimitLog: [old, old, recent],
      };
      mockReadFile.mockResolvedValue(JSON.stringify(data));
      const { recordApiRequest } = await import('../storage/index.js');
      await recordApiRequest();

      const written = JSON.parse(mockWriteFile.mock.calls[0][1]);
      // Old entries should be pruned, only recent + new entry remain
      expect(written.rateLimitLog.length).toBeLessThanOrEqual(2);
    });
  });
});

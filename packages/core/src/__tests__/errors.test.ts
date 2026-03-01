import { describe, it, expect } from 'vitest';
import { RateLimitError } from '../api/errors.js';
import type { QuotaStatus } from '../api/types.js';

function makeQuota(overrides: Partial<QuotaStatus> = {}): QuotaStatus {
  return {
    weeklyUsed: 50,
    weeklyLimit: 50,
    weeklyRemaining: 0,
    monthlyUsed: 100,
    monthlyLimit: 200,
    monthlyRemaining: 100,
    weeklyResetsAt: '2026-03-07T00:00:00.000Z',
    monthlyResetsAt: '2026-03-30T00:00:00.000Z',
    ...overrides,
  };
}

describe('RateLimitError', () => {
  it('creates weekly rate limit error with correct message', () => {
    const quota = makeQuota();
    const error = new RateLimitError('weekly', quota);

    expect(error.name).toBe('RateLimitError');
    expect(error.type).toBe('weekly');
    expect(error.quota).toBe(quota);
    expect(error.message).toContain('Weekly');
    expect(error.message).toContain('50/50');
    expect(error.message).toContain('Resets at');
  });

  it('creates monthly rate limit error with correct message', () => {
    const quota = makeQuota({
      monthlyUsed: 200,
      monthlyRemaining: 0,
    });
    const error = new RateLimitError('monthly', quota);

    expect(error.name).toBe('RateLimitError');
    expect(error.type).toBe('monthly');
    expect(error.message).toContain('Monthly');
    expect(error.message).toContain('200/200');
  });

  it('is an instance of Error', () => {
    const error = new RateLimitError('weekly', makeQuota());
    expect(error).toBeInstanceOf(Error);
  });

  it('handles null reset time gracefully', () => {
    const quota = makeQuota({ weeklyResetsAt: null });
    const error = new RateLimitError('weekly', quota);

    expect(error.message).not.toContain('Resets at');
  });
});

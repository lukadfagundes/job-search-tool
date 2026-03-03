import type { QuotaStatus } from './types.js';

export class RateLimitError extends Error {
  public readonly type: 'weekly' | 'monthly';
  public readonly quota: QuotaStatus;

  constructor(type: 'weekly' | 'monthly', quota: QuotaStatus) {
    const limit = type === 'weekly' ? quota.weeklyLimit : quota.monthlyLimit;
    const resetsAt = type === 'weekly' ? quota.weeklyResetsAt : quota.monthlyResetsAt;
    super(
      `${type.charAt(0).toUpperCase() + type.slice(1)} rate limit reached ` +
        `(${limit}/${limit} used). ` +
        (resetsAt ? `Resets at ${resetsAt}.` : '')
    );
    this.name = 'RateLimitError';
    this.type = type;
    this.quota = quota;
  }
}

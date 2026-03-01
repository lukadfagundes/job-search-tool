import type { SearchParams, SearchResponse, JobDetailsResponse } from './types.js';

const BASE_URL = 'https://jsearch.p.rapidapi.com';
const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export class JSearchClient {
  private apiKey: string;
  private remainingRequests: number | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('RapidAPI key is required. Set RAPIDAPI_KEY environment variable.');
    }
    this.apiKey = apiKey;
  }

  getRemainingRequests(): number | null {
    return this.remainingRequests;
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const query = new URLSearchParams();
    query.set('query', params.query);
    if (params.page) query.set('page', String(params.page));
    if (params.num_pages) query.set('num_pages', String(params.num_pages));
    if (params.date_posted) query.set('date_posted', params.date_posted);
    if (params.remote_jobs_only) query.set('remote_jobs_only', String(params.remote_jobs_only));
    if (params.employment_types) query.set('employment_types', params.employment_types);
    if (params.job_requirements) query.set('job_requirements', params.job_requirements);
    if (params.radius) query.set('radius', String(params.radius));
    if (params.exclude_job_publishers)
      query.set('exclude_job_publishers', params.exclude_job_publishers);
    if (params.categories) query.set('categories', params.categories);

    return this.request<SearchResponse>(`/search?${query.toString()}`);
  }

  async getJobDetails(jobId: string): Promise<JobDetailsResponse> {
    const query = new URLSearchParams({ job_id: jobId });
    return this.request<JobDetailsResponse>(`/job-details?${query.toString()}`);
  }

  private async request<T>(path: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${BASE_URL}${path}`, {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          },
        });

        // Track remaining quota
        const remaining = response.headers.get('x-ratelimit-requests-remaining');
        if (remaining !== null) {
          this.remainingRequests = parseInt(remaining, 10);
        }

        if (response.status === 429) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await this.sleep(backoff);
          continue;
        }

        if (!response.ok) {
          throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES - 1) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await this.sleep(backoff);
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

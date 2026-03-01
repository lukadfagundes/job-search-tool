import { useState, useCallback } from 'react';
import type { JobResult, SearchParams, SearchResponse, PostFilterOptions } from '@job-hunt/core';
import { applyPostFilters, deduplicateJobs } from '@job-hunt/core';

interface UseJobSearchResult {
  jobs: JobResult[];
  loading: boolean;
  error: string | null;
  remainingRequests: number | null;
  weeklyRemaining: number | null;
  monthlyRemaining: number | null;
  search: (params: SearchParams, filters?: PostFilterOptions) => Promise<void>;
}

export function useJobSearch(): UseJobSearchResult {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [weeklyRemaining, setWeeklyRemaining] = useState<number | null>(null);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number | null>(null);

  const search = useCallback(async (params: SearchParams, filters?: PostFilterOptions) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.set('query', params.query);
      if (params.page) query.set('page', String(params.page));
      if (params.num_pages) query.set('num_pages', String(params.num_pages));
      if (params.date_posted) query.set('date_posted', params.date_posted);
      if (params.remote_jobs_only) query.set('remote_jobs_only', String(params.remote_jobs_only));
      if (params.employment_types) query.set('employment_types', params.employment_types);
      if (params.job_requirements) query.set('job_requirements', params.job_requirements);

      const response = await fetch(`/api/search?${query.toString()}`);

      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining) {
        setRemainingRequests(parseInt(remaining, 10));
      }

      const weekly = response.headers.get('X-Local-Weekly-Remaining');
      if (weekly) {
        setWeeklyRemaining(parseInt(weekly, 10));
      }
      const monthly = response.headers.get('X-Local-Monthly-Remaining');
      if (monthly) {
        setMonthlyRemaining(parseInt(monthly, 10));
      }

      if (response.status === 429) {
        const body = await response.json();
        throw new Error(body.error ?? 'Rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      let results = data.data ?? [];

      results = deduplicateJobs(results);

      if (filters) {
        results = applyPostFilters(results, filters);
      }

      setJobs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { jobs, loading, error, remainingRequests, weeklyRemaining, monthlyRemaining, search };
}

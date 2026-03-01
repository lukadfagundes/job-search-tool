import { useState, useCallback } from 'react';
import type { JobResult, SearchParams, PostFilterOptions } from '@job-hunt/core/browser';

interface UseJobSearchResult {
  jobs: JobResult[];
  loading: boolean;
  error: string | null;
  weeklyRemaining: number | null;
  monthlyRemaining: number | null;
  search: (params: SearchParams, filters?: PostFilterOptions) => Promise<void>;
}

export function useJobSearch(): UseJobSearchResult {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyRemaining, setWeeklyRemaining] = useState<number | null>(null);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number | null>(null);

  const search = useCallback(async (params: SearchParams, filters?: PostFilterOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.searchJobs(params, filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      setJobs(result.data);
      setWeeklyRemaining(result.quota.weeklyRemaining);
      setMonthlyRemaining(result.quota.monthlyRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { jobs, loading, error, weeklyRemaining, monthlyRemaining, search };
}

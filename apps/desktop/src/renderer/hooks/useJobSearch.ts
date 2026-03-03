import { useState, useCallback, useRef } from 'react';
import type { JobResult, SearchParams, PostFilterOptions } from '@job-hunt/core/browser';

const RESULTS_PER_PAGE = 25;
const NUM_PAGES_PER_REQUEST = 3; // ~10 results per internal page × 3 ≈ 30 results

interface UseJobSearchResult {
  jobs: JobResult[];
  loading: boolean;
  error: string | null;
  weeklyRemaining: number | null;
  monthlyRemaining: number | null;
  currentPage: number;
  hasMore: boolean;
  search: (params: SearchParams, filters?: PostFilterOptions) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

export function useJobSearch(): UseJobSearchResult {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyRemaining, setWeeklyRemaining] = useState<number | null>(null);
  const [monthlyRemaining, setMonthlyRemaining] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const lastSearchRef = useRef<{ params: SearchParams; filters?: PostFilterOptions } | null>(null);

  const fetchPage = useCallback(
    async (params: SearchParams, filters: PostFilterOptions | undefined, page: number) => {
      setLoading(true);
      setError(null);

      try {
        const apiPage = (page - 1) * NUM_PAGES_PER_REQUEST + 1;
        const paginatedParams: SearchParams = {
          ...params,
          page: apiPage,
          num_pages: NUM_PAGES_PER_REQUEST,
        };

        const result = await window.electronAPI.searchJobs(paginatedParams, filters);

        if (!result.success) {
          throw new Error(result.error);
        }

        const allResults = result.data;
        setHasMore(allResults.length > RESULTS_PER_PAGE);
        setJobs(allResults.slice(0, RESULTS_PER_PAGE));
        setCurrentPage(page);
        setWeeklyRemaining(result.quota.weeklyRemaining);
        setMonthlyRemaining(result.quota.monthlyRemaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const search = useCallback(
    async (params: SearchParams, filters?: PostFilterOptions) => {
      lastSearchRef.current = { params, filters };
      await fetchPage(params, filters, 1);
    },
    [fetchPage]
  );

  const goToPage = useCallback(
    async (page: number) => {
      if (!lastSearchRef.current) return;
      const { params, filters } = lastSearchRef.current;
      await fetchPage(params, filters, page);
    },
    [fetchPage]
  );

  return {
    jobs,
    loading,
    error,
    weeklyRemaining,
    monthlyRemaining,
    currentPage,
    hasMore,
    search,
    goToPage,
  };
}

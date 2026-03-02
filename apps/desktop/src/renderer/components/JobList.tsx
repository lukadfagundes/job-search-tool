import type { JobResult } from '@job-hunt/core/browser';
import { JobCard } from './JobCard.tsx';

interface JobListProps {
  jobs: JobResult[];
  loading: boolean;
  error: string | null;
  onSelectJob: (job: JobResult) => void;
  onBookmark: (job: JobResult) => void;
  bookmarkedIds: Set<string>;
  currentPage?: number;
  hasMore?: boolean;
  onPageChange?: (page: number) => void;
}

export function JobList({
  jobs,
  loading,
  error,
  onSelectJob,
  onBookmark,
  bookmarkedIds,
  currentPage = 1,
  hasMore = false,
  onPageChange,
}: JobListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Searching jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        <p className="font-medium">Search failed</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Enter a search query above to find jobs</p>
      </div>
    );
  }

  const showPagination = onPageChange && (currentPage > 1 || hasMore);

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {jobs.length} result{jobs.length !== 1 ? 's' : ''} found
      </p>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={job.job_id}
            job={job}
            onSelect={onSelectJob}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedIds.has(job.job_id)}
          />
        ))}
      </div>
      {showPagination && (
        <div className="flex items-center justify-center gap-4 mt-6 py-4">
          <button
            onClick={() => {
              onPageChange(currentPage - 1);
              window.scrollTo(0, 0);
            }}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage}</span>
          <button
            onClick={() => {
              onPageChange(currentPage + 1);
              window.scrollTo(0, 0);
            }}
            disabled={!hasMore}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

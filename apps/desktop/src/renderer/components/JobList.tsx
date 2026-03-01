import type { JobResult } from '@job-hunt/core/browser';
import { JobCard } from './JobCard.tsx';

interface JobListProps {
  jobs: JobResult[];
  loading: boolean;
  error: string | null;
  onSelectJob: (job: JobResult) => void;
  onBookmark: (job: JobResult) => void;
  bookmarkedIds: Set<string>;
}

export function JobList({
  jobs,
  loading,
  error,
  onSelectJob,
  onBookmark,
  bookmarkedIds,
}: JobListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Searching jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Search failed</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Enter a search query above to find jobs</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
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
    </div>
  );
}

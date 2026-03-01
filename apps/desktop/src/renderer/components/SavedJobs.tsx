import type { JobResult } from '@job-hunt/core/browser';
import { JobCard } from './JobCard.tsx';

interface SavedJobEntry {
  job: JobResult;
  savedAt: string;
  notes?: string;
}

interface SavedJobsProps {
  savedJobs: SavedJobEntry[];
  onSelectJob: (job: JobResult) => void;
  onRemoveBookmark: (job: JobResult) => void;
}

export function SavedJobs({ savedJobs, onSelectJob, onRemoveBookmark }: SavedJobsProps) {
  if (savedJobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">★</p>
        <p className="text-lg font-medium">No saved jobs yet</p>
        <p className="text-sm mt-1">Bookmark jobs from search results to save them here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Saved Jobs ({savedJobs.length})</h2>
      </div>
      <div className="space-y-3">
        {savedJobs.map((saved) => (
          <JobCard
            key={saved.job.job_id}
            job={saved.job}
            onSelect={onSelectJob}
            onBookmark={onRemoveBookmark}
            isBookmarked={true}
          />
        ))}
      </div>
    </div>
  );
}

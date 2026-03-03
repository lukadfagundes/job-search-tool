import type { JobResult } from '@job-hunt/core/browser';

interface JobCardProps {
  job: JobResult;
  onSelect: (job: JobResult) => void;
  onBookmark: (job: JobResult) => void;
  isBookmarked: boolean;
}

function formatSalary(job: JobResult): string | null {
  if (job.job_min_salary == null && job.job_max_salary == null) return null;
  const currency = job.job_salary_currency ?? 'USD';
  const period = job.job_salary_period ?? 'YEAR';
  const min = job.job_min_salary?.toLocaleString() ?? '?';
  const max = job.job_max_salary?.toLocaleString() ?? '?';
  const periodLabel = period === 'YEAR' ? '/yr' : `/${period.toLowerCase()}`;
  return `${currency} ${min} - ${max}${periodLabel}`;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function JobCard({ job, onSelect, onBookmark, isBookmarked }: JobCardProps) {
  const salary = formatSalary(job);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(job)}
      data-testid={`job-card-${job.job_id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {job.employer_logo ? (
            <img
              src={job.employer_logo}
              alt={job.employer_name}
              className="w-12 h-12 rounded-lg object-contain border border-gray-100 dark:border-gray-600 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg font-bold flex-shrink-0">
              {job.employer_name.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400">
              {job.job_title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{job.employer_name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {job.job_city
                  ? `${job.job_city}, ${job.job_state}`
                  : job.job_country || 'Location N/A'}
              </span>
              {job.job_is_remote && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                  Remote
                </span>
              )}
              {salary && (
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {salary}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {timeAgo(job.job_posted_at_datetime_utc)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                via {job.job_publisher}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(job);
            }}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this job'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>

          <a
            href={job.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Apply →
          </a>
        </div>
      </div>
    </div>
  );
}

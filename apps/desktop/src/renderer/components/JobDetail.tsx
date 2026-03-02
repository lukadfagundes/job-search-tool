import type { JobResult } from '@job-hunt/core/browser';

interface JobDetailProps {
  job: JobResult;
  onClose: () => void;
  onBookmark: (job: JobResult) => void;
  isBookmarked: boolean;
}

export function JobDetail({ job, onClose, onBookmark, isBookmarked }: JobDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {job.employer_logo ? (
              <img
                src={job.employer_logo}
                alt={job.employer_name}
                className="w-14 h-14 rounded-lg object-contain border border-gray-100 dark:border-gray-600"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xl font-bold">
                {job.employer_name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{job.job_title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{job.employer_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {job.job_city
                    ? `${job.job_city}, ${job.job_state}, ${job.job_country}`
                    : job.job_country}
                </span>
                {job.job_is_remote && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Remote
                  </span>
                )}
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {job.job_employment_type}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Salary */}
          {(job.job_min_salary || job.job_max_salary) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Salary
              </h3>
              <p className="text-lg font-medium text-green-700 dark:text-green-400">
                {job.job_salary_currency ?? 'USD'} {job.job_min_salary?.toLocaleString() ?? '?'} -{' '}
                {job.job_max_salary?.toLocaleString() ?? '?'} /{' '}
                {job.job_salary_period?.toLowerCase() ?? 'year'}
              </p>
            </div>
          )}

          {/* Skills */}
          {job.job_required_skills && job.job_required_skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.job_required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {job.job_required_experience?.experience_mentioned && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {job.job_required_experience.no_experience_required
                  ? 'No experience required'
                  : job.job_required_experience.required_experience_in_months
                    ? `${Math.round(job.job_required_experience.required_experience_in_months / 12)} years`
                    : 'Experience required'}
              </p>
            </div>
          )}

          {/* Benefits */}
          {job.job_benefits && job.job_benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Benefits
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.job_benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm px-3 py-1 rounded-full"
                  >
                    {benefit.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Job Description
            </h3>
            <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {job.job_description}
            </div>
          </div>

          {/* Apply Options */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Apply Options
            </h3>
            <div className="space-y-2">
              {job.apply_options?.map((option, i) => (
                <a
                  key={i}
                  href={option.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    option.is_direct
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {option.publisher}
                    {option.is_direct && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (Direct)
                      </span>
                    )}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">Apply →</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={() => onBookmark(job)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isBookmarked
                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
          </button>

          <a
            href={job.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Now →
          </a>
        </div>
      </div>
    </div>
  );
}

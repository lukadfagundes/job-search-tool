import { useState, useCallback } from 'react';
import type { JobResult } from '@job-hunt/core/browser';
import type { ResumeData } from '../../shared/resume-types.ts';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
}

function getEducationLevel(edu: JobResult['job_required_education'] | undefined): string | null {
  if (!edu) return null;
  if (edu.postgraduate_degree) return 'Postgraduate degree';
  if (edu.bachelors_degree) return "Bachelor's degree";
  if (edu.associates_degree) return "Associate's degree";
  if (edu.high_school) return 'High school diploma';
  if (edu.professional_certification) return 'Professional certification';
  if (edu.degree_mentioned && !edu.degree_preferred) return 'Degree required';
  if (edu.degree_preferred) return 'Degree preferred';
  return null;
}

function buildJobSummary(job: JobResult) {
  return {
    title: job.job_title,
    company: job.employer_name,
    description: job.job_description,
    requiredSkills: job.job_required_skills ?? null,
    employmentType: job.job_employment_type,
    isRemote: job.job_is_remote,
    location: job.job_city
      ? `${job.job_city}, ${job.job_state}, ${job.job_country}`
      : job.job_country,
    highlights: job.job_highlights ?? null,
  };
}

interface JobDetailProps {
  job: JobResult;
  onClose: () => void;
  onBookmark: (job: JobResult) => void;
  isBookmarked: boolean;
  resumeData: ResumeData | null;
}

type GeneratingState = 'resume-pdf' | 'cv-pdf' | 'resume-docx' | 'cv-docx' | null;

const apiMap = {
  'resume-pdf': 'generateResume',
  'cv-pdf': 'generateCV',
  'resume-docx': 'generateResumeDocx',
  'cv-docx': 'generateCVDocx',
} as const;

export function JobDetail({ job, onClose, onBookmark, isBookmarked, resumeData }: JobDetailProps) {
  const educationLevel = getEducationLevel(job.job_required_education);
  const [generating, setGenerating] = useState<GeneratingState>(null);
  const [docMessage, setDocMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleGenerate = useCallback(
    async (type: GeneratingState & string) => {
      if (!resumeData) return;
      setDocMessage(null);
      setGenerating(type as GeneratingState);
      try {
        const jobSummary = buildJobSummary(job);
        const apiFn = apiMap[type as keyof typeof apiMap];
        const result = await window.electronAPI[apiFn](
          jobSummary as unknown as Record<string, unknown>,
          resumeData as unknown as Record<string, unknown>
        );
        if (result.success) {
          const filename = result.filePath?.split(/[/\\]/).pop() ?? 'document';
          setDocMessage({ type: 'success', text: `Downloaded: ${filename}` });
        } else if (result.geminiKeyMissing) {
          setDocMessage({
            type: 'error',
            text: 'Gemini API key not configured. Go to Settings to add your key.',
          });
        } else {
          setDocMessage({ type: 'error', text: result.error ?? 'Generation failed.' });
        }
      } catch {
        setDocMessage({ type: 'error', text: 'Failed to generate document. Please try again.' });
      } finally {
        setGenerating(null);
      }
    },
    [job, resumeData]
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[80vw] h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
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
              <p className="text-gray-600 dark:text-gray-400">
                {job.employer_name}
                {job.employer_company_type && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {' '}
                    &middot; {job.employer_company_type}
                  </span>
                )}
              </p>
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
                {job.job_posted_at_datetime_utc && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Posted {formatTimeAgo(job.job_posted_at_datetime_utc)}
                  </span>
                )}
                {job.job_posting_language && job.job_posting_language !== 'en' && (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full uppercase">
                    {job.job_posting_language}
                  </span>
                )}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Expiration Notice */}
          {job.job_offer_expiration_datetime_utc && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                new Date(job.job_offer_expiration_datetime_utc) < new Date()
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              }`}
              data-testid="expiration-notice"
            >
              {new Date(job.job_offer_expiration_datetime_utc) < new Date()
                ? `This listing expired on ${new Date(job.job_offer_expiration_datetime_utc).toLocaleDateString()}`
                : `Expires ${new Date(job.job_offer_expiration_datetime_utc).toLocaleDateString()}`}
            </div>
          )}

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

          {/* Experience & Education */}
          {(job.job_required_experience?.experience_mentioned || educationLevel) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Requirements
              </h3>
              <div className="space-y-1">
                {job.job_required_experience?.experience_mentioned && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {job.job_required_experience.no_experience_required
                      ? 'No experience required'
                      : job.job_required_experience.required_experience_in_months
                        ? `${Math.round(job.job_required_experience.required_experience_in_months / 12)} years experience`
                        : 'Experience required'}
                    {job.job_experience_in_place_of_education && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {' '}
                        (accepted in place of education)
                      </span>
                    )}
                  </p>
                )}
                {educationLevel && (
                  <p className="text-gray-600 dark:text-gray-400">{educationLevel}</p>
                )}
              </div>
            </div>
          )}

          {/* Job Categories */}
          {job.job_occupational_categories && job.job_occupational_categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.job_occupational_categories.map((cat) => (
                  <span
                    key={cat}
                    className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm px-3 py-1 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
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

          {/* Highlights */}
          {job.job_highlights &&
            Object.entries(job.job_highlights).map(([section, items]) =>
              items.length > 0 ? (
                <div key={section}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    {section}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null
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

          {/* Contact & Links */}
          {(job.employer_website || job.employer_linkedin || job.job_google_link) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Contact & Links
              </h3>
              <div className="space-y-2">
                {job.employer_website && (
                  <a
                    href={job.employer_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>🌐</span> {job.employer_website}
                  </a>
                )}
                {job.employer_linkedin && (
                  <a
                    href={job.employer_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>💼</span> LinkedIn Profile
                  </a>
                )}
                {job.job_google_link && (
                  <a
                    href={job.job_google_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>🔍</span> View on Google Jobs
                  </a>
                )}
              </div>
            </div>
          )}

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
        <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          {docMessage && (
            <div
              data-testid="doc-message"
              className={`text-sm px-3 py-2 rounded-lg ${
                docMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {docMessage.text}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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

              <button
                data-testid="generate-resume-btn"
                onClick={() => handleGenerate('resume-pdf')}
                disabled={!resumeData || generating !== null}
                title={
                  !resumeData
                    ? 'Save your r\u00e9sum\u00e9 in R\u00e9sum\u00e9 Builder first'
                    : 'Generate tailored r\u00e9sum\u00e9 as PDF'
                }
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === 'resume-pdf' ? 'Generating...' : 'PDF R\u00e9sum\u00e9'}
              </button>

              <button
                data-testid="generate-cv-btn"
                onClick={() => handleGenerate('cv-pdf')}
                disabled={!resumeData || generating !== null}
                title={
                  !resumeData
                    ? 'Save your r\u00e9sum\u00e9 in R\u00e9sum\u00e9 Builder first'
                    : 'Generate tailored CV as PDF'
                }
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === 'cv-pdf' ? 'Generating...' : 'PDF CV'}
              </button>

              <button
                data-testid="generate-resume-docx-btn"
                onClick={() => handleGenerate('resume-docx')}
                disabled={!resumeData || generating !== null}
                title={
                  !resumeData
                    ? 'Save your r\u00e9sum\u00e9 in R\u00e9sum\u00e9 Builder first'
                    : 'Generate tailored r\u00e9sum\u00e9 as DOCX'
                }
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === 'resume-docx' ? 'Generating...' : 'DOCX R\u00e9sum\u00e9'}
              </button>

              <button
                data-testid="generate-cv-docx-btn"
                onClick={() => handleGenerate('cv-docx')}
                disabled={!resumeData || generating !== null}
                title={
                  !resumeData
                    ? 'Save your r\u00e9sum\u00e9 in R\u00e9sum\u00e9 Builder first'
                    : 'Generate tailored CV as DOCX'
                }
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating === 'cv-docx' ? 'Generating...' : 'DOCX CV'}
              </button>
            </div>

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

        {/* Generating Modal */}
        {generating && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            data-testid="generating-modal"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
              <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {generating?.includes('resume')
                  ? 'Generating R\u00e9sum\u00e9...'
                  : 'Generating CV...'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Tailoring your document with AI. This may take a few seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

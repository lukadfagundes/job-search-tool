import type { JobResult, PostFilterOptions } from '../api/types.js';

export function applyPostFilters(jobs: JobResult[], options: PostFilterOptions): JobResult[] {
  let filtered = jobs;

  if (options.minSalary != null || options.maxSalary != null) {
    filtered = filterBySalaryRange(filtered, options.minSalary, options.maxSalary);
  }

  if (options.includeKeywords?.length) {
    filtered = filterByKeywords(filtered, options.includeKeywords, 'include');
  }

  if (options.excludeKeywords?.length) {
    filtered = filterByKeywords(filtered, options.excludeKeywords, 'exclude');
  }

  if (options.excludeCompanies?.length) {
    filtered = filterByCompany(filtered, options.excludeCompanies);
  }

  if (options.directApplyOnly) {
    filtered = filterByDirectApply(filtered);
  }

  return filtered;
}

export function filterBySalaryRange(jobs: JobResult[], min?: number, max?: number): JobResult[] {
  return jobs.filter((job) => {
    // If job has no salary data, include it (don't penalize missing data)
    if (job.job_min_salary == null && job.job_max_salary == null) return true;

    const jobMin = job.job_min_salary ?? 0;
    const jobMax = job.job_max_salary ?? Infinity;

    if (min != null && jobMax < min) return false;
    if (max != null && jobMin > max) return false;
    return true;
  });
}

export function filterByKeywords(
  jobs: JobResult[],
  keywords: string[],
  mode: 'include' | 'exclude'
): JobResult[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  return jobs.filter((job) => {
    const description = job.job_description.toLowerCase();
    const title = job.job_title.toLowerCase();
    const text = `${title} ${description}`;

    if (mode === 'include') {
      return lowerKeywords.some((kw) => text.includes(kw));
    } else {
      return !lowerKeywords.some((kw) => text.includes(kw));
    }
  });
}

export function filterByCompany(jobs: JobResult[], excludeCompanies: string[]): JobResult[] {
  const lowerExclude = excludeCompanies.map((c) => c.toLowerCase());
  return jobs.filter((job) => !lowerExclude.includes(job.employer_name.toLowerCase()));
}

export function filterByDirectApply(jobs: JobResult[]): JobResult[] {
  return jobs.filter((job) => job.job_apply_is_direct);
}

export function deduplicateJobs(jobs: JobResult[]): JobResult[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.job_title.toLowerCase()}|${job.employer_name.toLowerCase()}|${job.job_city?.toLowerCase() ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

import { describe, it, expect } from 'vitest';
import {
  applyPostFilters,
  filterBySalaryRange,
  filterByKeywords,
  filterByCompany,
  filterByDirectApply,
  deduplicateJobs,
} from '../filters/index.js';
import type { JobResult } from '../api/types.js';

function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    job_id: 'test-1',
    job_title: 'Software Engineer',
    employer_name: 'Acme Corp',
    employer_logo: null,
    employer_website: null,
    job_publisher: 'LinkedIn',
    job_employment_type: 'FULLTIME',
    job_apply_link: 'https://example.com/apply',
    job_apply_is_direct: false,
    job_description: 'Build great software with React and TypeScript.',
    job_is_remote: false,
    job_city: 'San Francisco',
    job_state: 'CA',
    job_country: 'US',
    job_posted_at_datetime_utc: '2026-02-28T00:00:00.000Z',
    job_min_salary: null,
    job_max_salary: null,
    job_salary_currency: null,
    job_salary_period: null,
    job_benefits: null,
    job_required_experience: {
      no_experience_required: false,
      required_experience_in_months: null,
      experience_mentioned: false,
      experience_preferred: false,
    },
    job_required_skills: null,
    job_required_education: {
      postgraduate_degree: false,
      professional_certification: false,
      high_school: false,
      associates_degree: false,
      bachelors_degree: false,
      degree_mentioned: false,
      degree_preferred: false,
      professional_certification_mentioned: false,
    },
    apply_options: [],
    ...overrides,
  };
}

describe('filterBySalaryRange', () => {
  const jobs = [
    makeJob({ job_id: '1', job_min_salary: 80000, job_max_salary: 120000 }),
    makeJob({ job_id: '2', job_min_salary: 50000, job_max_salary: 70000 }),
    makeJob({ job_id: '3', job_min_salary: null, job_max_salary: null }),
    makeJob({ job_id: '4', job_min_salary: 150000, job_max_salary: 200000 }),
  ];

  it('returns all jobs when no salary filter provided', () => {
    expect(filterBySalaryRange(jobs)).toHaveLength(4);
  });

  it('filters by minimum salary', () => {
    const result = filterBySalaryRange(jobs, 100000);
    expect(result.map((j) => j.job_id)).toEqual(['1', '3', '4']);
  });

  it('filters by maximum salary', () => {
    const result = filterBySalaryRange(jobs, undefined, 100000);
    expect(result.map((j) => j.job_id)).toEqual(['1', '2', '3']);
  });

  it('filters by salary range', () => {
    const result = filterBySalaryRange(jobs, 60000, 130000);
    expect(result.map((j) => j.job_id)).toEqual(['1', '2', '3']);
  });

  it('includes jobs with no salary data', () => {
    const result = filterBySalaryRange(jobs, 200000);
    expect(result.map((j) => j.job_id)).toEqual(['3', '4']);
  });
});

describe('filterByKeywords', () => {
  const jobs = [
    makeJob({ job_id: '1', job_title: 'React Developer', job_description: 'Build UIs with React' }),
    makeJob({
      job_id: '2',
      job_title: 'Python Engineer',
      job_description: 'Build APIs with Python and Django',
    }),
    makeJob({
      job_id: '3',
      job_title: 'Full Stack Developer',
      job_description: 'Work with React and Python',
    }),
  ];

  it('includes jobs matching include keywords', () => {
    const result = filterByKeywords(jobs, ['react'], 'include');
    expect(result.map((j) => j.job_id)).toEqual(['1', '3']);
  });

  it('excludes jobs matching exclude keywords', () => {
    const result = filterByKeywords(jobs, ['python'], 'exclude');
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('is case-insensitive', () => {
    const result = filterByKeywords(jobs, ['REACT'], 'include');
    expect(result.map((j) => j.job_id)).toEqual(['1', '3']);
  });

  it('returns all jobs when no keywords match in include mode', () => {
    const result = filterByKeywords(jobs, ['rust'], 'include');
    expect(result).toHaveLength(0);
  });

  it('returns all jobs when no keywords match in exclude mode', () => {
    const result = filterByKeywords(jobs, ['rust'], 'exclude');
    expect(result).toHaveLength(3);
  });
});

describe('filterByCompany', () => {
  const jobs = [
    makeJob({ job_id: '1', employer_name: 'Acme Corp' }),
    makeJob({ job_id: '2', employer_name: 'Big Tech Inc' }),
    makeJob({ job_id: '3', employer_name: 'Startup LLC' }),
  ];

  it('excludes specified companies', () => {
    const result = filterByCompany(jobs, ['Acme Corp']);
    expect(result.map((j) => j.job_id)).toEqual(['2', '3']);
  });

  it('is case-insensitive', () => {
    const result = filterByCompany(jobs, ['acme corp', 'BIG TECH INC']);
    expect(result.map((j) => j.job_id)).toEqual(['3']);
  });

  it('returns all jobs when no companies match', () => {
    const result = filterByCompany(jobs, ['Unknown Corp']);
    expect(result).toHaveLength(3);
  });
});

describe('filterByDirectApply', () => {
  const jobs = [
    makeJob({ job_id: '1', job_apply_is_direct: true }),
    makeJob({ job_id: '2', job_apply_is_direct: false }),
    makeJob({ job_id: '3', job_apply_is_direct: true }),
  ];

  it('returns only direct apply jobs', () => {
    const result = filterByDirectApply(jobs);
    expect(result.map((j) => j.job_id)).toEqual(['1', '3']);
  });
});

describe('deduplicateJobs', () => {
  it('removes duplicate jobs by title, company, and city', () => {
    const jobs = [
      makeJob({ job_id: '1', job_title: 'Engineer', employer_name: 'Acme', job_city: 'SF' }),
      makeJob({ job_id: '2', job_title: 'Engineer', employer_name: 'Acme', job_city: 'SF' }),
      makeJob({ job_id: '3', job_title: 'Engineer', employer_name: 'Acme', job_city: 'NYC' }),
    ];
    const result = deduplicateJobs(jobs);
    expect(result.map((j) => j.job_id)).toEqual(['1', '3']);
  });

  it('is case-insensitive', () => {
    const jobs = [
      makeJob({ job_id: '1', job_title: 'Engineer', employer_name: 'Acme', job_city: 'SF' }),
      makeJob({ job_id: '2', job_title: 'ENGINEER', employer_name: 'ACME', job_city: 'sf' }),
    ];
    const result = deduplicateJobs(jobs);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateJobs([])).toEqual([]);
  });
});

describe('applyPostFilters', () => {
  const jobs = [
    makeJob({
      job_id: '1',
      job_title: 'React Dev',
      job_description: 'React work',
      employer_name: 'Good Corp',
      job_apply_is_direct: true,
      job_min_salary: 100000,
      job_max_salary: 150000,
    }),
    makeJob({
      job_id: '2',
      job_title: 'Python Dev',
      job_description: 'Python work',
      employer_name: 'Bad Corp',
      job_apply_is_direct: false,
      job_min_salary: 60000,
      job_max_salary: 80000,
    }),
  ];

  it('applies salary filter', () => {
    const result = applyPostFilters(jobs, { minSalary: 90000 });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('applies keyword include filter', () => {
    const result = applyPostFilters(jobs, { includeKeywords: ['react'] });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('applies keyword exclude filter', () => {
    const result = applyPostFilters(jobs, { excludeKeywords: ['python'] });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('applies company exclude filter', () => {
    const result = applyPostFilters(jobs, { excludeCompanies: ['Bad Corp'] });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('applies direct apply filter', () => {
    const result = applyPostFilters(jobs, { directApplyOnly: true });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('applies multiple filters together', () => {
    const result = applyPostFilters(jobs, {
      includeKeywords: ['react', 'python'],
      minSalary: 90000,
    });
    expect(result.map((j) => j.job_id)).toEqual(['1']);
  });

  it('returns all jobs with empty filter options', () => {
    const result = applyPostFilters(jobs, {});
    expect(result).toHaveLength(2);
  });
});

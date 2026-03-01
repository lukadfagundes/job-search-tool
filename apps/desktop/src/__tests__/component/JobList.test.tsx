import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobList } from '../../renderer/components/JobList.tsx';
import type { JobResult } from '@job-hunt/core/browser';

function makeJob(id: string, title = 'Test Job'): JobResult {
  return {
    job_id: id,
    job_title: title,
    employer_name: 'Test Corp',
    employer_logo: null,
    employer_website: null,
    job_publisher: 'Test',
    job_employment_type: 'FULLTIME',
    job_apply_link: 'https://example.com',
    job_apply_is_direct: false,
    job_description: 'Test',
    job_is_remote: false,
    job_city: 'Test',
    job_state: 'TS',
    job_country: 'US',
    job_posted_at_datetime_utc: new Date().toISOString(),
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
  };
}

describe('JobList', () => {
  it('shows loading state', () => {
    render(
      <JobList
        jobs={[]}
        loading={true}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
      />
    );

    expect(screen.getByText(/Searching/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <JobList
        jobs={[]}
        loading={false}
        error="Something went wrong"
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
      />
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('shows empty state when no jobs and not loading', () => {
    render(
      <JobList
        jobs={[]}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
      />
    );

    // Empty state should not show job cards
    expect(screen.queryByRole('link', { name: /Apply/i })).not.toBeInTheDocument();
  });

  it('renders job cards when jobs are provided', () => {
    const jobs = [makeJob('1', 'Frontend Dev'), makeJob('2', 'Backend Dev')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
      />
    );

    expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    expect(screen.getByText('Backend Dev')).toBeInTheDocument();
  });

  it('shows result count', () => {
    const jobs = [makeJob('1'), makeJob('2'), makeJob('3')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
      />
    );

    expect(screen.getByText(/3 results found/i)).toBeInTheDocument();
  });

  it('marks bookmarked jobs correctly', () => {
    const jobs = [makeJob('1', 'Job A'), makeJob('2', 'Job B')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set(['1'])}
      />
    );

    expect(screen.getByTitle('Remove bookmark')).toBeInTheDocument();
    expect(screen.getByTitle('Bookmark this job')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobList } from '../../renderer/components/JobList.tsx';
import type { JobResult } from '@job-hunt/core/browser';

function makeJob(id: string, title = 'Test Job'): JobResult {
  return {
    job_id: id,
    job_title: title,
    employer_name: 'Test Corp',
    employer_logo: null,
    employer_website: null,
    employer_company_type: null,
    employer_linkedin: null,
    job_publisher: 'Test',
    job_employment_type: 'FULLTIME',
    job_apply_link: 'https://example.com',
    job_apply_is_direct: false,
    job_apply_quality_score: null,
    job_description: 'Test',
    job_is_remote: false,
    job_city: 'Test',
    job_state: 'TS',
    job_country: 'US',
    job_latitude: null,
    job_longitude: null,
    job_posted_at_timestamp: null,
    job_posted_at_datetime_utc: new Date().toISOString(),
    job_offer_expiration_datetime_utc: null,
    job_offer_expiration_timestamp: null,
    job_min_salary: null,
    job_max_salary: null,
    job_salary_currency: null,
    job_salary_period: null,
    job_benefits: null,
    job_google_link: null,
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
    job_experience_in_place_of_education: null,
    job_highlights: null,
    job_posting_language: null,
    job_onet_soc: null,
    job_onet_job_zone: null,
    job_occupational_categories: null,
    job_naics_code: null,
    job_naics_name: null,
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

  it('shows pagination controls when onPageChange is provided and hasMore is true', () => {
    const jobs = [makeJob('1')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
        currentPage={1}
        hasMore={true}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('disables Previous button on page 1', () => {
    const jobs = [makeJob('1')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
        currentPage={1}
        hasMore={true}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('disables Next button when hasMore is false', () => {
    const jobs = [makeJob('1')];

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
        currentPage={2}
        hasMore={false}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Next')).toBeDisabled();
    expect(screen.getByText('Previous')).not.toBeDisabled();
  });

  it('calls onPageChange with next page when Next is clicked', () => {
    const jobs = [makeJob('1')];
    const onPageChange = vi.fn();

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
        currentPage={1}
        hasMore={true}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with previous page when Previous is clicked', () => {
    const jobs = [makeJob('1')];
    const onPageChange = vi.fn();

    render(
      <JobList
        jobs={jobs}
        loading={false}
        error={null}
        onSelectJob={vi.fn()}
        onBookmark={vi.fn()}
        bookmarkedIds={new Set()}
        currentPage={3}
        hasMore={true}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('Previous'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not show pagination when onPageChange is not provided', () => {
    const jobs = [makeJob('1')];

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

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});

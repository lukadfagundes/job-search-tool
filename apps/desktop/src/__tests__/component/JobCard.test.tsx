import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '../../renderer/components/JobCard.tsx';
import type { JobResult } from '@job-hunt/core/browser';

function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    job_id: 'test-1',
    job_title: 'React Developer',
    employer_name: 'Acme Corp',
    employer_logo: null,
    employer_website: null,
    employer_company_type: null,
    employer_linkedin: null,
    job_publisher: 'LinkedIn',
    job_employment_type: 'FULLTIME',
    job_apply_link: 'https://example.com/apply',
    job_apply_is_direct: false,
    job_apply_quality_score: null,
    job_description: 'Build UIs with React',
    job_is_remote: false,
    job_city: 'San Francisco',
    job_state: 'CA',
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
    ...overrides,
  };
}

describe('JobCard', () => {
  it('renders job title and company', () => {
    render(
      <JobCard job={makeJob()} onSelect={vi.fn()} onBookmark={vi.fn()} isBookmarked={false} />
    );

    expect(screen.getByText('React Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows location', () => {
    render(
      <JobCard
        job={makeJob({ job_city: 'New York', job_state: 'NY' })}
        onSelect={vi.fn()}
        onBookmark={vi.fn()}
        isBookmarked={false}
      />
    );

    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('shows Remote badge when job is remote', () => {
    render(
      <JobCard
        job={makeJob({ job_is_remote: true })}
        onSelect={vi.fn()}
        onBookmark={vi.fn()}
        isBookmarked={false}
      />
    );

    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('displays salary when available', () => {
    render(
      <JobCard
        job={makeJob({
          job_min_salary: 100000,
          job_max_salary: 150000,
          job_salary_currency: 'USD',
          job_salary_period: 'YEAR',
        })}
        onSelect={vi.fn()}
        onBookmark={vi.fn()}
        isBookmarked={false}
      />
    );

    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    expect(screen.getByText(/150,000/)).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <JobCard job={makeJob()} onSelect={onSelect} onBookmark={vi.fn()} isBookmarked={false} />
    );

    fireEvent.click(screen.getByTestId('job-card-test-1'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ job_id: 'test-1' }));
  });

  it('calls onBookmark without triggering onSelect', () => {
    const onSelect = vi.fn();
    const onBookmark = vi.fn();
    render(
      <JobCard job={makeJob()} onSelect={onSelect} onBookmark={onBookmark} isBookmarked={false} />
    );

    fireEvent.click(screen.getByTitle('Bookmark this job'));
    expect(onBookmark).toHaveBeenCalledWith(expect.objectContaining({ job_id: 'test-1' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows filled star when bookmarked', () => {
    render(<JobCard job={makeJob()} onSelect={vi.fn()} onBookmark={vi.fn()} isBookmarked={true} />);

    expect(screen.getByTitle('Remove bookmark')).toBeInTheDocument();
  });

  it('shows employer initial when no logo', () => {
    render(
      <JobCard
        job={makeJob({ employer_logo: null, employer_name: 'Zebra Inc' })}
        onSelect={vi.fn()}
        onBookmark={vi.fn()}
        isBookmarked={false}
      />
    );

    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('renders Apply link', () => {
    render(
      <JobCard
        job={makeJob({ job_apply_link: 'https://example.com/apply' })}
        onSelect={vi.fn()}
        onBookmark={vi.fn()}
        isBookmarked={false}
      />
    );

    const link = screen.getByRole('link', { name: /Apply/i });
    expect(link).toHaveAttribute('href', 'https://example.com/apply');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

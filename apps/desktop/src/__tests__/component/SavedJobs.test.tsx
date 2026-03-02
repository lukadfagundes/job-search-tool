import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedJobs } from '../../renderer/components/SavedJobs.tsx';
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

describe('SavedJobs', () => {
  it('shows empty state when no saved jobs', () => {
    render(<SavedJobs savedJobs={[]} onSelectJob={vi.fn()} onRemoveBookmark={vi.fn()} />);

    expect(screen.getByText('No saved jobs yet')).toBeInTheDocument();
  });

  it('renders saved job cards', () => {
    const savedJobs = [
      { job: makeJob('1', 'Frontend Dev'), savedAt: '2026-01-01T00:00:00.000Z' },
      { job: makeJob('2', 'Backend Dev'), savedAt: '2026-01-02T00:00:00.000Z' },
    ];

    render(<SavedJobs savedJobs={savedJobs} onSelectJob={vi.fn()} onRemoveBookmark={vi.fn()} />);

    expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
    expect(screen.getByText('Backend Dev')).toBeInTheDocument();
  });

  it('shows count of saved jobs', () => {
    const savedJobs = [
      { job: makeJob('1'), savedAt: '2026-01-01T00:00:00.000Z' },
      { job: makeJob('2'), savedAt: '2026-01-02T00:00:00.000Z' },
    ];

    render(<SavedJobs savedJobs={savedJobs} onSelectJob={vi.fn()} onRemoveBookmark={vi.fn()} />);

    expect(screen.getByText(/Saved Jobs \(2\)/)).toBeInTheDocument();
  });

  it('calls onRemoveBookmark when bookmark button clicked', () => {
    const onRemoveBookmark = vi.fn();
    const savedJobs = [{ job: makeJob('1', 'My Job'), savedAt: '2026-01-01T00:00:00.000Z' }];

    render(
      <SavedJobs savedJobs={savedJobs} onSelectJob={vi.fn()} onRemoveBookmark={onRemoveBookmark} />
    );

    // All saved jobs show filled star (Remove bookmark)
    fireEvent.click(screen.getByTitle('Remove bookmark'));
    expect(onRemoveBookmark).toHaveBeenCalled();
  });

  it('calls onSelectJob when job title clicked', () => {
    const onSelectJob = vi.fn();
    const savedJobs = [{ job: makeJob('1', 'My Job'), savedAt: '2026-01-01T00:00:00.000Z' }];

    render(
      <SavedJobs savedJobs={savedJobs} onSelectJob={onSelectJob} onRemoveBookmark={vi.fn()} />
    );

    fireEvent.click(screen.getByText('My Job'));
    expect(onSelectJob).toHaveBeenCalledWith(expect.objectContaining({ job_id: '1' }));
  });
});

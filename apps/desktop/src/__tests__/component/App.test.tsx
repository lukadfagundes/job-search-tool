import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../renderer/App.tsx';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.electronAPI.searchJobs = vi.fn();
    window.electronAPI.getQuota = vi.fn();
    window.electronAPI.getApiKeyStatus = vi
      .fn()
      .mockResolvedValue({ success: true, hasKey: false });
    window.electronAPI.saveApiKey = vi.fn();
    window.electronAPI.removeApiKey = vi.fn().mockResolvedValue({ success: true });
  });

  it('renders header with search view by default', () => {
    render(<App />);

    expect(screen.getByText('Job Hunt')).toBeInTheDocument();
    expect(screen.getByText('Search Jobs')).toBeInTheDocument();
  });

  it('opens sidebar when hamburger is clicked', () => {
    render(<App />);

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('hamburger-button'));
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('switches to saved view via sidebar', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('hamburger-button'));
    fireEvent.click(screen.getByText('Saved Jobs'));
    expect(screen.getByText('No saved jobs yet')).toBeInTheDocument();
  });

  it('switches to settings view via sidebar', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('hamburger-button'));
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('performs a search via electronAPI', async () => {
    const mockResult = {
      success: true,
      data: [
        {
          job_id: 'test-1',
          job_title: 'React Developer',
          employer_name: 'Test Corp',
          employer_logo: null,
          employer_website: null,
          job_publisher: 'Test',
          job_employment_type: 'FULLTIME',
          job_apply_link: 'https://example.com',
          job_apply_is_direct: false,
          job_description: 'Test',
          job_is_remote: false,
          job_city: 'SF',
          job_state: 'CA',
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
        },
      ],
      quota: {
        weeklyUsed: 1,
        weeklyLimit: 50,
        weeklyRemaining: 49,
        monthlyUsed: 1,
        monthlyLimit: 200,
        monthlyRemaining: 199,
        weeklyResetsAt: null,
        monthlyResetsAt: null,
      },
    };

    (window.electronAPI.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    render(<App />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'react developer' } });
    fireEvent.submit(queryInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });

    expect(window.electronAPI.searchJobs).toHaveBeenCalled();
  });

  it('displays error when search fails', async () => {
    (window.electronAPI.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'API key not configured',
    });

    render(<App />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'test' } });
    fireEvent.submit(queryInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/API key not configured/)).toBeInTheDocument();
    });
  });

  it('persists saved jobs to localStorage', async () => {
    const mockJob = {
      job_id: 'save-test',
      job_title: 'Save Test Job',
      employer_name: 'Test',
      employer_logo: null,
      employer_website: null,
      job_publisher: 'Test',
      job_employment_type: 'FULLTIME',
      job_apply_link: 'https://example.com',
      job_apply_is_direct: false,
      job_description: 'Test',
      job_is_remote: false,
      job_city: 'SF',
      job_state: 'CA',
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

    (window.electronAPI.searchJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [mockJob],
      quota: {
        weeklyUsed: 1,
        weeklyLimit: 50,
        weeklyRemaining: 49,
        monthlyUsed: 1,
        monthlyLimit: 200,
        monthlyRemaining: 199,
        weeklyResetsAt: null,
        monthlyResetsAt: null,
      },
    });

    render(<App />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'test' } });
    fireEvent.submit(queryInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Save Test Job')).toBeInTheDocument();
    });

    // Bookmark the job
    fireEvent.click(screen.getByTitle('Bookmark this job'));

    // Check localStorage
    const stored = JSON.parse(localStorage.getItem('job-hunt-saved-jobs') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].job.job_id).toBe('save-test');
  });
});

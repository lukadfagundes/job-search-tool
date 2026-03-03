import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobDetail } from '../../renderer/components/JobDetail.tsx';
import type { JobResult } from '@job-hunt/core/browser';
import type { ResumeData } from '../../shared/resume-types.ts';

function makeJob(overrides: Partial<JobResult> = {}): JobResult {
  return {
    job_id: 'detail-1',
    job_title: 'Senior React Developer',
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
    job_description: 'Build modern web applications with React.',
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

const sampleResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Jane Smith',
    jobTitle: 'Engineer',
    email: 'j@t.com',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
  },
  workExperience: [],
  education: [],
  skills: ['React'],
  certifications: [],
};

describe('JobDetail', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onBookmark: vi.fn(),
    isBookmarked: false,
    resumeData: sampleResumeData as ResumeData | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job title and employer name', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByText('Senior React Developer')).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it('shows employer company type next to company name', () => {
    render(<JobDetail job={makeJob({ employer_company_type: 'Technology' })} {...defaultProps} />);

    expect(screen.getByText(/Technology/)).toBeInTheDocument();
  });

  it('displays "Posted" time ago', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByText(/Posted Today/)).toBeInTheDocument();
  });

  it('shows non-English language badge', () => {
    render(<JobDetail job={makeJob({ job_posting_language: 'es' })} {...defaultProps} />);

    expect(screen.getByText('es')).toBeInTheDocument();
  });

  it('does not show language badge for English', () => {
    render(<JobDetail job={makeJob({ job_posting_language: 'en' })} {...defaultProps} />);

    expect(screen.queryByText('en')).not.toBeInTheDocument();
  });

  it('shows future expiration date', () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_offer_expiration_datetime_utc: future })} {...defaultProps} />
    );

    const notice = screen.getByTestId('expiration-notice');
    expect(notice).toBeInTheDocument();
    expect(notice.textContent).toMatch(/Expires/);
  });

  it('shows expired listing notice', () => {
    const past = new Date(Date.now() - 7 * 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_offer_expiration_datetime_utc: past })} {...defaultProps} />
    );

    const notice = screen.getByTestId('expiration-notice');
    expect(notice.textContent).toMatch(/expired/);
  });

  it('shows salary section when salary data exists', () => {
    render(
      <JobDetail
        job={makeJob({
          job_min_salary: 120000,
          job_max_salary: 180000,
          job_salary_currency: 'USD',
          job_salary_period: 'YEAR',
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText(/120,000/)).toBeInTheDocument();
    expect(screen.getByText(/180,000/)).toBeInTheDocument();
  });

  it('shows required skills as tags', () => {
    render(
      <JobDetail
        job={makeJob({ job_required_skills: ['React', 'TypeScript', 'Node.js'] })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Required Skills')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('shows experience requirement with years', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_experience: {
            no_experience_required: false,
            required_experience_in_months: 36,
            experience_mentioned: true,
            experience_preferred: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText(/3 years experience/)).toBeInTheDocument();
  });

  it('shows "No experience required" when applicable', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_experience: {
            no_experience_required: true,
            required_experience_in_months: null,
            experience_mentioned: true,
            experience_preferred: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/No experience required/)).toBeInTheDocument();
  });

  it('shows education level', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_education: {
            postgraduate_degree: false,
            professional_certification: false,
            high_school: false,
            associates_degree: false,
            bachelors_degree: true,
            degree_mentioned: true,
            degree_preferred: false,
            professional_certification_mentioned: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText("Bachelor's degree")).toBeInTheDocument();
  });

  it('shows experience in place of education note', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_experience: {
            no_experience_required: false,
            required_experience_in_months: 60,
            experience_mentioned: true,
            experience_preferred: false,
          },
          job_experience_in_place_of_education: true,
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/accepted in place of education/)).toBeInTheDocument();
  });

  it('shows occupational categories as tags', () => {
    render(
      <JobDetail
        job={makeJob({ job_occupational_categories: ['Software Development', 'Engineering'] })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Software Development')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('shows benefits as tags', () => {
    render(
      <JobDetail
        job={makeJob({ job_benefits: ['health_insurance', 'paid_time_off'] })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Benefits')).toBeInTheDocument();
    expect(screen.getByText('health insurance')).toBeInTheDocument();
    expect(screen.getByText('paid time off')).toBeInTheDocument();
  });

  it('shows job highlights sections', () => {
    render(
      <JobDetail
        job={makeJob({
          job_highlights: {
            Qualifications: ['5+ years React', 'Strong TypeScript skills'],
            Responsibilities: ['Build features', 'Code reviews'],
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Qualifications')).toBeInTheDocument();
    expect(screen.getByText('5+ years React')).toBeInTheDocument();
    expect(screen.getByText('Strong TypeScript skills')).toBeInTheDocument();
    expect(screen.getByText('Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Build features')).toBeInTheDocument();
    expect(screen.getByText('Code reviews')).toBeInTheDocument();
  });

  it('skips empty highlight sections', () => {
    render(
      <JobDetail
        job={makeJob({
          job_highlights: {
            Qualifications: ['Has skills'],
            Responsibilities: [],
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Qualifications')).toBeInTheDocument();
    expect(screen.queryByText('Responsibilities')).not.toBeInTheDocument();
  });

  it('shows job description', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByText('Job Description')).toBeInTheDocument();
    expect(screen.getByText('Build modern web applications with React.')).toBeInTheDocument();
  });

  it('shows contact links when available', () => {
    render(
      <JobDetail
        job={makeJob({
          employer_website: 'https://acme.com',
          employer_linkedin: 'https://linkedin.com/company/acme',
          job_google_link: 'https://google.com/jobs/acme',
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Contact & Links')).toBeInTheDocument();
    expect(screen.getByText('https://acme.com')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn Profile')).toBeInTheDocument();
    expect(screen.getByText('View on Google Jobs')).toBeInTheDocument();
  });

  it('shows apply options with direct badge', () => {
    render(
      <JobDetail
        job={makeJob({
          apply_options: [
            { publisher: 'Company Site', apply_link: 'https://acme.com/apply', is_direct: true },
            { publisher: 'Indeed', apply_link: 'https://indeed.com/apply', is_direct: false },
          ],
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Apply Options')).toBeInTheDocument();
    expect(screen.getByText(/Company Site/)).toBeInTheDocument();
    expect(screen.getByText(/\(Direct\)/)).toBeInTheDocument();
    expect(screen.getByText(/Indeed/)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<JobDetail job={makeJob()} {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Senior React Developer').closest('.fixed')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<JobDetail job={makeJob()} {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Senior React Developer'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<JobDetail job={makeJob()} {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('\u00d7'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onBookmark when bookmark button is clicked', () => {
    const onBookmark = vi.fn();
    render(<JobDetail job={makeJob()} {...defaultProps} onBookmark={onBookmark} />);

    fireEvent.click(screen.getByText(/Bookmark/));
    expect(onBookmark).toHaveBeenCalledWith(expect.objectContaining({ job_id: 'detail-1' }));
  });

  it('shows filled bookmark when isBookmarked is true', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} isBookmarked={true} />);

    expect(screen.getByText(/Bookmarked/)).toBeInTheDocument();
  });

  it('renders Apply Now link', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    const link = screen.getByRole('link', { name: /Apply Now/ });
    expect(link).toHaveAttribute('href', 'https://example.com/apply');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows Remote badge when job is remote', () => {
    render(<JobDetail job={makeJob({ job_is_remote: true })} {...defaultProps} />);

    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('shows employer initial when no logo', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  // Resume/CV generation buttons (PDF + DOCX)
  it('renders all four generation buttons in footer', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByTestId('generate-resume-btn')).toBeInTheDocument();
    expect(screen.getByTestId('generate-cv-btn')).toBeInTheDocument();
    expect(screen.getByTestId('generate-resume-docx-btn')).toBeInTheDocument();
    expect(screen.getByTestId('generate-cv-docx-btn')).toBeInTheDocument();
  });

  it('shows correct button labels with accent', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByTestId('generate-resume-btn').textContent).toBe('PDF R\u00e9sum\u00e9');
    expect(screen.getByTestId('generate-cv-btn').textContent).toBe('PDF CV');
    expect(screen.getByTestId('generate-resume-docx-btn').textContent).toBe(
      'DOCX R\u00e9sum\u00e9'
    );
    expect(screen.getByTestId('generate-cv-docx-btn').textContent).toBe('DOCX CV');
  });

  it('disables all generation buttons when resumeData is null', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} resumeData={null} />);

    expect(screen.getByTestId('generate-resume-btn')).toBeDisabled();
    expect(screen.getByTestId('generate-cv-btn')).toBeDisabled();
    expect(screen.getByTestId('generate-resume-docx-btn')).toBeDisabled();
    expect(screen.getByTestId('generate-cv-docx-btn')).toBeDisabled();
  });

  it('enables all generation buttons when resumeData is present', () => {
    render(<JobDetail job={makeJob()} {...defaultProps} />);

    expect(screen.getByTestId('generate-resume-btn')).not.toBeDisabled();
    expect(screen.getByTestId('generate-cv-btn')).not.toBeDisabled();
    expect(screen.getByTestId('generate-resume-docx-btn')).not.toBeDisabled();
    expect(screen.getByTestId('generate-cv-docx-btn')).not.toBeDisabled();
  });

  it('calls generateResume when PDF R\u00e9sum\u00e9 button is clicked', async () => {
    (window.electronAPI.generateResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      filePath: '/downloads/Resume_Acme_Corp_Senior_React_Developer.pdf',
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-btn'));

    await waitFor(() => {
      expect(window.electronAPI.generateResume).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('doc-message')).toBeInTheDocument();
      expect(screen.getByTestId('doc-message').textContent).toContain('Downloaded');
    });
  });

  it('calls generateCV when PDF CV button is clicked', async () => {
    (window.electronAPI.generateCV as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      filePath: '/downloads/CV_Acme_Corp_Senior_React_Developer.pdf',
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-cv-btn'));

    await waitFor(() => {
      expect(window.electronAPI.generateCV).toHaveBeenCalled();
    });
  });

  it('calls generateResumeDocx when DOCX R\u00e9sum\u00e9 button is clicked', async () => {
    (window.electronAPI.generateResumeDocx as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      filePath: '/downloads/Jane_Smith_Resume.docx',
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-docx-btn'));

    await waitFor(() => {
      expect(window.electronAPI.generateResumeDocx).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('doc-message')).toBeInTheDocument();
      expect(screen.getByTestId('doc-message').textContent).toContain('Downloaded');
    });
  });

  it('calls generateCVDocx when DOCX CV button is clicked', async () => {
    (window.electronAPI.generateCVDocx as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      filePath: '/downloads/Jane_Smith_CV.docx',
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-cv-docx-btn'));

    await waitFor(() => {
      expect(window.electronAPI.generateCVDocx).toHaveBeenCalled();
    });
  });

  it('shows error message when generation fails', async () => {
    (window.electronAPI.generateResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Gemini rate limit reached',
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('doc-message')).toBeInTheDocument();
      expect(screen.getByTestId('doc-message').textContent).toContain('Gemini rate limit reached');
    });
  });

  it('shows Gemini key missing guidance', async () => {
    (window.electronAPI.generateResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      geminiKeyMissing: true,
    });

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('doc-message').textContent).toContain(
        'Gemini API key not configured'
      );
    });
  });

  it('shows loading state and modal during PDF resume generation', async () => {
    let resolveGenerate: (value: unknown) => void;
    (window.electronAPI.generateResume as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      })
    );

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('generate-resume-btn').textContent).toBe('Generating...');
    });

    // Modal should be visible with correct text
    expect(screen.getByTestId('generating-modal')).toBeInTheDocument();
    expect(screen.getByText('Generating R\u00e9sum\u00e9...')).toBeInTheDocument();
    expect(
      screen.getByText('Tailoring your document with AI. This may take a few seconds.')
    ).toBeInTheDocument();

    // All other buttons should be disabled during generation
    expect(screen.getByTestId('generate-cv-btn')).toBeDisabled();
    expect(screen.getByTestId('generate-resume-docx-btn')).toBeDisabled();
    expect(screen.getByTestId('generate-cv-docx-btn')).toBeDisabled();

    resolveGenerate!({ success: true, filePath: '/downloads/test.pdf' });

    await waitFor(() => {
      expect(screen.getByTestId('generate-resume-btn').textContent).toBe('PDF R\u00e9sum\u00e9');
    });

    // Modal should be dismissed
    expect(screen.queryByTestId('generating-modal')).not.toBeInTheDocument();
  });

  it('shows generating modal with CV text during CV generation', async () => {
    let resolveGenerate: (value: unknown) => void;
    (window.electronAPI.generateCV as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      })
    );

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-cv-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('generating-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Generating CV...')).toBeInTheDocument();

    resolveGenerate!({ success: true, filePath: '/downloads/CV_test.pdf' });

    await waitFor(() => {
      expect(screen.queryByTestId('generating-modal')).not.toBeInTheDocument();
    });
  });

  it('shows generating modal with R\u00e9sum\u00e9 text during DOCX resume generation', async () => {
    let resolveGenerate: (value: unknown) => void;
    (window.electronAPI.generateResumeDocx as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      })
    );

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-docx-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('generating-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Generating R\u00e9sum\u00e9...')).toBeInTheDocument();

    resolveGenerate!({ success: true, filePath: '/downloads/Resume.docx' });

    await waitFor(() => {
      expect(screen.queryByTestId('generating-modal')).not.toBeInTheDocument();
    });
  });

  it('shows catch-block error when generateResume throws', async () => {
    (window.electronAPI.generateResume as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    render(<JobDetail job={makeJob()} {...defaultProps} />);
    fireEvent.click(screen.getByTestId('generate-resume-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('doc-message')).toBeInTheDocument();
      expect(screen.getByTestId('doc-message').textContent).toContain(
        'Failed to generate document'
      );
    });
  });

  it('shows employer logo image when available', () => {
    render(
      <JobDetail
        job={makeJob({ employer_logo: 'https://example.com/logo.png' })}
        {...defaultProps}
      />
    );

    const img = screen.getByAltText('Acme Corp');
    expect(img).toBeInTheDocument();
  });

  it('hides logo on image error', () => {
    render(
      <JobDetail
        job={makeJob({ employer_logo: 'https://example.com/bad.png' })}
        {...defaultProps}
      />
    );

    const img = screen.getByAltText('Acme Corp');
    fireEvent.error(img);
    expect(img).toHaveStyle('display: none');
  });

  it('renders Posted time ago text', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_posted_at_datetime_utc: yesterday })} {...defaultProps} />
    );

    expect(screen.getByText(/1 day ago/)).toBeInTheDocument();
  });

  it('shows education level from job data', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_education: {
            postgraduate_degree: false,
            professional_certification: false,
            high_school: false,
            associates_degree: false,
            bachelors_degree: true,
            degree_mentioned: true,
            degree_preferred: false,
            professional_certification_mentioned: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/Bachelor's degree/)).toBeInTheDocument();
  });

  it('shows postgraduate education level', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_education: {
            postgraduate_degree: true,
            professional_certification: false,
            high_school: false,
            associates_degree: false,
            bachelors_degree: false,
            degree_mentioned: false,
            degree_preferred: false,
            professional_certification_mentioned: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/Postgraduate degree/)).toBeInTheDocument();
  });

  it('shows degree preferred label', () => {
    render(
      <JobDetail
        job={makeJob({
          job_required_education: {
            postgraduate_degree: false,
            professional_certification: false,
            high_school: false,
            associates_degree: false,
            bachelors_degree: false,
            degree_mentioned: false,
            degree_preferred: true,
            professional_certification_mentioned: false,
          },
        })}
        {...defaultProps}
      />
    );

    expect(screen.getByText(/Degree preferred/)).toBeInTheDocument();
  });

  it('formats weeks ago correctly', () => {
    const twoWeeksAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_posted_at_datetime_utc: twoWeeksAgo })} {...defaultProps} />
    );

    expect(screen.getByText(/1 week ago/)).toBeInTheDocument();
  });

  it('formats months ago correctly', () => {
    const twoMonthsAgo = new Date(Date.now() - 45 * 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_posted_at_datetime_utc: twoMonthsAgo })} {...defaultProps} />
    );

    expect(screen.getByText(/1 month ago/)).toBeInTheDocument();
  });

  it('formats multiple months ago', () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString();
    render(
      <JobDetail job={makeJob({ job_posted_at_datetime_utc: ninetyDaysAgo })} {...defaultProps} />
    );

    expect(screen.getByText(/3 months ago/)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeBuilder } from '../../renderer/components/ResumeBuilder.tsx';

beforeEach(() => {
  (window.electronAPI.loadResume as ReturnType<typeof vi.fn>).mockResolvedValue({
    success: true,
    data: null,
  });
  (window.electronAPI.saveResume as ReturnType<typeof vi.fn>).mockResolvedValue({
    success: true,
  });
  (window.electronAPI.pickResumeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
    success: true,
    cancelled: true,
  });
  (window.electronAPI.parseResumeText as ReturnType<typeof vi.fn>).mockResolvedValue({
    success: true,
    data: {},
  });
});

describe('ResumeBuilder', () => {
  it('shows loading state initially', () => {
    (window.electronAPI.loadResume as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );
    render(<ResumeBuilder />);
    expect(screen.getByText('Loading resume data...')).toBeInTheDocument();
  });

  it('renders all sections after loading', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Resume Builder')).toBeInTheDocument();
    });

    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Certifications')).toBeInTheDocument();
  });

  // Save/Reset/Upload buttons
  it('does not show Saved badge when no data has been saved', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByText('Resume Builder')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('save-status')).not.toBeInTheDocument();
  });

  it('renders Upload Resume button', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-resume-btn')).toBeInTheDocument();
    });
    expect(screen.getByTestId('upload-resume-btn')).toHaveTextContent('Upload Resume');
  });

  it('renders Save button disabled initially', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeInTheDocument();
    });
    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  it('renders Reset button disabled initially', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
    });
    expect(screen.getByTestId('reset-btn')).toBeDisabled();
  });

  it('enables Save button after making changes', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Changed' },
    });

    expect(screen.getByTestId('save-btn')).not.toBeDisabled();
  });

  it('enables Reset button after making changes', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Changed' },
    });

    expect(screen.getByTestId('reset-btn')).not.toBeDisabled();
  });

  it('calls saveResume via IPC when Save button is clicked', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test User' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(window.electronAPI.saveResume).toHaveBeenCalled();
    });
  });

  it('shows Saved badge after clicking Save', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toBeInTheDocument();
    });
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
  });

  it('hides Saved badge when user makes changes after saving', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test 2' },
    });

    expect(screen.queryByTestId('save-status')).not.toBeInTheDocument();
  });

  it('reverts changes when Reset is clicked', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Changed Name' },
    });

    expect(screen.getByTestId('reset-btn')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('reset-btn'));

    expect(screen.getByPlaceholderText('John Doe')).toHaveValue('');
    expect(screen.getByTestId('reset-btn')).toBeDisabled();
  });

  it('shows Saved badge when existing data is loaded from disk', async () => {
    (window.electronAPI.loadResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        personalInfo: {
          fullName: 'Existing User',
          jobTitle: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          linkedin: '',
        },
        workExperience: [],
        education: [],
        skills: [],
        certifications: [],
      },
    });

    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing User')).toBeInTheDocument();
    });

    expect(screen.getByTestId('save-status')).toBeInTheDocument();
  });

  // Upload Resume
  it('calls pickResumeFile then parseResumeText when Upload Resume is clicked', async () => {
    (window.electronAPI.pickResumeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      text: 'Parsed Name\nparsed@example.com',
    });
    (window.electronAPI.parseResumeText as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        personalInfo: {
          fullName: 'Parsed Name',
          email: 'parsed@example.com',
        },
      },
    });

    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-resume-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('upload-resume-btn'));

    await waitFor(() => {
      expect(window.electronAPI.pickResumeFile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.electronAPI.parseResumeText).toHaveBeenCalledWith(
        'Parsed Name\nparsed@example.com'
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Parsed Name')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('parsed@example.com')).toBeInTheDocument();
  });

  it('shows processing modal only during AI parsing, not during file pick', async () => {
    let resolveParse: (value: unknown) => void;
    (window.electronAPI.pickResumeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      text: 'resume text',
    });
    (window.electronAPI.parseResumeText as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveParse = resolve;
      })
    );

    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-resume-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('upload-resume-btn'));

    // Modal should appear after pickResumeFile resolves (during parseResumeText)
    await waitFor(() => {
      expect(screen.getByTestId('processing-modal')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Extracting resume data with Gemini. This may take a few seconds.')
    ).toBeInTheDocument();

    resolveParse!({ success: true, data: {} });

    await waitFor(() => {
      expect(screen.queryByTestId('processing-modal')).not.toBeInTheDocument();
    });
  });

  it('does not populate fields when upload is cancelled', async () => {
    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-resume-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('upload-resume-btn'));

    await waitFor(() => {
      expect(window.electronAPI.pickResumeFile).toHaveBeenCalled();
    });

    // parseResumeText should not be called when cancelled
    expect(window.electronAPI.parseResumeText).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('John Doe')).toHaveValue('');
  });

  it('loads existing resume data on mount', async () => {
    (window.electronAPI.loadResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        personalInfo: {
          fullName: 'Jane Doe',
          jobTitle: 'Designer',
          email: 'jane@example.com',
          phone: '555-1234',
          location: 'NYC',
          website: '',
          linkedin: '',
        },
        workExperience: [],
        education: [],
        skills: [],
        certifications: [],
      },
    });

    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Designer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NYC')).toBeInTheDocument();
  });

  // Personal Information
  it('renders personal info fields', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City, State')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://linkedin.com/in/johndoe')).toBeInTheDocument();
  });

  it('updates personal info fields on change', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });
    expect(nameInput).toHaveValue('Alice Smith');
  });

  // Upload error display
  it('shows error when upload fails with geminiKeyMissing', async () => {
    (window.electronAPI.pickResumeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Gemini API key not configured.',
      geminiKeyMissing: true,
    });

    render(<ResumeBuilder />);
    await waitFor(() => {
      expect(screen.getByTestId('upload-resume-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('upload-resume-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('upload-error')).toHaveTextContent('Gemini API key not configured');
  });

  // Section collapse/expand
  it('collapses a section when header is clicked', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Personal Information'));
    expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();
  });

  it('re-expands a collapsed section', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Personal Information'));
    expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Personal Information'));
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
  });

  // Work Experience
  it('adds a work experience entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Work Experience')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Work Experience'));

    expect(screen.getByTestId('experience-0')).toBeInTheDocument();
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Account Manager')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Corp')).toBeInTheDocument();
  });

  it('removes a work experience entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Work Experience')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Work Experience'));
    expect(screen.getByTestId('experience-0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Remove'));
    expect(screen.queryByTestId('experience-0')).not.toBeInTheDocument();
  });

  it('adds a responsibility bullet point', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Work Experience')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Work Experience'));

    const bulletInput = screen.getByPlaceholderText(
      'Describe a key responsibility or achievement...'
    );
    expect(bulletInput).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Add bullet point'));

    const bulletInputs = screen.getAllByPlaceholderText(
      'Describe a key responsibility or achievement...'
    );
    expect(bulletInputs).toHaveLength(2);
  });

  it('shows Current checkbox for work experience', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Work Experience')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Work Experience'));

    const currentLabels = screen.getAllByText('Current');
    expect(currentLabels.length).toBeGreaterThanOrEqual(1);
  });

  // Education
  it('adds an education entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Education')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Education'));

    expect(screen.getByTestId('education-0')).toBeInTheDocument();
    expect(screen.getByText('Education 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('University of California')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bachelor of Science')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Business Administration')).toBeInTheDocument();
  });

  it('removes an education entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Education')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Education'));
    expect(screen.getByTestId('education-0')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Remove')[0]);
    expect(screen.queryByTestId('education-0')).not.toBeInTheDocument();
  });

  // Skills
  it('adds a skill via button click', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Type a skill and press Enter or click Add...')
      ).toBeInTheDocument();
    });

    const skillInput = screen.getByPlaceholderText('Type a skill and press Enter or click Add...');
    fireEvent.change(skillInput, { target: { value: 'JavaScript' } });
    fireEvent.click(screen.getByText('Add'));

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(skillInput).toHaveValue('');
  });

  it('adds a skill via Enter key', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Type a skill and press Enter or click Add...')
      ).toBeInTheDocument();
    });

    const skillInput = screen.getByPlaceholderText('Type a skill and press Enter or click Add...');
    fireEvent.change(skillInput, { target: { value: 'React' } });
    fireEvent.keyDown(skillInput, { key: 'Enter' });

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('does not add empty skill', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Type a skill and press Enter or click Add...')
      ).toBeInTheDocument();
    });

    const skillInput = screen.getByPlaceholderText('Type a skill and press Enter or click Add...');
    fireEvent.change(skillInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Add'));

    expect(screen.queryByTitle('Remove skill')).not.toBeInTheDocument();
  });

  it('removes a skill', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Type a skill and press Enter or click Add...')
      ).toBeInTheDocument();
    });

    const skillInput = screen.getByPlaceholderText('Type a skill and press Enter or click Add...');
    fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Remove skill'));
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });

  // Certifications
  it('adds a certification entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Certification')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Certification'));

    expect(screen.getByTestId('certification-0')).toBeInTheDocument();
    expect(screen.getByText('Certification 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('AWS Solutions Architect')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Amazon Web Services')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mar 2023')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mar 2026 (leave blank if none)')).toBeInTheDocument();
  });

  it('removes a certification entry', async () => {
    render(<ResumeBuilder />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Certification')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Certification'));
    expect(screen.getByTestId('certification-0')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Remove'));
    expect(screen.queryByTestId('certification-0')).not.toBeInTheDocument();
  });
});

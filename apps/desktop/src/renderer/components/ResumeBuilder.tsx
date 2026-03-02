import { useState, useCallback } from 'react';
import {
  useResume,
  generateId,
  type ResumeData,
  type WorkExperience,
  type Education,
  type Certification,
} from '../hooks/useResume.ts';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const btnSecondary =
  'px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';

const btnPrimary =
  'px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const btnDanger =
  'px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors';

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <svg
        className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  );
}

export function ResumeBuilder() {
  const { resume, updateResume, loaded, saving, dirty, hasSaved, save, reset, importResume } =
    useResume();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
  });
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(async () => {
    setUploadError(null);
    try {
      // Step 1: Pick file and extract text (no modal)
      const pickResult = await window.electronAPI.pickResumeFile();
      if (pickResult.cancelled) return;
      if (!pickResult.success) {
        if (pickResult.geminiKeyMissing) {
          setUploadError('Gemini API key not configured. Go to Settings to add your key.');
        } else {
          setUploadError(pickResult.error ?? 'Failed to read resume file.');
        }
        return;
      }

      // Step 2: Parse extracted text with Gemini (show modal)
      setUploading(true);
      const parseResult = await window.electronAPI.parseResumeText(pickResult.text!);
      if (parseResult.success && parseResult.data) {
        importResume(parseResult.data as Partial<ResumeData>);
      } else if (!parseResult.success) {
        setUploadError(parseResult.error ?? 'Failed to parse resume.');
      }
    } catch {
      setUploadError('Failed to parse resume. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [importResume]);

  const toggle = useCallback((section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const updatePersonal = useCallback(
    (field: keyof ResumeData['personalInfo'], value: string) => {
      updateResume((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value },
      }));
    },
    [updateResume]
  );

  // Work Experience helpers
  const addExperience = useCallback(() => {
    updateResume((prev) => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: generateId(),
          jobTitle: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          responsibilities: [''],
        },
      ],
    }));
  }, [updateResume]);

  const updateExperience = useCallback(
    (id: string, field: keyof WorkExperience, value: unknown) => {
      updateResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((exp) =>
          exp.id === id ? { ...exp, [field]: value } : exp
        ),
      }));
    },
    [updateResume]
  );

  const removeExperience = useCallback(
    (id: string) => {
      updateResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.filter((exp) => exp.id !== id),
      }));
    },
    [updateResume]
  );

  const updateResponsibility = useCallback(
    (expId: string, index: number, value: string) => {
      updateResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((exp) => {
          if (exp.id !== expId) return exp;
          const updated = [...exp.responsibilities];
          updated[index] = value;
          return { ...exp, responsibilities: updated };
        }),
      }));
    },
    [updateResume]
  );

  const addResponsibility = useCallback(
    (expId: string) => {
      updateResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((exp) =>
          exp.id === expId ? { ...exp, responsibilities: [...exp.responsibilities, ''] } : exp
        ),
      }));
    },
    [updateResume]
  );

  const removeResponsibility = useCallback(
    (expId: string, index: number) => {
      updateResume((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((exp) => {
          if (exp.id !== expId) return exp;
          return { ...exp, responsibilities: exp.responsibilities.filter((_, i) => i !== index) };
        }),
      }));
    },
    [updateResume]
  );

  // Education helpers
  const addEducation = useCallback(() => {
    updateResume((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: generateId(),
          institution: '',
          degree: '',
          fieldOfStudy: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
        },
      ],
    }));
  }, [updateResume]);

  const updateEducation = useCallback(
    (id: string, field: keyof Education, value: unknown) => {
      updateResume((prev) => ({
        ...prev,
        education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
      }));
    },
    [updateResume]
  );

  const removeEducation = useCallback(
    (id: string) => {
      updateResume((prev) => ({
        ...prev,
        education: prev.education.filter((edu) => edu.id !== id),
      }));
    },
    [updateResume]
  );

  // Skills helpers
  const addSkill = useCallback(() => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    updateResume((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkill('');
  }, [newSkill, updateResume]);

  const removeSkill = useCallback(
    (index: number) => {
      updateResume((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
      }));
    },
    [updateResume]
  );

  // Certification helpers
  const addCertification = useCallback(() => {
    updateResume((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: generateId(),
          name: '',
          issuer: '',
          dateObtained: '',
          expirationDate: '',
        },
      ],
    }));
  }, [updateResume]);

  const updateCertification = useCallback(
    (id: string, field: keyof Certification, value: string) => {
      updateResume((prev) => ({
        ...prev,
        certifications: prev.certifications.map((cert) =>
          cert.id === id ? { ...cert, [field]: value } : cert
        ),
      }));
    },
    [updateResume]
  );

  const removeCertification = useCallback(
    (id: string) => {
      updateResume((prev) => ({
        ...prev,
        certifications: prev.certifications.filter((cert) => cert.id !== id),
      }));
    },
    [updateResume]
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400">Loading resume data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className={btnSecondary}
            data-testid="upload-resume-btn"
          >
            {uploading ? 'Parsing with AI...' : 'Upload Resume'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className={btnPrimary}
            data-testid="save-btn"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty}
            className={btnSecondary}
            data-testid="reset-btn"
          >
            Reset
          </button>
          {hasSaved && !dirty && (
            <span
              data-testid="save-status"
              className="text-xs px-2 py-1 rounded text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
            >
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
          data-testid="upload-error"
        >
          {uploadError}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
        <SectionHeader
          title="Personal Information"
          open={openSections.personal}
          onToggle={() => toggle('personal')}
        />
        {openSections.personal && (
          <div className="pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="John Doe"
                  value={resume.personalInfo.fullName}
                  onChange={(e) => updatePersonal('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Job Title</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Software Engineer"
                  value={resume.personalInfo.jobTitle}
                  onChange={(e) => updatePersonal('jobTitle', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="john@example.com"
                  value={resume.personalInfo.email}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="(555) 123-4567"
                  value={resume.personalInfo.phone}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                className={inputClass}
                placeholder="City, State"
                value={resume.personalInfo.location}
                onChange={(e) => updatePersonal('location', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://example.com"
                  value={resume.personalInfo.website}
                  onChange={(e) => updatePersonal('website', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://linkedin.com/in/johndoe"
                  value={resume.personalInfo.linkedin}
                  onChange={(e) => updatePersonal('linkedin', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Experience */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
        <SectionHeader
          title="Work Experience"
          open={openSections.experience}
          onToggle={() => toggle('experience')}
        />
        {openSections.experience && (
          <div className="pb-6 space-y-6">
            {resume.workExperience.map((exp, idx) => (
              <div
                key={exp.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4"
                data-testid={`experience-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Position {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className={btnDanger}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Job Title</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Account Manager"
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Acme Corp"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="City, State (Remote)"
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Jan 2020"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className={`${inputClass} ${exp.current ? 'opacity-50' : ''}`}
                        placeholder="Dec 2023"
                        value={exp.current ? 'Present' : exp.endDate}
                        disabled={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                        />
                        Current
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Key Responsibilities / Achievements</label>
                  <div className="space-y-2">
                    {exp.responsibilities.map((resp, ri) => (
                      <div key={ri} className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">•</span>
                        <input
                          type="text"
                          className={`${inputClass} flex-1`}
                          placeholder="Describe a key responsibility or achievement..."
                          value={resp}
                          onChange={(e) => updateResponsibility(exp.id, ri, e.target.value)}
                        />
                        {exp.responsibilities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeResponsibility(exp.id, ri)}
                            className="text-red-400 hover:text-red-600 text-sm"
                            title="Remove"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addResponsibility(exp.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Add bullet point
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addExperience} className={btnSecondary}>
              + Add Work Experience
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
        <SectionHeader
          title="Education"
          open={openSections.education}
          onToggle={() => toggle('education')}
        />
        {openSections.education && (
          <div className="pb-6 space-y-6">
            {resume.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4"
                data-testid={`education-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Education {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className={btnDanger}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Institution</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="University of California"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Degree</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Bachelor of Science"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Field of Study</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Business Administration"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="City, State"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Sep 2016"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className={`${inputClass} ${edu.current ? 'opacity-50' : ''}`}
                        placeholder="Jun 2020"
                        value={edu.current ? 'Present' : edu.endDate}
                        disabled={edu.current}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={edu.current}
                          onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
                        />
                        Current
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addEducation} className={btnSecondary}>
              + Add Education
            </button>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
        <SectionHeader
          title="Skills"
          open={openSections.skills}
          onToggle={() => toggle('skills')}
        />
        {openSections.skills && (
          <div className="pb-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm px-3 py-1 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 ml-1"
                    title="Remove skill"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className={`${inputClass} flex-1`}
                placeholder="Type a skill and press Enter or click Add..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button type="button" onClick={addSkill} className={btnSecondary}>
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
        <SectionHeader
          title="Certifications"
          open={openSections.certifications}
          onToggle={() => toggle('certifications')}
        />
        {openSections.certifications && (
          <div className="pb-6 space-y-6">
            {resume.certifications.map((cert, idx) => (
              <div
                key={cert.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4"
                data-testid={`certification-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Certification {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className={btnDanger}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Certification Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="AWS Solutions Architect"
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Issuing Organization</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Amazon Web Services"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date Obtained</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Mar 2023"
                      value={cert.dateObtained}
                      onChange={(e) => updateCertification(cert.id, 'dateObtained', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expiration Date</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Mar 2026 (leave blank if none)"
                      value={cert.expirationDate}
                      onChange={(e) =>
                        updateCertification(cert.id, 'expirationDate', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addCertification} className={btnSecondary}>
              + Add Certification
            </button>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {uploading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-testid="processing-modal"
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
              Parsing with AI...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Extracting resume data with Gemini. This may take a few seconds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

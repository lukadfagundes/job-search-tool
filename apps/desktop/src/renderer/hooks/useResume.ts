import { useState, useEffect, useCallback } from 'react';

// Re-export types for backward compatibility
export type {
  ResumeData,
  WorkExperience,
  Education,
  Certification,
} from '../../shared/resume-types.ts';
export { generateId, EMPTY_RESUME } from '../../shared/resume-types.ts';

import { EMPTY_RESUME } from '../../shared/resume-types.ts';
import type { ResumeData } from '../../shared/resume-types.ts';

export function useResume() {
  const [resume, setResume] = useState<ResumeData>(EMPTY_RESUME);
  const [savedResume, setSavedResume] = useState<ResumeData>(EMPTY_RESUME);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Load on mount
  useEffect(() => {
    window.electronAPI.loadResume().then((result) => {
      if (result.data) {
        const loadedData = { ...EMPTY_RESUME, ...(result.data as Partial<ResumeData>) };
        setResume(loadedData);
        setSavedResume(loadedData);
        setHasSaved(true);
      }
      setLoaded(true);
    });
  }, []);

  // Update resume state (no auto-save, just marks dirty)
  const updateResume = useCallback((updater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setResume((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setDirty(true);
  }, []);

  // Manual save
  const save = useCallback(async () => {
    setSaving(true);
    await window.electronAPI.saveResume(resume as unknown as Record<string, unknown>);
    setSavedResume(resume);
    setDirty(false);
    setHasSaved(true);
    setSaving(false);
  }, [resume]);

  // Reset to last saved state
  const reset = useCallback(() => {
    setResume(savedResume);
    setDirty(false);
  }, [savedResume]);

  // Import parsed resume data (merges into current state)
  const importResume = useCallback((data: Partial<ResumeData>) => {
    setResume((prev) => {
      const merged: ResumeData = { ...prev };

      if (data.personalInfo) {
        merged.personalInfo = { ...prev.personalInfo };
        for (const [key, value] of Object.entries(data.personalInfo)) {
          if (value) {
            (merged.personalInfo as Record<string, string>)[key] = value;
          }
        }
      }

      if (data.workExperience?.length) {
        merged.workExperience = [...prev.workExperience, ...data.workExperience];
      }
      if (data.education?.length) {
        merged.education = [...prev.education, ...data.education];
      }
      if (data.skills?.length) {
        const existingLower = new Set(prev.skills.map((s) => s.toLowerCase()));
        const newSkills = data.skills.filter((s) => !existingLower.has(s.toLowerCase()));
        merged.skills = [...prev.skills, ...newSkills];
      }
      if (data.certifications?.length) {
        merged.certifications = [...prev.certifications, ...data.certifications];
      }

      return merged;
    });
    setDirty(true);
  }, []);

  return { resume, updateResume, loaded, saving, dirty, hasSaved, save, reset, importResume };
}

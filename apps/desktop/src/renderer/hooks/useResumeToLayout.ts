import { useCallback } from 'react';
import type { ResumeData } from '../../shared/resume-types.ts';
import type { LayoutElement, TextProps } from '../../shared/layout-types.ts';

/**
 * Maps ResumeData fields into existing LayoutElements that have dataBinding props.
 * Returns a new elements array with text populated from resume data.
 */
export function useResumeToLayout() {
  const applyResumeToElements = useCallback(
    (elements: LayoutElement[], resume: ResumeData | null): LayoutElement[] => {
      if (!resume) return elements;

      return elements.map((el) => {
        if (el.type !== 'text') return el;
        const textProps = el.props as TextProps;
        if (!textProps.dataBinding) return el;

        const value = resolveBinding(textProps.dataBinding, resume);
        if (value === null) return el;

        return {
          ...el,
          props: { ...textProps, text: value },
        };
      });
    },
    []
  );

  const extractResumeFromElements = useCallback(
    (elements: LayoutElement[], resume: ResumeData): ResumeData => {
      const updated = JSON.parse(JSON.stringify(resume)) as ResumeData;

      for (const el of elements) {
        if (el.type !== 'text') continue;
        const textProps = el.props as TextProps;
        if (!textProps.dataBinding) continue;

        writeBinding(textProps.dataBinding, updated, textProps.text);
      }

      return updated;
    },
    []
  );

  return { applyResumeToElements, extractResumeFromElements };
}

function resolveBinding(path: string, resume: ResumeData): string | null {
  // Simple dot-path for personalInfo fields
  if (path.startsWith('personalInfo.')) {
    const field = path.replace('personalInfo.', '') as keyof ResumeData['personalInfo'];
    return (resume.personalInfo[field] as string) ?? '';
  }

  // Array-type bindings get formatted as text
  if (path === 'skills') {
    if (!resume.skills.length) return null;
    return resume.skills.map((s) => `\u2022 ${s}`).join('\n');
  }

  if (path === 'education') {
    if (!resume.education.length) return null;
    return resume.education
      .map((e) => {
        const dateRange = e.current ? `${e.startDate} - Present` : `${e.startDate} - ${e.endDate}`;
        return `${e.degree} in ${e.fieldOfStudy}\n${e.institution}\n${dateRange}`;
      })
      .join('\n\n');
  }

  if (path === 'workExperience') {
    if (!resume.workExperience.length) return null;
    return resume.workExperience
      .map((w) => {
        const dateRange = w.current ? `${w.startDate} - Present` : `${w.startDate} - ${w.endDate}`;
        const header = `${w.jobTitle} at ${w.company}\n${w.location} | ${dateRange}`;
        const bullets = w.responsibilities.map((r) => `\u2022 ${r}`).join('\n');
        return bullets ? `${header}\n${bullets}` : header;
      })
      .join('\n\n');
  }

  if (path === 'certifications') {
    if (!resume.certifications.length) return null;
    return resume.certifications
      .map((c) => `${c.name} - ${c.issuer} (${c.dateObtained})`)
      .join('\n');
  }

  return null;
}

function writeBinding(path: string, resume: ResumeData, value: string): void {
  if (path.startsWith('personalInfo.')) {
    const field = path.replace('personalInfo.', '') as keyof ResumeData['personalInfo'];
    (resume.personalInfo as Record<string, string>)[field] = value;
  }
  // For array types, we don't write back (too complex to parse formatted text)
}

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResumeToLayout } from '../../renderer/hooks/useResumeToLayout.ts';
import type { ResumeData } from '../../shared/resume-types.ts';
import type { LayoutElement, TextProps, ShapeProps } from '../../shared/layout-types.ts';

function makeTextElement(id: string, dataBinding?: string): LayoutElement {
  return {
    id,
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    props: {
      text: 'placeholder',
      fontFamily: 'Helvetica',
      fontSize: 12,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const,
      fill: '#000',
      align: 'left' as const,
      lineHeight: 1.2,
      letterSpacing: 0,
      dataBinding,
    } as TextProps,
  };
}

function makeShapeElement(id: string): LayoutElement {
  return {
    id,
    type: 'shape',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    props: {
      shapeType: 'rect' as const,
      fill: '#000',
      stroke: '#000',
      strokeWidth: 0,
      opacity: 1,
      cornerRadius: 0,
    } as ShapeProps,
  };
}

const mockResume: ResumeData = {
  personalInfo: {
    fullName: 'Jane Doe',
    jobTitle: 'Software Engineer',
    email: 'jane@example.com',
    phone: '555-1234',
    location: 'New York, NY',
    website: 'https://jane.dev',
    linkedin: 'linkedin.com/in/jane',
  },
  skills: ['TypeScript', 'React', 'Node.js'],
  education: [
    {
      id: '1',
      institution: 'MIT',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      location: 'Cambridge',
      startDate: '2018',
      endDate: '2022',
      current: false,
    },
  ],
  workExperience: [
    {
      id: '1',
      jobTitle: 'Dev',
      company: 'Acme',
      location: 'NYC',
      startDate: 'Jan 2022',
      endDate: '',
      current: true,
      responsibilities: ['Built stuff', 'Fixed bugs'],
    },
  ],
  certifications: [
    { id: '1', name: 'AWS SAA', issuer: 'Amazon', dateObtained: '2023', expirationDate: '2026' },
  ],
};

describe('useResumeToLayout', () => {
  describe('applyResumeToElements', () => {
    it('returns elements unchanged when resume is null', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'personalInfo.fullName')];
      const output = result.current.applyResumeToElements(elements, null);
      expect(output).toEqual(elements);
    });

    it('populates personalInfo.fullName binding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'personalInfo.fullName')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toBe('Jane Doe');
    });

    it('populates personalInfo.email binding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'personalInfo.email')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toBe('jane@example.com');
    });

    it('populates skills as bullet list', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'skills')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toContain('\u2022 TypeScript');
      expect((output[0].props as TextProps).text).toContain('\u2022 React');
      expect((output[0].props as TextProps).text).toContain('\u2022 Node.js');
    });

    it('returns null text for empty skills', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'skills')];
      const emptyResume = { ...mockResume, skills: [] };
      const output = result.current.applyResumeToElements(elements, emptyResume);
      // When resolveBinding returns null, element is returned unchanged
      expect((output[0].props as TextProps).text).toBe('placeholder');
    });

    it('populates education binding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'education')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      const text = (output[0].props as TextProps).text;
      expect(text).toContain('BS in Computer Science');
      expect(text).toContain('MIT');
      expect(text).toContain('2018 - 2022');
    });

    it('populates workExperience binding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'workExperience')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      const text = (output[0].props as TextProps).text;
      expect(text).toContain('Dev at Acme');
      expect(text).toContain('Present');
      expect(text).toContain('\u2022 Built stuff');
    });

    it('populates certifications binding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'certifications')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toContain('AWS SAA - Amazon (2023)');
    });

    it('skips non-text elements', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const shape = makeShapeElement('s1');
      const output = result.current.applyResumeToElements([shape], mockResume);
      expect(output[0]).toEqual(shape);
    });

    it('skips text elements without dataBinding', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a')]; // no dataBinding
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toBe('placeholder');
    });

    it('returns element unchanged for unknown binding path', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'nonexistent.path')];
      const output = result.current.applyResumeToElements(elements, mockResume);
      expect((output[0].props as TextProps).text).toBe('placeholder');
    });

    it('handles education with current=true', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'education')];
      const resume = {
        ...mockResume,
        education: [
          {
            ...mockResume.education[0],
            current: true,
          },
        ],
      };
      const output = result.current.applyResumeToElements(elements, resume);
      expect((output[0].props as TextProps).text).toContain('Present');
    });

    it('handles workExperience with no responsibilities', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeTextElement('a', 'workExperience')];
      const resume = {
        ...mockResume,
        workExperience: [
          {
            ...mockResume.workExperience[0],
            responsibilities: [],
          },
        ],
      };
      const output = result.current.applyResumeToElements(elements, resume);
      const text = (output[0].props as TextProps).text;
      expect(text).toContain('Dev at Acme');
      expect(text).not.toContain('\u2022');
    });
  });

  describe('extractResumeFromElements', () => {
    it('writes personalInfo fields back', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [
        {
          ...makeTextElement('a', 'personalInfo.fullName'),
          props: {
            ...makeTextElement('a', 'personalInfo.fullName').props,
            text: 'Updated Name',
          } as TextProps,
        },
      ];
      const updated = result.current.extractResumeFromElements(elements, mockResume);
      expect(updated.personalInfo.fullName).toBe('Updated Name');
    });

    it('does not modify non-personalInfo bindings', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [
        {
          ...makeTextElement('a', 'skills'),
          props: {
            ...makeTextElement('a', 'skills').props,
            text: 'modified',
          } as TextProps,
        },
      ];
      const updated = result.current.extractResumeFromElements(elements, mockResume);
      // Skills array should remain the same (write-back only for personalInfo)
      expect(updated.skills).toEqual(mockResume.skills);
    });

    it('skips non-text elements', () => {
      const { result } = renderHook(() => useResumeToLayout());
      const elements = [makeShapeElement('s1')];
      const updated = result.current.extractResumeFromElements(elements, mockResume);
      expect(updated).toEqual(mockResume);
    });
  });
});

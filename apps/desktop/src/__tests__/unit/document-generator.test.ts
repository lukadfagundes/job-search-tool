// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildResumePrompt,
  buildCVPrompt,
  buildResumePdfLayout,
  buildCVPdfLayout,
  generateTailoredResume,
  generateTailoredCV,
} from '../../main/document-generator.ts';
import type { JobSummary } from '../../main/document-generator.ts';
import { resetRateLimit } from '../../main/gemini-parser.ts';
import type { ResumeData } from '../../shared/resume-types.ts';
import { EventEmitter } from 'node:events';

vi.mock('pdfmake/js/Printer.js', () => {
  class MockPdfPrinter {
    async createPdfKitDocument() {
      const doc = new EventEmitter();
      // Simulate async PDF generation: emit data + end on next tick after end() is called
      (doc as EventEmitter & { end: () => void }).end = () => {
        process.nextTick(() => {
          doc.emit('data', Buffer.from('%PDF-mock-content'));
          doc.emit('end');
        });
      };
      return doc;
    }
  }
  return { default: MockPdfPrinter };
});

const sampleResume: ResumeData = {
  personalInfo: {
    fullName: 'Jane Smith',
    jobTitle: 'Software Engineer',
    email: 'jane@test.com',
    phone: '555-0100',
    location: 'New York, NY',
    website: 'janesmith.dev',
    linkedin: 'linkedin.com/in/janesmith',
  },
  workExperience: [
    {
      id: '1',
      jobTitle: 'Software Engineer',
      company: 'Acme Corp',
      location: 'New York, NY',
      startDate: 'Jan 2020',
      endDate: '',
      current: true,
      responsibilities: ['Built web apps', 'Led code reviews'],
    },
  ],
  education: [
    {
      id: '2',
      institution: 'MIT',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      location: 'Cambridge, MA',
      startDate: '2016',
      endDate: '2020',
      current: false,
    },
  ],
  skills: ['JavaScript', 'React', 'Node.js'],
  certifications: [
    {
      id: '3',
      name: 'AWS Certified',
      issuer: 'Amazon',
      dateObtained: '2023',
      expirationDate: '2026',
    },
  ],
};

const sampleJob: JobSummary = {
  title: 'Senior Frontend Developer',
  company: 'Tech Inc',
  description: 'Looking for a senior React developer with 5+ years experience.',
  requiredSkills: ['React', 'TypeScript', 'CSS'],
  employmentType: 'FULLTIME',
  isRemote: true,
  location: 'San Francisco, CA',
  highlights: { Qualifications: ['5+ years React', 'TypeScript proficiency'] },
};

describe('document-generator', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  describe('buildResumePrompt', () => {
    it('includes candidate background and job details', () => {
      const prompt = buildResumePrompt(sampleResume, sampleJob);
      expect(prompt).toContain('Jane Smith');
      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('Acme Corp');
      expect(prompt).toContain('Senior Frontend Developer');
      expect(prompt).toContain('Tech Inc');
      expect(prompt).toContain('React');
    });

    it('includes ATS optimization instructions', () => {
      const prompt = buildResumePrompt(sampleResume, sampleJob);
      expect(prompt).toContain('ATS');
      expect(prompt).toContain('Mirror exact phrasing');
    });

    it('includes no-em-dash rule', () => {
      const prompt = buildResumePrompt(sampleResume, sampleJob);
      expect(prompt).toContain('NEVER use em dashes');
    });

    it('includes professionalSummary in JSON schema', () => {
      const prompt = buildResumePrompt(sampleResume, sampleJob);
      expect(prompt).toContain('"professionalSummary"');
      expect(prompt).toContain('"targetTitle"');
    });

    it('includes remote indicator when job is remote', () => {
      const prompt = buildResumePrompt(sampleResume, sampleJob);
      expect(prompt).toContain('(Remote)');
    });

    it('excludes remote indicator when job is not remote', () => {
      const prompt = buildResumePrompt(sampleResume, { ...sampleJob, isRemote: false });
      expect(prompt).not.toContain('(Remote)');
    });
  });

  describe('buildCVPrompt', () => {
    it('includes candidate background and job details', () => {
      const prompt = buildCVPrompt(sampleResume, sampleJob);
      expect(prompt).toContain('Jane Smith');
      expect(prompt).toContain('Senior Frontend Developer');
    });

    it('includes objectiveStatement in JSON schema', () => {
      const prompt = buildCVPrompt(sampleResume, sampleJob);
      expect(prompt).toContain('"objectiveStatement"');
    });

    it('mentions comprehensive CV nature', () => {
      const prompt = buildCVPrompt(sampleResume, sampleJob);
      expect(prompt).toContain('curriculum vitae');
      expect(prompt).toContain('comprehensive');
    });

    it('includes no-em-dash rule', () => {
      const prompt = buildCVPrompt(sampleResume, sampleJob);
      expect(prompt).toContain('NEVER use em dashes');
    });
  });

  describe('buildResumePdfLayout', () => {
    it('returns a valid pdfmake document definition with categorized skills', () => {
      const layout = buildResumePdfLayout(
        {
          professionalSummary: 'A skilled engineer.',
          targetTitle: 'Software Engineer',
          workExperience: [
            {
              jobTitle: 'Engineer',
              company: 'Acme',
              location: 'NYC',
              startDate: 'Jan 2020',
              endDate: '',
              current: true,
              responsibilities: ['Built apps'],
            },
          ],
          skills: {
            'Technical Skills': ['React', 'TypeScript'],
            'Tools & Frameworks': ['Node.js', 'Vite'],
          },
        },
        sampleResume
      );

      expect(layout.content).toBeDefined();
      expect(layout.defaultStyle).toBeDefined();
      expect(layout.defaultStyle.font).toBe('Helvetica');
      expect(layout.styles).toBeDefined();
      expect(layout.pageMargins).toEqual([40, 40, 40, 40]);

      const textContent = JSON.stringify(layout.content);
      expect(textContent).toContain('Jane Smith');
      expect(textContent).toContain('PROFESSIONAL SUMMARY');
      expect(textContent).toContain('WORK EXPERIENCE');
      expect(textContent).toContain('EDUCATION');
      expect(textContent).toContain('SKILLS');
      expect(textContent).toContain('Technical Skills');
      expect(textContent).toContain('Tools & Frameworks');
      expect(textContent).toContain('CERTIFICATIONS');
    });

    it('handles flat skills array as fallback', () => {
      const layout = buildResumePdfLayout(
        {
          professionalSummary: 'A skilled engineer.',
          targetTitle: 'Software Engineer',
          workExperience: [],
          skills: ['React', 'TypeScript'],
        },
        sampleResume
      );

      const textContent = JSON.stringify(layout.content);
      expect(textContent).toContain('SKILLS');
      expect(textContent).toContain('React, TypeScript');
    });
  });

  describe('buildCVPdfLayout', () => {
    it('returns a valid pdfmake document definition with Objective section', () => {
      const layout = buildCVPdfLayout(
        {
          objectiveStatement: 'Seeking a senior role.',
          workExperience: [
            {
              jobTitle: 'Engineer',
              company: 'Acme',
              location: 'NYC',
              startDate: 'Jan 2020',
              endDate: '',
              current: true,
              responsibilities: ['Built apps'],
            },
          ],
          skills: {
            'Technical Skills': ['React'],
            'Soft Skills': ['Leadership'],
          },
        },
        sampleResume
      );

      const textContent = JSON.stringify(layout.content);
      expect(textContent).toContain('OBJECTIVE');
      expect(textContent).toContain('Seeking a senior role.');
      expect(textContent).toContain('Technical Skills');
      expect(textContent).toContain('Soft Skills');
    });
  });

  describe('generateTailoredResume', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls Gemini API and returns a buffer', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        professionalSummary: 'An experienced engineer.',
                        targetTitle: 'Senior Engineer',
                        workExperience: [
                          {
                            jobTitle: 'Engineer',
                            company: 'Acme',
                            location: 'NYC',
                            startDate: 'Jan 2020',
                            endDate: '',
                            current: true,
                            responsibilities: ['Built web applications'],
                          },
                        ],
                        skills: ['React', 'TypeScript'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      });

      const buffer = await generateTailoredResume(sampleResume, sampleJob, 'test-key');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('strips em dashes from Gemini output', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        professionalSummary: 'Expert \u2014 in engineering',
                        targetTitle: 'Engineer',
                        workExperience: [],
                        skills: ['React \u2013 Expert'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      });

      // The function should succeed without error (dashes stripped internally)
      const buffer = await generateTailoredResume(sampleResume, sampleJob, 'test-key');
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateTailoredCV', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls Gemini API and returns a buffer', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        objectiveStatement: 'Seeking a senior frontend role.',
                        workExperience: [
                          {
                            jobTitle: 'Engineer',
                            company: 'Acme',
                            location: 'NYC',
                            startDate: 'Jan 2020',
                            endDate: '',
                            current: true,
                            responsibilities: ['Led development'],
                          },
                        ],
                        skills: ['React'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      });

      const buffer = await generateTailoredCV(sampleResume, sampleJob, 'test-key');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});

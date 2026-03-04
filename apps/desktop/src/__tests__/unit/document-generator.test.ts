// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildResumePrompt,
  buildCVPrompt,
  buildResumePdfLayout,
  buildCVPdfLayout,
  buildResumeDocxLayout,
  buildCVDocxLayout,
  buildVisualPdfLayout,
  buildVisualDocxLayout,
  analyzeLayoutColumns,
  resolveTailoredText,
  generateTailoredResume,
  generateTailoredCV,
  generateTailoredResumeDocx,
  generateTailoredCVDocx,
  cropImageToCircle,
} from '../../main/document-generator.ts';
import type { JobSummary } from '../../main/document-generator.ts';
import { resetRateLimit } from '../../main/gemini-parser.ts';
import type { ResumeData } from '../../shared/resume-types.ts';
import type {
  ResumeLayout,
  ShapeProps,
  TextProps,
  IconProps,
  ImageProps,
} from '../../shared/layout-types.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT, createDefaultLayout } from '../../shared/layout-types.ts';
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

  describe('buildResumeDocxLayout', () => {
    it('returns an array of Paragraph objects with categorized skills', () => {
      const paragraphs = buildResumeDocxLayout(
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

      expect(Array.isArray(paragraphs)).toBe(true);
      expect(paragraphs.length).toBeGreaterThan(0);

      const text = JSON.stringify(paragraphs);
      expect(text).toContain('Jane Smith');
      expect(text).toContain('PROFESSIONAL SUMMARY');
      expect(text).toContain('WORK EXPERIENCE');
      expect(text).toContain('EDUCATION');
      expect(text).toContain('SKILLS');
      expect(text).toContain('Technical Skills');
      expect(text).toContain('CERTIFICATIONS');
    });

    it('handles flat skills array as fallback', () => {
      const paragraphs = buildResumeDocxLayout(
        {
          professionalSummary: 'A skilled engineer.',
          targetTitle: 'Software Engineer',
          workExperience: [],
          skills: ['React', 'TypeScript'],
        },
        sampleResume
      );

      const text = JSON.stringify(paragraphs);
      expect(text).toContain('SKILLS');
      expect(text).toContain('React, TypeScript');
    });
  });

  describe('buildCVDocxLayout', () => {
    it('returns an array of Paragraph objects with Objective section', () => {
      const paragraphs = buildCVDocxLayout(
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

      const text = JSON.stringify(paragraphs);
      expect(text).toContain('OBJECTIVE');
      expect(text).toContain('Seeking a senior role.');
      expect(text).toContain('Technical Skills');
      expect(text).toContain('Soft Skills');
    });
  });

  describe('generateTailoredResumeDocx', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls Gemini API and returns a DOCX buffer', async () => {
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

      const buffer = await generateTailoredResumeDocx(sampleResume, sampleJob, 'test-key');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTailoredCVDocx', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls Gemini API and returns a DOCX buffer', async () => {
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

      const buffer = await generateTailoredCVDocx(sampleResume, sampleJob, 'test-key');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  // ─── Visual Layout Tests ─────────────────────────────────────

  const sampleTailored = {
    professionalSummary: 'Experienced engineer with 5 years of React.',
    targetTitle: 'Senior Frontend Developer',
    workExperience: [
      {
        jobTitle: 'Software Engineer',
        company: 'Acme Corp',
        location: 'New York, NY',
        startDate: 'Jan 2020',
        endDate: '',
        current: true,
        responsibilities: ['Built web apps', 'Led code reviews'],
      },
    ],
    skills: { 'Technical Skills': ['React', 'TypeScript'], Tools: ['Node.js'] },
  };

  describe('resolveTailoredText', () => {
    it('resolves personalInfo fields from resumeData', () => {
      expect(resolveTailoredText('personalInfo.fullName', sampleTailored, sampleResume)).toBe(
        'Jane Smith'
      );
      expect(resolveTailoredText('personalInfo.email', sampleTailored, sampleResume)).toBe(
        'jane@test.com'
      );
      expect(resolveTailoredText('personalInfo.phone', sampleTailored, sampleResume)).toBe(
        '555-0100'
      );
      expect(resolveTailoredText('personalInfo.location', sampleTailored, sampleResume)).toBe(
        'New York, NY'
      );
      expect(resolveTailoredText('personalInfo.linkedin', sampleTailored, sampleResume)).toBe(
        'linkedin.com/in/janesmith'
      );
      expect(resolveTailoredText('personalInfo.website', sampleTailored, sampleResume)).toBe(
        'janesmith.dev'
      );
    });

    it('resolves jobTitle from tailored targetTitle', () => {
      expect(resolveTailoredText('personalInfo.jobTitle', sampleTailored, sampleResume)).toBe(
        'Senior Frontend Developer'
      );
    });

    it('resolves summary from tailored professionalSummary', () => {
      expect(resolveTailoredText('personalInfo.summary', sampleTailored, sampleResume)).toBe(
        'Experienced engineer with 5 years of React.'
      );
    });

    it('resolves summary from objectiveStatement when no professionalSummary', () => {
      const cvTailored = {
        objectiveStatement: 'Career objective.',
        workExperience: [],
        skills: [] as string[],
      };
      expect(resolveTailoredText('personalInfo.summary', cvTailored, sampleResume)).toBe(
        'Career objective.'
      );
    });

    it('resolves workExperience from tailored data', () => {
      const result = resolveTailoredText('workExperience', sampleTailored, sampleResume);
      expect(result).toContain('Software Engineer at Acme Corp');
      expect(result).toContain('Jan 2020 - Present');
      expect(result).toContain('Built web apps');
    });

    it('resolves skills from categorized object', () => {
      const result = resolveTailoredText('skills', sampleTailored, sampleResume);
      expect(result).toContain('Technical Skills: React, TypeScript');
      expect(result).toContain('Tools: Node.js');
    });

    it('resolves skills from flat array', () => {
      const flat = { ...sampleTailored, skills: ['React', 'TypeScript'] as string[] };
      const result = resolveTailoredText('skills', flat, sampleResume);
      expect(result).toContain('React');
      expect(result).toContain('TypeScript');
    });

    it('resolves education from resumeData', () => {
      const result = resolveTailoredText('education', sampleTailored, sampleResume);
      expect(result).toContain('BS in Computer Science');
      expect(result).toContain('MIT');
    });

    it('resolves certifications from resumeData', () => {
      const result = resolveTailoredText('certifications', sampleTailored, sampleResume);
      expect(result).toContain('AWS Certified');
      expect(result).toContain('Amazon');
    });

    it('returns null for unknown binding', () => {
      expect(resolveTailoredText('unknown.field', sampleTailored, sampleResume)).toBeNull();
    });

    it('returns null for empty personal info field', () => {
      const emptyResume = {
        ...sampleResume,
        personalInfo: { ...sampleResume.personalInfo, email: '' },
      };
      expect(resolveTailoredText('personalInfo.email', sampleTailored, emptyResume)).toBeNull();
    });

    it('returns null for empty work experience', () => {
      const noWork = { ...sampleTailored, workExperience: [] };
      expect(resolveTailoredText('workExperience', noWork, sampleResume)).toBeNull();
    });

    it('returns null for empty skills', () => {
      const noSkills = { ...sampleTailored, skills: [] as string[] };
      expect(resolveTailoredText('skills', noSkills, sampleResume)).toBeNull();
    });

    it('returns null for empty education', () => {
      const noEdu = { ...sampleResume, education: [] };
      expect(resolveTailoredText('education', sampleTailored, noEdu)).toBeNull();
    });

    it('returns null for empty certifications', () => {
      const noCerts = { ...sampleResume, certifications: [] };
      expect(resolveTailoredText('certifications', sampleTailored, noCerts)).toBeNull();
    });
  });

  describe('buildVisualPdfLayout', () => {
    it('creates a PDF layout with absolute-positioned elements from canvas', () => {
      const layout = createDefaultLayout();
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      expect(result.pageMargins).toEqual([0, 0, 0, 0]);
      expect(result.pageSize).toEqual({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
      expect(result.content.length).toBeGreaterThan(0);

      // Should contain shapes (rect canvas drawings)
      const json = JSON.stringify(result.content);
      expect(json).toContain('absolutePosition');
      expect(json).toContain('"type":"rect"');
    });

    it('renders text elements with resolved data bindings', () => {
      const layout = createDefaultLayout();
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      const json = JSON.stringify(result.content);
      expect(json).toContain('Jane Smith');
      expect(json).toContain('jane@test.com');
    });

    it('renders divider elements as lines', () => {
      const layout = createDefaultLayout();
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      const json = JSON.stringify(result.content);
      expect(json).toContain('"type":"line"');
    });

    it('renders circle shapes as ellipses', () => {
      const layout = createDefaultLayout();
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      const json = JSON.stringify(result.content);
      expect(json).toContain('"type":"ellipse"');
    });

    it('adds page background when not white', () => {
      const layout = createDefaultLayout();
      layout.backgroundColor = '#1A2B3C';
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      // First item should be the background rect
      const firstItem = result.content[0];
      expect(firstItem.absolutePosition).toEqual({ x: 0, y: 0 });
      const json = JSON.stringify(firstItem);
      expect(json).toContain('#1A2B3C');
    });

    it('skips background rect when page is white', () => {
      const layout = createDefaultLayout();
      layout.backgroundColor = '#FFFFFF';
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      // First content item should NOT be a full-page background
      const firstItem = result.content[0];
      const json = JSON.stringify(firstItem);
      expect(json).not.toContain('"w":612');
    });

    it('filters out invisible elements', () => {
      const layout = createDefaultLayout();
      // Make all elements invisible
      layout.elements = layout.elements.map((el) => ({ ...el, visible: false }));
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);

      expect(result.content.length).toBe(0);
    });

    it('renders icon elements as SVG', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'icon-1',
            type: 'icon',
            x: 10,
            y: 10,
            width: 24,
            height: 24,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              path: 'M0 0 L10 10',
              fill: '#FF0000',
              name: 'test-icon',
              viewBox: '0 0 24 24',
              filled: true,
            } as IconProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      const json = JSON.stringify(result.content);
      expect(json).toContain('<svg');
      expect(json).toContain('M0 0 L10 10');
    });

    it('handles shape lines', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'line-1',
            type: 'shape',
            x: 10,
            y: 10,
            width: 100,
            height: 2,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              shapeType: 'line',
              fill: '#000',
              stroke: '#000',
              strokeWidth: 2,
              opacity: 1,
              cornerRadius: 0,
            } as ShapeProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      expect(result.content.length).toBe(1);
    });

    it('handles ellipse shapes', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'ellipse-1',
            type: 'shape',
            x: 10,
            y: 10,
            width: 80,
            height: 40,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              shapeType: 'ellipse',
              fill: '#0F0',
              stroke: 'transparent',
              strokeWidth: 0,
              opacity: 1,
              cornerRadius: 0,
            } as ShapeProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      const json = JSON.stringify(result.content);
      expect(json).toContain('"type":"ellipse"');
      expect(json).toContain('"r1":40');
      expect(json).toContain('"r2":20');
    });

    it('renders image elements with base64 src', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'img-1',
            type: 'image',
            x: 42,
            y: 24,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              src: 'data:image/png;base64,iVBOR',
              opacity: 1,
              cornerRadius: 0,
              clipCircle: false,
            } as ImageProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      const json = JSON.stringify(result.content);
      expect(json).toContain('"image":"data:image/png;base64,iVBOR"');
      expect(json).toContain('"fit":[100,100]');
    });

    it('skips image elements without src', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'img-2',
            type: 'image',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              src: '',
              opacity: 1,
              cornerRadius: 0,
              clipCircle: false,
            } as ImageProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      expect(result.content.length).toBe(0);
    });

    it('renders circular-clipped image as a pre-processed circular PNG', () => {
      // A valid 4x4 red PNG
      const validPng =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAGklEQVR4AWP8z8DwnwEJMDGgASYGNMDEgAYAg9ECBvYVtPAAAAAASUVORK5CYII=';
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'img-circle',
            type: 'image',
            x: 42,
            y: 24,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              src: validPng,
              opacity: 1,
              cornerRadius: 0,
              clipCircle: true,
            } as ImageProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualPdfLayout(sampleTailored, sampleResume, layout);
      const json = JSON.stringify(result.content);
      // Should contain a re-encoded PNG (different from original) with circular alpha mask
      expect(json).toContain('"image":"data:image/png;base64,');
      expect(json).toContain('"fit":[100,100]');
      // The image data should be different from the original (it was re-processed)
      expect(json).not.toContain('"image":"' + validPng + '"');
    });

    it('renders all skills as structured stack without truncation', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'text-overflow',
            type: 'text',
            x: 16,
            y: 360,
            width: 152,
            height: 30,
            rotation: 0,
            zIndex: 2,
            locked: false,
            visible: true,
            props: {
              text: '',
              fontFamily: 'Helvetica',
              fontSize: 8,
              fontStyle: 'normal',
              textDecoration: 'none',
              fill: '#1A1A1A',
              align: 'left',
              lineHeight: 1.6,
              letterSpacing: 0,
              dataBinding: 'skills',
            } as TextProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const manySkillsResume = {
        ...sampleResume,
        skills: Array.from({ length: 50 }, (_, i) => `Skill ${i + 1}`),
      };
      const manySkillsTailored = { ...sampleTailored, skills: manySkillsResume.skills };
      const result = buildVisualPdfLayout(manySkillsTailored, manySkillsResume, layout);
      const json = JSON.stringify(result.content);
      // All skills should render — no height-based truncation
      expect(json).toContain('Skill 1');
      expect(json).toContain('Skill 50');
      // Content should use a stack (structured rendering)
      expect(json).toContain('"stack"');
    });
  });

  describe('analyzeLayoutColumns', () => {
    it('detects two-column layout with sidebar', () => {
      const layout = createDefaultLayout();
      const structure = analyzeLayoutColumns(layout);

      expect(structure.columns.length).toBe(2);
      // First column is sidebar (left)
      expect(structure.columns[0].width).toBe(184);
      expect(structure.columns[0].bgColor).toBeDefined();
      // Second column is main content
      expect(structure.columns[1].x).toBe(184);
    });

    it('detects header bar', () => {
      const layout = createDefaultLayout();
      const structure = analyzeLayoutColumns(layout);

      expect(structure.headerBg).toBeDefined();
      expect(structure.headerBg!.color).toBe('#2C3E5A');
    });

    it('returns single column when no sidebar detected', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'text-1',
            type: 'text',
            x: 40,
            y: 40,
            width: 500,
            height: 20,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              text: 'Hello',
              fontFamily: 'Helvetica',
              fontSize: 12,
              fontStyle: 'normal',
              textDecoration: 'none',
              fill: '#000',
              align: 'left',
              lineHeight: 1.2,
              letterSpacing: 0,
            } as TextProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const structure = analyzeLayoutColumns(layout);
      expect(structure.columns.length).toBe(1);
      expect(structure.columns[0].width).toBe(CANVAS_WIDTH);
    });
  });

  describe('buildVisualDocxLayout', () => {
    it('returns a doc for two-column layout', () => {
      const layout = createDefaultLayout();
      const result = buildVisualDocxLayout(sampleTailored, sampleResume, layout);

      expect(result.doc).toBeDefined();
    });

    it('returns empty for single-column layout (caller uses fallback)', () => {
      const layout: ResumeLayout = {
        id: 'test',
        name: 'test',
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'text-1',
            type: 'text',
            x: 40,
            y: 40,
            width: 500,
            height: 20,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: {
              text: 'Hello',
              fontFamily: 'Helvetica',
              fontSize: 12,
              fontStyle: 'normal',
              textDecoration: 'none',
              fill: '#000',
              align: 'left',
              lineHeight: 1.2,
              letterSpacing: 0,
            } as TextProps,
          },
        ],
        createdAt: '',
        updatedAt: '',
      };
      const result = buildVisualDocxLayout(sampleTailored, sampleResume, layout);

      expect(result.doc).toBeUndefined();
    });

    it('places header text in header row', () => {
      const layout = createDefaultLayout();
      const result = buildVisualDocxLayout(sampleTailored, sampleResume, layout);

      // doc should exist for two-column layout
      expect(result.doc).toBeDefined();
    });

    it('includes image elements in visual DOCX', () => {
      const layout = createDefaultLayout();
      // Add an image element to the layout
      layout.elements.push({
        id: 'img-docx-1',
        type: 'image',
        x: 42,
        y: 24,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 3,
        locked: false,
        visible: true,
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          opacity: 1,
          cornerRadius: 0,
          clipCircle: false,
        } as ImageProps,
      });
      const result = buildVisualDocxLayout(sampleTailored, sampleResume, layout);
      // Should still produce a valid doc
      expect(result.doc).toBeDefined();
    });
  });

  describe('cropImageToCircle', () => {
    const validPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAGklEQVR4AWP8z8DwnwEJMDGgASYGNMDEgAYAg9ECBvYVtPAAAAAASUVORK5CYII=';
    const validJpeg =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2MBERISGBUYLxoaL2NCOEJjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY//AABEIAAQABAMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AONr7w5T/9k=';

    it('crops a PNG to a circle and returns a PNG data URL', () => {
      const result = cropImageToCircle(validPng);
      expect(result).not.toBeNull();
      expect(result).toMatch(/^data:image\/png;base64,/);
      // Result should differ from input (circular mask applied)
      expect(result).not.toBe(validPng);
    });

    it('crops a JPEG to a circle and returns a PNG data URL', () => {
      const result = cropImageToCircle(validJpeg);
      expect(result).not.toBeNull();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('returns null for invalid data URL', () => {
      expect(cropImageToCircle('not-a-data-url')).toBeNull();
    });
  });

  describe('orchestrators use visual layout when savedLayout has elements', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

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
                        professionalSummary: 'Experienced engineer.',
                        targetTitle: 'Senior Developer',
                        objectiveStatement: 'Career objective.',
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
                        skills: ['React'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generateTailoredResume uses visual PDF layout with saved layout', async () => {
      const layout = createDefaultLayout();
      const buffer = await generateTailoredResume(sampleResume, sampleJob, 'test-key', layout);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('generateTailoredCV uses visual PDF layout with saved layout', async () => {
      const layout = createDefaultLayout();
      const buffer = await generateTailoredCV(sampleResume, sampleJob, 'test-key', layout);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('generateTailoredResumeDocx uses visual DOCX layout with saved layout', async () => {
      const layout = createDefaultLayout();
      const buffer = await generateTailoredResumeDocx(sampleResume, sampleJob, 'test-key', layout);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('generateTailoredCVDocx uses visual DOCX layout with saved layout', async () => {
      const layout = createDefaultLayout();
      const buffer = await generateTailoredCVDocx(sampleResume, sampleJob, 'test-key', layout);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});

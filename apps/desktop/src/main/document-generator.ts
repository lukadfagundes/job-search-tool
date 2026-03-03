import type { ResumeData, Education, Certification } from '../shared/resume-types.ts';
import { GEMINI_ENDPOINT, enforceRateLimit, recordCall, stripDashes } from './gemini-parser.ts';
import type { GeminiResponse } from './gemini-parser.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobSummary {
  title: string;
  company: string;
  description: string;
  requiredSkills: string[] | null;
  employmentType: string;
  isRemote: boolean;
  location: string;
  highlights: Record<string, string[]> | null;
}

interface TailoredWorkEntry {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
}

interface TailoredResume {
  professionalSummary: string;
  targetTitle: string;
  workExperience: TailoredWorkEntry[];
  skills: Record<string, string[]> | string[];
}

interface TailoredCV {
  objectiveStatement: string;
  workExperience: TailoredWorkEntry[];
  skills: Record<string, string[]> | string[];
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildResumePrompt(resumeData: ResumeData, job: JobSummary): string {
  return `You are an expert resume writer and ATS optimization specialist.

Given the candidate's background and a target job posting, produce a TAILORED resume in JSON format. The resume must be concise (targeting 1-2 pages when formatted) and optimized so that Applicant Tracking Systems (ATS) used by recruiters can parse and score it highly.

CANDIDATE BACKGROUND:
${JSON.stringify(
  {
    personalInfo: resumeData.personalInfo,
    workExperience: resumeData.workExperience.map((w) => ({
      jobTitle: w.jobTitle,
      company: w.company,
      location: w.location,
      startDate: w.startDate,
      endDate: w.endDate,
      current: w.current,
      responsibilities: w.responsibilities,
    })),
    education: resumeData.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
    })),
    skills: resumeData.skills,
    certifications: resumeData.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      dateObtained: c.dateObtained,
      expirationDate: c.expirationDate,
    })),
  },
  null,
  2
)}

TARGET JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.isRemote ? ' (Remote)' : ''}
Type: ${job.employmentType}
Description: ${job.description}
${job.requiredSkills ? `Required Skills: ${job.requiredSkills.join(', ')}` : ''}
${job.highlights ? `Highlights: ${JSON.stringify(job.highlights)}` : ''}

Return a JSON object with this exact structure:
{
  "professionalSummary": "",
  "targetTitle": "",
  "workExperience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "responsibilities": [""]
    }
  ],
  "skills": {
    "Category Name": ["skill1", "skill2"]
  }
}

Rules:
- Write a 2-3 sentence "professionalSummary" tailored to the target role. Highlight the candidate's most relevant experience and achievements for this specific position.
- Set "targetTitle" to the candidate's current job title. Only change it if the candidate's title is significantly different from what the posting seeks AND the candidate's experience genuinely qualifies them for the posted title.
- IMPORTANT: The candidate's "responsibilities" are rough guides describing the general scope of their work, NOT final resume bullet points. You MUST create entirely new, tailored bullet points for each position by: (1) analyzing the target job's requirements, (2) identifying equivalent or transferable job functions from the candidate's experience at each role, and (3) writing achievement-oriented bullets that demonstrate relevant competencies using the job posting's language and keywords. Every bullet should directly connect the candidate's past work to what the target role demands.
- Include measurable achievements where the candidate's original responsibilities support them (numbers, percentages, dollar amounts, team sizes).
- For "skills", return a JSON object (not an array) where each key is a category name (e.g., "Technical Skills", "Tools & Frameworks", "Soft Skills", "Industry Knowledge") and each value is an array of skill strings. Group the candidate's skills into 2-4 logical categories relevant to the target role. Place skills matching the job description first within each category. Only include skills the candidate actually has.
- Mirror exact phrasing from the job description where truthful (e.g., if the posting says "React.js" use "React.js" not "React").
- Spell out acronyms on first use where appropriate.
- Keep all work experience entries from the candidate's background. Do not remove any.
- Preserve all original dates, company names, and locations exactly as provided.
- Do NOT fabricate, exaggerate, or add any information not present in the candidate's background.
- NEVER use em dashes or en dashes. Use hyphens (-) or commas instead.`;
}

export function buildCVPrompt(resumeData: ResumeData, job: JobSummary): string {
  return `You are an expert CV writer and ATS optimization specialist.

Given the candidate's background and a target job posting, produce a TAILORED curriculum vitae (CV) in JSON format. A CV is comprehensive and includes ALL experience, education, and qualifications. It should be thorough while still being optimized for ATS parsing.

CANDIDATE BACKGROUND:
${JSON.stringify(
  {
    personalInfo: resumeData.personalInfo,
    workExperience: resumeData.workExperience.map((w) => ({
      jobTitle: w.jobTitle,
      company: w.company,
      location: w.location,
      startDate: w.startDate,
      endDate: w.endDate,
      current: w.current,
      responsibilities: w.responsibilities,
    })),
    education: resumeData.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
    })),
    skills: resumeData.skills,
    certifications: resumeData.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      dateObtained: c.dateObtained,
      expirationDate: c.expirationDate,
    })),
  },
  null,
  2
)}

TARGET JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.isRemote ? ' (Remote)' : ''}
Type: ${job.employmentType}
Description: ${job.description}
${job.requiredSkills ? `Required Skills: ${job.requiredSkills.join(', ')}` : ''}
${job.highlights ? `Highlights: ${JSON.stringify(job.highlights)}` : ''}

Return a JSON object with this exact structure:
{
  "objectiveStatement": "",
  "workExperience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "responsibilities": [""]
    }
  ],
  "skills": {
    "Category Name": ["skill1", "skill2"]
  }
}

Rules:
- Write a brief "objectiveStatement" (2-3 sentences) expressing the candidate's career goals as they relate to this specific position.
- IMPORTANT: The candidate's "responsibilities" are rough guides describing the general scope of their work, NOT final CV bullet points. You MUST create entirely new, tailored bullet points for each position by: (1) analyzing the target job's requirements, (2) identifying equivalent or transferable job functions from the candidate's experience at each role, and (3) writing achievement-oriented bullets that demonstrate relevant competencies using the job posting's language and keywords. Every bullet should directly connect the candidate's past work to what the target role demands. Since this is a CV, be comprehensive and include more detail than a resume.
- Include ALL work experience entries.
- Include measurable achievements where the candidate's original responsibilities support them.
- For "skills", return a JSON object (not an array) where each key is a category name (e.g., "Technical Skills", "Tools & Frameworks", "Soft Skills", "Industry Knowledge") and each value is an array of skill strings. Group the candidate's skills into 2-4 logical categories relevant to the target role. Place skills matching the job description first within each category. Include all skills the candidate has.
- Mirror exact phrasing from the job description where truthful.
- Preserve all original dates, company names, and locations exactly as provided.
- Do NOT fabricate, exaggerate, or add any information not present in the candidate's background.
- NEVER use em dashes or en dashes. Use hyphens (-) or commas instead.`;
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

async function callGemini<T>(prompt: string, apiKey: string): Promise<T> {
  enforceRateLimit();

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  recordCall();

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const result: GeminiResponse = (await response.json()) as GeminiResponse;

  if (result.error) {
    throw new Error(`Gemini API error: ${result.error.message}`);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Post-processing: strip dashes from all tailored text fields
// ---------------------------------------------------------------------------

function sanitizeTailoredWork(entries: TailoredWorkEntry[]): TailoredWorkEntry[] {
  return entries.map((entry) => ({
    ...entry,
    jobTitle: stripDashes(entry.jobTitle ?? ''),
    company: stripDashes(entry.company ?? ''),
    location: stripDashes(entry.location ?? ''),
    startDate: entry.startDate ?? '',
    endDate: entry.endDate ?? '',
    responsibilities: (entry.responsibilities ?? ['']).map((r) => stripDashes(String(r))),
  }));
}

// ---------------------------------------------------------------------------
// PDF layout builders (pdfmake document definitions)
// ---------------------------------------------------------------------------

interface PdfContent {
  text?: string | PdfContent[];
  style?: string;
  ul?: (string | PdfContent)[];
  columns?: PdfContent[];
  width?: string | number;
  alignment?: string;
  margin?: number[];
  bold?: boolean;
  italics?: boolean;
  fontSize?: number;
  color?: string;
  link?: string;
  decoration?: string;
  canvas?: Array<{
    type: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    lineWidth: number;
    lineColor: string;
  }>;
}

interface PdfDocDefinition {
  content: PdfContent[];
  defaultStyle: { font: string; fontSize: number; lineHeight: number };
  styles: Record<string, Record<string, unknown>>;
  pageMargins: number[];
}

function buildContactHeader(personalInfo: ResumeData['personalInfo']): PdfContent[] {
  const content: PdfContent[] = [];

  content.push({
    text: personalInfo.fullName,
    style: 'name',
    alignment: 'center',
  });

  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);

  if (contactParts.length > 0) {
    content.push({
      text: contactParts.join('  |  '),
      alignment: 'center',
      fontSize: 9,
      color: '#555555',
      margin: [0, 2, 0, 0],
    });
  }

  const linkParts: string[] = [];
  if (personalInfo.linkedin) linkParts.push(personalInfo.linkedin);
  if (personalInfo.website) linkParts.push(personalInfo.website);

  if (linkParts.length > 0) {
    content.push({
      text: linkParts.join('  |  '),
      alignment: 'center',
      fontSize: 9,
      color: '#555555',
      margin: [0, 2, 0, 0],
    });
  }

  // Divider line
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }],
    margin: [0, 5, 0, 5],
  });

  return content;
}

function buildSectionHeader(title: string): PdfContent {
  return {
    text: title.toUpperCase(),
    style: 'sectionHeader',
    margin: [0, 10, 0, 4],
  };
}

function buildWorkEntries(entries: TailoredWorkEntry[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const entry of entries) {
    const dateRange = entry.current
      ? `${entry.startDate} - Present`
      : `${entry.startDate} - ${entry.endDate}`;

    content.push({
      columns: [
        { text: entry.jobTitle, bold: true, width: '*' },
        { text: dateRange, alignment: 'right', width: 'auto', fontSize: 9, color: '#555555' },
      ],
      margin: [0, 4, 0, 0],
    });

    const companyLine = entry.location ? `${entry.company}, ${entry.location}` : entry.company;

    content.push({
      text: companyLine,
      italics: true,
      fontSize: 9,
      color: '#555555',
      margin: [0, 1, 0, 2],
    });

    const bullets = entry.responsibilities.filter((r) => r.trim().length > 0);
    if (bullets.length > 0) {
      content.push({
        ul: bullets,
        margin: [10, 0, 0, 4],
      });
    }
  }

  return content;
}

function buildEducationEntries(entries: Education[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const edu of entries) {
    const dateRange = edu.current
      ? `${edu.startDate} - Present`
      : edu.startDate && edu.endDate
        ? `${edu.startDate} - ${edu.endDate}`
        : edu.endDate || edu.startDate || '';

    const degreeLine = edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree;

    content.push({
      columns: [
        { text: degreeLine, bold: true, width: '*' },
        ...(dateRange
          ? [{ text: dateRange, alignment: 'right', width: 'auto', fontSize: 9, color: '#555555' }]
          : []),
      ],
      margin: [0, 4, 0, 0],
    });

    const instLine = edu.location ? `${edu.institution}, ${edu.location}` : edu.institution;

    content.push({
      text: instLine,
      italics: true,
      fontSize: 9,
      color: '#555555',
      margin: [0, 1, 0, 2],
    });
  }

  return content;
}

function sanitizeSkills(
  skills: Record<string, string[]> | string[]
): Record<string, string[]> | string[] {
  if (Array.isArray(skills)) {
    return skills.map((s) => stripDashes(String(s)));
  }
  const result: Record<string, string[]> = {};
  for (const [category, items] of Object.entries(skills)) {
    result[stripDashes(String(category))] = (items ?? []).map((s) => stripDashes(String(s)));
  }
  return result;
}

function hasSkills(skills: Record<string, string[]> | string[]): boolean {
  if (Array.isArray(skills)) return skills.length > 0;
  return Object.values(skills).some((items) => items.length > 0);
}

function buildSkillsSection(skills: Record<string, string[]> | string[]): PdfContent[] {
  // Handle flat array fallback (if AI returns old format)
  if (Array.isArray(skills)) {
    return [{ text: skills.join(', '), margin: [0, 4, 0, 4] }];
  }

  const content: PdfContent[] = [];
  for (const [category, items] of Object.entries(skills)) {
    if (items.length > 0) {
      content.push({
        text: [{ text: `${category}: `, bold: true }, { text: items.join(', ') }],
        margin: [0, 3, 0, 3],
      });
    }
  }
  return content;
}

function buildCertificationsEntries(certs: Certification[]): PdfContent[] {
  const content: PdfContent[] = [];

  for (const cert of certs) {
    const parts = [cert.name];
    if (cert.issuer) parts.push(cert.issuer);
    if (cert.dateObtained) parts.push(cert.dateObtained);

    content.push({
      text: parts.join(' - '),
      margin: [0, 2, 0, 2],
    });
  }

  return content;
}

const PDF_STYLES = {
  name: { fontSize: 18, bold: true, color: '#1a1a1a' },
  sectionHeader: { fontSize: 11, bold: true, color: '#1a1a1a' },
};

const DEFAULT_STYLE = { font: 'Helvetica', fontSize: 10, lineHeight: 1.3 };

export function buildResumePdfLayout(
  tailored: TailoredResume,
  resumeData: ResumeData
): PdfDocDefinition {
  const content: PdfContent[] = [];

  // Contact header
  content.push(...buildContactHeader(resumeData.personalInfo));

  // Professional Summary
  content.push(buildSectionHeader('Professional Summary'));
  content.push({ text: stripDashes(tailored.professionalSummary), margin: [0, 0, 0, 4] });

  // Work Experience
  if (tailored.workExperience.length > 0) {
    content.push(buildSectionHeader('Work Experience'));
    content.push(...buildWorkEntries(tailored.workExperience));
  }

  // Education
  if (resumeData.education.length > 0) {
    content.push(buildSectionHeader('Education'));
    content.push(...buildEducationEntries(resumeData.education));
  }

  // Skills
  const sanitizedSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedSkills)) {
    content.push(buildSectionHeader('Skills'));
    content.push(...buildSkillsSection(sanitizedSkills));
  }

  // Certifications
  if (resumeData.certifications.length > 0) {
    content.push(buildSectionHeader('Certifications'));
    content.push(...buildCertificationsEntries(resumeData.certifications));
  }

  return {
    content,
    defaultStyle: DEFAULT_STYLE,
    styles: PDF_STYLES,
    pageMargins: [40, 40, 40, 40],
  };
}

export function buildCVPdfLayout(tailored: TailoredCV, resumeData: ResumeData): PdfDocDefinition {
  const content: PdfContent[] = [];

  // Contact header
  content.push(...buildContactHeader(resumeData.personalInfo));

  // Objective
  content.push(buildSectionHeader('Objective'));
  content.push({ text: stripDashes(tailored.objectiveStatement), margin: [0, 0, 0, 4] });

  // Work Experience
  if (tailored.workExperience.length > 0) {
    content.push(buildSectionHeader('Work Experience'));
    content.push(...buildWorkEntries(tailored.workExperience));
  }

  // Education
  if (resumeData.education.length > 0) {
    content.push(buildSectionHeader('Education'));
    content.push(...buildEducationEntries(resumeData.education));
  }

  // Skills
  const sanitizedCVSkills = sanitizeSkills(tailored.skills);
  if (hasSkills(sanitizedCVSkills)) {
    content.push(buildSectionHeader('Skills'));
    content.push(...buildSkillsSection(sanitizedCVSkills));
  }

  // Certifications
  if (resumeData.certifications.length > 0) {
    content.push(buildSectionHeader('Certifications'));
    content.push(...buildCertificationsEntries(resumeData.certifications));
  }

  return {
    content,
    defaultStyle: DEFAULT_STYLE,
    styles: PDF_STYLES,
    pageMargins: [40, 40, 40, 40],
  };
}

// ---------------------------------------------------------------------------
// PDF buffer generation
// ---------------------------------------------------------------------------

async function generatePdfBuffer(docDefinition: PdfDocDefinition): Promise<Buffer> {
  const pdfmakeModule = await import('pdfmake/js/Printer.js');
  // Vite externalises CJS modules, so the ESM interop can double-wrap the
  // default export: { default: { __esModule: true, default: PdfPrinter } }.
  // Handle both the direct case (tests / plain Node) and the wrapped case.
  const resolved = pdfmakeModule.default;
  const PdfPrinter: typeof import('pdfmake/js/Printer.js').default =
    typeof resolved === 'function'
      ? resolved
      : ((resolved as Record<string, unknown>)
          .default as typeof import('pdfmake/js/Printer.js').default);

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  const printer = new PdfPrinter(fonts);
  // createPdfKitDocument is async in pdfmake v0.3.x
  const pdfDoc = await printer.createPdfKitDocument(docDefinition as never);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

// ---------------------------------------------------------------------------
// Orchestrators
// ---------------------------------------------------------------------------

export async function generateTailoredResume(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string
): Promise<Buffer> {
  const prompt = buildResumePrompt(resumeData, job);
  const raw = await callGemini<TailoredResume>(prompt, apiKey);

  const tailored: TailoredResume = {
    professionalSummary: stripDashes(String(raw.professionalSummary ?? '')),
    targetTitle: stripDashes(String(raw.targetTitle ?? resumeData.personalInfo.jobTitle)),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  const layout = buildResumePdfLayout(tailored, resumeData);
  return generatePdfBuffer(layout);
}

export async function generateTailoredCV(
  resumeData: ResumeData,
  job: JobSummary,
  apiKey: string
): Promise<Buffer> {
  const prompt = buildCVPrompt(resumeData, job);
  const raw = await callGemini<TailoredCV>(prompt, apiKey);

  const tailored: TailoredCV = {
    objectiveStatement: stripDashes(String(raw.objectiveStatement ?? '')),
    workExperience: sanitizeTailoredWork(raw.workExperience ?? []),
    skills: raw.skills ?? resumeData.skills,
  };

  const layout = buildCVPdfLayout(tailored, resumeData);
  return generatePdfBuffer(layout);
}

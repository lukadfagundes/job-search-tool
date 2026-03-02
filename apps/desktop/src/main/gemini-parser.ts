import type {
  ResumeData,
  WorkExperience,
  Education,
  Certification,
} from '../shared/resume-types.ts';
import { generateId } from '../shared/resume-types.ts';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Rate limiter: 2 calls per 60 seconds (Gemini free tier)
const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 2;
const WINDOW_MS = 60_000;

function enforceRateLimit(): void {
  const now = Date.now();
  while (callTimestamps.length > 0 && callTimestamps[0] < now - WINDOW_MS) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) {
    const waitMs = WINDOW_MS - (now - callTimestamps[0]);
    throw new Error(
      `Gemini rate limit reached (2 calls/min). Please wait ${Math.ceil(waitMs / 1000)} seconds.`
    );
  }
}

function recordCall(): void {
  callTimestamps.push(Date.now());
}

/** Exported for tests only */
export function resetRateLimit(): void {
  callTimestamps.length = 0;
}

/**
 * Convert ALL CAPS or all-lowercase text to Title Case.
 * Leaves already mixed-case strings untouched.
 */
export function toTitleCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  // Only transform if the text is entirely uppercase or entirely lowercase
  if (trimmed !== trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildPrompt(resumeText: string): string {
  return `You are a resume parser. Extract structured data from the following resume text.

Return a JSON object with this exact structure:
{
  "personalInfo": {
    "fullName": "",
    "jobTitle": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": ""
  },
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
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false
    }
  ],
  "skills": [],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "dateObtained": "",
      "expirationDate": ""
    }
  ]
}

Rules:
- Extract ONLY information explicitly present in the resume text. Do not fabricate data.
- For skills: Build a pool of professional skills that are relevant to the positions the user has held. Extract skills from work experience responsibilities, job descriptions, and achievements — including tools, technologies, frameworks, methodologies, and transferable professional skills (e.g., project management, client relations). Do NOT simply copy a "Skills" or "Projects" section from the resume. Focus on skills that a recruiter would associate with the user's work history. Deduplicate the list.
- For dates: Use the format as written in the resume (e.g., "Jan 2020", "2020", "March 2020").
- Set "current" to true if the end date says "Present", "Current", or similar.
- If "current" is true, set "endDate" to "".
- For each work experience entry, extract all bullet points/responsibilities listed.
- If a field is not found in the resume, use an empty string "" or empty array [].
- The resume text may have formatting artifacts from PDF extraction (concatenated columns, missing line breaks). Use context to correctly associate data.
- Do NOT include a "summary" or "objective" field.

Resume text:
${resumeText}`;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export function normalizeGeminiOutput(raw: Record<string, unknown>): Partial<ResumeData> {
  const result: Partial<ResumeData> = {};

  if (raw.personalInfo && typeof raw.personalInfo === 'object') {
    const pi = raw.personalInfo as Record<string, unknown>;
    result.personalInfo = {
      fullName: toTitleCase(String(pi.fullName ?? '')),
      jobTitle: String(pi.jobTitle ?? ''),
      email: String(pi.email ?? ''),
      phone: String(pi.phone ?? ''),
      location: String(pi.location ?? ''),
      website: String(pi.website ?? ''),
      linkedin: String(pi.linkedin ?? ''),
    };
  }

  if (Array.isArray(raw.workExperience)) {
    result.workExperience = raw.workExperience.map(
      (exp: Record<string, unknown>): WorkExperience => ({
        id: generateId(),
        jobTitle: String(exp.jobTitle ?? ''),
        company: String(exp.company ?? ''),
        location: String(exp.location ?? ''),
        startDate: String(exp.startDate ?? ''),
        endDate: String(exp.endDate ?? ''),
        current: Boolean(exp.current),
        responsibilities:
          Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0
            ? exp.responsibilities.map((r: unknown) => String(r))
            : [''],
      })
    );
  }

  if (Array.isArray(raw.education)) {
    result.education = raw.education.map(
      (edu: Record<string, unknown>): Education => ({
        id: generateId(),
        institution: String(edu.institution ?? ''),
        degree: String(edu.degree ?? ''),
        fieldOfStudy: String(edu.fieldOfStudy ?? ''),
        location: String(edu.location ?? ''),
        startDate: String(edu.startDate ?? ''),
        endDate: String(edu.endDate ?? ''),
        current: Boolean(edu.current),
      })
    );
  }

  if (Array.isArray(raw.skills)) {
    result.skills = raw.skills
      .map((s: unknown) => String(s).trim())
      .filter((s: string) => s.length > 0);
  }

  if (Array.isArray(raw.certifications)) {
    result.certifications = raw.certifications.map(
      (cert: Record<string, unknown>): Certification => ({
        id: generateId(),
        name: String(cert.name ?? ''),
        issuer: String(cert.issuer ?? ''),
        dateObtained: String(cert.dateObtained ?? ''),
        expirationDate: String(cert.expirationDate ?? ''),
      })
    );
  }

  return result;
}

export async function parseWithGemini(
  resumeText: string,
  apiKey: string
): Promise<Partial<ResumeData>> {
  if (!resumeText.trim()) return {};

  enforceRateLimit();

  const prompt = buildPrompt(resumeText);

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

  const parsed = JSON.parse(text) as Record<string, unknown>;
  return normalizeGeminiOutput(parsed);
}

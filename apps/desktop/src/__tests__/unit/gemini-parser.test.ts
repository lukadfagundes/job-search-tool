// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPrompt,
  normalizeGeminiOutput,
  parseWithGemini,
  resetRateLimit,
  toTitleCase,
} from '../../main/gemini-parser.ts';

describe('gemini-parser', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  describe('buildPrompt', () => {
    it('includes the resume text in the prompt', () => {
      const prompt = buildPrompt('John Doe\nSoftware Engineer');
      expect(prompt).toContain('John Doe');
      expect(prompt).toContain('Software Engineer');
    });

    it('includes JSON schema instructions', () => {
      const prompt = buildPrompt('test');
      expect(prompt).toContain('"personalInfo"');
      expect(prompt).toContain('"workExperience"');
      expect(prompt).toContain('"education"');
      expect(prompt).toContain('"skills"');
      expect(prompt).toContain('"certifications"');
    });

    it('instructs skills extraction from work experience, not Skills section', () => {
      const prompt = buildPrompt('test');
      expect(prompt).toContain('relevant to the positions');
      expect(prompt).toContain('Do NOT simply copy a "Skills"');
    });

    it('does not include summary as a JSON field in the schema', () => {
      const prompt = buildPrompt('test');
      // The schema section should not have a "summary" key, even though
      // the rules section mentions not including it
      expect(prompt).toContain('Do NOT include a "summary"');
      // Verify the JSON schema between the braces doesn't contain a summary field
      const schemaMatch = prompt.match(
        /Return a JSON object with this exact structure:\n\{([\s\S]*?)\n\}/
      );
      expect(schemaMatch).not.toBeNull();
      expect(schemaMatch![1]).not.toContain('summary');
    });
  });

  describe('toTitleCase', () => {
    it('converts ALL CAPS to Title Case', () => {
      expect(toTitleCase('JOHN DOE')).toBe('John Doe');
    });

    it('converts all lowercase to Title Case', () => {
      expect(toTitleCase('john doe')).toBe('John Doe');
    });

    it('leaves mixed case untouched', () => {
      expect(toTitleCase('John Doe')).toBe('John Doe');
      expect(toTitleCase('McDonald')).toBe('McDonald');
    });

    it('handles empty string', () => {
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('normalizeGeminiOutput', () => {
    it('normalizes personalInfo', () => {
      const result = normalizeGeminiOutput({
        personalInfo: {
          fullName: 'John Doe',
          email: 'john@test.com',
        },
      });

      expect(result.personalInfo?.fullName).toBe('John Doe');
      expect(result.personalInfo?.email).toBe('john@test.com');
      expect(result.personalInfo?.phone).toBe('');
    });

    it('converts ALL CAPS fullName to Title Case', () => {
      const result = normalizeGeminiOutput({
        personalInfo: { fullName: 'LUKA FAGUNDES' },
      });
      expect(result.personalInfo?.fullName).toBe('Luka Fagundes');
    });

    it('normalizes workExperience with IDs', () => {
      const result = normalizeGeminiOutput({
        workExperience: [
          {
            jobTitle: 'Engineer',
            company: 'Acme',
            responsibilities: ['Built things'],
          },
        ],
      });

      expect(result.workExperience).toHaveLength(1);
      expect(result.workExperience![0].jobTitle).toBe('Engineer');
      expect(result.workExperience![0].company).toBe('Acme');
      expect(result.workExperience![0].id).toBeDefined();
      expect(result.workExperience![0].responsibilities).toEqual(['Built things']);
    });

    it('defaults empty responsibilities to [""]', () => {
      const result = normalizeGeminiOutput({
        workExperience: [{ jobTitle: 'Dev', responsibilities: [] }],
      });

      expect(result.workExperience![0].responsibilities).toEqual(['']);
    });

    it('normalizes education with IDs', () => {
      const result = normalizeGeminiOutput({
        education: [
          {
            institution: 'MIT',
            degree: 'BS',
            fieldOfStudy: 'CS',
          },
        ],
      });

      expect(result.education).toHaveLength(1);
      expect(result.education![0].institution).toBe('MIT');
      expect(result.education![0].id).toBeDefined();
    });

    it('normalizes skills (filters empty)', () => {
      const result = normalizeGeminiOutput({
        skills: ['JavaScript', '', '  ', 'React'],
      });

      expect(result.skills).toEqual(['JavaScript', 'React']);
    });

    it('normalizes certifications with IDs', () => {
      const result = normalizeGeminiOutput({
        certifications: [{ name: 'AWS', issuer: 'Amazon' }],
      });

      expect(result.certifications).toHaveLength(1);
      expect(result.certifications![0].name).toBe('AWS');
      expect(result.certifications![0].id).toBeDefined();
    });

    it('handles missing sections gracefully', () => {
      const result = normalizeGeminiOutput({});
      expect(result.personalInfo).toBeUndefined();
      expect(result.workExperience).toBeUndefined();
      expect(result.skills).toBeUndefined();
    });
  });

  describe('parseWithGemini', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns empty object for blank text', async () => {
      const result = await parseWithGemini('', 'test-key');
      expect(result).toEqual({});
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('calls Gemini API and returns normalized data', async () => {
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
                        personalInfo: { fullName: 'Test User', email: 'test@email.com' },
                        skills: ['JS'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
      });

      const result = await parseWithGemini('Test User\ntest@email.com', 'my-key');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(url).toContain('key=my-key');
      expect(options.method).toBe('POST');

      expect(result.personalInfo?.fullName).toBe('Test User');
      expect(result.skills).toEqual(['JS']);
    });

    it('throws on non-OK response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(parseWithGemini('text', 'bad-key')).rejects.toThrow('Gemini API error (403)');
    });

    it('throws on empty Gemini response', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      });

      await expect(parseWithGemini('text', 'key')).rejects.toThrow('empty response');
    });

    it('throws on Gemini error in response body', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            error: { message: 'Quota exceeded', code: 429 },
          }),
      });

      await expect(parseWithGemini('text', 'key')).rejects.toThrow('Quota exceeded');
    });

    it('enforces rate limit after 2 calls', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ skills: [] }) }],
                },
              },
            ],
          }),
      };

      fetchSpy.mockResolvedValue(mockResponse);

      await parseWithGemini('call 1', 'key');
      await parseWithGemini('call 2', 'key');

      await expect(parseWithGemini('call 3', 'key')).rejects.toThrow('rate limit reached');
    });
  });
});

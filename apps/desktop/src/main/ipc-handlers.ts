import { app, ipcMain, safeStorage, shell, dialog } from 'electron';
import {
  JSearchClient,
  checkRateLimit,
  getQuotaStatus,
  RateLimitError,
  applyPostFilters,
  deduplicateJobs,
} from '@job-hunt/core';
import type { SearchParams, PostFilterOptions, QuotaStatus, SearchResponse } from '@job-hunt/core';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { homedir } from 'node:os';
// pdf-parse is imported lazily to avoid its debug code that reads a test PDF at module load
// mammoth is also imported lazily since it's only needed for .docx files
import { parseWithGemini } from './gemini-parser.ts';
import { generateTailoredResume, generateTailoredCV } from './document-generator.ts';
import type { JobSummary } from './document-generator.ts';
import type { ResumeData } from '../shared/resume-types.ts';
import { updaterService } from './updater.ts';

const KEY_FILE = resolve(homedir(), '.job-hunt', 'api-key.enc');
const GEMINI_KEY_FILE = resolve(homedir(), '.job-hunt', 'gemini-key.enc');
const RESUME_FILE = resolve(homedir(), '.job-hunt', 'resume.json');

let client: JSearchClient | null = null;
let cachedApiKey: string | null = null;
let cachedGeminiKey: string | null = null;

function loadApiKey(): string | null {
  if (cachedApiKey) return cachedApiKey;
  try {
    if (!existsSync(KEY_FILE)) return null;
    const encrypted = readFileSync(KEY_FILE);
    if (safeStorage.isEncryptionAvailable()) {
      cachedApiKey = safeStorage.decryptString(encrypted);
    } else {
      cachedApiKey = encrypted.toString('utf-8');
    }
    return cachedApiKey;
  } catch {
    return null;
  }
}

function saveApiKeyToFile(key: string): void {
  const dir = dirname(KEY_FILE);
  mkdirSync(dir, { recursive: true });
  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(KEY_FILE, safeStorage.encryptString(key));
  } else {
    writeFileSync(KEY_FILE, key, 'utf-8');
  }
  cachedApiKey = key;
  client = null;
}

function removeApiKeyFile(): void {
  try {
    if (existsSync(KEY_FILE)) unlinkSync(KEY_FILE);
  } catch {
    // ignore
  }
  cachedApiKey = null;
  client = null;
}

function loadGeminiKey(): string | null {
  if (cachedGeminiKey) return cachedGeminiKey;
  try {
    if (!existsSync(GEMINI_KEY_FILE)) return null;
    const encrypted = readFileSync(GEMINI_KEY_FILE);
    if (safeStorage.isEncryptionAvailable()) {
      cachedGeminiKey = safeStorage.decryptString(encrypted);
    } else {
      cachedGeminiKey = encrypted.toString('utf-8');
    }
    return cachedGeminiKey;
  } catch {
    return null;
  }
}

function saveGeminiKeyToFile(key: string): void {
  const dir = dirname(GEMINI_KEY_FILE);
  mkdirSync(dir, { recursive: true });
  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(GEMINI_KEY_FILE, safeStorage.encryptString(key));
  } else {
    writeFileSync(GEMINI_KEY_FILE, key, 'utf-8');
  }
  cachedGeminiKey = key;
}

function removeGeminiKeyFile(): void {
  try {
    if (existsSync(GEMINI_KEY_FILE)) unlinkSync(GEMINI_KEY_FILE);
  } catch {
    // ignore
  }
  cachedGeminiKey = null;
}

function getClient(): JSearchClient {
  if (!client) {
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error('API key not configured. Go to Settings to add your RapidAPI key.');
    }
    client = new JSearchClient(apiKey);
  }
  return client;
}

export interface SearchResult {
  data: import('@job-hunt/core').JobResult[];
  quota: QuotaStatus;
}

export async function handleSearch(
  params: SearchParams,
  filters?: PostFilterOptions
): Promise<SearchResult> {
  await checkRateLimit();

  const jsearchClient = getClient();
  const response: SearchResponse = await jsearchClient.search(params);

  let results = response.data ?? [];
  results = deduplicateJobs(results);

  if (filters) {
    results = applyPostFilters(results, filters);
  }

  const quota = await getQuotaStatus();

  return { data: results, quota };
}

export async function handleGetJobDetails(
  jobId: string
): Promise<import('@job-hunt/core').JobDetailsResponse> {
  const jsearchClient = getClient();
  return jsearchClient.getJobDetails(jobId);
}

export async function handleGetQuota(): Promise<QuotaStatus> {
  return getQuotaStatus();
}

export async function handleSaveApiKey(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate by making a test API call
    const testClient = new JSearchClient(key);
    await testClient.search({ query: 'test', num_pages: 1 });
    saveApiKeyToFile(key);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid API key',
    };
  }
}

export function handleGetApiKeyStatus(): { success: true; hasKey: boolean } {
  return { success: true, hasKey: loadApiKey() !== null };
}

export function handleRemoveApiKey(): { success: true } {
  removeApiKeyFile();
  return { success: true };
}

export function handleSaveGeminiKey(key: string): { success: true } {
  saveGeminiKeyToFile(key);
  return { success: true };
}

export function handleGetGeminiKeyStatus(): { success: true; hasKey: boolean } {
  return { success: true, hasKey: loadGeminiKey() !== null };
}

export function handleRemoveGeminiKey(): { success: true } {
  removeGeminiKeyFile();
  return { success: true };
}

export function handleSaveResume(data: Record<string, unknown>): { success: true } {
  const dir = dirname(RESUME_FILE);
  mkdirSync(dir, { recursive: true });
  writeFileSync(RESUME_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
}

export function handleLoadResume(): { success: true; data: Record<string, unknown> | null } {
  try {
    if (!existsSync(RESUME_FILE)) return { success: true, data: null };
    const content = readFileSync(RESUME_FILE, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch {
    return { success: true, data: null };
  }
}

export async function handlePickResumeFile(): Promise<{
  success: boolean;
  text?: string;
  error?: string;
  cancelled?: boolean;
  geminiKeyMissing?: boolean;
}> {
  const geminiKey = loadGeminiKey();
  if (!geminiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured. Go to Settings to add your Gemini API key.',
      geminiKeyMissing: true,
    };
  }

  const result = await dialog.showOpenDialog({
    title: 'Upload Resume',
    filters: [{ name: 'Resume Files', extensions: ['pdf', 'docx'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: true, cancelled: true };
  }

  const filePath = result.filePaths[0];
  const ext = extname(filePath).toLowerCase();

  try {
    let text: string;

    if (ext === '.pdf') {
      const buffer = readFileSync(filePath);
      // Import the inner lib directly to bypass index.js debug code that reads a test PDF
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (ext === '.docx') {
      const buffer = readFileSync(filePath);
      const mammoth = (await import('mammoth')).default;
      const docResult = await mammoth.extractRawText({ buffer });
      text = docResult.value;
    } else {
      return { success: false, error: `Unsupported file type: ${ext}` };
    }

    return { success: true, text };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read resume file',
    };
  }
}

export async function handleParseResumeText(
  text: string
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const geminiKey = loadGeminiKey();
  if (!geminiKey) {
    return { success: false, error: 'Gemini API key not configured.' };
  }

  try {
    const parsedData = await parseWithGemini(text, geminiKey);
    return { success: true, data: parsedData as unknown as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse resume',
    };
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export async function handleGenerateResume(
  jobData: JobSummary,
  resumeData: Record<string, unknown>
): Promise<{ success: boolean; filePath?: string; error?: string; geminiKeyMissing?: boolean }> {
  const geminiKey = loadGeminiKey();
  if (!geminiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured. Go to Settings to add your Gemini API key.',
      geminiKeyMissing: true,
    };
  }

  if (!resumeData || !resumeData.personalInfo) {
    return {
      success: false,
      error: 'No resume data found. Save your resume in Resume Builder first.',
    };
  }

  try {
    const pdfBuffer = await generateTailoredResume(
      resumeData as unknown as ResumeData,
      jobData,
      geminiKey
    );
    const downloadsDir = app.getPath('downloads');
    const fullName = (resumeData as unknown as ResumeData).personalInfo.fullName || 'Resume';
    const filename = `${sanitizeFilename(fullName)} - ${sanitizeFilename(jobData.title)} Resume.pdf`;
    const filePath = resolve(downloadsDir, filename);
    writeFileSync(filePath, pdfBuffer);
    shell.openPath(filePath);
    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate resume',
    };
  }
}

export async function handleGenerateCV(
  jobData: JobSummary,
  resumeData: Record<string, unknown>
): Promise<{ success: boolean; filePath?: string; error?: string; geminiKeyMissing?: boolean }> {
  const geminiKey = loadGeminiKey();
  if (!geminiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured. Go to Settings to add your Gemini API key.',
      geminiKeyMissing: true,
    };
  }

  if (!resumeData || !resumeData.personalInfo) {
    return {
      success: false,
      error: 'No resume data found. Save your resume in Resume Builder first.',
    };
  }

  try {
    const pdfBuffer = await generateTailoredCV(
      resumeData as unknown as ResumeData,
      jobData,
      geminiKey
    );
    const downloadsDir = app.getPath('downloads');
    const fullName = (resumeData as unknown as ResumeData).personalInfo.fullName || 'CV';
    const filename = `${sanitizeFilename(fullName)} - ${sanitizeFilename(jobData.title)} CV.pdf`;
    const filePath = resolve(downloadsDir, filename);
    writeFileSync(filePath, pdfBuffer);
    shell.openPath(filePath);
    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate CV',
    };
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle(
    'api:search',
    async (_event, params: SearchParams, filters?: PostFilterOptions) => {
      try {
        return { success: true, ...(await handleSearch(params, filters)) };
      } catch (error) {
        if (error instanceof RateLimitError) {
          return {
            success: false,
            error: error.message,
            type: 'rate-limit',
            quota: error.quota,
          };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle('api:job-details', async (_event, jobId: string) => {
    try {
      const result = await handleGetJobDetails(jobId);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('api:quota', async () => {
    try {
      const quota = await handleGetQuota();
      return { success: true, quota };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('settings:save-api-key', async (_event, key: string) => {
    return handleSaveApiKey(key);
  });

  ipcMain.handle('settings:get-api-key-status', () => {
    return handleGetApiKeyStatus();
  });

  ipcMain.handle('settings:remove-api-key', () => {
    return handleRemoveApiKey();
  });

  ipcMain.handle('settings:save-gemini-key', (_event, key: string) => {
    return handleSaveGeminiKey(key);
  });

  ipcMain.handle('settings:get-gemini-key-status', () => {
    return handleGetGeminiKeyStatus();
  });

  ipcMain.handle('settings:remove-gemini-key', () => {
    return handleRemoveGeminiKey();
  });

  ipcMain.handle('resume:save', (_event, data: Record<string, unknown>) => {
    return handleSaveResume(data);
  });

  ipcMain.handle('resume:load', () => {
    return handleLoadResume();
  });

  ipcMain.handle('resume:pick-file', async () => {
    return handlePickResumeFile();
  });

  ipcMain.handle('resume:parse-text', async (_event, text: string) => {
    return handleParseResumeText(text);
  });

  ipcMain.handle(
    'document:generate-resume',
    async (_event, jobData: JobSummary, resumeData: Record<string, unknown>) => {
      return handleGenerateResume(jobData, resumeData);
    }
  );

  ipcMain.handle(
    'document:generate-cv',
    async (_event, jobData: JobSummary, resumeData: Record<string, unknown>) => {
      return handleGenerateCV(jobData, resumeData);
    }
  );

  ipcMain.handle('updater:check', async () => {
    const info = await updaterService.checkForUpdates();
    if (!info) return null;
    return {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes:
        typeof info.releaseNotes === 'string'
          ? info.releaseNotes
          : Array.isArray(info.releaseNotes)
            ? info.releaseNotes
                .filter((n) => n.note !== null)
                .map((n) => `${n.version}: ${n.note}`)
                .join('\n')
            : undefined,
    };
  });

  ipcMain.handle('updater:download', async () => {
    await updaterService.downloadUpdate();
  });

  ipcMain.handle('updater:install', () => {
    updaterService.quitAndInstall();
  });

  ipcMain.handle('updater:get-version', () => {
    return updaterService.getVersion();
  });
}

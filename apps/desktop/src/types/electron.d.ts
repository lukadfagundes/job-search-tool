import type {
  SearchParams,
  PostFilterOptions,
  QuotaStatus,
  JobResult,
  JobDetailsResponse,
} from '@job-hunt/core';

interface SearchResultIPC {
  success: true;
  data: JobResult[];
  quota: QuotaStatus;
}

interface ErrorResultIPC {
  success: false;
  error: string;
  type?: 'rate-limit';
  quota?: QuotaStatus;
}

interface JobDetailsResultIPC {
  success: true;
  data: JobDetailsResponse;
}

interface QuotaResultIPC {
  success: true;
  quota: QuotaStatus;
}

interface ApiKeyStatusResultIPC {
  success: true;
  hasKey: boolean;
}

interface ApiKeySaveResultIPC {
  success: boolean;
  error?: string;
}

interface ApiKeyRemoveResultIPC {
  success: true;
}

interface GeminiKeySaveResultIPC {
  success: true;
}

interface GeminiKeyStatusResultIPC {
  success: true;
  hasKey: boolean;
}

interface GeminiKeyRemoveResultIPC {
  success: true;
}

interface ResumeSaveResultIPC {
  success: true;
}

interface ResumeLoadResultIPC {
  success: true;
  data: Record<string, unknown> | null;
}

interface ResumePickResultIPC {
  success: boolean;
  text?: string;
  error?: string;
  cancelled?: boolean;
  geminiKeyMissing?: boolean;
}

interface ResumeParseTextResultIPC {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface GenerateDocResultIPC {
  success: boolean;
  filePath?: string;
  error?: string;
  geminiKeyMissing?: boolean;
}

interface LayoutSaveResultIPC {
  success: true;
  id: string;
}

interface LayoutLoadResultIPC {
  success: true;
  data: Record<string, unknown> | null;
}

interface LayoutListResultIPC {
  success: true;
  layouts: { id: string; name: string; updatedAt: string }[];
}

interface LayoutDeleteResultIPC {
  success: true;
}

interface PickImageResultIPC {
  success: boolean;
  dataUrl?: string;
  error?: string;
  cancelled?: boolean;
}

interface ExportPngResultIPC {
  success: boolean;
  filePath?: string;
  error?: string;
}

interface UpdateCheckResultIPC {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface DownloadProgressIPC {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

interface ElectronAPI {
  searchJobs: (
    params: SearchParams,
    filters?: PostFilterOptions
  ) => Promise<SearchResultIPC | ErrorResultIPC>;
  getJobDetails: (jobId: string) => Promise<JobDetailsResultIPC | ErrorResultIPC>;
  getQuota: () => Promise<QuotaResultIPC | ErrorResultIPC>;
  saveApiKey: (key: string) => Promise<ApiKeySaveResultIPC>;
  getApiKeyStatus: () => Promise<ApiKeyStatusResultIPC>;
  removeApiKey: () => Promise<ApiKeyRemoveResultIPC>;
  saveResume: (data: Record<string, unknown>) => Promise<ResumeSaveResultIPC>;
  loadResume: () => Promise<ResumeLoadResultIPC>;
  pickResumeFile: () => Promise<ResumePickResultIPC>;
  parseResumeText: (text: string) => Promise<ResumeParseTextResultIPC>;
  saveGeminiKey: (key: string) => Promise<GeminiKeySaveResultIPC>;
  getGeminiKeyStatus: () => Promise<GeminiKeyStatusResultIPC>;
  removeGeminiKey: () => Promise<GeminiKeyRemoveResultIPC>;
  generateResume: (
    jobData: Record<string, unknown>,
    resumeData: Record<string, unknown>
  ) => Promise<GenerateDocResultIPC>;
  generateCV: (
    jobData: Record<string, unknown>,
    resumeData: Record<string, unknown>
  ) => Promise<GenerateDocResultIPC>;
  generateResumeDocx: (
    jobData: Record<string, unknown>,
    resumeData: Record<string, unknown>
  ) => Promise<GenerateDocResultIPC>;
  generateCVDocx: (
    jobData: Record<string, unknown>,
    resumeData: Record<string, unknown>
  ) => Promise<GenerateDocResultIPC>;
  checkForUpdates: () => Promise<UpdateCheckResultIPC | null>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  onUpdaterEvent: (
    channel: string,
    callback: (event: unknown, ...args: unknown[]) => void
  ) => () => void;
  saveLayout: (layout: Record<string, unknown>) => Promise<LayoutSaveResultIPC>;
  loadLayout: (id: string) => Promise<LayoutLoadResultIPC>;
  listLayouts: () => Promise<LayoutListResultIPC>;
  deleteLayout: (id: string) => Promise<LayoutDeleteResultIPC>;
  pickImage: () => Promise<PickImageResultIPC>;
  exportPng: (dataUrl: string, suggestedName: string) => Promise<ExportPngResultIPC>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

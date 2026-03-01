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

interface ElectronAPI {
  searchJobs: (
    params: SearchParams,
    filters?: PostFilterOptions
  ) => Promise<SearchResultIPC | ErrorResultIPC>;
  getJobDetails: (jobId: string) => Promise<JobDetailsResultIPC | ErrorResultIPC>;
  getQuota: () => Promise<QuotaResultIPC | ErrorResultIPC>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

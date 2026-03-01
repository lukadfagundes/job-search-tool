import { ipcMain } from 'electron';
import {
  JSearchClient,
  checkRateLimit,
  getQuotaStatus,
  RateLimitError,
  applyPostFilters,
  deduplicateJobs,
} from '@job-hunt/core';
import type { SearchParams, PostFilterOptions, QuotaStatus, SearchResponse } from '@job-hunt/core';

let client: JSearchClient | null = null;

function getClient(): JSearchClient {
  if (!client) {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not set. Add it to your .env file.');
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
}

import { ipcMain, safeStorage } from 'electron';
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
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';

const KEY_FILE = resolve(homedir(), '.job-hunt', 'api-key.enc');

let client: JSearchClient | null = null;
let cachedApiKey: string | null = null;

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
}

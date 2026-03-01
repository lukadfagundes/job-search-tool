import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { StorageData, SavedJob, SearchProfile, JobResult } from '../api/types.js';

const STORAGE_DIR = join(homedir(), '.job-hunt');
const STORAGE_FILE = join(STORAGE_DIR, 'data.json');

async function ensureStorageDir(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
}

async function readStorage(): Promise<StorageData> {
  try {
    const data = await readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data) as StorageData;
  } catch {
    return { savedJobs: [], profiles: [], seenJobIds: [] };
  }
}

async function writeStorage(data: StorageData): Promise<void> {
  await ensureStorageDir();
  await writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Saved Jobs ──

export async function saveJob(job: JobResult, notes?: string): Promise<void> {
  const data = await readStorage();
  const exists = data.savedJobs.some((s) => s.job.job_id === job.job_id);
  if (exists) return;

  data.savedJobs.push({
    job,
    savedAt: new Date().toISOString(),
    notes,
  });
  await writeStorage(data);
}

export async function getSavedJobs(): Promise<SavedJob[]> {
  const data = await readStorage();
  return data.savedJobs;
}

export async function removeSavedJob(jobId: string): Promise<boolean> {
  const data = await readStorage();
  const before = data.savedJobs.length;
  data.savedJobs = data.savedJobs.filter((s) => s.job.job_id !== jobId);
  if (data.savedJobs.length === before) return false;
  await writeStorage(data);
  return true;
}

// ── Search Profiles ──

export async function saveProfile(
  name: string,
  params: SearchProfile['params'],
  filters?: SearchProfile['filters']
): Promise<void> {
  const data = await readStorage();
  // Overwrite if name already exists
  data.profiles = data.profiles.filter((p) => p.name !== name);
  data.profiles.push({
    name,
    params,
    filters,
    createdAt: new Date().toISOString(),
  });
  await writeStorage(data);
}

export async function getProfiles(): Promise<SearchProfile[]> {
  const data = await readStorage();
  return data.profiles;
}

export async function getProfile(name: string): Promise<SearchProfile | undefined> {
  const data = await readStorage();
  return data.profiles.find((p) => p.name === name);
}

export async function removeProfile(name: string): Promise<boolean> {
  const data = await readStorage();
  const before = data.profiles.length;
  data.profiles = data.profiles.filter((p) => p.name !== name);
  if (data.profiles.length === before) return false;
  await writeStorage(data);
  return true;
}

// ── Seen Jobs (Dedup) ──

export async function markJobsSeen(jobIds: string[]): Promise<void> {
  const data = await readStorage();
  const idSet = new Set(data.seenJobIds);
  for (const id of jobIds) {
    idSet.add(id);
  }
  data.seenJobIds = Array.from(idSet);
  await writeStorage(data);
}

export async function getSeenJobIds(): Promise<Set<string>> {
  const data = await readStorage();
  return new Set(data.seenJobIds);
}

import { app, dialog } from 'electron';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { resolve, extname } from 'node:path';
import { homedir } from 'node:os';
import type { ResumeLayout } from '../shared/layout-types.ts';

const DATA_DIR = resolve(homedir(), app.isPackaged ? '.job-hunt' : '.job-hunt-dev');
const LAYOUTS_DIR = resolve(DATA_DIR, 'layouts');
const IMAGES_DIR = resolve(DATA_DIR, 'images');

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

export function handleSaveLayout(layout: ResumeLayout): { success: true; id: string } {
  ensureDir(LAYOUTS_DIR);
  const filePath = resolve(LAYOUTS_DIR, `${layout.id}.json`);
  writeFileSync(filePath, JSON.stringify(layout, null, 2), 'utf-8');
  return { success: true, id: layout.id };
}

export function handleLoadLayout(id: string): { success: true; data: ResumeLayout | null } {
  const filePath = resolve(LAYOUTS_DIR, `${id}.json`);
  try {
    if (!existsSync(filePath)) return { success: true, data: null };
    const content = readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch {
    return { success: true, data: null };
  }
}

export function handleListLayouts(): {
  success: true;
  layouts: { id: string; name: string; updatedAt: string }[];
} {
  ensureDir(LAYOUTS_DIR);
  try {
    const files = readdirSync(LAYOUTS_DIR).filter((f) => f.endsWith('.json'));
    const layouts = files
      .map((f) => {
        try {
          const content = readFileSync(resolve(LAYOUTS_DIR, f), 'utf-8');
          const layout = JSON.parse(content) as ResumeLayout;
          return { id: layout.id, name: layout.name, updatedAt: layout.updatedAt };
        } catch {
          return null;
        }
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
    return { success: true, layouts };
  } catch {
    return { success: true, layouts: [] };
  }
}

/**
 * Load the most recently updated layout, or null if none exist.
 * Used by document generation to apply the user's custom layout.
 */
export function loadLatestLayout(): ResumeLayout | null {
  const result = handleListLayouts();
  if (result.layouts.length === 0) return null;
  // Sort by updatedAt descending
  const sorted = [...result.layouts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const latest = handleLoadLayout(sorted[0].id);
  return latest.data;
}

export function handleDeleteLayout(id: string): { success: true } {
  const filePath = resolve(LAYOUTS_DIR, `${id}.json`);
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch {
    // ignore
  }
  return { success: true };
}

export async function handlePickImage(): Promise<{
  success: boolean;
  dataUrl?: string;
  error?: string;
  cancelled?: boolean;
}> {
  const result = await dialog.showOpenDialog({
    title: 'Choose Image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: true, cancelled: true };
  }

  try {
    const filePath = result.filePaths[0];
    const ext = extname(filePath).toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };
    const mime = mimeMap[ext] || 'image/png';
    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;

    // Also save a copy for persistence
    ensureDir(IMAGES_DIR);
    const savedName = `${Date.now()}.${ext}`;
    writeFileSync(resolve(IMAGES_DIR, savedName), buffer);

    return { success: true, dataUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read image',
    };
  }
}

export function handleExportPng(
  dataUrl: string,
  suggestedName: string
): { success: boolean; filePath?: string; error?: string } {
  try {
    const downloadsDir = app.getPath('downloads');
    const filename = `${suggestedName}.png`;
    const filePath = resolve(downloadsDir, filename);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return { success: true, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PNG',
    };
  }
}

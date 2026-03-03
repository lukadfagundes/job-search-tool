import { autoUpdater } from 'electron-updater';
import type { UpdateInfo, ProgressInfo, UpdateDownloadedEvent } from 'electron-updater';
import { BrowserWindow, app } from 'electron';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: number;
  error?: string;
}

class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private state: UpdateState = { status: 'idle' };
  private updateDownloaded = false;

  initialize(window: BrowserWindow): void {
    this.mainWindow = window;

    if (!app.isPackaged) {
      return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'lukadfagundes',
      repo: 'job-hunt',
    });

    this.setupEventListeners();

    setTimeout(() => {
      this.checkForUpdates().catch(() => {
        // Silent fail on initial check
      });
    }, 5000);
  }

  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      this.updateState({ status: 'checking' });
      this.sendToRenderer('updater:checking');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.updateState({
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.extractReleaseNotes(info.releaseNotes),
      });
      this.sendToRenderer('updater:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.extractReleaseNotes(info.releaseNotes),
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.updateState({ status: 'not-available' });
      this.sendToRenderer('updater:not-available');
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.updateState({
        status: 'downloading',
        progress: progress.percent,
      });
      this.sendToRenderer('updater:progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
      this.updateDownloaded = true;
      this.updateState({
        status: 'downloaded',
        version: event.version,
        releaseDate: event.releaseDate,
        releaseNotes: this.extractReleaseNotes(event.releaseNotes),
      });
      this.sendToRenderer('updater:downloaded', {
        version: event.version,
        releaseDate: event.releaseDate,
        releaseNotes: this.extractReleaseNotes(event.releaseNotes),
      });
    });

    autoUpdater.on('error', (error: Error) => {
      this.updateState({
        status: 'error',
        error: error.message,
      });
      this.sendToRenderer('updater:error', { message: error.message });
    });
  }

  private extractReleaseNotes(
    notes: string | { version: string; note: string | null }[] | null | undefined
  ): string | undefined {
    if (!notes) return undefined;
    if (typeof notes === 'string') return notes;
    if (Array.isArray(notes)) {
      return notes
        .filter((n) => n.note !== null)
        .map((n) => `${n.version}: ${n.note}`)
        .join('\n');
    }
    return undefined;
  }

  private updateState(partial: Partial<UpdateState>): void {
    this.state = { ...this.state, ...partial };
  }

  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!app.isPackaged) {
      return null;
    }

    const result = await autoUpdater.checkForUpdates();
    return result?.updateInfo ?? null;
  }

  async downloadUpdate(): Promise<void> {
    if (!app.isPackaged) {
      return;
    }

    if (this.state.status !== 'available') {
      throw new Error('No update available to download');
    }

    await autoUpdater.downloadUpdate();
  }

  quitAndInstall(): void {
    if (!this.updateDownloaded) {
      return;
    }

    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 100);
  }

  getStatus(): UpdateState {
    return { ...this.state };
  }

  getVersion(): string {
    return app.getVersion();
  }

  isUpdateReady(): boolean {
    return this.updateDownloaded;
  }
}

export const updaterService = new UpdaterService();

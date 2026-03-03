import { useState, useEffect, useCallback } from 'react';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

const SKIPPED_VERSION_KEY = 'job-hunt:skipped-update-version';

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skippedVersion, setSkippedVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  // Load skipped version and app version on mount, subscribe to IPC events
  useEffect(() => {
    const stored = localStorage.getItem(SKIPPED_VERSION_KEY);
    if (stored) setSkippedVersion(stored);

    window.electronAPI.getAppVersion().then((v) => setAppVersion(v));

    const cleanups: (() => void)[] = [];

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:checking', () => {
        setStatus('checking');
      })
    );

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:available', (_event, data) => {
        const info = data as UpdateInfo;
        const currentSkipped = localStorage.getItem(SKIPPED_VERSION_KEY);
        if (currentSkipped && info.version === currentSkipped) {
          setStatus('not-available');
          return;
        }
        setStatus('available');
        setUpdateInfo(info);
        setDismissed(false);
      })
    );

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:not-available', () => {
        setStatus('not-available');
      })
    );

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:progress', (_event, data) => {
        const progress = data as DownloadProgress;
        setStatus('downloading');
        setDownloadProgress(progress);
      })
    );

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:downloaded', (_event, data) => {
        const info = data as UpdateInfo;
        setStatus('downloaded');
        setUpdateInfo(info);
        setDownloadProgress(null);
      })
    );

    cleanups.push(
      window.electronAPI.onUpdaterEvent('updater:error', (_event, data) => {
        const err = data as { message: string };
        setStatus('error');
        setError(err.message);
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    setError(null);
    setDismissed(false);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result) {
        if (skippedVersion && result.version === skippedVersion) {
          setStatus('not-available');
          return;
        }
        setStatus('available');
        setUpdateInfo(result);
      } else {
        setStatus('not-available');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    }
  }, [skippedVersion]);

  const downloadUpdate = useCallback(async () => {
    setStatus('downloading');
    setDownloadProgress(null);
    setError(null);
    try {
      await window.electronAPI.downloadUpdate();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to download update');
      setDownloadProgress(null);
    }
  }, []);

  const installUpdate = useCallback(() => {
    window.electronAPI.installUpdate();
  }, []);

  const skipVersion = useCallback((version: string) => {
    localStorage.setItem(SKIPPED_VERSION_KEY, version);
    setSkippedVersion(version);
    setDismissed(true);
    setStatus('idle');
    setUpdateInfo(null);
  }, []);

  const remindLater = useCallback(() => {
    setDismissed(true);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setUpdateInfo(null);
    setDownloadProgress(null);
    setError(null);
    setDismissed(false);
  }, []);

  return {
    status,
    updateInfo,
    downloadProgress,
    error,
    skippedVersion,
    dismissed,
    appVersion,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    skipVersion,
    remindLater,
    reset,
  };
}

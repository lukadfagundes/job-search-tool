import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUpdater } from '../../renderer/hooks/useUpdater.ts';

// Track onUpdaterEvent callbacks so we can simulate IPC events
let eventHandlers: Record<string, (...args: unknown[]) => void> = {};

beforeEach(() => {
  eventHandlers = {};
  // Make onUpdaterEvent capture callbacks for simulation
  window.electronAPI.onUpdaterEvent = vi.fn(
    (channel: string, callback: (...args: unknown[]) => void) => {
      eventHandlers[channel] = callback;
      return () => {
        delete eventHandlers[channel];
      };
    }
  ) as typeof window.electronAPI.onUpdaterEvent;
});

function simulateEvent(channel: string, ...args: unknown[]) {
  if (eventHandlers[channel]) {
    eventHandlers[channel](...args);
  }
}

describe('useUpdater', () => {
  it('initializes with idle status and loads app version', async () => {
    const { result } = renderHook(() => useUpdater());

    expect(result.current.status).toBe('idle');
    expect(result.current.updateInfo).toBeNull();
    expect(result.current.downloadProgress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.dismissed).toBe(false);

    // getAppVersion is called on mount
    await vi.waitFor(() => {
      expect(result.current.appVersion).toBe('0.0.1');
    });
  });

  it('subscribes to 6 IPC event channels on mount', async () => {
    renderHook(() => useUpdater());

    const calls = (window.electronAPI.onUpdaterEvent as ReturnType<typeof vi.fn>).mock.calls;
    const channels = calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain('updater:checking');
    expect(channels).toContain('updater:available');
    expect(channels).toContain('updater:not-available');
    expect(channels).toContain('updater:progress');
    expect(channels).toContain('updater:downloaded');
    expect(channels).toContain('updater:error');

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('cleans up event listeners on unmount', () => {
    const cleanupFns = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    let callIndex = 0;
    (window.electronAPI.onUpdaterEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const fn = cleanupFns[callIndex++];
      return fn;
    });

    const { unmount } = renderHook(() => useUpdater());
    unmount();

    for (const fn of cleanupFns) {
      expect(fn).toHaveBeenCalled();
    }
  });

  it('loads skipped version from localStorage on mount', async () => {
    localStorage.setItem('job-hunt:skipped-update-version', '2.0.0');

    const { result } = renderHook(() => useUpdater());
    expect(result.current.skippedVersion).toBe('2.0.0');

    await waitFor(() => {
      expect(result.current.appVersion).toBe('0.0.1');
    });
  });

  describe('IPC event handling', () => {
    it('sets status to checking on updater:checking event', async () => {
      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        simulateEvent('updater:checking');
      });

      expect(result.current.status).toBe('checking');
    });

    it('sets status to available and updateInfo on updater:available event', async () => {
      const { result } = renderHook(() => useUpdater());

      const info = { version: '2.0.0', releaseDate: '2026-03-01', releaseNotes: 'New stuff' };
      await act(async () => {
        simulateEvent('updater:available', undefined, info);
      });

      expect(result.current.status).toBe('available');
      expect(result.current.updateInfo).toEqual(info);
      expect(result.current.dismissed).toBe(false);
    });

    it('skips update if version matches skipped version', async () => {
      localStorage.setItem('job-hunt:skipped-update-version', '2.0.0');

      const { result } = renderHook(() => useUpdater());

      const info = { version: '2.0.0', releaseDate: '2026-03-01' };
      await act(async () => {
        simulateEvent('updater:available', undefined, info);
      });

      expect(result.current.status).toBe('not-available');
      expect(result.current.updateInfo).toBeNull();
    });

    it('sets status to not-available on updater:not-available event', async () => {
      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        simulateEvent('updater:not-available');
      });

      expect(result.current.status).toBe('not-available');
    });

    it('sets downloading status and progress on updater:progress event', async () => {
      const { result } = renderHook(() => useUpdater());

      const progress = {
        percent: 45.5,
        bytesPerSecond: 1024000,
        transferred: 5000000,
        total: 11000000,
      };
      await act(async () => {
        simulateEvent('updater:progress', undefined, progress);
      });

      expect(result.current.status).toBe('downloading');
      expect(result.current.downloadProgress).toEqual(progress);
    });

    it('sets downloaded status on updater:downloaded event', async () => {
      const { result } = renderHook(() => useUpdater());

      const info = { version: '2.0.0', releaseDate: '2026-03-01' };
      await act(async () => {
        simulateEvent('updater:downloaded', undefined, info);
      });

      expect(result.current.status).toBe('downloaded');
      expect(result.current.updateInfo).toEqual(info);
      expect(result.current.downloadProgress).toBeNull();
    });

    it('sets error status on updater:error event', async () => {
      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        simulateEvent('updater:error', undefined, { message: 'Network timeout' });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network timeout');
    });
  });

  describe('checkForUpdates', () => {
    it('sets available status when update found', async () => {
      const updateResult = { version: '2.0.0', releaseDate: '2026-03-01', releaseNotes: 'Fixes' };
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(
        updateResult
      );

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.status).toBe('available');
      expect(result.current.updateInfo).toEqual(updateResult);
    });

    it('sets not-available when no update', async () => {
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.status).toBe('not-available');
    });

    it('skips update matching skipped version', async () => {
      localStorage.setItem('job-hunt:skipped-update-version', '2.0.0');
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: '2.0.0',
        releaseDate: '2026-03-01',
      });

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.status).toBe('not-available');
    });

    it('sets error status on failure', async () => {
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
    });

    it('sets generic error for non-Error throws', async () => {
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockRejectedValue(
        'string error'
      );

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.error).toBe('Failed to check for updates');
    });
  });

  describe('downloadUpdate', () => {
    it('sets downloading status and calls electronAPI', async () => {
      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.downloadUpdate();
      });

      expect(window.electronAPI.downloadUpdate).toHaveBeenCalled();
    });

    it('sets error on download failure', async () => {
      (window.electronAPI.downloadUpdate as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Disk full')
      );

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.downloadUpdate();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Disk full');
      expect(result.current.downloadProgress).toBeNull();
    });

    it('sets generic error for non-Error throws on download', async () => {
      (window.electronAPI.downloadUpdate as ReturnType<typeof vi.fn>).mockRejectedValue(42);

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.downloadUpdate();
      });

      expect(result.current.error).toBe('Failed to download update');
    });
  });

  describe('installUpdate', () => {
    it('calls electronAPI.installUpdate', async () => {
      const { result } = renderHook(() => useUpdater());

      await waitFor(() => {
        expect(result.current.appVersion).toBe('0.0.1');
      });

      act(() => {
        result.current.installUpdate();
      });

      expect(window.electronAPI.installUpdate).toHaveBeenCalled();
    });
  });

  describe('skipVersion', () => {
    it('saves skipped version to localStorage and dismisses', async () => {
      const { result } = renderHook(() => useUpdater());

      await waitFor(() => {
        expect(result.current.appVersion).toBe('0.0.1');
      });

      act(() => {
        result.current.skipVersion('2.0.0');
      });

      expect(result.current.skippedVersion).toBe('2.0.0');
      expect(result.current.dismissed).toBe(true);
      expect(result.current.status).toBe('idle');
      expect(result.current.updateInfo).toBeNull();
      expect(localStorage.getItem('job-hunt:skipped-update-version')).toBe('2.0.0');
    });
  });

  describe('remindLater', () => {
    it('sets dismissed to true', async () => {
      const { result } = renderHook(() => useUpdater());

      await waitFor(() => {
        expect(result.current.appVersion).toBe('0.0.1');
      });

      act(() => {
        result.current.remindLater();
      });

      expect(result.current.dismissed).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', async () => {
      // First trigger an error state
      (window.electronAPI.checkForUpdates as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('fail')
      );

      const { result } = renderHook(() => useUpdater());

      await act(async () => {
        await result.current.checkForUpdates();
      });

      expect(result.current.status).toBe('error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.updateInfo).toBeNull();
      expect(result.current.downloadProgress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.dismissed).toBe(false);
    });
  });
});

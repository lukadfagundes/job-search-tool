import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateNotification } from '../../renderer/components/UpdateNotification.tsx';

// Mock the useUpdater hook so we can control state directly
const mockUseUpdater = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    status: 'idle',
    updateInfo: null,
    downloadProgress: null,
    error: null,
    dismissed: false,
    appVersion: '1.0.0',
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    skipVersion: vi.fn(),
    remindLater: vi.fn(),
    reset: vi.fn(),
  })
);

vi.mock('../../renderer/hooks/useUpdater.ts', () => ({
  useUpdater: mockUseUpdater,
}));

function setUpdaterState(overrides: Record<string, unknown>) {
  mockUseUpdater.mockReturnValue({
    status: 'idle',
    updateInfo: null,
    downloadProgress: null,
    error: null,
    dismissed: false,
    appVersion: '1.0.0',
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    skipVersion: vi.fn(),
    remindLater: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  });
}

describe('UpdateNotification', () => {
  beforeEach(() => {
    mockUseUpdater.mockReturnValue({
      status: 'idle',
      updateInfo: null,
      downloadProgress: null,
      error: null,
      dismissed: false,
      appVersion: '1.0.0',
      checkForUpdates: vi.fn(),
      downloadUpdate: vi.fn(),
      installUpdate: vi.fn(),
      skipVersion: vi.fn(),
      remindLater: vi.fn(),
      reset: vi.fn(),
    });
  });

  it('renders nothing when status is idle', () => {
    const { container } = render(<UpdateNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when status is checking', () => {
    setUpdaterState({ status: 'checking' });
    const { container } = render(<UpdateNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when status is not-available', () => {
    setUpdaterState({ status: 'not-available' });
    const { container } = render(<UpdateNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when dismissed is true', () => {
    setUpdaterState({ status: 'available', dismissed: true });
    const { container } = render(<UpdateNotification />);
    expect(container.firstChild).toBeNull();
  });

  describe('available state', () => {
    const updateInfo = {
      version: '2.0.0',
      releaseDate: '2026-03-01T00:00:00Z',
      releaseNotes: 'Bug fixes and improvements',
    };

    beforeEach(() => {
      setUpdaterState({ status: 'available', updateInfo });
    });

    it('renders the update available modal', () => {
      render(<UpdateNotification />);

      expect(screen.getByTestId('update-notification')).toBeInTheDocument();
      expect(screen.getByText('Update Available')).toBeInTheDocument();
      expect(screen.getByText('2.0.0')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('shows release date', () => {
      render(<UpdateNotification />);

      // The date is formatted with toLocaleDateString
      expect(screen.getByText(/Released:/)).toBeInTheDocument();
    });

    it('shows release notes', () => {
      render(<UpdateNotification />);

      expect(screen.getByText("What's New")).toBeInTheDocument();
      expect(screen.getByText('Bug fixes and improvements')).toBeInTheDocument();
    });

    it('calls downloadUpdate when Download & Install is clicked', () => {
      const downloadUpdate = vi.fn();
      setUpdaterState({ status: 'available', updateInfo, downloadUpdate });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText(/Download & Install/));

      expect(downloadUpdate).toHaveBeenCalled();
    });

    it('calls remindLater when Remind Me Later is clicked', () => {
      const remindLater = vi.fn();
      setUpdaterState({ status: 'available', updateInfo, remindLater });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Remind Me Later'));

      expect(remindLater).toHaveBeenCalled();
    });

    it('calls skipVersion when Skip This Version is clicked', () => {
      const skipVersion = vi.fn();
      setUpdaterState({ status: 'available', updateInfo, skipVersion });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Skip This Version'));

      expect(skipVersion).toHaveBeenCalledWith('2.0.0');
    });

    it('renders without release notes when not provided', () => {
      setUpdaterState({
        status: 'available',
        updateInfo: { version: '2.0.0', releaseDate: '2026-03-01' },
      });

      render(<UpdateNotification />);

      expect(screen.getByText('Update Available')).toBeInTheDocument();
      expect(screen.queryByText("What's New")).not.toBeInTheDocument();
    });

    it('renders without release date when not provided', () => {
      setUpdaterState({
        status: 'available',
        updateInfo: { version: '2.0.0' },
      });

      render(<UpdateNotification />);

      expect(screen.queryByText(/Released:/)).not.toBeInTheDocument();
    });
  });

  describe('downloading state', () => {
    it('renders downloading modal with progress bar', () => {
      setUpdaterState({
        status: 'downloading',
        updateInfo: { version: '2.0.0' },
        downloadProgress: {
          percent: 45.5,
          bytesPerSecond: 1048576,
          transferred: 5242880,
          total: 11534336,
        },
      });

      render(<UpdateNotification />);

      expect(screen.getByText('Downloading Update')).toBeInTheDocument();
      expect(screen.getByText('45.5%')).toBeInTheDocument();
      // Check for transferred/total display
      expect(screen.getByText(/5 MB/)).toBeInTheDocument();
    });

    it('shows 0.0% when no progress data', () => {
      setUpdaterState({
        status: 'downloading',
        updateInfo: { version: '2.0.0' },
        downloadProgress: null,
      });

      render(<UpdateNotification />);

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('calls remindLater when Download in Background is clicked', () => {
      const remindLater = vi.fn();
      setUpdaterState({
        status: 'downloading',
        updateInfo: { version: '2.0.0' },
        downloadProgress: null,
        remindLater,
      });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Download in Background'));

      expect(remindLater).toHaveBeenCalled();
    });
  });

  describe('downloaded state', () => {
    it('renders ready to install modal', () => {
      setUpdaterState({
        status: 'downloaded',
        updateInfo: { version: '2.0.0' },
      });

      render(<UpdateNotification />);

      expect(screen.getByText('Ready to Install')).toBeInTheDocument();
      expect(screen.getByText(/Version 2.0.0 has been downloaded/)).toBeInTheDocument();
      expect(screen.getByText(/application will restart/)).toBeInTheDocument();
    });

    it('calls installUpdate when Restart & Install is clicked', () => {
      const installUpdate = vi.fn();
      setUpdaterState({
        status: 'downloaded',
        updateInfo: { version: '2.0.0' },
        installUpdate,
      });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText(/Restart & Install/));

      expect(installUpdate).toHaveBeenCalled();
    });

    it('calls remindLater when Install Later is clicked', () => {
      const remindLater = vi.fn();
      setUpdaterState({
        status: 'downloaded',
        updateInfo: { version: '2.0.0' },
        remindLater,
      });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Install Later'));

      expect(remindLater).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('renders error modal with error message', () => {
      setUpdaterState({
        status: 'error',
        error: 'Network connection failed',
      });

      render(<UpdateNotification />);

      expect(screen.getByText('Update Error')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('renders error modal without error message', () => {
      setUpdaterState({
        status: 'error',
        error: null,
      });

      render(<UpdateNotification />);

      expect(screen.getByText('Update Error')).toBeInTheDocument();
      expect(screen.getByText(/problem checking for or downloading/)).toBeInTheDocument();
    });

    it('calls reset and checkForUpdates when Retry is clicked', () => {
      const reset = vi.fn();
      const checkForUpdates = vi.fn();
      setUpdaterState({
        status: 'error',
        error: 'Failed',
        reset,
        checkForUpdates,
      });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Retry'));

      expect(reset).toHaveBeenCalled();
      expect(checkForUpdates).toHaveBeenCalled();
    });

    it('calls remindLater when Dismiss is clicked', () => {
      const remindLater = vi.fn();
      setUpdaterState({
        status: 'error',
        error: 'Failed',
        remindLater,
      });

      render(<UpdateNotification />);
      fireEvent.click(screen.getByText('Dismiss'));

      expect(remindLater).toHaveBeenCalled();
    });
  });
});

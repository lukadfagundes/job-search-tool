import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../../renderer/components/Header.tsx';

describe('Header', () => {
  it('renders app title', async () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Job Hunt')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('renders hamburger button', async () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByTestId('hamburger-button')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('calls onToggleSidebar when hamburger is clicked', async () => {
    const onToggle = vi.fn();
    render(<Header onToggleSidebar={onToggle} />);

    fireEvent.click(screen.getByTestId('hamburger-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('has accessible label on hamburger button', async () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('renders version badge when app version is available', async () => {
    (window.electronAPI.getAppVersion as ReturnType<typeof vi.fn>).mockResolvedValue('1.2.3');

    render(<Header onToggleSidebar={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('version-badge')).toHaveTextContent('v1.2.3');
    });
  });

  it('renders Issues button', async () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByTestId('issues-button')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('opens GitHub issues page when Issues button is clicked', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<Header onToggleSidebar={vi.fn()} />);
    fireEvent.click(screen.getByTestId('issues-button'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/lukadfagundes/job-search-tool/issues',
      '_blank'
    );

    openSpy.mockRestore();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });

  it('has accessible label on Issues button', async () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByLabelText('Report an issue')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.electronAPI.getAppVersion).toHaveBeenCalled();
    });
  });
});

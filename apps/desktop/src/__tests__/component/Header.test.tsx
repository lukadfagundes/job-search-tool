import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../renderer/components/Header.tsx';

describe('Header', () => {
  it('renders app title', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Job Hunt')).toBeInTheDocument();
  });

  it('renders hamburger button', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByTestId('hamburger-button')).toBeInTheDocument();
  });

  it('calls onToggleSidebar when hamburger is clicked', () => {
    const onToggle = vi.fn();
    render(<Header onToggleSidebar={onToggle} />);

    fireEvent.click(screen.getByTestId('hamburger-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has accessible label on hamburger button', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  it('renders version badge when app version is available', async () => {
    (window.electronAPI.getAppVersion as ReturnType<typeof vi.fn>).mockResolvedValue('1.2.3');

    render(<Header onToggleSidebar={vi.fn()} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('version-badge')).toHaveTextContent('v1.2.3');
    });
  });

  it('renders Issues button', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByTestId('issues-button')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('opens GitHub issues page when Issues button is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<Header onToggleSidebar={vi.fn()} />);
    fireEvent.click(screen.getByTestId('issues-button'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/lukadfagundes/job-search-tool/issues',
      '_blank'
    );

    openSpy.mockRestore();
  });

  it('has accessible label on Issues button', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByLabelText('Report an issue')).toBeInTheDocument();
  });
});

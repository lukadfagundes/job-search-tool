import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../../renderer/components/Sidebar.tsx';

const defaultProps = {
  isOpen: true,
  view: 'search' as const,
  onViewChange: vi.fn(),
  onClose: vi.fn(),
  weeklyRemaining: null,
  monthlyRemaining: null,
};

describe('Sidebar', () => {
  it('renders nothing when closed', () => {
    render(<Sidebar {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('renders sidebar when open', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Saved Jobs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('calls onViewChange and onClose when nav item clicked', () => {
    const onViewChange = vi.fn();
    const onClose = vi.fn();
    render(<Sidebar {...defaultProps} onViewChange={onViewChange} onClose={onClose} />);

    fireEvent.click(screen.getByText('Settings'));
    expect(onViewChange).toHaveBeenCalledWith('settings');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Sidebar {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('sidebar-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Sidebar {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalled();
  });

  it('highlights the active view', () => {
    render(<Sidebar {...defaultProps} view="saved" />);

    const savedButton = screen.getByText('Saved Jobs');
    expect(savedButton.closest('button')!.className).toContain('bg-blue-50');
  });

  it('displays quota when available', () => {
    render(<Sidebar {...defaultProps} weeklyRemaining={45} monthlyRemaining={180} />);

    expect(screen.getByTestId('sidebar-quota')).toBeInTheDocument();
    expect(screen.getByText(/45\/50 weekly/)).toBeInTheDocument();
    expect(screen.getByText(/180\/200 monthly/)).toBeInTheDocument();
  });

  it('hides quota when values are null', () => {
    render(<Sidebar {...defaultProps} weeklyRemaining={null} monthlyRemaining={null} />);
    expect(screen.queryByTestId('sidebar-quota')).not.toBeInTheDocument();
  });
});

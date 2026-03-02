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
});

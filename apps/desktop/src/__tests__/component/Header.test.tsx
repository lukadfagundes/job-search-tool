import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../renderer/components/Header.tsx';

describe('Header', () => {
  it('renders app title', () => {
    render(
      <Header view="search" onViewChange={vi.fn()} weeklyRemaining={null} monthlyRemaining={null} />
    );

    expect(screen.getByText('Job Hunt')).toBeInTheDocument();
  });

  it('renders Search and Saved Jobs buttons', () => {
    render(
      <Header view="search" onViewChange={vi.fn()} weeklyRemaining={null} monthlyRemaining={null} />
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Saved Jobs')).toBeInTheDocument();
  });

  it('calls onViewChange when Search is clicked', () => {
    const onViewChange = vi.fn();
    render(
      <Header
        view="saved"
        onViewChange={onViewChange}
        weeklyRemaining={null}
        monthlyRemaining={null}
      />
    );

    fireEvent.click(screen.getByText('Search'));
    expect(onViewChange).toHaveBeenCalledWith('search');
  });

  it('calls onViewChange when Saved Jobs is clicked', () => {
    const onViewChange = vi.fn();
    render(
      <Header
        view="search"
        onViewChange={onViewChange}
        weeklyRemaining={null}
        monthlyRemaining={null}
      />
    );

    fireEvent.click(screen.getByText('Saved Jobs'));
    expect(onViewChange).toHaveBeenCalledWith('saved');
  });

  it('displays quota when available', () => {
    render(
      <Header view="search" onViewChange={vi.fn()} weeklyRemaining={45} monthlyRemaining={180} />
    );

    expect(screen.getByText(/45\/50 weekly/)).toBeInTheDocument();
    expect(screen.getByText(/180\/200 monthly/)).toBeInTheDocument();
  });

  it('does not display quota when values are null', () => {
    render(
      <Header view="search" onViewChange={vi.fn()} weeklyRemaining={null} monthlyRemaining={null} />
    );

    expect(screen.queryByText(/weekly/)).not.toBeInTheDocument();
    expect(screen.queryByText(/monthly/)).not.toBeInTheDocument();
  });

  it('highlights active view button', () => {
    const { rerender } = render(
      <Header view="search" onViewChange={vi.fn()} weeklyRemaining={null} monthlyRemaining={null} />
    );

    const searchBtn = screen.getByText('Search');
    expect(searchBtn.className).toContain('bg-blue-100');

    rerender(
      <Header view="saved" onViewChange={vi.fn()} weeklyRemaining={null} monthlyRemaining={null} />
    );

    const savedBtn = screen.getByText('Saved Jobs');
    expect(savedBtn.className).toContain('bg-blue-100');
  });
});

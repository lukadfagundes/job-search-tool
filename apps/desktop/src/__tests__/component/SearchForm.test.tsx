import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchForm } from '../../renderer/components/SearchForm.tsx';

describe('SearchForm', () => {
  it('renders the search form with required fields', () => {
    render(<SearchForm onSearch={vi.fn()} loading={false} />);

    expect(screen.getByPlaceholderText(/frontend engineer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/San Francisco/i)).toBeInTheDocument();
    expect(screen.getByText('Search Jobs')).toBeInTheDocument();
  });

  it('disables submit when query is empty', () => {
    render(<SearchForm onSearch={vi.fn()} loading={false} />);
    const button = screen.getByText('Search Jobs');

    expect(button).toBeDisabled();
  });

  it('disables submit when loading', () => {
    render(<SearchForm onSearch={vi.fn()} loading={true} />);

    expect(screen.getByText('Searching...')).toBeDisabled();
  });

  it('calls onSearch with correct params on submit', () => {
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} loading={false} />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'react developer' } });
    fireEvent.submit(queryInput.closest('form')!);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'react developer' }),
      undefined
    );
  });

  it('includes location in the query when provided', () => {
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} loading={false} />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    const locationInput = screen.getByPlaceholderText(/San Francisco/i);

    fireEvent.change(queryInput, { target: { value: 'engineer' } });
    fireEvent.change(locationInput, { target: { value: 'NYC' } });
    fireEvent.submit(queryInput.closest('form')!);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'engineer in NYC' }),
      undefined
    );
  });

  it('toggles advanced filters', () => {
    render(<SearchForm onSearch={vi.fn()} loading={false} />);

    expect(screen.queryByPlaceholderText(/80000/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Show advanced filters'));
    expect(screen.getByPlaceholderText(/80000/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide advanced filters'));
    expect(screen.queryByPlaceholderText(/80000/)).not.toBeInTheDocument();
  });

  it('sends remote_jobs_only when checkbox checked', () => {
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} loading={false} />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'test' } });

    const remoteCheckbox = screen.getByLabelText(/remote only/i);
    fireEvent.click(remoteCheckbox);

    fireEvent.submit(queryInput.closest('form')!);

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ remote_jobs_only: true }),
      undefined
    );
  });

  it('sends filters when advanced options are set', () => {
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} loading={false} />);

    const queryInput = screen.getByPlaceholderText(/frontend engineer/i);
    fireEvent.change(queryInput, { target: { value: 'test' } });

    fireEvent.click(screen.getByText('Show advanced filters'));
    const minSalaryInput = screen.getByPlaceholderText(/80000/);
    fireEvent.change(minSalaryInput, { target: { value: '100000' } });

    fireEvent.submit(queryInput.closest('form')!);

    expect(onSearch).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ minSalary: 100000 })
    );
  });
});

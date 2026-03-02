import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../../renderer/components/Settings.tsx';

describe('Settings', () => {
  beforeEach(() => {
    window.electronAPI.getApiKeyStatus = vi
      .fn()
      .mockResolvedValue({ success: true, hasKey: false });
    window.electronAPI.saveApiKey = vi.fn();
    window.electronAPI.removeApiKey = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.getGeminiKeyStatus = vi
      .fn()
      .mockResolvedValue({ success: true, hasKey: false });
    window.electronAPI.saveGeminiKey = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.removeGeminiKey = vi.fn().mockResolvedValue({ success: true });
  });

  it('renders General, API, and AI Resume Parsing sections', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('AI Resume Parsing')).toBeInTheDocument();
  });

  it('renders dark mode toggle', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
  });

  it('calls onToggleDarkMode when toggle is clicked', () => {
    const onToggle = vi.fn();
    render(<Settings darkMode={false} onToggleDarkMode={onToggle} />);

    fireEvent.click(screen.getByTestId('dark-mode-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders API key input and save button', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    expect(screen.getByTestId('api-key-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-api-key')).toBeInTheDocument();
  });

  it('disables save button when input is empty', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByTestId('save-api-key')).toBeDisabled();
  });

  it('calls saveApiKey on save and shows success message', async () => {
    (window.electronAPI.saveApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    const input = screen.getByTestId('api-key-input');
    fireEvent.change(input, { target: { value: 'test-key-123' } });
    fireEvent.click(screen.getByTestId('save-api-key'));

    await waitFor(() => {
      expect(screen.getByTestId('api-key-message')).toHaveTextContent('validated and saved');
    });

    expect(window.electronAPI.saveApiKey).toHaveBeenCalledWith('test-key-123');
  });

  it('shows error message when API key validation fails', async () => {
    (window.electronAPI.saveApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Invalid key',
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    const input = screen.getByTestId('api-key-input');
    fireEvent.change(input, { target: { value: 'bad-key' } });
    fireEvent.click(screen.getByTestId('save-api-key'));

    await waitFor(() => {
      expect(screen.getByTestId('api-key-message')).toHaveTextContent('Invalid key');
    });
  });

  it('shows configured status when key exists', async () => {
    (window.electronAPI.getApiKeyStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      hasKey: true,
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('API key is configured')).toBeInTheDocument();
    });
  });

  it('removes API key when remove button is clicked', async () => {
    (window.electronAPI.getApiKeyStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      hasKey: true,
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('remove-api-key')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('remove-api-key'));

    await waitFor(() => {
      expect(window.electronAPI.removeApiKey).toHaveBeenCalled();
    });
  });

  it('toggles How to Get guide', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    expect(screen.queryByTestId('api-key-guide')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('how-to-get-toggle'));
    expect(screen.getByTestId('api-key-guide')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('how-to-get-toggle'));
    expect(screen.queryByTestId('api-key-guide')).not.toBeInTheDocument();
  });

  it('guide contains RapidAPI instructions', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    fireEvent.click(screen.getByTestId('how-to-get-toggle'));
    expect(screen.getByText(/rapidapi\.com/)).toBeInTheDocument();
    expect(screen.getByText(/JSearch/)).toBeInTheDocument();
  });

  // Gemini key
  it('renders Gemini key input and save button', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    expect(screen.getByTestId('gemini-key-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-gemini-key')).toBeInTheDocument();
  });

  it('disables Gemini save button when input is empty', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);
    expect(screen.getByTestId('save-gemini-key')).toBeDisabled();
  });

  it('saves Gemini key and shows success message', async () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    const input = screen.getByTestId('gemini-key-input');
    fireEvent.change(input, { target: { value: 'gemini-key-abc' } });
    fireEvent.click(screen.getByTestId('save-gemini-key'));

    await waitFor(() => {
      expect(screen.getByTestId('gemini-key-message')).toHaveTextContent('saved');
    });

    expect(window.electronAPI.saveGeminiKey).toHaveBeenCalledWith('gemini-key-abc');
  });

  it('shows Gemini configured status when key exists', async () => {
    (window.electronAPI.getGeminiKeyStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      hasKey: true,
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Gemini API key is configured')).toBeInTheDocument();
    });
  });

  it('removes Gemini key when remove button is clicked', async () => {
    (window.electronAPI.getGeminiKeyStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      hasKey: true,
    });

    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('remove-gemini-key')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('remove-gemini-key'));

    await waitFor(() => {
      expect(window.electronAPI.removeGeminiKey).toHaveBeenCalled();
    });
  });

  it('toggles Gemini How to Get guide', () => {
    render(<Settings darkMode={false} onToggleDarkMode={vi.fn()} />);

    expect(screen.queryByTestId('gemini-key-guide')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gemini-how-to-get-toggle'));
    expect(screen.getByTestId('gemini-key-guide')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gemini-how-to-get-toggle'));
    expect(screen.queryByTestId('gemini-key-guide')).not.toBeInTheDocument();
  });
});

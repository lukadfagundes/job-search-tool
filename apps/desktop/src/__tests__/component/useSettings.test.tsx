import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../renderer/hooks/useSettings.ts';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to darkMode false', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.darkMode).toBe(false);
  });

  it('toggles dark mode', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    const stored = JSON.parse(localStorage.getItem('job-hunt-settings')!);
    expect(stored.darkMode).toBe(true);
  });

  it('loads existing settings from localStorage', () => {
    localStorage.setItem('job-hunt-settings', JSON.stringify({ darkMode: true }));

    const { result } = renderHook(() => useSettings());
    expect(result.current.darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('job-hunt-settings', 'not-json');

    const { result } = renderHook(() => useSettings());
    expect(result.current.darkMode).toBe(false);
  });

  it('removes dark class when toggling off', () => {
    localStorage.setItem('job-hunt-settings', JSON.stringify({ darkMode: true }));

    const { result } = renderHook(() => useSettings());
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppVersion } from '../../renderer/hooks/useAppVersion.ts';

describe('useAppVersion', () => {
  it('starts with empty string', () => {
    const { result } = renderHook(() => useAppVersion());
    expect(result.current).toBe('');
  });

  it('resolves to app version from electronAPI', async () => {
    (window.electronAPI.getAppVersion as ReturnType<typeof vi.fn>).mockResolvedValue('1.2.3');

    const { result } = renderHook(() => useAppVersion());

    await vi.waitFor(() => {
      expect(result.current).toBe('1.2.3');
    });
  });
});

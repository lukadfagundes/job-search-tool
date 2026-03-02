import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

const mockElectronAPI = {
  searchJobs: vi.fn(),
  getJobDetails: vi.fn(),
  getQuota: vi.fn(),
  saveApiKey: vi.fn(),
  getApiKeyStatus: vi.fn().mockResolvedValue({ success: true, hasKey: false }),
  removeApiKey: vi.fn().mockResolvedValue({ success: true }),
};

// Expose mock electronAPI on window (only in browser-like environments)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
  });
}

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  // Re-apply default return values after clearAllMocks
  mockElectronAPI.getApiKeyStatus.mockResolvedValue({ success: true, hasKey: false });
  mockElectronAPI.removeApiKey.mockResolvedValue({ success: true });
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

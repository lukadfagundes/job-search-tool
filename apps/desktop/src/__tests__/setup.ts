import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const mockElectronAPI = {
  searchJobs: vi.fn(),
  getJobDetails: vi.fn(),
  getQuota: vi.fn(),
};

// Expose mock electronAPI on window
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

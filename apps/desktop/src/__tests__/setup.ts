import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock react-konva and konva to avoid canvas dependency in jsdom
vi.mock('react-konva', () => ({
  Stage: vi.fn(({ children }: { children: React.ReactNode }) => children),
  Layer: vi.fn(({ children }: { children: React.ReactNode }) => children),
  Rect: vi.fn(() => null),
  Circle: vi.fn(() => null),
  Ellipse: vi.fn(() => null),
  Line: vi.fn(() => null),
  Text: vi.fn(() => null),
  Image: vi.fn(() => null),
  Group: vi.fn(({ children }: { children: React.ReactNode }) => children),
  Path: vi.fn(() => null),
  Transformer: vi.fn(() => null),
}));

vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(),
    Layer: vi.fn(),
  },
}));

const mockElectronAPI = {
  searchJobs: vi.fn(),
  getJobDetails: vi.fn(),
  getQuota: vi.fn(),
  saveApiKey: vi.fn(),
  getApiKeyStatus: vi.fn().mockResolvedValue({ success: true, hasKey: false }),
  removeApiKey: vi.fn().mockResolvedValue({ success: true }),
  saveResume: vi.fn().mockResolvedValue({ success: true }),
  loadResume: vi.fn().mockResolvedValue({ success: true, data: null }),
  pickResumeFile: vi.fn().mockResolvedValue({ success: true, cancelled: true }),
  parseResumeText: vi.fn().mockResolvedValue({ success: true, data: {} }),
  saveGeminiKey: vi.fn().mockResolvedValue({ success: true }),
  getGeminiKeyStatus: vi.fn().mockResolvedValue({ success: true, hasKey: false }),
  removeGeminiKey: vi.fn().mockResolvedValue({ success: true }),
  generateResume: vi
    .fn()
    .mockResolvedValue({ success: true, filePath: '/downloads/Resume_Test.pdf' }),
  generateCV: vi.fn().mockResolvedValue({ success: true, filePath: '/downloads/CV_Test.pdf' }),
  generateResumeDocx: vi
    .fn()
    .mockResolvedValue({ success: true, filePath: '/downloads/Resume_Test.docx' }),
  generateCVDocx: vi.fn().mockResolvedValue({ success: true, filePath: '/downloads/CV_Test.docx' }),
  checkForUpdates: vi.fn().mockResolvedValue(null),
  downloadUpdate: vi.fn().mockResolvedValue(undefined),
  installUpdate: vi.fn().mockResolvedValue(undefined),
  getAppVersion: vi.fn().mockResolvedValue('0.0.1'),
  onUpdaterEvent: vi.fn().mockReturnValue(() => {}),
  saveLayout: vi.fn().mockResolvedValue({ success: true, id: 'test-layout' }),
  loadLayout: vi.fn().mockResolvedValue({ success: true, data: null }),
  listLayouts: vi.fn().mockResolvedValue({ success: true, layouts: [] }),
  deleteLayout: vi.fn().mockResolvedValue({ success: true }),
  pickImage: vi.fn().mockResolvedValue({ success: true, cancelled: true }),
  exportPng: vi.fn().mockResolvedValue({ success: true, filePath: '/downloads/resume.png' }),
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
  mockElectronAPI.saveResume.mockResolvedValue({ success: true });
  mockElectronAPI.loadResume.mockResolvedValue({ success: true, data: null });
  mockElectronAPI.pickResumeFile.mockResolvedValue({ success: true, cancelled: true });
  mockElectronAPI.parseResumeText.mockResolvedValue({ success: true, data: {} });
  mockElectronAPI.saveGeminiKey.mockResolvedValue({ success: true });
  mockElectronAPI.getGeminiKeyStatus.mockResolvedValue({ success: true, hasKey: false });
  mockElectronAPI.removeGeminiKey.mockResolvedValue({ success: true });
  mockElectronAPI.generateResume.mockResolvedValue({
    success: true,
    filePath: '/downloads/Resume_Test.pdf',
  });
  mockElectronAPI.generateCV.mockResolvedValue({
    success: true,
    filePath: '/downloads/CV_Test.pdf',
  });
  mockElectronAPI.generateResumeDocx.mockResolvedValue({
    success: true,
    filePath: '/downloads/Resume_Test.docx',
  });
  mockElectronAPI.generateCVDocx.mockResolvedValue({
    success: true,
    filePath: '/downloads/CV_Test.docx',
  });
  mockElectronAPI.checkForUpdates.mockResolvedValue(null);
  mockElectronAPI.downloadUpdate.mockResolvedValue(undefined);
  mockElectronAPI.installUpdate.mockResolvedValue(undefined);
  mockElectronAPI.getAppVersion.mockResolvedValue('0.0.1');
  mockElectronAPI.onUpdaterEvent.mockReturnValue(() => {});
  mockElectronAPI.saveLayout.mockResolvedValue({ success: true, id: 'test-layout' });
  mockElectronAPI.loadLayout.mockResolvedValue({ success: true, data: null });
  mockElectronAPI.listLayouts.mockResolvedValue({ success: true, layouts: [] });
  mockElectronAPI.deleteLayout.mockResolvedValue({ success: true });
  mockElectronAPI.pickImage.mockResolvedValue({ success: true, cancelled: true });
  mockElectronAPI.exportPng.mockResolvedValue({ success: true, filePath: '/downloads/resume.png' });
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

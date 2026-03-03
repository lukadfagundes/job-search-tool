import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  searchJobs: (params: Record<string, unknown>, filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('api:search', params, filters),
  getJobDetails: (jobId: string) => ipcRenderer.invoke('api:job-details', jobId),
  getQuota: () => ipcRenderer.invoke('api:quota'),
  saveApiKey: (key: string) => ipcRenderer.invoke('settings:save-api-key', key),
  getApiKeyStatus: () => ipcRenderer.invoke('settings:get-api-key-status'),
  removeApiKey: () => ipcRenderer.invoke('settings:remove-api-key'),
  saveResume: (data: Record<string, unknown>) => ipcRenderer.invoke('resume:save', data),
  loadResume: () => ipcRenderer.invoke('resume:load'),
  pickResumeFile: () => ipcRenderer.invoke('resume:pick-file'),
  parseResumeText: (text: string) => ipcRenderer.invoke('resume:parse-text', text),
  saveGeminiKey: (key: string) => ipcRenderer.invoke('settings:save-gemini-key', key),
  getGeminiKeyStatus: () => ipcRenderer.invoke('settings:get-gemini-key-status'),
  removeGeminiKey: () => ipcRenderer.invoke('settings:remove-gemini-key'),
  generateResume: (jobData: Record<string, unknown>, resumeData: Record<string, unknown>) =>
    ipcRenderer.invoke('document:generate-resume', jobData, resumeData),
  generateCV: (jobData: Record<string, unknown>, resumeData: Record<string, unknown>) =>
    ipcRenderer.invoke('document:generate-cv', jobData, resumeData),
  generateResumeDocx: (jobData: Record<string, unknown>, resumeData: Record<string, unknown>) =>
    ipcRenderer.invoke('document:generate-resume-docx', jobData, resumeData),
  generateCVDocx: (jobData: Record<string, unknown>, resumeData: Record<string, unknown>) =>
    ipcRenderer.invoke('document:generate-cv-docx', jobData, resumeData),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  getAppVersion: () => ipcRenderer.invoke('updater:get-version'),
  onUpdaterEvent: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, callback);
    return () => {
      ipcRenderer.removeListener(channel, callback);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

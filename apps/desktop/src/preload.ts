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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

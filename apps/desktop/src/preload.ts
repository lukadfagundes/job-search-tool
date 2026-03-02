import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  searchJobs: (params: Record<string, unknown>, filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('api:search', params, filters),
  getJobDetails: (jobId: string) => ipcRenderer.invoke('api:job-details', jobId),
  getQuota: () => ipcRenderer.invoke('api:quota'),
  saveApiKey: (key: string) => ipcRenderer.invoke('settings:save-api-key', key),
  getApiKeyStatus: () => ipcRenderer.invoke('settings:get-api-key-status'),
  removeApiKey: () => ipcRenderer.invoke('settings:remove-api-key'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

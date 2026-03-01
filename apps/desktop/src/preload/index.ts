import { contextBridge, ipcRenderer } from 'electron';
import type { SearchParams, PostFilterOptions } from '@job-hunt/core';

const electronAPI = {
  searchJobs: (params: SearchParams, filters?: PostFilterOptions) =>
    ipcRenderer.invoke('api:search', params, filters),
  getJobDetails: (jobId: string) => ipcRenderer.invoke('api:job-details', jobId),
  getQuota: () => ipcRenderer.invoke('api:quota'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

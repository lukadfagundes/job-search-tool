// API
export { JSearchClient } from './api/client.js';
export type {
  SearchParams,
  SearchResponse,
  JobResult,
  JobDetailsResponse,
  JobRequiredExperience,
  JobRequiredEducation,
  ApplyOption,
  PostFilterOptions,
  SearchProfile,
  SavedJob,
  StorageData,
} from './api/types.js';

// Filters
export {
  applyPostFilters,
  filterBySalaryRange,
  filterByKeywords,
  filterByCompany,
  filterByDirectApply,
  deduplicateJobs,
} from './filters/index.js';

// Storage
export {
  saveJob,
  getSavedJobs,
  removeSavedJob,
  saveProfile,
  getProfiles,
  getProfile,
  removeProfile,
  markJobsSeen,
  getSeenJobIds,
} from './storage/index.js';

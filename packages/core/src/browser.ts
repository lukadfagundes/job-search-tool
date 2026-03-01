// Browser-safe exports — no Node.js APIs (fs, os, path, etc.)

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
  QuotaStatus,
  RateLimitConfig,
} from './api/types.js';

export {
  applyPostFilters,
  filterBySalaryRange,
  filterByKeywords,
  filterByCompany,
  filterByDirectApply,
  deduplicateJobs,
} from './filters/index.js';

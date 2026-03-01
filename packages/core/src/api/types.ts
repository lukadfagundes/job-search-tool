// ── JSearch API Request Types ──

export interface SearchParams {
  query: string;
  page?: number;
  num_pages?: number;
  date_posted?: 'all' | 'today' | '3days' | 'week' | 'month';
  remote_jobs_only?: boolean;
  employment_types?: string; // comma-separated: FULLTIME,PARTTIME,CONTRACTOR,INTERN
  job_requirements?: string; // under_3_years_experience, more_than_3_years_experience, no_experience, no_degree
  radius?: number;
  exclude_job_publishers?: string;
  categories?: string;
}

// ── JSearch API Response Types ──

export interface JobRequiredExperience {
  no_experience_required: boolean;
  required_experience_in_months: number | null;
  experience_mentioned: boolean;
  experience_preferred: boolean;
}

export interface JobRequiredEducation {
  postgraduate_degree: boolean;
  professional_certification: boolean;
  high_school: boolean;
  associates_degree: boolean;
  bachelors_degree: boolean;
  degree_mentioned: boolean;
  degree_preferred: boolean;
  professional_certification_mentioned: boolean;
}

export interface ApplyOption {
  publisher: string;
  apply_link: string;
  is_direct: boolean;
}

export interface JobResult {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_publisher: string;
  job_employment_type: string;
  job_apply_link: string;
  job_apply_is_direct: boolean;
  job_description: string;
  job_is_remote: boolean;
  job_city: string;
  job_state: string;
  job_country: string;
  job_posted_at_datetime_utc: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_benefits: string[] | null;
  job_required_experience: JobRequiredExperience;
  job_required_skills: string[] | null;
  job_required_education: JobRequiredEducation;
  apply_options: ApplyOption[];
}

export interface SearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, string>;
  data: JobResult[];
}

export interface JobDetailsResponse {
  status: string;
  request_id: string;
  data: JobResult[];
}

// ── Client-side Filter Types ──

export interface PostFilterOptions {
  minSalary?: number;
  maxSalary?: number;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  excludeCompanies?: string[];
  directApplyOnly?: boolean;
}

// ── Storage Types ──

export interface SearchProfile {
  name: string;
  params: SearchParams;
  filters?: PostFilterOptions;
  createdAt: string;
}

export interface SavedJob {
  job: JobResult;
  savedAt: string;
  notes?: string;
}

export interface StorageData {
  savedJobs: SavedJob[];
  profiles: SearchProfile[];
  seenJobIds: string[];
}

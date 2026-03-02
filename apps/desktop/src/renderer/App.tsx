import { useState, useCallback, useEffect } from 'react';
import type { JobResult, SearchParams, PostFilterOptions } from '@job-hunt/core/browser';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { JobList } from './components/JobList.tsx';
import { JobDetail } from './components/JobDetail.tsx';
import { SavedJobs } from './components/SavedJobs.tsx';
import { Settings } from './components/Settings.tsx';
import { useJobSearch } from './hooks/useJobSearch.ts';
import { useSettings } from './hooks/useSettings.ts';

interface SavedJobEntry {
  job: JobResult;
  savedAt: string;
}

const STORAGE_KEY = 'job-hunt-saved-jobs';

function loadSavedJobs(): SavedJobEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistSavedJobs(jobs: SavedJobEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export default function App() {
  const [view, setView] = useState<'search' | 'saved' | 'settings'>('search');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJobEntry[]>(loadSavedJobs);

  const { darkMode, toggleDarkMode } = useSettings();
  const { jobs, loading, error, weeklyRemaining, monthlyRemaining, search } = useJobSearch();

  const bookmarkedIds = new Set(savedJobs.map((s) => s.job.job_id));

  // Persist saved jobs to localStorage
  useEffect(() => {
    persistSavedJobs(savedJobs);
  }, [savedJobs]);

  const handleSearch = useCallback(
    (params: SearchParams, filters?: PostFilterOptions) => {
      search(params, filters);
    },
    [search]
  );

  const handleBookmark = useCallback((job: JobResult) => {
    setSavedJobs((prev) => {
      const exists = prev.some((s) => s.job.job_id === job.job_id);
      if (exists) {
        return prev.filter((s) => s.job.job_id !== job.job_id);
      }
      return [...prev, { job, savedAt: new Date().toISOString() }];
    });
  }, []);

  const renderView = () => {
    switch (view) {
      case 'search':
        return (
          <>
            <SearchForm onSearch={handleSearch} loading={loading} />
            <JobList
              jobs={jobs}
              loading={loading}
              error={error}
              onSelectJob={setSelectedJob}
              onBookmark={handleBookmark}
              bookmarkedIds={bookmarkedIds}
            />
          </>
        );
      case 'saved':
        return (
          <SavedJobs
            savedJobs={savedJobs}
            onSelectJob={setSelectedJob}
            onRemoveBookmark={handleBookmark}
          />
        );
      case 'settings':
        return <Settings darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar
        isOpen={sidebarOpen}
        view={view}
        onViewChange={setView}
        onClose={() => setSidebarOpen(false)}
        weeklyRemaining={weeklyRemaining}
        monthlyRemaining={monthlyRemaining}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">{renderView()}</main>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onBookmark={handleBookmark}
          isBookmarked={bookmarkedIds.has(selectedJob.job_id)}
        />
      )}
    </div>
  );
}

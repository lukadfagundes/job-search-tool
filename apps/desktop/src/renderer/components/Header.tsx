import { useAppVersion } from '../hooks/useAppVersion.ts';

const ISSUES_URL = 'https://github.com/lukadfagundes/job-search-tool/issues';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const appVersion = useAppVersion();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1"
          aria-label="Toggle menu"
          data-testid="hamburger-button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Job Hunt</h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => window.open(ISSUES_URL, '_blank')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5"
            aria-label="Report an issue"
            data-testid="issues-button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Issues
          </button>

          {appVersion && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              data-testid="version-badge"
            >
              v{appVersion}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

import { useUpdater } from '../hooks/useUpdater.ts';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function UpdateNotification() {
  const {
    status,
    updateInfo,
    downloadProgress,
    error,
    dismissed,
    appVersion,
    downloadUpdate,
    installUpdate,
    skipVersion,
    remindLater,
    reset,
    checkForUpdates,
  } = useUpdater();

  const isVisible =
    !dismissed &&
    (status === 'available' ||
      status === 'downloading' ||
      status === 'downloaded' ||
      status === 'error');

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="update-notification"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {status === 'available' && (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Update Available
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                A new version of Job Hunt is available.
              </p>
            </div>

            <div className="px-6 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {appVersion}
                </span>
                <span className="text-gray-400">&rarr;</span>
                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {updateInfo?.version}
                </span>
              </div>

              {updateInfo?.releaseDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </p>
              )}

              {updateInfo?.releaseNotes && (
                <div className="rounded-md border border-gray-200 dark:border-gray-600 p-3 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What&apos;s New
                  </h4>
                  <div
                    className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed prose prose-xs dark:prose-invert max-w-none [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_li]:my-0.5 [&_p]:my-1 [&_hr]:my-2 [&_a]:text-blue-500 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }}
                  />
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => updateInfo?.version && skipVersion(updateInfo.version)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 sm:mr-auto"
              >
                Skip This Version
              </button>
              <button
                onClick={remindLater}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Remind Me Later
              </button>
              <button
                onClick={downloadUpdate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download &amp; Install
              </button>
            </div>
          </>
        )}

        {status === 'downloading' && (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Downloading Update
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Downloading version {updateInfo?.version}...
              </p>
            </div>

            <div className="px-6 pb-4 space-y-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress?.percent ?? 0}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{(downloadProgress?.percent ?? 0).toFixed(1)}%</span>
                {downloadProgress && (
                  <span>
                    {formatBytes(downloadProgress.transferred)} /{' '}
                    {formatBytes(downloadProgress.total)}
                    {' \u2022 '}
                    {formatSpeed(downloadProgress.bytesPerSecond)}
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={remindLater}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Download in Background
              </button>
            </div>
          </>
        )}

        {status === 'downloaded' && (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Ready to Install
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Version {updateInfo?.version} has been downloaded and is ready to install.
              </p>
            </div>

            <div className="px-6 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The application will restart to complete the installation.
              </p>
            </div>

            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
              <button
                onClick={remindLater}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mr-auto"
              >
                Install Later
              </button>
              <button
                onClick={installUpdate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Restart &amp; Install
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Update Error
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                There was a problem checking for or downloading updates.
              </p>
            </div>

            {error && (
              <div className="px-6 pb-4">
                <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
              <button
                onClick={remindLater}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mr-auto"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  reset();
                  checkForUpdates();
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

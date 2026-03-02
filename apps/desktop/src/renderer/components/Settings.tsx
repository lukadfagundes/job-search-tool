import { useState, useEffect } from 'react';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    window.electronAPI.getApiKeyStatus().then((result) => {
      if (result.success) {
        setHasStoredKey(result.hasKey);
      }
    });
  }, []);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);

    const result = await window.electronAPI.saveApiKey(apiKey.trim());

    if (result.success) {
      setMessage({ type: 'success', text: 'API key validated and saved.' });
      setHasStoredKey(true);
      setApiKey('');
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to save API key.' });
    }

    setSaving(false);
  };

  const handleRemoveKey = async () => {
    const result = await window.electronAPI.removeApiKey();
    if (result.success) {
      setHasStoredKey(false);
      setMessage({ type: 'success', text: 'API key removed.' });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* General */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Toggle dark theme for the application
            </p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={darkMode}
            data-testid="dark-mode-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* API */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API</h3>

        {/* Status */}
        {hasStoredKey && (
          <div className="flex items-center justify-between mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <span className="text-sm text-green-700 dark:text-green-400">
              API key is configured
            </span>
            <button
              onClick={handleRemoveKey}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
              data-testid="remove-api-key"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            RapidAPI Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasStoredKey ? 'Enter new key to replace' : 'Enter your RapidAPI key'}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              data-testid="api-key-input"
            />
            <button
              onClick={handleSaveKey}
              disabled={saving || !apiKey.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              data-testid="save-api-key"
            >
              {saving ? 'Validating...' : 'Save'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <p
              className={`text-sm ${
                message.type === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="api-key-message"
            >
              {message.text}
            </p>
          )}
        </div>

        {/* How to Get guide */}
        <div className="mt-4">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            data-testid="how-to-get-toggle"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showGuide ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            How to Get
          </button>

          {showGuide && (
            <div
              className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-2"
              data-testid="api-key-guide"
            >
              <p className="font-medium text-gray-900 dark:text-white">
                Getting your RapidAPI key:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{' '}
                  <a
                    href="https://rapidapi.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    rapidapi.com
                  </a>{' '}
                  and create a free account
                </li>
                <li>
                  Search for <strong>"JSearch"</strong> by OpenWeb Ninja
                </li>
                <li>Subscribe to the free plan (500 requests/month)</li>
                <li>
                  Go to the <strong>Endpoints</strong> tab and find your key in the{' '}
                  <strong>X-RapidAPI-Key</strong> header
                </li>
                <li>Copy the key and paste it above</li>
              </ol>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Your key is encrypted and stored securely on your device.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

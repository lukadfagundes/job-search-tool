import { useState, useEffect, useCallback } from 'react';

interface Settings {
  darkMode: boolean;
}

const SETTINGS_KEY = 'job-hunt-settings';

function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { darkMode: false };
  } catch {
    return { darkMode: false };
  }
}

function persistSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyDarkMode(dark: boolean): void {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Apply dark mode class on mount and whenever it changes
  useEffect(() => {
    applyDarkMode(settings.darkMode);
    persistSettings(settings);
  }, [settings]);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  return {
    darkMode: settings.darkMode,
    toggleDarkMode,
  };
}

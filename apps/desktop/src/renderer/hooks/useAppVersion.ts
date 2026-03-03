import { useState, useEffect } from 'react';

export function useAppVersion(): string {
  const [version, setVersion] = useState('');

  useEffect(() => {
    window.electronAPI.getAppVersion().then((v) => setVersion(v));
  }, []);

  return version;
}

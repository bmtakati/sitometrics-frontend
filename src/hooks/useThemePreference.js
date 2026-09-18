import { useState, useEffect, useCallback } from 'react';
import {
  getInitialThemePreference,
  resolveDarkMode,
  applyThemePreference,
  applyResolvedDarkMode,
} from '../utils/theme';

/**
 * Theme preference (light / dark / system) with resolved darkMode for styling.
 * System mode follows prefers-color-scheme and updates when the OS setting changes.
 * Multiple hook consumers stay in sync via themePreferenceChanged / darkModeChanged.
 */
export function useThemePreference() {
  const [themePreference, setThemePreferenceState] = useState(getInitialThemePreference);
  const [darkMode, setDarkMode] = useState(() => resolveDarkMode(getInitialThemePreference()));

  const setThemePreference = useCallback((preference) => {
    setThemePreferenceState(preference);
    const resolved = applyThemePreference(preference);
    setDarkMode(resolved);
  }, []);

  useEffect(() => {
    const resolved = applyThemePreference(themePreference);
    setDarkMode(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync document once on mount
  }, []);

  useEffect(() => {
    const onPreferenceChanged = (event) => {
      const nextPreference = event.detail?.preference;
      if (nextPreference === 'light' || nextPreference === 'dark' || nextPreference === 'system') {
        setThemePreferenceState(nextPreference);
      }
      if (typeof event.detail?.darkMode === 'boolean') {
        setDarkMode(event.detail.darkMode);
      }
    };

    const onDarkModeChanged = (event) => {
      if (typeof event.detail?.darkMode === 'boolean') {
        setDarkMode(event.detail.darkMode);
      }
    };

    window.addEventListener('themePreferenceChanged', onPreferenceChanged);
    window.addEventListener('darkModeChanged', onDarkModeChanged);
    return () => {
      window.removeEventListener('themePreferenceChanged', onPreferenceChanged);
      window.removeEventListener('darkModeChanged', onDarkModeChanged);
    };
  }, []);

  useEffect(() => {
    if (themePreference !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const resolved = resolveDarkMode('system');
      setDarkMode(resolved);
      applyResolvedDarkMode(resolved);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themePreference]);

  return { themePreference, setThemePreference, darkMode };
}

export default useThemePreference;

export const THEME_PREF_KEY = 'themePreference';
const DARK_MODE_KEY = 'darkMode';

export const THEME_OPTIONS = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve whether dark mode is active for a stored preference. */
export function resolveDarkMode(preference) {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return getSystemPrefersDark();
}

export function getInitialThemePreference() {
  const stored = localStorage.getItem(THEME_PREF_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  const legacy = localStorage.getItem(DARK_MODE_KEY);
  if (legacy === 'true') return 'dark';
  if (legacy === 'false') return 'light';
  return 'system';
}

export function applyResolvedDarkMode(darkMode) {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem(DARK_MODE_KEY, 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem(DARK_MODE_KEY, 'false');
  }
  window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { darkMode } }));
}

/** Persist preference and apply resolved light/dark to the document. */
export function applyThemePreference(preference) {
  localStorage.setItem(THEME_PREF_KEY, preference);
  const darkMode = resolveDarkMode(preference);
  applyResolvedDarkMode(darkMode);
  return darkMode;
}

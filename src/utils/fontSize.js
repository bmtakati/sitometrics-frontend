export const FONT_SIZE_PREF_KEY = 'fontSizePreference';

export const FONT_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small', px: 14 },
  { value: 'md', label: 'Medium', px: 16 },
  { value: 'lg', label: 'Large', px: 18 },
  { value: 'xl', label: 'Extra large', px: 20 },
];

const VALID = new Set(FONT_SIZE_OPTIONS.map((o) => o.value));

export function getInitialFontSizePreference() {
  const stored = localStorage.getItem(FONT_SIZE_PREF_KEY);
  return VALID.has(stored) ? stored : 'md';
}

export function getFontSizePx(preference) {
  const opt = FONT_SIZE_OPTIONS.find((o) => o.value === preference);
  return opt?.px ?? 16;
}

/** Apply root font size so rem-based UI scales app-wide. */
export function applyFontSizePreference(preference) {
  const value = VALID.has(preference) ? preference : 'md';
  const px = getFontSizePx(value);
  localStorage.setItem(FONT_SIZE_PREF_KEY, value);
  document.documentElement.setAttribute('data-font-size', value);
  document.documentElement.style.fontSize = `${px}px`;
  window.dispatchEvent(
    new CustomEvent('fontSizeChanged', { detail: { preference: value, px } })
  );
  return value;
}

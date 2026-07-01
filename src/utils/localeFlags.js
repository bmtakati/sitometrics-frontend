/** Default flag assets under Laravel public/assets/images/flags */
export const LOCALE_FLAG_ASSETS = {
  en: '/assets/images/flags/english.svg',
  sw: '/assets/images/flags/swahili.svg',
};

export function defaultFlagAssetForCode(code) {
  const normalized = String(code || '').trim().toLowerCase();
  return LOCALE_FLAG_ASSETS[normalized] || null;
}

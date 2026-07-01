import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../context/AuthContext';
import { resolveApiAssetUrl, resolveLocaleFlagUrl } from '../utils/resolveApiAssetUrl';
import { defaultFlagAssetForCode } from '../utils/localeFlags';
import { LANGUAGE_OPTIONS } from '../components/NavIconDropdown';

const mapLocaleToOption = (row) => {
  const flagFromApi = resolveLocaleFlagUrl(row);
  const fallbackAsset = defaultFlagAssetForCode(row.code);
  const flagUrl =
    flagFromApi ||
    (fallbackAsset ? resolveApiAssetUrl(fallbackAsset) : null);

  return {
    value: String(row.code || '').trim(),
    label: row.native_name || row.name || row.code,
    flagUrl,
  };
};

/**
 * Language preference with options loaded from GET /api/locales/active.
 * Flags are served from backend public/assets/images/flags (via flag_url).
 */
export function useLanguagePreference() {
  const [languageOptions, setLanguageOptions] = useState(LANGUAGE_OPTIONS);
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('language');
    return stored || 'en';
  });
  const [languageLoading, setLanguageLoading] = useState(true);

  const fetchLocales = useCallback(async () => {
    try {
      setLanguageLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/locales/active`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(payload?.data) && payload.data.length > 0) {
        const options = payload.data.map(mapLocaleToOption).filter((o) => o.value);
        setLanguageOptions(options);
        setLanguage((prev) => {
          const codes = options.map((o) => o.value);
          return codes.includes(prev) ? prev : options[0].value;
        });
      }
    } catch {
      // keep fallback LANGUAGE_OPTIONS with bundled asset paths
    } finally {
      setLanguageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocales();
  }, [fetchLocales]);

  useEffect(() => {
    if (language) {
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
    }
  }, [language]);

  return {
    language,
    setLanguage,
    languageOptions,
    languageLoading,
    refreshLanguageOptions: fetchLocales,
  };
}

export default useLanguagePreference;

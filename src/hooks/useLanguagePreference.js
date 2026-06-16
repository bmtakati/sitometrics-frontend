import { useState, useEffect, useCallback } from 'react';
import { FiGlobe } from 'react-icons/fi';
import { API_BASE_URL } from '../context/AuthContext';
import { resolveLocaleFlagUrl } from '../utils/resolveApiAssetUrl';
import { LANGUAGE_OPTIONS } from '../components/NavIconDropdown';

const mapLocaleToOption = (row) => ({
  value: String(row.code || '').trim(),
  label: row.name || row.code,
  Icon: FiGlobe,
  flagUrl: resolveLocaleFlagUrl(row) || null,
});

/**
 * Language preference with options loaded from GET /api/locales/active.
 * Falls back to static LANGUAGE_OPTIONS if the API is unavailable.
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
      // keep fallback LANGUAGE_OPTIONS
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

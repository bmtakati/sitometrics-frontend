import { useState, useEffect, useCallback } from 'react';
import {
  getInitialFontSizePreference,
  applyFontSizePreference,
} from '../utils/fontSize';

export function useFontSizePreference() {
  const [fontSizePreference, setFontSizePreferenceState] = useState(
    getInitialFontSizePreference
  );

  const setFontSizePreference = useCallback((preference) => {
    const applied = applyFontSizePreference(preference);
    setFontSizePreferenceState(applied);
  }, []);

  useEffect(() => {
    const applied = applyFontSizePreference(fontSizePreference);
    setFontSizePreferenceState(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync document once on mount
  }, []);

  return { fontSizePreference, setFontSizePreference };
}

export default useFontSizePreference;

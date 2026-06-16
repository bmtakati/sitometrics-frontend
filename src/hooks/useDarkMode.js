import { useState, useEffect } from 'react';

/**
 * Hook that reads darkMode from localStorage and listens for
 * the 'darkModeChanged' custom event dispatched by the Header toggle.
 *
 * @returns {boolean} darkMode – true when dark mode is active
 */
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  useEffect(() => {
    const handle = (event) => setDarkMode(event.detail.darkMode);
    window.addEventListener('darkModeChanged', handle);
    return () => window.removeEventListener('darkModeChanged', handle);
  }, []);

  return darkMode;
};

export default useDarkMode;

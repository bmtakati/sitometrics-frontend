import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PosModeContext = createContext({
  posMode: false,
  setPosMode: () => {},
  enterFullscreen: async () => false,
  exitFullscreen: async () => {},
  isFullscreen: false,
});

export const PosModeProvider = ({ children }) => {
  const [posMode, setPosModeState] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('pos-mode', posMode);
    return () => document.body.classList.remove('pos-mode');
  }, [posMode]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
    } catch {
      // Browsers may block without a user gesture; POS layout still works.
    }
    return false;
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const setPosMode = useCallback(
    (enabled) => {
      setPosModeState(Boolean(enabled));
      if (!enabled) {
        exitFullscreen();
      }
    },
    [exitFullscreen]
  );

  const value = useMemo(
    () => ({ posMode, setPosMode, enterFullscreen, exitFullscreen, isFullscreen }),
    [posMode, setPosMode, enterFullscreen, exitFullscreen, isFullscreen]
  );

  return <PosModeContext.Provider value={value}>{children}</PosModeContext.Provider>;
};

export const usePosMode = () => useContext(PosModeContext);

export default PosModeContext;

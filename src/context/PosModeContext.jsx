import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const PosModeContext = createContext({
  posMode: false,
  setPosMode: () => {},
  enterFullscreen: async () => false,
  exitFullscreen: async () => {},
  isFullscreen: false,
});

let posModeValue = false;
const listeners = new Set();

const applyPosModeDom = (enabled) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('pos-mode', enabled);
  document.body.classList.toggle('pos-mode', enabled);
  if (enabled) {
    document.documentElement.setAttribute('data-pos-mode', '1');
  } else {
    document.documentElement.removeAttribute('data-pos-mode');
  }

  const styleId = 'sitometrics-pos-hide-chrome';
  let style = document.getElementById(styleId);
  if (enabled) {
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        [data-app-sidebar],
        [data-app-header],
        [data-app-sidebar-backdrop] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        .app-main-offset {
          margin-left: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      `;
      document.head.appendChild(style);
    }
  } else if (style) {
    style.remove();
  }
};

export const getPosMode = () => posModeValue;

export const subscribePosMode = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const publishPosMode = (enabled) => {
  const next = Boolean(enabled);
  if (posModeValue === next) {
    applyPosModeDom(next);
    return;
  }
  posModeValue = next;
  applyPosModeDom(next);
  listeners.forEach((listener) => listener());
};

export const PosModeProvider = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const posMode = useSyncExternalStore(subscribePosMode, getPosMode, () => false);

  const lockExitKeys = useCallback(async () => {
    try {
      // While locked, Escape/F11 stay in the page and do not leave fullscreen.
      if (document.fullscreenElement && navigator.keyboard?.lock) {
        await navigator.keyboard.lock(['Escape', 'F11']);
      }
    } catch {
      // Keyboard Lock is unavailable (Safari/Firefox). Overlay is the fallback.
    }
  }, []);

  const unlockExitKeys = useCallback(() => {
    try {
      navigator.keyboard?.unlock?.();
    } catch {
      // ignore
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        } catch {
          await document.documentElement.requestFullscreen();
        }
      }
      if (document.fullscreenElement) {
        await lockExitKeys();
        setNeedsGesture(false);
        return true;
      }
    } catch {
      // A rejected re-entry has no user gesture; the overlay collects one.
    }
    return false;
  }, [lockExitKeys]);

  const exitFullscreen = useCallback(async () => {
    unlockExitKeys();
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, [unlockExitKeys]);

  useEffect(() => {
    if (!posMode) {
      setNeedsGesture(false);
      unlockExitKeys();
      return undefined;
    }

    let cancelled = false;

    const lock = async () => {
      if (!getPosMode() || document.fullscreenElement) {
        setNeedsGesture(false);
        return;
      }
      const ok = await enterFullscreen();
      if (!cancelled && !ok && !document.fullscreenElement) {
        setNeedsGesture(true);
      }
    };

    const onChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (getPosMode() && !active) {
        lock();
      }
    };

    const blockExitKeys = (event) => {
      if (!getPosMode()) return;
      if (event.key === 'Escape' || event.key === 'F11' || event.key === 'F5') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', blockExitKeys, true);
    lock();

    return () => {
      cancelled = true;
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', blockExitKeys, true);
    };
  }, [posMode, enterFullscreen, unlockExitKeys]);

  const setPosMode = useCallback(
    (enabled) => {
      publishPosMode(enabled);
      if (enabled) {
        enterFullscreen();
      } else {
        setNeedsGesture(false);
        exitFullscreen();
      }
    },
    [enterFullscreen, exitFullscreen]
  );

  const value = useMemo(
    () => ({ posMode, setPosMode, enterFullscreen, exitFullscreen, isFullscreen }),
    [posMode, setPosMode, enterFullscreen, exitFullscreen, isFullscreen]
  );

  return (
    <PosModeContext.Provider value={value}>
      {children}
      {posMode && needsGesture ? (
        <button
          type="button"
          onClick={enterFullscreen}
          className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-stone-950 px-6 text-center text-white"
          style={{ zIndex: 2147483646 }}
        >
          <span className="text-3xl font-bold">POS mode</span>
          <span className="max-w-md text-xl">Tap the screen to continue in fullscreen.</span>
        </button>
      ) : null}
    </PosModeContext.Provider>
  );
};

export const usePosMode = () => {
  const context = useContext(PosModeContext);
  const posMode = useSyncExternalStore(subscribePosMode, getPosMode, () => false);
  return { ...context, posMode };
};

export default PosModeContext;

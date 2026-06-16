import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

// API base URL from environment
// Default must match the Laravel `php artisan serve` port (typically 8000).
// Landing/public FAQ pages already default to 8000; admin CRUD must be consistent.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// How many minutes before expiry to proactively refresh. Default 10 min.
const REFRESH_BEFORE_EXPIRY_MS = (import.meta.env.VITE_TOKEN_REFRESH_WINDOW_MINUTES || 10) * 60 * 1000;

// Activity check throttle: don't re-check more often than this (ms).
const ACTIVITY_THROTTLE_MS = 60 * 1000; // 1 minute

// Events that count as user activity
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

/**
 * Decode a JWT without a library and return the `exp` timestamp in milliseconds.
 * Returns null if the token is missing / malformed.
 */
const parseTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef    = useRef(null);  // scheduled pre-expiry refresh
  const lastActivityRef    = useRef(0);     // timestamp of last activity check
  const activityBoundRef   = useRef(null);  // bound handler for cleanup

  // ── Refresh token ────────────────────────────────────────────────────
  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) return false;
      const json = await res.json();
      const newToken = json.data?.token || json.token || json.access_token;
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        return newToken;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ── Smart expiry-aware scheduler ─────────────────────────────────────
  // Reads the stored token's `exp` claim and sets a single timeout to fire
  // REFRESH_BEFORE_EXPIRY_MS before the token expires.  After a successful
  // refresh the new token is stored and the scheduler is called again.
  const scheduleSmartRefresh = useCallback((tokenOverride) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const token = tokenOverride || localStorage.getItem('auth_token');
    const expiry = parseTokenExpiry(token);
    if (!expiry) return;

    const msUntilRefresh = expiry - Date.now() - REFRESH_BEFORE_EXPIRY_MS;

    // If we're already inside the refresh window (or past it), refresh now.
    const delay = Math.max(msUntilRefresh, 0);

    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await refreshToken();
      if (newToken) {
        scheduleSmartRefresh(newToken);
      } else {
        // Could not refresh — force logout
        logout(); // eslint-disable-line no-use-before-define
      }
    }, delay);
  }, [refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // ── Activity-based safety net ─────────────────────────────────────────
  // Throttled listener: if user is active and the token will expire within
  // REFRESH_BEFORE_EXPIRY_MS, refresh right away and reschedule.
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return; // throttle
    lastActivityRef.current = now;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const expiry = parseTokenExpiry(token);
    if (!expiry) return;

    if (expiry - now < REFRESH_BEFORE_EXPIRY_MS) {
      // Within the refresh window — refresh now
      refreshToken().then((newToken) => {
        if (newToken) scheduleSmartRefresh(newToken);
      });
    }
  }, [refreshToken, scheduleSmartRefresh]);

  const startActivityListeners = useCallback(() => {
    activityBoundRef.current = handleActivity;
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, activityBoundRef.current, { passive: true })
    );
  }, [handleActivity]);

  const stopActivityListeners = useCallback(() => {
    if (activityBoundRef.current) {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, activityBoundRef.current)
      );
      activityBoundRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const authToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');
    if (authToken && storedUser) {
      let userData = null;
      try {
        userData = JSON.parse(storedUser);
      } catch {
        // Corrupted local storage can crash bootstrap and result in a white page.
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
        setUser(null);
        setLoading(false);
        return () => {
          stopRefreshTimer();
          stopActivityListeners();
        };
      }
      setUser(userData);

      // ── KEY FIX: start the expiry timer and activity listeners so the
      // session keeps refreshing even after a full page reload. ──────────
      scheduleSmartRefresh(authToken);
      startActivityListeners();
      // If stored user is stale (missing scope or permissions), silently fetch
      // fresh user data from the API without forcing a re-login.
      if (!userData.scope || !Array.isArray(userData.permissions?.flat)) {
        fetch(`${API_BASE_URL}/api/user`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        })
          .then(r => r.ok ? r.json() : null)
          .then(json => {
            const fresh = json?.data?.user;
            const permissions = json?.data?.permissions;
            if (fresh) {
              const enriched = {
                ...fresh,
                role_names: Array.isArray(json.data?.roles)
                  ? json.data.roles
                  : (fresh.role_names ?? []),
                permissions: permissions ?? fresh.permissions ?? userData.permissions ?? null,
              };
              setUser(enriched);
              localStorage.setItem('user_data', JSON.stringify(enriched));
            }
          })
          .catch(() => {});
      }
    } else {
      setUser(null);
    }
    setLoading(false);
    return () => {
      stopRefreshTimer();
      stopActivityListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (email, password) => {
    return (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.data) {
          return { success: false, message: data?.message || 'Login failed' };
        }

        const { user: userObj, token, roles, permissions } = data.data;
        if (!token || !userObj) {
          return { success: false, message: data?.message || 'Login failed' };
        }

        // Merge roles into the stored user object so the Header (and any
        // component) can read them without an extra API call.
        const enrichedUser = {
          ...userObj,
          role_names: Array.isArray(roles) ? roles : (userObj.role_names ?? []),
          permissions: permissions ?? userObj.permissions ?? null,
        };

        setAuthUser(enrichedUser, token);
        return { success: true, message: 'Login successful' };
      } catch (e) {
        return { success: false, message: e?.message || 'Network error' };
      }
    })();
  };

  const logout = () => {
    stopRefreshTimer();
    stopActivityListeners();
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('sqas_user');
  };

  const setAuthUser = (userData, token) => {
    setUser(userData);
    if (token) {
      localStorage.setItem('auth_token', token);
      scheduleSmartRefresh(token);
    }
    localStorage.setItem('user_data', JSON.stringify(userData));
    startActivityListeners();
  };

  const value = {
    user,
    login,
    logout,
    setAuthUser,
    refreshToken,
    loading,
    // Only consider authenticated when JWT token exists too.
    isAuthenticated: !!user && !!localStorage.getItem('auth_token'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


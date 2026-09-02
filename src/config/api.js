const normalizeBase = (base) => String(base || '').replace(/\/$/, '');

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Resolve an API path for fetch calls.
 * In dev, use same-origin `/api/...` via the Vite proxy to avoid CORS issues.
 */
export const resolveApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.DEV) {
    return normalizedPath;
  }

  return `${normalizeBase(API_BASE_URL)}${normalizedPath}`;
};

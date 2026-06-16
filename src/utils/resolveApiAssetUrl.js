/**
 * Turn relative API paths (e.g. /storage/...) into absolute URLs using VITE_API_BASE_URL.
 */
export function resolveApiAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return '';

  const storagePath = extractPublicStoragePath(pathOrUrl);
  if (storagePath) {
    if (import.meta.env.DEV) {
      return storagePath;
    }
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    try {
      return new URL(storagePath, `${base}/`).href;
    } catch {
      return storagePath;
    }
  }

  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  try {
    return new URL(path, `${base}/`).href;
  } catch {
    return pathOrUrl;
  }
}

/**
 * Normalize Laravel storage URLs/paths to /storage/... (works with Vite dev proxy).
 */
export function extractPublicStoragePath(pathOrUrl) {
  if (!pathOrUrl) return null;
  const raw = String(pathOrUrl).trim();

  if (raw.startsWith('/storage/')) {
    return raw.split('?')[0];
  }

  if (!raw.includes('://')) {
    const normalized = raw.replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) {
      return `/${normalized.split('?')[0]}`;
    }
    if (normalized.startsWith('locale-flags/')) {
      return `/storage/${normalized.split('?')[0]}`;
    }
    return null;
  }

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/storage/')) {
      return u.pathname;
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolve locale flag for tables and language switcher. */
export function resolveLocaleFlagUrl(locale) {
  if (!locale) return '';
  const path =
    locale.flag_url ||
    (locale.flag_path ? `/storage/${String(locale.flag_path).replace(/^\/+/, '')}` : '');
  return path ? resolveApiAssetUrl(path) : '';
}

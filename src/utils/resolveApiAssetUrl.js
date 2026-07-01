/**
 * Turn relative API paths (e.g. /storage/..., /assets/...) into absolute URLs using VITE_API_BASE_URL.
 */
export function resolveApiAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return '';

  const imagesPath = extractPublicImagesPath(pathOrUrl);
  if (imagesPath) {
    if (import.meta.env.DEV) {
      return imagesPath;
    }
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    try {
      return new URL(imagesPath, `${base}/`).href;
    } catch {
      return imagesPath;
    }
  }

  const assetsPath = extractPublicAssetsPath(pathOrUrl);
  if (assetsPath) {
    if (import.meta.env.DEV) {
      return assetsPath;
    }
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
    try {
      return new URL(assetsPath, `${base}/`).href;
    } catch {
      return assetsPath;
    }
  }

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
 * Normalize Laravel public image URLs/paths to /images/...
 */
export function extractPublicImagesPath(pathOrUrl) {
  if (!pathOrUrl) return null;
  const raw = String(pathOrUrl).trim();

  if (raw.startsWith('/images/')) {
    return raw.split('?')[0];
  }

  if (!raw.includes('://')) {
    const normalized = raw.replace(/^\/+/, '');
    if (normalized.startsWith('images/')) {
      return `/${normalized.split('?')[0]}`;
    }
    return null;
  }

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/images/')) {
      return u.pathname;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Normalize Laravel public asset URLs/paths to /assets/...
 */
export function extractPublicAssetsPath(pathOrUrl) {
  if (!pathOrUrl) return null;
  const raw = String(pathOrUrl).trim();

  if (raw.startsWith('/assets/')) {
    return raw.split('?')[0];
  }

  if (!raw.includes('://')) {
    const normalized = raw.replace(/^\/+/, '');
    if (normalized.startsWith('assets/')) {
      return `/${normalized.split('?')[0]}`;
    }
    return null;
  }

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/assets/')) {
      return u.pathname;
    }
  } catch {
    return null;
  }

  return null;
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
    (locale.flag_path
      ? locale.flag_path.startsWith('assets/')
        ? `/${String(locale.flag_path).replace(/^\/+/, '')}`
        : `/storage/${String(locale.flag_path).replace(/^\/+/, '')}`
      : '');

  if (path) {
    return resolveApiAssetUrl(path);
  }

  return '';
}

/** Resolve slideshow slide image URL for landing page and admin table. */
export function resolveSlideshowImageUrl(slide) {
  if (!slide) return '';

  const path =
    slide.image_url ||
    (slide.image_path
      ? slide.image_path.startsWith('images/') || slide.image_path.startsWith('assets/')
        ? `/${String(slide.image_path).replace(/^\/+/, '')}`
        : `/storage/${String(slide.image_path).replace(/^\/+/, '')}`
      : '');

  if (path) {
    return resolveApiAssetUrl(path);
  }

  return '';
}

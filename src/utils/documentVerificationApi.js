import { API_BASE_URL, resolveApiUrl } from '../config/api';

const normalizeBase = (base) => String(base || '').replace(/\/$/, '');

export const verifyDocument = async (code) => {
  if (!code) {
    throw new Error('Verification code is missing from the URL.');
  }

  // Public endpoint: call backend directly so verification works even when the Vite /api proxy is unavailable.
  const url = import.meta.env.DEV
    ? `${normalizeBase(API_BASE_URL)}/api/verify-documents/${encodeURIComponent(code)}`
    : resolveApiUrl(`/api/verify-documents/${encodeURIComponent(code)}`);

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || 'Could not verify this document.');
  }

  if (!json?.data) {
    throw new Error('Verification response was empty.');
  }

  return json.data;
};

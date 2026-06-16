import { API_BASE_URL } from '../context/AuthContext';

let isRefreshing = false;
// Queue of { resolve, reject } waiting for the refresh to finish
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

/**
 * Attempt a silent token refresh.
 * Returns the new token string on success, null on failure.
 */
const doRefresh = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const newToken = json.data?.token || json.token || json.access_token;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Force logout by clearing storage and reloading to the login page.
 */
const forceLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('sqas_user');
  // Redirect to root — LandingPage will show the login modal
  window.location.href = '/';
};

/**
 * apiFetch — drop-in replacement for fetch() that:
 *  1. Automatically injects the Authorization header.
 *  2. On 401, silently refreshes the JWT token and retries once.
 *  3. If refresh fails, forces logout.
 *
 * @param {string} url     - Full URL to fetch
 * @param {object} options - fetch() options (method, headers, body, …)
 * @returns {Promise<Response>}
 */
const apiFetch = async (url, options = {}) => {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const getHeaders = (token) => ({
    // FormData: do not set Content-Type — browser must add multipart boundary.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    // Allow caller to override specific headers
    ...(options.headers || {}),
  });

  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, { ...options, headers: getHeaders(token) });

  if (response.status !== 401) {
    return response;
  }

  // ── 401 received — try to refresh ───────────────────────────────────
  if (isRefreshing) {
    // Another request is already refreshing; wait for it to finish
    return new Promise((resolve, reject) => {
      refreshQueue.push({
        resolve: (newToken) => resolve(fetch(url, { ...options, headers: getHeaders(newToken) })),
        reject,
      });
    });
  }

  isRefreshing = true;

  const newToken = await doRefresh();

  isRefreshing = false;

  if (!newToken) {
    processQueue(new Error('Session expired. Please log in again.'));
    forceLogout();
    throw new Error('Session expired. Please log in again.');
  }

  processQueue(null, newToken);

  // Retry the original request with the new token
  return fetch(url, { ...options, headers: getHeaders(newToken) });
};

export default apiFetch;

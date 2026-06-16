import { useAuth } from '../context/AuthContext';

/**
 * FAQ routes: only block on auth when a token exists (likely logged-in).
 * Without a token, render the public view immediately so data fetch can start in parallel.
 */
export function useFaqRouteAuth() {
  const { isAuthenticated, loading } = useAuth();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
  return {
    isAuthenticated,
    /** True only while auth is resolving and we expect a logged-in session */
    showAuthSpinner: loading && hasToken,
  };
}

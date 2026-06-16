import { useEffect, useRef } from 'react';

/**
 * useSyncCompleteReload
 *
 * Watches a sync log's status string and reloads the page once when the
 * status transitions from any "active" state (running / pending / processing)
 * to any terminal state (completed / failed / cancelled / etc.).
 *
 * Guards:
 *  • hasReloadedRef   — prevents a second reload if the component re-renders
 *                       again before the 1 500 ms timeout fires.
 *  • prevLogStatusRef — tracks the previous status so we only act on the
 *                       active → terminal edge.
 *
 * Usage:
 *   useSyncCompleteReload(log?.status);
 *
 * @param {string|null|undefined} logStatus  — current status from the API
 * @param {number} [delay=1500]              — ms to wait before reloading
 */

const ACTIVE_STATES   = new Set(['running', 'pending', 'processing']);
const TERMINAL_STATES = new Set(['completed', 'failed', 'cancelled', 'error', 'done']);

const useSyncCompleteReload = (logStatus, delay = 1500) => {
  const prevLogStatusRef = useRef(null);
  const hasReloadedRef   = useRef(false);

  useEffect(() => {
    const current    = logStatus?.toLowerCase();
    const wasActive  = ACTIVE_STATES.has(prevLogStatusRef.current);
    const isTerminal = TERMINAL_STATES.has(current);

    if (wasActive && isTerminal && !hasReloadedRef.current) {
      hasReloadedRef.current = true;
      // Brief delay lets the terminal state render before the page refreshes.
      const timer = setTimeout(() => window.location.reload(), delay);
      return () => clearTimeout(timer);
    }

    if (current != null) {
      prevLogStatusRef.current = current;
    }
  }, [logStatus, delay]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSyncCompleteReload;

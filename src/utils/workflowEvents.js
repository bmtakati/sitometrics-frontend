export const WORKFLOW_PENDING_COUNT_CHANGED = 'workflow:pending-count-changed';

export const notifyWorkflowPendingCountChanged = () => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(WORKFLOW_PENDING_COUNT_CHANGED));
};

import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';
import { notifyWorkflowPendingCountChanged } from './workflowEvents';

const postWorkflowAction = async (id, action, remarks = null) => {
  const response = await apiFetch(`${API_BASE_URL}/api/store-issues/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(remarks ? { remarks } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to ${action.replace(/-/g, ' ')} store issue`);
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

export const submitStoreIssue = (id, remarks) => postWorkflowAction(id, 'submit', remarks);
export const verifyStoreIssue = (id, remarks) => postWorkflowAction(id, 'verify', remarks);
export const approveStoreIssue = (id, remarks) => postWorkflowAction(id, 'approve', remarks);
export const rejectStoreIssue = (id, remarks) => postWorkflowAction(id, 'reject', remarks);
export const issueStoreIssue = (id, remarks) => postWorkflowAction(id, 'issue', remarks);
export const cancelStoreIssue = (id, remarks) => postWorkflowAction(id, 'cancel', remarks);

export const ensureStoreIssueWorkflow = async (id) => {
  const response = await apiFetch(`${API_BASE_URL}/api/store-issues/${id}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to prepare store issue workflow');
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

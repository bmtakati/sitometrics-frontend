import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';
import { notifyWorkflowPendingCountChanged } from './workflowEvents';

const postWorkflowAction = async (id, action, remarks = null) => {
  const response = await apiFetch(`${API_BASE_URL}/api/store-requests/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(remarks ? { remarks } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to ${action.replace(/-/g, ' ')} store request`);
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

export const submitStoreRequest = (id, remarks) => postWorkflowAction(id, 'submit', remarks);
export const verifyStoreRequest = (id, remarks) => postWorkflowAction(id, 'verify', remarks);
export const approveStoreRequest = (id, remarks) => postWorkflowAction(id, 'approve', remarks);
export const rejectStoreRequest = (id, remarks) => postWorkflowAction(id, 'reject', remarks);
export const issueStoreRequest = (id, remarks) => postWorkflowAction(id, 'issue', remarks);
export const cancelStoreRequest = (id, remarks) => postWorkflowAction(id, 'cancel', remarks);

export const ensureStoreRequestWorkflow = async (id) => {
  const response = await apiFetch(`${API_BASE_URL}/api/store-requests/${id}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to prepare store request workflow');
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

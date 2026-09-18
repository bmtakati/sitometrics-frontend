import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';
import { notifyWorkflowPendingCountChanged } from './workflowEvents';

const postWorkflowAction = async (id, action, remarks = null) => {
  const response = await apiFetch(`${API_BASE_URL}/api/goods-received-notes/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(remarks ? { remarks } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to ${action.replace(/-/g, ' ')} goods received note`);
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

export const submitGoodsReceivedNote = (id, remarks) => postWorkflowAction(id, 'submit', remarks);
export const verifyGoodsReceivedNote = (id, remarks) => postWorkflowAction(id, 'verify', remarks);
export const approveGoodsReceivedNote = (id, remarks) => postWorkflowAction(id, 'approve', remarks);
export const rejectGoodsReceivedNote = (id, remarks) => postWorkflowAction(id, 'reject', remarks);

export const ensureGoodsReceivedNoteWorkflow = async (id) => {
  const response = await apiFetch(`${API_BASE_URL}/api/goods-received-notes/${id}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to prepare goods received note workflow');
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';
import { notifyWorkflowPendingCountChanged } from './workflowEvents';

const postWorkflowAction = async (id, action, remarks = null) => {
  const response = await apiFetch(`${API_BASE_URL}/api/purchase-requisitions/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(remarks ? { remarks } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to ${action.replace(/-/g, ' ')} purchase requisition`);
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

export const submitPurchaseRequisition = (id, remarks) => postWorkflowAction(id, 'submit', remarks);
export const verifyPurchaseRequisition = (id, remarks) => postWorkflowAction(id, 'verify', remarks);
export const approvePurchaseRequisition = (id, remarks) => postWorkflowAction(id, 'approve', remarks);
export const rejectPurchaseRequisition = (id, remarks) => postWorkflowAction(id, 'reject', remarks);
export const convertPurchaseRequisitionToLpo = (id, remarks) => postWorkflowAction(id, 'convert-to-lpo', remarks);

export const ensurePurchaseRequisitionWorkflow = async (id) => {
  const response = await apiFetch(`${API_BASE_URL}/api/purchase-requisitions/${id}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to prepare purchase requisition workflow');
  }

  notifyWorkflowPendingCountChanged();

  return payload?.data;
};

import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

const postWorkflowAction = async (id, action, remarks = null) => {
  const response = await apiFetch(`${API_BASE_URL}/api/local-purchase-orders/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(remarks ? { remarks } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to ${action.replace(/-/g, ' ')} local purchase order`);
  }

  return payload?.data;
};

export const submitLocalPurchaseOrder = (id, remarks) => postWorkflowAction(id, 'submit', remarks);
export const verifyLocalPurchaseOrder = (id, remarks) => postWorkflowAction(id, 'verify', remarks);
export const approveLocalPurchaseOrder = (id, remarks) => postWorkflowAction(id, 'approve', remarks);
export const rejectLocalPurchaseOrder = (id, remarks) => postWorkflowAction(id, 'reject', remarks);
export const sendLocalPurchaseOrder = (id, remarks) => postWorkflowAction(id, 'send', remarks);

export const PRINTABLE_LPO_STATUSES = [
  'APPROVED',
  'SENT',
  'PARTIALLY_DELIVERED',
  'FULLY_DELIVERED',
  'CLOSED',
];

export const canPrintLocalPurchaseOrder = (lpo) =>
  PRINTABLE_LPO_STATUSES.includes(lpo?.workflow_status);

const parseFileName = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  const raw = match?.[1] || match?.[2];

  if (!raw) return fallback;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export const downloadLocalPurchaseOrderPdf = async (lpoId, lpoCode = 'lpo') => {
  const res = await apiFetch(`${API_BASE_URL}/api/local-purchase-orders/${lpoId}/pdf`, {
    headers: { Accept: 'application/pdf' },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Could not generate the LPO PDF.');
  }

  const blob = await res.blob();
  const fallbackName = `${String(lpoCode).replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const fileName = parseFileName(res.headers.get('Content-Disposition'), fallbackName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

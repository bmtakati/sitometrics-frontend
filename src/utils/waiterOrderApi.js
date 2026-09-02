import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

export const canPrintWaiterOrder = (order) => {
  if (!order) return false;
  if (['DRAFT', 'CANCELLED'].includes(order.workflow_status)) return false;
  if (order.is_complementary && order.complementary_status !== 'APPROVED') return false;
  return true;
};

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

export const fetchActiveOrders = async (outletId) => {
  const qs = outletId ? `?outlet_id=${outletId}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/active${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchAvailableTables = async (outletId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/outlets/${outletId}/available-tables`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return json?.data ?? null;
};

export const createOrder = async (payload) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to create order');
  return json.data;
};

export const addOrderItem = async (orderId, payload) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to add item');
  return json.data;
};

export const removeOrderItem = async (orderId, itemId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to remove item');
  return json.data;
};

export const submitOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/submit`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to submit order');
  return json.data;
};

export const updateOrderDetails = async (orderId, payload) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to update order');
  return json.data;
};

export const updateOrderRemarks = async (orderId, remarks) => updateOrderDetails(orderId, { remarks });

export const closeOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/close`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to close order');
  return json.data;
};

export const cancelOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/cancel`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to cancel order');
  return json.data;
};

export const markItemReady = async (itemId, fulfilledQuantity) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/items/${itemId}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fulfilled_quantity: Number(fulfilledQuantity) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to mark item ready');
  return json.data;
};

export const markItemPreparing = async (itemId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/items/${itemId}/preparing`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to mark item preparing');
  return json.data;
};

export const markItemServed = async (itemId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/items/${itemId}/served`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to mark item served');
  return json.data;
};

export const fetchKitchenQueue = async (outletId) => {
  const qs = outletId ? `?outlet_id=${outletId}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/kitchen-queue${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchKitchenOrders = async (outletId, scope = 'open', date = null) => {
  const params = new URLSearchParams();
  if (outletId) params.set('outlet_id', outletId);
  if (scope) params.set('scope', scope);
  if (date) params.set('date', date);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/kitchen-orders${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchBarQueue = async (outletId) => {
  const qs = outletId ? `?outlet_id=${outletId}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/bar-queue${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchBarOrders = async (outletId, scope = 'open', date = null) => {
  const params = new URLSearchParams();
  if (outletId) params.set('outlet_id', outletId);
  if (scope) params.set('scope', scope);
  if (date) params.set('date', date);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/bar-orders${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchOrderNotifications = async (audience, unreadOnly = true) => {
  const res = await apiFetch(
    `${API_BASE_URL}/api/waiter-orders/notifications?audience=${audience}&unread_only=${unreadOnly ? '1' : '0'}`
  );
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const readOrderNotification = async (id) => {
  await apiFetch(`${API_BASE_URL}/api/waiter-orders/notifications/${id}/read`, { method: 'POST' });
};

export const fetchPendingComplementaryOrders = async (outletId) => {
  const qs = outletId ? `?outlet_id=${outletId}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/complementary-pending${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const approveComplementaryOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/approve-complementary`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to approve order');
  return json.data;
};

export const rejectComplementaryOrder = async (orderId) => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/reject-complementary`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to reject order');
  return json.data;
};

export const downloadOrderPdf = async (orderId, orderCode = 'order') => {
  const res = await apiFetch(`${API_BASE_URL}/api/waiter-orders/${orderId}/pdf`, {
    headers: { Accept: 'application/pdf' },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Could not generate order PDF.');
  }

  const blob = await res.blob();
  const fallbackName = `${String(orderCode).replace(/\s+/g, '_')}_${Date.now()}.pdf`;
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

import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

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

export const fetchCashierSales = async ({ outletId, date, paymentStatus, search } = {}) => {
  const params = new URLSearchParams();
  if (outletId) params.set('outlet_id', outletId);
  if (date) params.set('date', date);
  if (paymentStatus) params.set('payment_status', paymentStatus);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`${API_BASE_URL}/api/cashier/sales${qs}`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const fetchPaymentMethods = async () => {
  const res = await apiFetch(`${API_BASE_URL}/api/payment-methods/all`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const receivePayment = async (orderId, payload) => {
  const res = await apiFetch(`${API_BASE_URL}/api/cashier/orders/${orderId}/receive-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to receive payment');
  return json.data;
};

export const downloadPaymentReceipt = async (orderId, receiptNo = 'receipt') => {
  const res = await apiFetch(`${API_BASE_URL}/api/cashier/orders/${orderId}/receipt`, {
    headers: { Accept: 'application/pdf' },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Could not generate payment receipt.');
  }

  const blob = await res.blob();
  const fallbackName = `${String(receiptNo).replace(/\s+/g, '_')}_${Date.now()}.pdf`;
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

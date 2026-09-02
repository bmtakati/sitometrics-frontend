import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

export const fetchSalesReport = async ({ outletId, dateFrom, dateTo } = {}) => {
  const params = new URLSearchParams();
  if (outletId) params.set('outlet_id', outletId);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await apiFetch(`${API_BASE_URL}/api/reports/sales${qs}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to load sales report');
  return json.data;
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

const downloadBlob = async (res, fallbackName) => {
  const blob = await res.blob();
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

export const downloadSalesReportPdf = async ({ outletId, dateFrom, dateTo } = {}) => {
  const params = new URLSearchParams();
  if (outletId) params.set('outlet_id', outletId);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await apiFetch(`${API_BASE_URL}/api/reports/sales/pdf${qs}`, {
    headers: { Accept: 'application/pdf' },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Could not generate the sales report PDF.');
  }

  await downloadBlob(res, `Sales_Report_${Date.now()}.pdf`);
};

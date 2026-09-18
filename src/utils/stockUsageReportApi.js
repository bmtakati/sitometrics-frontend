import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

export const fetchStockUsageReport = async ({ dateFrom, dateTo, storeId, itemId } = {}) => {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (storeId) params.set('store_id', storeId);
  if (itemId) params.set('item_id', itemId);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await apiFetch(`${API_BASE_URL}/api/reports/stock-usage${qs}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to load stock usage report');
  return json.data;
};

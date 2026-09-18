import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const fetchReport = async (path, filters = {}, label = 'report') => {
  const res = await apiFetch(`${API_BASE_URL}/api/reports/${path}${buildQuery(filters)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Failed to load ${label}`);
  return json.data;
};

export const fetchStockPulseReport = (filters = {}) => fetchReport('stock-pulse', filters, 'Stock Pulse');
export const fetchPastExpiryReport = (filters = {}) => fetchReport('past-expiry', filters, 'Past Expiry');
export const fetchExpiryWatchReport = (filters = {}) => fetchReport('expiry-watch', filters, 'Expiry Watch');
export const fetchReorderRadarReport = (filters = {}) => fetchReport('reorder-radar', filters, 'Reorder Radar');

export const stockMovementsPath = ({ itemId, storeId, dateFrom, dateTo } = {}) => {
  const params = new URLSearchParams();
  if (itemId) params.set('item_id', String(itemId));
  if (storeId) params.set('store_id', String(storeId));
  if (dateFrom) params.set('date_from', String(dateFrom));
  if (dateTo) params.set('date_to', String(dateTo));
  const qs = params.toString();
  return `/procurement/stock-movements${qs ? `?${qs}` : ''}`;
};

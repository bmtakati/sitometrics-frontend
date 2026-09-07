import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

/**
 * Ask the Laravel backend to print (or queue for the local print agent).
 * Printer host/port is configured on the outlet. Cloud APIs queue jobs for print-agent.
 */
const deliverThermalPrint = async (apiPath) => {
  const res = await apiFetch(`${API_BASE_URL}${apiPath}`, { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Thermal print failed.');
  }

  return json.data || {};
};

export const thermalPrintOrder = async (orderId) =>
  deliverThermalPrint(`/api/waiter-orders/${orderId}/thermal-print`);

export const thermalPrintBill = async (orderId) =>
  deliverThermalPrint(`/api/cashier/orders/${orderId}/thermal-print`);

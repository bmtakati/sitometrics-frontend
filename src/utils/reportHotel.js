import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

export const buildHotelHeaderLines = (hotel) => {
  if (!hotel) return [];

  const lines = [];
  if (hotel.address) lines.push(hotel.address);
  if (hotel.phone) lines.push(`Tel: ${hotel.phone}`);
  if (hotel.email) lines.push(hotel.email);
  if (hotel.vat_no) lines.push(`VAT No: ${hotel.vat_no}`);
  if (hotel.tin_no) lines.push(`TIN No: ${hotel.tin_no}`);
  if (hotel.website) lines.push(hotel.website);

  return lines;
};

export const fetchHotelsForReport = async () => {
  const res = await apiFetch(`${API_BASE_URL}/api/hotels/all`);
  const json = await res.json().catch(() => ({}));
  return res.ok && Array.isArray(json?.data) ? json.data : [];
};

export const resolveReportHotel = ({ outletId, outlets = [], hotels = [] } = {}) => {
  if (outletId && outlets.length) {
    const outlet = outlets.find((row) => String(row.id) === String(outletId));
    if (outlet?.hotel) return outlet.hotel;
    if (outlet?.hotel_id) {
      const matched = hotels.find((row) => String(row.id) === String(outlet.hotel_id));
      if (matched) return matched;
    }
  }

  return hotels[0] || null;
};

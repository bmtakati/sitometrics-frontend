import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from './apiFetch';

export const fetchMenuRecipe = async (menuId) => {
  if (!menuId) return null;

  const res = await apiFetch(`${API_BASE_URL}/api/menu-recipes/${menuId}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.data) return null;

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

export const downloadMenuPdf = async (menuId, menuName = 'menu') => {
  const res = await apiFetch(`${API_BASE_URL}/api/menus/${menuId}/pdf`, {
    headers: {
      Accept: 'application/pdf',
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const message = json?.message || 'Could not generate the menu PDF.';
    throw new Error(message);
  }

  const blob = await res.blob();
  const fallbackName = `${String(menuName).replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const fileName = parseFileName(res.headers.get('Content-Disposition'), fallbackName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

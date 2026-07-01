const EMPTY = '—';

/**
 * Parse API or form date values into a local Date.
 * YYYY-MM-DD strings are parsed as local calendar dates (no UTC day shift).
 */
export const parseDate = (value) => {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Human-readable date, e.g. "Jun 15, 2026".
 */
export const formatDate = (value, options = {}) => {
  const date = parseDate(value);
  if (!date) return EMPTY;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

/**
 * Human-readable date and time, e.g. "Jun 15, 2026, 2:30 PM".
 */
export const formatDateTime = (value, options = {}) => {
  const date = parseDate(value);
  if (!date) return EMPTY;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
};

/**
 * Long-form timestamp for audit fields, e.g. "June 15, 2026 at 2:30:45 PM".
 */
export const formatTimestamp = (value, options = {}) => {
  const date = parseDate(value);
  if (!date) return EMPTY;

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  });
};

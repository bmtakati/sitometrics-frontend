const EMPTY = '—';

const getAccessorKey = (accessor) => {
  if (!accessor || typeof accessor !== 'string') return '';
  return accessor.split('.').pop().toLowerCase();
};

/**
 * True when the column key represents a datetime (e.g. created_at, closed_at).
 */
export const isDateTimeAccessor = (accessor) => {
  const key = getAccessorKey(accessor);
  if (!key) return false;
  return key.endsWith('_at') || key.endsWith('_time') || key.includes('timestamp');
};

/**
 * True when the column key represents a calendar date or datetime field.
 */
export const isDateAccessor = (accessor) => {
  const key = getAccessorKey(accessor);
  if (!key) return false;
  if (isDateTimeAccessor(accessor)) return true;
  return key.includes('date');
};

/**
 * Format a table cell value when the column is (or looks like) a date field.
 * Returns null when the value should use default rendering.
 */
export const formatCellDateValue = (value, { accessor, type } = {}) => {
  if (value == null || value === '') return EMPTY;

  const explicit = type === 'date' || type === 'datetime';
  const inferred = !type && accessor && isDateAccessor(accessor);
  if (!explicit && !inferred) return null;

  const useDateTime =
    type === 'datetime' ||
    (type !== 'date' && isDateTimeAccessor(accessor));

  return useDateTime ? formatDateTime(value) : formatDate(value);
};

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
 * Numeric calendar date for reports, e.g. "25/07/2026".
 */
export const formatReportDate = (value) => {
  const date = parseDate(value);
  if (!date) return EMPTY;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}/${date.getFullYear()}`;
};

/**
 * Numeric date and time for reports, e.g. "25/07/2026 17:44".
 */
export const formatReportDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return EMPTY;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${formatReportDate(date)} ${hours}:${minutes}`;
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

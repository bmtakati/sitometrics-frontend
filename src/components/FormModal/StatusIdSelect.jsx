import React, { useState, useEffect, useMemo } from 'react';
import apiFetch from '../../utils/apiFetch';
import { API_BASE_URL } from '../../context/AuthContext';
import SearchableSelect from '../SearchableSelect';

/**
 * Searchable status picker (Select2-style) for lookup data statuses.
 */
const StatusIdSelect = ({ name, value, onChange, errors, darkMode, required = false, label = 'Status', readOnly = false }) => {
  const [statusRows, setStatusRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_BASE_URL}/api/status-groups/all`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const groups = Array.isArray(json.data) ? json.data : [];
        const group = groups.find(
          (g) => (g.name ?? '').toLowerCase() === 'lookup data statuses'
        );
        setStatusRows(group?.statuses ?? []);
      })
      .catch(() => {
        /* silently ignore – user will see empty list */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const rows = Array.isArray(statusRows) ? statusRows : [];
    return rows.map((s) => ({ value: String(s.id), label: s.name }));
  }, [statusRows]);

  const hasError = !!errors?.[name];

  const floatingLabelClass = darkMode
    ? 'absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 pointer-events-none'
    : 'absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 pointer-events-none';

  return (
    <div className="relative">
      <SearchableSelect
        options={options}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(val) => onChange({ target: { name, value: val } })}
          placeholder="Select status…"
        disabled={loading || readOnly}
        darkMode={darkMode}
        invalid={hasError}
      />
      <label className={floatingLabelClass}>
        {label}{required ? ' *' : ''}
      </label>
      {hasError && (
        <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );
};

export default StatusIdSelect;

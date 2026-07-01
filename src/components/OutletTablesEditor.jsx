import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const emptyLine = () => ({
  table_number: '',
  name: '',
  seats: 2,
  zone: '',
});

const OutletTablesEditor = ({
  fieldName = 'tables',
  value = [],
  onChange,
  errors = {},
  darkMode = false,
}) => {
  const lines = Array.isArray(value) && value.length ? value : [emptyLine()];

  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange({ target: { name: fieldName, value: next } });
  };

  const addLine = () => {
    onChange({ target: { name: fieldName, value: [...lines, emptyLine()] } });
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    onChange({ target: { name: fieldName, value: next.length ? next : [emptyLine()] } });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const errorMessage = errors[fieldName];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Table numbers</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Assign table numbers guests can be seated at in this outlet.
          </p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add table
        </button>
      </div>

      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}

      <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
        <div
          className={`grid grid-cols-[110px_1fr_90px_120px_40px] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
        >
          <span>Table #</span>
          <span>Label</span>
          <span>Seats</span>
          <span>Zone</span>
          <span />
        </div>
        {lines.map((line, index) => (
          <div
            key={`${fieldName}-${line.id || index}`}
            className={`grid grid-cols-[110px_1fr_90px_120px_40px] gap-2 border-b px-3 py-2 last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <input
              type="text"
              value={line.table_number ?? ''}
              onChange={(e) => updateLine(index, { table_number: e.target.value })}
              placeholder="e.g. 01"
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <input
              type="text"
              value={line.name ?? ''}
              onChange={(e) => updateLine(index, { name: e.target.value })}
              placeholder="Optional display name"
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <input
              type="number"
              min={1}
              value={line.seats ?? 2}
              onChange={(e) => updateLine(index, { seats: e.target.value })}
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <input
              type="text"
              value={line.zone ?? ''}
              onChange={(e) => updateLine(index, { zone: e.target.value })}
              placeholder="e.g. Terrace"
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <button
              type="button"
              onClick={() => removeLine(index)}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              aria-label="Remove table"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutletTablesEditor;

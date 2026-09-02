import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const emptyLine = () => ({
  table_number: '',
  name: '',
  zone: '',
  seat_numbers: ['1', '2'],
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

  const updateSeat = (tableIndex, seatIndex, value) => {
    const seats = [...(lines[tableIndex].seat_numbers || [])];
    seats[seatIndex] = value;
    updateLine(tableIndex, { seat_numbers: seats });
  };

  const addSeat = (tableIndex) => {
    const seats = [...(lines[tableIndex].seat_numbers || [])];
    const nextNumber = String(seats.length + 1);
    seats.push(nextNumber);
    updateLine(tableIndex, { seat_numbers: seats });
  };

  const removeSeat = (tableIndex, seatIndex) => {
    const seats = (lines[tableIndex].seat_numbers || []).filter((_, i) => i !== seatIndex);
    updateLine(tableIndex, { seat_numbers: seats.length ? seats : ['1'] });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const errorMessage = errors[fieldName];
  const inputClass = `h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Tables & seats</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Each table can have unlimited numbered seats for guest orders.
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

      <div className="space-y-4">
        {lines.map((line, index) => (
          <div key={`${fieldName}-${line.id || index}`} className={`rounded-xl border p-3 ${borderClass} ${darkMode ? 'bg-gray-900/40' : 'bg-white'}`}>
            <div className="mb-3 grid gap-2 md:grid-cols-[110px_1fr_120px_40px]">
              <input
                type="text"
                value={line.table_number ?? ''}
                onChange={(e) => updateLine(index, { table_number: e.target.value })}
                placeholder="Table #"
                className={inputClass}
              />
              <input
                type="text"
                value={line.name ?? ''}
                onChange={(e) => updateLine(index, { name: e.target.value })}
                placeholder="Label"
                className={inputClass}
              />
              <input
                type="text"
                value={line.zone ?? ''}
                onChange={(e) => updateLine(index, { zone: e.target.value })}
                placeholder="Zone"
                className={inputClass}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Seat numbers
                </p>
                <button
                  type="button"
                  onClick={() => addSeat(index)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"
                >
                  <FiPlus className="h-3 w-3" /> Add seat
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(line.seat_numbers || []).map((seat, seatIndex) => (
                  <div key={`seat-${index}-${seatIndex}`} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={seat}
                      onChange={(e) => updateSeat(index, seatIndex, e.target.value)}
                      placeholder="Seat"
                      className={`w-16 rounded-lg border px-2 py-1.5 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeSeat(index, seatIndex)}
                      className="text-red-500"
                      aria-label="Remove seat"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutletTablesEditor;

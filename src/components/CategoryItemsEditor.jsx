import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const emptyLine = (showPrice = false) =>
  showPrice ? { name: '', price: '', description: '' } : { name: '', description: '' };

const CategoryItemsEditor = ({
  fieldName,
  value = [],
  onChange,
  errors = {},
  darkMode = false,
  itemLabel = 'Item',
  addLabel = 'Add item',
  listTitle = 'Items in this category',
  listDescription = 'Add the items that belong to this category.',
  showPrice = false,
}) => {
  const lines = Array.isArray(value) && value.length ? value : [emptyLine(showPrice)];

  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange({ target: { name: fieldName, value: next } });
  };

  const addLine = () => {
    onChange({ target: { name: fieldName, value: [...lines, emptyLine(showPrice)] } });
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    onChange({ target: { name: fieldName, value: next.length ? next : [emptyLine(showPrice)] } });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const errorMessage = errors[fieldName];
  const gridCols = showPrice ? 'grid-cols-[1fr_110px_1fr_40px]' : 'grid-cols-[1fr_1fr_40px]';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>{listTitle}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{listDescription}</p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>

      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}

      <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
        <div
          className={`grid ${gridCols} gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
        >
          <span>{itemLabel} name</span>
          {showPrice ? <span>Price</span> : null}
          <span>Description</span>
          <span />
        </div>
        {lines.map((line, index) => (
          <div
            key={`${fieldName}-${line.id || index}`}
            className={`grid ${gridCols} gap-2 border-b px-3 py-2 last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <input
              type="text"
              value={line.name ?? ''}
              onChange={(e) => updateLine(index, { name: e.target.value })}
              placeholder={`${itemLabel} name`}
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            {showPrice ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.price ?? ''}
                onChange={(e) => updateLine(index, { price: e.target.value })}
                placeholder="0.00"
                className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
              />
            ) : null}
            <input
              type="text"
              value={line.description ?? ''}
              onChange={(e) => updateLine(index, { description: e.target.value })}
              placeholder="Optional description"
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <button
              type="button"
              onClick={() => removeLine(index)}
              className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
              aria-label={`Remove ${itemLabel.toLowerCase()}`}
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryItemsEditor;

import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

const emptyLine = () => ({ item_id: '', quantity: '', unit_price: '' });

const LpoItemsEditor = ({
  value = [],
  onChange,
  itemOptions = [],
  priceByItemId = {},
  supplierSelected = false,
  errors = {},
  darkMode = false,
}) => {
  const lines = Array.isArray(value) && value.length ? value : [emptyLine()];

  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange({ target: { name: 'lpo_items', value: next } });
  };

  const handleItemChange = (index, itemId) => {
    const agreedPrice = itemId ? priceByItemId[String(itemId)] ?? '' : '';
    updateLine(index, { item_id: itemId, unit_price: agreedPrice });
  };

  const addLine = () => {
    onChange({ target: { name: 'lpo_items', value: [...lines, emptyLine()] } });
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    onChange({ target: { name: 'lpo_items', value: next.length ? next : [emptyLine()] } });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const inputClass = `h-[38px] rounded-lg border px-3 text-sm ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
  }`;
  const readOnlyClass = `${inputClass} ${darkMode ? 'bg-gray-900/60 text-gray-400' : 'bg-gray-50 text-gray-600'}`;

  const formatMoney = (amount) =>
    amount === '' || amount == null
      ? '—'
      : Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const lineTotal = (line) => {
    const qty = Number(line.quantity);
    const price = Number(line.unit_price);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return '—';
    return formatMoney(qty * price);
  };

  if (!supplierSelected) {
    return (
      <div className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${borderClass} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Select a supplier first to add line items from their agreed price list.
      </div>
    );
  }

  if (!itemOptions.length) {
    return (
      <div className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${borderClass} ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
        This supplier has no agreed item prices. Add items on the supplier record before creating an LPO.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Order lines</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Items and unit prices come from the selected supplier&apos;s contract.
          </p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>

      {errors.lpo_items ? <p className="text-xs text-red-500">{errors.lpo_items}</p> : null}

      <div className={`overflow-x-auto rounded-xl border ${borderClass}`}>
        <div
          className={`grid min-w-[640px] grid-cols-[1fr_100px_120px_120px_40px] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
            darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          <span>Item</span>
          <span>Qty</span>
          <span>Unit price</span>
          <span>Line total</span>
          <span />
        </div>
        {lines.map((line, index) => (
          <div
            key={`lpo-item-${index}`}
            className={`grid min-w-[640px] grid-cols-[1fr_100px_120px_120px_40px] gap-2 border-b px-3 py-2 last:border-b-0 ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <SearchableSelect
              options={itemOptions}
              value={line.item_id ? String(line.item_id) : ''}
              onChange={(val) => handleItemChange(index, val)}
              placeholder="Select item…"
              darkMode={darkMode}
              size="compact"
            />
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={line.quantity ?? ''}
              onChange={(e) => updateLine(index, { quantity: e.target.value })}
              placeholder="0"
              className={inputClass}
            />
            <input
              type="text"
              readOnly
              value={formatMoney(line.unit_price)}
              className={readOnlyClass}
              title="Contracted unit price from supplier"
            />
            <div className={`flex h-[38px] items-center px-1 text-sm font-medium ${labelClass}`}>
              {lineTotal(line)}
            </div>
            <button
              type="button"
              onClick={() => removeLine(index)}
              disabled={lines.length === 1}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
              aria-label="Remove line"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LpoItemsEditor;

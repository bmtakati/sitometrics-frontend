import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

const emptyLine = () => ({ item_id: '', agreed_price: '' });

const SupplierItemsEditor = ({ value = [], onChange, itemOptions = [], errors = {}, darkMode = false }) => {
  const lines = Array.isArray(value) && value.length ? value : [emptyLine()];

  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange({ target: { name: 'supplier_items', value: next } });
  };

  const addLine = () => {
    onChange({ target: { name: 'supplier_items', value: [...lines, emptyLine()] } });
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    onChange({ target: { name: 'supplier_items', value: next.length ? next : [emptyLine()] } });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Agreed item prices</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Link items this supplier provides. The agreed price is per purchasing unit.
          </p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add item
        </button>
      </div>

      {errors.supplier_items ? (
        <p className="text-xs text-red-500">{errors.supplier_items}</p>
      ) : null}

      <div className={`overflow-x-auto rounded-xl border ${borderClass}`}>
        <div className="min-w-[640px]">
        <div className={`grid grid-cols-[1fr_140px_140px_40px] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
          <span>Item</span>
          <span>Purchasing unit</span>
          <span>Agreed price</span>
          <span />
        </div>
        {lines.map((line, index) => {
          const usedIds = new Set(
            lines
              .filter((_, otherIndex) => otherIndex !== index)
              .map((other) => String(other.item_id || ''))
              .filter(Boolean)
          );
          const rowOptions = itemOptions.filter((option) => !usedIds.has(String(option.value)));
          const selected = itemOptions.find((option) => String(option.value) === String(line.item_id));
          const itemUnits = line.item?.item_units || line.item?.itemUnits || [];
          const defaultPurchase = itemUnits.find((row) => row.is_default_purchase)
            || itemUnits.find((row) => row.is_purchase_unit);
          const purchaseUnit = selected?.unitLabel
            || defaultPurchase?.unit?.symbol
            || defaultPurchase?.unit?.name
            || '';

          return (
          <div
            key={`supplier-item-${index}`}
            className={`grid grid-cols-[1fr_140px_140px_40px] gap-2 border-b px-3 py-2 last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <SearchableSelect
              options={rowOptions}
              value={line.item_id ? String(line.item_id) : ''}
              onChange={(val) => updateLine(index, { item_id: val })}
              placeholder="Select item…"
              darkMode={darkMode}
              size="compact"
            />
            <div
              className={`flex h-[38px] items-center rounded-lg border px-3 text-sm ${
                darkMode ? 'border-gray-600 bg-gray-800/70 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              {purchaseUnit || '—'}
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.agreed_price ?? ''}
              onChange={(e) => updateLine(index, { agreed_price: e.target.value })}
              placeholder="0.00"
              className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <button
              type="button"
              onClick={() => removeLine(index)}
              disabled={lines.length === 1}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
              aria-label="Remove item line"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default SupplierItemsEditor;

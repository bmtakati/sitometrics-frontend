import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';

const formatQty = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const ingredientRows = (item) => {
  const rows = Array.isArray(item?.ingredients) ? item.ingredients : [];
  return rows
    .map((line) => {
      const storeItem = line.item;
      const unit = line.item_unit?.unit || line.itemUnit?.unit;
      const unitLabel = unit?.symbol || unit?.name || '';
      const name = storeItem?.name || (line.item_id ? `Item #${line.item_id}` : '—');
      const qty = formatQty(line.quantity);
      return {
        key: `${line.id || line.item_id}-${line.quantity}`,
        label: `${name}${storeItem?.code ? ` (${storeItem.code})` : ''}`,
        qty: unitLabel ? `${qty} ${unitLabel}` : qty,
      };
    })
    .filter((row) => row.label);
};

const MappedItemTooltip = ({ item, darkMode, children }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const rows = useMemo(() => ingredientRows(item), [item]);

  const show = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 300;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const preferAbove = rect.bottom + 180 > window.innerHeight;
    const top = preferAbove ? Math.max(8, rect.top - 8) : rect.bottom + 6;
    setPosition({
      top,
      left,
      transform: preferAbove ? 'translateY(-100%)' : undefined,
    });
    setOpen(true);
  };

  const hide = () => setOpen(false);

  return (
    <>
      <div
        className="min-w-0 flex-1 cursor-default"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {open && position
        ? createPortal(
            <div
              role="tooltip"
              style={{
                top: position.top,
                left: position.left,
                width: 300,
                transform: position.transform,
              }}
              className={`pointer-events-none fixed z-[2147483600] rounded-lg px-3 py-2.5 text-left text-xs shadow-lg ${
                darkMode ? 'bg-gray-800 text-gray-100 ring-1 ring-gray-700' : 'bg-stone-900 text-white'
              }`}
            >
              <p className="mb-1.5 font-semibold tracking-wide">
                Ingredients
                {item?.name ? ` · ${item.name}` : ''}
              </p>
              {!rows.length ? (
                <p className={darkMode ? 'text-gray-400' : 'text-white/70'}>No ingredients configured.</p>
              ) : (
                <ul className="space-y-1">
                  {rows.map((row) => (
                    <li key={row.key} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 flex-1 break-words">{row.label}</span>
                      <span className={`shrink-0 font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-300'}`}>
                        {row.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
};

/**
 * Two-panel picker: available menu items (left) → selected for subcategory (right).
 */
const SubcategoryMenuItemsEditor = ({
  value = [],
  onChange,
  menuItems = [],
  itemType = 'FOOD',
  errors = {},
  darkMode = false,
}) => {
  const selectedIds = useMemo(
    () => new Set((Array.isArray(value) ? value : []).map((id) => String(id))),
    [value]
  );

  const [search, setSearch] = useState('');
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [draftError, setDraftError] = useState('');

  const typedItems = useMemo(
    () =>
      menuItems
        .filter((item) => String(item.item_type || '').toUpperCase() === String(itemType).toUpperCase())
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [menuItems, itemType]
  );

  const itemById = useMemo(
    () => new Map(typedItems.map((item) => [String(item.id), item])),
    [typedItems]
  );

  const availableItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return typedItems.filter((item) => {
      if (selectedIds.has(String(item.id))) return false;
      if (!query) return true;
      const haystack = `${item.name || ''} ${item.code || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [typedItems, selectedIds, search]);

  const selectedItems = useMemo(
    () =>
      [...selectedIds]
        .map((id) => itemById.get(id))
        .filter(Boolean)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [selectedIds, itemById]
  );

  const setSelected = (ids) => {
    onChange({ target: { name: 'menu_item_ids', value: ids.map(String) } });
  };

  const toggleChecked = (itemId) => {
    const key = String(itemId);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDraftError('');
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = availableItems.map((item) => String(item.id));
    if (!visibleIds.length) return;
    setCheckedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const addSelected = () => {
    if (!checkedIds.size) {
      setDraftError('Select at least one menu item.');
      return;
    }
    const next = new Set(selectedIds);
    checkedIds.forEach((id) => next.add(id));
    setSelected([...next]);
    setCheckedIds(new Set());
    setDraftError('');
  };

  const removeItem = (itemId) => {
    setSelected([...selectedIds].filter((id) => id !== String(itemId)));
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const mutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const panelClass = `rounded-xl border ${borderClass} ${darkMode ? 'bg-gray-900/40' : 'bg-white'}`;
  const inputClass = `h-10 w-full rounded-lg border px-3 text-sm ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
  }`;

  const typeLabel = itemType === 'BEVERAGE' ? 'beverage' : 'food';
  const visibleAllSelected =
    availableItems.length > 0 && availableItems.every((item) => checkedIds.has(String(item.id)));

  if (!typedItems.length) {
    return (
      <div className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${borderClass} ${mutedClass}`}>
        No {typeLabel} items found. Create them under Menus → Items first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-sm font-medium ${labelClass}`}>Items</p>
        <p className={`text-xs ${mutedClass}`}>
          Select {typeLabel} items that belong to this subcategory. Hover a mapped item to preview its ingredients.
        </p>
      </div>

      {errors.menu_item_ids ? <p className="text-xs text-red-500">{errors.menu_item_ids}</p> : null}

      <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Available items</p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by name or code…"
              className={inputClass}
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                disabled={!availableItems.length}
                className={`text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                  darkMode ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                {visibleAllSelected ? 'Clear visible' : 'Select all visible'}
              </button>
              <span className={`text-xs ${mutedClass}`}>{checkedIds.size} selected</span>
            </div>

            <div className={`max-h-[260px] overflow-y-auto rounded-lg border ${borderClass}`}>
              {!availableItems.length ? (
                <div className={`px-4 py-10 text-center text-sm ${mutedClass}`}>
                  No more available items.
                </div>
              ) : (
                <ul className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                  {availableItems.map((item) => {
                    const checked = checkedIds.has(String(item.id));
                    return (
                      <li key={item.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${
                            checked
                              ? darkMode
                                ? 'bg-emerald-950/30'
                                : 'bg-emerald-50/70'
                              : darkMode
                                ? 'hover:bg-gray-800/60'
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleChecked(item.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm font-medium ${labelClass}`}>{item.name}</span>
                            <span className={`block truncate text-xs ${mutedClass}`}>{item.code || '—'}</span>
                          </span>
                          {checked ? <FiCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {draftError ? <p className="text-xs text-red-500">{draftError}</p> : null}

            <button
              type="button"
              onClick={addSelected}
              disabled={!checkedIds.size}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <FiPlus className="h-4 w-4" />
              Add selected ({checkedIds.size})
            </button>
          </div>
        </section>

        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Mapped items</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>
              {selectedItems.length
                ? `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'}`
                : 'Nothing mapped yet'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selectedItems.length ? (
              <div className={`rounded-lg border border-dashed px-4 py-10 text-center text-sm ${borderClass} ${mutedClass}`}>
                Selected items will appear here.
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedItems.map((item) => {
                  const ingredientCount = Array.isArray(item.ingredients) ? item.ingredients.length : 0;
                  return (
                    <li
                      key={item.id}
                      className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-3 transition-colors ${
                        darkMode
                          ? 'border-gray-700 bg-gray-800/50 hover:border-emerald-700/60'
                          : 'border-gray-100 bg-gray-50 hover:border-emerald-200'
                      }`}
                    >
                      <MappedItemTooltip item={item} darkMode={darkMode}>
                        <p className={`truncate text-sm font-medium ${labelClass}`}>{item.name}</p>
                        <p className={`truncate text-xs ${mutedClass}`}>
                          {item.code || '—'}
                          {ingredientCount
                            ? ` · ${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`
                            : ' · no ingredients'}
                        </p>
                      </MappedItemTooltip>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label={`Remove ${item.name}`}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubcategoryMenuItemsEditor;

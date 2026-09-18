import React, { useMemo, useState } from 'react';
import { FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

export const emptyStoreRequestLine = () => ({
  item_id: '',
  item_unit_id: '',
  requested_quantity: '',
  approved_quantity: '',
  issued_quantity: '',
  remarks: '',
});

const itemUnitRows = (item) => item?.item_units || item?.itemUnits || [];

const defaultUnitId = (item) => {
  const rows = itemUnitRows(item).filter((row) => row.is_active !== false);
  const selected = rows.find((row) => row.is_default) || rows[0];
  return selected?.id != null ? String(selected.id) : '';
};

const unitOptionLabel = (row, item) => {
  const unit = row?.unit;
  const baseUnit = item?.base_unit?.symbol || item?.baseUnit?.symbol || item?.unit?.symbol || 'base';
  const factor = Number(row?.conversion_factor || 1);
  const name = unit?.name || unit?.symbol || 'Unit';
  if (unit?.symbol && unit?.name && unit.name !== unit.symbol) {
    return `${unit.name} (${unit.symbol}) · ${factor} ${baseUnit}`;
  }
  return `${name} · ${factor} ${baseUnit}`;
};

const getCategoryId = (item) => item?.category?.id ?? item?.item_category_id ?? null;

const getCategoryLabel = (item) => item?.category?.name || 'Uncategorized';

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const baseQuantityForLine = (line, item) => {
  const itemUnit = itemUnitRows(item).find((unit) => String(unit.id) === String(line.item_unit_id));
  return Number(line.requested_quantity || 0) * Number(itemUnit?.conversion_factor || 1);
};

const StoreRequestItemsEditor = ({
  value = [],
  onChange,
  items = [],
  categories = [],
  errors = {},
  darkMode = false,
}) => {
  const lines = Array.isArray(value) ? value.filter((line) => line?.item_id) : [];

  const [draftCategoryId, setDraftCategoryId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [draftError, setDraftError] = useState('');

  const itemById = useMemo(
    () => new Map(items.map((item) => [String(item.id), item])),
    [items]
  );

  const effectiveCategories = useMemo(() => {
    if (categories.length) return categories;

    const map = new Map();
    for (const item of items) {
      const categoryId = getCategoryId(item);
      if (categoryId == null || map.has(String(categoryId))) continue;
      map.set(String(categoryId), {
        id: categoryId,
        name: getCategoryLabel(item),
        code: item.category?.code || '',
      });
    }
    return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [categories, items]);

  const categoryOptions = useMemo(
    () =>
      effectiveCategories
        .map((category) => ({
          value: String(category.id),
          label: `${category.name}${category.code ? ` (${category.code})` : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [effectiveCategories]
  );

  const itemsByCategoryId = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const categoryId = getCategoryId(item);
      const key = categoryId != null ? String(categoryId) : 'uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [items]);

  const selectedItemIds = useMemo(
    () => new Set(lines.map((line) => String(line.item_id))),
    [lines]
  );

  const availableItems = useMemo(() => {
    if (!draftCategoryId) return [];
    const categoryItems = itemsByCategoryId.get(draftCategoryId) || [];
    const query = itemSearch.trim().toLowerCase();
    return categoryItems.filter((item) => {
      if (selectedItemIds.has(String(item.id))) return false;
      if (!query) return true;
      const haystack = `${item.name || ''} ${item.code || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [draftCategoryId, itemsByCategoryId, itemSearch, selectedItemIds]);

  const selectedByCategory = useMemo(() => {
    const groups = new Map();
    for (const line of lines) {
      const item = itemById.get(String(line.item_id));
      const categoryId = item ? String(getCategoryId(item) ?? 'uncategorized') : 'uncategorized';
      const categoryName = item ? getCategoryLabel(item) : 'Uncategorized';
      if (!groups.has(categoryId)) {
        groups.set(categoryId, { id: categoryId, name: categoryName, lines: [] });
      }
      groups.get(categoryId).lines.push({ line, item });
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [lines, itemById]);

  const setLines = (nextLines) => {
    onChange({ target: { name: 'request_items', value: nextLines } });
  };

  const handleCategoryChange = (categoryId) => {
    setDraftCategoryId(categoryId || '');
    setCheckedIds(new Set());
    setItemSearch('');
    setDraftError('');
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
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
    setDraftError('');
  };

  const addSelected = () => {
    if (!draftCategoryId) {
      setDraftError('Select a category first.');
      return;
    }
    if (!checkedIds.size) {
      setDraftError('Select at least one item.');
      return;
    }

    const additions = [...checkedIds]
      .filter((id) => !selectedItemIds.has(id))
      .map((id) => {
        const item = itemById.get(id);
        return {
          item_id: id,
          item_unit_id: item ? defaultUnitId(item) : '',
          requested_quantity: '',
          approved_quantity: '',
          issued_quantity: '',
          remarks: '',
        };
      });

    if (!additions.length) {
      setDraftError('Selected items are already in the list.');
      return;
    }

    setLines([...lines, ...additions]);
    setCheckedIds(new Set());
    setDraftError('');
  };

  const updateLine = (itemId, field, nextValue) => {
    setLines(
      lines.map((line) => {
        if (String(line.item_id) !== String(itemId)) return line;
        const updated = { ...line, [field]: nextValue };
        if (field === 'requested_quantity') {
          updated.approved_quantity = nextValue;
        }
        return updated;
      })
    );
  };

  const removeItem = (itemId) => {
    setLines(lines.filter((line) => String(line.item_id) !== String(itemId)));
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const mutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const panelClass = `rounded-xl border ${borderClass} ${darkMode ? 'bg-gray-900/40' : 'bg-white'}`;
  const inputClass = `h-10 w-full rounded-lg border px-3 text-sm ${
    darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
  }`;
  const fieldLabelClass = `mb-1 block text-xs font-medium ${mutedClass}`;

  const visibleAllSelected =
    availableItems.length > 0 && availableItems.every((item) => checkedIds.has(String(item.id)));

  if (!items.length) {
    return (
      <div className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${borderClass} ${mutedClass}`}>
        No items are available. Add inventory items under Setup before creating a store request.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-sm font-medium ${labelClass}`}>Requested items</p>
        <p className={`text-xs ${mutedClass}`}>
          Filter by category, select one or more items, then set amounts on the right.
        </p>
      </div>

      {errors.request_items ? <p className="text-xs text-red-500">{errors.request_items}</p> : null}

      <div className="grid min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Select items</p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div>
              <label className={fieldLabelClass}>Category *</label>
              <SearchableSelect
                options={categoryOptions}
                value={draftCategoryId}
                onChange={handleCategoryChange}
                placeholder="Search category…"
                darkMode={darkMode}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>Search items</label>
              <input
                type="search"
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder={draftCategoryId ? 'Filter by name or code…' : 'Select a category first'}
                className={inputClass}
                disabled={!draftCategoryId}
              />
            </div>

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
              <span className={`text-xs ${mutedClass}`}>
                {checkedIds.size} selected
              </span>
            </div>

            <div className={`max-h-[280px] overflow-y-auto rounded-lg border ${borderClass}`}>
              {!draftCategoryId ? (
                <div className={`px-4 py-10 text-center text-sm ${mutedClass}`}>
                  Choose a category to list items.
                </div>
              ) : !availableItems.length ? (
                <div className={`px-4 py-10 text-center text-sm ${mutedClass}`}>
                  No available items in this category.
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
              disabled={!draftCategoryId || !checkedIds.size}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <FiPlus className="h-4 w-4" />
              Add selected ({checkedIds.size})
            </button>
          </div>
        </section>

        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Selected items</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>
              {lines.length
                ? `${lines.length} item${lines.length === 1 ? '' : 's'} · grouped by category`
                : 'Nothing selected yet'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selectedByCategory.length ? (
              <div className={`rounded-lg border border-dashed px-4 py-10 text-center text-sm ${borderClass} ${mutedClass}`}>
                Selected items will appear here grouped by category.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedByCategory.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      {group.name}
                    </p>
                    <div className="space-y-2">
                      {group.lines.map(({ line, item }) => {
                        const unitOptions = itemUnitRows(item).map((row) => ({
                          value: String(row.id),
                          label: unitOptionLabel(row, item),
                        }));

                        return (
                          <div
                            key={line.item_id}
                            className={`rounded-lg border px-3 py-3 ${
                              darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-sm font-medium ${labelClass}`}>
                                  {item?.name || `Item #${line.item_id}`}
                                </p>
                                <p className={`truncate text-xs ${mutedClass}`}>{item?.code || '—'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(line.item_id)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                aria-label={`Remove ${item?.name || 'item'}`}
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <div>
                                <label className={fieldLabelClass}>Amount *</label>
                                <input
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={line.requested_quantity}
                                  onChange={(event) => updateLine(line.item_id, 'requested_quantity', event.target.value)}
                                  className={inputClass}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className={fieldLabelClass}>Unit</label>
                                <SearchableSelect
                                  options={unitOptions.length ? unitOptions : [{ value: '', label: 'Default unit' }]}
                                  value={line.item_unit_id || ''}
                                  onChange={(next) => updateLine(line.item_id, 'item_unit_id', next)}
                                  placeholder="Unit"
                                  darkMode={darkMode}
                                  disabled={!unitOptions.length}
                                />
                              </div>
                              <div>
                                <label className={fieldLabelClass}>Remarks</label>
                                <input
                                  type="text"
                                  value={line.remarks || ''}
                                  onChange={(event) => updateLine(line.item_id, 'remarks', event.target.value)}
                                  className={inputClass}
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                            <p className={`mt-2 text-xs ${mutedClass}`}>
                              Base qty: {formatNumber(baseQuantityForLine(line, item))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StoreRequestItemsEditor;

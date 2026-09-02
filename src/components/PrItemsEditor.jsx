import React, { useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

export const emptyPrLine = () => ({ item_id: '', quantity: '', remarks: '' });

const getCategoryId = (item) => item?.category?.id ?? item?.item_category_id ?? null;

const getCategoryLabel = (item) => item?.category?.name || 'Uncategorized';

const PrItemsEditor = ({
  value = [],
  onChange,
  items = [],
  categories = [],
  errors = {},
  darkMode = false,
}) => {
  const lines = Array.isArray(value) ? value.filter((line) => line?.item_id) : [];

  const [draftCategoryId, setDraftCategoryId] = useState('');
  const [draftItemId, setDraftItemId] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('');
  const [draftRemarks, setDraftRemarks] = useState('');
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
      if (!categoryId || map.has(String(categoryId))) continue;
      map.set(String(categoryId), {
        id: categoryId,
        name: getCategoryLabel(item),
        code: item.category?.code || '',
      });
    }
    return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [categories, items]);

  const categoryById = useMemo(
    () => new Map(effectiveCategories.map((category) => [String(category.id), category])),
    [effectiveCategories]
  );

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
      if (!categoryId) continue;
      const key = String(categoryId);
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

  const itemOptions = useMemo(() => {
    if (!draftCategoryId) return [];
    const categoryItems = itemsByCategoryId.get(draftCategoryId) || [];
    return categoryItems
      .filter((item) => !selectedItemIds.has(String(item.id)))
      .map((item) => ({
        value: String(item.id),
        label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
      }));
  }, [draftCategoryId, itemsByCategoryId, selectedItemIds]);

  const draftItem = draftItemId ? itemById.get(String(draftItemId)) : null;

  const selectedByCategory = useMemo(() => {
    const groups = new Map();
    for (const line of lines) {
      const item = itemById.get(String(line.item_id));
      const categoryId = item ? String(getCategoryId(item) || 'uncategorized') : 'uncategorized';
      const categoryName = item ? getCategoryLabel(item) : 'Uncategorized';
      if (!groups.has(categoryId)) {
        groups.set(categoryId, { id: categoryId, name: categoryName, lines: [] });
      }
      groups.get(categoryId).lines.push({ line, item });
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [lines, itemById]);

  const setLines = (nextLines) => {
    onChange({ target: { name: 'pr_items', value: nextLines } });
  };

  const resetDraftItemFields = () => {
    setDraftItemId('');
    setDraftQuantity('');
    setDraftRemarks('');
    setDraftError('');
  };

  const handleCategoryChange = (categoryId) => {
    setDraftCategoryId(categoryId || '');
    resetDraftItemFields();
  };

  const handleItemChange = (itemId) => {
    setDraftItemId(itemId || '');
    setDraftQuantity('');
    setDraftRemarks('');
    setDraftError('');
  };

  const addItem = () => {
    if (!draftCategoryId) {
      setDraftError('Select a subcategory first.');
      return;
    }
    if (!draftItemId) {
      setDraftError('Select an item.');
      return;
    }
    if (!Number(draftQuantity) || Number(draftQuantity) <= 0) {
      setDraftError('Enter a quantity greater than zero.');
      return;
    }
    if (selectedItemIds.has(String(draftItemId))) {
      setDraftError('This item is already in the list.');
      return;
    }

    setLines([
      ...lines,
      {
        item_id: String(draftItemId),
        quantity: draftQuantity,
        remarks: draftRemarks.trim(),
      },
    ]);
    resetDraftItemFields();
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

  const renderDetail = (label, value) => (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${mutedClass}`}>{label}</p>
      <p className={`text-sm ${labelClass}`}>{value || '—'}</p>
    </div>
  );

  if (!items.length && !effectiveCategories.length) {
    return (
      <div className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${borderClass} ${mutedClass}`}>
        No active inventory items are available. Add items under Setup before creating a requisition.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-sm font-medium ${labelClass}`}>Required items</p>
        <p className={`text-xs ${mutedClass}`}>
          Search subcategory and item on the left, enter quantity and remarks, then add to the selection.
        </p>
      </div>

      {errors.pr_items ? <p className="text-xs text-red-500">{errors.pr_items}</p> : null}

      <div className="grid min-h-[440px] grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: search and capture line details */}
        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Add item</p>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div>
              <label className={fieldLabelClass}>Subcategory *</label>
              <SearchableSelect
                options={categoryOptions}
                value={draftCategoryId}
                onChange={handleCategoryChange}
                placeholder="Search subcategory…"
                darkMode={darkMode}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>Item *</label>
              <SearchableSelect
                options={itemOptions}
                value={draftItemId}
                onChange={handleItemChange}
                placeholder={
                  draftCategoryId
                    ? itemOptions.length
                      ? 'Search item…'
                      : 'No available items in this subcategory'
                    : 'Select a subcategory first'
                }
                darkMode={darkMode}
                disabled={!draftCategoryId || !itemOptions.length}
              />
            </div>

            {draftItem ? (
              <div
                className={`grid grid-cols-2 gap-3 rounded-lg border px-3 py-3 ${
                  darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                {renderDetail('Name', draftItem.name)}
                {renderDetail('Code', draftItem.code)}
                {renderDetail(
                  'Subcategory',
                  categoryById.get(String(getCategoryId(draftItem)))?.name || getCategoryLabel(draftItem)
                )}
                {renderDetail(
                  'Unit',
                  draftItem.unit?.symbol
                    ? `${draftItem.unit.name} (${draftItem.unit.symbol})`
                    : draftItem.unit?.name
                )}
                {renderDetail('Description', draftItem.description)}
                {renderDetail('Min / Reorder', `${draftItem.minimum_level ?? '—'} / ${draftItem.reorder_level ?? '—'}`)}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={fieldLabelClass}>Quantity *</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={draftQuantity}
                  onChange={(e) => {
                    setDraftQuantity(e.target.value);
                    setDraftError('');
                  }}
                  placeholder="0"
                  className={inputClass}
                  disabled={!draftItemId}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Line remarks</label>
                <input
                  type="text"
                  value={draftRemarks}
                  onChange={(e) => setDraftRemarks(e.target.value)}
                  placeholder="Optional note"
                  className={inputClass}
                  disabled={!draftItemId}
                />
              </div>
            </div>

            {draftError ? <p className="text-xs text-red-500">{draftError}</p> : null}

            <button
              type="button"
              onClick={addItem}
              disabled={!draftCategoryId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <FiPlus className="h-4 w-4" />
              Add to selection
            </button>
          </div>
        </section>

        {/* Right: read-only summary grouped by category */}
        <section className={`flex flex-col ${panelClass}`}>
          <div className={`border-b px-4 py-3 ${borderClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${mutedClass}`}>Selected items</p>
            <p className={`mt-1 text-xs ${mutedClass}`}>
              {lines.length
                ? `${lines.length} item${lines.length === 1 ? '' : 's'} selected`
                : 'Nothing selected yet'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selectedByCategory.length ? (
              <div className={`rounded-lg border border-dashed px-4 py-10 text-center text-sm ${borderClass} ${mutedClass}`}>
                Added items will appear here grouped by subcategory.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedByCategory.map((group) => (
                  <div key={group.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      {group.name}
                    </p>
                    <div className="space-y-2">
                      {group.lines.map(({ line, item }) => (
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
                              <p className={`truncate text-xs ${mutedClass}`}>
                                {item?.code || '—'}
                                {item?.unit?.symbol ? ` · ${item.unit.symbol}` : ''}
                              </p>
                              <div className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs ${mutedClass}`}>
                                <span>
                                  <span className="font-medium">Qty:</span> {line.quantity || '—'}
                                </span>
                                <span>
                                  <span className="font-medium">Remarks:</span> {line.remarks || '—'}
                                </span>
                                {item?.description ? (
                                  <span className="col-span-2">
                                    <span className="font-medium">Description:</span> {item.description}
                                  </span>
                                ) : null}
                              </div>
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
                        </div>
                      ))}
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

export default PrItemsEditor;

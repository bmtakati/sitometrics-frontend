import React, { useMemo } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';
import MultiSearchableSelect from './MultiSearchableSelect';
import { formatMoney } from '../utils/formatMoney';

const CATEGORY_TYPE_OPTIONS = [
  { value: 'FOOD', label: 'Food Category' },
  { value: 'BEVERAGE', label: 'Beverage Category' },
];

const emptyCategoryLine = (menuScope = 'FOOD') => ({
  category_type: menuScope === 'BEVERAGE' ? 'BEVERAGE' : 'FOOD',
  category_id: '',
  order_no: '',
  items: [],
});

const itemsForCategory = (line, foodCategories, beverageCategories) => {
  const categoryId = Number(line.category_id);
  if (!categoryId) return [];

  if ((line.category_type || 'FOOD') === 'BEVERAGE') {
    return beverageCategories.find((row) => row.id === categoryId)?.beverages || [];
  }

  return foodCategories.find((row) => row.id === categoryId)?.foods || [];
};

const categoryLabel = (line, foodCategories, beverageCategories) => {
  const categoryId = Number(line.category_id);
  if (!categoryId) return 'Unnamed category';

  if ((line.category_type || 'FOOD') === 'BEVERAGE') {
    const row = beverageCategories.find((c) => c.id === categoryId);
    return row?.name || `Category #${categoryId}`;
  }

  const row = foodCategories.find((c) => c.id === categoryId);
  return row?.name || `Category #${categoryId}`;
};

const catalogItemLabel = (catalogItem) => catalogItem.name || '—';

const MenuCategoriesEditor = ({
  value = [],
  onChange,
  menuScope = 'FOOD',
  foodCategoryOptions = [],
  beverageCategoryOptions = [],
  foodCategories = [],
  beverageCategories = [],
  errors = {},
  darkMode = false,
}) => {
  const showTypeColumn = menuScope === 'BOTH';
  const lines = Array.isArray(value) && value.length ? value : [emptyCategoryLine(menuScope)];

  const updateLines = (next) => {
    onChange({ target: { name: 'categories', value: next } });
  };

  const updateLine = (index, patch) => {
    updateLines(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    const nextOrder = lines.length ? Math.max(...lines.map((line) => Number(line.order_no) || 0)) + 1 : 1;
    updateLines([...lines, { ...emptyCategoryLine(menuScope), order_no: String(nextOrder) }]);
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    updateLines(next.length ? next : [emptyCategoryLine(menuScope)]);
  };

  const setSelectedItemIds = (lineIndex, lineType, selectedIds) => {
    const line = lines[lineIndex];
    const idField = lineType === 'BEVERAGE' ? 'beverage_id' : 'food_id';
    const catalogItems = itemsForCategory(line, foodCategories, beverageCategories);
    const existing = new Map((line.items || []).map((row) => [String(row[idField]), row]));

    const items = selectedIds.map((id) => {
      const key = String(id);
      const prev = existing.get(key);
      if (prev) return prev;
      const catalogItem = catalogItems.find((row) => String(row.id) === key);
      return {
        [idField]: key,
        quantity: '1',
        price: catalogItem?.price != null ? String(catalogItem.price) : '0',
        remarks: '',
      };
    });

    updateLine(lineIndex, { items });
  };

  const removeItem = (lineIndex, lineType, itemId) => {
    const line = lines[lineIndex];
    const idField = lineType === 'BEVERAGE' ? 'beverage_id' : 'food_id';
    updateLine(lineIndex, {
      items: (line.items || []).filter((row) => String(row[idField]) !== String(itemId)),
    });
  };

  const updateItemPrice = (lineIndex, itemId, lineType, priceValue) => {
    const line = lines[lineIndex];
    const idField = lineType === 'BEVERAGE' ? 'beverage_id' : 'food_id';
    const items = (line.items || []).map((row) =>
      String(row[idField]) === String(itemId) ? { ...row, price: priceValue } : row
    );
    updateLine(lineIndex, { items });
  };

  const itemPrice = (item, catalogMap) => {
    if (item.price != null && item.price !== '') return Number(item.price) || 0;
    const idField = item.beverage_id ? 'beverage_id' : 'food_id';
    const catalogItem = catalogMap.get(String(item[idField]));
    return Number(catalogItem?.price) || 0;
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const panelClass = darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50/80';
  const optionsForType = (type) => (type === 'BEVERAGE' ? beverageCategoryOptions : foodCategoryOptions);

  const selectedSummary = useMemo(() => {
    return [...lines]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.category_id && (line.items || []).length > 0)
      .sort((a, b) => (Number(a.line.order_no) || 0) - (Number(b.line.order_no) || 0));
  }, [lines]);

  const totalSelectedItems = useMemo(
    () => lines.reduce((sum, line) => sum + (line.items?.length || 0), 0),
    [lines]
  );

  const totalMenuValue = useMemo(() => {
    let total = 0;
    lines.forEach((line) => {
      const catalogItems = itemsForCategory(line, foodCategories, beverageCategories);
      const catalogMap = new Map(catalogItems.map((item) => [String(item.id), item]));
      (line.items || []).forEach((item) => {
        total += itemPrice(item, catalogMap);
      });
    });
    return total;
  }, [lines, foodCategories, beverageCategories]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Menu categories & items</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Add categories on the left, pick items with the searchable multi-select, and set each item price on the right.
          </p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add category
        </button>
      </div>

      {errors.categories ? <p className="text-xs text-red-500">{errors.categories}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Left — categories & item picker */}
        <div className={`space-y-3 rounded-xl border p-3 ${borderClass}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Categories
          </p>

          {lines.map((line, index) => {
            const lineType = line.category_type || (menuScope === 'BEVERAGE' ? 'BEVERAGE' : 'FOOD');
            const catalogItems = itemsForCategory(line, foodCategories, beverageCategories);
            const idField = lineType === 'BEVERAGE' ? 'beverage_id' : 'food_id';
            const selectedIds = (line.items || []).map((row) => String(row[idField]));
            const itemOptions = catalogItems.map((item) => ({
              value: String(item.id),
              label: catalogItemLabel(item),
            }));

            return (
              <div
                key={`menu-category-${line.id || index}`}
                className={`rounded-lg border p-3 ${darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white'}`}
              >
                <div
                  className={`mb-3 grid gap-2 ${showTypeColumn ? 'grid-cols-[120px_1fr_72px_36px]' : 'grid-cols-[1fr_72px_36px]'}`}
                >
                  {showTypeColumn ? (
                    <SearchableSelect
                      options={CATEGORY_TYPE_OPTIONS}
                      value={lineType}
                      onChange={(val) => updateLine(index, { category_type: val, category_id: '', items: [] })}
                      placeholder="Type…"
                      darkMode={darkMode}
                      size="compact"
                    />
                  ) : null}
                  <SearchableSelect
                    options={optionsForType(lineType)}
                    value={line.category_id ? String(line.category_id) : ''}
                    onChange={(val) =>
                      updateLine(index, { category_type: lineType, category_id: val, items: [] })
                    }
                    placeholder="Select category…"
                    darkMode={darkMode}
                    size="compact"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.order_no ?? ''}
                    onChange={(e) => updateLine(index, { order_no: e.target.value })}
                    placeholder="Order"
                    title="Display order"
                    className={`h-[38px] rounded-lg border px-2 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className={`flex h-[38px] w-[36px] items-center justify-center rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                    aria-label="Remove category"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>

                {line.category_id ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lineType === 'BEVERAGE' ? 'Beverages' : 'Foods'} ({catalogItems.length} available)
                      </p>
                      {selectedIds.length ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {selectedIds.length} selected
                        </span>
                      ) : null}
                    </div>
                    <MultiSearchableSelect
                      options={itemOptions}
                      selectedValues={selectedIds}
                      onChange={(vals) => setSelectedItemIds(index, lineType, vals)}
                      placeholder={`Search ${lineType === 'BEVERAGE' ? 'beverages' : 'foods'}…`}
                      darkMode={darkMode}
                      disabled={!itemOptions.length}
                    />
                  </div>
                ) : (
                  <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Select a category to pick items.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right — selected summary */}
        <div className={`flex max-h-[min(70vh,560px)] flex-col rounded-xl border ${panelClass}`}>
          <div className={`border-b px-3 py-2.5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Selected for menu
            </p>
            <p className={`mt-0.5 text-sm font-medium ${labelClass}`}>
              {totalSelectedItems} item{totalSelectedItems === 1 ? '' : 's'} across {selectedSummary.length}{' '}
              categor{selectedSummary.length === 1 ? 'y' : 'ies'}
            </p>
            <p className={`text-sm font-semibold text-emerald-600 dark:text-emerald-400`}>
              Total: {formatMoney(totalMenuValue)}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {!selectedSummary.length ? (
              <div className={`rounded-lg border border-dashed px-4 py-8 text-center text-sm ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                Selected foods and beverages will appear here, grouped by category.
              </div>
            ) : (
              selectedSummary.map(({ line, index: lineIndex }) => {
                const lineType = line.category_type || (menuScope === 'BEVERAGE' ? 'BEVERAGE' : 'FOOD');
                const idField = lineType === 'BEVERAGE' ? 'beverage_id' : 'food_id';
                const catalogItems = itemsForCategory(line, foodCategories, beverageCategories);
                const catalogMap = new Map(catalogItems.map((item) => [String(item.id), item]));
                const categoryTotal = (line.items || []).reduce(
                  (sum, item) => sum + itemPrice(item, catalogMap),
                  0
                );

                return (
                  <div
                    key={`selected-cat-${line.id || lineIndex}`}
                    className={`overflow-hidden rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
                  >
                    <div
                      className={`flex items-center justify-between gap-2 border-b px-3 py-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${labelClass}`}>
                          {line.order_no || '—'}. {categoryLabel(line, foodCategories, beverageCategories)}
                        </p>
                        <p className={`text-[10px] uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {lineType === 'BEVERAGE' ? 'Beverage' : 'Food'} category
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {formatMoney(categoryTotal)}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {(line.items || []).map((item) => {
                        const itemId = item[idField];
                        const catalogItem = catalogMap.get(String(itemId));

                        return (
                          <div key={`${lineType}-${itemId}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <p className={`min-w-0 flex-1 truncate text-sm font-medium ${labelClass}`}>
                              {catalogItem?.name || `Item #${itemId}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price ?? ''}
                                onChange={(e) => updateItemPrice(lineIndex, itemId, lineType, e.target.value)}
                                placeholder="0"
                                title="Menu item price"
                                className={`w-24 rounded-md border px-2 py-1 text-right text-sm font-semibold ${darkMode ? 'border-gray-600 bg-gray-800 text-emerald-300' : 'border-gray-300 bg-white text-emerald-700'}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(lineIndex, lineType, itemId)}
                                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                aria-label="Remove item"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { emptyCategoryLine };
export default MenuCategoriesEditor;

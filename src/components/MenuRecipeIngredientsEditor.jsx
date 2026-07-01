import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';

const INGREDIENT_TYPE_OPTIONS = [
  { value: 'FOOD', label: 'Food' },
  { value: 'BEVERAGE', label: 'Beverage' },
];

const emptyLine = (menuScope = 'FOOD') => ({
  ingredient_type: menuScope === 'BEVERAGE' ? 'BEVERAGE' : 'FOOD',
  food_id: '',
  beverage_id: '',
  quantity: '',
  remarks: '',
});

const toOptions = (rows = []) =>
  rows
    .filter((row) => row.id != null && row.name)
    .map((row) => ({
      value: String(row.id),
      label: `${row.name}${row.code ? ` (${row.code})` : ''}`,
    }));

const MenuRecipeIngredientsEditor = ({
  value = [],
  onChange,
  menuScope = 'FOOD',
  foodOptions = [],
  beverageOptions = [],
  errors = {},
  darkMode = false,
}) => {
  const defaultType = menuScope === 'BEVERAGE' ? 'BEVERAGE' : 'FOOD';
  const lines = Array.isArray(value) && value.length ? value : [emptyLine(menuScope)];
  const showTypeColumn = menuScope === 'BOTH';

  const updateLine = (index, patch) => {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange({ target: { name: 'ingredients', value: next } });
  };

  const addLine = () => {
    onChange({ target: { name: 'ingredients', value: [...lines, emptyLine(menuScope)] } });
  };

  const removeLine = (index) => {
    const next = lines.filter((_, i) => i !== index);
    onChange({ target: { name: 'ingredients', value: next.length ? next : [emptyLine(menuScope)] } });
  };

  const handleTypeChange = (index, type) => {
    updateLine(index, {
      ingredient_type: type,
      food_id: '',
      beverage_id: '',
    });
  };

  const labelClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const gridCols = showTypeColumn
    ? 'grid-cols-[120px_1fr_120px_1fr_40px]'
    : 'grid-cols-[1fr_120px_1fr_40px]';

  const scopeHint =
    menuScope === 'FOOD'
      ? 'Select foods from the categories linked on the Categories tab.'
      : menuScope === 'BEVERAGE'
        ? 'Select beverages from the categories linked on the Categories tab.'
        : 'Choose food or beverage ingredients from the linked categories.';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${labelClass}`}>Menu ingredients</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{scopeHint}</p>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add ingredient
        </button>
      </div>

      {!menuScope ? (
        <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          Select a menu first to load its food and beverage categories.
        </p>
      ) : null}

      {errors.ingredients ? <p className="text-xs text-red-500">{errors.ingredients}</p> : null}

      <div className={`overflow-hidden rounded-xl border ${borderClass}`}>
        <div
          className={`grid ${gridCols} gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'border-gray-600 bg-gray-800/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
        >
          {showTypeColumn ? <span>Category</span> : null}
          <span>Ingredient</span>
          <span>Quantity</span>
          <span>Remarks</span>
          <span />
        </div>
        {lines.map((line, index) => {
          const lineType = line.ingredient_type || defaultType;
          const ingredientOptions = lineType === 'BEVERAGE' ? beverageOptions : foodOptions;
          const ingredientValue =
            lineType === 'BEVERAGE'
              ? line.beverage_id
                ? String(line.beverage_id)
                : ''
              : line.food_id
                ? String(line.food_id)
                : '';

          return (
            <div
              key={`menu-ingredient-${line.id || index}`}
              className={`grid ${gridCols} gap-2 border-b px-3 py-2 last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
            >
              {showTypeColumn ? (
                <SearchableSelect
                  options={INGREDIENT_TYPE_OPTIONS}
                  value={lineType}
                  onChange={(val) => handleTypeChange(index, val)}
                  placeholder="Type…"
                  darkMode={darkMode}
                  size="compact"
                />
              ) : null}
              <SearchableSelect
                options={ingredientOptions}
                value={ingredientValue}
                onChange={(val) =>
                  updateLine(
                    index,
                    lineType === 'BEVERAGE' ? { beverage_id: val, food_id: '' } : { food_id: val, beverage_id: '' }
                  )
                }
                placeholder={lineType === 'BEVERAGE' ? 'Select beverage…' : 'Select food…'}
                darkMode={darkMode}
                size="compact"
              />
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={line.quantity ?? ''}
                onChange={(e) => updateLine(index, { quantity: e.target.value })}
                placeholder="0.00"
                className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
              />
              <input
                type="text"
                value={line.remarks ?? ''}
                onChange={(e) => updateLine(index, { remarks: e.target.value })}
                placeholder="Optional remarks"
                className={`h-[38px] rounded-lg border px-3 text-sm ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
              />
              <button
                type="button"
                onClick={() => removeLine(index)}
                className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                aria-label="Remove ingredient"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { emptyLine as emptyIngredientLine, toOptions as ingredientToOptions };
export default MenuRecipeIngredientsEditor;

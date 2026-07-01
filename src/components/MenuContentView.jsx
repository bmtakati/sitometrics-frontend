import React from 'react';
import { formatMoney } from '../utils/formatMoney';

export const ingredientsForCategory = (line, ingredients = []) =>
  ingredients.filter((ing) => {
    if (line.category_type === 'BEVERAGE') {
      return line.category?.beverages?.some(
        (row) => row.id === ing.beverage_id || row.id === Number(ing.beverage_id)
      );
    }

    return line.category?.foods?.some(
      (row) => row.id === ing.food_id || row.id === Number(ing.food_id)
    );
  });

const MenuContentView = ({ recipe, menuValue, showTotal = true, className = '' }) => {
  const categories = [...(recipe?.categories || [])].sort(
    (a, b) => (Number(a.order_no) || 0) - (Number(b.order_no) || 0)
  );
  const ingredients = recipe?.ingredients || [];
  const total = menuValue ?? recipe?.menu?.menu_value;

  if (!categories.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No categories configured.</p>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {categories.map((line) => {
        const ingredientRows = ingredientsForCategory(line, ingredients);
        const categoryTotal = ingredientRows.reduce((sum, ing) => sum + (Number(ing.price) || 0), 0);

        return (
          <div
            key={line.id || `${line.category_type}-${line.category_id}`}
            className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-800">
              <span>
                {line.order_no}. {line.category?.name || line.category_id}
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {formatMoney(categoryTotal)}
              </span>
            </div>
            {ingredientRows.length ? (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientRows.map((ing) => {
                    const isFood = ing.ingredient_type === 'FOOD' || ing.food_id;
                    const name = isFood ? ing.food?.name : ing.beverage?.name;

                    return (
                      <tr
                        key={ing.id || `${ing.ingredient_type}-${ing.food_id || ing.beverage_id}`}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <td className="px-3 py-2 font-medium">{name || '—'}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(ing.price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No items in this category.</p>
            )}
          </div>
        );
      })}

      {showTotal ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Total menu value: {formatMoney(total)}
        </div>
      ) : null}
    </div>
  );
};

export default MenuContentView;

import React, { useEffect, useState } from 'react';
import MenuContentView from './MenuContentView';
import { fetchMenuRecipe } from '../utils/menuRecipeApi';

const MenuRecipePreview = ({
  menuId,
  menuValue,
  showTotal = true,
  emptyMessage = 'No categories or items configured. Add them in Menu Recipes.',
  pendingMessage = 'Save the menu first, then configure categories and items in Menu Recipes.',
  className = '',
}) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!menuId) {
      setRecipe(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    fetchMenuRecipe(menuId)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [menuId]);

  if (!menuId) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{pendingMessage}</p>;
  }

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading menu content…</p>;
  }

  if (!recipe?.categories?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <MenuContentView
      recipe={recipe}
      menuValue={menuValue ?? recipe?.menu?.menu_value}
      showTotal={showTotal}
      className={className}
    />
  );
};

export default MenuRecipePreview;

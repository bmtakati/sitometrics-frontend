import { emptyCategoryLine } from '../components/MenuCategoriesEditor';

export const buildCategoryOptions = (rows = []) =>
  rows
    .filter((row) => row.id != null && row.name)
    .map((row) => ({ value: String(row.id), label: row.name }));

export const ingredientsToCategoryItems = (categories, ingredients) =>
  (categories || []).map((category) => {
    const categoryId = Number(category.category_id);
    const type = category.category_type || 'FOOD';

    const items = (ingredients || [])
      .filter((line) => {
        if (type === 'BEVERAGE') {
          return Number(line.beverage?.beverage_category_id) === categoryId;
        }
        return Number(line.food?.food_category_id) === categoryId;
      })
      .map((line) => ({
        id: line.id,
        food_id: line.food_id ? String(line.food_id) : '',
        beverage_id: line.beverage_id ? String(line.beverage_id) : '',
        quantity: line.quantity ?? '1',
        price:
          line.price != null && line.price !== ''
            ? String(line.price)
            : String(type === 'BEVERAGE' ? line.beverage?.price : line.food?.price ?? 0),
        remarks: line.remarks || '',
      }));

    return {
      id: category.id,
      category_type: type,
      category_id: category.category_id ? String(category.category_id) : '',
      order_no: category.order_no ?? '',
      category: category.category,
      items,
    };
  });

export const patchRecipeCategories = (row) => {
  const categories = ingredientsToCategoryItems(row?.categories || [], row?.ingredients || []);

  if (categories.length) return categories;

  return (row?.categories || []).map((line) => ({
    id: line.id,
    category_type: line.category_type || 'FOOD',
    category_id: line.category_id ? String(line.category_id) : '',
    order_no: line.order_no ?? '',
    category: line.category,
    items: line.items || [],
  }));
};

export const normalizeCategoryLines = (categories, menuScope) =>
  (categories || [])
    .map((line) => ({
      ...line,
      category_type:
        line.category_type
        || (menuScope === 'BEVERAGE' ? 'BEVERAGE' : menuScope === 'FOOD' ? 'FOOD' : ''),
    }))
    .filter((line) => line.category_id && Number(line.order_no) > 0);

export const categoriesToIngredients = (categories, menuScope) => {
  const ingredients = [];

  normalizeCategoryLines(categories, menuScope).forEach((category) => {
    const type = category.category_type;

    (category.items || []).forEach((item) => {
      const isBeverage = type === 'BEVERAGE';
      const hasSelection = isBeverage ? item.beverage_id : item.food_id;
      if (!hasSelection || Number(item.quantity) <= 0) return;
      if (!(Number(item.price) > 0)) return;

      ingredients.push({
        ...(item.id ? { id: Number(item.id) } : {}),
        category_id: Number(category.category_id),
        ingredient_type: type,
        food_id: isBeverage ? null : Number(item.food_id),
        beverage_id: isBeverage ? Number(item.beverage_id) : null,
        quantity: Number(item.quantity),
        price: Number(item.price) || 0,
        remarks: item.remarks?.trim() || null,
      });
    });
  });

  return ingredients;
};

export const validateMenuCategories = (categories, menuScope) => {
  const errors = {};
  const validCategories = normalizeCategoryLines(categories, menuScope);
  const hasAnyDraft = (categories || []).some(
    (line) => line.category_id || (line.items || []).length > 0
  );

  if (!hasAnyDraft && validCategories.length === 0) {
    return errors;
  }

  if (validCategories.length === 0) {
    errors.categories = 'Add at least one category with an order number';
    return errors;
  }

  const categoryKeys = validCategories.map((line) => `${line.category_type}:${line.category_id}`);
  if (new Set(categoryKeys).size !== categoryKeys.length) {
    errors.categories = 'Each category can only be added once';
    return errors;
  }

  if (validCategories.some((line) => !(line.items || []).length)) {
    errors.categories = 'Select at least one food or beverage for each category';
    return errors;
  }

  if (
    validCategories.some((line) => (line.items || []).some((item) => !(Number(item.price) > 0)))
  ) {
    errors.categories = 'Set a price greater than zero for every selected item';
    return errors;
  }

  const ingredients = categoriesToIngredients(categories, menuScope);
  if (!ingredients.length) {
    errors.categories = 'Select at least one food or beverage to add to this menu';
    return errors;
  }

  const lineKeys = ingredients.map((line) =>
    (line.ingredient_type === 'BEVERAGE' ? `beverage:${line.beverage_id}` : `food:${line.food_id}`)
  );
  if (new Set(lineKeys).size !== lineKeys.length) {
    errors.categories = 'Each food or beverage can only be added once';
  }

  return errors;
};

export const buildRecipePayload = (menuId, categories, menuScope) => {
  const validCategories = normalizeCategoryLines(categories, menuScope);

  return {
    menu_id: Number(menuId),
    categories: validCategories.map((line) => ({
      ...(line.id ? { id: Number(line.id) } : {}),
      category_type: line.category_type,
      category_id: Number(line.category_id),
      order_no: Number(line.order_no),
    })),
    ingredients: categoriesToIngredients(categories, menuScope),
  };
};

export { emptyCategoryLine };

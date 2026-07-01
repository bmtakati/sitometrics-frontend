import React, { useEffect, useMemo, useState } from 'react';
import { FiList, FiTrendingUp, FiInfo, FiGrid, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import SearchableSelect from '../../components/SearchableSelect';
import MenuCategoriesEditor, { emptyCategoryLine } from '../../components/MenuCategoriesEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatMoney } from '../../utils/formatMoney';
import { fetchMenuRecipe, downloadMenuPdf } from '../../utils/menuRecipeApi';
import MenuContentView from '../../components/MenuContentView';

const MENU_SCOPE_LABELS = {
  FOOD: 'Food',
  BEVERAGE: 'Beverage',
  BOTH: 'Both',
};

const buildCategoryOptions = (rows = []) =>
  rows
    .filter((row) => row.id != null && row.name)
    .map((row) => ({ value: String(row.id), label: row.name }));

const ingredientsToCategoryItems = (categories, ingredients) => {
  return (categories || []).map((category) => {
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
        price: line.price != null && line.price !== ''
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
};

const patchRecipeRow = (row) => {
  const categories = ingredientsToCategoryItems(row.categories || [], row.ingredients || []);

  return {
    ...row,
    menu_id: row.menu_id ?? row.id,
    categories: categories.length
      ? categories
      : (row.categories || []).map((line) => ({
          id: line.id,
          category_type: line.category_type || 'FOOD',
          category_id: line.category_id ? String(line.category_id) : '',
          order_no: line.order_no ?? '',
          category: line.category,
          items: line.items || [],
        })),
  };
};

const normalizeCategoryLines = (categories, menuScope) =>
  (categories || [])
    .map((line) => ({
      ...line,
      category_type:
        line.category_type || (menuScope === 'BEVERAGE' ? 'BEVERAGE' : menuScope === 'FOOD' ? 'FOOD' : ''),
    }))
    .filter((line) => line.category_id && Number(line.order_no) > 0);

const categoriesToIngredients = (categories, menuScope) => {
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

const MenuRecipe = () => {
  const [menus, setMenus] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [beverageCategories, setBeverageCategories] = useState([]);
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [menuRes, foodRes, beverageRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/menus/all`),
          apiFetch(`${API_BASE_URL}/api/food-categories/all`),
          apiFetch(`${API_BASE_URL}/api/beverage-categories/all`),
        ]);

        const [menuJson, foodJson, beverageJson] = await Promise.all([
          menuRes.json().catch(() => ({})),
          foodRes.json().catch(() => ({})),
          beverageRes.json().catch(() => ({})),
        ]);

        if (cancelled) return;

        setMenus(Array.isArray(menuJson?.data) ? menuJson.data : []);
        setFoodCategories(Array.isArray(foodJson?.data) ? foodJson.data : []);
        setBeverageCategories(Array.isArray(beverageJson?.data) ? beverageJson.data : []);
      } catch {
        if (!cancelled) {
          setMenus([]);
          setFoodCategories([]);
          setBeverageCategories([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const foodCategoryOptions = useMemo(() => buildCategoryOptions(foodCategories), [foodCategories]);
  const beverageCategoryOptions = useMemo(
    () => buildCategoryOptions(beverageCategories),
    [beverageCategories]
  );

  const menuOptions = useMemo(
    () =>
      menus
        .filter((menu) => menu.id != null && menu.name)
        .map((menu) => ({
          value: String(menu.id),
          label: menu.name,
        })),
    [menus]
  );

  const crud = useApiCrud('menu-recipes', {
    initialFormData: {
      menu_id: '',
      categories: [emptyCategoryLine('FOOD')],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.menu_id) errors.menu_id = 'Please select a menu';

      const selectedMenu = menus.find((menu) => String(menu.id) === String(data.menu_id));
      const menuScope = selectedMenu?.menu_scope || 'FOOD';

      const validCategories = normalizeCategoryLines(data.categories, menuScope);

      if (validCategories.length === 0) {
        errors.categories = 'Add at least one category with an order number';
      }

      const categoryKeys = validCategories.map(
        (line) => `${line.category_type}:${line.category_id}`
      );
      if (new Set(categoryKeys).size !== categoryKeys.length) {
        errors.categories = 'Each category can only be added once';
      }

      const categoriesMissingItems = validCategories.filter((line) => !(line.items || []).length);
      if (categoriesMissingItems.length) {
        errors.categories = 'Select at least one food or beverage for each category';
      }

      const hasZeroPrice = validCategories.some((line) =>
        (line.items || []).some((item) => !(Number(item.price) > 0))
      );
      if (hasZeroPrice) {
        errors.categories = 'Set a price greater than zero for every selected item';
      }

      const ingredients = categoriesToIngredients(data.categories, menuScope);
      if (!ingredients.length) {
        errors.categories = 'Select at least one food or beverage to add to this menu';
      }

      const lineKeys = ingredients.map((line) =>
        line.ingredient_type === 'BEVERAGE' ? `beverage:${line.beverage_id}` : `food:${line.food_id}`
      );
      if (new Set(lineKeys).size !== lineKeys.length) {
        errors.categories = 'Each food or beverage can only be added once';
      }

      return errors;
    },
    transformFormData: (data) => {
      const selectedMenu = menus.find((menu) => String(menu.id) === String(data.menu_id));
      const menuScope = selectedMenu?.menu_scope || 'FOOD';
      const validCategories = normalizeCategoryLines(data.categories, menuScope);

      return {
        menu_id: Number(data.menu_id),
        categories: validCategories.map((line) => ({
          ...(line.id ? { id: Number(line.id) } : {}),
          category_type: line.category_type,
          category_id: Number(line.category_id),
          order_no: Number(line.order_no),
        })),
        ingredients: categoriesToIngredients(data.categories, menuScope),
      };
    },
    transformResponse: (data) => {
      if (Array.isArray(data)) return data.map(patchRecipeRow);
      if (data && typeof data === 'object') {
        const patched = patchRecipeRow(data);
        const scope = patched.menu?.menu_scope || 'FOOD';
        if (!patched.categories?.length) patched.categories = [emptyCategoryLine(scope)];
        return patched;
      }
      return data;
    },
    resourceName: 'Menu Recipe',
    itemsPerPage: 10,
  });

  const selectedMenu = useMemo(
    () => menus.find((menu) => String(menu.id) === String(crud.formData?.menu_id)),
    [menus, crud.formData?.menu_id]
  );

  const menuScope = selectedMenu?.menu_scope || '';

  const handleExportPdf = async (row) => {
    const menuId = row.menu_id ?? row.id;
    if (!menuId) return;

    setExportingId(menuId);
    try {
      await downloadMenuPdf(menuId, row.menu?.name || row.menu_id);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Export failed',
        text: error?.message || 'Could not generate the menu PDF. Please try again.',
      });
    } finally {
      setExportingId(null);
    }
  };

  const pageConfig = {
    icon: FiList,
    title: 'Menu Recipes',
    subtitle: 'Manage menu categories, items, and PDF exports',
    addButtonLabel: 'Add Menu Recipe',
    searchPlaceholder: 'Search menu recipes...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total Menu Items', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'menus_with_recipes', label: 'Menus With Recipes', icon: FiList, iconColor: 'green-600' },
    ],
  };

  const tableColumns = [
    {
      header: 'Menu',
      accessor: 'menu',
      noWrap: true,
      render: (row) => row.menu?.name || row.menu_id,
    },
    {
      header: 'Menu Code',
      accessor: 'menu',
      noWrap: true,
      render: (row) => row.menu?.code || '—',
    },
    {
      header: 'Type',
      accessor: 'menu',
      noWrap: true,
      render: (row) => MENU_SCOPE_LABELS[row.menu?.menu_scope] || row.menu?.menu_scope || '—',
    },
    {
      header: 'Categories',
      accessor: 'categories_count',
      noWrap: true,
      render: (row) => row.categories_count ?? (row.categories?.length || 0),
    },
    {
      header: 'Menu Value',
      accessor: 'menu',
      noWrap: true,
      render: (row) => formatMoney(row.menu?.menu_value),
    },
    {
      header: 'Items',
      accessor: 'ingredients_count',
      noWrap: true,
      render: (row) => row.ingredients_count ?? (row.ingredients?.length || 0),
    },
  ];

  const formTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Recipe Details',
        icon: FiInfo,
        fields: [
          {
            name: 'menu_id',
            type: 'custom',
            render: (formData, onInputChange, errors, darkMode) => (
              <div className="space-y-3">
                <div>
                  <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Menu *
                  </label>
                  <SearchableSelect
                    options={menuOptions}
                    value={formData.menu_id ? String(formData.menu_id) : ''}
                    onChange={(val) => {
                      const menu = menus.find((row) => String(row.id) === String(val));
                      const scope = menu?.menu_scope || 'FOOD';
                      onInputChange({ target: { name: 'menu_id', value: val } });
                      onInputChange({ target: { name: 'categories', value: [emptyCategoryLine(scope)] } });
                    }}
                    placeholder="Select menu…"
                    darkMode={darkMode}
                    invalid={Boolean(errors.menu_id)}
                  />
                  {errors.menu_id ? <p className="mt-1 text-sm text-red-600">{errors.menu_id}</p> : null}
                </div>
                {selectedMenu ? (
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm ${darkMode ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                  >
                    <p>
                      <span className="font-medium">Menu type:</span>{' '}
                      {MENU_SCOPE_LABELS[selectedMenu.menu_scope] || selectedMenu.menu_scope}
                    </p>
                    <p>
                      <span className="font-medium">Selling price:</span> {selectedMenu.selling_price ?? '—'}
                    </p>
                  </div>
                ) : null}
              </div>
            ),
          },
        ],
      },
      {
        id: 'categories',
        label: 'Categories & Items',
        icon: FiGrid,
        fields: [
          {
            name: 'categories',
            type: 'custom',
            render: (formData, onInputChange, errors, darkMode) => (
              <MenuCategoriesEditor
                value={formData.categories}
                onChange={onInputChange}
                menuScope={menuScope}
                foodCategoryOptions={foodCategoryOptions}
                beverageCategoryOptions={beverageCategoryOptions}
                foodCategories={foodCategories}
                beverageCategories={beverageCategories}
                errors={errors}
                darkMode={darkMode}
              />
            ),
          },
        ],
      },
    ],
    [
      menuOptions,
      menus,
      selectedMenu,
      menuScope,
      foodCategoryOptions,
      beverageCategoryOptions,
      foodCategories,
      beverageCategories,
    ]
  );

  const viewTabs = [
    {
      id: 'details',
      label: 'Recipe Details',
      icon: FiInfo,
      fields: [
        { label: 'Menu', accessor: 'menu.name', valueRender: (item) => item.menu?.name || '—' },
        { label: 'Menu Code', accessor: 'menu.code', valueRender: (item) => item.menu?.code || '—' },
        {
          label: 'Menu Type',
          accessor: 'menu.menu_scope',
          valueRender: (item) => MENU_SCOPE_LABELS[item.menu?.menu_scope] || item.menu?.menu_scope || '—',
        },
        {
          label: 'Menu Value',
          accessor: 'menu.menu_value',
          valueRender: (item) => formatMoney(item.menu?.menu_value),
        },
      ],
    },
    {
      id: 'categories',
      label: 'Categories & Items',
      icon: FiGrid,
      fields: [
        {
          label: 'Menu content',
          accessor: 'categories',
          fullWidth: true,
          valueRender: (item) => <MenuContentView recipe={item} />,
        },
      ],
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formTabs={formTabs}
      viewTabs={viewTabs}
      modalTitle="Menu Recipe"
      modalMaxWidth="max-w-6xl"
      crud={crud}
      filterOptions={[{ label: 'All', value: 'all' }]}
      extraActions={[
        {
          type: 'pdf',
          label: exportingId ? 'Exporting…' : 'Export PDF',
          icon: FiFileText,
          onClick: (row) => handleExportPdf(row),
        },
      ]}
    />
  );
};

export default MenuRecipe;

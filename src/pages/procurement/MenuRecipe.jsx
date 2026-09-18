import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiList, FiTrendingUp, FiInfo, FiGrid, FiFileText } from 'react-icons/fi';
import { showQuickError } from '../../utils/dialogUtils';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import SearchableSelect from '../../components/SearchableSelect';
import MenuCategoriesEditor from '../../components/MenuCategoriesEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatMoney } from '../../utils/formatMoney';
import { downloadMenuPdf } from '../../utils/menuRecipeApi';
import MenuContentView from '../../components/MenuContentView';
import {
  buildCategoryOptions,
  buildRecipePayload,
  emptyCategoryLine,
  normalizeCategoryLines,
  patchRecipeCategories,
  validateMenuCategories,
} from '../../utils/menuCategoriesForm';

const MENU_SCOPE_LABELS = {
  FOOD: 'Food',
  BEVERAGE: 'Beverage',
  BOTH: 'Both',
};

const patchRecipeRow = (row) => {
  const categories = patchRecipeCategories(row);

  return {
    ...row,
    menu_id: row.menu_id ?? row.id,
    categories,
  };
};

const MenuRecipe = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openedMenuRef = useRef(null);
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
      Object.assign(errors, validateMenuCategories(data.categories, menuScope));

      // Recipes always require at least one category (unlike Menu create with details only).
      if (!errors.categories) {
        const validCategories = normalizeCategoryLines(data.categories, menuScope);
        if (!validCategories.length) {
          errors.categories = 'Add at least one category with an order number';
        }
      }

      return errors;
    },
    transformFormData: (data) => {
      const selectedMenu = menus.find((menu) => String(menu.id) === String(data.menu_id));
      const menuScope = selectedMenu?.menu_scope || 'FOOD';
      return buildRecipePayload(data.menu_id, data.categories, menuScope);
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

  const requestedMenuId = searchParams.get('menu');

  useEffect(() => {
    if (!requestedMenuId) {
      openedMenuRef.current = null;
      return undefined;
    }
    if (openedMenuRef.current === requestedMenuId) return undefined;

    openedMenuRef.current = requestedMenuId;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('menu');
    setSearchParams(nextParams, { replace: true });
    crud.handleEdit({ id: requestedMenuId });
    return undefined;
  }, [requestedMenuId, searchParams, setSearchParams, crud]);

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
      showQuickError('Export failed', error?.message || 'Could not generate the menu PDF. Please try again.');
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
                    disabled={crud.isEditing}
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
            fullWidth: true,
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
      crud.isEditing,
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

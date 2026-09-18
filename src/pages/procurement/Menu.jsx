import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCoffee, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiInfo, FiGrid, FiFileText } from 'react-icons/fi';
import { showQuickError, showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import MenuCategoriesEditor from '../../components/MenuCategoriesEditor';
import MenuRecipePreview from '../../components/MenuRecipePreview';
import { formatMoney } from '../../utils/formatMoney';
import { downloadMenuPdf, fetchMenuRecipe } from '../../utils/menuRecipeApi';
import {
  buildCategoryOptions,
  buildRecipePayload,
  emptyCategoryLine,
  patchRecipeCategories,
  validateMenuCategories,
} from '../../utils/menuCategoriesForm';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const MENU_SCOPE_OPTIONS = [
  { value: 'FOOD', label: 'Food' },
  { value: 'BEVERAGE', label: 'Beverage' },
  { value: 'BOTH', label: 'Both' },
];

const scopeLabel = (scope) => MENU_SCOPE_OPTIONS.find((opt) => opt.value === scope)?.label || scope || '—';

const formatSellingPrice = (row) => {
  const amount = formatMoney(row?.selling_price);
  const code = row?.currency?.code;
  return code ? `${code} ${amount}` : amount;
};

const emptyMenuForm = {
  name: '',
  menu_scope: 'FOOD',
  currency_id: '',
  selling_price: 0,
  description: '',
  status_id: '',
  categories: [emptyCategoryLine('FOOD')],
};

const Menu = () => {
  const [exportingId, setExportingId] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [beverageCategories, setBeverageCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [currencyRes, foodRes, beverageRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/currencies/all`),
          apiFetch(`${API_BASE_URL}/api/food-categories/all`),
          apiFetch(`${API_BASE_URL}/api/beverage-categories/all`),
        ]);
        const [currencyJson, foodJson, beverageJson] = await Promise.all([
          currencyRes.json().catch(() => ({})),
          foodRes.json().catch(() => ({})),
          beverageRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;

        const rows = Array.isArray(currencyJson?.data) ? currencyJson.data : [];
        setCurrencies(
          rows
            .map((row) => ({
              id: row.id,
              code: row.code,
              name: row.name,
              symbol: row.symbol,
              is_base: Boolean(row.is_base),
            }))
            .filter((row) => row.id != null && row.code)
        );
        setFoodCategories(Array.isArray(foodJson?.data) ? foodJson.data : []);
        setBeverageCategories(Array.isArray(beverageJson?.data) ? beverageJson.data : []);
      } catch {
        if (!cancelled) {
          setCurrencies([]);
          setFoodCategories([]);
          setBeverageCategories([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        value: String(currency.id),
        label: `${currency.code} — ${currency.name}`,
      })),
    [currencies]
  );

  const foodCategoryOptions = useMemo(() => buildCategoryOptions(foodCategories), [foodCategories]);
  const beverageCategoryOptions = useMemo(
    () => buildCategoryOptions(beverageCategories),
    [beverageCategories]
  );

  const defaultCurrencyId = useMemo(() => {
    const base = currencies.find((currency) => currency.is_base);
    const fallback = currencies[0];
    return base?.id != null ? String(base.id) : fallback?.id != null ? String(fallback.id) : '';
  }, [currencies]);

  const patchMenuRow = useCallback(
    (row) => ({
      ...row,
      menu_scope: row.menu_scope || 'FOOD',
      currency_id: row.currency_id != null ? String(row.currency_id) : defaultCurrencyId,
      categories: Array.isArray(row.categories) && row.categories.length
        ? row.categories
        : [emptyCategoryLine(row.menu_scope || 'FOOD')],
    }),
    [defaultCurrencyId]
  );

  const crud = useApiCrud('menus', {
    initialFormData: emptyMenuForm,
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Menu name is required';
      if (!data.menu_scope) errors.menu_scope = 'Menu type is required';
      if (!data.currency_id) errors.currency_id = 'Please select a currency';
      if (data.selling_price === '' || Number(data.selling_price) < 0) {
        errors.selling_price = 'Selling price must be 0 or more';
      }
      if (!data.status_id) errors.status_id = 'Please select a status';
      Object.assign(errors, validateMenuCategories(data.categories, data.menu_scope || 'FOOD'));
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      menu_scope: data.menu_scope,
      currency_id: Number(data.currency_id),
      selling_price: Number(data.selling_price || 0),
      description: data.description?.trim() || null,
      status_id: Number(data.status_id),
    }),
    transformResponse: (data) => {
      if (Array.isArray(data)) return data.map(patchMenuRow);
      return patchMenuRow(data);
    },
    resourceName: 'Menu',
    itemsPerPage: 10,
  });

  const saveMenuRecipe = async (menuId, formData) => {
    const payload = buildRecipePayload(menuId, formData.categories, formData.menu_scope || 'FOOD');
    if (!payload.categories.length || !payload.ingredients.length) return;

    const response = await apiFetch(`${API_BASE_URL}/api/menu-recipes/${menuId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || 'Failed to save menu categories & items');
      if (errorData.errors) err.fieldErrors = errorData.errors;
      throw err;
    }
  };

  const handleAdd = useCallback(() => {
    crud.setIsEditing(false);
    crud.setEditingId(null);
    crud.setFormData({
      ...emptyMenuForm,
      currency_id: defaultCurrencyId,
      categories: [emptyCategoryLine('FOOD')],
    });
    crud.setErrors({});
    crud.setShowModal(true);
  }, [crud, defaultCurrencyId]);

  const handleEdit = useCallback(
    async (item) => {
      try {
        crud.setActionLoading(true);
        const [details, recipe] = await Promise.all([
          crud.api.fetchItemDetails(item.id),
          fetchMenuRecipe(item.id),
        ]);

        if (!details?.success || !details?.data) {
          throw new Error('Invalid response format');
        }

        const patched = patchMenuRow(details.data);
        const categories = patchRecipeCategories(recipe || {});
        crud.setFormData({
          ...patched,
          categories: categories.length
            ? categories
            : [emptyCategoryLine(patched.menu_scope || 'FOOD')],
        });
        crud.setEditingId(item.id);
        crud.setIsEditing(true);
        crud.setShowModal(true);
        crud.setErrors({});
      } catch {
        showErrorDialog('Failed to load menu details');
      } finally {
        crud.setActionLoading(false);
      }
    },
    [crud, patchMenuRow]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const errors = (() => {
        const next = {};
        const data = crud.formData;
        if (!data.name?.trim()) next.name = 'Menu name is required';
        if (!data.menu_scope) next.menu_scope = 'Menu type is required';
        if (!data.currency_id) next.currency_id = 'Please select a currency';
        if (data.selling_price === '' || Number(data.selling_price) < 0) {
          next.selling_price = 'Selling price must be 0 or more';
        }
        if (!data.status_id) next.status_id = 'Please select a status';
        Object.assign(next, validateMenuCategories(data.categories, data.menu_scope || 'FOOD'));
        return next;
      })();

      if (Object.keys(errors).length > 0) {
        crud.setErrors(errors);
        return;
      }

      try {
        crud.setActionLoading(true);

        if (crud.isEditing) {
          await crud.api.updateItem(crud.editingId, crud.formData);
          await saveMenuRecipe(crud.editingId, crud.formData);
          showSuccessToast('Menu updated successfully');
        } else {
          const created = await crud.api.createItem(crud.formData);
          const menuId = created?.data?.id;
          if (menuId) {
            await saveMenuRecipe(menuId, crud.formData);
          }
          showSuccessToast('Menu created successfully');
        }

        await crud.reload();
        crud.handleCloseModal();
      } catch (err) {
        if (err.fieldErrors) {
          const normalized = Object.fromEntries(
            Object.entries(err.fieldErrors).map(([key, value]) => [
              key,
              Array.isArray(value) ? value[0] : value,
            ])
          );
          crud.setErrors(normalized);
        } else {
          crud.setErrors({ submit: err.message });
          showErrorDialog(err.message);
        }
      } finally {
        crud.setActionLoading(false);
      }
    },
    [crud]
  );

  const menuCrud = useMemo(
    () => ({
      ...crud,
      handleAdd,
      handleEdit,
      handleSubmit,
    }),
    [crud, handleAdd, handleEdit, handleSubmit]
  );

  const handleExportPdf = async (row) => {
    if (!row?.id) return;

    setExportingId(row.id);
    try {
      await downloadMenuPdf(row.id, row.name);
    } catch (error) {
      showQuickError('Export failed', error?.message || 'Could not generate the menu PDF. Please try again.');
    } finally {
      setExportingId(null);
    }
  };

  const pageConfig = {
    icon: FiCoffee,
    title: 'Menu List',
    subtitle: 'Manage menu catalog, selling prices, and exports',
    addButtonLabel: 'Add Menu',
    searchPlaceholder: 'Search menus...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const tableColumns = useMemo(
    () => [
      {
        header: 'Menu',
        accessor: 'name',
        noWrap: true,
        render: (row) => {
          const darkMode = localStorage.getItem('darkMode') === 'true';
          return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
        },
      },
      { header: 'Code', accessor: 'code', noWrap: true },
      {
        header: 'Type',
        accessor: 'menu_scope',
        noWrap: true,
        render: (row) => scopeLabel(row.menu_scope),
      },
      {
        header: 'Categories',
        accessor: 'menu_categories_count',
        noWrap: true,
        render: (row) => row.menu_categories_count ?? 0,
      },
      {
        header: 'Menu Value',
        accessor: 'menu_value',
        noWrap: true,
        render: (row) => formatMoney(row.menu_value),
      },
      {
        header: 'Selling Price',
        accessor: 'selling_price',
        noWrap: true,
        render: (row) => formatSellingPrice(row),
      },
      { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
    ],
    []
  );

  const formTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Menu Details',
        icon: FiInfo,
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
          {
            name: 'menu_scope',
            label: 'Menu Type',
            type: 'select',
            required: true,
            options: MENU_SCOPE_OPTIONS,
          },
          {
            name: 'currency_id',
            label: 'Currency',
            type: 'select',
            required: true,
            options: currencyOptions,
          },
          { name: 'selling_price', label: 'Selling Price', type: 'number', min: 0, step: '0.01', required: true },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
          { name: 'status_id', label: 'Status', type: 'status_id', required: true },
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
                menuScope={formData.menu_scope || 'FOOD'}
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
    [currencyOptions, foodCategoryOptions, beverageCategoryOptions, foodCategories, beverageCategories]
  );

  const viewTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Menu Details',
        icon: FiInfo,
        fields: [
          { label: 'Name', accessor: 'name' },
          { label: 'Code', accessor: 'code' },
          {
            label: 'Menu Type',
            accessor: 'menu_scope',
            valueRender: (item) => scopeLabel(item.menu_scope),
          },
          {
            label: 'Currency',
            accessor: 'currency',
            valueRender: (item) =>
              (item.currency ? `${item.currency.code} — ${item.currency.name}` : '—'),
          },
          {
            label: 'Menu Value',
            accessor: 'menu_value',
            valueRender: (item) => formatMoney(item.menu_value),
          },
          {
            label: 'Selling Price',
            accessor: 'selling_price',
            valueRender: (item) => formatSellingPrice(item),
          },
          { label: 'Description', accessor: 'description', fullWidth: true },
          { label: 'Status', accessor: 'status.name', type: 'status' },
        ],
      },
      {
        id: 'categories',
        label: 'Categories & Items',
        icon: FiGrid,
        fields: [
          {
            label: 'Menu content',
            accessor: 'id',
            fullWidth: true,
            valueRender: (item) => (
              <MenuRecipePreview menuId={item.id} menuValue={item.menu_value} />
            ),
          },
        ],
      },
    ],
    []
  );

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formTabs={formTabs}
      viewTabs={viewTabs}
      modalTitle="Menu"
      modalMaxWidth="max-w-6xl"
      crud={menuCrud}
      extraActions={[
        {
          type: 'pdf',
          label: exportingId ? 'Exporting…' : 'Export PDF',
          icon: FiFileText,
          onClick: (row) => handleExportPdf(row),
          visible: (row) => (row.menu_categories_count ?? 0) > 0,
        },
      ]}
    />
  );
};

export default Menu;

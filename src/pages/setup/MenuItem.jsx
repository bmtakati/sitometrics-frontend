import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiInfo,
  FiList,
  FiPackage,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import MenuItemIngredientsEditor from '../../components/MenuItemIngredientsEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const emptyForm = {
  name: '',
  code: '',
  catalog_category_id: '',
  item_type: 'FOOD',
  description: '',
  status_id: '',
  ingredients: [],
};

const categoryNameOf = (row, catalogCategories = []) =>
  row?.catalog_category?.name
  || catalogCategories.find((c) => String(c.id) === String(row?.catalog_category_id))?.name
  || (row?.item_type === 'BEVERAGE' ? 'Beverage' : row?.item_type === 'FOOD' ? 'Food' : '—');

const normalizeIngredientLine = (line) => ({
  item_id: line.item_id != null ? String(line.item_id) : '',
  item_unit_id: line.item_unit_id != null ? String(line.item_unit_id) : '',
  unit_id: line.item_unit?.unit_id != null
    ? String(line.item_unit.unit_id)
    : line.itemUnit?.unit_id != null
      ? String(line.itemUnit.unit_id)
      : line.unit_id != null
        ? String(line.unit_id)
        : '',
  quantity: line.quantity ?? '',
  remarks: line.remarks || '',
});

const normalizeMenuItem = (row) => ({
  ...row,
  catalog_category_id: row?.catalog_category_id != null
    ? String(row.catalog_category_id)
    : row?.catalog_category?.id != null
      ? String(row.catalog_category.id)
      : '',
  item_type: row?.item_type || row?.catalog_category?.item_type || 'FOOD',
  ingredients: Array.isArray(row?.ingredients)
    ? row.ingredients.map(normalizeIngredientLine)
    : [],
});

const MenuItem = () => {
  const [storeItems, setStoreItems] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [unitMappings, setUnitMappings] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [itemsRes, categoriesRes, catalogRes, mappingsRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/items/all`),
          apiFetch(`${API_BASE_URL}/api/item-categories/all`),
          apiFetch(`${API_BASE_URL}/api/catalog-categories/all`),
          apiFetch(`${API_BASE_URL}/api/unit-mappings/all`),
        ]);
        const [itemsJson, categoriesJson, catalogJson, mappingsJson] = await Promise.all([
          itemsRes.json().catch(() => ({})),
          categoriesRes.json().catch(() => ({})),
          catalogRes.json().catch(() => ({})),
          mappingsRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        setStoreItems(Array.isArray(itemsJson?.data) ? itemsJson.data : []);
        setStoreCategories(Array.isArray(categoriesJson?.data) ? categoriesJson.data : []);
        setCatalogCategories(Array.isArray(catalogJson?.data) ? catalogJson.data : []);
        setUnitMappings(Array.isArray(mappingsJson?.data) ? mappingsJson.data : []);
      } catch {
        if (!cancelled) {
          setStoreItems([]);
          setStoreCategories([]);
          setCatalogCategories([]);
          setUnitMappings([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogCategoryOptions = useMemo(
    () =>
      catalogCategories
        .filter((row) => row.id != null && row.name)
        .map((row) => ({
          value: String(row.id),
          label: row.name,
        })),
    [catalogCategories]
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...catalogCategoryOptions,
    ],
    [catalogCategoryOptions]
  );

  const crud = useApiCrud('menu-items', {
    initialFormData: emptyForm,
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Item name is required';
      if (!data.code?.trim()) errors.code = 'Item code is required';
      if (!data.catalog_category_id) errors.catalog_category_id = 'Please select a category';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const validLines = (data.ingredients || []).filter(
        (line) => line.item_id && Number(line.quantity) > 0
      );
      if (!validLines.length) {
        errors.ingredients = 'Select at least one ingredient and enter a quantity greater than zero';
      }
      return errors;
    },
    transformFormData: (data) => {
      const catalog = catalogCategories.find(
        (row) => String(row.id) === String(data.catalog_category_id)
      );

      return {
        name: data.name?.trim(),
        code: data.code?.trim(),
        catalog_category_id: Number(data.catalog_category_id),
        item_type: catalog?.item_type || data.item_type || 'FOOD',
        description: data.description?.trim() || null,
        status_id: data.status_id ? Number(data.status_id) : null,
        ingredients: (data.ingredients || [])
          .filter((line) => line.item_id && Number(line.quantity) > 0)
          .map((line) => ({
            item_id: Number(line.item_id),
            item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
            unit_id: line.unit_id ? Number(line.unit_id) : null,
            quantity: Number(line.quantity || 0),
            remarks: line.remarks || null,
          })),
      };
    },
    transformResponse: (payload) =>
      (Array.isArray(payload) ? payload.map(normalizeMenuItem) : normalizeMenuItem(payload)),
    resourceName: 'Item',
    itemsPerPage: 10,
  });

  const handleCategoryFilter = useCallback(
    (value) => {
      const next = value || 'all';
      setCategoryFilter(next);
      crud.setExtraListParams(next === 'all' ? {} : { catalog_category_id: next });
      crud.handlePageChange(1);
    },
    [crud]
  );

  const pageConfig = {
    icon: FiList,
    title: 'Items',
    subtitle: 'Manage food and beverage items used when building menus',
    addButtonLabel: 'Add Item',
    searchPlaceholder: 'Search items...',
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
        header: 'Item',
        accessor: 'name',
        noWrap: true,
        render: (row) => {
          const darkMode = localStorage.getItem('darkMode') === 'true';
          return (
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              {row.name}
            </div>
          );
        },
      },
      { header: 'Code', accessor: 'code', noWrap: true },
      {
        header: 'Category',
        accessor: 'catalog_category',
        noWrap: true,
        render: (row) => categoryNameOf(row, catalogCategories),
      },
      {
        header: 'Ingredients',
        accessor: 'ingredients',
        noWrap: true,
        render: (row) => (Array.isArray(row.ingredients) ? row.ingredients.length : 0),
      },
      { header: 'Description', accessor: 'description', noWrap: false },
      { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
    ],
    [catalogCategories]
  );

  const tableConfig = {
    emptyState: {
      title: 'No Items Found',
      description: catalogCategoryOptions.length
        ? 'Get started by creating your first item.'
        : 'Create categories under Menus → Categories first, then add items.',
    },
  };

  const formTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Details',
        icon: FiInfo,
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true, fullWidth: false },
          { name: 'code', label: 'Code', type: 'text', required: true, fullWidth: false },
          {
            name: 'catalog_category_id',
            label: 'Category',
            type: 'select',
            required: true,
            fullWidth: false,
            options: catalogCategoryOptions,
            placeholder: catalogCategoryOptions.length ? 'Select category' : 'No categories available',
          },
          { name: 'status_id', label: 'Status', type: 'status_id', required: true, fullWidth: false },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            required: false,
            fullWidth: true,
          },
        ],
      },
      {
        id: 'ingredients',
        label: 'Ingredients',
        icon: FiPackage,
        fields: [
          {
            name: 'ingredients',
            type: 'custom',
            fullWidth: true,
            render: (formData, onInputChange, errors, darkMode) => (
              <MenuItemIngredientsEditor
                value={formData.ingredients}
                onChange={onInputChange}
                items={storeItems}
                categories={storeCategories}
                unitMappings={unitMappings}
                errors={errors}
                darkMode={darkMode}
              />
            ),
          },
        ],
      },
    ],
    [catalogCategoryOptions, storeItems, storeCategories, unitMappings]
  );

  const viewTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Details',
        icon: FiInfo,
        fields: [
          { label: 'Name', accessor: 'name' },
          { label: 'Code', accessor: 'code' },
          {
            label: 'Category',
            accessor: 'catalog_category',
            valueRender: (item) => categoryNameOf(item, catalogCategories),
          },
          { label: 'Description', accessor: 'description' },
          { label: 'Status', accessor: 'status', type: 'status' },
        ],
      },
      {
        id: 'ingredients',
        label: 'Ingredients',
        icon: FiPackage,
        fields: [
          {
            label: 'Ingredients',
            accessor: 'ingredients',
            fullWidth: true,
            valueRender: (item) => {
              const rows = Array.isArray(item.ingredients) ? item.ingredients : [];
              if (!rows.length) return '—';
              return (
                <ul className="space-y-2 text-sm">
                  {rows.map((line) => {
                    const storeItem = line.item;
                    const unit = line.item_unit?.unit || line.itemUnit?.unit;
                    return (
                      <li key={`${line.item_id}-${line.id || line.quantity}`}>
                        <span className="font-medium">{storeItem?.name || `Item #${line.item_id}`}</span>
                        {storeItem?.code ? ` (${storeItem.code})` : ''}
                        {' · '}
                        {formatNumber(line.quantity)}
                        {unit?.symbol ? ` ${unit.symbol}` : ''}
                        {line.remarks ? ` — ${line.remarks}` : ''}
                      </li>
                    );
                  })}
                </ul>
              );
            },
          },
        ],
      },
    ],
    [catalogCategories]
  );

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={[]}
      formTabs={formTabs}
      viewTabs={viewTabs}
      formFieldsLayout="two-col"
      modalTitle="Item"
      modalMaxWidth="max-w-7xl"
      crud={crud}
      extraFilters={[
        {
          options: categoryFilterOptions,
          value: categoryFilter,
          onChange: handleCategoryFilter,
        },
      ]}
    />
  );
};

export default MenuItem;

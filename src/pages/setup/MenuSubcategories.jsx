import React, { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiCoffee,
  FiDroplet,
  FiInfo,
  FiList,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PageTabs from '../../components/PageTabs';
import SubcategoryMenuItemsEditor from '../../components/SubcategoryMenuItemsEditor';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { crudPermissions, hasAnyPermission } from '../../utils/permissions';

const patchSubcategoryRow = (row) => ({
  ...row,
  menu_item_ids: Array.isArray(row?.menu_items)
    ? row.menu_items.map((item) => String(item.id))
    : Array.isArray(row?.menu_item_ids)
      ? row.menu_item_ids.map(String)
      : [],
});

const endpointForType = (itemType) =>
  String(itemType).toUpperCase() === 'BEVERAGE' ? 'beverage-categories' : 'food-categories';

const buildSubcategoryCrudConfig = (resourceName) => ({
  initialFormData: {
    name: '',
    description: '',
    status_id: '',
    menu_item_ids: [],
  },
  validateForm: (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Subcategory name is required';
    if (!data.status_id) errors.status_id = 'Please select a status';
    return errors;
  },
  transformFormData: (data) => ({
    name: data.name?.trim(),
    description: data.description?.trim() || null,
    status_id: Number(data.status_id),
    menu_item_ids: Array.isArray(data.menu_item_ids)
      ? data.menu_item_ids.map(Number).filter((id) => id > 0)
      : [],
  }),
  transformResponse: (data) => {
    if (Array.isArray(data)) return data.map(patchSubcategoryRow);
    if (data && typeof data === 'object') return patchSubcategoryRow(data);
    return data;
  },
  resourceName,
  itemsPerPage: 10,
});

const MenuSubcategories = () => {
  const { user } = useAuth();
  const canFood = hasAnyPermission(user, crudPermissions('food-categories'));
  const canBeverage = hasAnyPermission(user, crudPermissions('beverage-categories'));

  const [catalogCategories, setCatalogCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [catalogRes, itemsRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/catalog-categories/all`),
          apiFetch(`${API_BASE_URL}/api/menu-items/all`),
        ]);
        const [catalogJson, itemsJson] = await Promise.all([
          catalogRes.json().catch(() => ({})),
          itemsRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;

        const rows = (Array.isArray(catalogJson?.data) ? catalogJson.data : []).filter((row) => {
          if (row.item_type === 'BEVERAGE') return canBeverage;
          return canFood;
        });

        setCatalogCategories(rows);
        setMenuItems(Array.isArray(itemsJson?.data) ? itemsJson.data : []);
        setActiveTab((prev) => {
          if (prev && rows.some((row) => String(row.id) === String(prev))) return prev;
          return rows[0]?.id != null ? String(rows[0].id) : '';
        });
      } catch {
        if (!cancelled) {
          setCatalogCategories([]);
          setMenuItems([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFood, canBeverage]);

  const activeCategory = useMemo(
    () => catalogCategories.find((row) => String(row.id) === String(activeTab)) || null,
    [catalogCategories, activeTab]
  );

  const itemType = activeCategory?.item_type || 'FOOD';
  const endpoint = endpointForType(itemType);
  const categoryLabel = activeCategory?.name || (itemType === 'BEVERAGE' ? 'Beverage' : 'Food');

  const foodCrud = useApiCrud('food-categories', buildSubcategoryCrudConfig('Food Subcategory'));
  const beverageCrud = useApiCrud(
    'beverage-categories',
    buildSubcategoryCrudConfig('Beverage Subcategory')
  );
  const crud = itemType === 'BEVERAGE' ? beverageCrud : foodCrud;

  const tabs = useMemo(
    () =>
      catalogCategories.map((row) => ({
        id: String(row.id),
        label: row.name,
        icon: row.item_type === 'BEVERAGE' ? FiDroplet : FiCoffee,
      })),
    [catalogCategories]
  );

  const pageConfig = {
    icon: FiList,
    title: 'Sub-categories',
    subtitle: `Manage ${categoryLabel.toLowerCase()} subcategories and map items`,
    addButtonLabel: 'Add Subcategory',
    searchPlaceholder: 'Search subcategories...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const tableColumns = [
    {
      header: 'Subcategory',
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
      header: 'Items',
      accessor: 'menu_items_count',
      noWrap: true,
      render: (row) =>
        row.menu_items_count
        ?? (Array.isArray(row.menu_items) ? row.menu_items.length : 0)
        ?? (Array.isArray(row.menu_item_ids) ? row.menu_item_ids.length : 0),
    },
    { header: 'Description', accessor: 'description', noWrap: false },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Details',
      icon: FiInfo,
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true, fullWidth: false },
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
    ...(crud.isEditing
      ? [
          {
            id: 'menu-items',
            label: 'Items',
            icon: FiList,
            fields: [
              {
                name: 'menu_item_ids',
                type: 'custom',
                fullWidth: true,
                render: (formData, onInputChange, errors, darkMode) => (
                  <SubcategoryMenuItemsEditor
                    value={formData.menu_item_ids}
                    onChange={onInputChange}
                    menuItems={menuItems}
                    itemType={itemType}
                    errors={errors}
                    darkMode={darkMode}
                  />
                ),
              },
            ],
          },
        ]
      : []),
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Details',
      icon: FiInfo,
      fields: [
        { label: 'Name', accessor: 'name' },
        { label: 'Code', accessor: 'code' },
        { label: 'Description', accessor: 'description' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'menu-items',
      label: 'Items',
      icon: FiList,
      fields: [
        {
          label: 'Mapped items',
          accessor: 'menu_items',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.menu_items || [];
            if (!rows.length) return '—';
            return (
              <ul className="space-y-1 text-sm">
                {rows.map((row) => (
                  <li key={row.id}>
                    <span className="font-medium">{row.name}</span>
                    {row.code ? ` (${row.code})` : ''}
                  </li>
                ))}
              </ul>
            );
          },
        },
      ],
    },
  ];

  if (!canFood && !canBeverage) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-gray-500">
        You do not have permission to manage subcategories.
      </div>
    );
  }

  if (!tabs.length) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-gray-500">
        No categories found. Create Food or Beverage categories under Menus → Categories first.
      </div>
    );
  }

  return (
    <CRUDPage
      key={`${endpoint}-${activeTab}`}
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={{
        emptyState: {
          title: `No ${categoryLabel} Subcategories Found`,
          description: `Get started by creating a subcategory under ${categoryLabel}.`,
        },
      }}
      formFields={[]}
      formTabs={formTabs}
      viewTabs={viewTabs}
      formFieldsLayout="two-col"
      modalTitle={`${categoryLabel} Subcategory`}
      modalMaxWidth="max-w-5xl"
      belowStats={
        <PageTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Categories"
        />
      }
      crud={crud}
    />
  );
};

export default MenuSubcategories;

import React, { useEffect, useMemo, useState } from 'react';
import { FiCoffee, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiInfo, FiGrid, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import MenuRecipePreview from '../../components/MenuRecipePreview';
import { formatMoney } from '../../utils/formatMoney';
import { downloadMenuPdf } from '../../utils/menuRecipeApi';
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
};

const Menu = () => {
  const [exportingId, setExportingId] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/currencies/all`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
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
      } catch {
        if (!cancelled) setCurrencies([]);
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

  const defaultCurrencyId = useMemo(() => {
    const base = currencies.find((currency) => currency.is_base);
    const fallback = currencies[0];
    return base?.id != null ? String(base.id) : fallback?.id != null ? String(fallback.id) : '';
  }, [currencies]);

  const patchMenuRow = (row) => ({
    ...row,
    menu_scope: row.menu_scope || 'FOOD',
    currency_id: row.currency_id != null ? String(row.currency_id) : defaultCurrencyId,
  });

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

  const handleAdd = () => {
    crud.setIsEditing(false);
    crud.setFormData({
      ...emptyMenuForm,
      currency_id: defaultCurrencyId,
    });
    crud.setErrors({});
    crud.setShowModal(true);
  };

  const menuCrud = useMemo(
    () => ({
      ...crud,
      handleAdd,
    }),
    [crud, defaultCurrencyId]
  );

  const handleExportPdf = async (row) => {
    if (!row?.id) return;

    setExportingId(row.id);
    try {
      await downloadMenuPdf(row.id, row.name);
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
    icon: FiCoffee,
    title: 'Menus',
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
            name: 'menu_content_preview',
            type: 'custom',
            render: (formData) => (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Preview of categories and items for this menu, sorted by order number. To change items or prices, use
                  Menu Recipes.
                </p>
                <MenuRecipePreview menuId={formData.id} menuValue={formData.menu_value} />
              </div>
            ),
          },
        ],
      },
    ],
    [currencyOptions]
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
              item.currency ? `${item.currency.code} — ${item.currency.name}` : '—',
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
            valueRender: (item) => <MenuRecipePreview menuId={item.id} menuValue={item.menu_value} />,
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

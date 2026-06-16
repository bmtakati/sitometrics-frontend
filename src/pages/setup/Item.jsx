import React, { useEffect, useMemo, useState } from 'react';
import { FiBox, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const Item = () => {
  const [lookups, setLookups] = useState({ categories: [], units: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/item-categories/all`),
          apiFetch(`${API_BASE_URL}/api/units/all`)
        ]);

        const [catJson, unitJson] = await Promise.all([
          catRes.json().catch(() => ({})),
          unitRes.json().catch(() => ({}))
        ]);

        if (cancelled) return;

        const mapItems = (json) => {
          const rows = Array.isArray(json?.data) ? json.data : [];
          return rows
            .map((row) => ({ id: row.id, name: row.name, code: row.code, symbol: row.symbol }))
            .filter((row) => row.id != null && row.name);
        };

        setLookups({
          categories: mapItems(catJson),
          units: mapItems(unitJson)
        });
      } catch (_) {
        // optional lookup lists
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryById = useMemo(
    () => Object.fromEntries(lookups.categories.map((c) => [String(c.id), c])),
    [lookups.categories]
  );
  const unitById = useMemo(
    () => Object.fromEntries(lookups.units.map((u) => [String(u.id), u])),
    [lookups.units]
  );

  const crud = useApiCrud('items', {
    initialFormData: {
      name: '',
      description: '',
      item_category_id: '',
      unit_id: '',
      minimum_level: 0,
      reorder_level: 0,
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Item name is required';
      if (!data.item_category_id) errors.item_category_id = 'Item category is required';
      if (!data.unit_id) errors.unit_id = 'Unit is required';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const min = Number(data.minimum_level);
      const reorder = Number(data.reorder_level);
      if (Number.isNaN(min) || min < 0) errors.minimum_level = 'Minimum level must be 0 or more';
      if (Number.isNaN(reorder) || reorder < 0) errors.reorder_level = 'Reorder level must be 0 or more';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      description: data.description?.trim() || null,
      item_category_id: Number(data.item_category_id),
      unit_id: Number(data.unit_id),
      minimum_level: Number(data.minimum_level || 0),
      reorder_level: Number(data.reorder_level || 0),
      status_id: Number(data.status_id)
    }),
    resourceName: 'Item',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiBox,
    title: 'Items',
    subtitle: 'Manage inventory item master data',
    addButtonLabel: 'Add Item',
    searchPlaceholder: 'Search items...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' }
    ]
  };

  const tableColumns = [
    {
      header: 'Item',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Category',
      accessor: 'item_category_id',
      noWrap: true,
      render: (row) => row.category?.name || categoryById[String(row.item_category_id)]?.name || '—'
    },
    {
      header: 'Unit',
      accessor: 'unit_id',
      noWrap: true,
      render: (row) => row.unit?.symbol || unitById[String(row.unit_id)]?.symbol || '—'
    },
    { header: 'Min Level', accessor: 'minimum_level', noWrap: true },
    { header: 'Reorder Level', accessor: 'reorder_level', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Items Found',
      description: 'Get started by creating your first inventory item.'
    }
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
    {
      name: 'item_category_id',
      label: 'Item Category',
      type: 'select',
      required: true,
      options: lookups.categories.map((category) => ({
        value: String(category.id),
        label: category.name
      }))
    },
    {
      name: 'unit_id',
      label: 'Unit',
      type: 'select',
      required: true,
      options: lookups.units.map((unit) => ({
        value: String(unit.id),
        label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`
      }))
    },
    { name: 'minimum_level', label: 'Minimum Level', type: 'number', min: 0, step: '0.001', required: true },
    { name: 'reorder_level', label: 'Reorder Level', type: 'number', min: 0, step: '0.001', required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Item"
      crud={crud}
    />
  );
};

export default Item;

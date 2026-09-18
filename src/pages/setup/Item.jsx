import React, { useEffect, useMemo, useState } from 'react';
import { FiBox, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiPlus, FiX } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import FormModal from '../../components/FormModal/FormModal';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { hasAnyPermission, hasPermission } from '../../utils/permissions';
import { showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';

const unitCode = (unit) => unit?.symbol || unit?.name || '';

const emptyUnitForm = { name: '', symbol: '', status_id: '' };
const emptyItemUnit = {
  unit_id: '',
  conversion_factor: 1,
  is_purchase_unit: true,
  is_issue_unit: true,
  is_default_purchase: false,
  is_default_issue: false,
  is_active: true,
};

const Item = () => {
  const { user } = useAuth();
  const canManageUnits = hasAnyPermission(user, ['add-units', 'edit-units']);
  const [lookups, setLookups] = useState({ categories: [], units: [] });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);
  const [unitErrors, setUnitErrors] = useState({});
  const [unitSaving, setUnitSaving] = useState(false);

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

  const openUnitModal = () => {
    setUnitForm(emptyUnitForm);
    setUnitErrors({});
    setShowUnitModal(true);
  };

  const handleUnitInputChange = (event) => {
    const { name, value } = event.target;
    setUnitForm((prev) => ({ ...prev, [name]: value }));
    setUnitErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const saveUnit = async (event) => {
    event?.preventDefault?.();
    const errors = {};
    if (!unitForm.name?.trim()) errors.name = 'Unit name is required';
    if (!unitForm.symbol?.trim()) errors.symbol = 'Unit code is required';
    if (!unitForm.status_id) errors.status_id = 'Please select a status';
    if (Object.keys(errors).length) {
      setUnitErrors(errors);
      return;
    }

    setUnitSaving(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: unitForm.name.trim(),
          symbol: unitForm.symbol.trim(),
          status_id: Number(unitForm.status_id),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = json?.message || json?.errors?.name?.[0] || json?.errors?.symbol?.[0] || 'Could not create unit';
        showErrorDialog(message);
        return;
      }

      const created = json?.data || {};
      const unit = {
        id: created.id,
        name: created.name,
        symbol: created.symbol,
      };
      if (unit.id != null) {
        setLookups((prev) => ({
          ...prev,
          units: [...prev.units.filter((row) => String(row.id) !== String(unit.id)), unit],
        }));
        crud.setFormData((prev) => ({ ...prev, unit_id: String(unit.id) }));
      }
      showSuccessToast('Unit created');
      setShowUnitModal(false);
    } catch (_) {
      showErrorDialog('Could not create unit');
    } finally {
      setUnitSaving(false);
    }
  };

  const categoryById = useMemo(
    () => Object.fromEntries(lookups.categories.map((c) => [String(c.id), c])),
    [lookups.categories]
  );
  const unitById = useMemo(
    () => Object.fromEntries(lookups.units.map((u) => [String(u.id), u])),
    [lookups.units]
  );

  const normalizeItemUnits = (itemUnits, baseUnitId) => {
    const rows = Array.isArray(itemUnits) ? itemUnits : [];
    const normalized = rows.map((row) => ({
      unit_id: row.unit_id != null ? String(row.unit_id) : '',
      conversion_factor: String(row.conversion_factor ?? 1),
      is_purchase_unit: Boolean(row.is_purchase_unit ?? true),
      is_issue_unit: Boolean(row.is_issue_unit ?? true),
      is_default_purchase: Boolean(row.is_default_purchase),
      is_default_issue: Boolean(row.is_default_issue),
      is_active: Boolean(row.is_active ?? true),
    }));

    if (baseUnitId && !normalized.some((row) => String(row.unit_id) === String(baseUnitId))) {
      normalized.unshift({ ...emptyItemUnit, unit_id: String(baseUnitId), conversion_factor: '1', is_default_purchase: true, is_default_issue: true });
    }

    return normalized.length ? normalized : [{ ...emptyItemUnit, unit_id: baseUnitId ? String(baseUnitId) : '', conversion_factor: '1', is_default_purchase: true, is_default_issue: true }];
  };

  const setItemUnits = (updater) => {
    crud.setFormData((prev) => {
      const current = normalizeItemUnits(prev.item_units, prev.base_unit_id || prev.unit_id);
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, item_units: next };
    });
  };

  const renderAvailableUnits = (formData, _onInputChange, errors, darkMode) => {
    const baseUnitId = formData.base_unit_id || formData.unit_id;
    const rows = normalizeItemUnits(formData.item_units, baseUnitId);
    const inputClass = `w-full h-10 px-3 border rounded-md ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

    const patchRow = (index, patch) => {
      setItemUnits((current) => current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, ...patch };
        if (String(next.unit_id) === String(baseUnitId)) next.conversion_factor = '1';
        return next;
      }));
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Available Units</label>
          <button
            type="button"
            onClick={() => setItemUnits((current) => [...current, { ...emptyItemUnit }])}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white"
          >
            <FiPlus /> Add
          </button>
        </div>
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className={darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}>
              <tr>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Conversion</th>
                <th className="px-3 py-2 text-center">Purchase</th>
                <th className="px-3 py-2 text-center">Issue</th>
                <th className="px-3 py-2 text-center">Default Purchase</th>
                <th className="px-3 py-2 text-center">Default Issue</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {rows.map((row, index) => {
                const isBase = String(row.unit_id) === String(baseUnitId);
                return (
                  <tr key={`${row.unit_id || 'new'}-${index}`}>
                    <td className="px-3 py-2 min-w-48">
                      <select className={inputClass} value={row.unit_id} onChange={(event) => patchRow(index, { unit_id: event.target.value })}>
                        <option value="">Select unit</option>
                        {lookups.units.map((unit) => <option key={unit.id} value={String(unit.id)}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 w-36">
                      <input className={inputClass} type="number" min="0.000001" step="0.000001" value={isBase ? '1' : row.conversion_factor} disabled={isBase} onChange={(event) => patchRow(index, { conversion_factor: event.target.value })} />
                    </td>
                    {['is_purchase_unit', 'is_issue_unit', 'is_default_purchase', 'is_default_issue'].map((key) => (
                      <td key={key} className="px-3 py-2 text-center">
                        <input
                          type={key.startsWith('is_default') ? 'radio' : 'checkbox'}
                          name={key}
                          checked={Boolean(row[key])}
                          onChange={(event) => {
                            if (key.startsWith('is_default')) {
                              setItemUnits((current) => current.map((candidate, rowIndex) => ({ ...candidate, [key]: rowIndex === index })));
                            } else {
                              patchRow(index, { [key]: event.target.checked });
                            }
                          }}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <button type="button" disabled={isBase} onClick={() => setItemUnits((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 disabled:opacity-40">
                        <FiX />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {errors.item_units ? <p className="text-sm text-red-600">{errors.item_units}</p> : null}
      </div>
    );
  };

  const crud = useApiCrud('items', {
    initialFormData: {
      name: '',
      description: '',
      item_category_id: '',
      unit_id: '',
      base_unit_id: '',
      item_units: [],
      minimum_level: 0,
      reorder_level: 0,
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Item name is required';
      if (!data.item_category_id) errors.item_category_id = 'Item category is required';
      if (!data.unit_id) errors.unit_id = 'Unit is required';
      const unitRows = normalizeItemUnits(data.item_units, data.base_unit_id || data.unit_id);
      if (unitRows.some((row) => !row.unit_id || Number(row.conversion_factor) <= 0)) {
        errors.item_units = 'Each available unit needs a unit and conversion greater than 0';
      }
      if (unitRows.filter((row) => row.is_default_purchase).length > 1) errors.item_units = 'Only one default purchase unit is allowed';
      if (unitRows.filter((row) => row.is_default_issue).length > 1) errors.item_units = 'Only one default issue unit is allowed';
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
      base_unit_id: Number(data.base_unit_id || data.unit_id),
      item_units: normalizeItemUnits(data.item_units, data.base_unit_id || data.unit_id).map((row) => ({
        unit_id: Number(row.unit_id),
        conversion_factor: Number(row.conversion_factor || 1),
        is_purchase_unit: Boolean(row.is_purchase_unit),
        is_issue_unit: Boolean(row.is_issue_unit),
        is_default_purchase: Boolean(row.is_default_purchase),
        is_default_issue: Boolean(row.is_default_issue),
        is_active: row.is_active !== false,
      })),
      minimum_level: Number(data.minimum_level || 0),
      reorder_level: Number(data.reorder_level || 0),
      status_id: Number(data.status_id)
    }),
    transformResponse: (data) => {
      const patch = (row) => ({
        ...row,
        unit_id: row.unit_id != null ? String(row.unit_id) : '',
        base_unit_id: row.base_unit_id != null ? String(row.base_unit_id) : (row.unit_id != null ? String(row.unit_id) : ''),
        item_units: normalizeItemUnits(row.item_units, row.base_unit_id || row.unit_id),
      });
      if (Array.isArray(data)) return data.map(patch);
      return patch(data);
    },
    resourceName: 'Store Item',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiBox,
    title: 'Store Items',
    subtitle: 'Manage inventory item master data',
    addButtonLabel: 'Add Store Item',
    searchPlaceholder: 'Search store items...'
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
    },
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
      render: (row) => unitCode(row.unit || unitById[String(row.unit_id)]) || '—'
    },
    { header: 'Min Level', accessor: 'minimum_level', noWrap: true },
    { header: 'Reorder Level', accessor: 'reorder_level', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Store Items Found',
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
      label: 'Base Unit',
      type: 'select',
      required: true,
      options: lookups.units.map((unit) => ({
        value: String(unit.id),
        label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`
      })),
      createOption: canManageUnits
        ? { label: 'Add new unit', onClick: openUnitModal }
        : null,
    },
    { name: 'item_units', label: 'Available Units', type: 'custom', fullWidth: true, render: renderAvailableUnits },
    { name: 'minimum_level', label: 'Minimum level', type: 'number', min: 0, step: '0.001', required: true },
    { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0, step: '0.001', required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  const categoryFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...lookups.categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [lookups.categories]
  );

  const handleCategoryFilter = (value) => {
    const next = value || 'all';
    setCategoryFilter(next);
    crud.setExtraListParams(next === 'all' ? {} : { item_category_id: next });
    crud.handlePageChange(1);
  };

  return (
    <>
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Item"
      crud={crud}
      extraFilters={[
        {
          options: categoryFilterOptions,
          value: categoryFilter,
          onChange: handleCategoryFilter,
        },
      ]}
    />
    <FormModal
      isOpen={showUnitModal}
      onClose={() => setShowUnitModal(false)}
      title="Unit"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
        { name: 'symbol', label: 'Code', type: 'text', required: true },
        { name: 'status_id', label: 'Status', type: 'status_id', required: true },
      ]}
      formData={unitForm}
      onInputChange={handleUnitInputChange}
      onSubmit={saveUnit}
      errors={unitErrors}
      isLoading={unitSaving}
      isEditing={false}
      submitLabel="Save unit"
      maxWidth="max-w-md"
      fieldsLayout="stack"
      overlayClassName="z-[60]"
    />
    </>
  );
};

export default Item;

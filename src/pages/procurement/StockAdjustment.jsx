import React, { useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiMinus,
  FiPlus,
  FiSliders,
  FiTrendingUp,
  FiTrash2,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import SearchableSelect from '../../components/SearchableSelect';
import apiFetch from '../../utils/apiFetch';
import { API_BASE_URL } from '../../context/AuthContext';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
];

const ADJUSTMENT_TYPES = [
  { value: 'DAMAGED', label: 'Damaged', direction: 'OUT' },
  { value: 'LOST', label: 'Lost', direction: 'OUT' },
  { value: 'EXPIRED', label: 'Expired', direction: 'OUT' },
  { value: 'FOUND', label: 'Found', direction: 'IN' },
  { value: 'VARIANCE', label: 'Variance', direction: 'IN/OUT' },
];

const emptyLine = () => ({
  item_id: '',
  item_unit_id: '',
  adjustment_type: 'DAMAGED',
  quantity: '',
  unit_cost: '',
  remarks: '',
});

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const lineBaseQuantity = (line, items) => {
  const item = items.find((candidate) => String(candidate.id) === String(line.item_id));
  const itemUnit = item?.item_units?.find((unit) => String(unit.id) === String(line.item_unit_id))
    || item?.itemUnits?.find((unit) => String(unit.id) === String(line.item_unit_id));
  const factor = Number(itemUnit?.conversion_factor || 1);
  const quantity = Math.abs(Number(line.quantity || 0));
  return quantity * factor;
};

const unitOptionsForItem = (items, itemId) => {
  const item = items.find((candidate) => String(candidate.id) === String(itemId));
  const units = item?.item_units || item?.itemUnits || [];
  const options = units.map((itemUnit) => ({
    value: String(itemUnit.id),
    label: `${itemUnit.unit?.name || itemUnit.unit?.symbol || 'Unit'} (${formatNumber(itemUnit.conversion_factor || 1)} ${item.base_unit?.symbol || item.baseUnit?.symbol || item.unit?.symbol || 'base'})`,
  }));

  return options.length ? options : [{ value: '', label: 'Default unit' }];
};

const AdjustmentItemsEditor = ({ value = [], onChange, items, darkMode, error }) => {
  const itemOptions = useMemo(() => [
    { value: '', label: 'Select item' },
    ...items.map((item) => ({ value: String(item.id), label: item.code ? `${item.name} (${item.code})` : item.name })),
  ], [items]);

  const typeOptions = ADJUSTMENT_TYPES.map((type) => ({ value: type.value, label: type.label }));

  const rows = value.length ? value : [emptyLine()];

  const updateLine = (index, field, nextValue) => {
    const next = rows.map((line, lineIndex) => {
      if (lineIndex !== index) return line;

      const updated = { ...line, [field]: nextValue };
      if (field === 'item_id') {
        const units = unitOptionsForItem(items, nextValue);
        updated.item_unit_id = units[0]?.value || '';
      }
      return updated;
    });
    onChange(next);
  };

  const addLine = () => onChange([...rows, emptyLine()]);
  const removeLine = (index) => onChange(rows.filter((_, lineIndex) => lineIndex !== index));

  const inputClass = `h-9 rounded-md border px-2 text-sm outline-none focus:border-primary-500 ${
    darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Adjustment Items</p>
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <FiPlus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className="min-w-[980px] w-full text-sm">
          <thead className={darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item</th>
              <th className="px-3 py-2 text-left font-semibold">Unit</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Quantity</th>
              <th className="px-3 py-2 text-left font-semibold">Base Qty</th>
              <th className="px-3 py-2 text-left font-semibold">Unit Cost</th>
              <th className="px-3 py-2 text-left font-semibold">Remarks</th>
              <th className="px-3 py-2 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
            {rows.map((line, index) => {
              const baseQty = lineBaseQuantity(line, items);
              return (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={itemOptions}
                      value={line.item_id}
                      onChange={(next) => updateLine(index, 'item_id', next)}
                      placeholder="Select item"
                      darkMode={darkMode}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={unitOptionsForItem(items, line.item_id)}
                      value={line.item_unit_id}
                      onChange={(next) => updateLine(index, 'item_unit_id', next)}
                      placeholder="Unit"
                      darkMode={darkMode}
                      disabled={!line.item_id}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={typeOptions}
                      value={line.adjustment_type}
                      onChange={(next) => updateLine(index, 'adjustment_type', next)}
                      placeholder="Type"
                      darkMode={darkMode}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.001"
                      value={line.quantity}
                      onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(baseQty)}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={line.unit_cost}
                      onChange={(event) => updateLine(index, 'unit_cost', event.target.value)}
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={line.remarks}
                      onChange={(event) => updateLine(index, 'remarks', event.target.value)}
                      className={`${inputClass} w-44`}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={rows.length === 1}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                        rows.length === 1
                          ? 'cursor-not-allowed opacity-40'
                          : darkMode ? 'text-red-300 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockAdjustment = () => {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storeRes, itemRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/stores/all`),
          apiFetch(`${API_BASE_URL}/api/items/all`),
        ]);
        const [storeJson, itemJson] = await Promise.all([
          storeRes.json().catch(() => ({})),
          itemRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        setStores(Array.isArray(storeJson?.data) ? storeJson.data : []);
        setItems(Array.isArray(itemJson?.data) ? itemJson.data : []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setItems([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const storeOptions = useMemo(() => [
    { value: '', label: 'Select store' },
    ...stores.map((store) => ({ value: String(store.id), label: store.code ? `${store.name} (${store.code})` : store.name })),
  ], [stores]);

  const crud = useApiCrud('stock-adjustments', {
    initialFormData: {
      store_id: '',
      adjustment_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      adjustment_items: [emptyLine()],
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.store_id) errors.store_id = 'Store is required';
      if (!data.adjustment_date) errors.adjustment_date = 'Adjustment date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      const lines = Array.isArray(data.adjustment_items) ? data.adjustment_items : [];
      if (!lines.length) {
        errors.adjustment_items = 'Add at least one adjustment item';
      } else if (lines.some((line) => !line.item_id || !line.adjustment_type || Number(line.quantity || 0) === 0)) {
        errors.adjustment_items = 'Each line needs an item, type, and non-zero quantity';
      }
      return errors;
    },
    transformFormData: (data) => ({
      store_id: Number(data.store_id),
      adjustment_date: data.adjustment_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (data.adjustment_items || []).map((line) => ({
        item_id: Number(line.item_id),
        item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
        adjustment_type: line.adjustment_type,
        quantity: Number(line.quantity || 0),
        unit_cost: Number(line.unit_cost || 0),
        remarks: line.remarks || null,
      })),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        store_id: row?.store_id != null ? String(row.store_id) : '',
        adjustment_items: Array.isArray(row?.items)
          ? row.items.map((line) => ({
              item_id: line.item_id != null ? String(line.item_id) : '',
              item_unit_id: line.item_unit_id != null ? String(line.item_unit_id) : '',
              adjustment_type: line.adjustment_type || 'DAMAGED',
              quantity: line.quantity ?? '',
              unit_cost: line.unit_cost ?? '',
              remarks: line.remarks || '',
            }))
          : [emptyLine()],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Stock Adjustment',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiSliders,
    title: 'Stock Adjustments',
    subtitle: 'Adjust stock for damaged, lost, expired, found, and variance',
    addButtonLabel: 'Add Adjustment',
    searchPlaceholder: 'Search stock adjustments...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Store', accessor: 'store', noWrap: true, render: (row) => row.store?.code ? `${row.store.name} (${row.store.code})` : (row.store?.name || row.store_id) },
    { header: 'Date', accessor: 'adjustment_date', noWrap: true, render: (row) => row.adjustment_date ? new Date(row.adjustment_date).toLocaleDateString() : '-' },
    {
      header: 'Items',
      accessor: 'items',
      render: (row) => `${Array.isArray(row.items) ? row.items.length : 0} line(s)`,
    },
    {
      header: 'Net Base Qty',
      accessor: 'base_quantity',
      noWrap: true,
      render: (row) => {
        const total = (row.items || []).reduce((sum, line) => {
          const type = ADJUSTMENT_TYPES.find((candidate) => candidate.value === line.adjustment_type);
          const qty = Number(line.base_quantity || Math.abs(line.quantity || 0));
          const sign = type?.direction === 'OUT' || (line.adjustment_type === 'VARIANCE' && Number(line.quantity) < 0) ? -1 : 1;
          return sum + (qty * sign);
        }, 0);
        return (
          <span className={`inline-flex items-center gap-1 font-semibold ${total < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {total < 0 ? <FiMinus className="h-3.5 w-3.5" /> : <FiPlus className="h-3.5 w-3.5" />}
            {formatNumber(Math.abs(total))}
          </span>
        );
      },
    },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'store_id', label: 'Store', type: 'searchable_select', required: true, options: storeOptions },
    { name: 'adjustment_date', label: 'Adjustment Date', type: 'date', required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
    { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false, fullWidth: true },
    {
      name: 'adjustment_items',
      label: 'Adjustment Items',
      type: 'custom',
      fullWidth: true,
      render: (formData, onInputChange, errors, darkMode) => (
        <AdjustmentItemsEditor
          value={formData.adjustment_items}
          onChange={(value) => onInputChange({ target: { name: 'adjustment_items', value } })}
          items={items}
          darkMode={darkMode}
          error={errors.adjustment_items}
        />
      ),
    },
  ];

  const viewTabs = [
    {
      label: 'Details',
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Store', accessor: 'store.name' },
        { label: 'Date', accessor: 'adjustment_date' },
        { label: 'Workflow', accessor: 'workflow_status' },
        { label: 'Remarks', accessor: 'remarks' },
      ],
    },
    {
      label: 'Items',
      fields: [
        {
          label: 'Lines',
          accessor: 'items',
          fullWidth: true,
          valueRender: (item) => (
            <div className="space-y-2">
              {(item.items || []).map((line) => (
                <div key={line.id || `${line.item_id}-${line.adjustment_type}`} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <div className="font-medium">{line.item?.name || `Item #${line.item_id}`}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {line.adjustment_type} · {formatNumber(line.quantity)} {line.item_unit?.unit?.symbol || line.itemUnit?.unit?.symbol || ''} · Base {formatNumber(line.base_quantity)}
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      viewTabs={viewTabs}
      modalTitle="Stock Adjustment"
      modalMaxWidth="max-w-7xl"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default StockAdjustment;

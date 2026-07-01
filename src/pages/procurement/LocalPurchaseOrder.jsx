import React, { useEffect, useMemo, useState } from 'react';
import { FiFileText, FiTrendingUp, FiCheckCircle, FiTruck, FiCheck, FiPackage, FiInfo } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import LpoItemsEditor from '../../components/LpoItemsEditor';
import SearchableSelect from '../../components/SearchableSelect';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDate } from '../../utils/formatDate';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIALLY_DELIVERED', label: 'Partially Delivered' },
  { value: 'FULLY_DELIVERED', label: 'Fully Delivered' },
  { value: 'CLOSED', label: 'Closed' },
];

const emptyLine = () => ({ item_id: '', quantity: '', unit_price: '' });

const buildSupplierCatalog = (supplier) => {
  const itemOptions = [];
  const priceByItemId = {};

  for (const line of supplier?.supplier_items || []) {
    const item = line.item;
    if (!item?.id) continue;
    const id = String(item.id);
    itemOptions.push({
      value: id,
      label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
    });
    priceByItemId[id] = line.agreed_price;
  }

  return { itemOptions, priceByItemId };
};

const remapLinesForSupplier = (lines, priceByItemId) => {
  const source = Array.isArray(lines) && lines.length ? lines : [emptyLine()];

  return source.map((line) => {
    const id = line.item_id ? String(line.item_id) : '';
    if (id && priceByItemId[id] != null) {
      return {
        item_id: id,
        quantity: line.quantity ?? '',
        unit_price: priceByItemId[id],
      };
    }
    return emptyLine();
  });
};

const formatMoney = (value) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LocalPurchaseOrder = () => {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/suppliers/all`);
        const payload = await res.json();
        setSuppliers(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setSuppliers([]);
      }
    };
    loadSuppliers();
  }, []);

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        value: String(supplier.id),
        label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`,
      })),
    [suppliers]
  );

  const crud = useApiCrud('local-purchase-orders', {
    initialFormData: {
      supplier_id: '',
      purchase_requisition_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: '',
      tax_amount: 0,
      discount_amount: 0,
      workflow_status: 'DRAFT',
      remarks: '',
      lpo_items: [emptyLine()],
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.supplier_id) errors.supplier_id = 'Supplier is required';
      if (!data.order_date) errors.order_date = 'Order date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const supplier = suppliers.find((row) => String(row.id) === String(data.supplier_id));
      const { priceByItemId } = buildSupplierCatalog(supplier);

      const validLines = (data.lpo_items || []).filter(
        (line) =>
          line.item_id &&
          priceByItemId[String(line.item_id)] != null &&
          Number(line.quantity) > 0
      );

      if (validLines.length === 0) {
        errors.lpo_items = 'Add at least one line with item and quantity';
      }

      const itemIds = validLines.map((line) => String(line.item_id));
      if (new Set(itemIds).size !== itemIds.length) {
        errors.lpo_items = 'Each item can only appear once on the order';
      }

      return errors;
    },
    transformFormData: (data) => {
      const supplier = suppliers.find((row) => String(row.id) === String(data.supplier_id));
      const { priceByItemId } = buildSupplierCatalog(supplier);

      const items = (data.lpo_items || [])
        .filter(
          (line) =>
            line.item_id &&
            priceByItemId[String(line.item_id)] != null &&
            Number(line.quantity) > 0
        )
        .map((line) => ({
          item_id: Number(line.item_id),
          quantity: Number(line.quantity),
          unit_price: Number(priceByItemId[String(line.item_id)]),
          tax_amount: 0,
          discount_amount: 0,
        }));

      return {
        supplier_id: Number(data.supplier_id),
        purchase_requisition_id: data.purchase_requisition_id ? Number(data.purchase_requisition_id) : null,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date || null,
        tax_amount: Number(data.tax_amount || 0),
        discount_amount: Number(data.discount_amount || 0),
        workflow_status: data.workflow_status,
        remarks: data.remarks || null,
        status_id: Number(data.status_id),
        items,
      };
    },
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        supplier_id: row.supplier_id ? String(row.supplier_id) : '',
        lpo_items: Array.isArray(row?.items)
          ? row.items.map((line) => ({
              item_id: String(line.item_id),
              quantity: line.quantity,
              unit_price: line.unit_price,
            }))
          : [emptyLine()],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Local Purchase Order',
    itemsPerPage: 10,
  });

  const selectedSupplier = useMemo(
    () => suppliers.find((row) => String(row.id) === String(crud.formData?.supplier_id)),
    [suppliers, crud.formData?.supplier_id]
  );

  const { itemOptions, priceByItemId } = useMemo(
    () => buildSupplierCatalog(selectedSupplier),
    [selectedSupplier]
  );

  const handleSupplierChange = (supplierId, onInputChange, currentLines) => {
    const supplier = suppliers.find((row) => String(row.id) === String(supplierId));
    const catalog = buildSupplierCatalog(supplier);

    onInputChange({ target: { name: 'supplier_id', value: supplierId } });
    onInputChange({
      target: {
        name: 'lpo_items',
        value: remapLinesForSupplier(currentLines, catalog.priceByItemId),
      },
    });
  };

  const pageConfig = {
    icon: FiFileText,
    title: 'Local Purchase Orders',
    subtitle: 'Manage LPO workflow — line prices follow supplier contracts',
    addButtonLabel: 'Add LPO',
    searchPlaceholder: 'Search LPOs...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'sent', label: 'Sent', icon: FiTruck, iconColor: 'indigo-600' },
      { key: 'closed', label: 'Closed', icon: FiCheck, iconColor: 'emerald-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Supplier',
      accessor: 'supplier.name',
      noWrap: true,
      render: (row) => row.supplier?.name || row.supplier_id || '—',
    },
    { header: 'Order Date', accessor: 'order_date', type: 'date', noWrap: true },
    {
      header: 'Lines',
      accessor: 'items',
      noWrap: true,
      render: (row) => (Array.isArray(row.items) ? row.items.length : 0),
    },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Order Details',
      icon: FiInfo,
      fields: [
        {
          name: 'supplier_id',
          type: 'custom',
          render: (formData, onInputChange, errors, darkMode) => (
            <div>
              <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Supplier *
              </label>
              <SearchableSelect
                options={supplierOptions}
                value={formData.supplier_id ? String(formData.supplier_id) : ''}
                onChange={(val) => handleSupplierChange(val, onInputChange, formData.lpo_items)}
                placeholder="Select supplier…"
                darkMode={darkMode}
                invalid={Boolean(errors.supplier_id)}
              />
              {errors.supplier_id ? <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p> : null}
            </div>
          ),
        },
        { name: 'purchase_requisition_id', label: 'Purchase Requisition ID', type: 'number', required: false },
        { name: 'order_date', label: 'Order Date', type: 'date', required: true },
        { name: 'expected_delivery_date', label: 'Expected Delivery Date', type: 'date', required: false },
        { name: 'tax_amount', label: 'Tax Amount', type: 'number', min: 0, step: '0.01', required: false },
        { name: 'discount_amount', label: 'Discount Amount', type: 'number', min: 0, step: '0.01', required: false },
        { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
        { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
        { name: 'status_id', label: 'Status', type: 'status_id', required: true },
      ],
    },
    {
      id: 'lines',
      label: 'Line Items',
      icon: FiPackage,
      fields: [
        {
          name: 'lpo_items',
          type: 'custom',
          render: (formData, onInputChange, errors, darkMode) => (
            <LpoItemsEditor
              value={formData.lpo_items}
              onChange={onInputChange}
              itemOptions={itemOptions}
              priceByItemId={priceByItemId}
              supplierSelected={Boolean(formData.supplier_id)}
              errors={errors}
              darkMode={darkMode}
            />
          ),
        },
      ],
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Order Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Supplier', accessor: 'supplier.name', valueRender: (item) => item.supplier?.name || item.supplier_id || '—' },
        { label: 'Order Date', accessor: 'order_date', type: 'date' },
        { label: 'Expected Delivery', accessor: 'expected_delivery_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status' },
        { label: 'Tax Amount', accessor: 'tax_amount', valueRender: (item) => formatMoney(item.tax_amount || 0) },
        { label: 'Discount', accessor: 'discount_amount', valueRender: (item) => formatMoney(item.discount_amount || 0) },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'lines',
      label: 'Line Items',
      icon: FiPackage,
      fields: [
        {
          label: 'Order lines',
          accessor: 'items',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.items || [];
            if (!rows.length) return '—';
            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit price</th>
                      <th className="px-3 py-2">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2">{line.item?.code || '—'}</td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2">{formatMoney(line.unit_price || 0)}</td>
                        <td className="px-3 py-2 font-medium">
                          {formatMoney(Number(line.quantity || 0) * Number(line.unit_price || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          },
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
      modalTitle="Local Purchase Order"
      modalMaxWidth="max-w-4xl"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
        { label: 'Workflow: Sent', value: 'workflow:SENT' },
        { label: 'Workflow: Partially Delivered', value: 'workflow:PARTIALLY_DELIVERED' },
        { label: 'Workflow: Fully Delivered', value: 'workflow:FULLY_DELIVERED' },
        { label: 'Workflow: Closed', value: 'workflow:CLOSED' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default LocalPurchaseOrder;

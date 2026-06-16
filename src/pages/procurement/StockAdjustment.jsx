import React from 'react';
import { FiSliders, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' }
];

const ADJUSTMENT_TYPES = [
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'LOST', label: 'Lost' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'FOUND', label: 'Found' },
  { value: 'VARIANCE', label: 'Variance' }
];

const StockAdjustment = () => {
  const crud = useApiCrud('stock-adjustments', {
    initialFormData: {
      store_id: '',
      adjustment_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      items_json: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.store_id) errors.store_id = 'Store ID is required';
      if (!data.adjustment_date) errors.adjustment_date = 'Adjustment date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      store_id: Number(data.store_id),
      adjustment_date: data.adjustment_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                item_id: Number(line.item_id),
                adjustment_type: line.adjustment_type,
                quantity: Number(line.quantity || 0),
                unit_cost: Number(line.unit_cost || 0),
                remarks: line.remarks || null,
              }))
            : [];
        } catch (_) {
          return [];
        }
      })(),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        items_json: Array.isArray(row?.items)
          ? JSON.stringify(
              row.items.map((line) => ({
                item_id: line.item_id,
                adjustment_type: line.adjustment_type,
                quantity: line.quantity,
                unit_cost: line.unit_cost,
                remarks: line.remarks || '',
              })),
              null,
              2
            )
          : '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Stock Adjustment',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiSliders,
    title: 'Stock Adjustments',
    subtitle: 'Adjust stock for damaged, lost, expired, found, and variance',
    addButtonLabel: 'Add Adjustment',
    searchPlaceholder: 'Search stock adjustments...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
    ]
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Store ID', accessor: 'store_id', noWrap: true },
    { header: 'Date', accessor: 'adjustment_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'store_id', label: 'Store ID', type: 'number', required: true },
    { name: 'adjustment_date', label: 'Adjustment Date', type: 'date', required: true },
    { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
    {
      name: 'items_json',
      label: 'Items (JSON)',
      type: 'textarea',
      rows: 10,
      required: true,
      placeholder: JSON.stringify(
        [{ item_id: 1, adjustment_type: ADJUSTMENT_TYPES[0].value, quantity: 1, unit_cost: 0, remarks: '' }],
        null,
        2
      )
    },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Stock Adjustment"
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

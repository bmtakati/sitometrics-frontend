import React from 'react';
import { FiDroplet, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const TYPE_OPTIONS = [
  { value: 'TRANSFER_IN', label: 'Transfer In' },
  { value: 'CONSUMPTION', label: 'Consumption' },
  { value: 'WASTAGE', label: 'Wastage' }
];

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' }
];

const BarTransaction = () => {
  const crud = useApiCrud('bar-transactions', {
    initialFormData: {
      transaction_type: 'TRANSFER_IN',
      store_id: '',
      transaction_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      items_json: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.transaction_type) errors.transaction_type = 'Transaction type is required';
      if (!data.store_id) errors.store_id = 'Store ID is required';
      if (!data.transaction_date) errors.transaction_date = 'Transaction date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      transaction_type: data.transaction_type,
      store_id: Number(data.store_id),
      transaction_date: data.transaction_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                item_id: Number(line.item_id),
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
    resourceName: 'Bar Transaction',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiDroplet,
    title: 'Bar Transactions',
    subtitle: 'Manage bar inventory transfers, consumption, and wastage',
    addButtonLabel: 'Add Bar Transaction',
    searchPlaceholder: 'Search bar transactions...'
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
    { header: 'Type', accessor: 'transaction_type', noWrap: true },
    { header: 'Store ID', accessor: 'store_id', noWrap: true },
    { header: 'Date', accessor: 'transaction_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
  ];

  const formFields = [
    { name: 'transaction_type', label: 'Transaction Type', type: 'select', required: true, options: TYPE_OPTIONS },
    { name: 'store_id', label: 'Store ID', type: 'number', required: true },
    { name: 'transaction_date', label: 'Transaction Date', type: 'date', required: true },
    { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
    { name: 'items_json', label: 'Items (JSON)', type: 'textarea', rows: 10, required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Bar Transaction"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Type: Transfer In', value: 'type:TRANSFER_IN' },
        { label: 'Type: Consumption', value: 'type:CONSUMPTION' },
        { label: 'Type: Wastage', value: 'type:WASTAGE' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
      ]}
    />
  );
};

export default BarTransaction;

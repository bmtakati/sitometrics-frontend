import React from 'react';
import { FiSend, FiTrendingUp, FiClock, FiTruck, FiXCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const StoreIssue = () => {
  const crud = useApiCrud('store-issues', {
    initialFormData: {
      store_request_id: '',
      source_store_id: '',
      destination_store_id: '',
      issue_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      items_json: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.source_store_id) errors.source_store_id = 'Source store is required';
      if (!data.destination_store_id) errors.destination_store_id = 'Destination store is required';
      if (String(data.source_store_id) === String(data.destination_store_id)) {
        errors.destination_store_id = 'Destination must be different from source';
      }
      if (!data.issue_date) errors.issue_date = 'Issue date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      store_request_id: data.store_request_id ? Number(data.store_request_id) : null,
      source_store_id: Number(data.source_store_id),
      destination_store_id: Number(data.destination_store_id),
      issue_date: data.issue_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                store_request_item_id: line.store_request_item_id ? Number(line.store_request_item_id) : null,
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
                store_request_item_id: line.store_request_item_id,
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
    resourceName: 'Store Issue',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiSend,
    title: 'Store Issues',
    subtitle: 'Issue stock from source store to destination store',
    addButtonLabel: 'Add Store Issue',
    searchPlaceholder: 'Search store issues...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'issued', label: 'Issued', icon: FiTruck, iconColor: 'green-600' },
      { key: 'cancelled', label: 'Cancelled', icon: FiXCircle, iconColor: 'red-600' },
    ]
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Source Store ID', accessor: 'source_store_id', noWrap: true },
    { header: 'Destination Store ID', accessor: 'destination_store_id', noWrap: true },
    { header: 'Issue Date', accessor: 'issue_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'store_request_id', label: 'Store Request ID', type: 'number', required: false },
    { name: 'source_store_id', label: 'Source Store ID', type: 'number', required: true },
    { name: 'destination_store_id', label: 'Destination Store ID', type: 'number', required: true },
    { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
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
      modalTitle="Store Issue"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Issued', value: 'workflow:ISSUED' },
        { label: 'Workflow: Cancelled', value: 'workflow:CANCELLED' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default StoreIssue;

import React from 'react';
import { FiRepeat, FiTrendingUp, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const StoreRequest = () => {
  const crud = useApiCrud('store-requests', {
    initialFormData: {
      source_store_id: '',
      destination_store_id: '',
      request_date: new Date().toISOString().slice(0, 10),
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
      if (!data.request_date) errors.request_date = 'Request date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      source_store_id: Number(data.source_store_id),
      destination_store_id: Number(data.destination_store_id),
      request_date: data.request_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                item_id: Number(line.item_id),
                requested_quantity: Number(line.requested_quantity || 0),
                approved_quantity: Number(line.approved_quantity || 0),
                issued_quantity: Number(line.issued_quantity || 0),
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
                requested_quantity: line.requested_quantity,
                approved_quantity: line.approved_quantity,
                issued_quantity: line.issued_quantity,
                remarks: line.remarks || '',
              })),
              null,
              2
            )
          : '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Store Request',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiRepeat,
    title: 'Store Requests',
    subtitle: 'Manage kitchen/bar requests from main store',
    addButtonLabel: 'Add Store Request',
    searchPlaceholder: 'Search store requests...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'issued', label: 'Issued', icon: FiTruck, iconColor: 'indigo-600' },
      { key: 'cancelled', label: 'Cancelled', icon: FiXCircle, iconColor: 'red-600' },
    ]
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Source Store ID', accessor: 'source_store_id', noWrap: true },
    { header: 'Destination Store ID', accessor: 'destination_store_id', noWrap: true },
    { header: 'Request Date', accessor: 'request_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'source_store_id', label: 'Source Store ID', type: 'number', required: true },
    { name: 'destination_store_id', label: 'Destination Store ID', type: 'number', required: true },
    { name: 'request_date', label: 'Request Date', type: 'date', required: true },
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
      modalTitle="Store Request"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Submitted', value: 'workflow:SUBMITTED' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
        { label: 'Workflow: Issued', value: 'workflow:ISSUED' },
        { label: 'Workflow: Cancelled', value: 'workflow:CANCELLED' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default StoreRequest;

import React from 'react';
import { FiInbox, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' }
];

const GoodsReceivedNote = () => {
  const crud = useApiCrud('goods-received-notes', {
    initialFormData: {
      local_purchase_order_id: '',
      store_id: '',
      grn_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      items_json: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.local_purchase_order_id) errors.local_purchase_order_id = 'LPO ID is required';
      if (!data.store_id) errors.store_id = 'Store ID is required';
      if (!data.grn_date) errors.grn_date = 'GRN date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      local_purchase_order_id: Number(data.local_purchase_order_id),
      store_id: Number(data.store_id),
      grn_date: data.grn_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                local_purchase_order_item_id: line.local_purchase_order_item_id ? Number(line.local_purchase_order_item_id) : null,
                item_id: Number(line.item_id),
                ordered_quantity: Number(line.ordered_quantity || 0),
                received_quantity: Number(line.received_quantity || 0),
                rejected_quantity: Number(line.rejected_quantity || 0),
                unit_cost: Number(line.unit_cost || 0),
                batch_no: line.batch_no || null,
                expiry_date: line.expiry_date || null,
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
                local_purchase_order_item_id: line.local_purchase_order_item_id,
                item_id: line.item_id,
                ordered_quantity: line.ordered_quantity,
                received_quantity: line.received_quantity,
                rejected_quantity: line.rejected_quantity,
                unit_cost: line.unit_cost,
                batch_no: line.batch_no,
                expiry_date: line.expiry_date,
                remarks: line.remarks || '',
              })),
              null,
              2
            )
          : '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Goods Received Note',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiInbox,
    title: 'Goods Received Notes',
    subtitle: 'Receive goods against LPO with partial, rejected, batch and expiry tracking',
    addButtonLabel: 'Add GRN',
    searchPlaceholder: 'Search GRNs...'
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
    { header: 'LPO ID', accessor: 'local_purchase_order_id', noWrap: true },
    { header: 'Store ID', accessor: 'store_id', noWrap: true },
    { header: 'Date', accessor: 'grn_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'local_purchase_order_id', label: 'LPO ID', type: 'number', required: true },
    { name: 'store_id', label: 'Store ID', type: 'number', required: true },
    { name: 'grn_date', label: 'GRN Date', type: 'date', required: true },
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
      modalTitle="Goods Received Note"
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

export default GoodsReceivedNote;

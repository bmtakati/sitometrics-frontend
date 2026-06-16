import React from 'react';
import { FiFileText, FiTrendingUp, FiCheckCircle, FiTruck, FiCheck, FiXCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIALLY_DELIVERED', label: 'Partially Delivered' },
  { value: 'FULLY_DELIVERED', label: 'Fully Delivered' },
  { value: 'CLOSED', label: 'Closed' }
];

const LocalPurchaseOrder = () => {
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
      items_json: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.supplier_id) errors.supplier_id = 'Supplier is required';
      if (!data.order_date) errors.order_date = 'Order date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) errors.items_json = 'Items JSON is required';
      return errors;
    },
    transformFormData: (data) => ({
      supplier_id: Number(data.supplier_id),
      purchase_requisition_id: data.purchase_requisition_id ? Number(data.purchase_requisition_id) : null,
      order_date: data.order_date,
      expected_delivery_date: data.expected_delivery_date || null,
      tax_amount: Number(data.tax_amount || 0),
      discount_amount: Number(data.discount_amount || 0),
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price || 0),
                tax_amount: Number(line.tax_amount || 0),
                discount_amount: Number(line.discount_amount || 0),
                delivery_date: line.delivery_date || null,
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
                unit_price: line.unit_price,
                tax_amount: line.tax_amount,
                discount_amount: line.discount_amount,
                delivery_date: line.delivery_date,
                remarks: line.remarks || '',
              })),
              null,
              2
            )
          : '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Local Purchase Order',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiFileText,
    title: 'Local Purchase Orders',
    subtitle: 'Manage LPO workflow from draft to closure',
    addButtonLabel: 'Add LPO',
    searchPlaceholder: 'Search LPOs...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'sent', label: 'Sent', icon: FiTruck, iconColor: 'indigo-600' },
      { key: 'closed', label: 'Closed', icon: FiCheck, iconColor: 'emerald-600' },
    ]
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Supplier ID', accessor: 'supplier_id', noWrap: true },
    { header: 'Order Date', accessor: 'order_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'supplier_id', label: 'Supplier ID', type: 'number', required: true },
    { name: 'purchase_requisition_id', label: 'Purchase Requisition ID', type: 'number', required: false },
    { name: 'order_date', label: 'Order Date', type: 'date', required: true },
    { name: 'expected_delivery_date', label: 'Expected Delivery Date', type: 'date', required: false },
    { name: 'tax_amount', label: 'Tax Amount', type: 'number', min: 0, step: '0.01', required: false },
    { name: 'discount_amount', label: 'Discount Amount', type: 'number', min: 0, step: '0.01', required: false },
    { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
    { name: 'items_json', label: 'Items (JSON)', type: 'textarea', rows: 8, required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Local Purchase Order"
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

import React from 'react';
import { FiCreditCard, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const TYPE_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'MOBILE', label: 'Mobile Money' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
];

const PaymentMethod = () => {
  const crud = useApiCrud('payment-methods', {
    initialFormData: {
      name: '',
      type: 'CASH',
      requires_reference: false,
      sort_order: 1,
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Name is required';
      if (!data.type) errors.type = 'Type is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      const sortOrder = Number(data.sort_order);
      if (Number.isNaN(sortOrder) || sortOrder < 1) {
        errors.sort_order = 'Sort order must be at least 1';
      }
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      type: data.type,
      requires_reference: Boolean(data.requires_reference),
      sort_order: Number(data.sort_order ?? 1),
      status_id: Number(data.status_id),
    }),
    resourceName: 'Payment Method',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiCreditCard,
    title: 'Payment Methods',
    subtitle: 'Configure payment options used when receiving guest payments',
    addButtonLabel: 'Add Payment Method',
    searchPlaceholder: 'Search payment methods...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Name', accessor: 'name', noWrap: true },
    { header: 'Type', accessor: 'type', noWrap: true },
    {
      header: 'Reference',
      accessor: 'requires_reference',
      noWrap: true,
      render: (row) => (row.requires_reference ? 'Required' : 'Optional'),
    },
    { header: 'Order', accessor: 'sort_order', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true, placeholder: 'e.g. Mobile Money' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: TYPE_OPTIONS },
    { name: 'sort_order', label: 'Sort order', type: 'number', required: true, min: 1, step: 1 },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
    { name: 'requires_reference', label: 'Requires payment reference', type: 'checkbox' },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Payment Method"
      crud={crud}
    />
  );
};

export default PaymentMethod;

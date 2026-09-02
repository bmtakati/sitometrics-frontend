import React from 'react';
import { FiClipboard, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const OrderType = () => {
  const crud = useApiCrud('order-types', {
    initialFormData: {
      name: '',
      requires_room_number: false,
      requires_guest_signature: false,
      sort_order: 1,
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Name is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      const sortOrder = Number(data.sort_order);
      if (Number.isNaN(sortOrder) || sortOrder < 1) {
        errors.sort_order = 'Sort order must be at least 1';
      }
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      requires_room_number: Boolean(data.requires_room_number),
      requires_guest_signature: Boolean(data.requires_guest_signature),
      sort_order: Number(data.sort_order ?? 1),
      status_id: Number(data.status_id),
    }),
    resourceName: 'Order Type',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiClipboard,
    title: 'Order Types',
    subtitle: 'Configure order types and printout requirements such as room number and guest signature',
    addButtonLabel: 'Add Order Type',
    searchPlaceholder: 'Search order types...',
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
    {
      header: 'Room no.',
      accessor: 'requires_room_number',
      noWrap: true,
      render: (row) => (row.requires_room_number ? 'Required' : 'Optional'),
    },
    {
      header: 'Signature',
      accessor: 'requires_guest_signature',
      noWrap: true,
      render: (row) => (row.requires_guest_signature ? 'Required' : 'Optional'),
    },
    { header: 'Order', accessor: 'sort_order', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true, placeholder: 'e.g. Room Service' },
    { name: 'sort_order', label: 'Sort order', type: 'number', required: true, min: 1, step: 1 },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
    { name: 'requires_room_number', label: 'Require room number on printouts', type: 'checkbox' },
    { name: 'requires_guest_signature', label: 'Require guest signature on printouts', type: 'checkbox' },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Order Type"
      crud={crud}
    />
  );
};

export default OrderType;

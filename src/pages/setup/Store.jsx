import React from 'react';
import { FiHome, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const STORE_TYPES = [
  { value: 'MAIN_STORE', label: 'Main Store' },
  { value: 'KITCHEN_STORE', label: 'Kitchen Store' },
  { value: 'BAR_STORE', label: 'Bar Store' }
];

const Store = () => {
  const crud = useApiCrud('stores', {
    initialFormData: {
      name: '',
      type: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Store name is required';
      if (!data.type) errors.type = 'Store type is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      type: data.type,
      status_id: Number(data.status_id)
    }),
    resourceName: 'Store',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiHome,
    title: 'Stores',
    subtitle: 'Manage main, kitchen, and bar stores',
    addButtonLabel: 'Add Store',
    searchPlaceholder: 'Search stores...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' }
    ]
  };

  const tableColumns = [
    {
      header: 'Store',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Type',
      accessor: 'type',
      noWrap: true,
      render: (row) => STORE_TYPES.find((type) => type.value === row.type)?.label || row.type
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Stores Found',
      description: 'Get started by creating your first store.'
    }
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'type', label: 'Type', type: 'select', required: true, options: STORE_TYPES },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Store"
      crud={crud}
    />
  );
};

export default Store;

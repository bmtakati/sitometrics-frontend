import React from 'react';
import { FiPackage, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const Unit = () => {
  const crud = useApiCrud('units', {
    initialFormData: {
      name: '',
      symbol: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Unit name is required';
      }
      if (!data.symbol?.trim()) {
        errors.symbol = 'Unit symbol is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Unit',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiPackage,
    title: 'Units',
    subtitle: 'Manage inventory measurement units',
    addButtonLabel: 'Add Unit',
    searchPlaceholder: 'Search units...'
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
      header: 'Unit Name',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    {
      header: 'Symbol',
      accessor: 'symbol',
      noWrap: true
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'status',
      noWrap: true
    }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Units Found',
      description: 'Get started by creating your first measurement unit.'
    }
  };

  const formFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      autoFocus: true
    },
    {
      name: 'symbol',
      label: 'Symbol',
      type: 'text',
      required: true
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true
    }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Unit"
      crud={crud}
    />
  );
};

export default Unit;

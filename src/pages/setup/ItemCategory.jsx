import React from 'react';
import { FiArchive, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const ItemCategory = () => {
  const crud = useApiCrud('item-categories', {
    initialFormData: {
      name: '',
      description: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Item category name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Item Category',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiArchive,
    title: 'Item Categories',
    subtitle: 'Manage inventory item categories',
    addButtonLabel: 'Add Item Category',
    searchPlaceholder: 'Search item categories...'
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
      header: 'Item Category',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    {
      header: 'Code',
      accessor: 'code',
      noWrap: true
    },
    {
      header: 'Description',
      accessor: 'description',
      noWrap: false
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
      title: 'No Item Categories Found',
      description: 'Get started by creating your first item category.'
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
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      required: false
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
      modalTitle="Item Category"
      crud={crud}
    />
  );
};

export default ItemCategory;

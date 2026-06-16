import React from 'react';
import { FiGrid, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

/**
 * Module Management
 * Manages system modules using the CRUDPage component
 */
const Module = () => {
  // Initialize CRUD hook
  const crud = useApiCrud('modules', {
    initialFormData: {
      name: '',
      description: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Module name is required';
      }
      if (!data.description?.trim()) {
        errors.description = 'Description is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Module',
    itemsPerPage: 10
  });

  // Page configuration
  const pageConfig = {
    icon: FiGrid,
    title: 'Modules',
    subtitle: 'Manage system modules and configurations',
    addButtonLabel: 'Add Module',
    searchPlaceholder: 'Search modules...'
  };

  // Stats cards configuration
  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' }
    ]
  };

  // Table columns configuration
  const tableColumns = [
    {
      header: 'Module',
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
      type: 'truncate'
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'status',
      noWrap: true
    }
  ];

  // Table configuration
  const tableConfig = {
    emptyState: {
      title: 'No Modules Found',
      description: 'Get started by creating your first module.'
    }
  };

  // Form fields configuration
  const formFields = [
    {
      name: 'name',
      label: 'Module Name',
      type: 'text',
      required: true,
      autoFocus: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      required: true
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true
    }
  ];

  // Render using CRUDPage component
  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Module"
      crud={crud}
    />
  );
};

export default Module;

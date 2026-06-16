import React from 'react';
import { FiSettings, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const ServiceType = () => {
  const crud = useApiCrud('school-service-types', {
    initialFormData: {
      name: '',
      description: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Service Type name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Service Type',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiSettings,
    title: 'Service Types',
    subtitle: 'Manage school service types',
    addButtonLabel: 'Add Service Type',
    searchPlaceholder: 'Search service types...'
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
      header: 'Service Type',
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
      title: 'No Service Types Found',
      description: 'Get started by creating your first service types.'
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
      modalTitle="Service Type"
      crud={crud}
    />
  );
};

export default ServiceType;
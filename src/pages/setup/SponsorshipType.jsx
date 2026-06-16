import React from 'react';
import { FiSettings, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const SponsorshipType = () => {
  const crud = useApiCrud('sponsorship-types', {
    initialFormData: {
      name: '',
      description: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Sponsorship Type name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Sponsorship Type',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiSettings,
    title: 'Sponsorship Types',
    subtitle: 'Manage student sponsorship types',
    addButtonLabel: 'Add Sponsorship Type',
    searchPlaceholder: 'Search sponsorship types...'
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
      header: 'Sponsorship Type',
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
      title: 'No Sponsorship Types Found',
      description: 'Get started by creating your first sponsorship types.'
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
      modalTitle="Sponsorship Type"
      crud={crud}
    />
  );
};

export default SponsorshipType;
import React from 'react';
import { FiBookOpen, FiTrendingUp, FiCheck, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

/** Admin CRUD for FAQ guide types. */
const FaqGuideTypesAdmin = () => {
  const crud = useApiCrud('faq-guide-types', {
    initialFormData: {
      name: '',
      code: '',
      description: '',
      status: 'active',
      sort_order: 1,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Guide type name is required';
      if (!data.code?.trim()) errors.code = 'Code is required';
      if (!data.status_id) errors.status = 'Status is required';
      return errors;
    },
    resourceName: 'Guide Type',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiBookOpen,
    title: 'Guide Types',
    subtitle: 'Manage guide types used in FAQ user guide registration',
    addButtonLabel: 'Add Guide Type',
    searchPlaceholder: 'Search guide types...',
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
    {
      header: 'Guide Type',
      accessor: 'name',
      noWrap: true,
      render: (row, darkMode) => (
        <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{row.name}</div>
      ),
    },
    { header: 'Description', accessor: 'description', type: 'truncate' },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
    { header: 'Sort', accessor: 'sort_order', noWrap: true },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Guide Types Found',
      description: 'Get started by creating your first guide type.',
    },
  };

  const formFields = [
    { name: 'name', label: 'Guide Type Name', type: 'text', required: true, autoFocus: true },
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true
    },
    {
      name: 'sort_order',
      label: 'List position',
      type: 'number',
      required: false,
      placeholder: '1 = top of list',
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Guide Type"
      crud={crud}
    />
  );
};

export default FaqGuideTypesAdmin;


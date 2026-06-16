import React from 'react';
import { FiList, FiTrendingUp, FiCheck, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

/** Admin CRUD for FAQ question categories. */
const FaqQuestionCategoriesAdmin = () => {
  const crud = useApiCrud('faq-question-categories', {
    initialFormData: {
      name: '',
      code: '',
      description: '',
      status: 'active',
      sort_order: 1,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Category name is required';
      if (!data.code?.trim()) errors.code = 'Code is required';
      if (!data.status_id) errors.status = 'Status is required';
      return errors;
    },
    resourceName: 'Question Category',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiList,
    title: 'Question Categories',
    subtitle: 'Manage categories used for FAQ question registration',
    addButtonLabel: 'Add Question Category',
    searchPlaceholder: 'Search question categories...',
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
      header: 'Category',
      accessor: 'name',
      render: (row, darkMode) => (
        <div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{row.name}</div>
          {row.description ? (
            <div className={`text-xs mt-0.5 truncate max-w-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={row.description}>
              {row.description}
            </div>
          ) : null}
        </div>
      ),
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
    { header: 'Sort', accessor: 'sort_order', noWrap: true },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Question Categories Found',
      description: 'Get started by creating your first question category.',
    },
  };

  const formFields = [
    { name: 'name', label: 'Category Name', type: 'text', required: true, autoFocus: true },
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
      modalTitle="Question Category"
      crud={crud}
    />
  );
};

export default FaqQuestionCategoriesAdmin;


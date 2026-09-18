import React, { useMemo } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiLayers,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const Categories = () => {
  const crud = useApiCrud('catalog-categories', {
    initialFormData: {
      name: '',
      code: '',
      item_type: 'FOOD',
      description: '',
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Category name is required';
      if (!data.item_type) errors.item_type = 'Please select a type';
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      code: data.code?.trim() || null,
      item_type: data.item_type,
      description: data.description?.trim() || null,
      status_id: Number(data.status_id),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        item_type: row?.item_type || 'FOOD',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Category',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiLayers,
    title: 'Categories',
    subtitle: 'Manage Food and Beverage menu categories',
    addButtonLabel: 'Add Category',
    searchPlaceholder: 'Search categories...',
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
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return (
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {row.name}
          </div>
        );
      },
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Type',
      accessor: 'item_type',
      noWrap: true,
      render: (row) => (row.item_type === 'BEVERAGE' ? 'Beverage' : 'Food'),
    },
    {
      header: 'Subcategories',
      accessor: 'subcategories_count',
      noWrap: true,
      render: (row) =>
        row.subcategories_count
        ?? (Array.isArray(row.subcategories) ? row.subcategories.length : 0),
    },
    { header: 'Description', accessor: 'description', noWrap: false },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = useMemo(
    () => [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        autoFocus: true,
        fullWidth: false,
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        required: false,
        fullWidth: false,
      },
      {
        name: 'item_type',
        label: 'Type',
        type: 'select',
        required: true,
        fullWidth: false,
        disabled: crud.isEditing,
        options: [
          { value: 'FOOD', label: 'Food' },
          { value: 'BEVERAGE', label: 'Beverage' },
        ],
      },
      {
        name: 'status_id',
        label: 'Status',
        type: 'status_id',
        required: true,
        fullWidth: false,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 3,
        required: false,
        fullWidth: true,
      },
    ],
    [crud.isEditing]
  );

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={{
        emptyState: {
          title: 'No Categories Found',
          description: 'Create Food and Beverage categories first, then manage subcategories separately.',
        },
      }}
      formFields={formFields}
      formFieldsLayout="two-col"
      modalTitle="Category"
      crud={crud}
    />
  );
};

export default Categories;

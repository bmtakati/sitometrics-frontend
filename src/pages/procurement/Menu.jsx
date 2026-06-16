import React from 'react';
import { FiCoffee, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const Menu = () => {
  const crud = useApiCrud('menus', {
    initialFormData: {
      name: '',
      category: '',
      selling_price: 0,
      description: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Menu name is required';
      if (!data.category?.trim()) errors.category = 'Category is required';
      if (data.selling_price === '' || Number(data.selling_price) < 0) errors.selling_price = 'Selling price must be 0 or more';
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      category: data.category?.trim(),
      selling_price: Number(data.selling_price || 0),
      description: data.description?.trim() || null,
      status_id: Number(data.status_id)
    }),
    resourceName: 'Menu',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiCoffee,
    title: 'Menus',
    subtitle: 'Manage menu catalog and selling prices',
    addButtonLabel: 'Add Menu',
    searchPlaceholder: 'Search menus...'
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
      header: 'Menu',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Category', accessor: 'category', noWrap: true },
    { header: 'Selling Price', accessor: 'selling_price', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'selling_price', label: 'Selling Price', type: 'number', min: 0, step: '0.01', required: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Menu"
      crud={crud}
    />
  );
};

export default Menu;

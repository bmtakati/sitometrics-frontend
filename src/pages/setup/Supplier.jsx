import React from 'react';
import { FiTruck, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const Supplier = () => {
  const crud = useApiCrud('suppliers', {
    initialFormData: {
      name: '',
      phone: '',
      email: '',
      address: '',
      tin: '',
      vrn: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Supplier name is required';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please enter a valid email';
      }
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      tin: data.tin?.trim() || null,
      vrn: data.vrn?.trim() || null,
      status_id: Number(data.status_id)
    }),
    resourceName: 'Supplier',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiTruck,
    title: 'Suppliers',
    subtitle: 'Manage supplier master data',
    addButtonLabel: 'Add Supplier',
    searchPlaceholder: 'Search suppliers...'
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
      header: 'Supplier',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      }
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Phone', accessor: 'phone', noWrap: true },
    { header: 'Email', accessor: 'email', noWrap: true },
    { header: 'TIN', accessor: 'tin', noWrap: true },
    { header: 'VRN', accessor: 'vrn', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Suppliers Found',
      description: 'Get started by creating your first supplier.'
    }
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'phone', label: 'Phone', type: 'text', required: false },
    { name: 'email', label: 'Email', type: 'email', required: false },
    { name: 'tin', label: 'TIN', type: 'text', required: false },
    { name: 'vrn', label: 'VRN', type: 'text', required: false },
    { name: 'address', label: 'Address', type: 'textarea', rows: 3, required: false },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Supplier"
      crud={crud}
    />
  );
};

export default Supplier;

import React from 'react';
import { FiDollarSign, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

const Currency = () => {
  const crud = useApiCrud('currencies', {
    initialFormData: {
      code: '',
      name: '',
      symbol: '',
      decimal_places: 2,
      is_base: false,
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.code?.trim()) errors.code = 'Currency code is required';
      if (!data.name?.trim()) errors.name = 'Currency name is required';
      if (!data.symbol?.trim()) errors.symbol = 'Symbol is required';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const decimals = Number(data.decimal_places);
      if (Number.isNaN(decimals) || decimals < 0 || decimals > 4) {
        errors.decimal_places = 'Decimal places must be between 0 and 4';
      }
      return errors;
    },
    transformFormData: (data) => ({
      code: data.code?.trim().toUpperCase(),
      name: data.name?.trim(),
      symbol: data.symbol?.trim(),
      decimal_places: Number(data.decimal_places ?? 2),
      is_base: Boolean(data.is_base),
      status_id: Number(data.status_id)
    }),
    resourceName: 'Currency',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiDollarSign,
    title: 'Currencies',
    subtitle: 'Manage currency codes and base currency settings',
    addButtonLabel: 'Add Currency',
    searchPlaceholder: 'Search currencies...'
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
      header: 'Code',
      accessor: 'code',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.code}</div>;
      }
    },
    { header: 'Name', accessor: 'name', noWrap: true },
    { header: 'Symbol', accessor: 'symbol', noWrap: true },
    { header: 'Decimals', accessor: 'decimal_places', noWrap: true },
    {
      header: 'Base',
      accessor: 'is_base',
      noWrap: true,
      render: (row) => (row.is_base ? 'Yes' : 'No')
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Currencies Found',
      description: 'Get started by creating your first currency.'
    }
  };

  const formFields = [
    { name: 'code', label: 'Code', type: 'text', required: true, autoFocus: true, placeholder: 'e.g. TZS' },
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Tanzanian Shilling' },
    { name: 'symbol', label: 'Symbol', type: 'text', required: true, placeholder: 'e.g. TSh' },
    { name: 'decimal_places', label: 'Decimal Places', type: 'number', required: true, min: 0, max: 4, step: 1 },
    { name: 'is_base', label: 'Base Currency', type: 'checkbox' },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Currency"
      crud={crud}
    />
  );
};

export default Currency;

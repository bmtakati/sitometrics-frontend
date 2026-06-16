import React from 'react';
import { FiGlobe, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { resolveLocaleFlagUrl } from '../../utils/resolveApiAssetUrl';

const Locale = () => {
  const crud = useApiCrud('locales', {
    initialFormData: {
      code: '',
      name: '',
      native_name: '',
      sort_order: 0,
      status_id: '',
      flag: null,
      remove_flag: false,
    },
    validateForm: (data) => {
      const errors = {};
      const code = String(data.code || '').trim().toLowerCase();
      if (!code) {
        errors.code = 'Locale code is required (e.g. en, sw)';
      } else if (!/^[a-z]{2}(-[a-z]{2,8})?$/.test(code)) {
        errors.code = 'Use a valid locale code (e.g. en or en-US)';
      }
      if (!data.name?.trim()) {
        errors.name = 'Display name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      if (!data.flag && !data.flag_url) {
        errors.flag = 'Flag image is required';
      }
      return errors;
    },
    transformFormData: (data) => ({
      ...data,
      code: String(data.code || '').trim().toLowerCase(),
      sort_order: data.sort_order === '' || data.sort_order == null ? 0 : Number(data.sort_order),
      remove_flag: data.remove_flag ? '1' : '0',
    }),
    transformResponse: (data) => {
      const patch = (item) => ({
        ...item,
        flag: null,
        remove_flag: false,
      });
      if (Array.isArray(data)) return data.map(patch);
      if (data && typeof data === 'object') return patch(data);
      return data;
    },
    resourceName: 'Locale',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiGlobe,
    title: 'Locales',
    subtitle: 'Manage languages and flag icons for the header language switcher',
    addButtonLabel: 'Add Locale',
    searchPlaceholder: 'Search locales...',
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
      header: 'Flag',
      accessor: 'flag_url',
      noWrap: true,
      render: (row) => {
        const url = resolveLocaleFlagUrl(row);
        if (!url) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        return (
          <img
            src={url}
            alt=""
            className="h-6 w-8 rounded-sm border border-gray-200 object-contain dark:border-gray-600"
          />
        );
      },
    },
    {
      header: 'Code',
      accessor: 'code',
      noWrap: true,
      render: (row) => (
        <span className="font-mono text-sm font-medium uppercase">{row.code}</span>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      noWrap: true,
    },
    {
      header: 'Native name',
      accessor: 'native_name',
      noWrap: true,
      render: (row) => row.native_name || '—',
    },
    {
      header: 'Order',
      accessor: 'sort_order',
      noWrap: true,
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'status',
      noWrap: true,
    },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Locales Found',
      description: 'Add locales to populate the language switcher in the application header.',
    },
  };

  const formFields = [
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      required: true,
      placeholder: 'en',
      autoFocus: true,
      helpText: 'ISO-style code used in the language switcher (e.g. en, sw)',
    },
    {
      name: 'name',
      label: 'Display name',
      type: 'text',
      required: true,
    },
    {
      name: 'native_name',
      label: 'Native name',
      type: 'text',
      required: false,
      placeholder: 'Optional',
    },
    {
      name: 'sort_order',
      label: 'Sort order',
      type: 'number',
      required: false,
      min: 0,
    },
    {
      name: 'flag',
      label: 'Flag image',
      type: 'file',
      required: false,
      accept: 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml',
      helpText: 'PNG, JPG, GIF, WebP, or SVG (max 2MB). When editing, leave empty to keep the current flag.',
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true,
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Locale"
      crud={crud}
    />
  );
};

export default Locale;

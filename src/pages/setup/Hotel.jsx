import React from 'react';
import { FiHome, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { resolveHotelLogoUrl } from '../../utils/resolveApiAssetUrl';

const Hotel = () => {
  const crud = useApiCrud('hotels', {
    initialFormData: {
      name: '',
      short_name: '',
      address: '',
      phone: '',
      email: '',
      vat_no: '',
      tin_no: '',
      website: '',
      status_id: '',
      logo: null,
      remove_logo: false,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Hotel name is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      name: data.name?.trim(),
      short_name: data.short_name?.trim() || null,
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      vat_no: data.vat_no?.trim() || null,
      tin_no: data.tin_no?.trim() || null,
      website: data.website?.trim() || null,
      status_id: Number(data.status_id),
      logo: data.logo,
      remove_logo: data.remove_logo ? '1' : '0',
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        logo: null,
        remove_logo: false,
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Hotel',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiHome,
    title: 'Hotels',
    subtitle: 'Manage hotel properties, branding, and contact details for printouts',
    addButtonLabel: 'Add Hotel',
    searchPlaceholder: 'Search hotels...',
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
      header: 'Logo',
      accessor: 'logo_url',
      noWrap: true,
      render: (row) => {
        const url = resolveHotelLogoUrl(row);
        if (!url) return <span className="text-xs text-gray-400">—</span>;
        return (
          <img
            src={url}
            alt=""
            className="h-10 w-10 rounded-md border border-gray-200 object-contain bg-white p-0.5 dark:border-gray-600"
          />
        );
      },
    },
    {
      header: 'Hotel',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      },
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Short Name', accessor: 'short_name', noWrap: true },
    {
      header: 'Outlets',
      accessor: 'outlets_count',
      noWrap: true,
      render: (row) => row.outlets_count ?? 0,
    },
    { header: 'Phone', accessor: 'phone', noWrap: true },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'short_name', label: 'Short Name', type: 'text', required: false },
    { name: 'phone', label: 'Phone', type: 'text', required: false },
    { name: 'email', label: 'Email', type: 'email', required: false },
    { name: 'vat_no', label: 'VAT No.', type: 'text', required: false },
    { name: 'tin_no', label: 'TIN No.', type: 'text', required: false },
    { name: 'website', label: 'Website', type: 'url', required: false },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
    { name: 'address', label: 'Address', type: 'textarea', rows: 2, required: false },
    {
      name: 'logo',
      label: 'Hotel logo',
      type: 'file',
      required: false,
      accept: 'image/png,image/jpeg,image/gif,image/webp',
      helpText: 'PNG, JPG, GIF, or WebP (max 5MB). Shown on LPO and order PDFs. Leave empty when editing to keep the current logo.',
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Hotel Details',
      icon: FiHome,
      fields: [
        {
          label: 'Logo',
          accessor: 'logo_url',
          fullWidth: true,
          valueRender: (item) => {
            const url = resolveHotelLogoUrl(item);
            if (!url) return '—';
            return (
              <img
                src={url}
                alt={item.name || 'Hotel logo'}
                className="h-20 w-20 rounded-lg border border-gray-200 object-contain bg-white p-1 dark:border-gray-600"
              />
            );
          },
        },
        { label: 'Name', accessor: 'name' },
        { label: 'Code', accessor: 'code' },
        { label: 'Short Name', accessor: 'short_name' },
        { label: 'Address', accessor: 'address', fullWidth: true },
        { label: 'Phone', accessor: 'phone' },
        { label: 'Email', accessor: 'email' },
        { label: 'VAT No.', accessor: 'vat_no' },
        { label: 'TIN No.', accessor: 'tin_no' },
        {
          label: 'Website',
          accessor: 'website',
          valueRender: (item) =>
            item.website ? (
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {item.website}
              </a>
            ) : (
              '—'
            ),
        },
        {
          label: 'Outlets',
          accessor: 'outlets_count',
          valueRender: (item) => item.outlets_count ?? 0,
        },
        { label: 'Status', accessor: 'status.name', type: 'status' },
      ],
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      viewTabs={viewTabs}
      modalTitle="Hotel"
      crud={crud}
    />
  );
};

export default Hotel;

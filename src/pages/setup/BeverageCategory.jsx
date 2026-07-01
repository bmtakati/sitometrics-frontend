import React from 'react';
import {
  FiDroplet,
  FiTrendingUp,
  FiAlertCircle,
  FiTrash2,
  FiCheck,
  FiInfo,
  FiList,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import CategoryItemsEditor from '../../components/CategoryItemsEditor';

const patchCategoryRow = (row) => ({
  ...row,
  beverages: (row.beverages || []).map((beverage) => ({
    id: beverage.id,
    name: beverage.name || '',
    price: beverage.price ?? '',
    description: beverage.description || '',
  })),
});

const BeverageCategory = () => {
  const crud = useApiCrud('beverage-categories', {
    initialFormData: {
      name: '',
      description: '',
      status_id: '',
      beverages: [{ name: '', price: '', description: '' }],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Beverage category name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }

      const namedBeverages = (data.beverages || []).filter((row) => row.name?.trim());
      const names = namedBeverages.map((row) => row.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        errors.beverages = 'Beverage names must be unique within this category';
      }

      return errors;
    },
    transformFormData: (data) => {
      const payload = {
        name: data.name?.trim(),
        description: data.description?.trim() || null,
        status_id: Number(data.status_id),
      };

      if (Array.isArray(data.beverages)) {
        payload.beverages = data.beverages
          .filter((row) => row.name?.trim())
          .map((row) => ({
            ...(row.id ? { id: Number(row.id) } : {}),
            name: row.name.trim(),
            price: Number(row.price || 0),
            description: row.description?.trim() || null,
          }));
      }

      return payload;
    },
    transformResponse: (data) => {
      if (Array.isArray(data)) return data.map(patchCategoryRow);
      if (data && typeof data === 'object') {
        const patched = patchCategoryRow(data);
        if (!patched.beverages?.length) {
          patched.beverages = [{ name: '', description: '' }];
        }
        return patched;
      }
      return data;
    },
    resourceName: 'Beverage Category',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiDroplet,
    title: 'Beverage Categories',
    subtitle: 'Manage bar and menu beverage categories',
    addButtonLabel: 'Add Beverage Category',
    searchPlaceholder: 'Search beverage categories...',
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
      header: 'Beverage Category',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      },
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Beverages', accessor: 'beverages_count', noWrap: true, render: (row) => row.beverages_count ?? 0 },
    { header: 'Description', accessor: 'description', noWrap: false },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Beverage Categories Found',
      description: 'Get started by creating your first beverage category.',
    },
  };

  const detailFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Category Details',
      icon: FiInfo,
      fields: detailFields,
    },
    ...(crud.isEditing
      ? [
          {
            id: 'beverages',
            label: 'Beverages',
            icon: FiList,
            fields: [
              {
                name: 'beverages',
                type: 'custom',
                render: (formData, onInputChange, errors, darkMode) => (
                  <CategoryItemsEditor
                    fieldName="beverages"
                    value={formData.beverages}
                    onChange={onInputChange}
                    errors={errors}
                    darkMode={darkMode}
                    itemLabel="Beverage"
                    addLabel="Add beverage"
                    listTitle="Beverages in this category"
                    listDescription="List the beverage items that belong to this category."
                    showPrice
                  />
                ),
              },
            ],
          },
        ]
      : []),
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Category Details',
      icon: FiInfo,
      fields: [
        { label: 'Name', accessor: 'name' },
        { label: 'Code', accessor: 'code' },
        { label: 'Description', accessor: 'description', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'beverages',
      label: 'Beverages',
      icon: FiList,
      fields: [
        {
          label: 'Beverages in category',
          accessor: 'beverages',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.beverages || [];
            if (!rows.length) return '—';
            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((beverage) => (
                      <tr key={beverage.id || beverage.name} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 font-medium">{beverage.name}</td>
                        <td className="px-3 py-2">{beverage.code || '—'}</td>
                        <td className="px-3 py-2">{beverage.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          },
        },
      ],
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formTabs={formTabs}
      viewTabs={viewTabs}
      modalTitle="Beverage Category"
      modalMaxWidth="max-w-4xl"
      crud={crud}
    />
  );
};

export default BeverageCategory;

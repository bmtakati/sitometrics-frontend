import React from 'react';
import {
  FiCoffee,
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
  foods: (row.foods || []).map((food) => ({
    id: food.id,
    name: food.name || '',
    price: food.price ?? '',
    description: food.description || '',
  })),
});

const FoodCategory = () => {
  const crud = useApiCrud('food-categories', {
    initialFormData: {
      name: '',
      description: '',
      status_id: '',
      foods: [{ name: '', price: '', description: '' }],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Food category name is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }

      const namedFoods = (data.foods || []).filter((row) => row.name?.trim());
      const names = namedFoods.map((row) => row.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        errors.foods = 'Food names must be unique within this category';
      }

      return errors;
    },
    transformFormData: (data) => {
      const payload = {
        name: data.name?.trim(),
        description: data.description?.trim() || null,
        status_id: Number(data.status_id),
      };

      if (Array.isArray(data.foods)) {
        payload.foods = data.foods
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
        if (!patched.foods?.length) {
          patched.foods = [{ name: '', description: '' }];
        }
        return patched;
      }
      return data;
    },
    resourceName: 'Food Category',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiCoffee,
    title: 'Food Categories',
    subtitle: 'Manage kitchen and menu food categories',
    addButtonLabel: 'Add Food Category',
    searchPlaceholder: 'Search food categories...',
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
      header: 'Food Category',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      },
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Foods', accessor: 'foods_count', noWrap: true, render: (row) => row.foods_count ?? 0 },
    { header: 'Description', accessor: 'description', noWrap: false },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Food Categories Found',
      description: 'Get started by creating your first food category.',
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
            id: 'foods',
            label: 'Foods',
            icon: FiList,
            fields: [
              {
                name: 'foods',
                type: 'custom',
                render: (formData, onInputChange, errors, darkMode) => (
                  <CategoryItemsEditor
                    fieldName="foods"
                    value={formData.foods}
                    onChange={onInputChange}
                    errors={errors}
                    darkMode={darkMode}
                    itemLabel="Food"
                    addLabel="Add food"
                    listTitle="Foods in this category"
                    listDescription="List the food items that belong to this category."
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
      id: 'foods',
      label: 'Foods',
      icon: FiList,
      fields: [
        {
          label: 'Foods in category',
          accessor: 'foods',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.foods || [];
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
                    {rows.map((food) => (
                      <tr key={food.id || food.name} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 font-medium">{food.name}</td>
                        <td className="px-3 py-2">{food.code || '—'}</td>
                        <td className="px-3 py-2">{food.description || '—'}</td>
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
      modalTitle="Food Category"
      modalMaxWidth="max-w-4xl"
      crud={crud}
    />
  );
};

export default FoodCategory;

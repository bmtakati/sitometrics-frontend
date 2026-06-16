import React from 'react';
import { FiLayers } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

/**
 * Status Groups (Status Categories) Management
 * Manage groupings of statuses (e.g. Workflow Statuses, Student Statuses)
 */
const StatusGroups = () => {
  const crud = useApiCrud('status-groups', {
    initialFormData: {
      name: '',
      description: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Group name is required';
      return errors;
    },
    resourceName: 'Status Group',
    itemsPerPage: 15
  });

  const pageConfig = {
    icon: FiLayers,
    title: 'Status Categories',
    subtitle: 'Manage categories (groups) that organise statuses',
    addButtonLabel: 'Add Category',
    searchPlaceholder: 'Search categories…'
  };

  const tableColumns = [
    {
      header: 'Category Name',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return (
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {row.name}
          </div>
        );
      }
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Mapped Statuses',
      accessor: 'statuses',
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const statuses = row.statuses ?? [];
        if (!statuses.length) return <span className="text-xs text-gray-400">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {statuses.slice(0, 5).map((s) => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color ?? '#9ca3af' }}
                />
                {s.name}
              </span>
            ))}
            {statuses.length > 5 && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                +{statuses.length - 5} more
              </span>
            )}
          </div>
        );
      }
    },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Status Categories Found',
      description: 'Get started by creating your first status category.'
    }
  };

  const formFields = [
    {
      name: 'name',
      label: 'Category Name',
      type: 'text',
      required: true,
      autoFocus: true,
      placeholder: 'e.g. Workflow Statuses, Student Statuses…'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Status Category"
      crud={crud}
    />
  );
};

export default StatusGroups;

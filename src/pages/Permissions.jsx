import React from 'react';
import { FiLock, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../hooks/useApiCrud';
import CRUDPage from '../components/CRUDPage/CRUDPage';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import AccessDeniedState from '../components/AccessDeniedState';

const MODULES = [
  'Users', 'Roles', 'Permissions', 'Settings', 'Reports',
  'System', 'Security', 'Schools', 'Staff', 'Books', 'Assessments'
];

const MODULE_OPTIONS = [
  { value: '', label: '-- Select Module --' },
  ...MODULES.map((m) => ({ value: m, label: m }))
];

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Trashed', value: 'trashed' },
  { label: '── By Module ──', value: '__sep__', disabled: true },
  ...MODULES.map((m) => ({ label: m, value: `module:${m}` }))
];



const Permissions = () => {
  const { user } = useAuth();
  const canViewPermissions = hasPermission(user, 'view-permissions');
  const canAssignPermissions = hasPermission(user, 'assign-permissions');

  // Initialize CRUD hook
  const crud = useApiCrud('permissions', {
    initialFormData: {
      name: '',
      display_name: '',
      module_name: '',
      description: '',
      status_id: ''
    },
    // Map API response fields → form keys (needed so module_name populates on edit)
    transformResponse: (data) => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
      return {
        ...data,
        module_name: data.module_name ?? '',
        display_name: data.display_name ?? '',
        status_id: data.status_id ?? ''
      };
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Permission name is required';
      }
      if (!data.module_name?.trim()) {
        errors.module_name = 'Module is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      return errors;
    },
    resourceName: 'Permission',
    itemsPerPage: 10
  });

  // Page configuration
  const pageConfig = {
    icon: FiLock,
    title: 'Permissions',
    subtitle: 'Manage system permissions and access control',
    addButtonLabel: 'Add Permission',
    searchPlaceholder: 'Search permissions...',
    hideAddButton: !canAssignPermissions,
    hideActions: [
      ...(!canViewPermissions ? ['view'] : []),
      ...(!canAssignPermissions ? ['edit', 'delete'] : []),
    ]
  };

  // Stats cards configuration
  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' }
    ]
  };

  // Table columns configuration
  const tableColumns = [
    {
      header: 'Permission',
      accessor: 'display_name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return (
          <div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {row.display_name || row.name}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{row.name}</div>
          </div>
        );
      }
    },
    {
      header: 'Module',
      accessor: 'module_name',
      noWrap: true,
      render: (row) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700">
          {row.module_name}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'status',
      noWrap: true
    }
  ];

  // Table configuration
  const tableConfig = {
    emptyState: {
      title: 'No Permissions Found',
      description: 'Get started by creating your first permission.'
    }
  };

  // Form fields — two-col grid layout:
  // Row 1: Permission Name | Description
  // Row 2: Display Name     | Module
  // Row 3: Status
  const formFields = [
    {
      name: 'name',
      label: 'Permission Name',
      type: 'text',
      required: true,
      autoFocus: true,
      placeholder: 'e.g., create-user'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      required: false,
      placeholder: 'Describe what this permission allows'
    },
    {
      name: 'display_name',
      label: 'Display Name',
      type: 'text',
      required: false,
      placeholder: 'e.g., Create User'
    },
    {
      name: 'module_name',
      label: 'Module',
      type: 'select',
      required: true,
      options: MODULE_OPTIONS
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true
    }
  ];

  if (!canViewPermissions) {
    return <AccessDeniedState message="You do not have permission to view permissions." />;
  }

  // Render using CRUDPage component
  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      formFieldsLayout="two-col"
      modalMaxWidth="max-w-3xl"
      modalTitle="Permission"
      filterOptions={filterOptions}
      crud={crud}
    />
  );
};

export default Permissions;

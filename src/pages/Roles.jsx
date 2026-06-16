import React, { useState, useEffect } from 'react';
import {
  FiShield, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiInfo,
  FiLock, FiLayers, FiZap, FiSliders, FiUsers
} from 'react-icons/fi';
import useApiCrud from '../hooks/useApiCrud';
import CRUDPage from '../components/CRUDPage/CRUDPage';
import PermissionPicker from '../components/PermissionPicker/PermissionPicker';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import AssignableRolePicker from '../components/AssignableRolePicker/AssignableRolePicker';
import AccessDeniedState from '../components/AccessDeniedState';
import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from '../utils/apiFetch';

/**
 * Roles Management
 * Refactored with useApiCrud hook and CRUDPage component
 */
const Roles = () => {
  const { user } = useAuth();
  const canViewRoles = hasPermission(user, 'view-roles');
  const canCreateRoles = hasPermission(user, 'create-roles');
  const canEditRoles = hasPermission(user, 'edit-roles');
  const canDeleteRoles = hasPermission(user, 'delete-roles');

  const [geoLevelOptions, setGeoLevelOptions] = useState([{ value: '', label: '— Select Geo Level —' }]);
  const [geoLevelMap, setGeoLevelMap]         = useState({});
  const [statusOptions, setStatusOptions]     = useState([{ value: '', label: '— Select Status —' }]);

  // Load geographical levels
  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/geographical-levels/all`)
      .then((r) => r.json())
      .then((json) => {
        let list = [];
        if (Array.isArray(json)) list = json;
        else if (Array.isArray(json.data)) list = json.data;
        else if (Array.isArray(json.data?.data)) list = json.data.data;
        const map = {};
        list.forEach((l) => { map[String(l.id)] = l.name; });
        setGeoLevelMap(map);
        setGeoLevelOptions([
          { value: '', label: '— Select Geo Level —' },
          ...list.map((l) => ({ value: String(l.id), label: l.name }))
        ]);
      })
      .catch(() => {});
  }, []);

  // Load statuses from "Lookup Data Statuses" group
  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/status-groups/all`)
      .then((r) => r.json())
      .then((json) => {
        const groups = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        const group  = groups.find((g) => (g.name ?? '').toLowerCase() === 'lookup data statuses');
        const list   = group?.statuses ?? [];
        setStatusOptions([
          { value: '', label: '— Select Status —' },
          ...list.map((s) => ({ value: String(s.id), label: s.name }))
        ]);
      })
      .catch(() => {});
  }, []);

  // Initialize CRUD hook
  const crud = useApiCrud('roles', {
    initialFormData: {
      name: '',
      description: '',
      status_id: '',
      geographical_level_id: '',
      scope_mode: 'AUTO',
      permissions: [],
      assignable_role_ids: []
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Role name is required';
      }
      if (!data.description?.trim()) {
        errors.description = 'Description is required';
      }
      if (!data.status_id) {
        errors.status_id = 'Please select a status';
      }
      if (!data.permissions?.length) {
        errors.permissions = 'Please select at least one permission';
      }
      return errors;
    },
    // When loading a role for editing, normalize permissions to an array of IDs
    transformResponse: (data) => {
      if (!data || typeof data !== 'object') return data;
      if (Array.isArray(data)) return data; // list responses pass through
      // Normalize: handle plain array, paginated {data:[...]}, or missing
      let perms = data.permissions;
      if (perms && !Array.isArray(perms) && Array.isArray(perms?.data)) {
        perms = perms.data; // unwrap Laravel paginated object
      }
      // Normalize assignable_roles → assignable_role_ids (array of IDs)
      const assignableRoles = Array.isArray(data.assignable_roles) ? data.assignable_roles : [];
      return {
        ...data,
        status_id:             String(data.status_id ?? ''),
        geographical_level_id: String(data.geographical_level_id ?? data.geographical_level?.id ?? ''),
        scope_mode: data.scope_mode ?? 'AUTO',
        permissions: Array.isArray(perms)
          ? perms.map((p) => (typeof p === 'object' ? Number(p.id) : Number(p)))
          : [],
        assignable_role_ids: assignableRoles.map((r) => (typeof r === 'object' ? Number(r.id) : Number(r)))
      };
    },
    // Ensure we always send permissions as an array of IDs to the API
    transformFormData: (data) => ({
      ...data,
      geographical_level_id: data.geographical_level_id ? Number(data.geographical_level_id) : null,
      scope_mode: data.scope_mode || 'AUTO',
      permissions: Array.isArray(data.permissions)
        ? data.permissions.map((p) => (typeof p === 'object' ? Number(p.id) : Number(p)))
        : [],
      assignable_role_ids: Array.isArray(data.assignable_role_ids)
        ? data.assignable_role_ids.map((id) => Number(id))
        : []
    }),
    resourceName: 'Role',
    itemsPerPage: 10
  });

  // Page configuration
  const pageConfig = {
    icon: FiShield,
    title: 'Roles',
    subtitle: 'Manage user roles and permissions',
    addButtonLabel: 'Add Role',
    searchPlaceholder: 'Search roles...',
    hideAddButton: !canCreateRoles,
    hideActions: [
      ...(!canViewRoles ? ['view'] : []),
      ...(!canEditRoles ? ['edit'] : []),
      ...(!canDeleteRoles ? ['delete', 'restore'] : []),
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
      header: 'Role',
      accessor: 'name',
      render: (row, darkMode) => (
        <div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{row.name}</div>
          {row.description && (
            <div className={`text-xs mt-0.5 truncate max-w-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{row.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Geo. Level',
      accessor: 'geographical_level_id',
      sortable: false,
      render: (row, darkMode) => {
        const name = row.geographical_level?.name
          || geoLevelMap[String(row.geographical_level_id)]
          || '—';
        return (
          <span className={`inline-flex items-center gap-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <FiLayers className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            {name}
          </span>
        );
      }
    },
    {
      header: 'Scope',
      accessor: 'scope_mode',
      noWrap: true,
      render: (row, darkMode) => {
        const mode = row.scope_mode || 'AUTO';
        const isAuto = mode === 'AUTO';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isAuto
              ? darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
              : darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700'
          }`}>
            {isAuto ? <FiZap className="w-3 h-3" /> : <FiSliders className="w-3 h-3" />}
            {mode}
          </span>
        );
      }
    },
    {
      header: 'Permissions',
      accessor: 'permissions',
      render: (row, darkMode) => {
        const count = Array.isArray(row.permissions) ? row.permissions.length : 0;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            count > 0
              ? darkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-100 text-primary-700'
              : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
          }`}>
            {count} {count === 1 ? 'permission' : 'permissions'}
          </span>
        );
      }
    }
  ];

  // Table configuration
  const tableConfig = {
    emptyState: {
      title: 'No Roles Found',
      description: 'Get started by creating your first role.'
    }
  };

  // Detail fields (tab 1)
  // Layout (two-col grid):
  //  Row 1 │ Role Name          │ Description
  //  Row 2 │ Status             │ Geographical Level
  //  Row 3 │ Scope Mode
  const detailFields = [
    {
      name: 'name',
      label: 'Role Name',
      type: 'text',
      required: true,
      autoFocus: true,
      placeholder: 'e.g., Administrator',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3,
      required: true,
      placeholder: 'Enter role description',
    },
    {
      name: 'status_id',
      label: 'Status',
      type: 'searchable_select',
      required: true,
      options: statusOptions,
      placeholder: 'Select status',
    },
    {
      name: 'geographical_level_id',
      label: 'Geographical Level',
      type: 'searchable_select',
      required: false,
      options: geoLevelOptions,
      placeholder: 'Select geographical level',
    },
    {
      name: 'scope_mode',
      label: 'Scope Mode',
      type: 'searchable_select',
      required: false,
      options: [
        { value: 'AUTO',   label: 'AUTO — determined by geographical level' },
        { value: 'SELECT', label: 'SELECT — manually assigned per user' },
      ],
      placeholder: 'Select scope mode',
    },
  ];

  // Form fields (flat — used by ViewModal)
  const formFields = [
    ...detailFields,
    { name: 'permissions', label: 'Permissions', type: 'text' },
  ];

  // Form tabs for the Add/Edit modal
  const formTabs = [
    {
      id: 'details',
      label: 'Role Details',
      icon: FiInfo,
      fields: detailFields,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: FiLock,
      fields: [
        {
          name: 'permissions',
          type: 'custom',
          render: (formData, onInputChange, errors) => (
            <PermissionPicker
              value={formData.permissions || []}
              onChange={(ids) =>
                onInputChange({ target: { name: 'permissions', value: ids } })
              }
              errors={errors}
            />
          ),
        },
      ],
    },
    {
      id: 'delegation',
      label: 'Delegation',
      icon: FiUsers,
      fields: [
        {
          name: 'assignable_role_ids',
          type: 'custom',
          render: (formData, onInputChange, errors) => (
            <AssignableRolePicker
              value={formData.assignable_role_ids || []}
              onChange={(ids) =>
                onInputChange({ target: { name: 'assignable_role_ids', value: ids } })
              }
              errors={errors}
            />
          ),
        },
      ],
    },
  ];

  // View tabs (same design, read-only)
  const viewTabs = [
    {
      id: 'details',
      label: 'Role Details',
      icon: FiInfo,
      fields: [
        { label: 'Role Name',          accessor: 'name' },
        { label: 'Status',             accessor: 'status', type: 'status' },
        {
          label: 'Geographical Level',
          accessor: 'geographical_level_id',
          valueRender: (item) => {
            const name = item.geographical_level?.name
              || geoLevelMap[String(item.geographical_level_id)]
              || null;
            if (!name) return '—';
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <FiLayers className="w-3 h-3 flex-shrink-0" />
                {name}
              </span>
            );
          },
        },
        {
          label: 'Scope Mode',
          accessor: 'scope_mode',
          valueRender: (item) => {
            const mode = item.scope_mode || 'AUTO';
            const isAuto = mode === 'AUTO';
            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isAuto
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {isAuto ? <FiZap className="w-3 h-3" /> : <FiSliders className="w-3 h-3" />}
                {mode}
              </span>
            );
          },
        },
        { label: 'Description',        accessor: 'description', type: 'textarea', fullWidth: true },
      ],
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: FiLock,
      fields: [
        {
          render: (item) => (
            <PermissionPicker
              value={(item.permissions || []).map((p) => (typeof p === 'object' ? p.id : p))}
              onChange={() => {}}
              readOnly
            />
          ),
        },
      ],
    },
    {
      id: 'delegation',
      label: 'Delegation',
      icon: FiUsers,
      fields: [
        {
          render: (item) => (
            <AssignableRolePicker
              value={(item.assignable_roles || []).map((r) => (typeof r === 'object' ? r.id : r))}
              onChange={() => {}}
              readOnly
            />
          ),
        },
      ],
    },
  ];

  // Render using CRUDPage component
  const computedStats = {
    total:    crud.stats?.total    ?? crud.totalItems,
    active:   crud.stats?.status_active   ?? 0,
    inactive: crud.stats?.status_inactive ?? 0,
    trashed:  crud.stats?.trashed  ?? 0,
  };

  if (!canViewRoles) {
    return <AccessDeniedState message="You do not have permission to view roles." />;
  }

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      formTabs={formTabs}
      formFieldsLayout="two-col"
      viewTabs={viewTabs}
      modalTitle="Role"
      modalMaxWidth="max-w-3xl"
      crud={{ ...crud, stats: computedStats }}
    />
  );
};

export default Roles;

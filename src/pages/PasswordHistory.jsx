import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheck,
  FiKey,
  FiLock,
  FiShield,
} from 'react-icons/fi';
import { API_BASE_URL, useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import CRUDPage from '../components/CRUDPage/CRUDPage';
import AccessDeniedState from '../components/AccessDeniedState';
import apiFetch from '../utils/apiFetch';

const EVENT_LABELS = {
  created: 'Initial Password',
  changed: 'Changed By User',
  admin_reset: 'Set By Admin',
  reset: 'Password Reset',
};

const EVENT_COLORS = {
  created: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  changed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  admin_reset: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  reset: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
};

const formatDate = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDisplayName = (user) => {
  if (!user) return 'Unknown User';

  const firstName = user.person?.first_name?.trim();
  const lastName = user.person?.last_name?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return fullName || user.full_name || user.email || 'Unknown User';
};

const PasswordHistory = () => {
  const { user } = useAuth();
  const canView = hasPermission(user, 'view-password-history');

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: itemsPerPage.toString(),
          ...(searchTerm ? { search: searchTerm } : {}),
        });

        const response = await apiFetch(`${API_BASE_URL}/api/password-policy/history?${params.toString()}`);
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Failed to load password history.');
        }

        setHistory(Array.isArray(json.data) ? json.data : []);
        setTotalPages(json.meta?.last_page || 1);
        setTotalItems(json.meta?.total || 0);
      } catch (err) {
        setError(err.message || 'Failed to load password history.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [currentPage, itemsPerPage, searchTerm, reloadKey]);

  const stats = useMemo(() => {
    const changed = history.filter((entry) => entry.event_type === 'changed').length;
    const resets = history.filter((entry) => ['admin_reset', 'reset'].includes(entry.event_type)).length;
    const uniqueUsers = new Set(history.map((entry) => entry.user?.id).filter(Boolean)).size;

    return {
      total: totalItems,
      users_in_view: uniqueUsers,
      changed_by_user: changed,
      resets,
    };
  }, [history, totalItems]);

  const tableColumns = [
    {
      header: 'User',
      accessor: 'user.email',
      noWrap: true,
      render: (entry, tableDarkMode) => (
        <div className={`text-sm font-medium ${tableDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {getDisplayName(entry.user)}
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'user.email',
      noWrap: true,
      render: (entry, tableDarkMode) => (
        <div className={`text-sm ${tableDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {entry.user?.email || 'N/A'}
        </div>
      )
    },
    {
      header: 'Event',
      accessor: 'event_type',
      noWrap: true,
      render: (entry, tableDarkMode) => {
        const colors = EVENT_COLORS[entry.event_type];
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${colors?.bg || (tableDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')} ${colors?.text || (tableDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
            {EVENT_LABELS[entry.event_type] || entry.event_type}
          </span>
        );
      }
    },
    {
      header: 'Changed At',
      accessor: 'changed_at',
      noWrap: true,
      render: (entry, tableDarkMode) => (
        <div className={`text-sm ${tableDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatDate(entry.changed_at)}
        </div>
      )
    },
    {
      header: 'Changed By',
      accessor: 'actor.email',
      noWrap: true,
      render: (entry, tableDarkMode) => (
        <div className={`text-sm ${tableDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {entry.actor ? getDisplayName(entry.actor) : 'System'}
        </div>
      )
    }
  ];

  const pageConfig = {
    icon: FiLock,
    title: 'Password History',
    subtitle: 'Review password change and reset activity across the system.',
    searchPlaceholder: 'Search password activity...',
    hideAddButton: true,
    hideActions: ['view', 'edit', 'delete', 'restore'],
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total Events', icon: FiActivity, iconColor: 'blue-600' },
      { key: 'users_in_view', label: 'Users In View', icon: FiShield, iconColor: 'green-600' },
      { key: 'changed_by_user', label: 'Changed By User', icon: FiCheck, iconColor: 'amber-600' },
      { key: 'resets', label: 'Resets', icon: FiKey, iconColor: 'red-600' },
    ]
  };

  const tableConfig = {
    emptyState: {
      title: 'No Password History Records',
      description: 'No password history records found.'
    }
  };

  const crud = {
    data: history,
    stats,
    loading,
    actionLoading: false,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    searchTerm,
    filterStatus: 'all',
    showModal: false,
    isEditing: false,
    formData: {},
    errors: {},
    handleSearch: (value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    },
    handleFilterChange: () => {},
    handleSubmit: () => {},
    handleEdit: () => {},
    handleDelete: () => {},
    handleRestore: () => {},
    handleCloseModal: () => {},
    handlePageChange: setCurrentPage,
    handleItemsPerPageChange: (value) => {
      setItemsPerPage(value);
      setCurrentPage(1);
    },
    handleInputChange: () => {},
    handleAdd: () => {},
    reload: () => setReloadKey((value) => value + 1),
  };

  if (!canView) {
    return <AccessDeniedState message="You do not have permission to view password history." />;
  }

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={[]}
      modalTitle="Password Activity"
      filterOptions={[{ label: 'All Activity', value: 'all' }]}
      crud={crud}
    />
  );
};

export default PasswordHistory;
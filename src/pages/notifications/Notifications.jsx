import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCircle,
  FiTrash2,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';
import TableControls from '../../components/TableControls';
import PageTabs from '../../components/PageTabs';
import DataTable from '../../components/DataTable';
import ViewModal from '../../components/ViewModal/ViewModal';
import AccessDeniedState from '../../components/AccessDeniedState';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import useDarkMode from '../../hooks/useDarkMode';
import { showDeleteConfirm, showSuccessToast } from '../../utils/dialogUtils';

const TAB_IDS = ['all', 'unread', 'alerts'];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'info',
    title: 'New User Registration',
    message: 'A new user has registered in the system: John Doe',
    timestamp: '2026-03-15T10:30:00',
    read: false,
    category: 'User Management',
  },
  {
    id: 2,
    type: 'success',
    title: 'School Data Updated',
    message: 'Azania Secondary School information has been successfully updated',
    timestamp: '2026-03-15T09:15:00',
    read: true,
    category: 'Schools',
  },
  {
    id: 3,
    type: 'warning',
    title: 'System Maintenance Scheduled',
    message: 'System maintenance is scheduled for March 20, 2026 from 2:00 AM to 4:00 AM',
    timestamp: '2026-03-14T16:45:00',
    read: false,
    category: 'System Alerts',
    severity: 'info',
    status: 'Scheduled',
  },
  {
    id: 4,
    type: 'error',
    title: 'Failed Data Import',
    message: 'The student data import process failed. Please review the error logs.',
    timestamp: '2026-03-14T14:20:00',
    read: false,
    category: 'Data Import',
  },
  {
    id: 5,
    type: 'info',
    title: 'New Book Added',
    message: 'Advanced Mathematics for Secondary Schools has been added to the library',
    timestamp: '2026-03-14T11:00:00',
    read: true,
    category: 'Books',
  },
  {
    id: 6,
    type: 'success',
    title: 'Report Generated',
    message: 'Monthly performance report has been successfully generated',
    timestamp: '2026-03-13T15:30:00',
    read: true,
    category: 'Reports',
  },
  {
    id: 7,
    type: 'error',
    title: 'Database Connection Issues',
    message: 'Intermittent database connection issues detected',
    timestamp: '2026-03-15T10:30:00',
    read: false,
    category: 'System Alerts',
    severity: 'critical',
    status: 'Active',
  },
  {
    id: 8,
    type: 'warning',
    title: 'High Memory Usage',
    message: 'System memory usage is above 85%',
    timestamp: '2026-03-15T09:15:00',
    read: false,
    category: 'System Alerts',
    severity: 'warning',
    status: 'Monitoring',
  },
];

const isSystemAlert = (row) => String(row?.category || '').toLowerCase() === 'system alerts'
  || Boolean(row?.severity);

const resolveTab = (value) => (TAB_IDS.includes(value) ? value : 'all');

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const Notifications = () => {
  const darkMode = useDarkMode();
  const { user } = useAuth();
  const canView = hasPermission(user, 'view-notifications');
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewingItem, setViewingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeTab = resolveTab(searchParams.get('tab'));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, itemsPerPage]);

  const stats = useMemo(() => {
    const unread = notifications.filter((row) => !row.read).length;
    const alerts = notifications.filter(isSystemAlert).length;
    return {
      total: notifications.length,
      unread,
      alerts,
      read: notifications.length - unread,
    };
  }, [notifications]);

  const tabs = useMemo(() => [
    { id: 'all', label: 'All', icon: FiBell, badge: stats.total || false },
    { id: 'unread', label: 'Unread', icon: FiCircle, badge: stats.unread || false },
    { id: 'alerts', label: 'System Alerts', icon: FiAlertCircle, badge: stats.alerts || false },
  ], [stats.alerts, stats.total, stats.unread]);

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return notifications.filter((row) => {
      if (activeTab === 'unread' && row.read) return false;
      if (activeTab === 'alerts' && !isSystemAlert(row)) return false;
      if (!needle) return true;
      return [row.title, row.message, row.category, row.type, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [activeTab, notifications, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage) || 1);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [currentPage, filteredRows, itemsPerPage]);

  const handleTabChange = (tabId) => {
    const next = resolveTab(tabId);
    setSearchParams(next === 'all' ? {} : { tab: next }, { replace: true });
    setCurrentPage(1);
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((row) => (row.id === id ? { ...row, read: true } : row)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((row) => ({ ...row, read: true })));
    showSuccessToast('All notifications marked as read.');
  };

  const handleDelete = async (row) => {
    const result = await showDeleteConfirm(row.title, 'Notification');
    if (!result?.isConfirmed) return;

    setActionLoading(true);
    try {
      setNotifications((prev) => prev.filter((item) => item.id !== row.id));
      showSuccessToast('Notification deleted.', 'delete');
    } finally {
      setActionLoading(false);
    }
  };

  const tableColumns = [
    {
      header: 'Notification',
      accessor: 'title',
      noWrap: true,
      render: (row) => (
        <div>
          <div className={`flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {!row.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" /> : null}
            {row.title}
          </div>
          <div className={`mt-0.5 line-clamp-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.message}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      noWrap: true,
      render: (row) => (
        <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
          {row.category || '—'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      noWrap: true,
      render: (row) => {
        const styles = {
          success: darkMode ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
          warning: darkMode ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-700',
          error: darkMode ? 'bg-red-950/40 text-red-300' : 'bg-red-50 text-red-700',
          info: darkMode ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-50 text-blue-700',
        };
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[row.type] || styles.info}`}>
            {String(row.type || 'info').toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'read',
      noWrap: true,
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          row.read
            ? darkMode ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            : darkMode ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-700'
        }`}>
          {row.read ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiCircle className="h-3.5 w-3.5" />}
          {row.read ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      header: 'When',
      accessor: 'timestamp',
      noWrap: true,
      render: (row) => (
        <div>
          <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {formatRelativeTime(row.timestamp)}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatDateTime(row.timestamp)}
          </div>
        </div>
      ),
    },
  ];

  const viewFields = [
    { label: 'Title', accessor: 'title' },
    { label: 'Message', accessor: 'message', type: 'textarea', fullWidth: true },
    { label: 'Category', accessor: 'category' },
    { label: 'Type', accessor: 'type' },
    { label: 'Read Status', accessor: 'read_label' },
    { label: 'Alert Status', accessor: 'status_label' },
    { label: 'Received', accessor: 'received_at' },
  ];

  if (!canView) {
    return <AccessDeniedState message="You do not have permission to view notifications." />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <PageHeader
        icon={FiBell}
        title="Notifications"
        subtitle="Stay updated with system activities and alerts"
        actions={stats.unread > 0
          ? [{ label: 'Mark All Read', icon: FiCheck, onClick: markAllAsRead, variant: 'secondary' }]
          : []}
      />

      <StatsCards
        cards={[
          { label: 'Total', value: stats.total, icon: FiBell, iconColor: 'blue-600' },
          { label: 'Unread', value: stats.unread, icon: FiCircle, iconColor: 'amber-600' },
          { label: 'System Alerts', value: stats.alerts, icon: FiAlertCircle, iconColor: 'orange-600' },
          { label: 'Read', value: stats.read, icon: FiCheckCircle, iconColor: 'green-600' },
        ]}
      />

      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel="Notification sections"
      />

      <TableControls
        pagination={{
          itemsPerPage,
          onItemsPerPageChange: (next) => {
            setItemsPerPage(Number(next) || 10);
            setCurrentPage(1);
          },
        }}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: activeTab === 'unread'
            ? 'Search unread…'
            : activeTab === 'alerts'
              ? 'Search system alerts…'
              : 'Search notifications...',
        }}
      />

      <DataTable
        columns={tableColumns}
        data={pageRows}
        emptyState={{
          icon: FiBell,
          title: activeTab === 'unread'
            ? 'No Unread Notifications'
            : activeTab === 'alerts'
              ? 'No System Alerts'
              : 'No Notifications Found',
          description: activeTab === 'unread'
            ? 'You are all caught up.'
            : activeTab === 'alerts'
              ? 'There are no system alerts right now.'
              : 'Notifications will appear here as activity happens.',
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredRows.length,
          itemsPerPage,
          onPageChange: setCurrentPage,
          onItemsPerPageChange: (next) => {
            setItemsPerPage(Number(next) || 10);
            setCurrentPage(1);
          },
        }}
        actions={[
          {
            type: 'view',
            label: 'View',
            onClick: (row) => {
              setViewingItem({
                ...row,
                read_label: row.read ? 'Read' : 'Unread',
                status_label: row.status || '—',
                received_at: formatDateTime(row.timestamp),
              });
              if (!row.read) markAsRead(row.id);
            },
          },
          {
            type: 'edit',
            label: 'Mark as read',
            icon: FiCheck,
            onClick: (row) => markAsRead(row.id),
            visible: (row) => !row.read,
          },
          {
            type: 'delete',
            label: 'Delete',
            icon: FiTrash2,
            onClick: handleDelete,
          },
        ]}
        filterStatus={activeTab}
        actionLoading={actionLoading}
      />

      <ViewModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
        title="View Notification"
        fields={viewFields}
        icon={FiBell}
      />
    </div>
  );
};

export const NotificationsRedirect = ({ tab }) => (
  <Navigate to={tab && tab !== 'all' ? `/notifications?tab=${tab}` : '/notifications'} replace />
);

export default Notifications;

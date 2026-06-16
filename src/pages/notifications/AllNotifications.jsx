import React, { useState } from 'react';
import { FiBell, FiCheck, FiTrash2, FiFilter, FiX, FiClock, FiUser, FiAlertCircle, FiMail, FiCheckCircle } from 'react-icons/fi';
import useDarkMode from '../../hooks/useDarkMode';

const AllNotifications = ({ filterDefault = 'all' }) => {
  const darkMode = useDarkMode();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'New User Registration',
      message: 'A new user has registered in the system: John Doe',
      timestamp: '2026-03-15T10:30:00',
      read: false,
      category: 'User Management'
    },
    {
      id: 2,
      type: 'success',
      title: 'School Data Updated',
      message: 'Azania Secondary School information has been successfully updated',
      timestamp: '2026-03-15T09:15:00',
      read: true,
      category: 'Schools'
    },
    {
      id: 3,
      type: 'warning',
      title: 'System Maintenance Scheduled',
      message: 'System maintenance is scheduled for March 20, 2026 from 2:00 AM to 4:00 AM',
      timestamp: '2026-03-14T16:45:00',
      read: false,
      category: 'System'
    },
    {
      id: 4,
      type: 'error',
      title: 'Failed Data Import',
      message: 'The student data import process failed. Please review the error logs.',
      timestamp: '2026-03-14T14:20:00',
      read: false,
      category: 'Data Import'
    },
    {
      id: 5,
      type: 'info',
      title: 'New Book Added',
      message: 'Advanced Mathematics for Secondary Schools has been added to the library',
      timestamp: '2026-03-14T11:00:00',
      read: true,
      category: 'Books'
    },
    {
      id: 6,
      type: 'success',
      title: 'Report Generated',
      message: 'Monthly performance report has been successfully generated',
      timestamp: '2026-03-13T15:30:00',
      read: true,
      category: 'Reports'
    }
  ]);

  const [filter, setFilter] = useState(filterDefault);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setShowDeleteConfirm(false);
    setSelectedNotification(null);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiBell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    if (darkMode) {
      switch(type) {
        case 'success': return 'bg-green-900/30 border-green-700';
        case 'warning': return 'bg-yellow-900/30 border-yellow-700';
        case 'error':   return 'bg-red-900/30 border-red-700';
        default:        return 'bg-blue-900/30 border-blue-700';
      }
    }
    switch(type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error':   return 'bg-red-50 border-red-200';
      default:        return 'bg-blue-50 border-blue-200';
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.read);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg relative">
                <FiBell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              All Notifications
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Stay updated with system activities and alerts</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <FiFilter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread' 
                ? 'bg-primary-600 text-white' 
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'read' 
                ? 'bg-primary-600 text-white' 
                : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({notifications.filter(n => n.read).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border`}>
            <FiBell className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>No notifications found</p>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-2`}>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-stone-100 rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${
                getTypeColor(notification.type)
              } ${!notification.read ? 'border-l-4' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                        {notification.title}
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </h3>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium px-2 py-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded mt-1 inline-block`}>
                        {notification.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Mark as read"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{notification.message}</p>
                  <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <FiClock className="w-3 h-3" />
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md overflow-hidden`}>
            <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center gap-3 px-6 py-4`}>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Notification</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone</p>
              </div>
            </div>
            <div className="p-6">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
              Are you sure you want to delete this notification?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedNotification(null);
                }}
                className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNotification(selectedNotification.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllNotifications;

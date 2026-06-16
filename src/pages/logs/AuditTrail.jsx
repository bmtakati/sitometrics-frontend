import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiList, FiUser, FiClock, FiActivity, FiAlertCircle, FiEye, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';

const AuditTrail = () => {
  const darkMode = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 10;

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch audit data
  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/audits`, {
          headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
          }
          throw new Error(result.message || 'Failed to fetch audit data');
        }

        if (result.success && Array.isArray(result.data)) {
          setAuditData(result.data);
        } else {
          throw new Error(result.message || 'Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching audits:', err);
        setError(err.message || 'An error occurred while fetching audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  // Get unique users, resource types, and events for filters
  const uniqueUsers = [...new Set(auditData.map(item => item.user?.name).filter(Boolean))];
  const uniqueResourceTypes = [...new Set(auditData.map(item => item.resource_type).filter(Boolean))];
  const uniqueEvents = [...new Set(auditData.map(item => item.event).filter(Boolean))];

  // Filter data based on search and filters
  const filteredData = auditData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      item.event?.toLowerCase().includes(searchLower) ||
      item.resource_type?.toLowerCase().includes(searchLower) ||
      item.user?.name?.toLowerCase().includes(searchLower) ||
      item.user?.email?.toLowerCase().includes(searchLower) ||
      item.ip_address?.toLowerCase().includes(searchLower)
    );

    const matchesUser = selectedUser === 'all' || item.user?.name === selectedUser;
    const matchesResourceType = selectedResourceType === 'all' || item.resource_type === selectedResourceType;
    const matchesEvent = selectedEvent === 'all' || item.event === selectedEvent;
    
    let matchesDateRange = true;
    if (startDate || endDate) {
      const itemDate = new Date(item.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && itemDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && itemDate <= end;
      }
    }

    return matchesSearch && matchesUser && matchesResourceType && matchesEvent && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate stats
  const stats = {
    total: auditData.length,
    today: auditData.filter(item => {
      const itemDate = new Date(item.created_at);
      const today = new Date();
      return itemDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: auditData.filter(item => {
      const itemDate = new Date(item.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    }).length,
    thisMonth: auditData.filter(item => {
      const itemDate = new Date(item.created_at);
      const today = new Date();
      return itemDate.getMonth() === today.getMonth() && 
             itemDate.getFullYear() === today.getFullYear();
    }).length
  };

  const getEventColor = (event) => {
    switch (event?.toLowerCase()) {
      case 'created': return darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800';
      case 'updated': return darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'deleted': return darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
      case 'restored': return darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800';
      default: return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangedFieldsText = (item) => {
    if (item.changed_fields && item.changed_fields.length > 0) {
      return item.changed_fields.join(', ');
    }
    return 'N/A';
  };

  const handleViewDetails = (audit) => {
    setSelectedAudit(audit);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAudit(null);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (typeof value === 'object') {
      return <pre className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-900'} p-2 rounded overflow-auto max-h-40`}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`relative ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-stone-100'} rounded-xl shadow-card p-4 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6`}>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Audit Trail</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Track all system activities and user actions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Events</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiActivity className="w-8 h-8 text-green-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Today</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.today}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiClock className="w-8 h-8 text-yellow-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>This Week</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.thisWeek}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiList className="w-8 h-8 text-gray-900" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>This Month</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.thisMonth}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiUser className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border`}>
        {/* Search Bar and Filters */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* User Filter */}
              <div>
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map((user, index) => (
                    <option key={index} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              {/* Resource Type Filter */}
              <div>
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Resource Type</label>
                <select
                  value={selectedResourceType}
                  onChange={(e) => {
                    setSelectedResourceType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="all">All Resources</option>
                  {uniqueResourceTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Event Filter */}
              <div>
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Event</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="all">All Events</option>
                  {uniqueEvents.map((event, index) => (
                    <option key={index} value={event} className="capitalize">{event}</option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedUser !== 'all' || selectedResourceType !== 'all' || selectedEvent !== 'all' || startDate || endDate || searchTerm) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedUser('all');
                    setSelectedResourceType('all');
                    setSelectedEvent('all');
                    setStartDate('');
                    setEndDate('');
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-gray-300' : 'border-gray-900'} mx-auto`}></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading audit trail...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>#</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Timestamp</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Event</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Resource</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>IP Address</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      No audit records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{startIndex + index + 1}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatTimestamp(item.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item.user?.name || 'N/A'}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getEventColor(item.event)}`}>
                          {item.event || 'N/A'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item.resource_type || 'N/A'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.ip_address || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredData.length > 0 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{' '}
              <span className="font-medium">{filteredData.length}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-gray-900 text-white border-gray-900'
                        : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Details Modal */}
      {showModal && selectedAudit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

            {/* Modal panel */}
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full`}>
              {/* Modal Header */}
              <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4`}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
                <h3 className={`text-lg font-semibold pl-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Audit Trail Details</h3>
                <button
                  onClick={handleCloseModal}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} px-6 py-4 max-h-[70vh] overflow-y-auto`}>
                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Event</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getEventColor(selectedAudit.event)}`}>
                          {selectedAudit.event || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resource Type</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.resource_type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resource ID</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.auditable_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Timestamp</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{formatTimestamp(selectedAudit.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>User Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>IP Address</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.ip_address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User Agent</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1 truncate`} title={selectedAudit.user_agent}>
                        {selectedAudit.user_agent || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>Request Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>URL</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1 break-all`}>{selectedAudit.url || 'N/A'}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Auditable Type</label>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} mt-1`}>{selectedAudit.auditable_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Changed Fields */}
                {selectedAudit.changed_fields && selectedAudit.changed_fields.length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>Changed Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudit.changed_fields.map((field, index) => (
                        <span key={index} className="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Old Values */}
                {selectedAudit.old_values && Object.keys(selectedAudit.old_values).length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>Old Values</h4>
                    <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                      <div className="space-y-2">
                        {Object.entries(selectedAudit.old_values).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{key}:</span>
                            <div className="mt-1">{renderValue(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* New Values */}
                {selectedAudit.new_values && Object.keys(selectedAudit.new_values).length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>New Values</h4>
                    <div className={`${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
                      <div className="space-y-2">
                        {Object.entries(selectedAudit.new_values).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{key}:</span>
                            <div className="mt-1">{renderValue(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedAudit.tags && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase mb-3`}>Tags</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedAudit.tags || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} px-6 py-4 flex justify-end`}>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiX className="w-5 h-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;

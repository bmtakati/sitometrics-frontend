import React, { useState, useEffect } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiXCircle, FiAlertTriangle, FiInfo, FiAlertOctagon, FiAlertCircle, FiEye, FiX, FiClock, FiCopy, FiCheck } from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';

/* Small inline copy-to-clipboard button */
const CopyButton = ({ text, darkMode }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
        copied
          ? 'bg-green-100 text-green-700'
          : darkMode
            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const Errors = () => {
  const darkMode = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedError, setSelectedError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
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

  // Fetch log data
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/logs`, {
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
          throw new Error(result.message || 'Failed to fetch log data');
        }

        if (result.success && Array.isArray(result.data)) {
          setLogData(result.data);
        } else {
          throw new Error(result.message || 'Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError(err.message || 'An error occurred while fetching log data');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Filter data based on search and level
  const filteredData = logData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      item.level?.toLowerCase().includes(searchLower) ||
      item.environment?.toLowerCase().includes(searchLower) ||
      item.message?.toLowerCase().includes(searchLower)
    );
    const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate stats
  const stats = {
    total: logData.length,
    error: logData.filter(item => item.level === 'ERROR').length,
    warning: logData.filter(item => item.level === 'WARNING').length,
    info: logData.filter(item => item.level === 'INFO').length,
    debug: logData.filter(item => item.level === 'DEBUG').length
  };

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': return darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
      case 'WARNING': return darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'INFO': return darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'DEBUG': return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
      default: return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': return <FiXCircle className="w-4 h-4" />;
      case 'WARNING': return <FiAlertTriangle className="w-4 h-4" />;
      case 'INFO': return <FiInfo className="w-4 h-4" />;
      case 'DEBUG': return <FiAlertCircle className="w-4 h-4" />;
      default: return <FiInfo className="w-4 h-4" />;
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
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`relative ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-stone-100'} rounded-xl shadow-card p-4 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6`}>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Logs</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Monitor and track system logs and errors</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Logs</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiAlertOctagon className="w-8 h-8 text-green-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Errors</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.error}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiXCircle className="w-8 h-8 text-red-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Warnings</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.warning}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiAlertTriangle className="w-8 h-8 text-yellow-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Info</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.info}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiInfo className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Debug</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.debug}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <FiAlertCircle className="w-8 h-8 text-gray-600" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border`}>
        {/* Search Bar and Filters */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Levels</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-gray-300' : 'border-gray-900'} mx-auto`}></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading logs...</p>
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
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Level</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Message</th>
                  <th className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`px-6 py-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      No log records found
                    </td>
                  </tr>
                  
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{startIndex + index + 1}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatTimestamp(item.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(item.level)}`}>
                          {getLevelIcon(item.level)}
                          {item.level || 'N/A'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        <span title={item.message}>
                          {item.message ? (item.message.length > 70 ? item.message.slice(0, 70) + '…' : item.message) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => { setSelectedError(item); setShowViewModal(true); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            darkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                          }`}
                          title="View details"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          View
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

    {/* View Error Modal */}
    {showViewModal && selectedError && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowViewModal(false)}
        />

        {/* Modal */}
        <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${getLevelColor(selectedError.level)}`}>
                {getLevelIcon(selectedError.level)}
                {selectedError.level || 'N/A'}
              </span>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Error Details</h2>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Timestamps */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
              <div className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FiClock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Timestamp</span>
                </div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatTimestamp(selectedError.timestamp)}
                </p>
              </div>
              {selectedError.created_at && (
                <div className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FiClock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created At</span>
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatTimestamp(selectedError.created_at)}
                  </p>
                </div>
              )}
              {selectedError.updated_at && (
                <div className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FiClock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Updated At</span>
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatTimestamp(selectedError.updated_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Meta fields */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
              {selectedError.environment && (
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Environment</p>
                  <span className={`inline-flex px-2.5 py-1 text-sm font-medium rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedError.environment}
                  </span>
                </div>
              )}
              {selectedError.user_id && (
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User ID</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedError.user_id}</p>
                </div>
              )}
              {selectedError.url && (
                <div className="sm:col-span-2">
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>URL</p>
                  <p className={`text-sm break-all ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedError.url}</p>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Message</p>
                <CopyButton text={selectedError.message} darkMode={darkMode} />
              </div>
              <div className={`rounded-xl p-4 border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                {selectedError.message || 'N/A'}
              </div>
            </div>

            {/* Stack Trace */}
            {selectedError.stack_trace && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stack Trace</p>
                  <CopyButton text={selectedError.stack_trace} darkMode={darkMode} />
                </div>
                <pre className={`rounded-xl p-4 border text-xs overflow-x-auto whitespace-pre-wrap break-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {selectedError.stack_trace}
                </pre>
              </div>
            )}

            {/* Context / extra data */}
            {selectedError.context && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Context</p>
                  <CopyButton
                    text={typeof selectedError.context === 'string' ? selectedError.context : JSON.stringify(selectedError.context, null, 2)}
                    darkMode={darkMode}
                  />
                </div>
                <pre className={`rounded-xl p-4 border text-xs overflow-x-auto whitespace-pre-wrap break-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {typeof selectedError.context === 'string' ? selectedError.context : JSON.stringify(selectedError.context, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <CopyButton
              darkMode={darkMode}
              text={[
                `Level: ${selectedError.level ?? 'N/A'}`,
                `Timestamp: ${formatTimestamp(selectedError.timestamp)}`,
                selectedError.environment ? `Environment: ${selectedError.environment}` : null,
                selectedError.url ? `URL: ${selectedError.url}` : null,
                `Message: ${selectedError.message ?? 'N/A'}`,
                selectedError.stack_trace ? `\nStack Trace:\n${selectedError.stack_trace}` : null,
                selectedError.context
                  ? `\nContext:\n${typeof selectedError.context === 'string' ? selectedError.context : JSON.stringify(selectedError.context, null, 2)}`
                  : null,
              ].filter(Boolean).join('\n')}
            />
            <button
              onClick={() => setShowViewModal(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Errors;

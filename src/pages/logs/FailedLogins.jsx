import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiChevronLeft, FiChevronRight,
  FiShield, FiAlertCircle, FiEye, FiX,
  FiUser, FiLock, FiUserX, FiCalendar, FiMonitor
} from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';

const REASON_META = {
  user_not_found:       { label: 'User Not Found',      color: { dark: 'bg-gray-700 text-gray-300',       light: 'bg-gray-100 text-gray-700'       }, icon: FiUserX  },
  wrong_password:       { label: 'Wrong Password',       color: { dark: 'bg-red-900/40 text-red-300',       light: 'bg-red-100 text-red-800'          }, icon: FiLock   },
  account_suspended:    { label: 'Account Suspended',    color: { dark: 'bg-orange-900/40 text-orange-300', light: 'bg-orange-100 text-orange-800'    }, icon: FiShield },
  invalid_credentials:  { label: 'Invalid Credentials',  color: { dark: 'bg-yellow-900/40 text-yellow-300', light: 'bg-yellow-100 text-yellow-800'   }, icon: FiAlertCircle },
};

const reasonMeta = (reason, darkMode) => {
  const meta = REASON_META[reason] ?? REASON_META.invalid_credentials;
  return { ...meta, colorClass: darkMode ? meta.color.dark : meta.color.light };
};

const formatTimestamp = (ts) => {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const FailedLogins = () => {
  const darkMode = useDarkMode();
  const [searchTerm, setSearchTerm]     = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [data, setData]                 = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selected, setSelected]         = useState(null);
  const itemsPerPage = 15;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [attemptsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/failed-login-attempts?per_page=500`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/api/failed-login-attempts/stats`, { headers: getAuthHeaders() }),
        ]);

        if (attemptsRes.status === 401 || statsRes.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/';
          return;
        }

        const attemptsJson = await attemptsRes.json();
        const statsJson    = await statsRes.json();

        if (attemptsJson.success && Array.isArray(attemptsJson.data?.data ?? attemptsJson.data)) {
          setData(attemptsJson.data?.data ?? attemptsJson.data);
        } else {
          throw new Error(attemptsJson.message || 'Invalid response format');
        }

        if (statsJson.success) setStats(statsJson.data);
      } catch (err) {
        console.error('Error fetching failed login attempts:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.email?.toLowerCase().includes(term) ||
      item.ip_address?.toLowerCase().includes(term);
    const matchesReason = reasonFilter === 'all' || item.reason === reasonFilter;
    return matchesSearch && matchesReason;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated  = filtered.slice(startIndex, startIndex + itemsPerPage);

  const cardBase = `${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className={`relative ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-stone-100'} rounded-xl shadow-card p-4 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6`}>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`} />
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Failed Login Attempts</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Monitor and investigate unsuccessful authentication attempts</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Attempts',    value: stats?.total      ?? data.length, icon: FiShield,      iconColor: 'text-red-600'    },
          { label: 'Today',             value: stats?.today      ?? '—',         icon: FiCalendar,    iconColor: 'text-blue-600'   },
          { label: 'This Week',         value: stats?.this_week  ?? '—',         icon: FiAlertCircle, iconColor: 'text-orange-600' },
          { label: 'This Month',        value: stats?.this_month ?? '—',         icon: FiMonitor,     iconColor: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, iconColor }) => (
          <div key={label} className={cardBase}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              </div>
              <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border`}>
        {/* Controls */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by email or IP address..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <select
              value={reasonFilter}
              onChange={(e) => { setReasonFilter(e.target.value); setCurrentPage(1); }}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Reasons</option>
              {Object.entries(REASON_META).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-gray-300' : 'border-gray-900'} mx-auto`} />
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading failed login attempts…</p>
          </div>
        )}

        {/* Error */}
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
                  {['#', 'Timestamp', 'Email', 'IP Address', 'Reason', 'User Agent', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-6 py-12 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No failed login attempts found
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => {
                    const { label, colorClass, icon: ReasonIcon } = reasonMeta(item.reason, darkMode);
                    return (
                      <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {formatTimestamp(item.attempted_at)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          <span className="flex items-center gap-1.5">
                            <FiUser className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {item.email}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.ip_address ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
                            <ReasonIcon className="w-3.5 h-3.5" />
                            {label}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-[200px] truncate`}>
                          <span title={item.user_agent}>
                            {item.user_agent ? (item.user_agent.length > 40 ? item.user_agent.slice(0, 40) + '…' : item.user_agent) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelected(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                            }`}
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
              Showing <span className="font-medium">{startIndex + 1}</span>–
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of{' '}
              <span className="font-medium">{filtered.length}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let p;
                if (totalPages <= 5)            p = i + 1;
                else if (currentPage <= 3)      p = i + 1;
                else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                else p = currentPage - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === p
                        ? 'bg-gray-900 text-white border-gray-900'
                        : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className={`relative z-10 w-full max-w-lg rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Attempt Details</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{selected.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Email',       value: selected.email,                icon: FiUser      },
                { label: 'IP Address',  value: selected.ip_address ?? '—',     icon: FiMonitor   },
                { label: 'Timestamp',   value: formatTimestamp(selected.attempted_at), icon: FiCalendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{value}</p>
                  </div>
                </div>
              ))}

              <div className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <FiLock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Reason</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-semibold rounded-full ${reasonMeta(selected.reason, darkMode).colorClass}`}>
                    {reasonMeta(selected.reason, darkMode).label}
                  </span>
                </div>
              </div>

              {selected.user_agent && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-medium uppercase mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>User Agent</p>
                  <p className={`text-xs break-all ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selected.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedLogins;

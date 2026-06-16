import React, { useEffect, useMemo, useState } from 'react';
import { FiMail, FiX } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import ActionMenu from '../../components/ActionMenu';
import { showDeleteConfirm, showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Admin: edit contact info, view/delete inquiries, stats.
 * Same as /faq/support when logged in. Also available under Setup → FAQ Contact Support.
 */
const FaqContactSupportAdmin = () => {
  const { logout } = useAuth();

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: '',
    support_hours: '',
  });
  const [contactInfoLoading, setContactInfoLoading] = useState(true);
  const [contactInfoSaving, setContactInfoSaving] = useState(false);
  const [contactInfoError, setContactInfoError] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [submissionsQuery, setSubmissionsQuery] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    last_24h: 0,
    last_7d: 0,
    top_categories: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const refreshAuthToken = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/api/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const payload = await res.json().catch(() => ({}));
    const newToken = payload?.data?.token || payload?.token;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      return newToken;
    }
    return null;
  };

  const fetchWithAuthRetry = async (url, options = {}, retry = true) => {
    const res = await fetch(url, options);
    if (res.status !== 401 || !retry) return res;

    const refreshed = await refreshAuthToken();
    if (!refreshed) return res;

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...getAuthHeaders(),
      },
    });
  };

  const loadContactInfo = async () => {
    setContactInfoLoading(true);
    setContactInfoError('');
    try {
      const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/faq-contact-info`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to load contact info');

      const data = payload?.data || {};
      setContactInfo({
        email: data.email ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        support_hours: data.support_hours ?? '',
      });
    } catch (e) {
      setContactInfoError(e?.message || 'Failed to load contact info');
    } finally {
      setContactInfoLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    setSubmissionsError('');
    try {
      const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/faq-contact-submissions?limit=20`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to load submissions');

      setSubmissions(payload?.data || []);
    } catch (e) {
      setSubmissionsError(e?.message || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/faq-contact-submissions/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to load statistics');

      const data = payload?.data || {};
      setStats({
        total: data.total ?? 0,
        last_24h: data.last_24h ?? 0,
        last_7d: data.last_7d ?? 0,
        top_categories: Array.isArray(data.top_categories) ? data.top_categories : [],
      });
    } catch (e) {
      setStatsError(e?.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadContactInfo();
    loadSubmissions();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubmissions = useMemo(() => {
    const q = submissionsQuery.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => {
      const blob = `${s.name || ''} ${s.email || ''} ${s.subject || ''} ${s.category || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [submissions, submissionsQuery]);

  const handleSaveContactInfo = async () => {
    setContactInfoSaving(true);
    setContactInfoError('');
    try {
      const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/faq-contact-info`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(contactInfo),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to save contact info');

      await loadContactInfo();
    } catch (e) {
      setContactInfoError(e?.message || 'Failed to save contact info');
    } finally {
      setContactInfoSaving(false);
    }
  };

  const handleDeleteSubmission = async (id, displayName = 'this enquiry') => {
    try {
      const confirmResult = await showDeleteConfirm(displayName, 'Enquiry');
      if (!confirmResult?.isConfirmed) return;

      const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/faq-contact-submissions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to delete submission');

      showSuccessToast('Enquiry deleted successfully!', 'delete');
      await loadSubmissions();
      await loadStats();
    } catch (e) {
      showErrorDialog(e?.message || 'Failed to delete submission');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={FiMail}
        title="Contact Support"
        subtitle="Manage contact details + review customer inquiries"
        accentColor="bg-green-600"
        className="mb-0"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-5">
          <p className="text-sm text-gray-500">Total Inquiries</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? '...' : stats.total}</p>
        </div>
        <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-5">
          <p className="text-sm text-gray-500">Last 24 Hours</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? '...' : stats.last_24h}</p>
        </div>
        <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-5">
          <p className="text-sm text-gray-500">Last 7 Days</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{statsLoading ? '...' : stats.last_7d}</p>
        </div>
        <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-5">
          <p className="text-sm text-gray-500">Top Category</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {statsLoading
              ? '...'
              : stats.top_categories?.[0]?.category
                ? `${stats.top_categories[0].category}`
                : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {statsLoading ? '' : stats.top_categories?.[0]?.count ? `${stats.top_categories[0].count} inquiries` : ''}
          </p>
        </div>
      </div>

      {statsError && <p className="text-red-600 text-sm">{statsError}</p>}

      <div className="space-y-6">
        {/* Inquiries first — full width */}
        <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="font-semibold text-gray-900">Inquiries Received</h3>
            <input
              type="text"
              value={submissionsQuery}
              onChange={(e) => setSubmissionsQuery(e.target.value)}
              placeholder="Search by name, email, subject, category..."
              className="w-full sm:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {submissionsError && <p className="text-red-600 text-sm mb-4">{submissionsError}</p>}

          {submissionsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-stone-300 bg-white">
              <table className="w-full text-sm table-fixed min-w-[720px] border-collapse">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 px-2 w-[5%] border border-stone-300 bg-stone-200/70 font-semibold">
                      S/N
                    </th>
                    <th className="py-2 px-2 w-[14%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Name
                    </th>
                    <th className="py-2 px-2 w-[17%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Email
                    </th>
                    <th className="py-2 px-2 w-[13%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Category
                    </th>
                    <th className="py-2 px-2 w-[13%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Subject
                    </th>
                    <th className="py-2 px-2 w-[18%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Message
                    </th>
                    <th className="py-2 px-2 w-[9%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Date
                    </th>
                    <th className="py-2 px-2 w-[10%] border border-stone-300 bg-stone-200/70 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length ? (
                    filteredSubmissions.map((s, idx) => (
                      <tr key={s.id} className="bg-white even:bg-stone-50/80">
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 font-medium text-gray-900 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.name || '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.email || '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.category || '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.subject || '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.message
                            ? `${s.message.slice(0, 60)}${s.message.length > 60 ? '...' : ''}`
                            : '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300 text-gray-700 truncate whitespace-nowrap overflow-hidden min-w-0">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-2 border border-stone-300">
                          <ActionMenu
                            item={s}
                            actions={[
                              {
                                type: 'view',
                                label: 'View',
                                onClick: (item) => {
                                  setSelectedSubmission(item);
                                  setShowSubmissionModal(true);
                                },
                              },
                              {
                                type: 'delete',
                                label: 'Delete',
                                onClick: (item) => {
                                  handleDeleteSubmission(item.id, item.name || item.email || 'this enquiry');
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-6 px-2 text-center text-gray-500 border border-stone-300 bg-white"
                      >
                        No inquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contact information + preview below inquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-stone-100 rounded-xl shadow-sm border border-stone-300 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-stone-300">
              <h3 className="font-semibold text-gray-900">Contact Information</h3>
              {!contactInfoLoading && (
                <button
                  type="button"
                  onClick={handleSaveContactInfo}
                  disabled={contactInfoSaving}
                  className="shrink-0 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-60 text-sm sm:text-base"
                >
                  {contactInfoSaving ? 'Saving...' : 'Save Contact Info'}
                </button>
              )}
            </div>

            {contactInfoError && <p className="text-red-600 text-sm mb-4">{contactInfoError}</p>}

            {contactInfoLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200/80 rounded-lg" />
                <div className="h-10 bg-gray-200/80 rounded-lg" />
                <div className="h-24 bg-gray-200/80 rounded-lg md:col-span-1" />
                <div className="h-24 bg-gray-200/80 rounded-lg md:col-span-1" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  />
                </div>

                <div className="md:min-h-[120px] flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo((p) => ({ ...p, address: e.target.value }))}
                    rows="4"
                    className="w-full flex-1 min-h-[6.5rem] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y bg-white"
                  />
                </div>

                <div className="md:min-h-[120px] flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Hours</label>
                  <textarea
                    value={contactInfo.support_hours}
                    onChange={(e) => setContactInfo((p) => ({ ...p, support_hours: e.target.value }))}
                    rows="4"
                    className="w-full flex-1 min-h-[6.5rem] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 h-fit">
            <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
            <p className="text-blue-800 text-sm">
              <span className="font-medium">Email:</span> {contactInfo.email || '—'}
              <br />
              <span className="font-medium">Phone:</span> {contactInfo.phone || '—'}
              <br />
              <span className="font-medium">Address:</span> {contactInfo.address || '—'}
            </p>
          </div>
        </div>
      </div>

      {showSubmissionModal && selectedSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowSubmissionModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-stone-100 border-stone-300 dark:bg-gray-900 dark:border-gray-700 overflow-hidden border-b flex items-center justify-between px-6 py-4">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-gray-900 dark:bg-stone-100 rounded-r-full"></div>
              <div className="pl-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inquiry Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSubmission.created_at ? new Date(selectedSubmission.created_at).toLocaleString() : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmissionModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900 dark:text-white">{selectedSubmission.name || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 dark:text-white">{selectedSubmission.email || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-gray-900 dark:text-white">{selectedSubmission.category || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Subject</p>
                <p className="text-gray-900 dark:text-white">{selectedSubmission.subject || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Message</p>
                <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedSubmission.message || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqContactSupportAdmin;

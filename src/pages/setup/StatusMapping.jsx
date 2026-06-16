import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSliders, FiLoader, FiAlertCircle, FiX, FiCheck, FiSearch,
  FiSave, FiRefreshCw, FiLayers, FiTrendingUp, FiTag
} from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';

/**
 * Status Mapping
 * Manage which statuses belong to which status categories (groups).
 */
const StatusMapping = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  // ------- data -------
  const [groups,       setGroups]       = useState([]);
  const [allStatuses,  setAllStatuses]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ------- modal state -------
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);   // full group object
  const [selected,     setSelected]     = useState([]);    // array of status ids
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');

  // ------- fetch -------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grpRes, stsRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/api/status-groups?per_page=100`),
        apiFetch(`${API_BASE_URL}/api/statuses/all`),
      ]);
      const [grpJson, stsJson] = await Promise.all([grpRes.json(), stsRes.json()]);
      if (!grpRes.ok) throw new Error(grpJson.message || 'Failed to load status groups');
      if (!stsRes.ok) throw new Error(stsJson.message || 'Failed to load statuses');

      setGroups(grpJson.data?.data ?? grpJson.data ?? []);
      setAllStatuses(stsJson.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ------- modal helpers -------
  const openModal = (group) => {
    setEditingGroup(group);
    setSelected((group.statuses ?? []).map((s) => s.id));
    setSaveError(null);
    setSearchQuery('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGroup(null);
    setSelected([]);
    setSaveError(null);
  };

  const toggleStatus = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!editingGroup) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res  = await apiFetch(
        `${API_BASE_URL}/api/status-groups/${editingGroup.id}/statuses`,
        {
          method: 'PUT',
          body:   JSON.stringify({ status_ids: selected }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save mapping');

      // Update the group in the list
      setGroups((prev) =>
        prev.map((g) => (g.id === editingGroup.id ? json.data : g))
      );
      closeModal();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ------- filtered statuses in modal -------
  const filteredStatuses = allStatuses.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ------- UI helpers -------
  const card   = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-stone-300';
  const text   = darkMode ? 'text-gray-100' : 'text-gray-900';
  const muted  = darkMode ? 'text-gray-400' : 'text-gray-500';
  const border = darkMode ? 'border-gray-700' : 'border-gray-200';
  const input  = darkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const statsCards = [
    { label: 'Total Categories', value: groups.length,                                             icon: FiLayers,     iconColor: 'blue-600'   },
    { label: 'Total Statuses',   value: allStatuses.length,                                         icon: FiTag,        iconColor: 'violet-600' },
    { label: 'Mapped Entries',   value: groups.reduce((s, g) => s + (g.statuses?.length ?? 0), 0), icon: FiTrendingUp, iconColor: 'orange-600' },
  ];

  // ------- render -------
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header — same component as StatusGroups / CRUDPage */}
      <PageHeader
        icon={FiSliders}
        title="Status Mapping"
        subtitle="Assign statuses to categories — click a category card to manage its mapping"
        actions={[
          {
            label: 'Refresh',
            icon: FiRefreshCw,
            onClick: fetchData,
            variant: 'secondary',
            disabled: loading,
            className: loading ? 'animate-spin' : ''
          }
        ]}
      />

      {/* Stats Cards — same component as StatusGroups / CRUDPage */}
      <StatsCards cards={statsCards} />

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)}><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Groups grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : groups.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <FiLayers className={`w-12 h-12 mx-auto mb-3 ${muted}`} />
          <p className={`font-medium ${text}`}>No status categories found</p>
          <p className={`text-sm mt-1 ${muted}`}>
            Create categories in <em>Status Categories</em> first, then map statuses here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`rounded-xl border flex flex-col ${card}`}
            >
              {/* Card header */}
              <div className={`p-4 border-b ${border}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-semibold truncate ${text}`}>{group.name}</p>
                    <p className={`text-xs mt-0.5 ${muted}`}>
                      {group.code}
                      {group.description && (
                        <span className="ml-1 hidden sm:inline">— {group.description}</span>
                      )}
                    </p>
                  </div>

                </div>
              </div>

              {/* Assigned statuses */}
              <div className="p-4 flex-1">
                {(group.statuses ?? []).length === 0 ? (
                  <p className={`text-sm italic ${muted}`}>No statuses mapped yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(group.statuses ?? []).map((s) => (
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
                  </div>
                )}
              </div>

              {/* Edit button */}
              <div className={`p-3 border-t ${border}`}>
                <button
                  onClick={() => openModal(group)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    darkMode
                      ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
                      : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <FiSliders className="w-4 h-4" />
                  Edit Mapping ({(group.statuses ?? []).length})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mapping Modal ─────────────────────────────────────────── */}
      {modalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${border}`}>
              <div>
                <h2 className={`text-base font-semibold ${text}`}>
                  Edit Mapping — {editingGroup.name}
                </h2>
                <p className={`text-xs mt-0.5 ${muted}`}>
                  Select the statuses that belong to this category
                </p>
              </div>
              <button
                onClick={closeModal}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search inside modal */}
            <div className={`px-5 py-3 border-b ${border}`}>
              <div className="relative">
                <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter statuses…"
                  className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${input}`}
                />
              </div>
              <p className={`text-xs mt-2 ${muted}`}>
                {selected.length} of {allStatuses.length} selected
              </p>
            </div>

            {/* Status list */}
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
              {filteredStatuses.length === 0 ? (
                <p className={`text-sm text-center py-6 ${muted}`}>No statuses match your search</p>
              ) : (
                filteredStatuses.map((s) => {
                  const checked = selected.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer select-none items-center gap-3 rounded-lg p-2.5 transition-colors ${
                        checked
                          ? darkMode ? 'bg-emerald-950/40' : 'bg-emerald-50'
                          : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStatus(s.id)}
                        className="h-4 w-4 cursor-pointer rounded text-emerald-600"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {s.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                        )}
                        <span className={`text-sm font-medium truncate ${text}`}>{s.name}</span>
                        <span className={`text-xs ${muted} flex-shrink-0`}>{s.code}</span>
                      </div>
                      {checked && <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />}
                    </label>
                  );
                })
              )}
            </div>

            {/* Save error */}
            {saveError && (
              <div className="mx-5 mb-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {saveError}
              </div>
            )}

            {/* Modal footer */}
            <div className={`flex items-center justify-between gap-3 px-5 py-4 border-t ${border}`}>
              <button
                onClick={closeModal}
                disabled={saving}
                className={`rounded-xl border px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  darkMode
                    ? 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  darkMode
                    ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
                    : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                }`}
              >
                {saving ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                {saving ? 'Saving…' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusMapping;

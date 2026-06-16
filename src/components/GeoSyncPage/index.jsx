/**
 * GeoSyncPage — Reusable 3-tab SIS geo-entity page
 *
 * Used by: Region (level 2), Council (level 3), Ward (level 4),
 *          Street/Village (level 5)  — and any future level.
 *
 * Config shape:
 * {
 *   icon            : ReactComponent   — icon used on rows and page header
 *   title           : string           — page title  e.g. "Councils"
 *   subtitle        : string           — page subtitle
 *   entityName      : string           — singular  e.g. "council"
 *   entityNamePlural: string           — plural    e.g. "councils"
 *   listColumnHeader: string           — DataTable column header e.g. "Council"
 *   apiBase         : string           — REST base  e.g. "/api/councils"
 *   syncApiBase     : string           — sync base  e.g. "/api/sis/sync/councils"
 *   viewFields      : Array<{ label, accessor, type? }>
 *   parentConfig?   : {                — optional parent (region) filter
 *     apiBase : string                 —   e.g. "/api/regions/all"
 *     param   : string                 —   query param sent to API e.g. "region_id"
 *     label   : string                 —   dropdown label e.g. "Region"
 *     column  : string                 —   column header e.g. "Region"
 *     accessor: string                 —   field on row e.g. "region_name"
 *   }
 *   extraColumns?   : Array<{          — optional extra table columns after parentConfig column
 *     header  : string                 —   e.g. "Parent Area (SIS)"
 *     accessor: string                 —   field on row e.g. "parent_area"
 *   }>
 * }
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiRefreshCw, FiX, FiAlertCircle, FiCheckCircle,
  FiClock, FiDatabase, FiActivity, FiList, FiZap, FiStopCircle,
  FiLoader, FiTrendingUp, FiAlertTriangle,
  FiEye, FiEyeOff,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import useDarkMode from '../../hooks/useDarkMode';
import useSyncCompleteReload from '../../hooks/useSyncCompleteReload';
import DataTable from '../DataTable';
import ViewModal from '../ViewModal/ViewModal';
import PageHeader from '../PageHeader';
import TableControls from '../TableControls';

/* ─────────────────────────────────────────────
   Sync status badge  (shared across all tabs)
───────────────────────────────────────────── */
const syncStatusConfig = {
  completed: { bg: 'bg-green-100',  text: 'text-green-800',  icon: FiCheckCircle, label: 'Completed' },
  running:   { bg: 'bg-blue-100',   text: 'text-blue-800',   icon: FiActivity,    label: 'Running'   },
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiClock,       label: 'Pending'   },
  failed:    { bg: 'bg-red-100',    text: 'text-red-800',    icon: FiAlertCircle, label: 'Failed'    },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-800',   icon: FiStopCircle,  label: 'Cancelled' },
};

export const SyncStatusBadge = ({ status }) => {
  const cfg  = syncStatusConfig[status?.toLowerCase()] ?? syncStatusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

/* ─────────────────────────────────────────────
   Progress bar  (shared)
───────────────────────────────────────────── */
export const ProgressBar = ({ percent, darkMode }) => (
  <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
    <div
      className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
      style={{ width: `${Math.min(100, percent || 0)}%` }}
    />
  </div>
);

/* ─────────────────────────────────────────────
   TAB 1 — Entity list
───────────────────────────────────────────── */
const GeoListTab = ({ config, darkMode, onTotalChange }) => {
  const {
    icon: EntityIcon,
    listColumnHeader,
    entityName,
    entityNamePlural,
    apiBase,
    viewFields,
    extraColumns,
  } = config;

  // Normalise: support both parentConfig (single, legacy) and parentConfigs (array, multi-parent)
  const parents = config.parentConfigs ?? (config.parentConfig ? [config.parentConfig] : []);

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // One filter value per parent keyed by param name, e.g. { region_id: 'all', council_id: 'all' }
  const [parentFilters, setParentFilters] = useState(
    () => Object.fromEntries(parents.map((p) => [p.param, 'all']))
  );
  // Options list per parent keyed by param name
  const [parentOptionsMap, setParentOptionsMap] = useState(
    () => Object.fromEntries(parents.map((p) => [p.param, []]))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [viewItem, setViewItem]       = useState(null);
  const [showView, setShowView]       = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Cascade lazy-loading:
  //  • parents[0] (e.g. Region) is fetched once on mount — always visible.
  //  • parents[i] (i > 0) is fetched only when parents[i-1] has a non-'all' selection.
  //  • Changing a parent clears all downstream options + resets downstream filter values.

  const prevFiltersRef = useRef(parentFilters);

  // Fetch first parent options on mount
  useEffect(() => {
    const first = parents[0];
    if (!first?.apiBase) return;
    apiFetch(`${API_BASE_URL}${first.apiBase}`)
      .then((r) => r.json())
      .then((json) => {
        const opts = json.data ?? json ?? [];
        setParentOptionsMap((prev) => ({ ...prev, [first.param]: Array.isArray(opts) ? opts : [] }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch filter changes to cascade-fetch next level and clear downstream
  useEffect(() => {
    const prev = prevFiltersRef.current;

    // Find the highest-level parent whose filter just changed
    let changedIndex = -1;
    for (let i = 0; i < parents.length; i++) {
      if (prev[parents[i].param] !== parentFilters[parents[i].param]) {
        changedIndex = i;
        break;
      }
    }
    prevFiltersRef.current = parentFilters;
    if (changedIndex === -1) return;

    // Clear all downstream options and reset their filter values
    const clearedOptions  = {};
    const clearedFilters  = {};
    for (let i = changedIndex + 1; i < parents.length; i++) {
      clearedOptions[parents[i].param] = [];
      clearedFilters[parents[i].param] = 'all';
    }
    if (Object.keys(clearedOptions).length > 0) {
      setParentOptionsMap((p) => ({ ...p, ...clearedOptions }));
      setParentFilters((p)   => ({ ...p, ...clearedFilters }));
    }

    // Fetch next level's options if the changed parent now has a real value
    const nextParent    = parents[changedIndex + 1];
    const selectedValue = parentFilters[parents[changedIndex].param];
    if (!nextParent?.apiBase || selectedValue === 'all') return;

    apiFetch(`${API_BASE_URL}${nextParent.apiBase}?${parents[changedIndex].param}=${selectedValue}`)
      .then((r)    => r.json())
      .then((json) => {
        const opts = json.data ?? json ?? [];
        setParentOptionsMap((p) => ({ ...p, [nextParent.param]: Array.isArray(opts) ? opts : [] }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(parentFilters)]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build active parent filter params (skip 'all' values)
      const activeParentParams = Object.fromEntries(
        Object.entries(parentFilters).filter(([, v]) => v !== 'all')
      );
      const params = new URLSearchParams({
        page:     currentPage,
        per_page: itemsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...activeParentParams,
      });
      const res  = await apiFetch(`${API_BASE_URL}${apiBase}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data?.data ?? json.data ?? [];
      setItems(Array.isArray(data) ? data : []);
      setTotalPages(json.data?.last_page ?? json.meta?.last_page ?? 1);
      const newTotal = json.data?.total ?? json.meta?.total ?? data.length;
      setTotalItems(newTotal);
      onTotalChange?.(newTotal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchQuery, JSON.stringify(parentFilters), apiBase]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, JSON.stringify(parentFilters), itemsPerPage]);

  const handleView = async (row) => {
    setViewLoading(true);
    setShowView(true);
    try {
      const res  = await apiFetch(`${API_BASE_URL}${apiBase}/${row.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setViewItem(json.data ?? json);
    } catch {
      setViewItem(row);
    } finally {
      setViewLoading(false);
    }
  };

  const columns = [
    {
      header: listColumnHeader,
      accessor: 'name',
      render: (row, dm) => (
        <span className={`text-sm font-medium ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{row.name}</span>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      noWrap: true,
      render: (row, dm) => (
        <span className={`text-xs font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
          {row.code ?? '—'}
        </span>
      ),
    },
    // Parent columns (e.g. Region, Council, Ward) — one per entry in parents array
    ...parents.map((p) => ({
      header: p.column,
      accessor: p.accessor,
      noWrap: true,
      render: p.renderCell
        ? p.renderCell
        : (row, dm) => {
            const val = row[p.accessor];
            return val
              ? <span className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{val}</span>
              : <span className="text-xs text-gray-400 italic">—</span>;
          },
    })),
    // Optional extra columns (e.g. parent_area raw string)
    ...(extraColumns ?? []).map((col) => ({
      header: col.header,
      accessor: col.accessor,
      noWrap: true,
      render: (row, dm) => {
        const val = row[col.accessor];
        return val
          ? <span className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{val}</span>
          : <span className="text-xs text-gray-400 italic">—</span>;
      },
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to load {entityNamePlural}</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* TableControls + DataTable — seamless panel matching Users/Permissions design */}
      <div>
        <TableControls
          pagination={{ itemsPerPage, onItemsPerPageChange: setItemsPerPage }}
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search by name or code…' }}
          extraFilters={parents
            // Only show a parent filter when its own parent has a selection
            .filter((p, i) => i === 0 || parentFilters[parents[i - 1].param] !== 'all')
            .map((p) => ({
            label: p.label,
            options: [
              { value: 'all', label: `All ${p.label}s` },
              ...(parentOptionsMap[p.param] ?? []).map((opt) => ({ value: String(opt.id), label: opt.name })),
            ],
            value: String(parentFilters[p.param] ?? 'all'),
            onChange: (v) => setParentFilters((prev) => ({ ...prev, [p.param]: v })),
          }))}
        />
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyState={{
            icon: EntityIcon,
            title: `No ${entityNamePlural} found`,
            description: `Run a SIS sync to import ${entityNamePlural}, or adjust your filters.`,
          }}
          actions={[
            { type: 'view', label: 'View Details', onClick: handleView },
          ]}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: (p) => setCurrentPage(p),
          }}
        />
      </div>

      {/* View Modal */}
      <ViewModal
        isOpen={showView}
        onClose={() => { setShowView(false); setViewItem(null); }}
        item={viewLoading ? {} : (viewItem ?? {})}
        title={listColumnHeader}
        icon={EntityIcon}
        fields={viewFields}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   TAB 2 — SIS Sync control & live status
───────────────────────────────────────────── */
const SisSyncPanel = ({ config, darkMode }) => {
  const { entityNamePlural, syncApiBase } = config;

  const [status, setStatus]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]                 = useState(null);
  const [pageSize, setPageSize]           = useState(10);
  const [fresh, setFresh]                 = useState(false);
  const [showControls, setShowControls]   = useState(true);
  const pollRef         = useRef(null);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res  = await apiFetch(`${API_BASE_URL}${syncApiBase}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStatus(json.data ?? json);
    } catch (err) {
      if (!err.message?.includes('404')) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [syncApiBase]);

  useEffect(() => {
    fetchStatus();
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  useEffect(() => {
    pollRef.current = setInterval(() => fetchStatus(true), 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  const handleStart = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res  = await apiFetch(`${API_BASE_URL}${syncApiBase}`, {
        method: 'POST',
        body:   JSON.stringify({ page_size: pageSize, fresh }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const rawLog = status?.sync_logs ?? status?.sync_log ?? null;
    const log    = Array.isArray(rawLog) ? (rawLog[rawLog.length - 1] ?? null) : rawLog;
    if (!log?.id) return;
    setActionLoading(true);
    setError(null);
    try {
      const res  = await apiFetch(
        `${API_BASE_URL}${syncApiBase}/${log.id}/cancel`,
        { method: 'POST' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const rawLog  = status?.sync_logs ?? status?.sync_log ?? null;
  const log     = Array.isArray(rawLog) ? (rawLog[rawLog.length - 1] ?? null) : rawLog;
  const batch   = status?.batch ?? null;

  // Reload page once when sync transitions from running → completed/failed/cancelled
  useSyncCompleteReload(log?.status);

  const computedProgress = log?.total_pages > 0
    ? Math.round(((log.processed_pages ?? 0) / log.total_pages) * 100)
    : 0;
  const progress  = (log?.status === 'completed' || batch?.finished)
    ? 100
    : (status?.progress || batch?.progress || computedProgress);
  const isActive  = ['running', 'pending'].includes(log?.status?.toLowerCase());

  // Auto-hide controls while syncing; auto-show when done
  useEffect(() => {
    setShowControls(!isActive);
  }, [isActive]);

  const statCards = log
    ? [
        { label: 'Total Records', value: log.total_records?.toLocaleString()                             ?? '—', icon: FiDatabase,      color: 'text-indigo-600'  },
        { label: 'Total Pages',   value: log.total_pages?.toLocaleString()                              ?? '—', icon: FiList,          color: 'text-blue-600'    },
        { label: 'Processed',     value: (log.processed_pages ?? batch?.processed_jobs)?.toLocaleString() ?? '—', icon: FiCheckCircle, color: 'text-green-600'   },
        { label: 'Records Saved', value: log.inserted_records?.toLocaleString()                          ?? '—', icon: FiTrendingUp,   color: 'text-emerald-600' },
        { label: 'Failed Pages',  value: (log.failed_pages ?? batch?.failed_jobs)?.toLocaleString()      ?? '—', icon: FiAlertTriangle,color: 'text-red-500'     },
        { label: 'Progress',      value: `${progress}%`,                                                         icon: FiActivity,     color: 'text-orange-500'  },
      ]
    : [];

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)}><FiX className="w-4 h-4" /></button>
        </div>
      )}

      {/* Control panel */}
      <div className={`rounded-xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-stone-300'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <FiZap className="w-4 h-4 text-yellow-500" /> Sync Controls
            {isActive && (
              <span className="text-xs font-normal text-blue-500 animate-pulse ml-1">• in progress</span>
            )}
          </h3>
          <button
            onClick={() => setShowControls((v) => !v)}
            title={showControls ? 'Hide controls' : 'Show controls to cancel sync'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showControls ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
            {showControls ? 'Hide' : 'Show'}
          </button>
        </div>
        {showControls && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                disabled={isActive || actionLoading}
                className={`px-3 py-2 border rounded-lg text-sm disabled:opacity-50 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {[10, 50, 100, 200, 500, 1000].map((n) => (
                  <option key={n} value={n}>{n} records/page</option>
                ))}
              </select>
            </div>
            <label className={`flex items-center gap-2 pb-2 cursor-pointer select-none ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={fresh}
                onChange={(e) => setFresh(e.target.checked)}
                disabled={isActive || actionLoading}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-sm">Fresh start (cancel running sync)</span>
            </label>
            <div className="flex gap-2 sm:ml-auto">
              {isActive ? (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiStopCircle className="w-4 h-4" />}
                  Cancel Sync
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={actionLoading || loading || isActive}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiZap className="w-4 h-4" />}
                  Start Sync
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status card */}
      <div className={`rounded-xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-stone-300'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <FiActivity className="w-4 h-4 text-indigo-500" /> Current Sync Status
          </h3>
          {log && <SyncStatusBadge status={log.status} />}
        </div>

        {loading && !log && (
          <div className="flex items-center gap-3 text-gray-500 py-4">
            <FiLoader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading status…</span>
          </div>
        )}

        {!loading && !log && !error && (
          <p className={`text-sm py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No sync has been run yet. Press <strong>Start Sync</strong> to pull {entityNamePlural} from SIS.
          </p>
        )}

        {log && (
          <>
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {isActive ? 'Syncing in progress…' : 'Progress'}
                </span>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{progress}%</span>
              </div>
              <ProgressBar percent={progress} darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`rounded-lg p-3 border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-50 border-stone-200'}`}>
                  <Icon className={`w-4 h-4 ${color} mb-1`} />
                  <div className={`text-lg font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
                  <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{label}</div>
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {[
                ['Sync Log ID',   `#${log.id}`],
                ['Batch ID',      batch?.id ? `${batch.id.slice(0, 16)}…` : '—'],
                ['Started At',    log.started_at  ? new Date(log.started_at).toLocaleString()  : '—'],
                ['Finished At',   log.finished_at ? new Date(log.finished_at).toLocaleString() : 'Not finished'],
                ['Page Size',     log.page_size   ?? '—'],
                ['Records Saved', log.inserted_records?.toLocaleString() ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-medium w-32 flex-shrink-0">{k}:</span>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-mono`}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   TAB 3 — Sync history
───────────────────────────────────────────── */
const SyncHistoryPanel = ({ config, darkMode }) => {
  const { syncApiBase, entityNamePlural } = config;

  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await apiFetch(
        `${API_BASE_URL}${syncApiBase}/history?per_page=15&page=${currentPage}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json  = await res.json();
      const items = json.data?.data ?? json.data ?? json ?? [];
      setHistory(Array.isArray(items) ? items : []);
      setTotalPages(json.data?.last_page ?? json.last_page ?? 1);
      setTotalItems(json.data?.total    ?? json.total    ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, syncApiBase]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const columns = [
    {
      header: '#',
      accessor: 'id',
      noWrap: true,
      render: (row, dm) => (
        <span className={`text-sm font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>#{row.id}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      noWrap: true,
      render: (row) => <SyncStatusBadge status={row.status} />,
    },
    {
      header: 'Records',
      accessor: 'total_records',
      noWrap: true,
      render: (row, dm) => (
        <div className="text-sm">
          <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>
            {row.total_records?.toLocaleString() ?? '—'}
          </div>
          <div className="text-xs text-gray-500">{row.inserted_records?.toLocaleString() ?? 0} saved</div>
        </div>
      ),
    },
    {
      header: 'Pages',
      accessor: 'total_pages',
      noWrap: true,
      render: (row, dm) => (
        <div className="text-sm">
          <div className={`${dm ? 'text-gray-200' : 'text-gray-800'}`}>
            {(row.processed_pages ?? 0).toLocaleString()} / {(row.total_pages ?? 0).toLocaleString()}
          </div>
          {(row.failed_pages ?? 0) > 0 && (
            <div className="text-xs text-red-500">{(row.failed_pages).toLocaleString()} failed</div>
          )}
        </div>
      ),
    },
    {
      header: 'Page Size',
      accessor: 'page_size',
      noWrap: true,
      render: (row, dm) => (
        <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
          {row.page_size?.toLocaleString() ?? '—'}
        </span>
      ),
    },
    {
      header: 'Started',
      accessor: 'started_at',
      noWrap: true,
      render: (row, dm) => (
        <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
          {row.started_at ? new Date(row.started_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Finished',
      accessor: 'finished_at',
      noWrap: true,
      render: (row, dm) => (
        <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
          {row.finished_at ? new Date(row.finished_at).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Past SIS sync runs for {entityNamePlural} — most recent first.
        </p>
        <button
          onClick={fetchHistory}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={history}
        loading={loading}
        emptyState={{
          icon: FiClock,
          title: 'No sync history',
          description: `No SIS sync runs for ${entityNamePlural} have been recorded yet.`,
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: 15,
          onPageChange: (p) => setCurrentPage(p),
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   ROOT — GeoSyncPage
───────────────────────────────────────────── */
const GeoSyncPage = ({ config }) => {
  const darkMode                        = useDarkMode();
  const [activeTab, setActiveTab]       = useState('list');
  const [listTotal, setListTotal]       = useState(0);
  const { icon: EntityIcon, title, subtitle, entityNamePlural, apiBase, syncApiBase } = config;

  const listTabLabel = listTotal > 0 ? `${title} — ${listTotal.toLocaleString()}` : title;

  const TABS = [
    { id: 'list',    label: listTabLabel,   icon: EntityIcon },
    ...(syncApiBase ? [
      { id: 'sync',    label: 'SIS Sync',     icon: FiZap   },
      { id: 'history', label: 'Sync History', icon: FiClock },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={EntityIcon}
        title={title}
        subtitle={subtitle}
        className="!mb-0"
      />

      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-stone-300'}`}>
        {/* Tab bar */}
        <div className={`flex border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-stone-50 border-stone-300'}`}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? `border-indigo-500 text-indigo-600 ${darkMode ? 'bg-gray-900' : 'bg-white'}`
                  : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={`p-5 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {activeTab === 'list'    && <GeoListTab        config={config} darkMode={darkMode} onTotalChange={setListTotal} />}
          {activeTab === 'sync'    && <SisSyncPanel      config={config} darkMode={darkMode} />}
          {activeTab === 'history' && <SyncHistoryPanel  config={config} darkMode={darkMode} />}
        </div>
      </div>
    </div>
  );
};

export default GeoSyncPage;

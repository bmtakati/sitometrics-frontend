import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPrinter, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { showQuickError, showQuickSuccess } from '../../utils/dialogUtils';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  printing: 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  printed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  failed: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-200',
};

const formatWhen = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const PrintJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [outlets, setOutlets] = useState([]);
  const [status, setStatus] = useState('');
  const [outletId, setOutletId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const outletOptions = useMemo(
    () => [
      { value: '', label: 'All outlets' },
      ...outlets.map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` })),
    ],
    [outlets]
  );

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'printing', label: 'Printing' },
    { value: 'printed', label: 'Printed' },
    { value: 'failed', label: 'Failed' },
  ];

  const loadOutlets = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/outlets/all`);
      const json = await res.json().catch(() => ({}));
      setOutlets(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setOutlets([]);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        per_page: '20',
      });
      if (status) qs.set('status', status);
      if (outletId) qs.set('outlet_id', outletId);

      const res = await apiFetch(`${API_BASE_URL}/api/thermal-print-jobs?${qs.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to load print jobs');
      }
      setJobs(Array.isArray(json?.data) ? json.data : []);
      setMeta(json?.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch (error) {
      showQuickError('Could not load print jobs', error.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, outletId]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const timer = setInterval(loadJobs, 8000);
    return () => clearInterval(timer);
  }, [loadJobs]);

  const handleRetry = async (jobId) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/thermal-print-jobs/${jobId}/retry`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || 'Retry failed');
      }
      showQuickSuccess(json?.message || 'Job re-queued for the local agent');
      await loadJobs();
    } catch (error) {
      showQuickError('Retry failed', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiPrinter}
        title="Print Jobs"
        subtitle="Thermal print queue for the local LAN agent — pending jobs print when the agent is online"
        actions={[
          {
            label: loading ? 'Refreshing…' : 'Refresh',
            icon: FiRefreshCw,
            onClick: loadJobs,
          },
        ]}
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <SearchableSelect
            options={statusOptions}
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
            placeholder="Filter status…"
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <SearchableSelect
            options={outletOptions}
            value={outletId}
            onChange={(value) => {
              setPage(1);
              setOutletId(value);
            }}
            placeholder="Filter outlet…"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500 dark:bg-stone-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Outlet</th>
              <th className="px-4 py-3">Printer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Printed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-stone-100 dark:border-stone-800">
                <td className="px-4 py-3 font-medium">#{job.id}</td>
                <td className="px-4 py-3 capitalize">{job.job_type}</td>
                <td className="px-4 py-3">#{job.document_id}</td>
                <td className="px-4 py-3">{job.outlet?.name || '—'}</td>
                <td className="px-4 py-3">
                  {job.printer_host
                    ? `${job.printer_host}${job.printer_port ? `:${job.printer_port}` : ''}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[job.status] || 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {job.status}
                  </span>
                  {job.error_message ? (
                    <p className="mt-1 max-w-xs text-xs text-red-600 dark:text-red-400">{job.error_message}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatWhen(job.created_at)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatWhen(job.printed_at)}</td>
                <td className="px-4 py-3 text-right">
                  {['failed', 'printed'].includes(job.status) ? (
                    <button
                      type="button"
                      onClick={() => handleRetry(job.id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <FiRotateCcw /> Retry
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!jobs.length && !loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                  No print jobs yet. Print an order or bill to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          {meta.total || 0} job{(meta.total || 0) === 1 ? '' : 's'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2 py-1.5">
            Page {meta.current_page || page} / {meta.last_page || 1}
          </span>
          <button
            type="button"
            disabled={page >= (meta.last_page || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintJobs;

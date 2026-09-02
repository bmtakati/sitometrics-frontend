import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiFileText, FiRefreshCw, FiTruck } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { exportToExcel } from '../../utils/exportUtils';
import { fetchHotelsForReport, resolveReportHotel } from '../../utils/reportHotel';
import { formatReportDate } from '../../utils/formatDate';
import { formatMoney } from '../../utils/formatMoney';
import { downloadSuppliersReportPdf, fetchSuppliersReport } from '../../utils/suppliersReportApi';

const todayInputValue = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const monthStartInputValue = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-01`;
};

const toExportRows = (suppliers = []) =>
  suppliers.map((row) => ({
    code: row.code,
    name: row.name,
    phone: row.phone || '—',
    email: row.email || '—',
    tin: row.tin || '—',
    status: row.status || '—',
    catalog_items: row.catalog_items ?? 0,
    lpo_count: row.lpo_count ?? 0,
    lpo_value: row.lpo_value ?? 0,
    last_lpo_date: row.last_lpo_date ? formatReportDate(row.last_lpo_date) : '—',
  }));

const SuppliersReport = () => {
  const [dateFrom, setDateFrom] = useState(monthStartInputValue);
  const [dateTo, setDateTo] = useState(todayInputValue);
  const [status, setStatus] = useState('all');
  const [report, setReport] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuppliersReport({ dateFrom, dateTo, status });
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status]);

  useEffect(() => {
    reload();
    fetchHotelsForReport().then(setHotels);
  }, [reload]);

  const suppliers = report?.suppliers || [];
  const summary = report?.summary || {};
  const recentLpos = report?.recent_lpos || [];
  const exportRows = toExportRows(suppliers);

  const handleExport = async (format) => {
    if (!exportRows.length) return;
    setExporting(format);
    try {
      const title = 'Suppliers Report';
      const subtitle = `${formatReportDate(dateFrom)} — ${formatReportDate(dateTo)} · ${status === 'all' ? 'All suppliers' : `${status} only`}`;
      const hotel = resolveReportHotel({ hotels });
      const exportOptions = { hotel, subtitle };

      if (format === 'pdf') {
        await downloadSuppliersReportPdf({ dateFrom, dateTo, status });
      } else {
        await exportToExcel(title, exportRows, exportOptions);
      }
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/reports" className="rounded-lg border p-2 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800">
          <FiArrowLeft />
        </Link>
        <div className="flex-1">
          <PageHeader
            icon={FiTruck}
            title="Suppliers Report"
            subtitle="Supplier directory with catalog items and purchase order activity"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-stone-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-stone-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-stone-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800"
          >
            <option value="all">All suppliers</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
        <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white dark:bg-stone-100 dark:text-stone-900">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Apply
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={!exportRows.length || exporting}
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
          >
            <FiFileText /> {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
          <button
            type="button"
            disabled={!exportRows.length || exporting}
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 disabled:opacity-50"
          >
            <FiDownload /> {exporting === 'excel' ? 'Exporting…' : 'Excel'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Suppliers', value: summary.supplier_count ?? 0 },
          { label: 'Catalog items', value: summary.catalog_items ?? 0 },
          { label: 'LPOs in period', value: summary.lpo_count ?? 0 },
          { label: 'LPO value', value: formatMoney(summary.lpo_value ?? 0) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 className="font-semibold">Suppliers ({suppliers.length})</h2>
          <p className="text-xs text-stone-500">
            LPO activity: {formatReportDate(dateFrom)} — {formatReportDate(dateTo)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">TIN</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">LPOs</th>
                <th className="px-4 py-2 text-right">LPO value</th>
                <th className="px-4 py-2">Last LPO</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length ? (
                suppliers.map((row) => (
                  <tr key={row.id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-4 py-2 font-medium">{row.code}</td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2">
                      <p>{row.phone || '—'}</p>
                      <p className="text-xs text-stone-400">{row.email || '—'}</p>
                    </td>
                    <td className="px-4 py-2">{row.tin || '—'}</td>
                    <td className="px-4 py-2">{row.status || '—'}</td>
                    <td className="px-4 py-2">{row.catalog_items}</td>
                    <td className="px-4 py-2">{row.lpo_count}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(row.lpo_value)}</td>
                    <td className="px-4 py-2">{row.last_lpo_date ? formatReportDate(row.last_lpo_date) : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                    {loading ? 'Loading suppliers…' : 'No suppliers found for the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 className="font-semibold">Recent purchase orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">LPO</th>
                <th className="px-4 py-2">Supplier</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {recentLpos.length ? (
                recentLpos.map((row) => (
                  <tr key={row.code} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-4 py-2 font-medium">{row.code}</td>
                    <td className="px-4 py-2">{row.supplier || '—'}</td>
                    <td className="px-4 py-2">{row.order_date ? formatReportDate(row.order_date) : '—'}</td>
                    <td className="px-4 py-2">{row.workflow_status}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(row.total_value)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">No purchase orders in this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuppliersReport;

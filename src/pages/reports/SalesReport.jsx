import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiDownload, FiFileText, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { exportToExcel } from '../../utils/exportUtils';
import { fetchHotelsForReport, resolveReportHotel } from '../../utils/reportHotel';
import { formatReportDate, formatReportDateTime } from '../../utils/formatDate';
import { formatMoney } from '../../utils/formatMoney';
import { downloadSalesReportPdf, fetchSalesReport } from '../../utils/salesReportApi';

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

const toExportRows = (orders = []) =>
  orders.map((order) => ({
    order_no: order.order_no || order.code,
    outlet: order.outlet?.name || '—',
    table: order.table?.table_number || '—',
    waiter: order.waiter?.full_name || '—',
    closed_at: order.closed_at ? formatReportDateTime(order.closed_at) : '—',
    payment_status: order.payment_status || '—',
    payment_method: order.payment_method?.name || '—',
    items: order.items_count ?? order.items?.length ?? 0,
    total: order.total ?? 0,
  }));

const SalesReport = () => {
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [dateFrom, setDateFrom] = useState(monthStartInputValue);
  const [dateTo, setDateTo] = useState(todayInputValue);
  const [report, setReport] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/outlets/all`)
      .then((res) => res.json())
      .then((json) => setOutlets(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setOutlets([]));
    fetchHotelsForReport().then(setHotels);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSalesReport({
        outletId: outletId || null,
        dateFrom,
        dateTo,
      });
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [outletId, dateFrom, dateTo]);

  useEffect(() => {
    reload();
  }, [reload]);

  const outletOptions = useMemo(
    () => [{ value: '', label: 'All outlets' }, ...outlets.map((row) => ({ value: String(row.id), label: row.name }))],
    [outlets]
  );

  const orders = report?.orders || [];
  const summary = report?.summary || {};
  const topItems = report?.top_items || [];
  const paymentBreakdown = summary.by_payment_method || [];

  const exportRows = useMemo(() => toExportRows(orders), [orders]);

  const handleExport = async (format) => {
    if (!exportRows.length) return;
    setExporting(format);
    try {
      const title = 'Sales Report';
      const subtitle = `${formatReportDate(dateFrom)} — ${formatReportDate(dateTo)}${outletId ? ` · ${outletOptions.find((o) => o.value === outletId)?.label || 'Outlet'}` : ' · All outlets'}`;
      const hotel = resolveReportHotel({ outletId, outlets, hotels });
      const exportOptions = { hotel, subtitle };

      if (format === 'pdf') {
        await downloadSalesReportPdf({ outletId, dateFrom, dateTo });
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
            icon={FiBarChart2}
            title="Sales Report"
            subtitle="Closed order sales filtered by outlet and date range"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="min-w-[220px]">
          <label className="mb-1 block text-xs font-medium uppercase text-stone-500">Outlet</label>
          <SearchableSelect options={outletOptions} value={outletId} onChange={setOutletId} placeholder="All outlets…" />
        </div>
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
          { label: 'Orders', value: summary.order_count ?? 0 },
          { label: 'Total sales', value: formatMoney(summary.total_amount ?? 0) },
          { label: 'Paid', value: formatMoney(summary.paid_amount ?? 0), hint: `${summary.paid_count ?? 0} orders` },
          { label: 'Unpaid', value: formatMoney(summary.unpaid_amount ?? 0), hint: `${summary.unpaid_count ?? 0} orders` },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
            {card.hint ? <p className="mt-1 text-xs text-stone-400">{card.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <h2 className="font-semibold">Sales by payment method</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Orders</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentBreakdown.length ? (
                  paymentBreakdown.map((row) => (
                    <tr key={row.payment_method} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-4 py-2">{row.payment_method}</td>
                      <td className="px-4 py-2">{row.order_count}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatMoney(row.total_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-500">No paid sales in this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <h2 className="font-semibold">Top selling items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length ? (
                  topItems.map((row) => (
                    <tr key={row.description} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="px-4 py-2">{row.description}</td>
                      <td className="px-4 py-2">{row.quantity_sold}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatMoney(row.total_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-stone-500">No item sales in this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 className="font-semibold">Orders ({orders.length})</h2>
          <p className="text-xs text-stone-500">
            {formatReportDate(dateFrom)} — {formatReportDate(dateTo)}
            {outletId ? ` · ${outletOptions.find((o) => o.value === outletId)?.label || 'Outlet'}` : ' · All outlets'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">Order no</th>
                <th className="px-4 py-2">Outlet</th>
                <th className="px-4 py-2">Table</th>
                <th className="px-4 py-2">Waiter</th>
                <th className="px-4 py-2">Closed</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-4 py-2 font-medium">{order.order_no || order.code}</td>
                    <td className="px-4 py-2">{order.outlet?.name || '—'}</td>
                    <td className="px-4 py-2">{order.table?.table_number || '—'}</td>
                    <td className="px-4 py-2">{order.waiter?.full_name || '—'}</td>
                    <td className="px-4 py-2">{order.closed_at ? formatReportDateTime(order.closed_at) : '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          order.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{order.payment_method?.name || '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(order.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                    {loading ? 'Loading sales…' : 'No sales found for the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;

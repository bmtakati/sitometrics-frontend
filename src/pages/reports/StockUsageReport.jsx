import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiBox, FiCalendar, FiRefreshCw, FiTrendingDown } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/SearchableSelect';
import { StatsCards } from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import apiFetch from '../../utils/apiFetch';
import { API_BASE_URL } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';
import { fetchStockUsageReport } from '../../utils/stockUsageReportApi';

const today = new Date().toISOString().slice(0, 10);
const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const formatMoney = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00';
};

const StockUsageReport = () => {
  const darkMode = useDarkMode();
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  const [storeId, setStoreId] = useState('');
  const [itemId, setItemId] = useState('');
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const storeOptions = useMemo(() => [
    { value: '', label: 'All stores' },
    ...stores.map((store) => ({ value: String(store.id), label: store.code ? `${store.name} (${store.code})` : store.name })),
  ], [stores]);

  const itemOptions = useMemo(() => [
    { value: '', label: 'All items' },
    ...items.map((item) => ({ value: String(item.id), label: item.code ? `${item.name} (${item.code})` : item.name })),
  ], [items]);

  const loadReport = async () => {
    setLoading(true);
    try {
      setReport(await fetchStockUsageReport({ dateFrom, dateTo, storeId, itemId }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storeRes, itemRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/stores/all`),
          apiFetch(`${API_BASE_URL}/api/items/all`),
        ]);
        const [storeJson, itemJson] = await Promise.all([
          storeRes.json().catch(() => ({})),
          itemRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        setStores(Array.isArray(storeJson?.data) ? storeJson.data : []);
        setItems(Array.isArray(itemJson?.data) ? itemJson.data : []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setItems([]);
        }
      }
    })();
    loadReport();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputClass = `h-10 rounded-md border px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
    darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`;

  const itemColumns = [
    { header: 'Item', accessor: 'item_name', render: (row) => <div><div className="font-medium">{row.item_name || '-'}</div><div className="text-xs text-gray-500">{row.item_code || ''}</div></div> },
    { header: 'Movements', accessor: 'movement_count', noWrap: true },
    { header: 'Used Qty', accessor: 'used_quantity', noWrap: true, render: (row) => `${formatNumber(row.used_quantity)} ${row.base_unit || ''}` },
    { header: 'Usage Value', accessor: 'usage_value', noWrap: true, render: (row) => formatMoney(row.usage_value) },
  ];

  const movementColumns = [
    { header: 'Date', accessor: 'transaction_date', noWrap: true, render: (row) => row.transaction_date ? new Date(row.transaction_date).toLocaleString() : '-' },
    { header: 'Item', accessor: 'item', render: (row) => row.item?.name || '-' },
    { header: 'Store', accessor: 'store', render: (row) => row.store?.code ? `${row.store.name} (${row.store.code})` : row.store?.name || '-' },
    { header: 'Type', accessor: 'movement_type', noWrap: true },
    { header: 'Qty', accessor: 'base_quantity', noWrap: true, render: (row) => `${formatNumber(row.base_quantity)} ${row.item?.base_unit || ''}` },
    { header: 'Value', accessor: 'usage_value', noWrap: true, render: (row) => formatMoney(row.usage_value) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiTrendingDown}
        title="Stock Usage Report"
        subtitle="Analyze consumed, issued, transferred out, and adjustment-out stock movements"
        actions={[
          { label: 'Back', icon: FiArrowLeft, onClick: () => window.history.back(), variant: 'secondary' },
          { label: 'Refresh', icon: FiRefreshCw, onClick: loadReport, variant: 'secondary' },
        ]}
      />

      <div className={`rounded-lg border p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className={`${inputClass} w-full pl-9`} type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div className="relative">
            <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className={`${inputClass} w-full pl-9`} type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <SearchableSelect options={storeOptions} value={storeId} onChange={setStoreId} placeholder="All stores" darkMode={darkMode} />
          <SearchableSelect options={itemOptions} value={itemId} onChange={setItemId} placeholder="All items" darkMode={darkMode} />
          <button type="button" onClick={loadReport} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700">
            <FiBarChart2 className="h-4 w-4" />
            Run Report
          </button>
        </div>
      </div>

      <StatsCards
        cards={[
          { label: 'Usage Movements', value: formatNumber(report?.summary?.movement_count), icon: FiTrendingDown, iconColor: 'red-600' },
          { label: 'Items Used', value: formatNumber(report?.summary?.item_count), icon: FiBox, iconColor: 'blue-600' },
          { label: 'Stores', value: formatNumber(report?.summary?.store_count), icon: FiBarChart2, iconColor: 'indigo-600' },
          { label: 'Usage Value', value: formatMoney(report?.summary?.usage_value), icon: FiTrendingDown, iconColor: 'green-600' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h2 className={`mb-3 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Usage By Item</h2>
          <DataTable data={report?.items || []} columns={itemColumns} loading={loading} emptyState={{ title: 'No Usage', description: 'No item usage found for the selected filters.' }} />
        </div>
        <div>
          <h2 className={`mb-3 text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Recent Usage Movements</h2>
          <DataTable data={report?.movements || []} columns={movementColumns} loading={loading} emptyState={{ title: 'No Movements', description: 'No usage movements found for the selected filters.' }} />
        </div>
      </div>

      <Link to="/reports" className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to reports
      </Link>
    </div>
  );
};

export default StockUsageReport;

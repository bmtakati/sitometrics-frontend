import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiActivity,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiBox,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiRotateCcw,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import SearchableSelect from '../../components/SearchableSelect';
import { StatsCards } from '../../components/StatsCard';
import apiFetch from '../../utils/apiFetch';
import { API_BASE_URL } from '../../context/AuthContext';
import useDarkMode from '../../hooks/useDarkMode';

const movementTypeOptions = [
  { value: '', label: 'All transactions' },
  { value: 'GRN', label: 'Goods Received Note' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'PURCHASE_RETURN', label: 'Purchase Return' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'ISSUE_RETURN', label: 'Issue Return' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'ADJUSTMENT_IN', label: 'Adjustment In' },
  { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out' },
  { value: 'CONSUMPTION', label: 'Consumption' },
  { value: 'OPENING_BALANCE', label: 'Opening Balance' },
  { value: 'STOCK_TAKE', label: 'Stock Take' },
];

const directionOptions = [
  { value: '', label: 'All directions' },
  { value: 'IN', label: 'Stock In' },
  { value: 'OUT', label: 'Stock Out' },
];

const defaultFilters = {
  search: '',
  item_id: '',
  store_id: '',
  movement_type: '',
  direction: '',
  date_from: '',
  date_to: '',
};

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const titleCase = (value) => String(value || '')
  .replaceAll('_', ' ')
  .toLowerCase()
  .replace(/\b\w/g, (match) => match.toUpperCase());

const unitLabel = (movement) => movement?.item_unit?.unit?.symbol
  || movement?.item_unit?.unit?.name
  || movement?.itemUnit?.unit?.symbol
  || movement?.itemUnit?.unit?.name
  || '';

const baseUnitLabel = (movement) => movement?.item?.base_unit?.symbol
  || movement?.item?.base_unit?.name
  || movement?.item?.baseUnit?.symbol
  || movement?.item?.baseUnit?.name
  || movement?.item?.unit?.symbol
  || movement?.item?.unit?.name
  || '';

const creatorName = (movement) => {
  const person = movement?.creator?.person;
  const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(' ');
  return fullName || movement?.creator?.name || movement?.creator?.email || movement?.created_by || '-';
};

const referenceTypeLabels = {
  GoodsReceivedNote: 'GRN',
  StoreIssue: 'Store Issue',
  WaiterOrder: 'Waiter Order',
  WaiterOrderItem: 'Waiter Order',
  StockAdjustment: 'Stock Adjustment',
  StockCountSession: 'Stock Count',
  BarTransaction: 'Bar Transaction',
  Menu: 'Menu',
  MenuItem: 'Menu Item',
};

const referenceLabel = (movement) => {
  const rawType = String(movement?.reference_type || '').split('\\').pop();
  if (!rawType && !movement?.reference_id && !movement?.reference_no) {
    return 'Reference';
  }

  const type = referenceTypeLabels[rawType] || titleCase(rawType || 'Reference');
  const number = movement?.reference_no || movement?.reference_id;

  return number ? `${type} #${number}` : type;
};

const StockMovementHistory = () => {
  const darkMode = useDarkMode();
  const [searchParams] = useSearchParams();
  const initialFilters = {
    ...defaultFilters,
    item_id: searchParams.get('item_id') || '',
    store_id: searchParams.get('store_id') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    movement_type: searchParams.get('movement_type') || '',
    direction: searchParams.get('direction') || '',
    search: searchParams.get('search') || '',
  };
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, itemsPerPage: 15, totalItems: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadMovements = async (page = 1, overrides = {}) => {
    setLoading(true);
    try {
      const nextFilters = { ...filters, ...overrides };
      const perPage = Number(overrides.per_page || meta.itemsPerPage || 15);
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value && key !== 'per_page') params.set(key, value);
      });

      const response = await apiFetch(`${API_BASE_URL}/api/stock-movements?${params.toString()}`);
      const json = await response.json().catch(() => ({}));
      const apiMeta = json?.meta || {};

      setRows(Array.isArray(json?.data) ? json.data : []);
      setMeta({
        currentPage: apiMeta.current_page || page,
        itemsPerPage: apiMeta.per_page || perPage,
        totalItems: apiMeta.total || 0,
        totalPages: apiMeta.last_page || 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [itemRes, storeRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/items/all`),
          apiFetch(`${API_BASE_URL}/api/stores/all`),
        ]);
        const [itemJson, storeJson] = await Promise.all([
          itemRes.json().catch(() => ({})),
          storeRes.json().catch(() => ({})),
        ]);

        if (cancelled) return;
        setItems(Array.isArray(itemJson?.data) ? itemJson.data : []);
        setStores(Array.isArray(storeJson?.data) ? storeJson.data : []);
      } catch {
        if (!cancelled) {
          setItems([]);
          setStores([]);
        }
      }
    })();

    loadMovements(1, initialFilters);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemOptions = useMemo(() => [
    { value: '', label: 'All items' },
    ...items.map((item) => ({
      value: String(item.id),
      label: item.code ? `${item.name} (${item.code})` : item.name,
    })),
  ], [items]);

  const storeOptions = useMemo(() => [
    { value: '', label: 'All stores' },
    ...stores.map((store) => ({
      value: String(store.id),
      label: store.code ? `${store.name} (${store.code})` : store.name,
    })),
  ], [stores]);

  const pageTotals = useMemo(() => {
    const stockIn = rows
      .filter((row) => row.direction === 'IN')
      .reduce((sum, row) => sum + Number(row.base_quantity ?? Math.abs(row.quantity || 0)), 0);
    const stockOut = rows
      .filter((row) => row.direction === 'OUT')
      .reduce((sum, row) => sum + Number(row.base_quantity ?? Math.abs(row.quantity || 0)), 0);

    return {
      movements: meta.totalItems,
      stockIn,
      stockOut,
      net: stockIn - stockOut,
    };
  }, [rows, meta.totalItems]);

  const handleApplyFilters = () => loadMovements(1);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    loadMovements(1, defaultFilters);
  };

  const fieldClass = `h-10 rounded-md border px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
    darkMode
      ? 'border-gray-700 bg-gray-900 text-gray-100 placeholder:text-gray-500'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
  }`;

  const columns = [
    {
      header: 'Date',
      accessor: 'transaction_date',
      noWrap: true,
      render: (row) => (
        <div className="text-sm">
          <div className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
            {row.transaction_date ? new Date(row.transaction_date).toLocaleDateString() : '-'}
          </div>
          <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {row.transaction_date ? new Date(row.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Item',
      accessor: 'item_id',
      render: (row) => (
        <div className="min-w-[180px]">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {row.item?.name || `Item #${row.item_id}`}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.item?.code || ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Store',
      accessor: 'store_id',
      noWrap: true,
      render: (row) => row.store?.code ? `${row.store.name} (${row.store.code})` : (row.store?.name || row.store_id || '-'),
    },
    {
      header: 'Transaction',
      accessor: 'movement_type',
      noWrap: true,
      render: (row) => (
        <div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
          }`}>
            {titleCase(row.movement_type)}
          </span>
          <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {referenceLabel(row)}
          </div>
        </div>
      ),
    },
    {
      header: 'Entered Qty',
      accessor: 'transaction_quantity',
      noWrap: true,
      render: (row) => `${formatNumber(row.transaction_quantity ?? Math.abs(row.quantity || 0))} ${unitLabel(row)}`,
    },
    {
      header: 'Conversion',
      accessor: 'conversion_factor',
      noWrap: true,
      render: (row) => `1:${formatNumber(row.conversion_factor ?? 1)}`,
    },
    {
      header: 'Base Qty',
      accessor: 'base_quantity',
      noWrap: true,
      render: (row) => {
        const qty = Number(row.base_quantity ?? Math.abs(row.quantity || 0));
        const sign = row.direction === 'OUT' ? '-' : '+';
        const color = row.direction === 'OUT'
          ? darkMode ? 'text-red-300' : 'text-red-700'
          : darkMode ? 'text-emerald-300' : 'text-emerald-700';

        return <span className={`font-semibold tabular-nums ${color}`}>{sign}{formatNumber(qty)} {baseUnitLabel(row)}</span>;
      },
    },
    {
      header: 'Direction',
      accessor: 'direction',
      noWrap: true,
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          row.direction === 'OUT'
            ? darkMode ? 'bg-red-950/40 text-red-300' : 'bg-red-50 text-red-700'
            : darkMode ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {row.direction === 'OUT' ? <FiArrowDownCircle className="h-3.5 w-3.5" /> : <FiArrowUpCircle className="h-3.5 w-3.5" />}
          {row.direction || '-'}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessor: 'balance_after',
      noWrap: true,
      render: (row) => row.balance_after == null ? '-' : `${formatNumber(row.balance_after)} ${baseUnitLabel(row)}`,
    },
    {
      header: 'User',
      accessor: 'created_by',
      noWrap: true,
      render: creatorName,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FiActivity}
        title="Stock Movements"
        subtitle="Audit posted inventory movements in transaction units and base stock units"
        actions={[
          {
            label: 'Refresh',
            icon: loading ? FiRefreshCw : FiActivity,
            onClick: () => loadMovements(meta.currentPage || 1),
            variant: 'secondary',
          },
        ]}
      />

      <StatsCards
        cards={[
          { label: 'Movements', value: formatNumber(pageTotals.movements), icon: FiActivity, iconColor: 'blue-600' },
          { label: 'Page Stock In', value: formatNumber(pageTotals.stockIn), icon: FiArrowUpCircle, iconColor: 'green-600' },
          { label: 'Page Stock Out', value: formatNumber(pageTotals.stockOut), icon: FiArrowDownCircle, iconColor: 'red-600' },
          { label: 'Page Net', value: formatNumber(pageTotals.net), icon: FiBox, iconColor: pageTotals.net < 0 ? 'red-600' : 'indigo-600' },
        ]}
      />

      <div className={`rounded-lg border p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className={fieldClass}
            type="search"
            placeholder="Search item, store, reference..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <SearchableSelect
            options={itemOptions}
            value={filters.item_id}
            onChange={(value) => updateFilter('item_id', value)}
            placeholder="All items"
            darkMode={darkMode}
          />
          <SearchableSelect
            options={storeOptions}
            value={filters.store_id}
            onChange={(value) => updateFilter('store_id', value)}
            placeholder="All stores"
            darkMode={darkMode}
          />
          <SearchableSelect
            options={movementTypeOptions}
            value={filters.movement_type}
            onChange={(value) => updateFilter('movement_type', value)}
            placeholder="All transactions"
            darkMode={darkMode}
          />
          <SearchableSelect
            options={directionOptions}
            value={filters.direction}
            onChange={(value) => updateFilter('direction', value)}
            placeholder="All directions"
            darkMode={darkMode}
          />
          <div className="relative">
            <FiCalendar className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              className={`${fieldClass} w-full pl-9`}
              type="date"
              value={filters.date_from}
              onChange={(event) => updateFilter('date_from', event.target.value)}
            />
          </div>
          <div className="relative">
            <FiCalendar className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              className={`${fieldClass} w-full pl-9`}
              type="date"
              value={filters.date_to}
              onChange={(event) => updateFilter('date_to', event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
            >
              <FiFilter className="h-4 w-4" />
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className={`inline-flex h-10 items-center justify-center rounded-md border px-3 ${
                darkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Reset filters"
            >
              <FiRotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        pagination={{
          ...meta,
          onPageChange: loadMovements,
          onItemsPerPageChange: (next) => {
            setMeta((prev) => ({ ...prev, itemsPerPage: next }));
            loadMovements(1, { per_page: next });
          },
        }}
        emptyState={{ title: 'No Stock Movements', description: 'Posted inventory movements will appear here.' }}
      />
    </div>
  );
};

export default StockMovementHistory;

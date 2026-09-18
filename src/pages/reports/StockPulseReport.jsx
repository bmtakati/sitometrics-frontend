import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowLeft, FiBox, FiLayers, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import InventoryReportFilters, { formatReportNumber } from '../../components/reports/InventoryReportFilters';
import useDarkMode from '../../hooks/useDarkMode';
import { fetchStockPulseReport, stockMovementsPath } from '../../utils/inventoryReportApi';

const today = new Date().toISOString().slice(0, 10);

const StockPulseReport = () => {
  const darkMode = useDarkMode();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: today,
    categoryId: '',
    storeId: '',
    itemId: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const loadReport = async () => {
    setLoading(true);
    try {
      setReport(await fetchStockPulseReport({
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        category_id: filters.categoryId,
        store_id: filters.storeId,
        item_id: filters.itemId,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      header: 'Item',
      accessor: 'item_name',
      render: (row) => (
        <div>
          <div className="font-medium">{row.item_name || '-'}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{row.item_code || ''}</div>
        </div>
      ),
    },
    { header: 'Category', accessor: 'category_name', noWrap: true, render: (row) => row.category_name || '-' },
    {
      header: 'Store',
      accessor: 'store_name',
      noWrap: true,
      render: (row) => (row.store_code ? `${row.store_name} (${row.store_code})` : row.store_name || '-'),
    },
    {
      header: 'On Hand',
      accessor: 'quantity',
      noWrap: true,
      render: (row) => (
        <span className={row.is_below_reorder ? (darkMode ? 'text-amber-300 font-semibold' : 'text-amber-700 font-semibold') : ''}>
          {formatReportNumber(row.quantity)} {row.base_unit || ''}
        </span>
      ),
    },
    {
      header: 'Reorder',
      accessor: 'reorder_level',
      noWrap: true,
      render: (row) => `${formatReportNumber(row.reorder_level)} ${row.base_unit || ''}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiActivity}
        title="Stock Pulse"
        subtitle="Live available stock by store and item, with filters for category and date range"
        actions={[
          { label: 'Back', icon: FiArrowLeft, onClick: () => window.history.back(), variant: 'secondary' },
          { label: 'Refresh', icon: FiRefreshCw, onClick: loadReport, variant: 'secondary' },
        ]}
      />

      <InventoryReportFilters
        darkMode={darkMode}
        values={filters}
        onChange={updateFilter}
        onRun={loadReport}
        showDates
      />

      <StatsCards
        cards={[
          { label: 'Stock Lines', value: formatReportNumber(report?.summary?.line_count), icon: FiLayers, iconColor: 'blue-600' },
          { label: 'Items', value: formatReportNumber(report?.summary?.item_count), icon: FiBox, iconColor: 'indigo-600' },
          { label: 'Stores', value: formatReportNumber(report?.summary?.store_count), icon: FiActivity, iconColor: 'emerald-600' },
          { label: 'Below Reorder', value: formatReportNumber(report?.summary?.below_reorder_count), icon: FiAlertTriangle, iconColor: 'amber-600' },
        ]}
      />

      <DataTable
        data={report?.rows || []}
        columns={columns}
        loading={loading}
        actions={[
          {
            label: 'Movements',
            icon: FiActivity,
            onClick: (row) => navigate(stockMovementsPath({
              itemId: row.item_id,
              storeId: row.store_id,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
            })),
          },
        ]}
        emptyState={{ title: 'No Stock On Hand', description: 'No available stock matched the selected filters.' }}
      />

      <Link to="/reports" className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to reports
      </Link>
    </div>
  );
};

export default StockPulseReport;

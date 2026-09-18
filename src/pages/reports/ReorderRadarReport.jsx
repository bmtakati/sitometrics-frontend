import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiAlertTriangle, FiArrowLeft, FiBox, FiLayers, FiRefreshCw, FiTrendingDown } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import InventoryReportFilters, { formatReportNumber } from '../../components/reports/InventoryReportFilters';
import useDarkMode from '../../hooks/useDarkMode';
import { fetchReorderRadarReport, stockMovementsPath } from '../../utils/inventoryReportApi';

const statusTone = (status, darkMode) => {
  if (status === 'OUT') return darkMode ? 'bg-red-950/40 text-red-300' : 'bg-red-50 text-red-700';
  if (status === 'CRITICAL') return darkMode ? 'bg-orange-950/40 text-orange-300' : 'bg-orange-50 text-orange-700';
  return darkMode ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-700';
};

const ReorderRadarReport = () => {
  const darkMode = useDarkMode();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
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
      setReport(await fetchReorderRadarReport({
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
      render: (row) => `${formatReportNumber(row.quantity)} ${row.base_unit || ''}`,
    },
    {
      header: 'Threshold',
      accessor: 'threshold',
      noWrap: true,
      render: (row) => `${formatReportNumber(row.threshold)} ${row.base_unit || ''}`,
    },
    {
      header: 'Shortfall',
      accessor: 'shortfall',
      noWrap: true,
      render: (row) => `${formatReportNumber(row.shortfall)} ${row.base_unit || ''}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      noWrap: true,
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(row.status, darkMode)}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiTrendingDown}
        title="Reorder Radar"
        subtitle="Items at or below reorder / minimum levels so you can replenish before stockouts"
        actions={[
          { label: 'Back', icon: FiArrowLeft, onClick: () => window.history.back(), variant: 'secondary' },
          { label: 'Refresh', icon: FiRefreshCw, onClick: loadReport, variant: 'secondary' },
        ]}
      />

      <InventoryReportFilters darkMode={darkMode} values={filters} onChange={updateFilter} onRun={loadReport} />

      <StatsCards
        cards={[
          { label: 'Lines At Risk', value: formatReportNumber(report?.summary?.line_count), icon: FiAlertTriangle, iconColor: 'amber-600' },
          { label: 'Out of Stock', value: formatReportNumber(report?.summary?.out_of_stock_count), icon: FiTrendingDown, iconColor: 'red-600' },
          { label: 'Critical', value: formatReportNumber(report?.summary?.critical_count), icon: FiBox, iconColor: 'orange-600' },
          { label: 'Stores', value: formatReportNumber(report?.summary?.store_count), icon: FiLayers, iconColor: 'indigo-600' },
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
            onClick: (row) => navigate(stockMovementsPath({ itemId: row.item_id, storeId: row.store_id })),
          },
        ]}
        emptyState={{ title: 'Stock Looks Healthy', description: 'No items are currently at or below reorder / minimum levels.' }}
      />

      <Link to="/reports" className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to reports
      </Link>
    </div>
  );
};

export default ReorderRadarReport;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiBox, FiClock, FiLayers, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import InventoryReportFilters, { formatReportNumber } from '../../components/reports/InventoryReportFilters';
import useDarkMode from '../../hooks/useDarkMode';
import { fetchExpiryWatchReport, stockMovementsPath } from '../../utils/inventoryReportApi';

const ExpiryWatchReport = () => {
  const darkMode = useDarkMode();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    categoryId: '',
    storeId: '',
    itemId: '',
    daysAhead: 30,
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const loadReport = async () => {
    setLoading(true);
    try {
      setReport(await fetchExpiryWatchReport({
        category_id: filters.categoryId,
        store_id: filters.storeId,
        item_id: filters.itemId,
        days_ahead: filters.daysAhead,
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
    { header: 'GRN', accessor: 'grn_code', noWrap: true, render: (row) => row.grn_code || '-' },
    { header: 'Batch', accessor: 'batch_no', noWrap: true, render: (row) => row.batch_no || '-' },
    {
      header: 'Expires',
      accessor: 'expiry_date',
      noWrap: true,
      render: (row) => (
        <div>
          <div className={darkMode ? 'text-amber-300 font-medium' : 'text-amber-700 font-medium'}>
            {row.expiry_date || '-'}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.days_to_expiry == null ? '' : `in ${row.days_to_expiry} day(s)`}
          </div>
        </div>
      ),
    },
    {
      header: 'Received Qty',
      accessor: 'base_quantity',
      noWrap: true,
      render: (row) => `${formatReportNumber(row.base_quantity)} ${row.base_unit || ''}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FiClock}
        title="Expiry Watch"
        subtitle="Batches approaching expiry within your selected horizon"
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
        showDaysAhead
      />

      <StatsCards
        cards={[
          { label: 'Lots At Risk', value: formatReportNumber(report?.summary?.line_count), icon: FiAlertTriangle, iconColor: 'amber-600' },
          { label: 'Items', value: formatReportNumber(report?.summary?.item_count), icon: FiBox, iconColor: 'blue-600' },
          { label: 'Stores', value: formatReportNumber(report?.summary?.store_count), icon: FiLayers, iconColor: 'indigo-600' },
          { label: 'Horizon (days)', value: formatReportNumber(report?.summary?.days_ahead || filters.daysAhead), icon: FiClock, iconColor: 'orange-600' },
        ]}
      />

      <DataTable
        data={report?.rows || []}
        columns={columns}
        loading={loading}
        actions={[
          {
            label: 'Movements',
            onClick: (row) => navigate(stockMovementsPath({ itemId: row.item_id, storeId: row.store_id })),
          },
        ]}
        emptyState={{ title: 'Nothing Near Expiry', description: 'No approved batches expire inside the selected horizon.' }}
      />

      <Link to="/reports" className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to reports
      </Link>
    </div>
  );
};

export default ExpiryWatchReport;

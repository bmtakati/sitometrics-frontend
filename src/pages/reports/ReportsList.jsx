import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiAlertOctagon,
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiTrendingDown,
  FiTruck,
} from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import TableControls from '../../components/TableControls';
import useDarkMode from '../../hooks/useDarkMode';

const reports = [
  {
    id: 'sales',
    name: 'Sales Report',
    description: 'Closed order sales by outlet and date range with payment breakdown and top items',
    icon: FiDollarSign,
    category: 'Finance',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/sales',
  },
  {
    id: 'suppliers',
    name: 'Suppliers Report',
    description: 'Supplier directory with agreed items and local purchase order activity by date range',
    icon: FiTruck,
    category: 'Procurement',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/suppliers',
  },
  {
    id: 'stock-usage',
    name: 'Stock Usage Report',
    description: 'Usage by item and store from issued, consumed, transferred-out, and adjustment-out stock movements',
    icon: FiTrendingDown,
    category: 'Inventory',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/stock-usage',
  },
  {
    id: 'stock-pulse',
    name: 'Stock Pulse',
    description: 'Available stock on hand by store and item, with category filters and drill-down to movements',
    icon: FiActivity,
    category: 'Inventory',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/stock-pulse',
  },
  {
    id: 'past-expiry',
    name: 'Past Expiry',
    description: 'Approved GRN batches that have already expired and need write-off or quarantine review',
    icon: FiAlertOctagon,
    category: 'Inventory',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/past-expiry',
  },
  {
    id: 'expiry-watch',
    name: 'Expiry Watch',
    description: 'Batches approaching expiry within a configurable horizon so you can rotate stock early',
    icon: FiClock,
    category: 'Inventory',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/expiry-watch',
  },
  {
    id: 'reorder-radar',
    name: 'Reorder Radar',
    description: 'Low-running items at or below reorder and minimum levels across stores',
    icon: FiAlertTriangle,
    category: 'Inventory',
    lastUpdated: new Date().toISOString().slice(0, 10),
    path: '/reports/reorder-radar',
  },
];

const ReportsList = () => {
  const darkMode = useDarkMode();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const categoryOptions = useMemo(() => [
    { label: 'All Categories', value: 'all' },
    ...Array.from(new Set(reports.map((report) => report.category)))
      .sort()
      .map((name) => ({ label: name, value: name })),
  ], []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesCategory = category === 'all' || report.category === category;
      const matchesSearch = !query
        || report.name.toLowerCase().includes(query)
        || report.description.toLowerCase().includes(query)
        || report.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, searchTerm]);

  const columns = [
    {
      header: 'Report',
      accessor: 'name',
      render: (row) => {
        const Icon = row.icon || FiFileText;
        return (
          <div className="flex min-w-[220px] items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              darkMode ? 'border-stone-700 bg-stone-800 text-emerald-300' : 'border-stone-200 bg-stone-50 text-emerald-700'
            }`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className={`font-semibold ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>{row.name}</div>
              <div className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{row.id}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Description',
      accessor: 'description',
      minWidth: 360,
      render: (row) => (
        <span className={darkMode ? 'text-stone-300' : 'text-stone-600'}>
          {row.description}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      noWrap: true,
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          darkMode ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-700'
        }`}>
          {row.category}
        </span>
      ),
    },
    {
      header: 'Updated',
      accessor: 'lastUpdated',
      noWrap: true,
      render: (row) => new Date(row.lastUpdated).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FiFileText}
        title="Reports"
        subtitle="View and export system reports"
      />

      <TableControls
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search reports...',
        }}
        filter={{
          options: categoryOptions,
          value: category,
          onChange: setCategory,
        }}
      />

      <DataTable
        columns={columns}
        data={filteredReports}
        emptyState={{
          icon: FiFileText,
          title: 'No Reports Found',
          description: 'Try changing your search or category filter.',
        }}
        pagination={{
          currentPage: 1,
          totalPages: 1,
          totalItems: filteredReports.length,
          itemsPerPage: filteredReports.length || 10,
          onPageChange: () => {},
        }}
        actions={[
          {
            type: 'view',
            label: 'View Report',
            icon: FiEye,
            onClick: (row) => navigate(row.path),
          },
        ]}
      />
    </div>
  );
};

export default ReportsList;

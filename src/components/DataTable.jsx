import React, { useState } from 'react';
import useDarkMode from '../hooks/useDarkMode';
import {
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiArrowUp,
  FiArrowDown,
  FiEye,
} from 'react-icons/fi';
import ActionMenu from './ActionMenu/ActionMenu';
import { formatDate, formatDateTime } from '../utils/formatDate';

/**
 * Reusable DataTable Component
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions
 * @param {Array} props.data - Array of data rows
 * @param {Boolean} props.loading - Loading state
 * @param {Object} props.emptyState - Empty state configuration
 * @param {Object} props.pagination - Pagination configuration
 * @param {Number} props.pagination.currentPage - Current page number
 * @param {Number} props.pagination.totalPages - Total number of pages
 * @param {Number} props.pagination.totalItems - Total number of items
 * @param {Function} props.pagination.onPageChange - Callback when page changes
 * @param {Number} [props.pagination.itemsPerPage] - Optional: Current items per page
 * @param {Array} props.actions - Array of action button configurations
 * @param {String} props.filterStatus - Current filter status (for conditional actions)
 * @param {Boolean} props.actionLoading - Loading state for actions
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyState = {},
  pagination = null,
  actions = [],
  filterStatus = 'all',
  actionLoading = false
}) => {
  const darkMode = useDarkMode();
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (column) => {
    if (!column.accessor) return;
    if (sortKey === column.accessor) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.accessor);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = sortKey.split('.').reduce((obj, k) => obj?.[k], a);
      const bVal = sortKey.split('.').reduce((obj, k) => obj?.[k], b);
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const tableShell = darkMode
    ? 'border-stone-700/80 bg-stone-900/70 shadow-lg shadow-black/10'
    : 'border-stone-200/90 bg-white shadow-sm';

  const {
    icon: EmptyIcon,
    title = 'No Data Found',
    description = 'Get started by adding your first item.',
    actionButton = null
  } = emptyState;

  const renderCellValue = (row, column) => {
    // If custom render function provided, use it
    if (column.render) {
      return column.render(row, darkMode);
    }

    // Get value from row using accessor (supports nested paths like 'user.name')
    const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], row);

    // Handle special formatting based on column type
    if (column.type === 'status') {
      // New object format from relationship: { id, name, color, code }
      if (value && typeof value === 'object') {
        const color = value.color ?? '#9ca3af';
        const nameLower = (value.name ?? '').toLowerCase();
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {value.name}
          </span>
        );
      }
      // Legacy string format (backward compat)
      const nameLower = (value ?? '').toLowerCase();
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          nameLower === 'active'
            ? 'bg-green-100 text-green-800'
            : nameLower === 'inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    }

    if (column.type === 'truncate') {
      return (
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs truncate`} title={value || ''}>
          {value || '—'}
        </div>
      );
    }

    if (column.type === 'badge') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      );
    }

    if (column.type === 'date') {
      return (
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {formatDate(value)}
        </div>
      );
    }

    if (column.type === 'datetime') {
      return (
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {formatDateTime(value)}
        </div>
      );
    }

    // Default rendering
    return <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{value || '—'}</div>;
  };

  const renderActions = (row) => {
    // Filter actions based on status
    const availableActions = filterStatus === 'trashed'
      ? actions.filter(action => action.type === 'restore')
      : actions.filter(action => action.type !== 'restore');

    // Single action — render directly as an inline button (no dropdown)
    if (availableActions.length === 1) {
      const act = availableActions[0];
      return (
        <button
          onClick={() => act.onClick(row)}
          disabled={actionLoading}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            darkMode
              ? 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/50'
              : 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <FiEye className="w-3.5 h-3.5" />
          View
        </button>
      );
    }

    return (
      <ActionMenu 
        actions={availableActions}
        item={row}
        disabled={actionLoading}
      />
    );
  };

  if (loading) {
    return (
      <div className={`overflow-hidden rounded-b-2xl border border-t-0 ${tableShell}`}>
        <div className="flex items-center justify-center py-12">
          <FiLoader className="h-8 w-8 animate-spin text-emerald-600" />
          <span className={`ml-2 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`overflow-hidden rounded-b-2xl border border-t-0 ${tableShell}`}>
        <div className="py-12 text-center">
          {EmptyIcon && <EmptyIcon className={`mx-auto mb-4 h-16 w-16 ${darkMode ? 'text-stone-600' : 'text-stone-300'}`} />}
          <h3 className={`mb-2 text-lg font-medium ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}>{title}</h3>
          <p className={`mb-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{description}</p>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
            >
              {actionButton.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate pagination info
  const startItem = pagination && pagination.totalItems > 0 
    ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 
    : 0;
  const endItem = pagination && pagination.totalItems > 0
    ? Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)
    : 0;

  return (
      <div className={`relative z-10 rounded-b-2xl border border-t-0 ${tableShell}`}>

      <div className="overflow-x-auto">
        <table className="relative w-full">
          <thead className={`border-b ${
            darkMode
              ? 'border-stone-700 bg-stone-800/80'
              : 'border-stone-200 bg-gradient-to-r from-emerald-50/80 via-stone-50 to-amber-50/40'
          }`}>
            <tr>
              {/* S.No. Column */}
              <th className={`px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider ${
                darkMode ? 'text-stone-300' : 'text-stone-600'
              }`} style={{ width: '80px' }}>
                S.No.
              </th>
              {columns.map((column, idx) => {
                const isSortable = column.sortable !== false && !!column.accessor;
                const isActive = sortKey === column.accessor;
                return (
                  <th
                    key={idx}
                    onClick={isSortable ? () => handleSort(column) : undefined}
                    className={`px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-stone-300' : 'text-stone-600'
                    } ${
                      isSortable ? 'cursor-pointer select-none hover:bg-emerald-500/5' : ''
                    } ${column.className || ''}`}
                    style={column.width ? { width: column.width } : {}}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.header}
                      {isSortable && (
                        isActive
                          ? sortDir === 'asc'
                            ? <FiArrowUp className="h-3 w-3 text-emerald-600" />
                            : <FiArrowDown className="h-3 w-3 text-emerald-600" />
                          : <span className={`inline-flex flex-col leading-none ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} style={{fontSize:'8px',gap:'1px'}}><FiArrowUp className="w-2.5 h-2.5" /><FiArrowDown className="w-2.5 h-2.5" /></span>
                      )}
                    </span>
                  </th>
                );
              })}
              {actions.length > 0 && (
                <th className={`px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-stone-300' : 'text-stone-600'
                }`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-100'}`}>
            {sortedData.map((row, rowIdx) => {
              const serialNumber = pagination ? (pagination.currentPage - 1) * pagination.itemsPerPage + rowIdx + 1 : rowIdx + 1;
              return (
                <tr
                  key={row.id || rowIdx}
                  className={`transition-colors ${
                    darkMode
                      ? 'hover:bg-stone-800/60'
                      : rowIdx % 2 === 0
                        ? 'bg-white hover:bg-emerald-50/40'
                        : 'bg-stone-50/50 hover:bg-emerald-50/40'
                  }`}
                >
                  {/* S.No. Cell */}
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <div className={`text-sm tabular-nums ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{serialNumber}</div>
                  </td>
                  {columns.map((column, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-6 py-3.5 ${column.noWrap ? 'whitespace-nowrap' : ''} ${
                        column.cellClassName || ''
                      }`}
                    >
                      {renderCellValue(row, column)}
                    </td>
                    ))}
                  {actions.length > 0 && (
                    <td className="relative z-10 whitespace-nowrap px-6 py-3.5 text-sm">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 0 && (
        <div className={`border-t px-6 py-3.5 ${darkMode ? 'border-stone-700 bg-stone-900/50' : 'border-stone-200 bg-stone-50/50'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              {pagination.totalItems > 0 ? (
                <>
                  Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {pagination.totalItems.toLocaleString()} entries
                </>
              ) : (
                'No entries'
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.currentPage === 1}
                className={`rounded-lg border p-2 ${
                  darkMode
                    ? 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 text-stone-700 hover:bg-white'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                title="First page"
              >
                <FiChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`rounded-lg border p-2 ${
                  darkMode
                    ? 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 text-stone-700 hover:bg-white'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                title="Previous page"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + Math.max(1, pagination.currentPage - 2);
                if (page <= pagination.totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => pagination.onPageChange(page)}
                      className={`rounded-lg px-3 py-1 text-sm ${
                        page === pagination.currentPage
                          ? 'border border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : darkMode
                            ? 'border border-stone-600 text-stone-300 hover:bg-stone-800'
                            : 'border border-stone-300 text-stone-700 hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}
              
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`rounded-lg border p-2 ${
                  darkMode
                    ? 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 text-stone-700 hover:bg-white'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                title="Next page"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`rounded-lg border p-2 ${
                  darkMode
                    ? 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    : 'border-stone-300 text-stone-700 hover:bg-white'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                title="Last page"
              >
                <FiChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

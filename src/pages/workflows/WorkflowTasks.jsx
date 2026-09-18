import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity, FiClock, FiEye, FiInbox, FiLoader, FiRefreshCw,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import TableControls from '../../components/TableControls';
import PageTabs from '../../components/PageTabs';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import apiFetch from '../../utils/apiFetch';
import { publicKey } from '../../utils/publicKey';
import { API_BASE_URL } from '../../context/AuthContext';
import { showErrorDialog } from '../../utils/dialogUtils';
import useDarkMode from '../../hooks/useDarkMode';
import { buildWorkflowStatusMap, workflowStatusBadgeStyle, workflowStatusMeta } from '../../utils/workflowStatusMeta';

const WorkflowTasks = ({ defaultTab = 'pending' }) => {
  const darkMode = useDarkMode();
  const isCompletedPage = defaultTab === 'completed';

  const [activeTab, setActiveTab] = useState(isCompletedPage ? 'completed' : 'pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKey, setDetailKey] = useState(null);
  const [workflowStatusMap, setWorkflowStatusMap] = useState({});

  useEffect(() => {
    setActiveTab(isCompletedPage ? 'completed' : 'pending');
    setPage(1);
    setSearch('');
  }, [isCompletedPage]);

  const tabs = useMemo(() => (
    isCompletedPage
      ? []
      : [
          { id: 'pending', label: 'Pending Tasks', icon: FiInbox },
          { id: 'progress', label: 'My Progress', icon: FiActivity },
        ]
  ), [isCompletedPage]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'completed'
        ? 'completed'
        : activeTab === 'progress'
          ? 'my-progress'
          : 'pending';
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await apiFetch(`${API_BASE_URL}/api/workflow/tasks/${endpoint}?${params}`);
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to load workflow tasks');
      }

      const data = json.data;
      const items = Array.isArray(data) ? data : (data?.data || []);
      setRows(items);
      setTotal(json.meta?.total ?? data?.total ?? items.length);
    } catch (err) {
      setRows([]);
      setTotal(0);
      showErrorDialog(err.message || 'Failed to load workflow tasks');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, perPage, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_BASE_URL}/api/status-groups/all`)
      .then((response) => response.json().catch(() => ({})))
      .then((json) => {
        if (cancelled) return;
        setWorkflowStatusMap(buildWorkflowStatusMap(Array.isArray(json?.data) ? json.data : []));
      })
      .catch(() => {
        if (!cancelled) setWorkflowStatusMap({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const openDetail = async (row) => {
    const instanceKey = publicKey(row.instance) || row.instance?.uid || row.slug || row.instance_id;
    if (!instanceKey) return;
    setDetailKey(instanceKey);
    setDetailOpen(true);
  };

  const emptyMessage = activeTab === 'completed'
    ? 'No completed workflow tasks.'
    : activeTab === 'progress'
      ? 'No requests in progress for you to track.'
      : 'No pending workflow tasks.';

  const pageSubtitle = activeTab === 'progress'
    ? 'Track requests you started that are being processed by other roles'
    : isCompletedPage
      ? 'Workflow steps you have already acted on'
      : 'Approvals and workflow steps assigned to you';

  const columns = [
    {
      header: 'Request',
      accessor: 'request',
      render: (row) => {
        const subject = row.instance?.workflowable;
        return (
          <div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {subject?.code || subject?.title || `#${row.instance?.workflowable_id || row.id}`}
            </div>
            {subject?.workflow_status ? (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {String(subject.workflow_status).replaceAll('_', ' ')}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      header: 'Workflow',
      accessor: 'workflow',
      render: (row) => (
        <div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {row.instance?.workflow?.name || '—'}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.instance?.workflow?.code || ''}
            {row.instance?.workflow?.version != null ? ` · v${row.instance.workflow.version}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: activeTab === 'progress' ? 'Current Step' : 'Step',
      accessor: 'step',
      render: (row) => (
        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {row.step?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const status = row.instance?.status || row.status;
        const meta = workflowStatusMeta(status, workflowStatusMap, row.instance?.status_meta || row.status_meta);
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
            style={workflowStatusBadgeStyle(status, workflowStatusMap, row.instance?.status_meta || row.status_meta)}
          >
            {(status === 'pending' || status === 'in_progress') ? <FiClock className="w-3 h-3" /> : null}
            {meta.label}
          </span>
        );
      },
    },
    {
      header: 'Started',
      accessor: 'started_at',
      render: (row) => (
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {row.instance?.started_at ? new Date(row.instance.started_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => openDetail(row)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
            darkMode
              ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FiEye className="w-3.5 h-3.5" />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={activeTab === 'progress' ? FiActivity : FiInbox}
        title={isCompletedPage ? 'Completed Tasks' : 'Pending Tasks'}
        subtitle={pageSubtitle}
        actions={[
          {
            label: 'Refresh',
            icon: loading ? FiLoader : FiRefreshCw,
            onClick: fetchTasks,
            variant: 'secondary',
          },
        ]}
      />

      {tabs.length > 0 ? (
        <PageTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      ) : null}

      <TableControls
        search={{
          value: search,
          onChange: setSearch,
          placeholder: activeTab === 'progress' ? 'Search my requests…' : 'Search workflows...',
        }}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage={emptyMessage}
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(total / perPage) || 1),
          totalItems: total,
          itemsPerPage: perPage,
          onPageChange: setPage,
          onItemsPerPageChange: (n) => {
            setPerPage(n);
            setPage(1);
          },
        }}
      />

      <WorkflowTaskModal
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailKey(null);
        }}
        instanceKey={detailKey}
        onCompleted={fetchTasks}
        readOnly={activeTab === 'progress'}
      />
    </div>
  );
};

export default WorkflowTasks;

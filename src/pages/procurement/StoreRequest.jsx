import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiGitPullRequest,
  FiInfo,
  FiPackage,
  FiRepeat,
  FiTrash2,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PageTabs from '../../components/PageTabs';
import StoreRequestItemsEditor from '../../components/StoreRequestItemsEditor';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDateTime } from '../../utils/formatDate';
import { crudPermissions, hasAnyPermission, hasPermission } from '../../utils/permissions';
import { publicKey } from '../../utils/publicKey';
import { showQuickError, showQuickSuccess } from '../../utils/dialogUtils';
import {
  cancelStoreRequest,
  ensureStoreRequestWorkflow,
  issueStoreRequest,
} from '../../utils/storeRequestApi';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED', 'RETURNED'];

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const userName = (user) => {
  const person = user?.person;
  const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(' ');
  return user?.full_name || fullName || user?.name || user?.email || '—';
};

const StoreRequest = () => {
  const { user } = useAuth();
  const canViewAll = hasPermission(user, 'view-all-store-requests');
  const canCreate = hasPermission(user, 'add-store-requests');
  const canEdit = hasPermission(user, 'edit-store-requests');
  const canDelete = hasPermission(user, 'delete-store-requests');
  const canRestore = hasPermission(user, 'restore-store-requests');
  const canSubmit = hasPermission(user, 'submit-store-requests');
  const canVerify = hasPermission(user, 'verify-store-requests');
  const canApprove = hasPermission(user, 'approve-store-requests');
  const canReject = hasPermission(user, 'reject-store-requests');
  const canView = hasAnyPermission(user, crudPermissions('store-requests'))
    || canViewAll
    || hasPermission(user, 'view-store-requests')
    || canSubmit
    || canVerify
    || canApprove
    || canReject;

  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowInstanceKey, setWorkflowInstanceKey] = useState(null);
  const [workflowModalReadOnly, setWorkflowModalReadOnly] = useState(false);
  const [ownershipTab, setOwnershipTab] = useState('mine');
  const viewingOthers = canViewAll && ownershipTab === 'others';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [storesRes, itemsRes, categoriesRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/stores/all`),
          apiFetch(`${API_BASE_URL}/api/items/all`),
          apiFetch(`${API_BASE_URL}/api/item-categories/all`),
        ]);
        const [storesJson, itemsJson, categoriesJson] = await Promise.all([
          storesRes.json().catch(() => ({})),
          itemsRes.json().catch(() => ({})),
          categoriesRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        setStores(Array.isArray(storesJson?.data) ? storesJson.data : []);
        setItems(Array.isArray(itemsJson?.data) ? itemsJson.data : []);
        setCategories(Array.isArray(categoriesJson?.data) ? categoriesJson.data : []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setItems([]);
          setCategories([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const storeOptions = useMemo(() => [
    { value: '', label: 'Select store' },
    ...stores.map((store) => ({ value: String(store.id), label: store.code ? `${store.name} (${store.code})` : store.name })),
  ], [stores]);

  const crud = useApiCrud('store-requests', {
    initialFormData: {
      source_store_id: '',
      destination_store_id: '',
      request_date: new Date().toISOString().slice(0, 10),
      remarks: '',
      request_items: [],
      status_id: '',
    },
    initialExtraListParams: canViewAll ? { ownership: 'mine' } : {},
    validateForm: (data) => {
      const errors = {};
      if (!data.source_store_id) errors.source_store_id = 'Source store is required';
      if (!data.destination_store_id) errors.destination_store_id = 'Destination store is required';
      if (String(data.source_store_id) === String(data.destination_store_id)) {
        errors.destination_store_id = 'Destination must be different from source';
      }
      if (!data.request_date) errors.request_date = 'Request date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const validLines = (data.request_items || []).filter((line) => line.item_id && Number(line.requested_quantity) > 0);
      if (!validLines.length) {
        errors.request_items = 'Select at least one item and enter an amount greater than zero';
      }
      return errors;
    },
    transformFormData: (data) => ({
      source_store_id: Number(data.source_store_id),
      destination_store_id: Number(data.destination_store_id),
      request_date: data.request_date,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (data.request_items || [])
        .filter((line) => line.item_id && Number(line.requested_quantity) > 0)
        .map((line) => ({
          item_id: Number(line.item_id),
          item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
          requested_quantity: Number(line.requested_quantity || 0),
          approved_quantity: Number(line.approved_quantity || line.requested_quantity || 0),
          issued_quantity: Number(line.issued_quantity || 0),
          remarks: line.remarks || null,
        })),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        source_store_id: row?.source_store_id != null ? String(row.source_store_id) : '',
        destination_store_id: row?.destination_store_id != null ? String(row.destination_store_id) : '',
        request_items: Array.isArray(row?.items) && row.items.length
          ? row.items.map((line) => ({
              item_id: line.item_id != null ? String(line.item_id) : '',
              item_unit_id: line.item_unit_id != null ? String(line.item_unit_id) : '',
              requested_quantity: line.requested_quantity ?? '',
              approved_quantity: line.approved_quantity ?? '',
              issued_quantity: line.issued_quantity ?? '',
              remarks: line.remarks || '',
            }))
          : [],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Store Request',
    canAdd: canCreate,
    canEdit,
    canDelete,
    canRestore,
    itemsPerPage: 10,
    enrichStats: ({ stats }) => ({
      ...stats,
      draft: Number(stats?.draft || 0),
      submitted: Number(stats?.submitted || 0),
      verified: Number(stats?.verified || 0),
      inReview: Number(stats?.submitted || 0) + Number(stats?.verified || 0),
      approved: Number(stats?.approved || 0),
      issued: Number(stats?.issued || 0),
    }),
  });

  useEffect(() => {
    if (!canViewAll) {
      crud.setExtraListParams({});
      return;
    }
    crud.setExtraListParams({ ownership: ownershipTab === 'others' ? 'others' : 'mine' });
    crud.handlePageChange(1);
  }, [canViewAll, ownershipTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const workflowInstanceForRow = useCallback((row) => (
    row?.active_workflow_instance
    || row?.activeWorkflowInstance
    || (Array.isArray(row.workflow_instances) ? row.workflow_instances[0] : null)
    || (Array.isArray(row.workflowInstances) ? row.workflowInstances[0] : null)
  ), []);

  const workflowInstanceKeyForRow = useCallback((row) => {
    const instance = workflowInstanceForRow(row);
    return publicKey(instance) || instance?.uid || instance?.id || row?.workflow_instance_id || null;
  }, [workflowInstanceForRow]);

  const canActOnWorkflow = useCallback((row) => {
    if (!row) return false;
    const serverAllowed = row.can_process_workflow ?? row.canProcessWorkflow;
    if (serverAllowed === false) return false;
    if (serverAllowed === true) return true;

    if (EDITABLE_STATUSES.includes(row.workflow_status)) return canSubmit;
    if (row.workflow_status === 'SUBMITTED') return canVerify || canReject;
    if (row.workflow_status === 'VERIFIED') return canApprove || canReject;
    return false;
  }, [canApprove, canReject, canSubmit, canVerify]);

  const openWorkflowModal = useCallback(async (row, { readOnly = false } = {}) => {
    try {
      let instanceKey = workflowInstanceKeyForRow(row);
      const trackingOnly = readOnly || !canActOnWorkflow(row);

      if (!instanceKey && !trackingOnly && canSubmit && EDITABLE_STATUSES.includes(row.workflow_status)) {
        const instance = await ensureStoreRequestWorkflow(row.id);
        await crud.reload();
        instanceKey = instance?.uid || instance?.slug || publicKey(instance) || instance?.id;
      }

      if (!instanceKey) {
        showQuickError('Workflow unavailable', 'No workflow task is available for this store request.');
        return;
      }

      setWorkflowModalReadOnly(trackingOnly);
      setWorkflowInstanceKey(instanceKey);
      setWorkflowModalOpen(true);
    } catch (error) {
      showQuickError('Workflow unavailable', error.message);
    }
  }, [canActOnWorkflow, canSubmit, crud, workflowInstanceKeyForRow]);

  const pageConfig = {
    icon: FiRepeat,
    title: 'Store Requests',
    subtitle: viewingOthers
      ? 'Track status of store requests created by other users'
      : 'Draft store requests, then process verification and approval through workflow',
    addButtonLabel: 'Add Store Request',
    searchPlaceholder: 'Search store requests...',
    hideAddButton: !canCreate || viewingOthers,
    hideActions: ['edit', 'delete'],
  };

  const ownershipTabs = useMemo(() => (
    canViewAll
      ? [
          { id: 'mine', label: 'My Requests', icon: FiRepeat },
          { id: 'others', label: 'Other Requests', icon: FiUsers },
        ]
      : []
  ), [canViewAll]);

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'inReview', label: 'In Review', icon: FiGitPullRequest, iconColor: 'orange-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Source Store', accessor: 'source_store', noWrap: true, render: (row) => row.source_store?.code ? `${row.source_store.name} (${row.source_store.code})` : row.source_store?.name || row.sourceStore?.name || row.source_store_id },
    { header: 'Destination', accessor: 'destination_store', noWrap: true, render: (row) => row.destination_store?.code ? `${row.destination_store.name} (${row.destination_store.code})` : row.destination_store?.name || row.destinationStore?.name || row.destination_store_id },
    { header: 'Request Date', accessor: 'request_date', noWrap: true, render: (row) => row.request_date ? new Date(row.request_date).toLocaleDateString() : '-' },
    ...(viewingOthers
      ? [{
          header: 'Requested By',
          accessor: 'requester.full_name',
          noWrap: true,
          render: (row) => userName(row.requester),
        }]
      : []),
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true, render: (row) => <WorkflowStatusPill status={row.workflow_status} /> },
    { header: 'Items', accessor: 'items', noWrap: true, render: (row) => (Array.isArray(row.items) ? row.items.length : 0) },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Request Details',
      icon: FiInfo,
      fields: [
        { name: 'source_store_id', label: 'Source Store', type: 'searchable_select', required: true, options: storeOptions },
        { name: 'destination_store_id', label: 'Destination Store', type: 'searchable_select', required: true, options: storeOptions },
        { name: 'request_date', label: 'Request Date', type: 'date', required: true },
        { name: 'status_id', label: 'Status', type: 'status_id', required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false, fullWidth: true },
      ],
    },
    {
      id: 'items',
      label: 'Requested Items',
      icon: FiPackage,
      fields: [
        {
          name: 'request_items',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => (
            <StoreRequestItemsEditor
              value={formData.request_items}
              onChange={onInputChange}
              items={items}
              categories={categories}
              errors={errors}
              darkMode={darkMode}
            />
          ),
        },
      ],
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Request Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Source Store', accessor: 'source_store.name', valueRender: (item) => item.source_store?.name || item.sourceStore?.name || '—' },
        { label: 'Destination Store', accessor: 'destination_store.name', valueRender: (item) => item.destination_store?.name || item.destinationStore?.name || '—' },
        { label: 'Request Date', accessor: 'request_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status', valueRender: (item) => <WorkflowStatusPill status={item.workflow_status} /> },
        { label: 'Requested By', accessor: 'requester', valueRender: (item) => userName(item.requester) },
        { label: 'Submitted', accessor: 'submitted_at', valueRender: (item) => formatDateTime(item.submitted_at) },
        { label: 'Verified By', accessor: 'verifier', valueRender: (item) => userName(item.verifier) },
        { label: 'Verified At', accessor: 'verified_at', valueRender: (item) => formatDateTime(item.verified_at) },
        { label: 'Approved By', accessor: 'approver', valueRender: (item) => userName(item.approver) },
        { label: 'Approved At', accessor: 'approved_at', valueRender: (item) => formatDateTime(item.approved_at) },
        { label: 'Issued By', accessor: 'issuer', valueRender: (item) => userName(item.issuer) },
        { label: 'Rejected At', accessor: 'rejected_at', valueRender: (item) => formatDateTime(item.rejected_at) },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'items',
      label: 'Requested Items',
      icon: FiPackage,
      fields: [
        {
          label: 'Items',
          accessor: 'items',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.items || [];
            if (!rows.length) return '—';

            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Requested</th>
                      <th className="px-3 py-2">Approved</th>
                      <th className="px-3 py-2">Issued</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.requested_quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2">{formatNumber(line.requested_quantity)}</td>
                        <td className="px-3 py-2">{formatNumber(line.approved_quantity)}</td>
                        <td className="px-3 py-2">{formatNumber(line.issued_quantity)}</td>
                        <td className="px-3 py-2">{line.item_unit?.unit?.symbol || line.itemUnit?.unit?.symbol || '—'}</td>
                        <td className="px-3 py-2">{line.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          },
        },
      ],
    },
  ];

  const extraActions = [
    {
      type: 'edit',
      label: (row) => (row.workflow_status === 'DRAFT' ? 'Edit Draft' : 'Edit'),
      icon: FiEdit2,
      visible: (row) => !viewingOthers && canEdit && EDITABLE_STATUSES.includes(row.workflow_status),
      onClick: (row) => crud.handleEdit(row),
    },
    {
      type: 'workflow',
      label: 'Process',
      icon: FiGitPullRequest,
      visible: (row) => !viewingOthers && canActOnWorkflow(row),
      onClick: (row) => openWorkflowModal(row, { readOnly: false }),
    },
    {
      type: 'workflow-progress',
      label: 'Progress',
      icon: FiEye,
      visible: (row) => Boolean(workflowInstanceKeyForRow(row)) && (viewingOthers || !canActOnWorkflow(row)),
      onClick: (row) => openWorkflowModal(row, { readOnly: true }),
    },
    {
      type: 'issue',
      label: 'Mark Issued',
      icon: FiTruck,
      visible: (row) => !viewingOthers && canEdit && row.workflow_status === 'APPROVED',
      onClick: async (row) => {
        try {
          await issueStoreRequest(row.id);
          showQuickSuccess('Store request marked as issued');
          await crud.reload();
        } catch (error) {
          showQuickError('Issue', error.message);
        }
      },
    },
    {
      type: 'cancel',
      label: 'Cancel',
      icon: FiXCircle,
      visible: (row) => !viewingOthers && canEdit && !['ISSUED', 'CANCELLED'].includes(row.workflow_status),
      onClick: async (row) => {
        try {
          await cancelStoreRequest(row.id);
          showQuickSuccess('Store request cancelled');
          await crud.reload();
        } catch (error) {
          showQuickError('Cancel', error.message);
        }
      },
    },
    {
      type: 'delete',
      label: 'Delete draft',
      icon: FiTrash2,
      visible: (row) => !viewingOthers && canDelete && row.workflow_status === 'DRAFT',
      onClick: (row) => crud.handleDelete(row),
    },
  ];

  if (!canView) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm text-stone-500">You do not have permission to view store requests.</p>
      </div>
    );
  }

  return (
    <>
      <CRUDPage
        pageConfig={pageConfig}
        statsConfig={statsConfig}
        tableColumns={tableColumns}
        formTabs={formTabs}
        viewTabs={viewTabs}
        modalTitle="Store Request"
        modalMaxWidth="max-w-7xl"
        crud={crud}
        submitLabel={crud.isEditing ? 'Save Changes' : 'Save as Draft'}
        extraActions={extraActions}
        belowStats={ownershipTabs.length ? (
          <PageTabs
            tabs={ownershipTabs}
            activeTab={ownershipTab}
            onChange={setOwnershipTab}
            ariaLabel="Store request ownership"
          />
        ) : null}
        filterOptions={[
          { label: 'All', value: 'all' },
          { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
          { label: 'Workflow: Submitted', value: 'workflow:SUBMITTED' },
          { label: 'Workflow: Verified', value: 'workflow:VERIFIED' },
          { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
          { label: 'Workflow: Rejected', value: 'workflow:REJECTED' },
          { label: 'Workflow: Returned', value: 'workflow:RETURNED' },
          { label: 'Workflow: Issued', value: 'workflow:ISSUED' },
          { label: 'Workflow: Cancelled', value: 'workflow:CANCELLED' },
          { label: 'Trashed', value: 'trashed' },
        ]}
      />
      <WorkflowTaskModal
        isOpen={workflowModalOpen}
        onClose={() => {
          setWorkflowModalOpen(false);
          setWorkflowInstanceKey(null);
          setWorkflowModalReadOnly(false);
        }}
        instanceKey={workflowInstanceKey}
        onCompleted={crud.reload}
        readOnly={workflowModalReadOnly}
      />
    </>
  );
};

export default StoreRequest;

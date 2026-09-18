import React, { useCallback, useEffect, useMemo } from 'react';
import {
  FiCheckCircle,
  FiClipboard,
  FiEdit2,
  FiGitPullRequest,
  FiInfo,
  FiMessageSquare,
  FiPackage,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import { WorkflowCommentsTab } from '../../components/workflow/WorkflowTaskDetailTabs';
import PageTabs from '../../components/PageTabs';
import { showQuickError } from '../../utils/dialogUtils';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PrItemsEditor from '../../components/PrItemsEditor';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { crudPermissions, hasAnyPermission, hasPermission } from '../../utils/permissions';
import { publicKey } from '../../utils/publicKey';
import { ensurePurchaseRequisitionWorkflow } from '../../utils/purchaseRequisitionApi';
import useDarkMode from '../../hooks/useDarkMode';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED', 'RETURNED'];

const validatePrItems = (lines) => {
  const validLines = (lines || []).filter((line) => line.item_id && Number(line.quantity) > 0);
  if (validLines.length === 0) {
    return 'Add at least one line with item and quantity';
  }
  const itemIds = validLines.map((line) => String(line.item_id));
  if (new Set(itemIds).size !== itemIds.length) {
    return 'Each item can only appear once on the requisition';
  }
  return null;
};

const PurchaseRequisition = () => {
  const { user } = useAuth();
  const darkMode = useDarkMode();
  const canViewAll = hasPermission(user, 'view-all-purchase-requisitions');
  const canViewWorkflowComments = hasPermission(user, 'edit-workflows')
    || hasPermission(user, 'view-workflow-comments')
    || hasPermission(user, 'view-workflow-history');
  const canCreate = hasPermission(user, 'add-purchase-requisitions');
  const canEdit = hasPermission(user, 'edit-purchase-requisitions');
  const canDelete = hasPermission(user, 'delete-purchase-requisitions');
  const canRestore = hasPermission(user, 'restore-purchase-requisitions');
  const canSubmit = hasPermission(user, 'submit-purchase-requisitions');
  const canVerify = hasPermission(user, 'verify-purchase-requisitions');
  const canApprove = hasPermission(user, 'approve-purchase-requisitions');
  const canReject = hasPermission(user, 'reject-purchase-requisitions');
  const canConvert = hasPermission(user, 'convert-purchase-requisitions-to-lpo');
  const canView = hasAnyPermission(user, crudPermissions('purchase-requisitions'))
    || canViewAll
    || hasPermission(user, 'view-purchase-requisitions')
    || canSubmit
    || canVerify
    || canApprove
    || canReject
    || canConvert;

  const [items, setItems] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [workflowModalOpen, setWorkflowModalOpen] = React.useState(false);
  const [workflowInstanceKey, setWorkflowInstanceKey] = React.useState(null);
  const [ownershipTab, setOwnershipTab] = React.useState('mine');
  const viewingOthers = canViewAll && ownershipTab === 'others';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/items/all?procurable=1`),
          apiFetch(`${API_BASE_URL}/api/item-categories/all`),
        ]);
        const itemsData = await itemsRes.json().catch(() => ({}));
        const categoriesData = await categoriesRes.json().catch(() => ({}));
        if (cancelled) return;
        setItems(Array.isArray(itemsData?.data) ? itemsData.data : []);
        setCategories(Array.isArray(categoriesData?.data) ? categoriesData.data : []);
      } catch {
        if (!cancelled) {
          setItems([]);
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const crud = useApiCrud('purchase-requisitions', {
    initialFormData: {
      requisition_date: new Date().toISOString().slice(0, 10),
      remarks: '',
      pr_items: [],
      status_id: '',
    },
    initialExtraListParams: canViewAll ? { ownership: 'mine' } : {},
    validateForm: (data) => {
      const errors = {};
      if (!data.requisition_date) errors.requisition_date = 'Requisition date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      const itemError = validatePrItems(data.pr_items);
      if (itemError) errors.pr_items = itemError;
      return errors;
    },
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        items: Array.isArray(row?.items) ? row.items : [],
        pr_items: Array.isArray(row?.items) && row.items.length
          ? row.items.map((line) => ({
              item_id: String(line.item_id),
              quantity: line.quantity,
              item_unit_id: line.item_unit_id ? String(line.item_unit_id) : '',
              remarks: line.remarks || '',
            }))
          : [],
        workflow_detail: row?.workflow_detail || null,
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    transformFormData: (data) => ({
      requisition_date: data.requisition_date,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (data.pr_items || [])
        .filter((line) => line.item_id && Number(line.quantity) > 0)
        .map((line) => ({
          item_id: Number(line.item_id),
          item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
          quantity: Number(line.quantity),
          remarks: line.remarks?.trim() || null,
        })),
    }),
    resourceName: 'Purchase Requisition',
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
      approved: Number(stats?.approved || 0),
      rejected: Number(stats?.rejected || 0),
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

  const handleOwnershipTabChange = (tabId) => {
    setOwnershipTab(tabId);
  };
  const workflowInstanceForRow = useCallback((row) => {
    if (!row) return null;

    return row.workflow_instance
      || row.active_workflow
      || row.latest_workflow
      || row.workflowInstance
      || row.activeWorkflow
      || row.latestWorkflow
      || (Array.isArray(row.workflow_instances) ? row.workflow_instances[0] : null)
      || (Array.isArray(row.workflowInstances) ? row.workflowInstances[0] : null);
  }, []);

  const workflowInstanceKeyForRow = useCallback(
    (row) => {
      const instance = workflowInstanceForRow(row);
      return publicKey(instance) || instance?.uid || instance?.id || row?.workflow_instance_id || null;
    },
    [workflowInstanceForRow]
  );

  const canProcessRequisitionWorkflow = useCallback((row) => {
    if (!row || viewingOthers) return false;

    const serverAllowed = row.can_process_workflow ?? row.canProcessWorkflow;
    if (serverAllowed === true || serverAllowed === 1 || serverAllowed === '1') {
      return true;
    }
    if (serverAllowed === false || serverAllowed === 0 || serverAllowed === '0') {
      return false;
    }

    const status = String(row.workflow_status || '').toUpperCase();
    if (canSubmit && EDITABLE_STATUSES.includes(status)) {
      return true;
    }

    return false;
  }, [canSubmit, viewingOthers]);

  const openWorkflowModal = useCallback(
    async (row) => {
      if (!canProcessRequisitionWorkflow(row)) {
        showQuickError('Workflow unavailable', 'No workflow task is available for this requisition.');
        return;
      }

      try {
        let instanceKey = workflowInstanceKeyForRow(row);

        if (!instanceKey && canSubmit && EDITABLE_STATUSES.includes(row.workflow_status)) {
          const instance = await ensurePurchaseRequisitionWorkflow(row.id);
          await crud.reload();
          instanceKey = instance?.uid || instance?.slug || publicKey(instance) || instance?.id;
        }

        if (!instanceKey) {
          showQuickError('Workflow unavailable', 'No workflow task is available for this requisition.');
          return;
        }

        setWorkflowInstanceKey(instanceKey);
        setWorkflowModalOpen(true);
      } catch (error) {
        showQuickError('Workflow unavailable', error.message);
      }
    },
    [canProcessRequisitionWorkflow, canSubmit, crud, workflowInstanceKeyForRow]
  );

  const pageConfig = {
    icon: FiClipboard,
    title: 'Purchase Requisitions',
    subtitle: viewingOthers
      ? 'Track status of requisitions created by other users'
      : 'Create requisitions, verify line items, and approve for procurement',
    addButtonLabel: 'Add Requisition',
    searchPlaceholder: 'Search requisitions...',
    hideAddButton: !canCreate || viewingOthers,
    hideActions: ['edit', 'delete'],
  };

  const ownershipTabs = useMemo(() => (
    canViewAll
      ? [
          { id: 'mine', label: 'My Requisitions', icon: FiClipboard },
          { id: 'others', label: 'Other Requisitions', icon: FiUsers },
        ]
      : []
  ), [canViewAll]);

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'verified', label: 'Verified', icon: FiShield, iconColor: 'indigo-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'rejected', label: 'Rejected', icon: FiXCircle, iconColor: 'red-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Date', accessor: 'requisition_date', noWrap: true },
    ...(viewingOthers
      ? [{
          header: 'Requested By',
          accessor: 'requester.full_name',
          noWrap: true,
          render: (row) => row.requester?.full_name || '—',
        }]
      : []),
    {
      header: 'Workflow',
      accessor: 'workflow_status',
      noWrap: true,
      render: (row) => <WorkflowStatusPill status={row.workflow_status} />,
    },
    { header: 'Items', accessor: 'items', noWrap: true, render: (row) => (Array.isArray(row.items) ? row.items.length : 0) },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Requisition Details',
      icon: FiInfo,
      fields: [
        { name: 'requisition_date', label: 'Requisition Date', type: 'date', required: true },
        { name: 'status_id', label: 'Status', type: 'status_id', required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
      ],
    },
    {
      id: 'items',
      label: 'Required Items',
      icon: FiPackage,
      fields: [
        {
          name: 'pr_items',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => (
            <PrItemsEditor
              value={formData.pr_items}
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
      label: 'Requisition Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Requisition Date', accessor: 'requisition_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status', valueRender: (item) => <WorkflowStatusPill status={item.workflow_status} /> },
        { label: 'Requested By', accessor: 'requester.full_name', valueRender: (item) => item.requester?.full_name || '—' },
        { label: 'Verified By', accessor: 'verifier.full_name', valueRender: (item) => item.verifier?.full_name || '—' },
        { label: 'Approved By', accessor: 'approver.full_name', valueRender: (item) => item.approver?.full_name || '—' },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'items',
      label: 'Required Items',
      icon: FiPackage,
      fields: [
        {
          label: 'Required items',
          accessor: 'items',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.items || [];
            if (!rows.length) return '—';

            const groups = rows.reduce((acc, line) => {
              const categoryName = line.item?.category?.name || 'Uncategorized';
              if (!acc[categoryName]) acc[categoryName] = [];
              acc[categoryName].push(line);
              return acc;
            }, {});

            return (
              <div className="space-y-4">
                {Object.entries(groups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([categoryName, categoryRows]) => (
                    <div key={categoryName}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {categoryName}
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                              <th className="px-3 py-2">Item</th>
                              <th className="px-3 py-2">Code</th>
                              <th className="px-3 py-2">Qty</th>
                              <th className="px-3 py-2">Unit</th>
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryRows.map((line) => (
                              <tr key={line.id || `${line.item_id}-${line.quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                                <td className="px-3 py-2">{line.item?.code || '—'}</td>
                                <td className="px-3 py-2">{line.quantity}</td>
                                <td className="px-3 py-2">{line.item_unit?.unit?.symbol || line.item_unit?.unit?.name || line.itemUnit?.unit?.symbol || line.itemUnit?.unit?.name || '—'}</td>
                                <td className="px-3 py-2">{line.remarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            );
          },
        },
      ],
    },
    ...(canViewWorkflowComments
      ? [{
          id: 'workflow-comments',
          label: 'Comments',
          icon: FiMessageSquare,
          fields: [
            {
              label: 'Workflow comments',
              accessor: 'workflow_detail',
              fullWidth: true,
              valueRender: (item, mode) => (
                <WorkflowCommentsTab
                  darkMode={typeof mode === 'boolean' ? mode : darkMode}
                  detail={item?.workflow_detail || { action_history: [] }}
                />
              ),
            },
          ],
        }]
      : []),
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
      visible: canProcessRequisitionWorkflow,
      onClick: openWorkflowModal,
    },
    {
      type: 'delete',
      label: 'Delete',
      icon: FiTrash2,
      visible: (row) => !viewingOthers && canDelete && row.workflow_status === 'DRAFT',
      onClick: (row) => crud.handleDelete(row),
    },
  ];

  if (!canView) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm text-stone-500">You do not have permission to view purchase requisitions.</p>
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
        modalTitle="Purchase Requisition"
        modalMaxWidth="max-w-6xl"
        crud={crud}
        submitLabel={crud.isEditing ? 'Save Changes' : 'Save as Draft'}
        extraActions={extraActions}
        belowStats={ownershipTabs.length ? (
          <PageTabs
            tabs={ownershipTabs}
            activeTab={ownershipTab}
            onChange={handleOwnershipTabChange}
            ariaLabel="Purchase requisition ownership"
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
          { label: 'Workflow: Converted To LPO', value: 'workflow:CONVERTED_TO_LPO' },
          { label: 'Trashed', value: 'trashed' },
        ]}
      />
      <WorkflowTaskModal
        isOpen={workflowModalOpen}
        onClose={() => {
          setWorkflowModalOpen(false);
          setWorkflowInstanceKey(null);
        }}
        instanceKey={workflowInstanceKey}
        onCompleted={crud.reload}
      />
    </>
  );
};

export default PurchaseRequisition;

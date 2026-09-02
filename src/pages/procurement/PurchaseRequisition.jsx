import React, { useCallback, useEffect } from 'react';
import {
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiEdit2,
  FiInfo,
  FiPackage,
  FiSend,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import {
  showQuickError,
  showQuickSuccess,
  showWorkflowConfirm,
} from '../../utils/dialogUtils';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PrItemsEditor from '../../components/PrItemsEditor';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { hasPermission } from '../../utils/permissions';
import {
  approvePurchaseRequisition,
  convertPurchaseRequisitionToLpo,
  rejectPurchaseRequisition,
  submitPurchaseRequisition,
  verifyPurchaseRequisition,
} from '../../utils/purchaseRequisitionApi';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED'];

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
  const canManage = hasPermission(user, 'manage-purchase-requisitions');
  const canView = canManage || hasPermission(user, 'view-purchase-requisitions');
  const canCreate = canManage || hasPermission(user, 'create-purchase-requisitions');
  const canSubmit = canManage || hasPermission(user, 'submit-purchase-requisitions');
  const canVerify = canManage || hasPermission(user, 'verify-purchase-requisitions');
  const canApprove = canManage || hasPermission(user, 'approve-purchase-requisitions');
  const canReject = canManage || hasPermission(user, 'reject-purchase-requisitions');
  const canConvert = canManage || hasPermission(user, 'convert-purchase-requisitions-to-lpo');

  const [items, setItems] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/items/all`),
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
              remarks: line.remarks || '',
            }))
          : [],
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
          quantity: Number(line.quantity),
          remarks: line.remarks?.trim() || null,
        })),
    }),
    resourceName: 'Purchase Requisition',
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

  const runWorkflowAction = useCallback(
    async (row, { label, fn, confirmText, inputLabel }) => {
      const result = await showWorkflowConfirm({
        title: label,
        message: confirmText,
        confirmText: label,
        withRemarks: Boolean(inputLabel),
        remarksLabel: inputLabel,
      });

      if (!result.isConfirmed) return;

      try {
        await fn(row.id, result.remarks);
        await crud.reload();
        showQuickSuccess(`${label} successful`);
      } catch (error) {
        showQuickError(`${label} failed`, error.message);
      }
    },
    [crud]
  );

  const pageConfig = {
    icon: FiClipboard,
    title: 'Purchase Requisitions',
    subtitle: 'Create requisitions, verify line items, and approve for procurement',
    addButtonLabel: 'Add Requisition',
    searchPlaceholder: 'Search requisitions...',
    hideAddButton: !canCreate,
    hideActions: ['edit', 'delete'],
  };

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
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryRows.map((line) => (
                              <tr key={line.id || `${line.item_id}-${line.quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                                <td className="px-3 py-2">{line.item?.code || '—'}</td>
                                <td className="px-3 py-2">{line.quantity}</td>
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
  ];

  const extraActions = [
    {
      type: 'edit',
      label: 'Edit',
      icon: FiEdit2,
      visible: (row) => canCreate && EDITABLE_STATUSES.includes(row.workflow_status),
      onClick: (row) => crud.handleEdit(row),
    },
    {
      type: 'submit',
      label: 'Submit',
      icon: FiSend,
      visible: (row) => canSubmit && EDITABLE_STATUSES.includes(row.workflow_status),
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Submit',
          fn: submitPurchaseRequisition,
          confirmText: 'Submit this requisition for verification?',
        }),
    },
    {
      type: 'verify',
      label: 'Verify',
      icon: FiShield,
      visible: (row) => canVerify && row.workflow_status === 'SUBMITTED',
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Verify',
          fn: verifyPurchaseRequisition,
          confirmText: 'Verify this requisition before approval?',
          inputLabel: 'Verification remarks',
        }),
    },
    {
      type: 'approve',
      label: 'Approve',
      icon: FiCheck,
      visible: (row) => canApprove && row.workflow_status === 'VERIFIED',
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Approve',
          fn: approvePurchaseRequisition,
          confirmText: 'Approve this verified requisition?',
          inputLabel: 'Approval remarks',
        }),
    },
    {
      type: 'reject',
      label: 'Reject',
      icon: FiX,
      visible: (row) => canReject && ['SUBMITTED', 'VERIFIED'].includes(row.workflow_status),
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Reject',
          fn: rejectPurchaseRequisition,
          confirmText: 'Reject this requisition?',
          inputLabel: 'Rejection reason',
        }),
    },
    {
      type: 'convert',
      label: 'Convert to LPO',
      icon: FiCheckCircle,
      visible: (row) => canConvert && row.workflow_status === 'APPROVED',
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Convert to LPO',
          fn: convertPurchaseRequisitionToLpo,
          confirmText: 'Mark this requisition as converted to LPO?',
          inputLabel: 'Conversion remarks',
        }),
    },
    {
      type: 'delete',
      label: 'Delete',
      icon: FiTrash2,
      visible: (row) => canCreate && row.workflow_status === 'DRAFT',
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
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formTabs={formTabs}
      viewTabs={viewTabs}
      modalTitle="Purchase Requisition"
      modalMaxWidth="max-w-6xl"
      crud={crud}
      extraActions={extraActions}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Submitted', value: 'workflow:SUBMITTED' },
        { label: 'Workflow: Verified', value: 'workflow:VERIFIED' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
        { label: 'Workflow: Rejected', value: 'workflow:REJECTED' },
        { label: 'Workflow: Converted To LPO', value: 'workflow:CONVERTED_TO_LPO' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default PurchaseRequisition;

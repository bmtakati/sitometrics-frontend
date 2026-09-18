import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiGitPullRequest,
  FiInbox,
  FiInfo,
  FiPackage,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PageTabs from '../../components/PageTabs';
import SearchableSelect from '../../components/SearchableSelect';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDateTime } from '../../utils/formatDate';
import { crudPermissions, hasAnyPermission, hasPermission } from '../../utils/permissions';
import { publicKey } from '../../utils/publicKey';
import { showQuickError } from '../../utils/dialogUtils';
import { ensureGoodsReceivedNoteWorkflow } from '../../utils/goodsReceivedNoteApi';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED', 'RETURNED'];
const RECEIVABLE_LPO_STATUSES = ['APPROVED', 'SENT', 'PARTIALLY_DELIVERED'];

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const unitLabel = (line) => {
  const unit = line?.item_unit?.unit || line?.itemUnit?.unit;
  if (!unit) return '';
  return unit.symbol || unit.name || '';
};

const lpoLabel = (lpo) => {
  const supplier = lpo?.supplier?.name ? ` · ${lpo.supplier.name}` : '';
  return `${lpo?.code || `LPO #${lpo?.id}`}${supplier}`;
};

const lpoItemLines = (lpo) =>
  (lpo?.items || []).map((line) => ({
    local_purchase_order_item_id: line.id,
    item_id: line.item_id,
    store_id: '',
    item_name: line.item?.name || line.item_name || `Item #${line.item_id}`,
    item_code: line.item?.code || '',
    item_unit_id: line.item_unit_id || '',
    unit_label: unitLabel(line),
    ordered_quantity: line.quantity ?? 0,
    received_quantity: '',
    rejected_quantity: 0,
    unit_cost: line.unit_price ?? 0,
    batch_no: '',
    expiry_date: '',
    remarks: '',
  }));

const normalizeGrnLines = (items = []) =>
  items.map((line) => ({
    local_purchase_order_item_id: line.local_purchase_order_item_id || '',
    item_id: line.item_id,
    store_id: line.store_id != null ? String(line.store_id) : '',
    item_name: line.item?.name || line.item_name || `Item #${line.item_id}`,
    item_code: line.item?.code || '',
    item_unit_id: line.item_unit_id || '',
    unit_label: unitLabel(line),
    ordered_quantity: line.ordered_quantity ?? 0,
    received_quantity: line.received_quantity ?? '',
    rejected_quantity: line.rejected_quantity ?? 0,
    unit_cost: line.unit_cost ?? 0,
    batch_no: line.batch_no || '',
    expiry_date: line.expiry_date ? String(line.expiry_date).slice(0, 10) : '',
    remarks: line.remarks || '',
  }));

const storeSummary = (items = []) => {
  const names = [...new Set(
    items
      .map((line) => line.store?.name || line.store_name)
      .filter(Boolean)
  )];

  if (!names.length) return '-';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
};

const parseQty = (value) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const GoodsReceivedItemsEditor = ({
  value = [],
  onChange,
  selectedLpo,
  stores = [],
  storeOptions = [],
  darkMode,
  grnDate = '',
}) => {
  const lines = Array.isArray(value) ? value : [];
  const minExpiry = grnDate || new Date().toISOString().slice(0, 10);

  const updateLine = (index, field, nextValue) => {
    const next = lines.map((line, lineIndex) => {
      if (lineIndex !== index) return line;

      const ordered = Number(line.ordered_quantity || 0);
      let updated = { ...line, [field]: nextValue };

      if (field === 'received_quantity') {
        const received = parseQty(nextValue);
        if (received != null && received > ordered) {
          updated.received_quantity = String(ordered);
        }
        const rejected = Number(updated.rejected_quantity || 0);
        const cappedReceived = Number(updated.received_quantity || 0);
        if (rejected + cappedReceived > ordered) {
          updated.rejected_quantity = Math.max(0, ordered - cappedReceived);
        }
      }

      if (field === 'rejected_quantity') {
        const rejected = parseQty(nextValue);
        const received = Number(line.received_quantity || 0);
        if (rejected != null && rejected + received > ordered) {
          updated.rejected_quantity = String(Math.max(0, ordered - received));
        }
      }

      return updated;
    });
    onChange({ target: { name: 'grn_items', value: next } });
  };

  if (!selectedLpo) {
    return (
      <div className={`rounded-lg border px-4 py-6 text-sm ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
        Select an LPO to display its ordered items.
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className={`rounded-lg border px-4 py-6 text-sm ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
        The selected LPO has no items to receive.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full border text-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <thead className={darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Item</th>
            <th className="px-3 py-2 text-left font-semibold">Store</th>
            <th className="px-3 py-2 text-right font-semibold">Ordered</th>
            <th className="px-3 py-2 text-left font-semibold">Unit</th>
            <th className="px-3 py-2 text-right font-semibold">Received</th>
            <th className="px-3 py-2 text-right font-semibold">Rejected</th>
            <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
            <th className="px-3 py-2 text-left font-semibold">Batch</th>
            <th className="px-3 py-2 text-left font-semibold">Expiry</th>
            <th className="px-3 py-2 text-left font-semibold">Remarks</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-gray-700 bg-gray-900' : 'divide-y divide-gray-200 bg-white'}>
          {lines.map((line, index) => (
            <tr key={`${line.local_purchase_order_item_id || line.item_id}-${index}`}>
              <td className="min-w-[220px] px-3 py-2">
                <div className={darkMode ? 'text-gray-100' : 'text-gray-900'}>{line.item_name}</div>
                {line.item_code ? <div className="text-xs text-gray-500">{line.item_code}</div> : null}
              </td>
              <td className="min-w-[220px] px-3 py-2">
                <SearchableSelect
                  options={storeOptions}
                  value={line.store_id ? String(line.store_id) : ''}
                  onChange={(value) => updateLine(index, 'store_id', value)}
                  placeholder={stores.length ? 'Select store' : 'No stores found'}
                  darkMode={darkMode}
                />
              </td>
              <td className="px-3 py-2 text-right">{formatNumber(line.ordered_quantity)}</td>
              <td className="px-3 py-2">{line.unit_label || '-'}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max={Number(line.ordered_quantity || 0)}
                  step="0.001"
                  value={line.received_quantity}
                  onChange={(event) => updateLine(index, 'received_quantity', event.target.value)}
                  className={`w-28 rounded-md border px-2 py-1 text-right ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, Number(line.ordered_quantity || 0) - Number(line.received_quantity || 0))}
                  step="0.001"
                  value={line.rejected_quantity}
                  onChange={(event) => updateLine(index, 'rejected_quantity', event.target.value)}
                  className={`w-28 rounded-md border px-2 py-1 text-right ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </td>
              <td className="px-3 py-2 text-right">{formatNumber(line.unit_cost)}</td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={line.batch_no}
                  onChange={(event) => updateLine(index, 'batch_no', event.target.value)}
                  className={`w-32 rounded-md border px-2 py-1 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="date"
                  min={minExpiry}
                  value={line.expiry_date || ''}
                  onChange={(event) => updateLine(index, 'expiry_date', event.target.value)}
                  className={`w-36 rounded-md border px-2 py-1 ${
                    line.expiry_date && Number(line.received_quantity || 0) > 0 && line.expiry_date < minExpiry
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : darkMode
                        ? 'border-gray-600 bg-gray-800 text-gray-100'
                        : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={line.remarks}
                  onChange={(event) => updateLine(index, 'remarks', event.target.value)}
                  className={`w-48 rounded-md border px-2 py-1 ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GoodsReceivedNote = () => {
  const { user } = useAuth();
  const canViewAll = hasPermission(user, 'view-all-goods-received-notes');
  const canCreate = hasPermission(user, 'add-goods-received-notes');
  const canEdit = hasPermission(user, 'edit-goods-received-notes');
  const canDelete = hasPermission(user, 'delete-goods-received-notes');
  const canRestore = hasPermission(user, 'restore-goods-received-notes');
  const canSubmit = hasPermission(user, 'submit-goods-received-notes');
  const canVerify = hasPermission(user, 'verify-goods-received-notes');
  const canApprove = hasPermission(user, 'approve-goods-received-notes');
  const canReject = hasPermission(user, 'reject-goods-received-notes');
  const canView = hasAnyPermission(user, crudPermissions('goods-received-notes'))
    || canViewAll
    || hasPermission(user, 'view-goods-received-notes')
    || canSubmit
    || canVerify
    || canApprove
    || canReject;

  const [lpos, setLpos] = useState([]);
  const [stores, setStores] = useState([]);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowInstanceKey, setWorkflowInstanceKey] = useState(null);
  const [workflowModalReadOnly, setWorkflowModalReadOnly] = useState(false);
  const [ownershipTab, setOwnershipTab] = useState('mine');
  const viewingOthers = canViewAll && ownershipTab === 'others';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [lpoRes, storeRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/local-purchase-orders/all`),
          apiFetch(`${API_BASE_URL}/api/stores/all`),
        ]);
        const lpoJson = await lpoRes.json().catch(() => ({}));
        const storeJson = await storeRes.json().catch(() => ({}));

        if (cancelled) return;

        setLpos(Array.isArray(lpoJson?.data) ? lpoJson.data : []);
        setStores(Array.isArray(storeJson?.data) ? storeJson.data : []);
      } catch {
        if (!cancelled) {
          setLpos([]);
          setStores([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const storeOptions = useMemo(
    () =>
      stores.map((store) => ({
        value: String(store.id),
        label: store.code ? `${store.name} (${store.code})` : store.name,
      })),
    [stores]
  );

  const selectedLpoFor = (id) => lpos.find((lpo) => String(lpo.id) === String(id));

  const handleLpoChange = (value, onInputChange) => {
    const lpo = selectedLpoFor(value);
    onInputChange({ target: { name: 'local_purchase_order_id', value } });
    onInputChange({ target: { name: 'grn_items', value: lpo ? lpoItemLines(lpo) : [] } });
  };

  const crud = useApiCrud('goods-received-notes', {
    initialFormData: {
      local_purchase_order_id: '',
      grn_date: new Date().toISOString().slice(0, 10),
      remarks: '',
      grn_items: [],
    },
    initialExtraListParams: canViewAll ? { ownership: 'mine' } : {},
    validateForm: (data) => {
      const errors = {};
      if (!data.local_purchase_order_id) errors.local_purchase_order_id = 'LPO is required';
      if (!data.grn_date) errors.grn_date = 'GRN date is required';
      if (!Array.isArray(data.grn_items) || data.grn_items.length === 0) {
        errors.grn_items = 'Select an LPO with items to receive';
      } else if (data.grn_items.some((line) => !line.store_id)) {
        errors.grn_items = 'Select a store for every received item';
      } else {
        const lineErrors = [];
        data.grn_items.forEach((line, index) => {
          const label = line.item_name || `Line ${index + 1}`;
          const ordered = Number(line.ordered_quantity || 0);
          const received = Number(line.received_quantity || 0);
          const rejected = Number(line.rejected_quantity || 0);

          if (received < 0 || rejected < 0) {
            lineErrors.push(`${label}: quantities cannot be negative`);
          }
          if (received > ordered) {
            lineErrors.push(`${label}: received (${received}) cannot exceed ordered (${ordered})`);
          }
          if (received + rejected > ordered) {
            lineErrors.push(`${label}: received + rejected cannot exceed ordered (${ordered})`);
          }
          if (received > 0 && line.expiry_date && data.grn_date && line.expiry_date < data.grn_date) {
            lineErrors.push(`${label}: expiry date cannot be before the GRN date (expired items cannot be received)`);
          }
        });
        if (lineErrors.length) {
          errors.grn_items = lineErrors[0];
        }
      }
      return errors;
    },
    transformFormData: (data) => ({
      local_purchase_order_id: Number(data.local_purchase_order_id),
      grn_date: data.grn_date,
      remarks: data.remarks || null,
      items: (data.grn_items || []).map((line) => ({
        local_purchase_order_item_id: line.local_purchase_order_item_id ? Number(line.local_purchase_order_item_id) : null,
        item_id: Number(line.item_id),
        store_id: Number(line.store_id),
        item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
        ordered_quantity: Number(line.ordered_quantity || 0),
        received_quantity: Number(line.received_quantity || 0),
        rejected_quantity: Number(line.rejected_quantity || 0),
        unit_cost: Number(line.unit_cost || 0),
        batch_no: line.batch_no || null,
        expiry_date: line.expiry_date || null,
        remarks: line.remarks || null,
      })),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        local_purchase_order_id: row?.local_purchase_order_id != null ? String(row.local_purchase_order_id) : '',
        grn_items: Array.isArray(row?.items) ? normalizeGrnLines(row.items) : [],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Goods Received Note',
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

  const lpoOptions = useMemo(() => {
    const currentId = crud.formData?.local_purchase_order_id
      ? String(crud.formData.local_purchase_order_id)
      : '';

    return lpos
      .filter((lpo) => {
        const isCurrent = String(lpo.id) === currentId;
        const receivable =
          RECEIVABLE_LPO_STATUSES.includes(lpo.workflow_status)
          && Array.isArray(lpo.items)
          && lpo.items.length > 0;
        return isCurrent || receivable;
      })
      .map((lpo) => ({ value: String(lpo.id), label: lpoLabel(lpo) }));
  }, [lpos, crud.formData?.local_purchase_order_id]);

  const workflowInstanceForRow = useCallback((row) => {
    return row?.active_workflow_instance
      || row?.activeWorkflowInstance
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

  const canActOnGrnWorkflow = useCallback((row) => {
    if (!row) return false;
    if (EDITABLE_STATUSES.includes(row.workflow_status)) {
      return canSubmit;
    }
    if (row.workflow_status === 'APPROVED') {
      return false;
    }
    if (row.workflow_status === 'SUBMITTED') {
      return canVerify || canReject;
    }
    if (row.workflow_status === 'VERIFIED') {
      return canApprove || canReject;
    }
    return canVerify || canApprove || canReject;
  }, [canApprove, canReject, canSubmit, canVerify]);

  const openWorkflowModal = useCallback(
    async (row, { readOnly = false } = {}) => {
      try {
        let instanceKey = workflowInstanceKeyForRow(row);
        const trackingOnly = readOnly || !canActOnGrnWorkflow(row);

        if (!instanceKey && !trackingOnly && canSubmit && EDITABLE_STATUSES.includes(row.workflow_status)) {
          const instance = await ensureGoodsReceivedNoteWorkflow(row.id);
          await crud.reload();
          instanceKey = instance?.uid || instance?.slug || publicKey(instance) || instance?.id;
        }

        if (!instanceKey) {
          showQuickError('Workflow unavailable', 'No workflow task is available for this goods received note.');
          return;
        }

        setWorkflowModalReadOnly(trackingOnly);
        setWorkflowInstanceKey(instanceKey);
        setWorkflowModalOpen(true);
      } catch (error) {
        showQuickError('Workflow unavailable', error.message);
      }
    },
    [canActOnGrnWorkflow, canSubmit, crud, workflowInstanceKeyForRow]
  );

  const pageConfig = {
    icon: FiInbox,
    title: 'Goods Received Notes',
    subtitle: viewingOthers
      ? 'Track status of goods received notes created by other users'
      : 'Draft GRNs, then process verification and approval through workflow',
    addButtonLabel: 'Add GRN',
    searchPlaceholder: 'Search GRNs...',
    hideAddButton: !canCreate || viewingOthers,
    hideActions: ['edit', 'delete'],
  };

  const ownershipTabs = useMemo(() => (
    canViewAll
      ? [
          { id: 'mine', label: 'My GRNs', icon: FiInbox },
          { id: 'others', label: 'Other GRNs', icon: FiUsers },
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
    {
      header: 'LPO',
      accessor: 'local_purchase_order.code',
      noWrap: true,
      render: (row) => row.local_purchase_order?.code || row.localPurchaseOrder?.code || row.local_purchase_order_id,
    },
    {
      header: 'Stores',
      accessor: 'items',
      noWrap: true,
      render: (row) => storeSummary(row.items),
    },
    { header: 'Date', accessor: 'grn_date', noWrap: true },
    ...(viewingOthers
      ? [{
          header: 'Received By',
          accessor: 'receiver.full_name',
          noWrap: true,
          render: (row) => row.receiver?.full_name || '—',
        }]
      : []),
    {
      header: 'Workflow',
      accessor: 'workflow_status',
      noWrap: true,
      render: (row) => <WorkflowStatusPill status={row.workflow_status} />,
    },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'GRN Details',
      icon: FiInfo,
      fields: [
        {
          name: 'local_purchase_order_id',
          label: 'Local Purchase Order',
          type: 'custom',
          required: true,
          fullWidth: false,
          render: (formData, onInputChange, errors, darkMode) => (
            <div className="relative">
              <SearchableSelect
                options={lpoOptions}
                value={formData.local_purchase_order_id ? String(formData.local_purchase_order_id) : ''}
                onChange={(value) => handleLpoChange(value, onInputChange)}
                placeholder={lpoOptions.length ? 'Select LPO' : 'No receivable LPOs found'}
                darkMode={darkMode}
              />
              <label
                className={
                  darkMode
                    ? 'absolute left-2 -top-2.5 z-10 bg-stone-900 px-1 text-xs font-medium text-gray-400 pointer-events-none'
                    : 'absolute left-2 -top-2.5 z-10 bg-white px-1 text-xs font-medium text-gray-600 pointer-events-none'
                }
              >
                Local Purchase Order *
              </label>
              {errors.local_purchase_order_id ? <p className="mt-1 text-xs text-red-500">{errors.local_purchase_order_id}</p> : null}
            </div>
          ),
        },
        { name: 'grn_date', label: 'GRN Date', type: 'date', required: true, fullWidth: false },
        { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
      ],
    },
    {
      id: 'items',
      label: 'Received Items',
      icon: FiPackage,
      fields: [
        {
          name: 'grn_items',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => (
            <div className="space-y-2">
              <GoodsReceivedItemsEditor
                value={formData.grn_items}
                onChange={onInputChange}
                selectedLpo={selectedLpoFor(formData.local_purchase_order_id)}
                stores={stores}
                storeOptions={storeOptions}
                darkMode={darkMode}
                grnDate={formData.grn_date}
              />
              {errors.grn_items ? <p className="text-xs text-red-500">{errors.grn_items}</p> : null}
            </div>
          ),
        },
      ],
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'GRN Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        {
          label: 'LPO',
          accessor: 'local_purchase_order.code',
          valueRender: (item) => item.local_purchase_order?.code || item.local_purchase_order_id || '—',
        },
        { label: 'GRN Date', accessor: 'grn_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status', valueRender: (item) => <WorkflowStatusPill status={item.workflow_status} /> },
        { label: 'Received By', accessor: 'receiver.full_name', valueRender: (item) => item.receiver?.full_name || '—' },
        { label: 'Submitted', accessor: 'submitted_at', valueRender: (item) => formatDateTime(item.submitted_at) },
        { label: 'Verified By', accessor: 'verifier.full_name', valueRender: (item) => item.verifier?.full_name || '—' },
        { label: 'Verified At', accessor: 'verified_at', valueRender: (item) => formatDateTime(item.verified_at) },
        { label: 'Approved By', accessor: 'approver.full_name', valueRender: (item) => item.approver?.full_name || '—' },
        { label: 'Approved At', accessor: 'approved_at', valueRender: (item) => formatDateTime(item.approved_at) },
        { label: 'Rejected At', accessor: 'rejected_at', valueRender: (item) => formatDateTime(item.rejected_at) },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
      ],
    },
    {
      id: 'items',
      label: 'Received Items',
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
                      <th className="px-3 py-2">Store</th>
                      <th className="px-3 py-2">Ordered</th>
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2">Rejected</th>
                      <th className="px-3 py-2">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.store_id}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2">{line.store?.name || line.store_id || '—'}</td>
                        <td className="px-3 py-2">{formatNumber(line.ordered_quantity)}</td>
                        <td className="px-3 py-2">{formatNumber(line.received_quantity)}</td>
                        <td className="px-3 py-2">{formatNumber(line.rejected_quantity)}</td>
                        <td className="px-3 py-2">{line.batch_no || '—'}</td>
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
      visible: (row) => !viewingOthers && canActOnGrnWorkflow(row),
      onClick: (row) => openWorkflowModal(row, { readOnly: false }),
    },
    {
      type: 'workflow-progress',
      label: 'Progress',
      icon: FiEye,
      visible: (row) => Boolean(workflowInstanceKeyForRow(row)) && (viewingOthers || !canActOnGrnWorkflow(row)),
      onClick: (row) => openWorkflowModal(row, { readOnly: true }),
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
        <p className="text-sm text-stone-500">You do not have permission to view goods received notes.</p>
      </div>
    );
  }

  return (
    <>
      <CRUDPage
        pageConfig={pageConfig}
        statsConfig={statsConfig}
        tableColumns={tableColumns}
        formFields={[]}
        formTabs={formTabs}
        viewTabs={viewTabs}
        modalTitle="Goods Received Note"
        modalMaxWidth="max-w-7xl"
        formFieldsLayout="two-col"
        crud={crud}
        submitLabel={crud.isEditing ? 'Save Changes' : 'Save as Draft'}
        extraActions={extraActions}
        belowStats={ownershipTabs.length ? (
          <PageTabs
            tabs={ownershipTabs}
            activeTab={ownershipTab}
            onChange={handleOwnershipTabChange}
            ariaLabel="Goods received note ownership"
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

export default GoodsReceivedNote;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiClock,
  FiEdit2,
  FiEye,
  FiGitPullRequest,
  FiInfo,
  FiPackage,
  FiSend,
  FiTrash2,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PageTabs from '../../components/PageTabs';
import SearchableSelect from '../../components/SearchableSelect';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { crudPermissions, hasAnyPermission, hasPermission } from '../../utils/permissions';
import { publicKey } from '../../utils/publicKey';
import { showQuickError, showQuickSuccess } from '../../utils/dialogUtils';
import {
  cancelStoreIssue,
  ensureStoreIssueWorkflow,
} from '../../utils/storeIssueApi';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED', 'RETURNED'];

const unitLabelFromRequestItem = (line) => {
  const unit = line?.item_unit?.unit || line?.itemUnit?.unit;
  if (unit?.symbol) return unit.symbol;
  if (unit?.name) return unit.name;
  return line?.unit_label || '—';
};

const remainingToIssueFromRequestItem = (line) => {
  if (line?.remaining_to_issue != null && line.remaining_to_issue !== '') {
    return Number(line.remaining_to_issue);
  }
  const approved = Number(line.approved_quantity);
  const requested = Number(line.requested_quantity);
  const ordered = Number.isFinite(approved) && approved > 0
    ? approved
    : (Number.isFinite(requested) ? requested : 0);
  const alreadyIssued = Number(line.issued_quantity || 0);
  return Math.max(0, ordered - (Number.isFinite(alreadyIssued) ? alreadyIssued : 0));
};

const buildLinesFromStoreRequest = (request) =>
  (request?.items || [])
    .map((line) => {
      const requestedAmount = remainingToIssueFromRequestItem(line);
      const availableAmount = line.available_quantity != null ? Number(line.available_quantity) : '';
      const defaultIssue = requestedAmount > 0 ? requestedAmount : '';

      return {
        store_request_item_id: line.id != null ? String(line.id) : '',
        item_id: line.item_id != null ? String(line.item_id) : '',
        item_name: line.item?.name || line.item_name || `Item #${line.item_id}`,
        item_code: line.item?.code || '',
        item_unit_id: line.item_unit_id != null ? String(line.item_unit_id) : '',
        unit_label: unitLabelFromRequestItem(line),
        requested_amount: requestedAmount,
        available_amount: availableAmount,
        quantity: defaultIssue,
        remarks: line.remarks || '',
      };
    })
    .filter((line) => line.item_id && Number(line.requested_amount) > 0);

const storeLabel = (store) => {
  if (!store) return '—';
  return store.code ? `${store.name} (${store.code})` : store.name;
};

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const userName = (user) => {
  const person = user?.person;
  const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(' ');
  return user?.full_name || fullName || user?.name || user?.email || '—';
};

const StoreIssueItemsEditor = ({
  value = [],
  onChange,
  errors,
  darkMode,
  storeRequestSelected = false,
}) => {
  const rows = Array.isArray(value) ? value.filter((line) => line?.item_id) : [];

  const updateLine = (index, field, nextValue) => {
    const next = rows.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: nextValue } : line
    );
    onChange({ target: { name: 'issue_items', value: next } });
  };

  const inputClass = `h-9 rounded-md border px-2 text-sm outline-none focus:border-primary-500 ${
    darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`;
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  if (!storeRequestSelected) {
    return (
      <div className="space-y-2">
        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Issue Items</p>
        <div className={`rounded-lg border border-dashed px-4 py-8 text-center text-sm ${borderClass} ${mutedClass}`}>
          Select an approved store request first. Item and unit details are filled automatically from that request.
        </div>
        {errors.issue_items ? <p className="text-sm text-red-600">{errors.issue_items}</p> : null}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="space-y-2">
        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Issue Items</p>
        <div className={`rounded-lg border border-dashed px-4 py-8 text-center text-sm ${borderClass} ${mutedClass}`}>
          The selected store request has no remaining quantities to issue.
        </div>
        {errors.issue_items ? <p className="text-sm text-red-600">{errors.issue_items}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Issue Items</p>
        <p className={`mt-1 text-xs ${mutedClass}`}>
          Item and unit are taken from the store request. Enter issue quantities up to requested and available.
        </p>
        {errors.issue_items ? <p className="mt-1 text-sm text-red-600">{errors.issue_items}</p> : null}
      </div>

      <div className={`overflow-x-auto rounded-lg border ${borderClass}`}>
        <table className="min-w-[900px] w-full text-sm">
          <thead className={darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item</th>
              <th className="px-3 py-2 text-left font-semibold">Unit</th>
              <th className="px-3 py-2 text-right font-semibold">Available</th>
              <th className="px-3 py-2 text-right font-semibold">Requested</th>
              <th className="w-32 px-3 py-2 text-right font-semibold">Issue</th>
              <th className="px-3 py-2 text-left font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
            {rows.map((line, index) => (
              <tr key={line.store_request_item_id || `${line.item_id}-${index}`}>
                <td className="px-3 py-2">
                  <div className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
                    {line.item_name || `Item #${line.item_id}`}
                  </div>
                  {line.item_code ? <div className="text-xs text-gray-500">{line.item_code}</div> : null}
                </td>
                <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {line.unit_label || '—'}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {line.available_amount !== '' && line.available_amount != null
                    ? formatNumber(line.available_amount)
                    : '—'}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {line.requested_amount !== '' && line.requested_amount != null
                    ? formatNumber(line.requested_amount)
                    : '—'}
                </td>
                <td className="w-32 px-3 py-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={line.quantity}
                    onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                    className={`${inputClass} ml-auto block w-full text-right`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={line.remarks}
                    onChange={(event) => updateLine(index, 'remarks', event.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StoreIssue = () => {
  const { user } = useAuth();
  const canViewAll = hasPermission(user, 'view-all-store-issues');
  const canCreate = hasPermission(user, 'add-store-issues');
  const canEdit = hasPermission(user, 'edit-store-issues');
  const canDelete = hasPermission(user, 'delete-store-issues');
  const canRestore = hasPermission(user, 'restore-store-issues');
  const canSubmit = hasPermission(user, 'submit-store-issues');
  const canVerify = hasPermission(user, 'verify-store-issues');
  const canApprove = hasPermission(user, 'approve-store-issues');
  const canReject = hasPermission(user, 'reject-store-issues');
  const canView = hasAnyPermission(user, crudPermissions('store-issues'))
    || canViewAll
    || hasPermission(user, 'view-store-issues')
    || canSubmit
    || canVerify
    || canApprove
    || canReject;

  const [stores, setStores] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowInstanceKey, setWorkflowInstanceKey] = useState(null);
  const [workflowModalReadOnly, setWorkflowModalReadOnly] = useState(false);
  const [ownershipTab, setOwnershipTab] = useState('mine');
  const viewingOthers = canViewAll && ownershipTab === 'others';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const storesRes = await apiFetch(`${API_BASE_URL}/api/stores/all`);
        const storesJson = await storesRes.json().catch(() => ({}));
        if (cancelled) return;
        setStores(Array.isArray(storesJson?.data) ? storesJson.data : []);
      } catch {
        if (!cancelled) setStores([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadApprovedRequests = useCallback(async ({ exceptIssueId = null, includeStoreRequestId = null } = {}) => {
    try {
      const params = new URLSearchParams();
      if (exceptIssueId) params.set('except_issue_id', String(exceptIssueId));
      if (includeStoreRequestId) params.set('include_store_request_id', String(includeStoreRequestId));
      const qs = params.toString();
      const res = await apiFetch(`${API_BASE_URL}/api/store-requests/approved-for-issue${qs ? `?${qs}` : ''}`);
      const payload = await res.json().catch(() => ({}));
      setApprovedRequests(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setApprovedRequests([]);
    }
  }, []);

  const storeOptions = useMemo(() => [
    { value: '', label: 'Select store' },
    ...stores.map((store) => ({ value: String(store.id), label: store.code ? `${store.name} (${store.code})` : store.name })),
  ], [stores]);

  const requestOptions = useMemo(
    () =>
      approvedRequests.map((row) => ({
        value: String(row.id),
        label: `${row.code || `STRQ #${row.id}`} · ${formatDate(row.request_date)} · ${storeLabel(row.source_store || row.sourceStore)} → ${storeLabel(row.destination_store || row.destinationStore)} · ${row.items_count ?? row.items?.length ?? 0} item(s)`,
      })),
    [approvedRequests]
  );

  const requestById = useMemo(
    () => Object.fromEntries(approvedRequests.map((row) => [String(row.id), row])),
    [approvedRequests]
  );

  const crud = useApiCrud('store-issues', {
    initialFormData: {
      store_request_id: '',
      source_store_id: '',
      destination_store_id: '',
      issue_date: new Date().toISOString().slice(0, 10),
      remarks: '',
      issue_items: [],
    },
    initialExtraListParams: canViewAll ? { ownership: 'mine' } : {},
    validateForm: (data) => {
      const errors = {};
      if (!data.store_request_id) errors.store_request_id = 'Select an approved store request';
      if (!data.source_store_id) errors.source_store_id = 'Source store is required';
      if (!data.destination_store_id) errors.destination_store_id = 'Destination store is required';
      if (String(data.source_store_id) === String(data.destination_store_id)) {
        errors.destination_store_id = 'Destination must be different from source';
      }
      if (!data.issue_date) errors.issue_date = 'Issue date is required';

      if (!data.store_request_id) {
        errors.issue_items = 'Select an approved store request to load items';
      } else {
        const validLines = (data.issue_items || []).filter((line) => line.item_id && Number(line.quantity) > 0);
        if (!validLines.length) {
          errors.issue_items = 'Enter an issue quantity greater than zero for at least one item';
        }
      }
      return errors;
    },
    transformFormData: (data) => ({
      store_request_id: data.store_request_id ? Number(data.store_request_id) : null,
      source_store_id: Number(data.source_store_id),
      destination_store_id: Number(data.destination_store_id),
      issue_date: data.issue_date,
      remarks: data.remarks || null,
      items: (data.issue_items || [])
        .filter((line) => line.item_id && Number(line.quantity) > 0)
        .map((line) => ({
          store_request_item_id: line.store_request_item_id ? Number(line.store_request_item_id) : null,
          item_id: Number(line.item_id),
          item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
          quantity: Number(line.quantity || 0),
          unit_cost: 0,
          remarks: line.remarks || null,
        })),
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        store_request_id: row?.store_request_id != null ? String(row.store_request_id) : '',
        source_store_id: row?.source_store_id != null ? String(row.source_store_id) : '',
        destination_store_id: row?.destination_store_id != null ? String(row.destination_store_id) : '',
        issue_items: Array.isArray(row?.items) && row.items.length
          ? row.items.map((line) => ({
              store_request_item_id: line.store_request_item_id != null ? String(line.store_request_item_id) : '',
              item_id: line.item_id != null ? String(line.item_id) : '',
              item_name: line.item?.name || line.item_name || '',
              item_code: line.item?.code || '',
              item_unit_id: line.item_unit_id != null ? String(line.item_unit_id) : '',
              unit_label: line.item_unit?.unit?.symbol
                || line.itemUnit?.unit?.symbol
                || line.item_unit?.unit?.name
                || line.itemUnit?.unit?.name
                || '—',
              requested_amount: '',
              available_amount: '',
              quantity: line.quantity ?? '',
              remarks: line.remarks || '',
            }))
          : [],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Store Issue',
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
      issued: Number(stats?.issued || 0),
    }),
  });

  useEffect(() => {
    if (!crud.showModal) return;
    loadApprovedRequests({
      exceptIssueId: crud.isEditing ? crud.formData?.id : null,
      includeStoreRequestId: crud.formData?.store_request_id || null,
    });
  }, [
    crud.showModal,
    crud.isEditing,
    crud.formData?.id,
    crud.formData?.store_request_id,
    loadApprovedRequests,
  ]);

  useEffect(() => {
    if (!crud.showModal || !crud.formData?.store_request_id) return;

    const request = requestById[String(crud.formData.store_request_id)];
    if (!request?.items?.length) return;

    const requestLineById = Object.fromEntries(
      request.items.map((line) => [String(line.id), line])
    );

    const currentLines = crud.formData.issue_items || [];
    if (!currentLines.length) return;

    const nextLines = currentLines.map((line) => {
      const reqLine = line.store_request_item_id
        ? requestLineById[String(line.store_request_item_id)]
        : null;
      if (!reqLine) return line;

      const requestedAmount = remainingToIssueFromRequestItem(reqLine);
      const availableAmount = reqLine.available_quantity != null ? Number(reqLine.available_quantity) : '';
      const unitLabel = unitLabelFromRequestItem(reqLine);

      if (
        Number(line.requested_amount) === requestedAmount
        && Number(line.available_amount) === Number(availableAmount)
        && line.unit_label === unitLabel
      ) {
        return line;
      }

      return {
        ...line,
        unit_label: unitLabel,
        requested_amount: requestedAmount,
        available_amount: availableAmount,
      };
    });

    const changed = nextLines.some((line, index) => line !== currentLines[index]);
    if (changed) {
      crud.handleInputChange({ target: { name: 'issue_items', value: nextLines } });
    }
  }, [
    crud.showModal,
    crud.formData?.store_request_id,
    crud.formData?.issue_items,
    crud.handleInputChange,
    requestById,
  ]);

  const handleStoreRequestChange = (requestId, onInputChange, formData) => {
    const request = requestId ? requestById[String(requestId)] : null;

    onInputChange({ target: { name: 'store_request_id', value: requestId || '' } });

    if (!request) {
      onInputChange({ target: { name: 'source_store_id', value: '' } });
      onInputChange({ target: { name: 'destination_store_id', value: '' } });
      onInputChange({ target: { name: 'issue_items', value: [] } });
      return;
    }

    onInputChange({
      target: {
        name: 'source_store_id',
        value: request.source_store_id != null ? String(request.source_store_id) : '',
      },
    });
    onInputChange({
      target: {
        name: 'destination_store_id',
        value: request.destination_store_id != null ? String(request.destination_store_id) : '',
      },
    });
    onInputChange({
      target: {
        name: 'issue_items',
        value: buildLinesFromStoreRequest(request),
      },
    });

    if (request.remarks && !formData.remarks?.trim()) {
      onInputChange({ target: { name: 'remarks', value: request.remarks } });
    }
  };

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
        const instance = await ensureStoreIssueWorkflow(row.id);
        await crud.reload();
        instanceKey = instance?.uid || instance?.slug || publicKey(instance) || instance?.id;
      }

      if (!instanceKey) {
        showQuickError('Workflow unavailable', 'No workflow task is available for this store issue.');
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
    icon: FiSend,
    title: 'Store Issues',
    subtitle: viewingOthers
      ? 'Track status of store issues created by other users'
      : 'Draft store issues, then process verification and approval to post stock',
    addButtonLabel: 'Add Store Issue',
    searchPlaceholder: 'Search store issues...',
    hideAddButton: !canCreate || viewingOthers,
    hideActions: ['edit', 'delete'],
  };

  const ownershipTabs = useMemo(() => (
    canViewAll
      ? [
          { id: 'mine', label: 'My Issues', icon: FiSend },
          { id: 'others', label: 'Other Issues', icon: FiUsers },
        ]
      : []
  ), [canViewAll]);

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'inReview', label: 'In Review', icon: FiGitPullRequest, iconColor: 'orange-600' },
      { key: 'issued', label: 'Issued', icon: FiTruck, iconColor: 'green-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Source Store', accessor: 'source_store', noWrap: true, render: (row) => row.source_store?.code ? `${row.source_store.name} (${row.source_store.code})` : row.source_store?.name || row.sourceStore?.name || row.source_store_id },
    { header: 'Destination', accessor: 'destination_store', noWrap: true, render: (row) => row.destination_store?.code ? `${row.destination_store.name} (${row.destination_store.code})` : row.destination_store?.name || row.destinationStore?.name || row.destination_store_id },
    { header: 'Issue Date', accessor: 'issue_date', noWrap: true, render: (row) => row.issue_date ? new Date(row.issue_date).toLocaleDateString() : '-' },
    ...(viewingOthers
      ? [{
          header: 'Created By',
          accessor: 'creator.full_name',
          noWrap: true,
          render: (row) => userName(row.creator),
        }]
      : []),
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true, render: (row) => <WorkflowStatusPill status={row.workflow_status} /> },
    { header: 'Items', accessor: 'items', noWrap: true, render: (row) => (Array.isArray(row.items) ? row.items.length : 0) },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Issue Details',
      icon: FiInfo,
      fields: [
        {
          name: 'issue_details_row',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => {
            const labelClass = `mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;
            const dateInputClass = `h-10 w-full rounded-md border px-3 text-sm outline-none focus:border-primary-500 ${
              darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
            }`;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="xl:col-span-4">
                    <label className={labelClass}>Approved Store Request *</label>
                    <SearchableSelect
                      options={requestOptions}
                      value={formData.store_request_id ? String(formData.store_request_id) : ''}
                      onChange={(val) => handleStoreRequestChange(val, onInputChange, formData)}
                      placeholder={requestOptions.length ? 'Select approved store request' : 'No approved store requests available'}
                      darkMode={darkMode}
                    />
                    {errors.store_request_id ? <p className="mt-1 text-xs text-red-500">{errors.store_request_id}</p> : null}
                    {!requestOptions.length ? (
                      <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Only approved store requests without an active issue are listed.
                      </p>
                    ) : null}
                  </div>

                  <div className="xl:col-span-3">
                    <label className={labelClass}>Source Store *</label>
                    <SearchableSelect
                      options={storeOptions}
                      value={formData.source_store_id ? String(formData.source_store_id) : ''}
                      onChange={(val) => onInputChange({ target: { name: 'source_store_id', value: val } })}
                      placeholder="Select source store"
                      darkMode={darkMode}
                      disabled={Boolean(formData.store_request_id)}
                    />
                    {errors.source_store_id ? <p className="mt-1 text-xs text-red-500">{errors.source_store_id}</p> : null}
                  </div>

                  <div className="xl:col-span-3">
                    <label className={labelClass}>Destination Store *</label>
                    <SearchableSelect
                      options={storeOptions}
                      value={formData.destination_store_id ? String(formData.destination_store_id) : ''}
                      onChange={(val) => onInputChange({ target: { name: 'destination_store_id', value: val } })}
                      placeholder="Select destination store"
                      darkMode={darkMode}
                      disabled={Boolean(formData.store_request_id)}
                    />
                    {errors.destination_store_id ? <p className="mt-1 text-xs text-red-500">{errors.destination_store_id}</p> : null}
                  </div>

                  <div className="xl:col-span-2">
                    <label className={labelClass}>Issue Date *</label>
                    <input
                      type="date"
                      value={formData.issue_date || ''}
                      onChange={(event) => onInputChange({ target: { name: 'issue_date', value: event.target.value } })}
                      className={dateInputClass}
                    />
                    {errors.issue_date ? <p className="mt-1 text-xs text-red-500">{errors.issue_date}</p> : null}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks || ''}
                    onChange={(event) => onInputChange({ target: { name: 'remarks', value: event.target.value } })}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary-500 ${
                      darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>
            );
          },
        },
      ],
    },
    {
      id: 'items',
      label: 'Issue Items',
      icon: FiPackage,
      fields: [
        {
          name: 'issue_items',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => (
            <StoreIssueItemsEditor
              value={formData.issue_items}
              onChange={onInputChange}
              errors={errors}
              darkMode={darkMode}
              storeRequestSelected={Boolean(formData.store_request_id)}
            />
          ),
        },
      ],
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Issue Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Store Request', accessor: 'store_request.code', valueRender: (item) => item.store_request?.code || item.storeRequest?.code || item.store_request_id || '—' },
        { label: 'Source Store', accessor: 'source_store.name', valueRender: (item) => item.source_store?.name || item.sourceStore?.name || '—' },
        { label: 'Destination Store', accessor: 'destination_store.name', valueRender: (item) => item.destination_store?.name || item.destinationStore?.name || '—' },
        { label: 'Issue Date', accessor: 'issue_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status', valueRender: (item) => <WorkflowStatusPill status={item.workflow_status} /> },
        { label: 'Created By', accessor: 'creator', valueRender: (item) => userName(item.creator) },
        { label: 'Submitted', accessor: 'submitted_at', valueRender: (item) => formatDateTime(item.submitted_at) },
        { label: 'Verified By', accessor: 'verifier', valueRender: (item) => userName(item.verifier) },
        { label: 'Approved By', accessor: 'approver', valueRender: (item) => userName(item.approver) },
        { label: 'Issued By', accessor: 'issuer', valueRender: (item) => userName(item.issuer) },
        { label: 'Issued At', accessor: 'issued_at', valueRender: (item) => formatDateTime(item.issued_at) },
        { label: 'Rejected At', accessor: 'rejected_at', valueRender: (item) => formatDateTime(item.rejected_at) },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'items',
      label: 'Issue Items',
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
                      <th className="px-3 py-2 text-right">Available</th>
                      <th className="px-3 py-2 text-right">Requested</th>
                      <th className="px-3 py-2 text-right">Issue</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">{formatNumber(line.quantity)}</td>
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
      type: 'cancel',
      label: 'Cancel',
      icon: FiXCircle,
      visible: (row) => !viewingOthers && canEdit && !['ISSUED', 'CANCELLED'].includes(row.workflow_status),
      onClick: async (row) => {
        try {
          await cancelStoreIssue(row.id);
          showQuickSuccess('Store issue cancelled');
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
        <p className="text-sm text-stone-500">You do not have permission to view store issues.</p>
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
        modalTitle="Store Issue"
        modalMaxWidth="max-w-7xl"
        crud={crud}
        submitLabel={crud.isEditing ? 'Save Changes' : 'Save as Draft'}
        extraActions={extraActions}
        belowStats={ownershipTabs.length ? (
          <PageTabs
            tabs={ownershipTabs}
            activeTab={ownershipTab}
            onChange={setOwnershipTab}
            ariaLabel="Store issue ownership"
          />
        ) : null}
        filterOptions={[
          { label: 'All', value: 'all' },
          { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
          { label: 'Workflow: Submitted', value: 'workflow:SUBMITTED' },
          { label: 'Workflow: Verified', value: 'workflow:VERIFIED' },
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

export default StoreIssue;

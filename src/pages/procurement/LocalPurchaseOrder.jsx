import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiFileText,
  FiGitPullRequest,
  FiInfo,
  FiPackage,
  FiPrinter,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import LpoItemsEditor from '../../components/LpoItemsEditor';
import PageTabs from '../../components/PageTabs';
import SearchableSelect from '../../components/SearchableSelect';
import WorkflowStatusPill from '../../components/WorkflowStatusPill';
import WorkflowTaskModal from '../../components/workflow/WorkflowTaskModal';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { crudPermissions, hasAnyPermission, hasPermission } from '../../utils/permissions';
import { publicKey } from '../../utils/publicKey';
import {
  showQuickError,
  showQuickSuccess,
  showWorkflowConfirm,
} from '../../utils/dialogUtils';
import {
  canPrintLocalPurchaseOrder,
  downloadLocalPurchaseOrderPdf,
  ensureLocalPurchaseOrderWorkflow,
  sendLocalPurchaseOrder,
} from '../../utils/localPurchaseOrderApi';

const EDITABLE_STATUSES = ['DRAFT', 'REJECTED', 'RETURNED'];

const emptyLine = () => ({ item_id: '', quantity: '', unit_price: '' });

const getSupplierItems = (supplier) => supplier?.supplier_items || supplier?.supplierItems || [];

const itemUnitRows = (item) => item?.item_units || item?.itemUnits || [];

const purchaseUnitRows = (item) => {
  const rows = itemUnitRows(item).filter((row) => row.is_active !== false && row.is_purchase_unit);
  return rows.length ? rows : itemUnitRows(item);
};

const unitOptionLabel = (unit) => {
  if (!unit) return '';
  if (unit.name && unit.symbol && unit.name !== unit.symbol) {
    return `${unit.name} (${unit.symbol})`;
  }
  return unit.symbol || unit.name || '';
};

const purchaseUnitLabel = (item, itemUnitId = null) => {
  const rows = purchaseUnitRows(item);
  const selected = itemUnitId
    ? rows.find((row) => String(row.id) === String(itemUnitId))
    : rows.find((row) => row.is_default_purchase) || rows[0];
  return unitOptionLabel(selected?.unit) || unitOptionLabel(item?.unit);
};

const hasAgreedPriceItems = (supplier) =>
  getSupplierItems(supplier).some((line) => {
    const itemId = line?.item?.id ?? line?.item_id;
    const price = line?.agreed_price;
    return itemId != null && price !== '' && price != null && Number(price) >= 0;
  });

const buildSupplierCatalog = (supplier) => {
  const itemOptions = [];
  const priceByItemId = {};
  const purchaseUnitByItemId = {};

  for (const line of getSupplierItems(supplier)) {
    const item = line.item;
    if (!item?.id) continue;
    const id = String(item.id);
    const purchaseUnit = purchaseUnitLabel(item);
    itemOptions.push({
      value: id,
      label: `${item.name}${item.code ? ` (${item.code})` : ''}${purchaseUnit ? ` · ${purchaseUnit}` : ''}`,
    });
    priceByItemId[id] = line.agreed_price;
    purchaseUnitByItemId[id] = purchaseUnit || '—';
  }

  return { itemOptions, priceByItemId, purchaseUnitByItemId };
};

const remapLinesForSupplier = (lines, priceByItemId) => {
  const source = Array.isArray(lines) && lines.length ? lines : [emptyLine()];

  return source.map((line) => {
    const id = line.item_id ? String(line.item_id) : '';
    if (id && priceByItemId[id] != null) {
      return {
        item_id: id,
        quantity: line.quantity ?? '',
        unit_price: priceByItemId[id],
      };
    }
    return emptyLine();
  });
};

const buildLinesFromRequisition = (requisition, priceByItemId) => {
  const lines = (requisition?.items || [])
    .filter((line) => line.item_id && priceByItemId[String(line.item_id)] != null)
    .map((line) => ({
      item_id: String(line.item_id),
      item_unit_id: line.item_unit_id ? String(line.item_unit_id) : '',
      quantity: line.quantity ?? '',
      unit_price: priceByItemId[String(line.item_id)],
    }));

  return lines.length ? lines : [emptyLine()];
};

const formatMoney = (value) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LocalPurchaseOrder = () => {
  const { user } = useAuth();
  const canViewAll = hasPermission(user, 'view-all-local-purchase-orders');
  const canCreate = hasPermission(user, 'add-local-purchase-orders');
  const canEdit = hasPermission(user, 'edit-local-purchase-orders');
  const canDelete = hasPermission(user, 'delete-local-purchase-orders');
  const canRestore = hasPermission(user, 'restore-local-purchase-orders');
  const canSubmit = hasPermission(user, 'submit-local-purchase-orders');
  const canVerify = hasPermission(user, 'verify-local-purchase-orders');
  const canApprove = hasPermission(user, 'approve-local-purchase-orders');
  const canReject = hasPermission(user, 'reject-local-purchase-orders');
  const canPrint = hasPermission(user, 'print-local-purchase-orders');
  const canView = hasAnyPermission(user, crudPermissions('local-purchase-orders'))
    || canViewAll
    || hasPermission(user, 'view-local-purchase-orders')
    || canSubmit
    || canVerify
    || canApprove
    || canReject
    || canPrint;

  const [suppliers, setSuppliers] = useState([]);
  const [approvedRequisitions, setApprovedRequisitions] = useState([]);
  const [printingId, setPrintingId] = useState(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowInstanceKey, setWorkflowInstanceKey] = useState(null);
  const [workflowModalReadOnly, setWorkflowModalReadOnly] = useState(false);
  const [ownershipTab, setOwnershipTab] = useState('mine');
  const viewingOthers = canViewAll && ownershipTab === 'others';

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/suppliers/all`);
        const payload = await res.json();
        setSuppliers(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setSuppliers([]);
      }
    };
    loadSuppliers();
  }, []);

  const loadApprovedRequisitions = useCallback(async ({ exceptLpoId = null, includeRequisitionId = null, supplierId = null } = {}) => {
    try {
      const params = new URLSearchParams();
      if (exceptLpoId) params.set('except_lpo_id', String(exceptLpoId));
      if (includeRequisitionId) params.set('include_requisition_id', String(includeRequisitionId));
      if (supplierId) params.set('supplier_id', String(supplierId));
      const qs = params.toString();
      const res = await apiFetch(`${API_BASE_URL}/api/purchase-requisitions/approved-for-lpo${qs ? `?${qs}` : ''}`);
      const payload = await res.json();
      setApprovedRequisitions(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setApprovedRequisitions([]);
    }
  }, []);

  const crud = useApiCrud('local-purchase-orders', {
    initialFormData: {
      supplier_id: '',
      purchase_requisition_id: '',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: '',
      tax_amount: 0,
      discount_amount: 0,
      remarks: '',
      lpo_items: [emptyLine()],
    },
    initialExtraListParams: canViewAll ? { ownership: 'mine' } : {},
    validateForm: (data) => {
      const errors = {};
      if (!data.supplier_id) errors.supplier_id = 'Supplier is required';
      if (!data.order_date) errors.order_date = 'Order date is required';

      const supplier = suppliers.find((row) => String(row.id) === String(data.supplier_id));
      if (supplier && !hasAgreedPriceItems(supplier)) {
        errors.supplier_id = 'Selected supplier has no agreed item prices';
      }

      const { priceByItemId } = buildSupplierCatalog(supplier);

      const validLines = (data.lpo_items || []).filter(
        (line) =>
          line.item_id &&
          priceByItemId[String(line.item_id)] != null &&
          Number(line.quantity) > 0
      );

      if (validLines.length === 0) {
        errors.lpo_items = 'Add at least one line with item and quantity';
      }

      const itemIds = validLines.map((line) => String(line.item_id));
      if (new Set(itemIds).size !== itemIds.length) {
        errors.lpo_items = 'Each item can only appear once on the order';
      }

      return errors;
    },
    transformFormData: (data) => {
      const supplier = suppliers.find((row) => String(row.id) === String(data.supplier_id));
      const { priceByItemId } = buildSupplierCatalog(supplier);

      const items = (data.lpo_items || [])
        .filter(
          (line) =>
            line.item_id &&
            priceByItemId[String(line.item_id)] != null &&
            Number(line.quantity) > 0
        )
        .map((line) => ({
          item_id: Number(line.item_id),
          item_unit_id: line.item_unit_id ? Number(line.item_unit_id) : null,
          quantity: Number(line.quantity),
          unit_price: Number(priceByItemId[String(line.item_id)]),
          tax_amount: 0,
          discount_amount: 0,
        }));

      return {
        supplier_id: Number(data.supplier_id),
        purchase_requisition_id: data.purchase_requisition_id ? Number(data.purchase_requisition_id) : null,
        order_date: data.order_date,
        expected_delivery_date: data.expected_delivery_date || null,
        tax_amount: Number(data.tax_amount || 0),
        discount_amount: Number(data.discount_amount || 0),
        remarks: data.remarks || null,
        items,
      };
    },
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        supplier_id: row.supplier_id ? String(row.supplier_id) : '',
        purchase_requisition_id: row.purchase_requisition_id ? String(row.purchase_requisition_id) : '',
        lpo_items: Array.isArray(row?.items)
          ? row.items.map((line) => ({
              item_id: String(line.item_id),
              item_unit_id: line.item_unit_id ? String(line.item_unit_id) : '',
              quantity: line.quantity,
              conversion_factor: line.conversion_factor,
              base_quantity: line.base_quantity,
              unit_price: line.unit_price,
            }))
          : [emptyLine()],
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Local Purchase Order',
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
      sent: Number(stats?.sent || 0),
      closed: Number(stats?.closed || 0),
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

  const handlePrint = async (row) => {
    if (!row?.id) return;

    setPrintingId(row.id);
    try {
      await downloadLocalPurchaseOrderPdf(row.id, row.code);
    } catch (error) {
      showQuickError('Print failed', error?.message || 'Could not generate the LPO PDF.');
    } finally {
      setPrintingId(null);
    }
  };

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

  const canActOnLpoWorkflow = useCallback((row) => {
    if (!row) return false;
    if (EDITABLE_STATUSES.includes(row.workflow_status)) {
      return canSubmit;
    }
    if (['SENT', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'CLOSED', 'APPROVED'].includes(row.workflow_status)) {
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
        const trackingOnly = readOnly || !canActOnLpoWorkflow(row);

        if (!instanceKey && !trackingOnly && canSubmit && EDITABLE_STATUSES.includes(row.workflow_status)) {
          const instance = await ensureLocalPurchaseOrderWorkflow(row.id);
          await crud.reload();
          instanceKey = instance?.uid || instance?.slug || publicKey(instance) || instance?.id;
        }

        if (!instanceKey) {
          showQuickError('Workflow unavailable', 'No workflow task is available for this local purchase order.');
          return;
        }

        setWorkflowModalReadOnly(trackingOnly);
        setWorkflowInstanceKey(instanceKey);
        setWorkflowModalOpen(true);
      } catch (error) {
        showQuickError('Workflow unavailable', error.message);
      }
    },
    [canActOnLpoWorkflow, canSubmit, crud, workflowInstanceKeyForRow]
  );

  const supplierOptions = useMemo(() => {
    const currentSupplierId = crud.formData?.supplier_id ? String(crud.formData.supplier_id) : '';

    return suppliers
      .filter((supplier) => hasAgreedPriceItems(supplier) || String(supplier.id) === currentSupplierId)
      .map((supplier) => ({
        value: String(supplier.id),
        label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`,
      }));
  }, [suppliers, crud.formData?.supplier_id]);

  const selectedSupplier = useMemo(
    () => suppliers.find((row) => String(row.id) === String(crud.formData?.supplier_id)),
    [suppliers, crud.formData?.supplier_id]
  );

  useEffect(() => {
    if (!crud.showModal) {
      setApprovedRequisitions([]);
      return;
    }
    const supplierId = crud.formData?.supplier_id ? String(crud.formData.supplier_id) : '';
    loadApprovedRequisitions({
      exceptLpoId: crud.isEditing ? crud.editingId : null,
      includeRequisitionId: crud.isEditing ? crud.formData?.purchase_requisition_id : null,
      // Without a supplier, still list all approved PRs so users can see what is ready.
      supplierId: supplierId || null,
    });
  }, [
    crud.showModal,
    crud.isEditing,
    crud.editingId,
    crud.formData?.purchase_requisition_id,
    crud.formData?.supplier_id,
    loadApprovedRequisitions,
  ]);

  const requisitionOptions = useMemo(
    () =>
      approvedRequisitions.map((row) => ({
        value: String(row.id),
        label: `${row.code} · ${formatDate(row.requisition_date)} · ${row.items_count ?? row.items?.length ?? 0} item(s)`,
      })),
    [approvedRequisitions]
  );

  const requisitionById = useMemo(
    () => Object.fromEntries(approvedRequisitions.map((row) => [String(row.id), row])),
    [approvedRequisitions]
  );

  const { itemOptions, priceByItemId, purchaseUnitByItemId } = useMemo(
    () => buildSupplierCatalog(selectedSupplier),
    [selectedSupplier]
  );

  useEffect(() => {
    if (!crud.showModal || !crud.formData?.purchase_requisition_id || !crud.formData?.supplier_id) {
      return;
    }

    const requisition = requisitionById[String(crud.formData.purchase_requisition_id)];
    const supplier = suppliers.find((row) => String(row.id) === String(crud.formData.supplier_id));
    if (!requisition || !supplier) return;

    const expectedLines = buildLinesFromRequisition(
      requisition,
      buildSupplierCatalog(supplier).priceByItemId
    );
    const currentLines = crud.formData.lpo_items || [];

    const linesMatch =
      currentLines.length === expectedLines.length &&
      expectedLines.every((line, index) => {
        const current = currentLines[index];
        return (
          String(current?.item_id) === String(line.item_id) &&
          String(current?.quantity ?? '') === String(line.quantity ?? '') &&
          Number(current?.unit_price ?? 0) === Number(line.unit_price ?? 0)
        );
      });

    if (!linesMatch) {
      crud.handleInputChange({ target: { name: 'lpo_items', value: expectedLines } });
    }
  }, [
    crud.showModal,
    crud.formData?.purchase_requisition_id,
    crud.formData?.supplier_id,
    crud.formData?.lpo_items,
    crud.handleInputChange,
    requisitionById,
    suppliers,
  ]);

  const handleSupplierChange = (supplierId, onInputChange, currentLines, requisitionId) => {
    const supplier = suppliers.find((row) => String(row.id) === String(supplierId));
    const catalog = buildSupplierCatalog(supplier);
    const requisition = requisitionId ? requisitionById[String(requisitionId)] : null;

    onInputChange({ target: { name: 'supplier_id', value: supplierId } });
    onInputChange({
      target: {
        name: 'lpo_items',
        value: requisition
          ? buildLinesFromRequisition(requisition, catalog.priceByItemId)
          : remapLinesForSupplier(currentLines, catalog.priceByItemId),
      },
    });
  };

  const handleRequisitionChange = (requisitionId, onInputChange, formData) => {
    const requisition = requisitionId ? requisitionById[String(requisitionId)] : null;
    const supplier = suppliers.find((row) => String(row.id) === String(formData.supplier_id));

    onInputChange({ target: { name: 'purchase_requisition_id', value: requisitionId || '' } });

    if (!requisition) return;

    if (supplier) {
      const catalog = buildSupplierCatalog(supplier);
      onInputChange({
        target: {
          name: 'lpo_items',
          value: buildLinesFromRequisition(requisition, catalog.priceByItemId),
        },
      });
    }

    if (requisition.remarks && !formData.remarks?.trim()) {
      onInputChange({ target: { name: 'remarks', value: requisition.remarks } });
    }
  };

  const pageConfig = {
    icon: FiFileText,
    title: 'Local Purchase Orders',
    subtitle: viewingOthers
      ? 'Track status of local purchase orders created by other users'
      : 'Draft LPOs, then process verification and approval through workflow',
    addButtonLabel: 'Create LPO',
    searchPlaceholder: 'Search LPOs...',
    hideAddButton: !canCreate || viewingOthers,
    hideActions: ['edit', 'delete'],
  };

  const ownershipTabs = useMemo(() => (
    canViewAll
      ? [
          { id: 'mine', label: 'My LPOs', icon: FiFileText },
          { id: 'others', label: 'Other LPOs', icon: FiUsers },
        ]
      : []
  ), [canViewAll]);

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'verified', label: 'Verified', icon: FiShield, iconColor: 'indigo-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'sent', label: 'Sent', icon: FiTruck, iconColor: 'violet-600' },
    ],
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Supplier',
      accessor: 'supplier.name',
      noWrap: true,
      render: (row) => row.supplier?.name || row.supplier_id || '—',
    },
    { header: 'Order Date', accessor: 'order_date', type: 'date', noWrap: true },
    ...(viewingOthers
      ? [{
          header: 'Created By',
          accessor: 'creator.full_name',
          noWrap: true,
          render: (row) => row.creator?.full_name || '—',
        }]
      : []),
    {
      header: 'Lines',
      accessor: 'items',
      noWrap: true,
      render: (row) => (Array.isArray(row.items) ? row.items.length : 0),
    },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true, render: (row) => <WorkflowStatusPill status={row.workflow_status} /> },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Order Details',
      icon: FiInfo,
      fields: [
        {
          name: 'supplier_id',
          type: 'custom',
          fullWidth: false,
          render: (formData, onInputChange, errors, darkMode) => (
            <div>
              <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Supplier *
              </label>
              <SearchableSelect
                options={supplierOptions}
                value={formData.supplier_id ? String(formData.supplier_id) : ''}
                onChange={(val) =>
                  handleSupplierChange(val, onInputChange, formData.lpo_items, formData.purchase_requisition_id)
                }
                placeholder={
                  supplierOptions.length
                    ? 'Select supplier…'
                    : 'No suppliers with agreed item prices'
                }
                darkMode={darkMode}
                disabled={!supplierOptions.length}
                invalid={Boolean(errors.supplier_id)}
              />
              {errors.supplier_id ? <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p> : null}
              {!supplierOptions.length ? (
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Add agreed item prices on a supplier record before creating an LPO.
                </p>
              ) : null}
            </div>
          ),
        },
        {
          name: 'purchase_requisition_id',
          type: 'custom',
          fullWidth: false,
          render: (formData, onInputChange, errors, darkMode) => (
            <div>
              <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Purchase requisition
              </label>
              <SearchableSelect
                options={requisitionOptions}
                value={formData.purchase_requisition_id ? String(formData.purchase_requisition_id) : ''}
                onChange={(val) => handleRequisitionChange(val, onInputChange, formData)}
                placeholder={
                  requisitionOptions.length
                    ? 'Select approved requisition…'
                    : formData.supplier_id
                      ? 'No approved requisitions match this supplier catalog'
                      : 'No approved requisitions available'
                }
                darkMode={darkMode}
                disabled={!requisitionOptions.length}
              />
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {formData.purchase_requisition_id
                  ? 'Line items are locked to the approved requisition quantities.'
                  : formData.supplier_id
                    ? 'Optional. Only approved requisitions with items on this supplier contract are listed.'
                    : 'Optional. Select a supplier that stocks the requisition items (e.g. Ocean Beverages for beer).'}
              </p>
            </div>
          ),
        },
        { name: 'order_date', label: 'Order Date', type: 'date', required: true },
        { name: 'expected_delivery_date', label: 'Expected Delivery Date', type: 'date', required: false },
        { name: 'tax_amount', label: 'Tax Amount', type: 'number', min: 0, step: '0.01', required: false },
        { name: 'discount_amount', label: 'Discount Amount', type: 'number', min: 0, step: '0.01', required: false },
        { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
      ],
    },
    {
      id: 'lines',
      label: 'Order Items',
      icon: FiPackage,
      fields: [
        {
          name: 'lpo_items',
          type: 'custom',
          fullWidth: true,
          render: (formData, onInputChange, errors, darkMode) => (
            <LpoItemsEditor
              value={formData.lpo_items}
              onChange={onInputChange}
              itemOptions={itemOptions}
              priceByItemId={priceByItemId}
              purchaseUnitByItemId={purchaseUnitByItemId}
              supplierSelected={Boolean(formData.supplier_id)}
              lockedFromRequisition={Boolean(formData.purchase_requisition_id)}
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
      label: 'Order Details',
      icon: FiInfo,
      fields: [
        { label: 'Code', accessor: 'code' },
        { label: 'Supplier', accessor: 'supplier.name', valueRender: (item) => item.supplier?.name || item.supplier_id || '—' },
        {
          label: 'Purchase requisition',
          accessor: 'purchase_requisition.code',
          valueRender: (item) =>
            item.purchase_requisition?.code ||
            item.purchase_requisition_id ||
            '—',
        },
        { label: 'Order Date', accessor: 'order_date', type: 'date' },
        { label: 'Expected Delivery', accessor: 'expected_delivery_date', type: 'date' },
        { label: 'Workflow', accessor: 'workflow_status', valueRender: (item) => <WorkflowStatusPill status={item.workflow_status} /> },
        { label: 'Created By', accessor: 'creator.full_name', valueRender: (item) => item.creator?.full_name || '—' },
        { label: 'Submitted', accessor: 'submitted_at', valueRender: (item) => formatDateTime(item.submitted_at) },
        { label: 'Verified By', accessor: 'verifier.full_name', valueRender: (item) => item.verifier?.full_name || '—' },
        { label: 'Verified At', accessor: 'verified_at', valueRender: (item) => formatDateTime(item.verified_at) },
        { label: 'Approved By', accessor: 'approver.full_name', valueRender: (item) => item.approver?.full_name || '—' },
        { label: 'Approved At', accessor: 'approved_at', valueRender: (item) => formatDateTime(item.approved_at) },
        { label: 'Rejected At', accessor: 'rejected_at', valueRender: (item) => formatDateTime(item.rejected_at) },
        { label: 'Sent At', accessor: 'sent_at', valueRender: (item) => formatDateTime(item.sent_at) },
        { label: 'Tax Amount', accessor: 'tax_amount', valueRender: (item) => formatMoney(item.tax_amount || 0) },
        { label: 'Discount', accessor: 'discount_amount', valueRender: (item) => formatMoney(item.discount_amount || 0) },
        { label: 'Remarks', accessor: 'remarks', type: 'textarea' },
      ],
    },
    {
      id: 'lines',
      label: 'Order Items',
      icon: FiPackage,
      fields: [
        {
          label: 'Order items',
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
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Purchasing unit</th>
                      <th className="px-3 py-2">Unit price</th>
                      <th className="px-3 py-2">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.quantity}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2">{line.item?.code || '—'}</td>
                        <td className="px-3 py-2">{line.quantity}</td>
                        <td className="px-3 py-2">
                          {purchaseUnitLabel(line.item, line.item_unit_id)
                            || unitOptionLabel(line.item_unit?.unit || line.itemUnit?.unit)
                            || '—'}
                        </td>
                        <td className="px-3 py-2">{formatMoney(line.unit_price || 0)}</td>
                        <td className="px-3 py-2 font-medium">
                          {formatMoney(Number(line.quantity || 0) * Number(line.unit_price || 0))}
                        </td>
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
    {
      id: 'history',
      label: 'History',
      icon: FiClock,
      fields: [
        {
          label: 'Status history',
          accessor: 'history',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.history || [];
            if (!rows.length) return '—';

            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">From</th>
                      <th className="px-3 py-2">To</th>
                      <th className="px-3 py-2">By</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry) => (
                      <tr key={entry.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{formatDateTime(entry.created_at)}</td>
                        <td className="px-3 py-2">
                          {entry.from_status ? <WorkflowStatusPill status={entry.from_status} /> : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <WorkflowStatusPill status={entry.to_status} />
                        </td>
                        <td className="px-3 py-2">{entry.changed_by_user?.full_name || '—'}</td>
                        <td className="px-3 py-2">{entry.remarks || '—'}</td>
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
      visible: (row) => !viewingOthers && canActOnLpoWorkflow(row),
      onClick: (row) => openWorkflowModal(row, { readOnly: false }),
    },
    {
      type: 'workflow-progress',
      label: 'Progress',
      icon: FiEye,
      visible: (row) => Boolean(workflowInstanceKeyForRow(row)) && (viewingOthers || !canActOnLpoWorkflow(row)),
      onClick: (row) => openWorkflowModal(row, { readOnly: true }),
    },
    {
      type: 'send',
      label: 'Send to Supplier',
      icon: FiTruck,
      visible: (row) => !viewingOthers && canEdit && row.workflow_status === 'APPROVED',
      onClick: (row) =>
        runWorkflowAction(row, {
          label: 'Send',
          fn: sendLocalPurchaseOrder,
          confirmText: 'Mark this LPO as sent to the supplier?',
          inputLabel: 'Send remarks',
        }),
    },
    {
      type: 'print',
      label: printingId ? 'Printing…' : 'Print',
      icon: FiPrinter,
      visible: (row) => canPrint && canPrintLocalPurchaseOrder(row),
      onClick: (row) => handlePrint(row),
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
        <p className="text-sm text-stone-500">You do not have permission to view local purchase orders.</p>
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
        modalTitle="Local Purchase Order"
        modalMaxWidth="max-w-4xl"
        crud={crud}
        submitLabel={crud.isEditing ? 'Save Changes' : 'Save as Draft'}
        extraActions={extraActions}
        belowStats={ownershipTabs.length ? (
          <PageTabs
            tabs={ownershipTabs}
            activeTab={ownershipTab}
            onChange={handleOwnershipTabChange}
            ariaLabel="Local purchase order ownership"
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
          { label: 'Workflow: Sent', value: 'workflow:SENT' },
          { label: 'Workflow: Partially Delivered', value: 'workflow:PARTIALLY_DELIVERED' },
          { label: 'Workflow: Fully Delivered', value: 'workflow:FULLY_DELIVERED' },
          { label: 'Workflow: Closed', value: 'workflow:CLOSED' },
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

export default LocalPurchaseOrder;

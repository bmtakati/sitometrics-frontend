import React, { useCallback, useEffect, useState } from 'react';
import {
  FiCheckCircle, FiEdit2, FiGitBranch, FiLayers, FiLoader, FiPlay, FiPlus, FiToggleLeft, FiToggleRight, FiTrash2,
} from 'react-icons/fi';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import DataTable from '../../components/DataTable';
import FormModal from '../../components/FormModal/FormModal';
import useApiCrud from '../../hooks/useApiCrud';
import useDarkMode from '../../hooks/useDarkMode';
import apiFetch from '../../utils/apiFetch';
import { publicKey } from '../../utils/publicKey';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { showConfirmDialog, showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';
import { suggestWorkflowStepButtonLabel } from '../../utils/workflowActions';

const emptyWorkflowForm = {
  code: '',
  name: '',
  description: '',
  version: 1,
  is_active: true,
  allow_applicant_progress_view: false,
};

const emptyStepForm = {
  code: '',
  name: '',
  description: '',
  step_order: 1,
  assignee_type: 'role',
  assignee_id: '',
  approval_mode: 'any',
  minimum_approvals: '',
  is_required: true,
  can_reject: true,
  can_return: true,
  can_skip: false,
  timeout_minutes: '',
  is_start_step: false,
  is_final_step: false,
  button_label: '',
};

const assigneeTypeOptions = [
  { value: 'role', label: 'Role' },
  { value: 'user', label: 'User' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'unit_head', label: 'Unit Head' },
  { value: 'application_owner', label: 'Application Owner' },
  { value: 'application_owner_manager', label: 'Application Owner Manager' },
  { value: 'dynamic', label: 'Dynamic' },
];

const approvalModeOptions = [
  { value: 'single', label: 'Single' },
  { value: 'any', label: 'Any' },
  { value: 'all', label: 'All' },
  { value: 'minimum', label: 'Minimum' },
];

const isDemoWorkflow = (workflow) => {
  const type = workflow?.workflowable_type;
  if (!type) return true;
  return type === 'WorkflowRequest'
    || type === 'workflow_request'
    || type.endsWith('\\WorkflowRequest')
    || type.endsWith('/WorkflowRequest');
};

const firstValidationError = (errors = {}) => {
  const first = Object.values(errors || {})[0];
  return Array.isArray(first) ? first[0] : first;
};

const normalizeWorkflow = (row = {}) => ({
  ...row,
  uid: row.uid || row.slug,
  code: row.code || '',
  name: row.name || '',
  description: row.description || '',
  version: row.version ?? 1,
  is_active: Boolean(row.is_active),
  allow_applicant_progress_view: Boolean(row.allow_applicant_progress_view),
});

const normalizeStep = (step = {}) => ({
  ...emptyStepForm,
  ...step,
  uid: step.uid || step.slug,
  code: step.code || '',
  name: step.name || '',
  description: step.description || '',
  step_order: step.step_order ?? step.order ?? 1,
  assignee_type: step.assignee_type || 'role',
  assignee_id: step.assignee_id != null ? String(step.assignee_id) : '',
  approval_mode: step.approval_mode || 'any',
  minimum_approvals: step.minimum_approvals ?? '',
  timeout_minutes: step.timeout_minutes ?? '',
  is_required: step.is_required !== false,
  can_reject: step.can_reject !== false,
  can_return: step.can_return !== false,
  can_skip: Boolean(step.can_skip),
  is_start_step: Boolean(step.is_start_step),
  is_final_step: Boolean(step.is_final_step || step.is_terminal),
  button_label: step.button_label ?? step.resolved_button_label ?? step.suggested_button_label ?? '',
});

const WorkflowDefinitions = () => {
  const darkMode = useDarkMode();
  const { user } = useAuth();
  const canAdd = hasPermission(user, 'add-workflows');
  const canEdit = hasPermission(user, 'edit-workflows');
  const canDelete = hasPermission(user, 'delete-workflows');
  const canRestore = hasPermission(user, 'restore-workflows');
  const canManage = canAdd || canEdit || canDelete || canRestore;
  const canViewSteps = canManage || hasPermission(user, 'view-workflow-steps');
  const canSubmit = hasPermission(user, 'submit-workflows') || canAdd || canEdit;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState(emptyStepForm);
  const [stepErrors, setStepErrors] = useState({});
  const [buttonLabelTouched, setButtonLabelTouched] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const buildEmptyStepForm = useCallback((stepOrder = 1, steps = []) => ({
    ...emptyStepForm,
    step_order: stepOrder,
    assignee_type: roleOptions.length ? 'role' : 'application_owner',
    assignee_id: '',
    button_label: suggestWorkflowStepButtonLabel({
      stepOrder,
      totalSteps: steps.length + 1,
      isStartStep: false,
    }),
  }), [roleOptions.length]);

  const suggestLabelForForm = useCallback((form, steps = [], editingKey = null) => {
    const otherSteps = (steps || []).filter((step) => {
      const stepKey = publicKey(step) || step.uid || step.id;
      return stepKey !== editingKey;
    });
    const totalSteps = otherSteps.length + 1;
    const isStartStep = form.is_start_step === true || form.is_start_step === 'true';
    let stepOrder = Number(form.step_order || 1);
    if (isStartStep) {
      stepOrder = 1;
    }

    return suggestWorkflowStepButtonLabel({
      stepOrder,
      totalSteps,
      isStartStep,
    });
  }, []);

  const crud = useApiCrud('workflows', {
    initialFormData: emptyWorkflowForm,
    fixedQueryParams: { active_only: 'false' },
    validateForm: (data, { isEditing }) => {
      const errors = {};
      if (!isEditing && !data.code?.trim()) errors.code = 'Code is required';
      if (!data.name?.trim()) errors.name = 'Name is required';
      return errors;
    },
    transformResponse: (payload) => {
      if (Array.isArray(payload)) return payload.map(normalizeWorkflow);
      return normalizeWorkflow(payload);
    },
    transformFormData: (data) => {
      const payload = {
        name: String(data.name || '').trim(),
        description: String(data.description || '').trim() || null,
        is_active: Boolean(data.is_active),
        allow_applicant_progress_view: Boolean(data.allow_applicant_progress_view),
      };

      if (!crud?.isEditing) {
        payload.code = String(data.code || '').trim().toLowerCase();
        payload.version = Number(data.version || 1);
      }

      return payload;
    },
    resourceName: 'Workflow',
    itemsPerPage: 15,
    deleteLabelKey: 'name',
  });

  const loadWorkflowDetail = useCallback(async (row) => {
    const key = publicKey(row) || row.uid || row.id;
    if (!key) throw new Error('Workflow identifier is missing.');

    const response = await apiFetch(`${API_BASE_URL}/api/workflows/${encodeURIComponent(key)}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
      throw new Error(json.message || 'Failed to load workflow definition.');
    }
    return normalizeWorkflow(json.data || {});
  }, []);

  const refreshSelectedWorkflow = useCallback(async () => {
    if (!selectedWorkflow) return null;
    const detail = await loadWorkflowDetail(selectedWorkflow);
    setSelectedWorkflow(detail);
    return detail;
  }, [loadWorkflowDetail, selectedWorkflow]);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/roles/all`)
      .then((response) => response.json().catch(() => ({})))
      .then((json) => {
        const rows = Array.isArray(json?.data) ? json.data : [];
        setRoleOptions(rows.map((role) => ({
          value: String(role.id),
          label: role.name,
          searchLabel: `${role.name || ''} ${role.description || ''}`,
        })));
      })
      .catch(() => setRoleOptions([]));
  }, []);

  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedWorkflow(null);
    try {
      setSelectedWorkflow(await loadWorkflowDetail(row));
    } catch (err) {
      setDetailOpen(false);
      showErrorDialog(err.message || 'Failed to load workflow definition.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openSteps = async (row) => {
    setStepsOpen(true);
    setStepsLoading(true);
    setEditingStep(null);
    setStepErrors({});
    try {
      const detail = await loadWorkflowDetail(row);
      setSelectedWorkflow(detail);
      const nextOrder = Math.max(0, ...(detail.steps || []).map((step) => Number(step.step_order || step.order || 0))) + 1;
      setStepForm(buildEmptyStepForm(nextOrder, detail.steps || []));
      setButtonLabelTouched(false);
    } catch (err) {
      setStepsOpen(false);
      showErrorDialog(err.message || 'Failed to load workflow steps.');
    } finally {
      setStepsLoading(false);
    }
  };

  const startDemo = async (row) => {
    const key = publicKey(row) || row.uid || row.id;
    if (!key) return;
    if (!isDemoWorkflow(row)) {
      showErrorDialog('Start this workflow from its module page.');
      return;
    }
    if (!row.is_active) {
      showErrorDialog('Activate the workflow before starting a demo instance.');
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Start demo workflow?',
      message: `Create a demo request and submit "${row.name}" for approval.`,
      confirmText: 'Start demo',
      confirmColor: '#4f46e5',
      iconBg: 'bg-indigo-100',
    });
    if (!confirmed?.isConfirmed) return;

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/workflows/${encodeURIComponent(key)}/start-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submit: true }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) throw new Error(json.message || 'Failed to start demo workflow.');
      showSuccessToast(json.message || 'Demo workflow started. Check Pending Tasks.');
    } catch (err) {
      showErrorDialog(err.message || 'Failed to start demo workflow.');
    }
  };

  const toggleActive = async (row) => {
    const key = publicKey(row) || row.uid || row.id;
    if (!key) return;
    const next = !row.is_active;
    const confirmed = await showConfirmDialog({
      title: next ? 'Activate workflow?' : 'Deactivate workflow?',
      message: next ? `Activate "${row.name}" so new instances can be started.` : `Deactivate "${row.name}"? Open instances are not cancelled.`,
      confirmText: next ? 'Activate' : 'Deactivate',
      confirmColor: next ? '#10b981' : '#f97316',
      iconBg: next ? 'bg-green-100' : 'bg-orange-100',
    });
    if (!confirmed?.isConfirmed) return;

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/workflows/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) throw new Error(json.message || 'Failed to update workflow status.');
      showSuccessToast(json.message || (next ? 'Workflow activated.' : 'Workflow deactivated.'));
      await crud.reload();
    } catch (err) {
      showErrorDialog(err.message || 'Failed to update workflow status.');
    }
  };

  const resetStepForm = () => {
    const steps = selectedWorkflow?.steps || [];
    const nextOrder = Math.max(0, ...steps.map((step) => Number(step.step_order || step.order || 0))) + 1;
    setEditingStep(null);
    setStepForm(buildEmptyStepForm(nextOrder, steps));
    setButtonLabelTouched(false);
    setStepErrors({});
    setStepFormOpen(true);
  };

  const editStep = (step) => {
    setEditingStep(step);
    setStepForm(normalizeStep(step));
    setButtonLabelTouched(Boolean(step.button_label));
    setStepErrors({});
    setStepFormOpen(true);
  };

  const handleStepInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'button_label') {
      setButtonLabelTouched(true);
    }
    setStepForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'assignee_type' && value !== 'role') {
        next.assignee_id = '';
      }
      if (name === 'approval_mode' && value !== 'minimum') {
        next.minimum_approvals = '';
      }
      if (name === 'is_final_step' && (value === true || value === 'true')) {
        const editingKey = editingStep ? (publicKey(editingStep) || editingStep.uid || editingStep.id) : null;
        const orders = (selectedWorkflow?.steps || [])
          .filter((step) => {
            const stepKey = publicKey(step) || step.uid || step.id;
            return stepKey !== editingKey;
          })
          .map((step) => Number(step.step_order || step.order || 0));
        const maxOrder = orders.length ? Math.max(...orders) : 0;
        next.step_order = editingStep ? Math.max(Number(next.step_order || 1), maxOrder) : maxOrder + 1;
      }
      if (!buttonLabelTouched && name !== 'button_label' && ['step_order', 'is_start_step', 'is_final_step'].includes(name)) {
        const editingKey = editingStep ? (publicKey(editingStep) || editingStep.uid || editingStep.id) : null;
        next.button_label = suggestLabelForForm(next, selectedWorkflow?.steps || [], editingKey);
      }
      return next;
    });
    if (stepErrors[name]) setStepErrors((current) => ({ ...current, [name]: '' }));
  };

  const saveStep = async () => {
    const errors = {};
    if (!stepForm.name?.trim()) errors.name = 'Name is required.';
    if (!Number(stepForm.step_order)) errors.step_order = 'Step order is required.';
    if (!stepForm.assignee_type) errors.assignee_type = 'Assignee type is required.';
    if (stepForm.assignee_type === 'role' && !stepForm.assignee_id) errors.assignee_id = 'Role is required.';
    if (!stepForm.approval_mode) errors.approval_mode = 'Approval mode is required.';
    if (stepForm.is_final_step === true || stepForm.is_final_step === 'true') {
      const currentStepKey = editingStep ? (publicKey(editingStep) || editingStep.uid || editingStep.id) : null;
      const hasNextStep = (selectedWorkflow?.steps || []).some((step) => {
        const stepKey = publicKey(step) || step.uid || step.id;
        if (stepKey === currentStepKey) return false;
        const existingOrder = Number(step.step_order || step.order || 0);
        const selectedOrder = Number(stepForm.step_order || 0);
        if (existingOrder > selectedOrder) return true;
        return !editingStep && existingOrder === selectedOrder;
      });
      if (hasNextStep) {
        errors.is_final_step = 'Final step must be the last step.';
      }
    }
    if (stepForm.approval_mode === 'minimum' && !Number(stepForm.minimum_approvals)) {
      errors.minimum_approvals = 'Minimum approvals is required.';
    }
    if (Object.keys(errors).length) {
      setStepErrors(errors);
      return;
    }

    const workflowKey = publicKey(selectedWorkflow) || selectedWorkflow?.uid || selectedWorkflow?.id;
    const stepKey = editingStep ? (publicKey(editingStep) || editingStep.uid || editingStep.id) : null;
    const payload = {
      name: String(stepForm.name || '').trim(),
      description: String(stepForm.description || '').trim() || null,
      step_order: Number(stepForm.step_order || 1),
      assignee_type: stepForm.assignee_type,
      assignee_id: stepForm.assignee_id ? Number(stepForm.assignee_id) : null,
      approval_mode: stepForm.approval_mode,
      minimum_approvals: stepForm.approval_mode === 'minimum' ? Number(stepForm.minimum_approvals || 1) : null,
      timeout_minutes: stepForm.timeout_minutes ? Number(stepForm.timeout_minutes) : null,
      is_required: stepForm.is_required === true || stepForm.is_required === 'true',
      can_reject: stepForm.can_reject === true || stepForm.can_reject === 'true',
      can_return: stepForm.can_return === true || stepForm.can_return === 'true',
      can_skip: stepForm.can_skip === true || stepForm.can_skip === 'true',
      is_start_step: stepForm.is_start_step === true || stepForm.is_start_step === 'true',
      is_final_step: stepForm.is_final_step === true || stepForm.is_final_step === 'true',
      button_label: String(stepForm.button_label || '').trim() || null,
    };

    // Only send code when the user explicitly set one; blank values fail backend format checks.
    const code = String(stepForm.code || '').trim();
    if (code) {
      payload.code = code;
    }

    setStepSaving(true);
    setStepErrors({});
    try {
      const response = await apiFetch(
        editingStep
          ? `${API_BASE_URL}/api/workflows/${encodeURIComponent(workflowKey)}/steps/${encodeURIComponent(stepKey)}`
          : `${API_BASE_URL}/api/workflows/${encodeURIComponent(workflowKey)}/steps`,
        {
          method: editingStep ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) {
        if (json.errors) {
          setStepErrors(Object.fromEntries(Object.entries(json.errors).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : String(value),
          ])));
        }
        throw new Error(firstValidationError(json.errors) || json.message || 'Failed to save workflow step.');
      }
      showSuccessToast(json.message || 'Workflow step saved successfully.');
      const detail = await refreshSelectedWorkflow();
      setEditingStep(null);
      const nextOrder = Math.max(0, ...(detail?.steps || []).map((step) => Number(step.step_order || step.order || 0))) + 1;
      setStepForm(buildEmptyStepForm(nextOrder, detail?.steps || []));
      setButtonLabelTouched(false);
      setStepFormOpen(false);
      await crud.reload();
    } catch (err) {
      showErrorDialog(err.message || 'Failed to save workflow step.');
    } finally {
      setStepSaving(false);
    }
  };

  const handleStepSubmit = async (event) => {
    event.preventDefault();
    await saveStep();
  };

  const deleteStep = async (step) => {
    const workflowKey = publicKey(selectedWorkflow) || selectedWorkflow?.uid || selectedWorkflow?.id;
    const stepKey = publicKey(step) || step.uid || step.id;
    const confirmed = await showConfirmDialog({
      title: 'Delete workflow step?',
      message: `Delete "${step.name}" from this workflow.`,
      confirmText: 'Delete',
      confirmColor: '#ef4444',
      iconBg: 'bg-red-100',
    });
    if (!confirmed?.isConfirmed) return;

    setStepSaving(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/workflows/${encodeURIComponent(workflowKey)}/steps/${encodeURIComponent(stepKey)}`, {
        method: 'DELETE',
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) throw new Error(json.message || 'Failed to delete workflow step.');
      showSuccessToast(json.message || 'Workflow step deleted successfully.');
      await refreshSelectedWorkflow();
      await crud.reload();
    } catch (err) {
      showErrorDialog(err.message || 'Failed to delete workflow step.');
    } finally {
      setStepSaving(false);
    }
  };

  const tableColumns = [
    {
      header: 'Workflow',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.code}</div>
        </div>
      ),
    },
    { header: 'Version', accessor: 'version', noWrap: true, render: (row) => <span className="text-sm">v{row.version}</span> },
    { header: 'Steps', accessor: 'steps_count', noWrap: true, render: (row) => <span className="text-sm">{row.steps_count ?? row.steps?.length ?? 0}</span> },
    {
      header: 'Status',
      accessor: 'is_active',
      noWrap: true,
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          row.is_active
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const formFields = [
    ...(!crud.isEditing ? [
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. leave-approval' },
      { name: 'version', label: 'Version', type: 'number', required: true },
    ] : []),
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, fullWidth: true },
    { name: 'is_active', label: 'Active', type: 'checkbox', fullWidth: true },
    {
      name: 'allow_applicant_progress_view',
      label: 'Applicants can track application?',
      type: 'checkbox',
      fullWidth: true,
    },
  ];

  const extraActions = [
    { type: 'steps', label: 'Steps', icon: FiLayers, onClick: openSteps, visible: () => canViewSteps },
    { type: 'start-demo', label: 'Start demo', icon: FiPlay, onClick: startDemo, visible: (row) => canSubmit && row.is_active && isDemoWorkflow(row) },
    { type: 'toggle-active', label: 'Toggle Active', icon: FiToggleRight, onClick: toggleActive, visible: () => canEdit },
  ];

  const renderDetail = () => (
    detailLoading ? (
      <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <FiLoader className="h-4 w-4 animate-spin" />
        Loading workflow definition...
      </div>
    ) : (
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Code</p>
            <p className="text-gray-900 dark:text-gray-100">{selectedWorkflow?.code || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Version</p>
            <p className="text-gray-900 dark:text-gray-100">v{selectedWorkflow?.version ?? '—'}</p>
          </div>
        </div>
        {selectedWorkflow?.description ? <p className="text-gray-700 dark:text-gray-300">{selectedWorkflow.description}</p> : null}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Steps</p>
          <ol className="space-y-2">
            {(selectedWorkflow?.steps || []).map((step) => (
              <li key={step.uid || step.slug || step.code} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <span className="font-medium text-gray-900 dark:text-gray-100">{step.step_order ?? step.order}. {step.name}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({step.code})</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  );

  const renderStepManager = (_formData, _onInputChange, _errors, dm) => {
    const steps = [...(selectedWorkflow?.steps || [])].sort((a, b) => Number(a.step_order || a.order || 0) - Number(b.step_order || b.order || 0));
    const stepColumns = [
      {
        header: 'Order',
        accessor: 'step_order',
        noWrap: true,
        render: (step) => <span className="text-sm">{step.step_order ?? step.order}</span>,
      },
      {
        header: 'Step',
        accessor: 'name',
        render: (step) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{step.name}</span>
              {step.is_start_step ? (
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Start
                </span>
              ) : null}
              {step.is_final_step ? (
                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Final
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{step.code}</div>
          </div>
        ),
      },
      {
        header: 'Assignee',
        accessor: 'assignee_type',
        render: (step) => <span className="text-sm">{step.assignee_type || '—'}</span>,
      },
      {
        header: 'Button',
        accessor: 'button_label',
        render: (step) => (
          <span className="text-sm">
            {step.resolved_button_label || step.button_label || step.suggested_button_label || '—'}
          </span>
        ),
      },
      {
        header: 'Mode',
        accessor: 'approval_mode',
        render: (step) => <span className="text-sm">{step.approval_mode || '—'}</span>,
      },
    ];

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{selectedWorkflow?.name || 'Workflow'}</p>
            <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{steps.length} step{steps.length === 1 ? '' : 's'} configured</p>
          </div>
          {canAdd ? (
            <button type="button" onClick={resetStepForm} className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-green-600 px-3 text-sm font-medium text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-gray-600 dark:text-gray-300 dark:hover:border-green-500 dark:hover:bg-green-500 dark:hover:text-white">
              <FiPlus className="h-4 w-4" />
              Add Step
            </button>
          ) : null}
        </div>

        <DataTable
          columns={stepColumns}
          data={steps}
          loading={stepsLoading}
          emptyState={{
            icon: FiLayers,
            title: 'No workflow steps',
            description: canAdd ? 'Add the first approval step for this workflow.' : 'No approval steps are configured for this workflow.',
          }}
          actions={[
            ...(canEdit ? [{ type: 'edit', label: 'Edit', icon: FiEdit2, onClick: editStep }] : []),
            ...(canDelete ? [{ type: 'delete', label: 'Delete', icon: FiTrash2, onClick: deleteStep }] : []),
          ]}
          actionLoading={stepSaving}
        />
      </div>
    );
  };

  const editingStepKey = editingStep ? (publicKey(editingStep) || editingStep.uid || editingStep.id) : null;
  const suggestedButtonLabel = suggestLabelForForm(stepForm, selectedWorkflow?.steps || [], editingStepKey);

  const stepFormFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'step_order', label: 'Step Order', type: 'number', required: true },
    {
      name: 'button_label',
      label: 'Action Button Label',
      type: 'text',
      placeholder: suggestedButtonLabel,
      helpTooltip: 'Label for the forward/approve action on this step. Suggested: first step Submit, middle Forward, final Endorse.',
    },
    {
      name: 'assignee_type',
      label: 'Assignee Type',
      type: 'select',
      required: true,
      options: assigneeTypeOptions,
      searchInDropdown: true,
      searchPlaceholder: 'Search assignee types...',
      dropdownZIndexClass: 'z-[12000]',
    },
    ...(stepForm.assignee_type === 'role' ? [{
      name: 'assignee_id',
      label: 'Role',
      type: 'select',
      required: true,
      placeholder: 'Select role',
      options: roleOptions,
      searchInDropdown: true,
      searchPlaceholder: 'Search roles...',
      dropdownZIndexClass: 'z-[12000]',
    }] : []),
    {
      name: 'approval_mode',
      label: 'Approval Mode',
      type: 'select',
      required: true,
      options: approvalModeOptions,
      searchInDropdown: true,
      searchPlaceholder: 'Search approval modes...',
      dropdownZIndexClass: 'z-[12000]',
    },
    ...(stepForm.approval_mode === 'minimum' ? [{
      name: 'minimum_approvals',
      label: 'Minimum Approvals',
      type: 'number',
      required: true,
    }] : []),
    { name: 'timeout_minutes', label: 'Timeout Minutes', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3, fullWidth: true },
    { name: 'is_required', label: 'Required', type: 'checkbox' },
    { name: 'can_reject', label: 'Can Reject', type: 'checkbox' },
    { name: 'can_return', label: 'Can Return', type: 'checkbox' },
    { name: 'can_skip', label: 'Can Skip', type: 'checkbox' },
    {
      name: 'is_start_step',
      label: 'Start Step',
      type: 'checkbox',
      helpTooltip: 'Workflow instances begin from this step. Selecting it moves the step to order 1.',
    },
    {
      name: 'is_final_step',
      label: 'Final Step',
      type: 'checkbox',
      helpTooltip: 'Endorse on this step will complete the workflow. If none is selected, the last step is treated as final.',
      fullWidth: true,
    },
  ];

  return (
    <>
      <CRUDPage
        pageConfig={{
          icon: FiGitBranch,
          title: 'Workflow Definitions',
          subtitle: 'Configure approval workflows, activation, and workflow steps',
          addButtonLabel: 'Add Workflow',
          searchPlaceholder: 'Search workflows...',
          hideAddButton: !canAdd,
          hideActions: [
            !canEdit ? 'edit' : null,
            !canDelete ? 'delete' : null,
            !canRestore ? 'restore' : null,
          ].filter(Boolean),
        }}
        statsConfig={{ cards: [
          { key: 'total', label: 'Workflows', icon: FiGitBranch, iconColor: 'indigo-600' },
          { key: 'active', label: 'Active', icon: FiCheckCircle, iconColor: 'green-600' },
          { key: 'inactive', label: 'Inactive', icon: FiToggleLeft, iconColor: 'gray-600' },
          { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
        ] }}
        tableColumns={tableColumns}
        tableConfig={{ emptyState: { title: 'No workflow definitions found', description: 'Create a workflow definition and add its approval steps.' } }}
        formFields={formFields}
        viewFields={[]}
        modalTitle="Workflow"
        modalMaxWidth="max-w-2xl"
        formFieldsLayout="two-col"
        filterOptions={[
          { label: 'All Workflows', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        extraActions={extraActions}
        onView={openDetail}
        crud={crud}
      />

      <FormModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={selectedWorkflow?.name || 'Workflow Definition'} fields={[{ name: 'definition', type: 'custom', fullWidth: true, render: renderDetail }]} formData={{}} onInputChange={() => {}} onSubmit={(event) => event.preventDefault()} errors={{}} isLoading={detailLoading} hideFooter maxWidth="max-w-2xl" fieldsLayout="stack" zIndexClass="z-[9999]" />

      <FormModal
        isOpen={stepsOpen}
        onClose={() => {
          if (stepSaving) return;
          setStepsOpen(false);
          setStepFormOpen(false);
          setSelectedWorkflow(null);
          setEditingStep(null);
          setStepForm(emptyStepForm);
          setButtonLabelTouched(false);
          setStepErrors({});
        }}
        title={canManage ? 'Manage Workflow Steps' : 'Workflow Steps'}
        helpTooltip={canManage ? 'Add the approval steps for this workflow. Steps are ordered by Step Order.' : 'View the approval steps configured for this workflow.'}
        fields={[{ name: 'steps', type: 'custom', fullWidth: true, render: renderStepManager }]}
        formData={{}}
        onInputChange={() => {}}
        onSubmit={(event) => event.preventDefault()}
        errors={{}}
        isLoading={stepsLoading}
        hideFooter
        maxWidth="max-w-6xl"
        fieldsLayout="stack"
        zIndexClass="z-[9999]"
      />

      <FormModal
        isOpen={stepFormOpen}
        onClose={() => {
          if (stepSaving) return;
          setStepFormOpen(false);
          setEditingStep(null);
          setStepErrors({});
        }}
        title={editingStep ? 'Workflow Step' : 'Workflow Step'}
        fields={stepFormFields}
        formData={stepForm}
        onInputChange={handleStepInputChange}
        onSubmit={handleStepSubmit}
        errors={stepErrors}
        isLoading={stepSaving}
        isEditing={Boolean(editingStep)}
        submitLabel={editingStep ? 'Update Step' : 'Add Step'}
        maxWidth="max-w-3xl"
        fieldsLayout="two-col"
        zIndexClass="z-[11000]"
      />
    </>
  );
};

export default WorkflowDefinitions;

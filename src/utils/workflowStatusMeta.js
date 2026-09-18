const WORKFLOW_STATUS_CODES = {
  draft: 'WORKFLOW_DRAFT',
  submitted: 'WORKFLOW_PENDING',
  pending: 'WORKFLOW_PENDING',
  verified: 'WORKFLOW_IN_PROGRESS',
  in_progress: 'WORKFLOW_IN_PROGRESS',
  approved: 'WORKFLOW_APPROVED',
  completed: 'WORKFLOW_COMPLETED',
  rejected: 'WORKFLOW_REJECTED',
  returned: 'WORKFLOW_RETURNED',
  cancelled: 'WORKFLOW_CANCELLED',
};

const FALLBACK_COLORS = {
  draft: '#9CA3AF',
  submitted: '#F59E0B',
  pending: '#F59E0B',
  verified: '#15803D',
  in_progress: '#15803D',
  approved: '#10B981',
  completed: '#16A34A',
  rejected: '#EF4444',
  returned: '#F97316',
  cancelled: '#6B7280',
};

const fallbackLabel = (status) => String(status || '-')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

export const normalizeWorkflowStatus = (status) => String(status || '').toLowerCase();

export const buildWorkflowStatusMap = (groups = []) => {
  const workflowGroup = groups.find((group) => String(group.name || '').toLowerCase() === 'workflow statuses');
  const statuses = Array.isArray(workflowGroup?.statuses) ? workflowGroup.statuses : [];

  return statuses.reduce((acc, status) => {
    const values = Object.entries(WORKFLOW_STATUS_CODES)
      .filter(([, code]) => code === status.code)
      .map(([value]) => value);
    if (values.length === 0) return acc;

    values.forEach((value) => {
      acc[value] = {
        value,
        code: status.code,
        label: status.name || fallbackLabel(value),
        color: status.color || FALLBACK_COLORS[value],
      };
    });
    return acc;
  }, {});
};

export const workflowStatusMeta = (status, map = {}, explicitMeta = null) => {
  const normalizedStatus = normalizeWorkflowStatus(status);

  if (explicitMeta?.label || explicitMeta?.color) {
    return {
      value: normalizedStatus,
      code: explicitMeta.code || WORKFLOW_STATUS_CODES[normalizedStatus],
      label: explicitMeta.label || fallbackLabel(normalizedStatus),
      color: explicitMeta.color || FALLBACK_COLORS[normalizedStatus] || '#6B7280',
    };
  }

  return map[normalizedStatus] || {
    value: normalizedStatus,
    code: WORKFLOW_STATUS_CODES[normalizedStatus],
    label: fallbackLabel(normalizedStatus),
    color: FALLBACK_COLORS[normalizedStatus] || '#6B7280',
  };
};

export const workflowStatusBadgeStyle = (status, map = {}, explicitMeta = null) => {
  const meta = workflowStatusMeta(status, map, explicitMeta);
  return {
    color: meta.color,
    borderColor: `${meta.color}66`,
    backgroundColor: `${meta.color}1A`,
  };
};

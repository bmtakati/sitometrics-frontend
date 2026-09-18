import React from 'react';
import { API_BASE_URL } from '../context/AuthContext';
import apiFetch from '../utils/apiFetch';
import { buildWorkflowStatusMap, workflowStatusBadgeStyle, workflowStatusMeta } from '../utils/workflowStatusMeta';

const MODULE_STATUS_META = {
  converted_to_lpo: { label: 'Converted To LPO', color: '#0D9488' },
  sent: { label: 'Sent', color: '#7C3AED' },
  partially_delivered: { label: 'Partially Delivered', color: '#F59E0B' },
  fully_delivered: { label: 'Fully Delivered', color: '#65A30D' },
  closed: { label: 'Closed', color: '#6B7280' },
};

let workflowStatusMapCache = {};
let workflowStatusMapPromise = null;

const loadWorkflowStatusMap = async () => {
  if (workflowStatusMapPromise) return workflowStatusMapPromise;

  workflowStatusMapPromise = apiFetch(`${API_BASE_URL}/api/status-groups/all`)
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => buildWorkflowStatusMap(json?.data ?? []))
    .catch(() => ({}));

  workflowStatusMapCache = await workflowStatusMapPromise;
  return workflowStatusMapCache;
};

const WorkflowStatusPill = ({ status, className = '' }) => {
  const [workflowStatusMap, setWorkflowStatusMap] = React.useState(workflowStatusMapCache);
  const key = String(status || '').toLowerCase();
  const moduleMeta = MODULE_STATUS_META[key] || null;
  const meta = workflowStatusMeta(key, workflowStatusMap, moduleMeta);

  React.useEffect(() => {
    let mounted = true;
    loadWorkflowStatusMap().then((map) => {
      if (mounted) setWorkflowStatusMap(map);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
      style={workflowStatusBadgeStyle(key, workflowStatusMap, moduleMeta)}
    >
      {meta.label}
    </span>
  );
};

export default WorkflowStatusPill;

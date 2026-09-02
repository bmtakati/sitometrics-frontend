import React from 'react';

const WORKFLOW_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONVERTED_TO_LPO: 'Converted To LPO',
  SENT: 'Sent',
  PARTIALLY_DELIVERED: 'Partially Delivered',
  FULLY_DELIVERED: 'Fully Delivered',
  CLOSED: 'Closed',
};

const WORKFLOW_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  SUBMITTED: 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800',
  VERIFIED: 'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800',
  APPROVED: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800',
  REJECTED: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800',
  CONVERTED_TO_LPO: 'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-800',
  SENT: 'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800',
  PARTIALLY_DELIVERED: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800',
  FULLY_DELIVERED: 'bg-lime-100 text-lime-800 ring-lime-200 dark:bg-lime-950/50 dark:text-lime-200 dark:ring-lime-800',
  CLOSED: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700',
};

const formatFallbackLabel = (status) =>
  String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const WorkflowStatusPill = ({ status, className = '' }) => {
  const key = String(status || '').toUpperCase();
  const style = WORKFLOW_STYLES[key] || WORKFLOW_STYLES.DRAFT;
  const label = WORKFLOW_LABELS[key] || formatFallbackLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}
    >
      {label}
    </span>
  );
};

export default WorkflowStatusPill;

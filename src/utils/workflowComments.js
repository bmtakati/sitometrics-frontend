import {
  FiCheckCircle,
  FiClock,
  FiCornerUpLeft,
  FiSend,
  FiXCircle,
} from 'react-icons/fi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SYSTEM_COMMENT_PATTERNS = [
  /^SSE submitted by .+ for .+ verification\.?$/i,
  /^.+ approved the .+ assessment\.?$/i,
  /^Workflow (started|submitted)/i,
  /^SSE submitted for endorsement\.?$/i,
];

export const workflowActionStatusConfig = {
  started: {
    key: 'started',
    label: 'STARTED',
    icon: FiClock,
    badgeClass: 'border-gray-200 bg-gray-50 text-gray-600',
    badgeClassDark: 'border-gray-700 bg-gray-800 text-gray-300',
    iconClass: 'border-gray-200 bg-gray-50 text-gray-500',
    iconClassDark: 'border-gray-700 bg-gray-800 text-gray-400',
    lineClass: 'bg-gray-200',
    lineClassDark: 'bg-gray-700',
  },
  submitted: {
    key: 'submitted',
    label: 'SUBMITTED',
    icon: FiSend,
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    badgeClassDark: 'border-blue-800 bg-blue-950/40 text-blue-200',
    iconClass: 'border-blue-200 bg-blue-50 text-blue-600',
    iconClassDark: 'border-blue-800 bg-blue-950 text-blue-300',
    lineClass: 'bg-blue-200',
    lineClassDark: 'bg-blue-900/60',
  },
  forwarded: {
    key: 'forwarded',
    label: 'FORWARDED',
    icon: FiSend,
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    badgeClassDark: 'border-blue-800 bg-blue-950/40 text-blue-200',
    iconClass: 'border-blue-200 bg-blue-50 text-blue-600',
    iconClassDark: 'border-blue-800 bg-blue-950 text-blue-300',
    lineClass: 'bg-blue-200',
    lineClassDark: 'bg-blue-900/60',
  },
  approved: {
    key: 'approved',
    label: 'APPROVED',
    icon: FiCheckCircle,
    badgeClass: 'border-green-200 bg-green-50 text-green-700',
    badgeClassDark: 'border-green-800 bg-green-950/40 text-green-200',
    iconClass: 'border-green-200 bg-green-50 text-green-600',
    iconClassDark: 'border-green-800 bg-green-950 text-green-300',
    lineClass: 'bg-green-200',
    lineClassDark: 'bg-green-900/60',
  },
  returned: {
    key: 'returned',
    label: 'RETURNED',
    icon: FiCornerUpLeft,
    badgeClass: 'border-gray-200 bg-gray-50 text-orange-700',
    badgeClassDark: 'border-gray-700 bg-gray-800/60 text-orange-300',
    iconClass: 'border-gray-200 border-l-4 border-l-orange-500 bg-gray-50 text-orange-600',
    iconClassDark: 'border-gray-700 border-l-4 border-l-orange-500 bg-gray-800/60 text-orange-300',
    lineClass: 'bg-gray-200',
    lineClassDark: 'bg-gray-700',
  },
  rejected: {
    key: 'rejected',
    label: 'REJECTED',
    icon: FiXCircle,
    badgeClass: 'border-gray-200 bg-gray-50 text-red-700',
    badgeClassDark: 'border-gray-700 bg-gray-800/60 text-red-300',
    iconClass: 'border-gray-200 border-l-4 border-l-red-500 bg-gray-50 text-red-600',
    iconClassDark: 'border-gray-700 border-l-4 border-l-red-500 bg-gray-800/60 text-red-300',
    lineClass: 'bg-gray-200',
    lineClassDark: 'bg-gray-700',
  },
  pending: {
    key: 'pending',
    label: 'PENDING',
    icon: FiClock,
    badgeClass: 'border-gray-200 bg-gray-50 text-gray-600',
    badgeClassDark: 'border-gray-700 bg-gray-800 text-gray-300',
    iconClass: 'border-gray-200 bg-gray-50 text-gray-500',
    iconClassDark: 'border-gray-700 bg-gray-800 text-gray-400',
    lineClass: 'bg-gray-200',
    lineClassDark: 'bg-gray-700',
  },
};

const actionStatusMap = {
  submit: 'submitted',
  resubmit: 'submitted',
  start: 'started',
  approve: 'approved',
  auto_approve: 'approved',
  return: 'returned',
  reject: 'rejected',
  delegate: 'forwarded',
  reassign: 'forwarded',
  skip: 'forwarded',
  cancel: 'rejected',
};

/** Lifecycle events that are not user comments (e.g. opening Process starts the engine). */
const NON_COMMENT_ACTIONS = new Set(['start']);

export const formatWorkflowCommentDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()] || '';
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} · ${hours}:${minutes}`;
};

export const abbreviateStepLabel = (step) => {
  if (!step) return null;
  const trimmed = String(step).trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8 && !trimmed.includes(' ')) {
    return trimmed.toUpperCase();
  }

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

export const formatWorkflowRoute = (fromStep, toStep) => {
  const from = abbreviateStepLabel(fromStep);
  const to = abbreviateStepLabel(toStep);
  if (from && to) return `${from} → ${to}`;
  return from || to || '';
};

export const getActorInitials = (name, fallback = '?') => {
  const value = String(name || '').trim();
  if (!value) return fallback;
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
};

export const getPrimaryActorRole = (entry) => {
  const roles = Array.isArray(entry?.actor?.roles) ? entry.actor.roles.filter(Boolean) : [];
  if (roles.length) return roles[0];

  const fromStep = abbreviateStepLabel(entry?.from_step);
  if (fromStep) return fromStep;

  return null;
};

export const resolveWorkflowCommentStatusKey = (entry) => {
  const action = String(entry?.action || '').toLowerCase();

  if (action === 'approve') {
    if (!entry?.to_step) return 'approved';
    if (entry?.from_step && entry.to_step !== entry.from_step) return 'forwarded';
    return 'approved';
  }

  return actionStatusMap[action] || 'pending';
};

export const getWorkflowCommentStatusConfig = (entry) => {
  const key = resolveWorkflowCommentStatusKey(entry);
  return workflowActionStatusConfig[key] || workflowActionStatusConfig.pending;
};

export const isHumanWorkflowComment = (entry) => {
  const action = String(entry?.action || '').toLowerCase();
  if (['return', 'reject'].includes(action)) return true;

  const text = String(entry?.comments || '').trim();
  if (!text) return false;

  return !SYSTEM_COMMENT_PATTERNS.some((pattern) => pattern.test(text));
};

export const filterWorkflowComments = (detail, actionFilter = null) => {
  const allActions = Array.isArray(detail?.action_history) ? detail.action_history : [];
  const commentActions = allActions.filter((entry) => {
    const action = String(entry?.action || '').toLowerCase();
    return !NON_COMMENT_ACTIONS.has(action);
  });

  return typeof actionFilter === 'function' ? commentActions.filter(actionFilter) : commentActions;
};

export const getWorkflowCommentsCount = (detail, actionFilter = null) => (
  filterWorkflowComments(detail, actionFilter).length
);

export const formatWorkflowCommentsTabLabel = (count) => (
  count > 0 ? `Comments (${count})` : 'Comments'
);

export const mapWorkflowCommentEntry = (entry) => ({
  id: entry.uid || `${entry.action}-${entry.acted_at}`,
  statusKey: resolveWorkflowCommentStatusKey(entry),
  statusConfig: getWorkflowCommentStatusConfig(entry),
  route: formatWorkflowRoute(entry.from_step, entry.to_step),
  actorName: entry.actor?.name || entry.actor?.email || 'Unknown user',
  actorRole: getPrimaryActorRole(entry),
  actorInitials: getActorInitials(entry.actor?.name || entry.actor?.email),
  comment: entry.comments ? String(entry.comments).trim() : '',
  actedAt: entry.acted_at,
  formattedDate: formatWorkflowCommentDate(entry.acted_at),
  isHumanFeedback: isHumanWorkflowComment(entry),
  raw: entry,
});

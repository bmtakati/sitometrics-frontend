const ORDER_STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  OPEN: 'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-800',
  CLOSED: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800',
};

const ITEM_STATUS_STYLES = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  SENT: 'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:ring-orange-800',
  PREPARING: 'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800',
  READY: 'bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-200 dark:ring-cyan-800',
  DEPLETED: 'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800',
  SERVED: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800',
};

export const getOrderStatusStyle = (status) => ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.DRAFT;

export const getItemStatusStyle = (status) => ITEM_STATUS_STYLES[status] || ITEM_STATUS_STYLES.PENDING;

export const UNRECEIVED_ITEM_STATUSES = ['SENT', 'PREPARING', 'READY', 'DEPLETED'];

export const hasUnreceivedItems = (order) =>
  (order?.items || []).some((item) => UNRECEIVED_ITEM_STATUSES.includes(item.item_status));

export const canCloseOrder = (order) =>
  order?.workflow_status === 'OPEN' && !hasUnreceivedItems(order);

export const canCancelOpenOrder = (order) =>
  order?.workflow_status === 'OPEN' && !order?.preparation_locked && !hasUnreceivedItems(order);

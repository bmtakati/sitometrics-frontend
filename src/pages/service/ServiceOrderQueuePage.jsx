import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBell, FiCheck, FiChevronDown, FiChevronUp, FiFileText, FiLock, FiPlay, FiRefreshCw } from 'react-icons/fi';
import {
  showNumberPrompt,
  showQuickError,
  showSuccessToast,
} from '../../utils/dialogUtils';
import SearchableSelect from '../../components/SearchableSelect';
import PageHeader from '../../components/PageHeader';
import OrderStatusPill from '../../components/service/OrderStatusPill';
import useOrderNotifications from '../../hooks/useOrderNotifications';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { canPrintWaiterOrder, downloadOrderPdf, markItemPreparing, markItemReady } from '../../utils/waiterOrderApi';

const todayInputValue = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const ServiceOrderQueuePage = ({
  title,
  subtitle,
  icon: Icon,
  audience,
  fetchOrders,
  accent = 'blue',
}) => {
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [scope, setScope] = useState('open');
  const [closedDate, setClosedDate] = useState(todayInputValue);
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [readyQty, setReadyQty] = useState({});

  const { notifications, unreadCount, refresh: refreshNotifications, markRead } = useOrderNotifications(audience);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/outlets/all`)
      .then((res) => res.json())
      .then((json) => setOutlets(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setOutlets([]));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const date = scope === 'closed' ? closedDate : null;
      const rows = await fetchOrders(outletId || null, scope, date);
      setOrders(rows);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, outletId, scope, closedDate]);

  useEffect(() => {
    reload();
    if (scope === 'closed') return undefined;
    const timer = setInterval(reload, 10000);
    return () => clearInterval(timer);
  }, [reload, scope]);

  useEffect(() => {
    setExpanded({});
  }, [scope, closedDate]);

  const itemsExpandedByDefault = scope !== 'closed';

  const outletOptions = useMemo(
    () => [{ value: '', label: 'All outlets' }, ...outlets.map((row) => ({ value: String(row.id), label: row.name }))],
    [outlets]
  );

  const toggleExpanded = (orderId) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !(prev[orderId] ?? itemsExpandedByDefault) }));
  };

  const handlePreparing = async (item) => {
    try {
      await markItemPreparing(item.id);
      await reload();
      showSuccessToast('Order locked for waiter until items are ready.');
    } catch (error) {
      showQuickError('Failed', error.message);
    }
  };

  const handleReady = async (item) => {
    const orderedQty = Number(item.quantity || 0);
    const defaultQty = readyQty[item.id] ?? orderedQty;
    const input = await showNumberPrompt({
      title: 'Quantity to deliver',
      message: `Ordered: <strong>${orderedQty}</strong>. Enter 0 if depleted.`,
      value: defaultQty,
      min: 0,
      max: orderedQty,
      confirmText: 'Mark ready',
    });

    if (!input.isConfirmed) return;

    const fulfilledQuantity = Math.max(0, Math.min(orderedQty, parseInt(String(input.value), 10) || 0));

    try {
      await markItemReady(item.id, fulfilledQuantity);
      setReadyQty((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await reload();
      showSuccessToast(
        fulfilledQuantity === 0 ? 'Marked unavailable — waiter notified.' : 'Marked ready — waiter notified.',
        fulfilledQuantity === 0 ? 'warning' : 'success'
      );
    } catch (error) {
      showQuickError('Failed', error.message);
    }
  };

  const handlePrint = async (orderId, orderNo) => {
    try {
      await downloadOrderPdf(orderId, orderNo);
    } catch (error) {
      showQuickError('Print failed', error.message);
    }
  };

  const notificationBorder =
    accent === 'cyan'
      ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-950/30'
      : 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30';

  const notificationButton =
    accent === 'cyan' ? 'bg-cyan-600' : 'bg-blue-600';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Icon}
        title={title}
        subtitle={subtitle}
        actions={[{ label: unreadCount ? `Bell (${unreadCount})` : 'Bell', icon: FiBell, onClick: refreshNotifications }]}
      />

      {notifications.length > 0 ? (
        <div className={`rounded-xl border p-4 ${notificationBorder}`}>
          {notifications.map((note) => (
            <div key={note.id} className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>{note.body}</span>
              <button type="button" onClick={() => markRead(note.id)} className={`rounded-lg px-3 py-1 text-xs text-white ${notificationButton}`}>
                Dismiss
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px]">
          <SearchableSelect options={outletOptions} value={outletId} onChange={setOutletId} placeholder="Filter outlet…" />
        </div>
        <div className="inline-flex rounded-lg border border-stone-200 p-1 dark:border-stone-700 dark:bg-stone-900">
          <button
            type="button"
            onClick={() => setScope('open')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === 'open' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setScope('processed')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === 'processed' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            Processed
          </button>
          <button
            type="button"
            onClick={() => setScope('closed')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              scope === 'closed' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            Closed
          </button>
        </div>
        {scope === 'closed' ? (
          <input
            type="date"
            value={closedDate}
            onChange={(e) => setClosedDate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
        ) : null}
        <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isOpen = expanded[order.id] ?? itemsExpandedByDefault;
          const items = order.items || [];
          const isClosedScope = scope === 'closed';

          return (
            <div key={order.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
              <button
                type="button"
                onClick={() => toggleExpanded(order.id)}
                className={`flex w-full items-start justify-between gap-4 px-4 text-left ${
                  isClosedScope ? 'py-3' : 'py-4'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{order.order_no || order.code}</span>
                    <OrderStatusPill status={order.workflow_status} />
                    {order.preparation_locked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                        <FiLock className="h-3 w-3" /> Locked
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {order.outlet?.name} · Table {order.table?.table_number || '—'} · Waiter {order.waiter?.full_name || '—'}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Ref {order.code} · {items.length} item{items.length === 1 ? '' : 's'}
                    {scope === 'closed' && order.closed_at ? ` · Closed ${formatDateTime(order.closed_at)}` : ''}
                  </p>
                  {order.remarks ? <p className="text-xs text-stone-500 dark:text-stone-400">Note: {order.remarks}</p> : null}
                </div>
                <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                  <span className="text-xs uppercase tracking-wide">
                    {isOpen ? 'Hide' : 'View'} items ({items.length})
                  </span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-stone-200 px-4 py-3 dark:border-stone-700">
                  <div className="mb-3 flex justify-end">
                    {canPrintWaiterOrder(order) ? (
                      <button
                        type="button"
                        onClick={() => handlePrint(order.id, order.order_no || order.code)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                      >
                        <FiFileText /> Print order
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-3 dark:border-stone-800 dark:bg-stone-950/40"
                      >
                        <div>
                          <p className="font-semibold">{item.description}</p>
                          <p className="text-sm text-stone-500 dark:text-stone-400">
                            Ordered {item.quantity}
                            {item.fulfilled_quantity != null ? ` · Delivering ${item.fulfilled_quantity}` : ''}
                          </p>
                          {item.seat_numbers ? <p className="text-xs text-stone-400 dark:text-stone-500">Seats {item.seat_numbers}</p> : null}
                          {item.remarks ? <p className="text-xs text-stone-400 dark:text-stone-500">Note: {item.remarks}</p> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <OrderStatusPill status={item.item_status} type="item" />
                          {scope === 'open' && item.item_status === 'SENT' ? (
                            <button
                              type="button"
                              onClick={() => handlePreparing(item)}
                              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white"
                            >
                              <FiPlay /> Start preparing
                            </button>
                          ) : null}
                          {scope === 'open' && ['SENT', 'PREPARING'].includes(item.item_status) ? (
                            <button
                              type="button"
                              onClick={() => handleReady(item)}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                            >
                              <FiCheck /> Ready
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!orders.length ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No {scope} orders
          {scope === 'closed' ? ` on ${formatDate(closedDate)}` : ''}
          {outletId ? ' for this outlet' : ''}.
        </p>
      ) : null}
    </div>
  );
};

export default ServiceOrderQueuePage;

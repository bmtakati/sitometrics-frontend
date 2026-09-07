import React from 'react';
import OrderStatusPill from './OrderStatusPill';

const ActiveOrdersList = ({ orders, selectedOrderId, onSelectOrder, touchFriendly = false }) => (
  <div className={`space-y-2 overflow-y-auto ${touchFriendly ? 'max-h-none' : 'max-h-[420px]'}`}>
    {orders.map((order) => (
      <button
        key={order.id}
        type="button"
        onClick={() => onSelectOrder(order)}
        className={`w-full rounded-xl border text-left transition ${
          touchFriendly ? 'min-h-16 px-4 py-4' : 'px-3 py-3'
        } ${
          selectedOrderId === order.id
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
            : 'border-stone-200 hover:border-emerald-300 dark:border-stone-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className={`font-semibold ${touchFriendly ? 'text-base' : ''}`}>
              {order.order_no || order.code}
            </span>
            <p className="text-xs text-stone-400">{order.code}</p>
          </div>
          <OrderStatusPill status={order.workflow_status} />
        </div>
        <p className={`mt-1 text-stone-500 ${touchFriendly ? 'text-sm' : 'text-xs'}`}>
          {order.outlet?.name} · Table {order.table?.table_number || '—'} ·{' '}
          {order.items_count ?? order.items?.length ?? 0} items
        </p>
      </button>
    ))}
    {!orders.length ? <p className="text-sm text-stone-500">No active orders.</p> : null}
  </div>
);

export default ActiveOrdersList;

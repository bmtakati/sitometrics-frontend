import React from 'react';
import OrderStatusPill from './OrderStatusPill';

const ActiveOrdersList = ({ orders, selectedOrderId, onSelectOrder }) => (
  <div className="max-h-[420px] space-y-2 overflow-y-auto">
    {orders.map((order) => (
      <button
        key={order.id}
        type="button"
        onClick={() => onSelectOrder(order)}
        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
          selectedOrderId === order.id
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
            : 'border-stone-200 hover:border-emerald-300 dark:border-stone-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">{order.order_no || order.code}</span>
            <p className="text-xs text-stone-400">{order.code}</p>
          </div>
          <OrderStatusPill status={order.workflow_status} />
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {order.outlet?.name} · Table {order.table?.table_number || '—'} · {order.items_count ?? order.items?.length ?? 0} items
        </p>
      </button>
    ))}
    {!orders.length ? <p className="text-sm text-stone-500">No active orders.</p> : null}
  </div>
);

export default ActiveOrdersList;

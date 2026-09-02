import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import ActiveOrdersList from './ActiveOrdersList';
import CollapsiblePanel from './CollapsiblePanel';
import NewOrderForm from './NewOrderForm';

const WaiterOrdersSidebar = ({
  expandedPanel,
  onTogglePanel,
  newOrderProps,
  orders,
  selectedOrderId,
  onSelectOrder,
  onReloadOrders,
}) => (
  <div className="space-y-4">
    <CollapsiblePanel
      title="New order"
      expanded={expandedPanel === 'new'}
      onToggle={() => onTogglePanel('new')}
    >
      <NewOrderForm {...newOrderProps} />
    </CollapsiblePanel>

    <CollapsiblePanel
      title="Active orders"
      expanded={expandedPanel === 'active'}
      onToggle={() => onTogglePanel('active')}
      headerAction={
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReloadOrders();
          }}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-emerald-600 dark:hover:bg-stone-800"
          title="Refresh orders"
        >
          <FiRefreshCw className="h-4 w-4" />
        </button>
      }
    >
      <ActiveOrdersList orders={orders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} />
    </CollapsiblePanel>
  </div>
);

export default WaiterOrdersSidebar;

import React from 'react';
import { FiDroplet } from 'react-icons/fi';
import { fetchBarOrders } from '../../utils/waiterOrderApi';
import ServiceOrderQueuePage from './ServiceOrderQueuePage';

const BarQueue = () => (
  <ServiceOrderQueuePage
    title="Bar Queue"
    subtitle="Prepare beverage orders — marking ready deducts item ingredients from the bar store"
    icon={FiDroplet}
    audience="BAR"
    fetchOrders={fetchBarOrders}
    accent="cyan"
  />
);

export default BarQueue;

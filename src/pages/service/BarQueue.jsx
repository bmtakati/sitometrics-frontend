import React from 'react';
import { FiDroplet } from 'react-icons/fi';
import { fetchBarOrders } from '../../utils/waiterOrderApi';
import ServiceOrderQueuePage from './ServiceOrderQueuePage';

const BarQueue = () => (
  <ServiceOrderQueuePage
    title="Bar Queue"
    subtitle="Open, processed, and closed beverage orders — filter closed orders by date"
    icon={FiDroplet}
    audience="BAR"
    fetchOrders={fetchBarOrders}
    accent="cyan"
  />
);

export default BarQueue;

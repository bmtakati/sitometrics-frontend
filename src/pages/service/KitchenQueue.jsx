import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import { fetchKitchenOrders } from '../../utils/waiterOrderApi';
import ServiceOrderQueuePage from './ServiceOrderQueuePage';

const KitchenQueue = () => (
  <ServiceOrderQueuePage
    title="Kitchen Queue"
    subtitle="Open, processed, and closed food orders — filter closed orders by date"
    icon={FiCoffee}
    audience="KITCHEN"
    fetchOrders={fetchKitchenOrders}
    accent="blue"
  />
);

export default KitchenQueue;

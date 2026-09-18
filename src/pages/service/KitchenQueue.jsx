import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import { fetchKitchenOrders } from '../../utils/waiterOrderApi';
import ServiceOrderQueuePage from './ServiceOrderQueuePage';

const KitchenQueue = () => (
  <ServiceOrderQueuePage
    title="Kitchen Queue"
    subtitle="Prepare food orders — marking ready deducts item ingredients from the kitchen store"
    icon={FiCoffee}
    audience="KITCHEN"
    fetchOrders={fetchKitchenOrders}
    accent="blue"
  />
);

export default KitchenQueue;

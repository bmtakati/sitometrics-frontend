import React from 'react';
import { getItemStatusStyle, getOrderStatusStyle } from './orderStatusStyles';

const formatLabel = (status) =>
  String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrderStatusPill = ({ status, type = 'order', className = '' }) => {
  const style = type === 'item' ? getItemStatusStyle(status) : getOrderStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
};

export default OrderStatusPill;

import { crudPermissions, hasAnyPermission, hasPermission } from './permissions';

export const userRequiresPosMode = (user) => Boolean(user?.pos_interface);

export const posHomePath = (user) => {
  if (!userRequiresPosMode(user)) {
    return '/dashboard';
  }
  if (hasAnyPermission(user, crudPermissions('waiter-orders')) || hasPermission(user, 'print-waiter-orders')) {
    return '/service/waiter-orders';
  }
  if (hasPermission(user, 'view-cashier-sales')) {
    return '/service/cashier';
  }
  return '/dashboard';
};

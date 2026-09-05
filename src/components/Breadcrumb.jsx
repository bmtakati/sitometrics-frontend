import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import useDarkMode from '../hooks/useDarkMode';

const routeBreadcrumbs = {
  '/': ['Dashboard'],
  '/profile': ['Profile'],

  '/users/permissions': ['Access Control', 'Permissions'],
  '/users/password-policy': ['Access Control', 'Password Policy'],
  '/users/password-history': ['Access Control', 'Password History'],
  '/users/roles': ['Access Control', 'Roles'],
  '/users/list': ['Access Control', 'Users'],
  '/users/role-handover': ['Access Control', 'Handover'],

  '/logs/audit-trail': ['Activity Center', 'Audit Trails'],
  '/logs/errors': ['Activity Center', 'Errors'],
  '/logs/failed-logins': ['Activity Center', 'Failed Logins'],

  '/reports': ['Reports'],
  '/reports/sales': ['Reports', 'Sales Report'],
  '/reports/suppliers': ['Reports', 'Suppliers Report'],

  '/notifications/all': ['Activity Center', 'All Notifications'],
  '/notifications/unread': ['Activity Center', 'Unread'],
  '/notifications/system-alerts': ['Activity Center', 'System Alerts'],
  '/notifications/announcements': ['Activity Center', 'Announcements'],

  '/faq/general': ['FAQ', 'General Questions'],
  '/faq/guide-types': ['FAQ', 'Guide Types'],
  '/faq/guides': ['FAQ', 'User Guides'],
  '/faq/question-categories': ['FAQ', 'Categories'],
  '/faq/troubleshooting': ['FAQ', 'Troubleshooting'],
  '/faq/support': ['FAQ', 'Contact Support'],

  '/setup/modules': ['Setup', 'System', 'Modules'],
  '/setup/statuses': ['Setup', 'System', 'Statuses'],
  '/setup/status-groups': ['Setup', 'System', 'Status Categories'],
  '/setup/status-mapping': ['Setup', 'System', 'Status Mapping'],
  '/setup/faq-general': ['Setup', 'FAQ', 'General Questions'],
  '/setup/faq-guides': ['Setup', 'FAQ', 'User Guides'],
  '/setup/faq-troubleshooting': ['Setup', 'FAQ', 'Troubleshooting'],
  '/setup/faq-contact': ['Setup', 'FAQ', 'Contact Support'],
  '/setup/hotels': ['Setup', 'Property & Outlets', 'Hotels'],
  '/setup/outlets': ['Setup', 'Property & Outlets', 'Outlets'],
  '/setup/order-types': ['Setup', 'Property & Outlets', 'Order Types'],
  '/setup/item-category': ['Setup', 'Catalog', 'Item Categories'],
  '/setup/food-categories': ['Setup', 'Catalog', 'Food Categories'],
  '/setup/beverage-categories': ['Setup', 'Catalog', 'Beverage Categories'],
  '/setup/item': ['Setup', 'Catalog', 'Items'],
  '/setup/unit': ['Setup', 'Catalog', 'Units'],
  '/setup/currencies': ['Setup', 'Finance & Locale', 'Currency'],
  '/setup/payment-methods': ['Setup', 'Finance & Locale', 'Payment Methods'],
  '/setup/exchange-rates': ['Setup', 'Finance & Locale', 'Exchange Rates'],
  '/setup/locales': ['Setup', 'Finance & Locale', 'Locales'],
  '/setup/store': ['Setup', 'Inventory & Content', 'Stores'],
  '/setup/slideshow-slides': ['Setup', 'Inventory & Content', 'Slideshow'],

  '/procurement/suppliers': ['Procurement', 'Suppliers'],
  '/procurement/purchase-requisitions': ['Procurement', 'Purchase Requisitions'],
  '/procurement/local-purchase-orders': ['Procurement', 'Local Purchase Orders'],
  '/procurement/goods-received-notes': ['Procurement', 'Goods Received Notes'],
  '/procurement/store-requests': ['Procurement', 'Store Requests'],
  '/procurement/store-issues': ['Procurement', 'Store Issues'],
  '/procurement/stock-adjustments': ['Procurement', 'Stock Adjustments'],
  '/procurement/stock-count-sessions': ['Procurement', 'Stock Count Sessions'],
  '/procurement/menus': ['Kitchen & Bar', 'Menus'],
  '/procurement/menu-recipes': ['Kitchen & Bar', 'Menu Recipes'],
  '/procurement/consumptions': ['Kitchen & Bar', 'Consumption Posting'],
  '/procurement/bar-transactions': ['Kitchen & Bar', 'Bar Transactions'],

  '/service/waiter-orders': ['Service', 'Waiter Orders'],
  '/service/kitchen-queue': ['Service', 'Kitchen Queue'],
  '/service/bar-queue': ['Service', 'Bar Queue'],
  '/service/cashier': ['Service', 'Cashier Sales'],
};

const titleCaseSegment = (segment) =>
  segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getBreadcrumbs = (pathname) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (routeBreadcrumbs[normalizedPath]) {
    return routeBreadcrumbs[normalizedPath];
  }

  return normalizedPath
    .split('/')
    .filter(Boolean)
    .map(titleCaseSegment);
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const darkMode = useDarkMode();
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const breadcrumbs = getBreadcrumbs(pathname);

  if (normalizedPath === '/' || !breadcrumbs.length) {
    return null;
  }

  const textClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const linkClass = darkMode ? 'hover:text-emerald-300' : 'hover:text-emerald-700';

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex justify-end overflow-x-auto">
      <ol className="flex min-w-max items-center justify-end gap-1.5 whitespace-nowrap text-xs font-medium leading-5">
        <li className="flex items-center">
          <Link to="/" className={`inline-flex items-center gap-0.5 transition-colors ${textClass} ${linkClass}`}>
            <FiHome className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </li>
        {breadcrumbs[0] !== 'Dashboard' && (
          <>
            {breadcrumbs.map((label, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={`${label}-${index}`} className="flex items-center gap-1">
                  <FiChevronRight className={`h-3.5 w-3.5 shrink-0 ${textClass}`} />
                  <span className={`truncate ${isLast ? activeClass : textClass}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </>
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

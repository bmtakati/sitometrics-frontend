import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiSettings,
  FiHelpCircle,
  FiFileText,
  FiChevronDown,
  FiStar,
  FiMail,
  FiTrello,
  FiMenu,
  FiCheckCircle,
  FiBook,
  FiBookOpen,
  FiAward,
  FiActivity,
  FiDollarSign,
  FiClock,
  FiList,
  FiXCircle,
  FiBell,
  FiMessageSquare,
  FiClipboard,
  FiPieChart,
  FiShield,
  FiToggleRight,
  FiInbox,
  FiDroplet,
  FiRepeat,
  FiSend,
  FiCoffee,
  FiTruck,
  FiPrinter,
  FiShoppingCart,
  FiSliders,
  FiLayers,
} from 'react-icons/fi';
import SitometricsLogo from '../SitometricsLogo';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import { crudPermissions, hasPermission } from '../../utils/permissions';
import useDarkMode from '../../hooks/useDarkMode';
import { setupMenuChildren } from '../../pages/setup/setupNav';
import RoleSwitcher from './RoleSwitcher';
import apiFetch from '../../utils/apiFetch';
import { WORKFLOW_PENDING_COUNT_CHANGED } from '../../utils/workflowEvents';

const PENDING_COUNT_POLL_MS = 60000;

const canSeeMenuItem = (item, hasPerm) => {
  if (!item.permission) return false;
  const names = Array.isArray(item.permission) ? item.permission : [item.permission];
  return names.some((name) => hasPerm(name));
};

const filterMenu = (items, hasPerm) =>
  items
    .map((item) => {
      if (!item.children) return canSeeMenuItem(item, hasPerm) ? item : null;
      const children = filterMenu(item.children, hasPerm);
      if (!children.length) return null;
      return { ...item, children };
    })
    .filter(Boolean);

const formatBadgeCount = (count) => {
  const value = Number(count) || 0;
  if (value <= 0) return null;
  return value > 99 ? '99+' : String(value);
};

const SidebarBadge = ({ count, darkMode, compact = false }) => {
  const label = formatBadgeCount(count);
  if (!label) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums text-white ${
        compact
          ? 'ml-auto min-w-[1.15rem] px-1 py-0.5 text-[10px] leading-none'
          : 'ml-auto min-w-[1.35rem] px-1.5 py-0.5 text-[11px] leading-none'
      } ${darkMode ? 'bg-orange-500' : 'bg-orange-600'}`}
      aria-label={`${label} pending tasks`}
    >
      {label}
    </span>
  );
};

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const location = useLocation();
  const { user: authUser, loading: authLoading } = useAuth();
  const hasPerm = useCallback((name) => hasPermission(authUser, name), [authUser]);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const darkMode = useDarkMode();
  const canViewWorkflows = hasPerm('view-workflows');

  const activeItemClass = darkMode
    ? 'bg-emerald-950/60 text-emerald-300 font-medium border-l-2 border-emerald-400 shadow-sm shadow-emerald-950/30'
    : 'bg-emerald-50 text-emerald-800 font-medium border-l-2 border-emerald-600 shadow-sm shadow-emerald-100/60';

  const inactiveItemClass = darkMode
    ? 'text-gray-300 border-l-2 border-transparent hover:border-emerald-500 hover:bg-gray-800/80 hover:text-emerald-200 hover:translate-x-0.5 hover:shadow-sm hover:shadow-black/20'
    : 'text-stone-600 border-l-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-0.5 hover:shadow-sm hover:shadow-emerald-100/50';

  const childActiveClass = darkMode
    ? 'bg-gray-800/90 text-emerald-300 font-medium border-l-2 border-emerald-400'
    : 'bg-emerald-50/80 text-emerald-800 font-medium border-l-2 border-emerald-600';

  const childInactiveClass = darkMode
    ? 'text-gray-400 border-l-2 border-transparent hover:border-emerald-500/80 hover:bg-gray-800/70 hover:text-emerald-300 hover:translate-x-0.5'
    : 'text-stone-500 border-l-2 border-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-0.5';

  const iconHoverClass = 'transition-all duration-200 group-hover:scale-110 group-hover:text-emerald-500';

  const refreshPendingTaskCount = useCallback(async () => {
    if (!canViewWorkflows) {
      setPendingTaskCount(0);
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/workflow/tasks/pending-count`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        return;
      }
      setPendingTaskCount(Number(json?.data?.count) || 0);
    } catch {
      // Keep the last known count if the request fails.
    }
  }, [canViewWorkflows]);

  useEffect(() => {
    refreshPendingTaskCount();

    if (!canViewWorkflows) return undefined;

    const intervalId = window.setInterval(refreshPendingTaskCount, PENDING_COUNT_POLL_MS);
    const onFocus = () => refreshPendingTaskCount();
    const onPendingCountChanged = () => refreshPendingTaskCount();
    window.addEventListener('focus', onFocus);
    window.addEventListener(WORKFLOW_PENDING_COUNT_CHANGED, onPendingCountChanged);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(WORKFLOW_PENDING_COUNT_CHANGED, onPendingCountChanged);
    };
  }, [canViewWorkflows, refreshPendingTaskCount, location.pathname, authUser?.id]);

  const getSiblingIds = (menuId, items = menuItems) => {
    for (const item of items) {
      if (item.children) {
        const childIds = item.children.map((c) => c.id);
        if (childIds.includes(menuId)) {
          return childIds.filter((id) => id !== menuId);
        }
        const found = getSiblingIds(menuId, item.children);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      }
      const siblings = getSiblingIds(menuId) || [];
      return [...prev.filter((id) => !siblings.includes(id)), menuId];
    });
  };

  const menuItems = filterMenu([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiGrid,
      path: '/dashboard',
      color: 'text-primary-600',
      bgColor: 'bg-green-50',
      pinned: true,
      permission: 'view-dashboard',
    },
    {
      id: 'users',
      label: 'Access Control',
      icon: FiUserCheck,
      color: 'text-primary-600',
      bgColor: 'bg-success-50',
      pinned: true,
      children: [
        { id: 'permissions', label: 'Permissions', path: '/users/permissions', icon: FiCheckCircle, color: 'text-blue-600', permission: 'view-permissions' },
        { id: 'roles', label: 'Roles', path: '/users/roles', icon: FiAward, color: 'text-purple-600', permission: 'view-roles' },
        { id: 'user-list', label: 'Users', path: '/users/list', icon: FiUsers, color: 'text-green-600', permission: 'view-users' },
        { id: 'password-policy', label: 'Password Policy', path: '/users/password-policy', icon: FiShield, color: 'text-orange-600', permission: 'view-password-policy' },
        { id: 'password-history', label: 'Password History', path: '/users/password-history', icon: FiClock, color: 'text-amber-600', permission: 'view-password-history' },
        { id: 'role-handover', label: 'Handover', path: '/users/role-handover', icon: FiToggleRight, color: 'text-purple-600', permission: 'view-role-handovers' },
      ],
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: FiTrello,
      color: 'text-primary-600',
      bgColor: 'bg-indigo-50',
      pinned: true,
      badgeCount: pendingTaskCount,
      children: [
        {
          id: 'workflow-pending',
          label: 'Pending Tasks',
          path: '/workflows/pending',
          icon: FiClock,
          color: 'text-orange-600',
          permission: 'view-workflows',
          badgeCount: pendingTaskCount,
        },
        { id: 'workflow-completed', label: 'Completed Tasks', path: '/workflows/completed', icon: FiCheckCircle, color: 'text-green-600', permission: 'view-workflows' },
        { id: 'workflow-definitions', label: 'Definitions', path: '/workflows/definitions', icon: FiTrello, color: 'text-indigo-600', permission: ['view-workflows', ...crudPermissions('workflows')] },
      ],
    },
    {
      id: 'procurement',
      label: 'Procurement',
      icon: FiShoppingCart,
      color: 'text-primary-600',
      bgColor: 'bg-orange-50',
      pinned: true,
      children: [
        { id: 'suppliers', label: 'Suppliers', path: '/procurement/suppliers', icon: FiTruck, color: 'text-blue-600', permission: crudPermissions('suppliers') },
        { id: 'purchase-requisitions', label: 'Purchase Requisitions', path: '/procurement/purchase-requisitions', icon: FiClipboard, color: 'text-orange-600', permission: [...crudPermissions('purchase-requisitions'), 'view-all-purchase-requisitions', 'submit-purchase-requisitions', 'verify-purchase-requisitions', 'approve-purchase-requisitions', 'reject-purchase-requisitions', 'convert-purchase-requisitions-to-lpo'] },
        { id: 'local-purchase-orders', label: 'Local Purchase Orders', path: '/procurement/local-purchase-orders', icon: FiFileText, color: 'text-indigo-600', permission: [...crudPermissions('local-purchase-orders'), 'view-all-local-purchase-orders', 'submit-local-purchase-orders', 'verify-local-purchase-orders', 'approve-local-purchase-orders', 'reject-local-purchase-orders', 'print-local-purchase-orders'] },
        { id: 'goods-received-notes', label: 'Goods Received Notes', path: '/procurement/goods-received-notes', icon: FiInbox, color: 'text-green-600', permission: [...crudPermissions('goods-received-notes'), 'view-all-goods-received-notes', 'submit-goods-received-notes', 'verify-goods-received-notes', 'approve-goods-received-notes', 'reject-goods-received-notes'] },
        { id: 'store-requests', label: 'Store Requests', path: '/procurement/store-requests', icon: FiRepeat, color: 'text-violet-600', permission: [...crudPermissions('store-requests'), 'view-all-store-requests', 'submit-store-requests', 'verify-store-requests', 'approve-store-requests', 'reject-store-requests'] },
        { id: 'store-issues', label: 'Store Issues', path: '/procurement/store-issues', icon: FiSend, color: 'text-blue-600', permission: [...crudPermissions('store-issues'), 'view-all-store-issues', 'submit-store-issues', 'verify-store-issues', 'approve-store-issues', 'reject-store-issues'] },
        { id: 'stock-adjustments', label: 'Stock Adjustments', path: '/procurement/stock-adjustments', icon: FiSliders, color: 'text-rose-600', permission: crudPermissions('stock-adjustments') },
        { id: 'stock-movements', label: 'Stock Movements', path: '/procurement/stock-movements', icon: FiActivity, color: 'text-slate-600', permission: 'view-stock-movements' },
        { id: 'stock-count-sessions', label: 'Stock Count Sessions', path: '/procurement/stock-count-sessions', icon: FiClipboard, color: 'text-teal-600', permission: crudPermissions('stock-count-sessions') },
      ],
    },
    {
      id: 'service',
      label: 'Service',
      icon: FiUsers,
      color: 'text-primary-600',
      bgColor: 'bg-sky-50',
      pinned: true,
      children: [
        { id: 'waiter-orders', label: 'Waiter Orders', path: '/service/waiter-orders', icon: FiCoffee, color: 'text-emerald-600', permission: [...crudPermissions('waiter-orders'), 'approve-complementary-orders'] },
        { id: 'kitchen-queue', label: 'Kitchen Queue', path: '/service/kitchen-queue', icon: FiCoffee, color: 'text-orange-600', permission: 'view-kitchen-queue' },
        { id: 'bar-queue', label: 'Bar Queue', path: '/service/bar-queue', icon: FiDroplet, color: 'text-cyan-600', permission: 'view-bar-queue' },
        { id: 'cashier', label: 'Cashier Sales', path: '/service/cashier', icon: FiDollarSign, color: 'text-green-600', permission: 'view-cashier-sales' },
        { id: 'print-jobs', label: 'Print Jobs', path: '/service/print-jobs', icon: FiPrinter, color: 'text-stone-600', permission: 'print-waiter-orders' },
      ],
    },
    {
      id: 'menus',
      label: 'Menus',
      icon: FiCoffee,
      color: 'text-primary-600',
      bgColor: 'bg-amber-50',
      pinned: true,
      children: [
        { id: 'menu-categories', label: 'Categories', path: '/setup/menu-categories', icon: FiLayers, color: 'text-amber-600', permission: crudPermissions('catalog-categories') },
        { id: 'menu-subcategories', label: 'Sub-categories', path: '/setup/menu-subcategories', icon: FiList, color: 'text-violet-600', permission: [...crudPermissions('food-categories'), ...crudPermissions('beverage-categories')] },
        { id: 'menu-items', label: 'Items', path: '/setup/menu-items', icon: FiList, color: 'text-rose-600', permission: crudPermissions('menu-items') },
        { id: 'menu-list', label: 'Menu List', path: '/procurement/menus', icon: FiCoffee, color: 'text-orange-600', permission: crudPermissions('menus') },
      ],
    },
    {
      id: 'activity-center',
      label: 'Activity Center',
      icon: FiActivity,
      color: 'text-primary-600',
      bgColor: 'bg-indigo-50',
      pinned: true,
      children: [
        { id: 'audit-trail', label: 'Audit Trails', path: '/logs/audit-trail', icon: FiList, color: 'text-blue-600', permission: 'view-audits' },
        { id: 'errors', label: 'Errors', path: '/logs/errors', icon: FiXCircle, color: 'text-red-600', permission: 'view-logs' },
        { id: 'failed-logins', label: 'Failed Logins', path: '/logs/failed-logins', icon: FiShield, color: 'text-orange-600', permission: 'view-logs' },
        { id: 'notifications', label: 'Notifications', path: '/notifications', exact: true, icon: FiBell, color: 'text-yellow-600', permission: 'view-notifications' },
        { id: 'announcements', label: 'Announcements', path: '/notifications/announcements', icon: FiMail, color: 'text-blue-600', permission: 'view-notifications' },
      ],
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: FiHelpCircle,
      color: 'text-primary-600',
      bgColor: 'bg-purple-50',
      pinned: true,
      children: [
        { id: 'general-questions', label: 'General Questions', path: '/faq/general', icon: FiMessageSquare, color: 'text-purple-600', permission: 'view-faq' },
        { id: 'guide-types', label: 'Guide Types', path: '/faq/guide-types', icon: FiBookOpen, color: 'text-indigo-600', permission: 'view-faq' },
        { id: 'user-guides', label: 'User Guides', path: '/faq/guides', icon: FiBook, color: 'text-blue-600', permission: 'view-faq' },
        { id: 'question-categories', label: 'Categories', path: '/faq/question-categories', icon: FiList, color: 'text-orange-600', permission: 'view-faq' },
        { id: 'contact-support', label: 'Contact Support', path: '/faq/support', icon: FiMail, color: 'text-green-600', permission: 'view-faq' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FiPieChart,
      path: '/reports',
      color: 'text-primary-600',
      bgColor: 'bg-rose-50',
      pinned: true,
      permission: 'view-reports',
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: FiSettings,
      color: 'text-primary-600',
      bgColor: 'bg-green-50',
      pinned: true,
      children: setupMenuChildren,
    },
  ], hasPerm);

  const isPathMatch = (path, options = {}) => {
    if (!path) return false;
    const normalize = (value) => String(value).replace(/\/+$/, '') || '/';
    const current = normalize(location.pathname);
    const target = normalize(path);
    if (options.exact) return current === target;
    return current === target || current.startsWith(`${target}/`);
  };

  const isActive = (itemOrPath) => {
    if (itemOrPath && typeof itemOrPath === 'object') {
      return isPathMatch(itemOrPath.path, { exact: Boolean(itemOrPath.exact) });
    }
    return isPathMatch(itemOrPath);
  };

  useEffect(() => {
    const findActiveMenu = () => {
      for (const item of menuItems) {
        if (item.children) {
          for (const child of item.children) {
            if (isPathMatch(child.path, { exact: Boolean(child.exact) })) {
              return [item.id];
            }
            if (child.children) {
              for (const grandchild of child.children) {
                if (isPathMatch(grandchild.path, { exact: Boolean(grandchild.exact) })) {
                  return [item.id, child.id];
                }
              }
            }
          }
        }
      }
      return [];
    };

    const activeMenuIds = findActiveMenu();
    if (activeMenuIds.length) {
      setExpandedMenus(activeMenuIds);
    }
  }, [location.pathname, authUser]);

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = isActive(item);
    const badge = item.badgeCount;

    if (hasChildren) {
      return (
        <li key={item.id} className={level === 0 ? 'mb-1' : ''}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={`group mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 ease-out
              ${active
                ? level === 0 ? activeItemClass : childActiveClass
                : level === 0 ? inactiveItemClass : childInactiveClass
              }
              ${isCollapsed && level === 0 ? 'justify-center' : ''}
            `}
          >
            <div className={`flex min-w-0 items-center gap-3 ${isCollapsed && level === 0 ? '' : 'flex-1'}`}>
              {level === 0 && item.icon && (
                <span className="relative shrink-0">
                  <item.icon className={`h-5 w-5 ${active ? 'text-emerald-500' : `${item.color} ${iconHoverClass}`}`} />
                  {isCollapsed ? (
                    <span className="absolute -right-1.5 -top-1.5">
                      <SidebarBadge count={badge} darkMode={darkMode} compact />
                    </span>
                  ) : null}
                </span>
              )}
              {level === 1 && item.icon && (
                <item.icon className={`h-4 w-4 ${active ? 'text-emerald-500' : `${item.color || 'text-stone-400'} ${iconHoverClass}`}`} />
              )}
              {!isCollapsed && (
                <span className="truncate text-sm transition-colors duration-200 group-hover:text-inherit">{item.label}</span>
              )}
              {!isCollapsed && <SidebarBadge count={badge} darkMode={darkMode} compact />}
            </div>
            {!isCollapsed && (
              <div className={`ml-2 shrink-0 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <FiChevronDown className="w-4 h-4" />
              </div>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <ul className={`mt-1 space-y-0.5 border-l pl-3 ml-8 ${darkMode ? 'border-gray-700' : 'border-stone-200'}`}>
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.id} className={level === 0 ? 'mb-1' : ''}>
        <Link
          to={item.path || '#'}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener noreferrer' : undefined}
          onClick={() => {
            if (window.innerWidth < 1024) {
              onClose();
            }
          }}
          className={`group mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ease-out
            ${active
              ? level === 0 ? activeItemClass : childActiveClass
              : level === 0 ? inactiveItemClass : childInactiveClass
            }
            ${isCollapsed && level === 0 ? 'justify-center' : ''}
            ${level > 0 ? 'px-2 py-2' : ''}
          `}
        >
          {level === 0 && item.icon && (
            <span className="relative shrink-0">
              <item.icon className={`h-5 w-5 ${active ? 'text-emerald-500' : `${item.color} ${iconHoverClass}`}`} />
              {isCollapsed ? (
                <span className="absolute -right-1.5 -top-1.5">
                  <SidebarBadge count={badge} darkMode={darkMode} compact />
                </span>
              ) : null}
            </span>
          )}
          {item.icon && level > 0 && (
            <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-500' : `${item.color || 'text-stone-400'} ${iconHoverClass}`}`} />
          )}
          {!isCollapsed && (
            <span className="min-w-0 flex-1 truncate text-sm transition-colors duration-200 group-hover:text-inherit">{item.label}</span>
          )}
          {!isCollapsed && <SidebarBadge count={badge} darkMode={darkMode} />}
          {item.pinned && !isCollapsed && !formatBadgeCount(badge) && (
            <FiStar className="ml-auto h-3 w-3 text-amber-500" />
          )}
        </Link>
      </li>
    );
  };

  if (authLoading) return null;

  return (
    <>
      <aside
        data-app-sidebar="true"
        className={`fixed left-0 top-0 z-50 h-screen border-r transition-all duration-300 lg:z-30
          ${darkMode
            ? 'border-gray-700 bg-gray-900 shadow-xl shadow-black/30'
            : 'border-emerald-100 bg-gradient-to-b from-emerald-50 via-slate-50 to-white shadow-lg shadow-emerald-100/60'
          }
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          <div className={`relative flex h-16 items-center justify-between border-b px-4 ${
            darkMode ? 'border-gray-700' : 'border-emerald-100'
          }`}>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" aria-hidden />
            {!isCollapsed ? (
              <>
                <SitometricsLogo darkMode={darkMode} showSubtitle={false} />
                <button
                  onClick={onClose}
                  className={`hidden rounded-lg p-2 transition-all duration-200 lg:flex ${
                    darkMode
                      ? 'text-gray-400 hover:bg-gray-800/80 hover:text-emerald-300 hover:scale-105'
                      : 'text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105'
                  }`}
                  aria-label="Toggle sidebar"
                >
                  <FiMenu className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="group w-full"
                aria-label="Expand sidebar"
              >
                <SitometricsLogo collapsed darkMode={darkMode} />
              </button>
            )}
          </div>

          <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-5">
            <RoleSwitcher isCollapsed={isCollapsed} darkMode={darkMode} onClose={onClose} />
            <ul className="space-y-1">
              {menuItems.map((item) => renderMenuItem(item))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiGrid,
  FiLayers, 
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiUserCheck,
  FiUser,
  FiBarChart2,
  FiSettings,
  FiHelpCircle,
  FiFileText,
  FiLayout,
  FiChevronDown,
  FiChevronRight,
  FiStar,
  FiMail,
  FiCalendar,
  FiTrello,
  FiFile,
  FiMenu,
  FiCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiBook,
  FiBookOpen,
  FiAward,
  FiTarget,
  FiAnchor,
  FiActivity,
  FiDollarSign,
  FiBriefcase,
  FiClock,
  FiFlag,
  FiList,
  FiXCircle,
  FiMapPin,
  FiGlobe,
  FiMap,
  FiNavigation,
  FiRefreshCw,
  FiBell,
  FiMessageSquare,
  FiClipboard,
  FiPieChart,
  FiEye,
  FiCpu,
  FiTag,
  FiSliders,
  FiShield,
  FiToggleRight,
  FiDatabase,
  FiArchive,
  FiPackage,
  FiInbox,
  FiMinusCircle,
  FiDroplet,
  FiRepeat,
  FiSend,
  FiCoffee,
  FiTruck
} from 'react-icons/fi';
import SitometricsLogo from '../SitometricsLogo';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import useDarkMode from '../../hooks/useDarkMode';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const location = useLocation();
  const { user: authUser, loading: authLoading } = useAuth();
  const hasPerm = useCallback((name) => hasPermission(authUser, name), [authUser]);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const darkMode = useDarkMode();

  const activeItemClass = darkMode
    ? 'bg-emerald-950/60 text-emerald-300 font-medium border-l-2 border-emerald-400 shadow-sm shadow-emerald-950/30'
    : 'bg-emerald-50 text-emerald-800 font-medium border-l-2 border-emerald-600 shadow-sm shadow-emerald-100/60';

  const inactiveItemClass = darkMode
    ? 'text-stone-300 border-l-2 border-transparent hover:border-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-200 hover:translate-x-0.5 hover:shadow-sm hover:shadow-emerald-950/20'
    : 'text-stone-600 border-l-2 border-transparent hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-0.5 hover:shadow-sm hover:shadow-emerald-100/50';

  const childActiveClass = darkMode
    ? 'bg-stone-800/90 text-emerald-300 font-medium border-l-2 border-emerald-400'
    : 'bg-emerald-50/80 text-emerald-800 font-medium border-l-2 border-emerald-600';

  const childInactiveClass = darkMode
    ? 'text-stone-400 border-l-2 border-transparent hover:border-emerald-500/80 hover:bg-emerald-500/15 hover:text-emerald-300 hover:translate-x-0.5'
    : 'text-stone-500 border-l-2 border-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:translate-x-0.5';

  const iconHoverClass = 'transition-all duration-200 group-hover:scale-110 group-hover:text-emerald-500';

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

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiGrid,
      path: '/',
      color: 'text-primary-600',
      bgColor: 'bg-green-50',
      pinned: true
    },
    {
      id: 'users',
      label: 'Access Control',
      icon: FiUserCheck,
      color: 'text-primary-600',
      bgColor: 'bg-success-50',
      pinned: true,
      children: [
        ...(hasPerm('view-permissions') ? [{ id: 'permissions', label: 'Permissions', path: '/users/permissions', icon: FiCheckCircle, color: 'text-blue-600' }] : []),
        ...(hasPerm('view-roles') ? [{ id: 'roles', label: 'Roles', path: '/users/roles', icon: FiAward, color: 'text-purple-600' }] : []),
        ...(hasPerm('view-users') ? [{ id: 'user-list', label: 'Users', path: '/users/list', icon: FiUsers, color: 'text-green-600' }] : []),
        ...(hasPerm('view-password-policy') ? [{ id: 'password-policy', label: 'Password Policy', path: '/users/password-policy', icon: FiShield, color: 'text-orange-600' }] : []),
        ...(hasPerm('view-password-history') ? [{ id: 'password-history', label: 'Password History', path: '/users/password-history', icon: FiClock, color: 'text-amber-600' }] : []),
        ...(hasPerm('view-role-handovers') ? [{ id: 'role-handover', label: 'Handover', path: '/users/role-handover', icon: FiToggleRight, color: 'text-purple-600' }] : [])
      ]
    },
    {
      id: 'procurement',
      label: 'Procurement',
      icon: FiShoppingCart,
      color: 'text-primary-600',
      bgColor: 'bg-orange-50',
      pinned: true,
      children: [
        { id: 'purchase-requisitions', label: 'Purchase Requisitions', path: '/procurement/purchase-requisitions', icon: FiClipboard, color: 'text-orange-600' },
        { id: 'local-purchase-orders', label: 'Local Purchase Orders', path: '/procurement/local-purchase-orders', icon: FiFileText, color: 'text-indigo-600' },
        { id: 'goods-received-notes', label: 'Goods Received Notes', path: '/procurement/goods-received-notes', icon: FiInbox, color: 'text-green-600' },
        { id: 'store-requests', label: 'Store Requests', path: '/procurement/store-requests', icon: FiRepeat, color: 'text-violet-600' },
        { id: 'store-issues', label: 'Store Issues', path: '/procurement/store-issues', icon: FiSend, color: 'text-blue-600' },
        { id: 'stock-adjustments', label: 'Stock Adjustments', path: '/procurement/stock-adjustments', icon: FiSliders, color: 'text-rose-600' },
        { id: 'stock-count-sessions', label: 'Stock Count Sessions', path: '/procurement/stock-count-sessions', icon: FiClipboard, color: 'text-teal-600' },
        { id: 'menus', label: 'Menus', path: '/procurement/menus', icon: FiCoffee, color: 'text-orange-600' },
        { id: 'menu-recipes', label: 'Menu Recipes', path: '/procurement/menu-recipes', icon: FiList, color: 'text-emerald-600' },
        { id: 'consumptions', label: 'Consumption Posting', path: '/procurement/consumptions', icon: FiMinusCircle, color: 'text-red-600' },
        { id: 'bar-transactions', label: 'Bar Transactions', path: '/procurement/bar-transactions', icon: FiDroplet, color: 'text-cyan-600' }
      ]
    },
    {
      id: 'activity-center',
      label: 'Activity Center',
      icon: FiActivity,
      color: 'text-primary-600',
      bgColor: 'bg-indigo-50',
      pinned: true,
      children: [
        { id: 'audit-trail',       label: 'Audit Trails',      path: '/logs/audit-trail',              icon: FiList,         color: 'text-blue-600'   },
        { id: 'errors',            label: 'Errors',            path: '/logs/errors',                   icon: FiXCircle,      color: 'text-red-600'    },
        { id: 'failed-logins',     label: 'Failed Logins',     path: '/logs/failed-logins',            icon: FiShield,       color: 'text-orange-600' },
        { id: 'all-notifications', label: 'All Notifications', path: '/notifications/all',             icon: FiBell,         color: 'text-yellow-600' },
        { id: 'unread',            label: 'Unread',            path: '/notifications/unread',          icon: FiCircle,       color: 'text-red-600'    },
        { id: 'system-alerts',     label: 'System Alerts',     path: '/notifications/system-alerts',   icon: FiAlertCircle,  color: 'text-orange-600' },
        { id: 'announcements',     label: 'Announcements',     path: '/notifications/announcements',   icon: FiMail,         color: 'text-blue-600'   }
      ]
    },
     {
      id: 'faq',
      label: 'FAQ',
      icon: FiHelpCircle,
      color: 'text-primary-600',
      bgColor: 'bg-purple-50',
      pinned: true,
      children: [
        { id: 'general-questions', label: 'General Questions', path: '/faq/general', icon: FiMessageSquare, color: 'text-purple-600' },
        { id: 'guide-types', label: 'Guide Types', path: '/faq/guide-types', icon: FiBookOpen, color: 'text-indigo-600' },
        { id: 'user-guides', label: 'User Guides', path: '/faq/guides', icon: FiBook, color: 'text-blue-600' },
        { id: 'question-categories', label: 'Categories', path: '/faq/question-categories', icon: FiList, color: 'text-orange-600' },
        { id: 'troubleshooting', label: 'Troubleshooting', path: '/faq/troubleshooting', icon: FiAlertCircle, color: 'text-red-600' },
        { id: 'contact-support', label: 'Contact Support', path: '/faq/support', icon: FiMail, color: 'text-green-600' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FiPieChart,
      path: '/reports',
      color: 'text-primary-600',
      bgColor: 'bg-rose-50',
      pinned: true
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: FiSettings,
      color: 'text-primary-600',
      bgColor: 'bg-green-50',
      pinned: true,
      children: [
        { id: 'modules', label: 'Modules', path: '/setup/modules', icon: FiGrid, color: 'text-blue-600' },
        { id: 'statuses', label: 'Statuses', path: '/setup/statuses', icon: FiTag, color: 'text-rose-600' },
        { id: 'status-groups', label: 'Status Categories', path: '/setup/status-groups', icon: FiLayers, color: 'text-violet-600' },
        { id: 'status-mapping', label: 'Status Mapping', path: '/setup/status-mapping', icon: FiSliders, color: 'text-cyan-600' },
        { id: 'item-category', label: 'Item Categories', path: '/setup/item-category', icon: FiArchive, color: 'text-emerald-600' },
        { id: 'item', label: 'Items', path: '/setup/item', icon: FiBox, color: 'text-amber-600' },
        { id: 'unit', label: 'Units', path: '/setup/unit', icon: FiPackage, color: 'text-cyan-600' },
        { id: 'locales', label: 'Locales', path: '/setup/locales', icon: FiGlobe, color: 'text-indigo-600' },
        { id: 'supplier', label: 'Suppliers', path: '/setup/supplier', icon: FiTruck, color: 'text-blue-600' },
        { id: 'store', label: 'Stores', path: '/setup/store', icon: FiHome, color: 'text-violet-600' }
      ]
    }
  ];

  const isPathMatch = (path) => {
    if (!path) return false;
    const normalize = (value) => String(value).replace(/\/+$/, '') || '/';
    const current = normalize(location.pathname);
    const target = normalize(path);
    return current === target || current.startsWith(`${target}/`);
  };

  const isActive = (path) => isPathMatch(path);

  // Auto-expand the menu containing the active route
  useEffect(() => {
    const findActiveMenu = () => {
      for (const item of menuItems) {
        if (item.children) {
          for (const child of item.children) {
            if (isPathMatch(child.path)) {
              return [item.id];
            }
            // Nested grandchildren (e.g. Quality Assurance → Frameworks → List)
            if (child.children) {
              for (const grandchild of child.children) {
                if (isPathMatch(grandchild.path)) {
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

  const renderMenuItem = (item, level = 0, isLastChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = isActive(item.path);

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
            <div className="flex items-center gap-3">
              {level === 0 && item.icon && (
                <item.icon className={`h-5 w-5 ${active ? 'text-emerald-500' : `${item.color} ${iconHoverClass}`}`} />
              )}
              {level === 1 && item.icon && (
                <item.icon className={`h-4 w-4 ${active ? 'text-emerald-500' : `${item.color || 'text-stone-400'} ${iconHoverClass}`}`} />
              )}
              {!isCollapsed && (
                <span className="text-sm transition-colors duration-200 group-hover:text-inherit">{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <FiChevronDown className="w-4 h-4" />
              </div>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <ul className={`mt-1 space-y-0.5 border-l pl-3 ml-8 ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}>
              {item.children.map((child, index) => renderMenuItem(child, level + 1, index === item.children.length - 1))}
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
            // Only close sidebar on mobile screens (< 1024px)
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
            <item.icon className={`h-5 w-5 ${active ? 'text-emerald-500' : `${item.color} ${iconHoverClass}`}`} />
          )}
          {item.icon && level > 0 && (
            <item.icon className={`h-4 w-4 ${active ? 'text-emerald-500' : `${item.color || 'text-stone-400'} ${iconHoverClass}`}`} />
          )}
          {!isCollapsed && (
            <span className="text-sm transition-colors duration-200 group-hover:text-inherit">{item.label}</span>
          )}
          {item.pinned && !isCollapsed && (
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
        className={`fixed left-0 top-0 z-30 h-screen border-r transition-all duration-300
          ${darkMode
            ? 'border-stone-800 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 shadow-xl shadow-black/30'
            : 'border-stone-200 bg-gradient-to-b from-white via-stone-50 to-emerald-50/30 shadow-lg shadow-stone-200/50'
          }
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`relative flex h-16 items-center justify-between border-b px-4 ${
            darkMode ? 'border-stone-800' : 'border-stone-200'
          }`}>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" aria-hidden />
            {!isCollapsed ? (
              <>
                <SitometricsLogo darkMode={darkMode} />
                <button
                  onClick={onClose}
                  className={`hidden rounded-lg p-2 transition-all duration-200 lg:flex ${
                    darkMode
                      ? 'text-stone-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:scale-105'
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

          {/* Navigation */}
          <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-5">
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
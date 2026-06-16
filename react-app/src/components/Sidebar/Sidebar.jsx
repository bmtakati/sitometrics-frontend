import React, { useState, useEffect } from 'react';
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
  FiPieChart
} from 'react-icons/fi';
import coartOfArms from '../../assets/coart_of_arms.png';

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? [] // Close the menu if it's already open
        : [menuId] // Open only this menu, closing all others
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiGrid,
      path: '/',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      pinned: true
    },
    {
      id: 'users',
      label: 'Users',
      icon: FiUserCheck,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      pinned: true,
      children: [
        { id: 'permissions', label: 'Permissions', path: '/users/permissions', icon: FiCheckCircle, color: 'text-blue-600' },
        { id: 'roles', label: 'Roles', path: '/users/roles', icon: FiAward, color: 'text-purple-600' },
        { id: 'user-list', label: 'Users List', path: '/users/list', icon: FiUsers, color: 'text-green-600' },
        { id: 'transfer-requests', label: 'Transfer Requests', path: '/users/transfer-requests', icon: FiRefreshCw, color: 'text-orange-600' }
      ]
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: FiHome,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      pinned: true,
      children: [
        { id: 'school-category', label: 'School Categories', path: '/schools/category', icon: FiFlag, color: 'text-red-600' },
        { id: 'school-classification', label: 'School Classifications', path: '/schools/classification', icon: FiAward, color: 'text-blue-600' },
        { id: 'school-owner', label: 'School Owners', path: '/schools/owner', icon: FiUser, color: 'text-indigo-600' },
        { id: 'school-gender-type', label: 'School Gender Types', path: '/schools/gender-type', icon: FiUsers, color: 'text-pink-600' },
        { id: 'sponsorship-type', label: 'Sponsorship Types', path: '/schools/sponsorship-type', icon: FiDollarSign, color: 'text-emerald-600' },
        { id: 'school-type', label: 'School Types', path: '/schools/type', icon: FiHome, color: 'text-cyan-600' },
        { id: 'service-type', label: 'Service Types', path: '/schools/service-type', icon: FiActivity, color: 'text-teal-600' },
        { id: 'school-list', label: 'List', path: '/schools/list', icon: FiList, color: 'text-blue-600' }
      ]
    },
    {
      id: 'books',
      label: 'Books',
      icon: FiBook,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      pinned: true,
      children: [
        { id: 'book-types', label: 'Types', path: '/books/types', icon: FiBookOpen, color: 'text-indigo-600' },
        { id: 'book-list', label: 'List', path: '/books/list', icon: FiList, color: 'text-blue-600' }
      ]
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: FiClipboard,
      path: '/assessments',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      pinned: true
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: FiFileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      pinned: true,
      children: [
        { id: 'audit-trail', label: 'Audit Trails', path: '/logs/audit-trail', icon: FiList, color: 'text-blue-600' },
        { id: 'errors', label: 'Errors', path: '/logs/errors', icon: FiXCircle, color: 'text-red-600' }
      ]
    },
    {
      id: 'geographical',
      label: 'Locations',
      icon: FiMapPin,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      pinned: true,
      children: [
        { id: 'geographical-level', label: 'Geographical Levels', path: '/geographical/geographical-level', icon: FiLayers, color: 'text-indigo-600' },
        { id: 'country', label: 'Countries', path: '/geographical/country', icon: FiGlobe, color: 'text-blue-600' },
        { id: 'region', label: 'Regions', path: '/geographical/region', icon: FiMap, color: 'text-green-600' },
        { id: 'council', label: 'Councils', path: '/geographical/council', icon: FiHome, color: 'text-purple-600' },
        { id: 'ward', label: 'Wards', path: '/geographical/ward', icon: FiNavigation, color: 'text-pink-600' },
        { id: 'street-village', label: 'Streets/Villages', path: '/geographical/street-village', icon: FiFlag, color: 'text-yellow-600' }
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      pinned: true,
      children: [
        { id: 'all-notifications', label: 'All Notifications', path: '/notifications/all', icon: FiBell, color: 'text-yellow-600' },
        { id: 'unread', label: 'Unread', path: '/notifications/unread', icon: FiCircle, color: 'text-red-600' },
        { id: 'system-alerts', label: 'System Alerts', path: '/notifications/system-alerts', icon: FiAlertCircle, color: 'text-orange-600' },
        { id: 'announcements', label: 'Announcements', path: '/notifications/announcements', icon: FiMail, color: 'text-blue-600' }
      ]
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: FiHelpCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      pinned: true,
      children: [
        { id: 'general-questions', label: 'General Questions', path: '/faq/general', icon: FiMessageSquare, color: 'text-purple-600' },
        { id: 'user-guides', label: 'User Guides', path: '/faq/guides', icon: FiBook, color: 'text-blue-600' },
        { id: 'troubleshooting', label: 'Troubleshooting', path: '/faq/troubleshooting', icon: FiAlertCircle, color: 'text-red-600' },
        { id: 'contact-support', label: 'Contact Support', path: '/faq/support', icon: FiMail, color: 'text-green-600' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FiPieChart,
      path: '/reports',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      pinned: true
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: FiSettings,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      pinned: true,
      children: [
        { id: 'absenteeism-status', label: 'Absenteeism Statuses', path: '/setup/absenteeism-status', icon: FiAlertCircle, color: 'text-orange-600' },
        { id: 'absenteeism-type', label: 'Absenteeism Types', path: '/setup/absenteeism-type', icon: FiActivity, color: 'text-red-600' },
        { id: 'approval-status-type', label: 'Approval Status Types', path: '/setup/approval-status-type', icon: FiCheckCircle, color: 'text-green-600' },
        { id: 'availability-status-type', label: 'Availability Status Types', path: '/setup/availability-status-type', icon: FiCircle, color: 'text-blue-600' },
        { id: 'class', label: 'Classes', path: '/setup/class', icon: FiBookOpen, color: 'text-purple-600' },
        { id: 'combination', label: 'Combinations', path: '/setup/combination', icon: FiLayers, color: 'text-pink-600' },
        { id: 'completion-status', label: 'Completion Statuses', path: '/setup/completion-status', icon: FiTarget, color: 'text-teal-600' },
        { id: 'document-type', label: 'Document Types', path: '/setup/document-type', icon: FiFile, color: 'text-cyan-600' },
        { id: 'dropout-reason', label: 'Dropout Reasons', path: '/setup/dropout-reason', icon: FiAlertCircle, color: 'text-red-500' },
        { id: 'education-level', label: 'Education Levels', path: '/setup/education-level', icon: FiAward, color: 'text-yellow-600' },
        { id: 'facility-type', label: 'Facility Types', path: '/setup/facility-type', icon: FiHome, color: 'text-blue-500' },
        { id: 'funding-source', label: 'Funding Sources', path: '/setup/funding-source', icon: FiDollarSign, color: 'text-green-600' },
        { id: 'gender', label: 'Genders', path: '/setup/gender', icon: FiUsers, color: 'text-purple-500' },
        { id: 'level', label: 'Levels', path: '/setup/level', icon: FiBarChart2, color: 'text-blue-600' },
        { id: 'level-category', label: 'Level Categories', path: '/setup/level-category', icon: FiLayers, color: 'text-indigo-500' },
        { id: 'occupation-type', label: 'Occupation Types', path: '/setup/occupation-type', icon: FiBriefcase, color: 'text-gray-600' },
        { id: 'ownership-type', label: 'Ownership Types', path: '/setup/ownership-type', icon: FiAnchor, color: 'text-blue-700' },
        { id: 'name-prefix', label: 'Name Prefixes', path: '/setup/name-prefix', icon: FiUser, color: 'text-slate-600' },
        { id: 'profession', label: 'Professions', path: '/setup/profession', icon: FiBriefcase, color: 'text-emerald-600' },
        { id: 'responsibility', label: 'Responsibilities', path: '/setup/responsibility', icon: FiCheckCircle, color: 'text-violet-600' },
        { id: 'resource-type', label: 'Resource Types', path: '/setup/resource-type', icon: FiBox, color: 'text-amber-600' },
        { id: 'review-score', label: 'Review Scores', path: '/setup/review-score', icon: FiStar, color: 'text-yellow-500' },
        { id: 'salary-scale', label: 'Salary Scales', path: '/setup/salary-scale', icon: FiDollarSign, color: 'text-green-700' },
        { id: 'school-specialization', label: 'School Specializations', path: '/schools/specialization', icon: FiTarget, color: 'text-purple-600' },
        { id: 'staff-type', label: 'Staff Types', path: '/setup/staff-type', icon: FiUsers, color: 'text-blue-500' },
        { id: 'special-need-type', label: 'Special Need Types', path: '/setup/special-need-type', icon: FiHelpCircle, color: 'text-orange-600' },
        { id: 'ssv-initiator', label: 'SSV Initiators', path: '/setup/ssv-initiator', icon: FiUser, color: 'text-violet-600' },
        { id: 'ssv-type', label: 'SSV Types', path: '/setup/ssv-type', icon: FiFileText, color: 'text-slate-600' },
        { id: 'subject-category', label: 'Subject Categories', path: '/setup/subject-category', icon: FiBookOpen, color: 'text-indigo-600' },
        { id: 'subject', label: 'Subjects', path: '/setup/subject', icon: FiBook, color: 'text-blue-600' },
        { id: 'years', label: 'Years', path: '/setup/years', icon: FiCalendar, color: 'text-purple-600' }
      ]
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Auto-expand the menu containing the active route
  useEffect(() => {
    const findActiveMenu = () => {
      for (const item of menuItems) {
        if (item.children) {
          for (const child of item.children) {
            if (child.path === location.pathname) {
              return item.id;
            }
          }
        }
      }
      return null;
    };

    const activeMenuId = findActiveMenu();
    if (activeMenuId) {
      setExpandedMenus([activeMenuId]);
    }
  }, [location.pathname]);

  const renderMenuItem = (item, level = 0, isLastChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = isActive(item.path);

    if (hasChildren) {
      return (
        <li key={item.id} className={level === 0 ? 'mb-1' : ''}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group
              ${active 
                ? level === 0
                  ? `${item.bgColor} ${item.color} font-medium`
                  : 'bg-primary-500 text-white font-medium shadow-sm'
                : level === 0
                  ? 'text-gray-700 hover:bg-primary-100'
                  : 'text-gray-700 hover:bg-primary-200 hover:text-primary-800'
              }
              ${isCollapsed && level === 0 ? 'justify-center' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {level === 0 && item.icon && (
                <div className={`p-2 rounded-lg ${active ? item.bgColor : item.bgColor}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
              )}
              {!isCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <FiChevronDown className="w-4 h-4" />
              </div>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <ul className="ml-8 mt-1 space-y-1 pl-3">
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
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
            ${active 
              ? level === 0 
                ? `${item.bgColor} ${item.color} font-medium shadow-sm`
                : 'bg-primary-500 text-white font-medium shadow-sm'
              : level === 0
                ? 'text-gray-700 hover:bg-primary-100'
                : 'text-gray-600 hover:bg-primary-200 hover:text-primary-800'
            }
            ${isCollapsed && level === 0 ? 'justify-center' : ''}
            ${level > 0 ? 'px-3 py-2' : ''}
          `}
        >
          {level === 0 && item.icon && (
            <div className={`p-2 rounded-lg ${active ? item.bgColor : item.bgColor} group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          )}
          {item.icon && level > 0 && (
            <item.icon className={`w-4 h-4 ${active ? 'text-white' : item.color || 'text-gray-500'} group-hover:scale-110 transition-transform`} />
          )}
          {!isCollapsed && (
            <span className="text-sm">{item.label}</span>
          )}
          {item.pinned && !isCollapsed && (
            <FiStar className="w-3 h-3 ml-auto text-warning-500" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <img 
                    src={coartOfArms} 
                    alt="Coat of Arms" 
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">
                      SQAS
                    </h1>
                    <p className="text-xs text-gray-500">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <FiMenu className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full flex justify-center"
                aria-label="Expand sidebar"
              >
                <img 
                  src={coartOfArms} 
                  alt="Coat of Arms" 
                  className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
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
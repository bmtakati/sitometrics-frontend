import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical, FiX, FiEye, FiEdit2, FiTrash2, FiRotateCcw, FiSlash, FiZapOff } from 'react-icons/fi';

const ActionMenu = ({ actions = [], item, disabled = false }) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [darkMode, setDarkMode]       = useState(() => localStorage.getItem('darkMode') === 'true');
  const menuRef    = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleDarkModeChange = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  const computePosition = () => {
    if (!menuRef.current) return;
    const btnRect  = menuRef.current.getBoundingClientRect();
    const vw       = window.innerWidth;
    const vh       = window.innerHeight;
    const menuW    = 208;
    const gap      = 8;
    const estH     = dropdownRef.current?.offsetHeight || 160;
    const up       = btnRect.bottom + estH + gap > vh;
    setOpenUpwards(up);
    const idealLeft   = btnRect.right - menuW;
    const clampedLeft = Math.max(gap, Math.min(idealLeft, vw - menuW - gap));
    const top         = up ? btnRect.top - gap - estH : btnRect.bottom + gap;
    setMenuPosition({ left: clampedLeft, top: Math.max(gap, top) });
  };

  const toggleMenu = () => {
    if (disabled) return;
    if (!isOpen) { computePosition(); setIsOpen(true); }
    else setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [isOpen]);

  useLayoutEffect(() => { if (isOpen) computePosition(); }, [isOpen, actions.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      const inTrigger  = menuRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const getDefaultIcon = (type) => {
    switch (type) {
      case 'view':     return FiEye;
      case 'edit':     return FiEdit2;
      case 'delete':   return FiTrash2;
      case 'restore':  return FiRotateCcw;
      case 'suspend':  return FiSlash;
      case 'activate': return FiZapOff;
      default:         return FiEye;
    }
  };

  const getActionStyle = (type) => {
    const styles = {
      view:     { iconColor: darkMode ? 'text-blue-400'    : 'text-blue-600',    row: darkMode ? 'text-gray-200 hover:bg-blue-900/50'    : 'text-gray-700 hover:bg-blue-50'    },
      edit:     { iconColor: darkMode ? 'text-emerald-400' : 'text-emerald-600', row: darkMode ? 'text-gray-200 hover:bg-emerald-900/50' : 'text-gray-700 hover:bg-emerald-50' },
      restore:  { iconColor: darkMode ? 'text-amber-400'   : 'text-amber-600',   row: darkMode ? 'text-gray-200 hover:bg-amber-900/50'   : 'text-gray-700 hover:bg-amber-50'   },
      suspend:  { iconColor: darkMode ? 'text-orange-400'  : 'text-orange-600',  row: darkMode ? 'text-gray-200 hover:bg-orange-900/50'  : 'text-gray-700 hover:bg-orange-50'  },
      activate: { iconColor: darkMode ? 'text-green-400'   : 'text-green-600',   row: darkMode ? 'text-gray-200 hover:bg-green-900/50'   : 'text-gray-700 hover:bg-green-50'   },
      delete:   { iconColor: darkMode ? 'text-red-400'     : 'text-red-600',     row: darkMode ? 'text-red-400   hover:bg-red-900/30'     : 'text-red-600  hover:bg-red-50'     },
    };
    return styles[type] ?? {
      iconColor: darkMode ? 'text-gray-400' : 'text-gray-500',
      row: darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50',
    };
  };

  const visibleActions  = actions.filter((a) => !a.visible || a.visible(item));
  const mainActions     = visibleActions.filter((a) => a.type !== 'delete');
  const dangerActions   = visibleActions.filter((a) => a.type === 'delete');

  const renderItem = (action, idx) => {
    const Icon  = action.icon || getDefaultIcon(action.type);
    const style = getActionStyle(action.type);
    return (
      <button
        key={idx}
        onClick={() => { setIsOpen(false); action.onClick(item); }}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${style.row}`}
      >
        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
          <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
        </span>
        <span>{action.label}</span>
      </button>
    );
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* ── Trigger ── */}
      <button
        onClick={toggleMenu}
        disabled={disabled}
        title="Actions"
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-lg
          border transition-all duration-150 select-none
          ${isOpen
            ? darkMode
              ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300'
              : 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : darkMode
              ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50'
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      {/* ── Dropdown — rendered via portal to escape table stacking contexts ── */}
      {isOpen && createPortal(
        <div className="fixed z-[99999]" style={menuPosition}>
          {/* Arrow — inner fill */}
          <div
            className={`absolute right-5 w-0 h-0 z-20 ${openUpwards ? 'bottom-0 mb-[-7px]' : 'top-0 mt-[-7px]'}`}
            style={{
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              [openUpwards ? 'borderTop' : 'borderBottom']: darkMode ? '7px solid #111827' : '7px solid #ffffff',
            }}
          />
          {/* Arrow — border layer */}
          <div
            className={`absolute right-[19px] w-0 h-0 z-10 ${openUpwards ? 'bottom-0 mb-[-8px]' : 'top-0 mt-[-8px]'}`}
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              [openUpwards ? 'borderTop' : 'borderBottom']: darkMode ? '8px solid #374151' : '8px solid #e5e7eb',
            }}
          />

          <div
            ref={dropdownRef}
            className={`w-52 rounded-xl shadow-2xl border overflow-hidden
              ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
            `}
          >
            {/* Header with close button */}
            <div className={`flex items-center justify-between px-2.5 py-1.5 border-b ${darkMode ? 'border-gray-700/80' : 'border-gray-100'}`}>
              <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Actions
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main actions */}
            {mainActions.length > 0 && (
              <div className="p-1.5 space-y-0.5">
                {mainActions.map(renderItem)}
              </div>
            )}

            {/* Danger zone — separated by divider */}
            {dangerActions.length > 0 && (
              <>
                {mainActions.length > 0 && (
                  <div className={`mx-2 border-t ${darkMode ? 'border-gray-700/80' : 'border-gray-100'}`} />
                )}
                <div className="p-1.5 space-y-0.5">
                  {dangerActions.map(renderItem)}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActionMenu;

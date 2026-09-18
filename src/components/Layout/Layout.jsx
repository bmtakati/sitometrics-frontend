import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import InactivityTimeout from '../InactivityTimeout/InactivityTimeout';
import Breadcrumb from '../Breadcrumb';
import { useThemePreference } from '../../hooks/useThemePreference';
import { getPosMode, subscribePosMode, usePosMode } from '../../context/PosModeContext';
import { useAuth } from '../../context/AuthContext';
import { userRequiresPosMode } from '../../utils/posMode';
import PosLogoutConfirm from '../service/PosLogoutConfirm';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { darkMode } = useThemePreference();
  const location = useLocation();
  const { setPosMode } = usePosMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const posMode = useSyncExternalStore(subscribePosMode, getPosMode, () => false);
  const rolePos = userRequiresPosMode(user);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (rolePos && !getPosMode()) {
      setPosMode(true);
    }
  }, [rolePos, setPosMode]);

  useEffect(() => {
    if (!location.pathname.includes('/service/waiter-orders') && getPosMode() && !rolePos) {
      setPosMode(false);
    }
  }, [location.pathname, setPosMode, rolePos]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Keep <Outlet /> in the same place so POS mode does not remount the page
  // and replay catalog requests.
  return (
    <div className={`flex h-[100dvh] min-w-0 ${darkMode ? 'bg-gray-950' : 'bg-white'} overflow-hidden`}>
      {!posMode ? (
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={toggleSidebar}
        />
      ) : null}

      <div
        className={`app-main-offset min-w-0 flex-1 flex flex-col overflow-hidden ${
          posMode ? 'ml-0' : sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {!posMode ? <Header onMenuClick={toggleSidebar} /> : (
          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-red-600 px-5 text-lg font-semibold text-white"
            >
              <FiLogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        )}
        <PosLogoutConfirm
          open={posMode && confirmLogout}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            setConfirmLogout(false);
            setPosMode(false);
            logout();
            navigate('/');
          }}
        />

        <main
          className={`flex-1 overflow-y-auto overscroll-contain ${
            darkMode ? 'bg-gray-950' : 'bg-white'
          } ${posMode ? 'p-0' : 'px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4'}`}
        >
          <div className={`mx-auto w-full min-w-0 ${posMode ? 'h-full max-w-none' : 'max-w-[1600px]'}`}>
            {!posMode ? <Breadcrumb /> : null}
            <Outlet />
          </div>
        </main>
      </div>

      {!posMode && sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? (
        <div
          data-app-sidebar-backdrop="true"
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <InactivityTimeout />
    </div>
  );
};

export default Layout;

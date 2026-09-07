import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import InactivityTimeout from '../InactivityTimeout/InactivityTimeout';
import Breadcrumb from '../Breadcrumb';
import { useThemePreference } from '../../hooks/useThemePreference';
import { usePosMode } from '../../context/PosModeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { darkMode } = useThemePreference();
  const { posMode } = usePosMode();

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  if (posMode) {
    return (
      <div className={`h-[100dvh] min-w-0 overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
        <main className="h-full overflow-hidden">
          <Outlet />
        </main>
        <InactivityTimeout />
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] min-w-0 ${darkMode ? 'bg-gray-950' : 'bg-white'} overflow-hidden`}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={toggleSidebar}
      />

      <div
        className={`min-w-0 flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        <Header onMenuClick={toggleSidebar} />

        <main
          className={`flex-1 overflow-y-auto overscroll-contain ${
            darkMode ? 'bg-gray-950' : 'bg-white'
          } px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4`}
        >
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>

      {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <InactivityTimeout />
    </div>
  );
};

export default Layout;

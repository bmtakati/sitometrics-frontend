import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import InactivityTimeout from '../InactivityTimeout/InactivityTimeout';
import Breadcrumb from '../Breadcrumb';
import { useThemePreference } from '../../hooks/useThemePreference';

const Layout = () => {
  // Desktop: sidebar visible by default. Mobile: hidden until user opens via header menu.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { darkMode } = useThemePreference();

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className={`flex h-[100dvh] min-w-0 ${darkMode ? 'bg-gray-950' : 'bg-white'} overflow-hidden`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className={`min-w-0 flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto overscroll-contain ${darkMode ? 'bg-gray-950' : 'bg-white'} px-3 py-4 sm:px-5 lg:p-6`}>
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Inactivity Timeout Modal */}
      <InactivityTimeout />
    </div>
  );
};

export default Layout;

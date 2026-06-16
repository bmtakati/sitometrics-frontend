import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import InactivityTimeout from '../InactivityTimeout/InactivityTimeout';

const Layout = () => {
  // Desktop: sidebar visible by default. Mobile: hidden until user opens via header menu.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Sync dark mode from localStorage and custom events
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    
    // Listen to storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    // Listen to custom event (from same tab/window)
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    // Check on mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-950' : 'bg-white'} overflow-hidden`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-950' : 'bg-white'} p-6`}>
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Inactivity Timeout Modal */}
      <InactivityTimeout />
    </div>
  );
};

export default Layout;

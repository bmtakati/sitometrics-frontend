import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavIconDropdown, {
  THEME_OPTIONS_WITH_ICONS,
  FONT_SIZE_OPTIONS_WITH_ICONS,
} from '../NavIconDropdown';
import HeaderAccentBar from '../HeaderAccentBar';
import { useThemePreference } from '../../hooks/useThemePreference';
import { useFontSizePreference } from '../../hooks/useFontSizePreference';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { 
  FiMenu, 
  FiBell, 
  FiMail, 
  FiMaximize,
  FiUser,
  FiSettings,
  FiLogOut,
  FiBookmark,
  FiX
} from 'react-icons/fi';

const SHOW_LOGOUT_MODAL = import.meta.env.VITE_SHOW_LOGOUT_MODAL === 'true';

// Logout Modal Configuration
const LOGOUT_MODAL_TITLE = import.meta.env.VITE_LOGOUT_MODAL_TITLE || 'Sign Out';
const LOGOUT_MODAL_MESSAGE = import.meta.env.VITE_LOGOUT_MODAL_MESSAGE || 'Are you sure you want to sign out of your account?';
const LOGOUT_CANCEL_BUTTON_TEXT = import.meta.env.VITE_LOGOUT_CANCEL_BUTTON_TEXT || 'Cancel';
const LOGOUT_CONFIRM_BUTTON_TEXT = import.meta.env.VITE_LOGOUT_CONFIRM_BUTTON_TEXT || 'Sign Out';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themePreference, setThemePreference, darkMode } = useThemePreference();
  const { fontSizePreference, setFontSizePreference } = useFontSizePreference();
  const { language, setLanguage, languageOptions } = useLanguagePreference();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  const notifications = [
    {
      id: 1,
      icon: '💰',
      title: 'Daily offer added',
      message: 'User-only offer added',
      color: 'bg-primary-100 text-primary-600',
      time: '2 hours'
    },
    {
      id: 2,
      icon: '🛡️',
      title: 'Product Review',
      message: 'Changed to a workflow',
      color: 'bg-secondary-100 text-secondary-600',
      time: '3 hours'
    },
    {
      id: 3,
      icon: '📊',
      title: 'Return Products',
      message: '52 items were returned',
      color: 'bg-warning-100 text-warning-600',
      time: '5 hours'
    }
  ];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleLogout = () => {
    if (SHOW_LOGOUT_MODAL) {
      setShowProfile(false);
      setShowLogoutModal(true);
    } else {
      logout();
      navigate('/landing');
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/landing');
  };

  const fullName = user
    ? [user.person?.first_name, user.person?.last_name].filter(Boolean).join(' ') || user.name || 'User'
    : 'User';

  const primaryRole = user?.role_names?.[0]
    ?? user?.roles?.[0]?.name
    ?? user?.role
    ?? 'User';

  const scopeLabel = user?.scope ?? 'HQ';

  return (
    <>
    <header className={`sticky top-0 z-30 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-slate-50 border-slate-200'} border-b shadow-sm transition-colors duration-200`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-2">
        {/* Left Section: mobile menu + title */}
        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className={`lg:hidden flex-shrink-0 p-2.5 -ml-1 rounded-lg ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              } transition-colors`}
              aria-label="Open navigation menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <h2 className={`text-base sm:text-xl font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {import.meta.env.VITE_APP_NAME || 'SITOMETRICS'}
            </h2>
            <p className={`text-xs sm:text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {scopeLabel} | {primaryRole}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="nav-preferences flex items-center gap-1 sm:gap-2">
          <NavIconDropdown
            id="header-theme"
            value={themePreference}
            onChange={setThemePreference}
            options={THEME_OPTIONS_WITH_ICONS}
            darkMode={darkMode}
            ariaLabel="Theme"
            className="theme-selector"
          />
          <NavIconDropdown
            id="header-font-size"
            value={fontSizePreference}
            onChange={setFontSizePreference}
            options={FONT_SIZE_OPTIONS_WITH_ICONS}
            darkMode={darkMode}
            ariaLabel="Text size"
            className="font-size-selector"
          />
          <NavIconDropdown
            id="header-language"
            value={language}
            onChange={setLanguage}
            options={languageOptions}
            darkMode={darkMode}
            ariaLabel="Language"
            showCodeInTrigger
            className="language-selector"
          />

          {/* Fullscreen */}
          <button
            onClick={toggleFullScreen}
            className={`p-2 mx-1 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors hidden lg:block`}
            aria-label="Toggle fullscreen"
          >
            <FiMaximize className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>

          {/* Bookmarks */}
          <button className={`p-2 mx-1 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors hidden lg:block`}>
            <FiBookmark className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className={`p-2 mx-1 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors relative`}
              aria-label="Notifications"
            >
              <FiBell className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs flex items-center justify-center rounded-full">
                {notifications.length}
              </span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-dropdown border py-2 fade-in`}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors border-b ${darkMode ? 'border-gray-700' : 'border-gray-50'} last:border-0`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${notif.color} text-xl`}>
                          {notif.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} text-sm`}>{notif.title}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{notif.message}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{notif.time} ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className={`text-sm ${darkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'} font-medium`}>
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className={`flex items-center gap-2 p-1 pl-3 mx-1 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <div className="text-right hidden lg:block">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fullName}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{primaryRole} &ndash; {scopeLabel}</p>
              </div>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold ring-2 ${darkMode ? 'ring-gray-700' : 'ring-gray-200'}`}>
                {fullName.charAt(0).toUpperCase()}
              </div>
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-dropdown border py-2 fade-in`}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fullName}</p>
                  <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{primaryRole} &ndash; {scopeLabel}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>{user?.email || ''}</p>
                </div>
                <div className="py-2">
                  <Link 
                    to="/profile" 
                    onClick={() => setShowProfile(false)}
                    className={`w-full px-4 py-2 text-left ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-3`}
                  >
                    <FiUser className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </Link>
                  <button className={`w-full px-4 py-2 text-left ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-3`}>
                    <FiMail className="w-4 h-4" />
                    <span className="text-sm">Inbox</span>
                  </button>
                  <button className={`w-full px-4 py-2 text-left ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'} transition-colors flex items-center gap-3`}>
                    <FiSettings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} pt-2`}>
                  <button 
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 text-left ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors flex items-center gap-3 text-danger-600`}
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
      <HeaderAccentBar />
    </header>

    {/* Logout Confirmation Modal */}
    {showLogoutModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        />
        {/* Modal */}
        <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scale-up`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <FiLogOut className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{LOGOUT_MODAL_TITLE}</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 text-sm`}>{LOGOUT_MODAL_MESSAGE}</p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} font-medium transition-colors`}
              >
                {LOGOUT_CANCEL_BUTTON_TEXT}
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                {LOGOUT_CONFIRM_BUTTON_TEXT}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;

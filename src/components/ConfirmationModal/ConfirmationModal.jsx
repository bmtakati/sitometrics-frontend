import React, { useState, useEffect } from 'react';
import { FiTrash2, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger', // danger, warning, success, info
  itemName = '' // The item name to be highlighted in quotes
}) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handle = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChanged', handle);
    return () => window.removeEventListener('darkModeChanged', handle);
  }, []);

  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'danger':
        return <FiTrash2 className="w-6 h-6 text-white" />;
      case 'warning':
        return <FiAlertCircle className="w-6 h-6 text-white" />;
      case 'success':
        return <FiCheckCircle className="w-6 h-6 text-white" />;
      case 'info':
        return <FiInfo className="w-6 h-6 text-white" />;
      default:
        return <FiTrash2 className="w-6 h-6 text-white" />;
    }
  };

  const getIconBgColor = () => {
    switch(type) {
      case 'danger':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'success':
        return 'bg-green-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-red-100';
    }
  };

  const getIconColor = () => {
    switch(type) {
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-red-500';
    }
  };

  const getConfirmButtonColor = () => {
    switch(type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  const formatMessage = (msg, item) => {
    if (!item) return msg;
    
    const parts = msg.split('"');
    return (
      <span>
        {parts.map((part, index) => 
          index === 1 ? <span key={index} className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>"{item}"</span> : part
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal */}
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
          {/* Header */}
          <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-stone-300'} overflow-hidden border-b flex items-center gap-3 px-6 py-4`}>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
            <div className={`ml-3 ${getIconBgColor()} rounded-full p-2 flex-shrink-0`}>
              <div className={`${getIconColor()} rounded-full p-2`}>
                {getIcon()}
              </div>
            </div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
          </div>
          {/* Body */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} px-8 pt-6 pb-6`}>
            {/* Message */}
            <div className="text-center mb-6">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                {formatMessage(message, itemName)}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-8 py-2.5 border rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-8 py-2.5 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColor()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

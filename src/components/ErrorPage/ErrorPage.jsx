import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * Reusable Error Page Component
 * 
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {function} onRetry - Retry callback function
 * @param {string} icon - Custom icon component (optional)
 * @param {boolean} fullScreen - Whether to take full screen (default: true)
 */
const ErrorPage = ({ 
  title = 'Error Loading Data', 
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  icon: Icon = FiAlertCircle,
  fullScreen = true
}) => {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center' 
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center max-w-md mx-auto px-4">
        <Icon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;

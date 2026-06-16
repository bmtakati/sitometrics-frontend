import React from 'react';
import { FiAlertCircle, FiBell } from 'react-icons/fi';
import useDarkMode from '../../hooks/useDarkMode';

const SystemAlerts = () => {
  const darkMode = useDarkMode();
  const alerts = [
    {
      id: 1,
      severity: 'critical',
      title: 'Database Connection Issues',
      message: 'Intermittent database connection issues detected',
      timestamp: '2026-03-15T10:30:00',
      status: 'Active'
    },
    {
      id: 2,
      severity: 'warning',
      title: 'High Memory Usage',
      message: 'System memory usage is above 85%',
      timestamp: '2026-03-15T09:15:00',
      status: 'Monitoring'
    },
    {
      id: 3,
      severity: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for March 20, 2026',
      timestamp: '2026-03-14T16:45:00',
      status: 'Scheduled'
    }
  ];

  const getSeverityColor = (severity) => {
    if (darkMode) {
      switch(severity) {
        case 'critical': return 'bg-red-900/40 border-red-500 text-red-200';
        case 'warning':  return 'bg-yellow-900/40 border-yellow-500 text-yellow-200';
        default:         return 'bg-blue-900/40 border-blue-500 text-blue-200';
      }
    }
    switch(severity) {
      case 'critical': return 'bg-red-50 border-red-500 text-red-900';
      case 'warning':  return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      default:         return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiAlertCircle className="w-6 h-6 text-white" />
          </div>
          System Alerts
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Monitor critical system notifications and alerts</p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl shadow-sm border-l-4 p-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{alert.title}</h3>
                <p className="text-sm mb-2">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className={`px-2 py-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded uppercase`}>{alert.severity}</span>
                  <span>Status: {alert.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemAlerts;

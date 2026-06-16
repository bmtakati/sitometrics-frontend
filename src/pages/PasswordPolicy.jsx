import React, { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiClock,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import { API_BASE_URL, useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import useDarkMode from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import AccessDeniedState from '../components/AccessDeniedState';
import apiFetch from '../utils/apiFetch';
import { showErrorDialog, showSuccessToast } from '../utils/dialogUtils';

const DEFAULT_POLICY = {
  password_history_enabled: true,
  max_failed_login_attempts: 5,
  password_change_interval_days: 90,
  password_reuse_interval_days: 30,
};

const Switch = ({ checked, onChange, disabled = false, darkMode = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked ? 'bg-primary-600' : (darkMode ? 'bg-gray-600' : 'bg-gray-300')}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
};

const PasswordPolicy = () => {
  const { user } = useAuth();
  const canView = hasPermission(user, 'view-password-policy');
  const canSavePolicy = hasPermission(user, 'save-password-policy');
  const canEnablePasswordHistory = hasPermission(user, 'enable-password-history');

  const darkMode = useDarkMode();
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPasswordHistory, setTogglingPasswordHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`${API_BASE_URL}/api/password-policy`);
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Failed to load password policy.');
        }

        setPolicy({ ...DEFAULT_POLICY, ...(json.data || {}) });
      } catch (err) {
        setError(err.message || 'Failed to load password policy.');
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  const handlePolicyChange = (field, value) => {
    setPolicy((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!canSavePolicy) {
      setError('You do not have permission to save password policy settings.');
      return;
    }
    try {
      setSaving(true);
      setError('');

      const response = await apiFetch(`${API_BASE_URL}/api/password-policy`, {
        method: 'PUT',
        body: JSON.stringify({
          max_failed_login_attempts: Number(policy.max_failed_login_attempts),
          password_change_interval_days: Number(policy.password_change_interval_days),
          password_reuse_interval_days: Number(policy.password_reuse_interval_days),
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to save password policy.');
      }

      setPolicy({ ...DEFAULT_POLICY, ...(json.data || {}) });
      showSuccessToast('Password policy updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to save password policy.');
      showErrorDialog(err.message || 'Failed to save password policy.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordHistoryToggle = async (checked) => {
    if (!canEnablePasswordHistory) {
      setError('You do not have permission to enable password history.');
      return;
    }

    try {
      setTogglingPasswordHistory(true);
      setError('');

      const response = await apiFetch(`${API_BASE_URL}/api/password-policy/password-history-enabled`, {
        method: 'PUT',
        body: JSON.stringify({ password_history_enabled: checked }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to update password history setting.');
      }

      setPolicy((current) => ({
        ...current,
        password_history_enabled: checked,
      }));
      showSuccessToast('Password history setting updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update password history setting.');
      showErrorDialog(err.message || 'Failed to update password history setting.');
    } finally {
      setTogglingPasswordHistory(false);
    }
  };

  if (!canView) {
    return <AccessDeniedState message="You do not have permission to view password policy." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={FiLock}
        title="Password Policy"
        subtitle="Configure password security rules that govern password reuse, rotation, and account suspension."
        actions={[]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Password History',
            value: policy.password_history_enabled ? 'Enabled' : 'Disabled',
            icon: FiShield,
            iconColor: 'blue-600'
          },
          {
            label: 'Attempts Limit',
            value: policy.max_failed_login_attempts,
            icon: FiAlertCircle,
            iconColor: 'red-600'
          },
          {
            label: 'Change Window',
            value: `${policy.password_change_interval_days} days`,
            icon: FiClock,
            iconColor: 'amber-600'
          },
          {
            label: 'Reuse Window',
            value: `${policy.password_reuse_interval_days} days`,
            icon: FiLock,
            iconColor: 'emerald-600'
          },
        ].map(({ label, value, icon: Icon, iconColor }) => (
          <div key={label} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <Icon className={`w-8 h-8 text-${iconColor}`} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <FiAlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
          </div>
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <FiShield className="w-5 h-5 text-primary-600" />
              Security Policy Configuration
            </h2>
            {canSavePolicy && (
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Policy'}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enable Password History</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  When enabled, users cannot reuse a password during the configured reuse window.
                </p>
              </div>
              <div className="flex-shrink-0">
                {canEnablePasswordHistory && (
                  <Switch
                    checked={policy.password_history_enabled}
                    onChange={handlePasswordHistoryToggle}
                    disabled={togglingPasswordHistory}
                    darkMode={darkMode}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="20"
                  disabled={!canSavePolicy}
                  value={policy.max_failed_login_attempts}
                  onChange={(event) => handlePolicyChange('max_failed_login_attempts', event.target.value)}
                  placeholder=" "
                  className={`peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
                    darkMode
                      ? 'border-gray-600 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
                <label
                  className={
                    darkMode
                      ? 'absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-400 peer-focus:bg-gray-900'
                      : 'absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:bg-white'
                  }
                >
                  Failed Login Attempts
                </label>
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Attempts before account suspension</p>
            </div>

            <div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  disabled={!canSavePolicy}
                  value={policy.password_change_interval_days}
                  onChange={(event) => handlePolicyChange('password_change_interval_days', event.target.value)}
                  placeholder=" "
                  className={`peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
                    darkMode
                      ? 'border-gray-600 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
                <label
                  className={
                    darkMode
                      ? 'absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-400 peer-focus:bg-gray-900'
                      : 'absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:bg-white'
                  }
                >
                  Password Change Window
                </label>
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Days before password rotation is required</p>
            </div>

            <div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  disabled={!canSavePolicy}
                  value={policy.password_reuse_interval_days}
                  onChange={(event) => handlePolicyChange('password_reuse_interval_days', event.target.value)}
                  placeholder=" "
                  className={`peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
                    darkMode
                      ? 'border-gray-600 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
                <label
                  className={
                    darkMode
                      ? 'absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-400 peer-focus:bg-gray-900'
                      : 'absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:bg-white'
                  }
                >
                  Password Reuse Window
                </label>
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Days before previous passwords can be reused</p>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'} rounded-xl shadow-sm border p-4 flex gap-3`}>
            <FiTrendingUp className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`} />
            <div>
              <p className={`font-semibold text-sm ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Policy Impact</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-blue-100/90' : 'text-blue-800'}`}>
                Users will be automatically suspended after exceeding the failed-attempt threshold, required to change passwords when the rotation window expires, and prevented from reusing recent passwords within the configured window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPolicy;
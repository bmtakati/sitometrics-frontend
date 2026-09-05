import React, { useEffect, useState } from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiShield,
} from 'react-icons/fi';
import { API_BASE_URL, useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import useDarkMode from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import { StatsCards } from '../components/StatsCard';
import AccessDeniedState from '../components/AccessDeniedState';
import apiFetch from '../utils/apiFetch';
import { showErrorDialog, showSuccessToast } from '../utils/dialogUtils';

const DEFAULT_POLICY = {
  password_history_enabled: true,
  max_failed_login_attempts: 5,
  password_change_interval_days: 90,
  password_reuse_interval_days: 30,
};

const requirements = [
  'Minimum length: 8 characters',
  'At least one uppercase letter (A-Z)',
  'At least one lowercase letter (a-z)',
  'At least one number (0-9)',
  'At least one special character',
];

const Switch = ({ checked, onChange, disabled = false, darkMode = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
      checked ? 'bg-emerald-600' : (darkMode ? 'bg-gray-600' : 'bg-stone-300')
    } ${darkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'} ${
      disabled ? 'cursor-not-allowed opacity-50' : ''
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const PolicyNumberField = ({
  label,
  helper,
  value,
  onChange,
  disabled,
  min,
  max,
  darkMode,
}) => (
  <div className="min-w-0">
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        placeholder=" "
        onChange={(event) => onChange?.(event.target.value)}
        className={`peer w-full rounded-lg border px-3 pb-2.5 pt-5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70 ${
          darkMode
            ? 'border-stone-700 bg-stone-800 text-white'
            : 'border-stone-300 bg-white text-slate-950'
        }`}
      />
      <label
        className={`pointer-events-none absolute left-3 top-2 text-xs font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-600 ${
          darkMode ? 'text-gray-400 peer-placeholder-shown:text-gray-500' : 'text-slate-500 peer-placeholder-shown:text-slate-500'
        }`}
      >
        {label}
      </label>
    </div>
    <p className={`mt-2 text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{helper}</p>
  </div>
);

const PolicyStaticField = ({ label, value, helper, darkMode }) => (
  <div className="min-w-0">
    <div className="relative">
      <div
        className={`rounded-lg border px-3 pb-2.5 pt-5 text-sm font-medium ${
          darkMode
            ? 'border-stone-700 bg-stone-800 text-gray-200'
            : 'border-stone-300 bg-stone-50 text-slate-800'
        }`}
      >
        {value}
      </div>
      <span className={`pointer-events-none absolute left-3 top-2 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
    <p className={`mt-2 text-xs leading-5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{helper}</p>
  </div>
);

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

  const cardClass = darkMode
    ? 'border-stone-700/80 bg-stone-900/70 shadow-black/20'
    : 'border-stone-200/90 bg-white shadow-stone-200/70';

  const impactCardClass = darkMode
    ? 'border-stone-700/80 bg-stone-800/60 shadow-black/20'
    : 'border-stone-200 bg-stone-50 shadow-stone-200/70';

  const mutedText = darkMode ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <PageHeader
        icon={FiLock}
        title="Password Policy"
        subtitle="Configure password security rules that govern password reuse, rotation, and account suspension."
        actions={[]}
      />

      <StatsCards
        cards={[
          {
            label: 'Password History',
            value: policy.password_history_enabled ? 'Enabled' : 'Disabled',
            icon: FiShield,
            iconColor: 'green-600',
          },
          {
            label: 'Attempts Limit',
            value: policy.max_failed_login_attempts,
            icon: FiAlertCircle,
            iconColor: 'green-600',
          },
          {
            label: 'Change Window',
            value: `${policy.password_change_interval_days} days`,
            icon: FiClock,
            iconColor: 'green-600',
          },
          {
            label: 'Reuse Window',
            value: `${policy.password_reuse_interval_days} days`,
            icon: FiRefreshCw,
            iconColor: 'green-600',
          },
        ]}
      />

      {error && (
        <div className={`mb-6 rounded-xl border p-4 ${darkMode ? 'border-red-800/40 bg-red-950/30' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            <FiAlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${darkMode ? 'text-red-300' : 'text-red-600'}`} />
            <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`rounded-2xl border shadow-sm ${cardClass}`}>
          <div className={`border-b p-5 ${darkMode ? 'border-stone-700/80' : 'border-stone-200'}`}>
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Security Policy Configuration</h2>
              <p className={`mt-1 text-sm ${mutedText}`}>Set the rules and restrictions for password usage in your organization.</p>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <div
              className={`rounded-xl border p-4 ${
                darkMode ? 'border-stone-700/80 bg-stone-800/60' : 'border-stone-200 bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Enable Password History</h3>
                  <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                    When enabled, users cannot reuse a password during the configured reuse window.
                  </p>
                </div>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PolicyNumberField
                label="Failed Login Attempts"
                helper="Number of failed attempts before account suspension."
                value={policy.max_failed_login_attempts}
                onChange={(value) => handlePolicyChange('max_failed_login_attempts', value)}
                min="1"
                max="20"
                disabled={!canSavePolicy}
                darkMode={darkMode}
              />
              <PolicyNumberField
                label="Password Change Window (Days)"
                helper="Days before password rotation is required."
                value={policy.password_change_interval_days}
                onChange={(value) => handlePolicyChange('password_change_interval_days', value)}
                min="0"
                max="365"
                disabled={!canSavePolicy}
                darkMode={darkMode}
              />
              <PolicyNumberField
                label="Password Reuse Window (Days)"
                helper="Days before previous passwords can be reused."
                value={policy.password_reuse_interval_days}
                onChange={(value) => handlePolicyChange('password_reuse_interval_days', value)}
                min="0"
                max="365"
                disabled={!canSavePolicy}
                darkMode={darkMode}
              />
              <PolicyStaticField
                label="Account Suspension"
                value="Automatic"
                helper="Suspension is applied immediately when the failed-attempt limit is exceeded."
                darkMode={darkMode}
              />
            </div>

            {canSavePolicy && (
              <div className={`flex justify-end border-t pt-5 ${darkMode ? 'border-stone-700/80' : 'border-stone-200'}`}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className={`rounded-2xl border p-5 shadow-sm ${impactCardClass}`}>
            <div className="flex items-start gap-3">
              <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Password Requirements</h2>
                <p className={`mt-1 text-sm leading-6 ${mutedText}`}>These requirements help users create stronger passwords.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {requirements.map((requirement) => (
                <div key={requirement} className="flex items-center gap-3">
                  <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{requirement}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}>
            <div className="flex items-start gap-3">
              <FiInfo className={`mt-0.5 h-5 w-5 shrink-0 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`} />
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>Policy Impact</h2>
                <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                  Users are suspended after exceeding the failed-attempt threshold, required to rotate passwords after the change window, and prevented from reusing recent passwords within the reuse window.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default PasswordPolicy;

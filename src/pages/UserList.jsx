import React, { useState, useRef, useEffect } from 'react';
import { FiUsers, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiMail, FiPhone, FiShield, FiUser, FiEye, FiEyeOff, FiHelpCircle, FiX, FiSlash, FiZapOff, FiMapPin, FiLock } from 'react-icons/fi';
import useApiCrud from '../hooks/useApiCrud';
import CRUDPage from '../components/CRUDPage/CRUDPage';
import RolePicker from '../components/RolePicker/RolePicker';
import AreaAssignmentPicker from '../components/AreaAssignmentPicker/AreaAssignmentPicker';
import apiFetch from '../utils/apiFetch';
import { showConfirmDialog, showSuccessToast, showErrorDialog } from '../utils/dialogUtils';
import { API_BASE_URL, useAuth } from '../context/AuthContext';
import AccessDeniedState from '../components/AccessDeniedState';

/* ─────────────────────────────────────────────────────────────────────────────
   Tabbed User Form – renders inside FormModal via type:'custom'
   Two tabs: "User Info" (2-col grid) | "Roles"
───────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'info',  label: 'User Info',  icon: FiUser   },
  { key: 'roles', label: 'Roles',      icon: FiShield },
  { key: 'scope', label: 'Area Scope', icon: FiMapPin },
];

/* Field lives at module level so its identity never changes between renders */
const Field = ({ name, label, type = 'text', required, placeholder, options, colSpan = 1,
                 formData, onInputChange, errors, darkMode }) => {
  const inputCls =
    `peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
      errors[name]
        ? 'border-red-500'
        : darkMode
        ? 'border-gray-600 bg-gray-800 text-white'
        : 'border-gray-300 bg-white text-gray-900'
    }`;

  const labelCls =
    `absolute left-2 -top-2.5 px-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} text-xs font-medium ${
      darkMode ? 'text-gray-400' : 'text-gray-600'
    } transition-all pointer-events-none
    peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:${darkMode ? 'bg-gray-900' : 'bg-white'}`;

  return (
    <div className={`relative ${colSpan === 2 ? 'col-span-2' : ''}`}>
      {type === 'select' ? (
        <>
          <select
            name={name}
            value={formData[name] || ''}
            onChange={onInputChange}
            className={`${inputCls} appearance-none`}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className={`absolute left-2 -top-2.5 px-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} text-xs font-medium text-primary-600 pointer-events-none`}>
            {label}{required && ' *'}
          </label>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </>
      ) : (
        <>
          <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={onInputChange}
            placeholder=" "
            className={inputCls}
          />
          <label className={labelCls}>
            {label}{required && ' *'}
          </label>
        </>
      )}
      {errors[name] && (
        Array.isArray(errors[name])
          ? errors[name].map((msg, i) => <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>)
          : <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );
};

/* ─── Password complexity rules ──────────────────────────────────────────── */
const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',            test: (v) => v.length >= 8 },
  { id: 'upper',   label: 'Uppercase letter (A–Z)',             test: (v) => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'Lowercase letter (a–z)',             test: (v) => /[a-z]/.test(v) },
  { id: 'number',  label: 'Number (0–9)',                       test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Special character (e.g. !@#$%^&*)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_META = [
  { label: '',           color: '' },
  { label: 'Very Weak', color: 'bg-red-500',    text: 'text-red-500' },
  { label: 'Weak',      color: 'bg-orange-500', text: 'text-orange-500' },
  { label: 'Fair',      color: 'bg-yellow-500', text: 'text-yellow-600' },
  { label: 'Good',      color: 'bg-blue-500',   text: 'text-blue-600' },
  { label: 'Strong',    color: 'bg-green-500',  text: 'text-green-600' },
];

/* PasswordField – show/hide toggle, help tooltip, optional strength meter */
const PasswordField = ({ name, label, required, placeholder, showStrength = false,
                         formData, onInputChange, errors, darkMode }) => {
  const [showPwd,  setShowPwd]  = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const blurTimer = useRef(null);
  const helpRef   = useRef(null);
  const value = formData[name] || '';

  const openHelp  = () => { clearTimeout(blurTimer.current); setShowHelp(true);  };
  const scheduleClose = () => {
    blurTimer.current = setTimeout(() => setShowHelp(false), 150);
  };

  const passedCount = PASSWORD_RULES.filter((r) => r.test(value)).length;
  const sm = STRENGTH_META[passedCount] || STRENGTH_META[0];

  // Auto-close the help popover once every rule is satisfied
  useEffect(() => {
    if (passedCount === PASSWORD_RULES.length) scheduleClose();
  }, [passedCount]);

  // Scroll popover into view whenever it opens
  useEffect(() => {
    if (showHelp && helpRef.current) {
      helpRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showHelp]);

  const inputCls =
    `peer w-full pl-3 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
      errors[name]
        ? 'border-red-500'
        : darkMode
        ? 'border-gray-600 bg-gray-800 text-white'
        : 'border-gray-300 bg-white text-gray-900'
    }`;

  const labelCls =
    `absolute left-2 -top-2.5 px-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} text-xs font-medium ${
      darkMode ? 'text-gray-400' : 'text-gray-600'
    } transition-all pointer-events-none
    peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:${darkMode ? 'bg-gray-900' : 'bg-white'}`;

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={showPwd ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onInputChange}
          onFocus={openHelp}
          onBlur={scheduleClose}
          placeholder=" "
          autoComplete="new-password"
          className={inputCls}
        />
        <label className={labelCls}>{label}{required && ' *'}</label>

        {/* Right-side icon buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Help icon + popover */}
          <div className="relative">
            <button
              type="button"
              title="Password requirements"
              onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimer.current); setShowHelp((p) => !p); }}
              className={`p-1 rounded transition-colors ${
                showHelp
                  ? 'text-primary-600'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {showHelp ? <FiX className="w-4 h-4" /> : <FiHelpCircle className="w-4 h-4" />}
            </button>

            {showHelp && (
              <div
                ref={helpRef}
                onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimer.current); }}
                className={`absolute right-0 top-9 w-64 z-50 rounded-xl shadow-2xl border p-4 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-stone-100 border-stone-300'
              }`}>
                <p className={`text-xs font-bold mb-2.5 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Password requirements
                </p>
                <ul className="space-y-1.5">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = value.length > 0 && rule.test(value);
                    return (
                      <li key={rule.id} className={`flex items-center gap-2 text-xs ${
                        ok
                          ? 'text-green-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {ok
                          ? <FiCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                          : <span className={`w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 inline-block ${
                              darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`} />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Show / hide toggle */}
          <button
            type="button"
            title={showPwd ? 'Hide password' : 'Show password'}
            onClick={() => setShowPwd((p) => !p)}
            className={`p-1 rounded transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Strength meter – only on the main password field while typing */}
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= passedCount ? sm.color : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-medium ${sm.text}`}>Strength: {sm.label}</p>
        </div>
      )}

      {errors[name] && (
        Array.isArray(errors[name])
          ? errors[name].map((msg, i) => <p key={i} className="mt-1 text-sm text-red-600">{msg}</p>)
          : <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );
};

const UserFormTabs = ({ formData, onInputChange, errors, isEditing, editingId, darkMode, accountStatuses = [] }) => {
  const [activeTab, setActiveTab] = useState('info');

  /* shared props forwarded to every Field */
  const fp = { formData, onInputChange, errors, darkMode };

  // Collect errors that belong to a tab other than the active one
  const infoFields = ['first_name', 'last_name', 'middle_name', 'gender', 'email', 'phone_number', 'password', 'password_confirmation', 'status_id'];
  const crossTabErrors = Object.entries(errors).filter(([key, val]) => {
    if (!val || (Array.isArray(val) && !val.length)) return false;
    if (activeTab === 'info')   return key === 'role_ids';
    if (activeTab === 'roles' || activeTab === 'scope')  return infoFields.includes(key);
    return false;
  });

  return (
    <div>
      {/* Tab bar */}
      <div className={`flex border-b mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          const hasError =
            key === 'info'
              ? !!(errors.name || errors.email || errors.phone_number || errors.password || errors.password_confirmation || errors.status_id)
              : key === 'roles'
              ? !!(errors.role_ids)
              : false;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors relative ${
                active
                  ? 'border-primary-600 text-primary-600'
                  : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-200'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {hasError && (
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Cross-tab validation banner – shows errors that live in the OTHER tab */}
      {crossTabErrors.length > 0 && (
        <div className={`mb-4 rounded-lg border px-4 py-3 ${darkMode ? 'border-red-700 bg-red-950/40' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                Please fix the following before submitting:
              </p>
              <ul className="space-y-0.5">
                {crossTabErrors.map(([key, val]) => {
                  const messages = Array.isArray(val) ? val : [val];
                  const tabLabel = infoFields.includes(key) ? 'User Info' : 'Roles';
                  return messages.map((msg, i) => (
                    <li key={`${key}-${i}`} className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                      <span className={`font-medium underline cursor-pointer hover:opacity-80`}
                        onClick={() => setActiveTab(infoFields.includes(key) ? 'info' : 'roles')}
                      >
                        [{tabLabel} tab]
                      </span>
                      {msg}
                    </li>
                  ));
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: User Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 gap-4">
          <Field {...fp} name="first_name"  label="First Name"    type="text"  required placeholder="e.g., John" />
          <Field {...fp} name="middle_name" label="Middle Name"   type="text"           placeholder="Optional" />
          <Field {...fp} name="last_name"   label="Last Name"     type="text"  required placeholder="e.g., Doe" />
          <Field
            {...fp}
            name="gender"
            label="Gender"
            type="select"
            options={[
              { value: '',       label: '--Select--' },
              { value: 'male',   label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other',  label: 'Other' },
            ]}
          />
          <Field {...fp} name="email"        label="Email Address" type="email" required placeholder="user@sqas.moe.go.tz" />
          <Field {...fp} name="phone_number" label="Phone Number"  type="text"           placeholder="+255 712 345 678" />
          <Field
            {...fp}
            name="status_id"
            label="Status"
            type="select"
            required
            options={[
              { value: '',  label: '--Select--' },
              ...accountStatuses.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
          <div /> {/* spacer to keep grid aligned */}
          <PasswordField
            {...fp}
            name="password"
            label={isEditing ? 'New Password (leave blank to keep)' : 'Password'}
            required={!isEditing}
            placeholder={isEditing ? 'Leave blank to keep' : 'Enter password'}
            showStrength
          />
          <PasswordField
            {...fp}
            name="password_confirmation"
            label="Confirm Password"
            required={!isEditing}
            placeholder="Re-enter password"
          />
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <RolePicker
          value={formData.role_ids || []}
          onChange={(ids) => onInputChange({ target: { name: 'role_ids', value: ids } })}
          errors={errors}
        />
      )}

      {/* Tab: Area Scope */}
      {activeTab === 'scope' && (
        <AreaAssignmentPicker
          userId={isEditing ? editingId : null}
          roleIds={formData.role_ids || []}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

/**
 * Users Management
 * Follows the same pattern as Roles.jsx – uses CRUDPage + useApiCrud.
 */
const UserList = () => {
  const { user: authUser } = useAuth();
  const [accountStatuses, setAccountStatuses] = useState([]);
  const [roleFilterOptions, setRoleFilterOptions] = useState([
    { label: 'All Users',  value: 'all'       },
    { label: 'Active',     value: 'active'    },
    { label: 'Inactive',   value: 'inactive'  },
    { label: 'Suspended',  value: 'suspended' },
    { label: 'Trashed',    value: 'trashed'   },
  ]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch(`${API_BASE_URL}/api/roles/all`).then((r) => r.json()),
      apiFetch(`${API_BASE_URL}/api/status-groups/all`).then((r) => r.json()),
    ]).then(([rolesJson, groupsJson]) => {
      if (cancelled) return;

      // --- Account Statuses ---
      if (groupsJson.success && Array.isArray(groupsJson.data)) {
        const accountGroup = groupsJson.data.find(
          (g) => g.name?.toLowerCase() === 'account statuses'
        );
        setAccountStatuses(accountGroup?.statuses ?? []);
      }

      // --- Role filter options ---
      const base = [
        { label: 'All Users',  value: 'all'       },
        { label: 'Active',     value: 'active'    },
        { label: 'Inactive',   value: 'inactive'  },
        { label: 'Suspended',  value: 'suspended' },
        { label: 'Trashed',    value: 'trashed'   },
      ];
      if (rolesJson.success && Array.isArray(rolesJson.data) && rolesJson.data.length > 0) {
        const seen = new Set();
        const uniqueRoles = rolesJson.data.filter((r) => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        });
        setRoleFilterOptions([
          ...base,
          { label: '── By Role ──', value: '__sep__', disabled: true },
          ...uniqueRoles.map((r) => ({ label: r.name, value: `role:${r.id}` }))
        ]);
      } else {
        setRoleFilterOptions(base);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const crud = useApiCrud('users', {
    initialFormData: {
      first_name:            '',
      middle_name:           '',
      last_name:             '',
      gender:                '',
      email:                 '',
      phone_number:          '',
      password:              '',
      password_confirmation: '',
      status_id:             '',
      role_ids:              [],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.first_name?.trim()) errors.first_name = 'First name is required';
      if (!data.last_name?.trim())  errors.last_name  = 'Last name is required';
      if (!data.email?.trim())      errors.email      = 'Email is required';
      if (!data.status_id)             errors.status_id     = 'Please select a status';
      if (!Array.isArray(data.role_ids) || data.role_ids.length === 0) {
        errors.role_ids = 'Select at least one role';
      }
      if (data.password && data.password !== data.password_confirmation) {
        errors.password_confirmation = 'Passwords do not match';
      }
      return errors;
    },
    transformResponse: (data) => {
      if (!data || typeof data !== 'object') return data;
      if (Array.isArray(data)) return data;
      return {
        ...data,
        first_name:   data.person?.first_name   ?? '',
        middle_name:  data.person?.middle_name  ?? '',
        last_name:    data.person?.last_name    ?? '',
        gender:       data.person?.gender       ?? '',
        phone_number: data.person?.phone_number ?? '',
        status_id:    String(data.account_status?.id ?? data.status_id ?? ''),
        role_ids: Array.isArray(data.roles)
          ? data.roles.map((r) => (typeof r === 'object' ? r.id : r))
          : [],
      };
    },
    transformFormData: (data) => {
      const payload = {
        first_name:   data.first_name,
        middle_name:  data.middle_name  || null,
        last_name:    data.last_name,
        gender:       data.gender       || null,
        email:        data.email,
        phone_number: data.phone_number || null,
        status_id:    data.status_id ? Number(data.status_id) : null,
        role_ids: Array.isArray(data.role_ids)
          ? data.role_ids.map((r) => (typeof r === 'object' ? r.id : r))
          : [],
      };
      if (data.password) {
        payload.password              = data.password;
        payload.password_confirmation = data.password_confirmation;
      }
      return payload;
    },
    resourceName: 'User',
    itemsPerPage: 10,
  });

  // ── Suspend ────────────────────────────────────────────────────────────────
  const handleSuspend = async (item) => {
    const result = await showConfirmDialog({
      title: 'Suspend User',
      message: `Are you sure you want to suspend <span class="font-medium text-gray-900">"${item.full_name || item.email}"</span>? They will not be able to log in.`,
      confirmText: 'Suspend',
      confirmColor: '#f97316',
      iconBg: 'bg-orange-100',
      icon: `<svg class="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
             </svg>`
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/users/${item.id}/suspend`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to suspend user');
      showSuccessToast(`${item.full_name || item.email} has been suspended`, 'delete');
      crud.reload();
    } catch (err) {
      showErrorDialog(err.message);
    }
  };

  // ── Unsuspend ──────────────────────────────────────────────────────────────
  const handleActivate = async (item) => {
    const result = await showConfirmDialog({
      title: 'Unsuspend User',
      message: `Are you sure you want to unsuspend <span class="font-medium text-gray-900">"${item.full_name || item.email}"</span>? They will regain access to the system.`,
      confirmText: 'Unsuspend',
      confirmColor: '#10b981',
      iconBg: 'bg-green-100',
      icon: `<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/users/${item.id}/unsuspend`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to unsuspend user');
      showSuccessToast(`${item.full_name || item.email} has been unsuspended`, 'success');
      crud.reload();
    } catch (err) {
      showErrorDialog(err.message);
    }
  };

  // ── Page config ────────────────────────────────────────────────────────────
  const pageConfig = {
    icon: FiUsers,
    title: 'Users',
    subtitle: 'Manage system users and their roles',
    addButtonLabel: 'Add User',
    searchPlaceholder: 'Search users...'
  };

  // ── Stats cards ────────────────────────────────────────────────────────────
  const statsConfig = {
    cards: [
      { key: 'total',          label: 'Total Users',     icon: FiTrendingUp,  iconColor: 'blue-600'   },
      { key: 'roles_assigned', label: 'Roles Assigned',  icon: FiShield,      iconColor: 'purple-600' },
      { key: 'suspended',      label: 'Suspended',       icon: FiSlash,       iconColor: 'orange-600' },
      { key: 'trashed',        label: 'Trashed',         icon: FiTrash2,      iconColor: 'red-600'    }
    ]
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const tableColumns = [
    {
      header: 'User',
      accessor: 'full_name',
      noWrap: true,
      render: (row, darkMode) => {
        const displayName = row.full_name
          || [row.person?.first_name, row.person?.last_name].filter(Boolean).join(' ')
          || row.email;
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return (
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{displayName}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <FiMail className="w-3 h-3" />{row.email}
              </div>
              {(row.person?.phone_number) && (
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <FiPhone className="w-3 h-3" />{row.person.phone_number}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Role',
      accessor: 'roles',
      sortable: false,
      render: (row, darkMode) => {
        const roles = Array.isArray(row.roles) ? row.roles : [];
        if (!roles.length) return <span className="text-xs text-gray-400 italic">No roles</span>;
        return (
          <div className="flex flex-col gap-1">
            {roles.map((r, i) => {
              const roleName = typeof r === 'object' ? r.name : r;
              const geoLevel = typeof r === 'object' ? (r.geographical_level?.name || null) : null;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-100 w-fit"
                >
                  <FiShield className="w-2.5 h-2.5 flex-shrink-0" />
                  {geoLevel ? `${roleName} - ${geoLevel}` : roleName}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Scope',
      accessor: 'area_assignments',
      sortable: false,
      render: (row, darkMode) => {
        const roles = Array.isArray(row.roles) ? row.roles : [];
        const assignments = Array.isArray(row.area_assignments) ? row.area_assignments : [];

        // Determine geo level from roles
        const geoLevelName = roles
          .map((r) => r.geographical_level?.name)
          .find(Boolean);

        if (!geoLevelName) {
          return <span className="text-xs text-gray-400 italic">—</span>;
        }

        const lvl = geoLevelName.toLowerCase();

        // HQ / School: unrestricted
        if (/hq/.test(lvl)) {
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
              darkMode ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <FiMapPin className="w-2.5 h-2.5" />All Areas
            </span>
          );
        }
        if (!assignments.length) {
          return <span className="text-xs text-orange-500 italic">No areas</span>;
        }

        const names = assignments.map((a) =>
          a.level_type === 'region'  ? (a.region?.name   || `Region #${a.area_id}`) :
          a.level_type === 'council' ? (a.council?.name  || `Council #${a.area_id}`) :
          a.level_type === 'ward'    ? (a.ward?.name     || `Ward #${a.area_id}`) :
          a.level_type === 'village' ? (a.village?.name  || a.village_code) :
          a.level_type === 'school'  ? (a.school?.name   || `School #${a.area_id}`) :
          `#${a.area_id ?? a.village_code}`
        );

        const MAX_SHOW = 2;
        return (
          <div className="flex flex-wrap gap-1">
            {names.slice(0, MAX_SHOW).map((n, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                darkMode ? 'bg-primary-900/40 border-primary-700 text-primary-300' : 'bg-primary-50 border-primary-200 text-primary-700'
              }`}>
                <FiMapPin className="w-2.5 h-2.5 flex-shrink-0" />{n}
              </span>
            ))}
            {names.length > MAX_SHOW && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>+{names.length - MAX_SHOW} more</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'account_status',
      noWrap: true,
      render: (row, darkMode) => {
        const s = row.account_status;
        if (!s) return <span className="text-xs text-gray-400">—</span>;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
          }`}>
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color ?? '#9ca3af' }}
            />
            {s.name}
          </span>
        );
      }
    }
  ];

  // ── Table config ───────────────────────────────────────────────────────────
  const tableConfig = {
    emptyState: {
      title: 'No Users Found',
      description: 'Get started by creating your first user.'
    }
  };

  // ── Form fields (single custom field renders the tabbed layout) ───────────
  const formFields = [
    {
      name: '_tabs',
      type: 'custom',
      render: (formData, onInputChange, errors, darkMode) => (
        <UserFormTabs
          formData={formData}
          onInputChange={onInputChange}
          errors={errors}
          isEditing={crud.isEditing}
          editingId={crud.editingId}
          darkMode={darkMode}
          accountStatuses={accountStatuses}
        />
      )
    }
  ];

  // ── View tabs (read-only detail modal) ────────────────────────────────────
  const viewTabs = [
    {
      id: 'details',
      label: 'User Info',
      icon: FiUser,
      fields: [
        { label: 'First Name',  render: (item) => item.person?.first_name  || '—' },
        { label: 'Last Name',   render: (item) => item.person?.last_name   || '—' },
        { label: 'Middle Name', render: (item) => item.person?.middle_name || '—' },
        { label: 'Gender',      render: (item) => item.person?.gender      || '—' },
        { label: 'Email',       accessor: 'email' },
        { label: 'Phone',       render: (item) => item.person?.phone_number || '—' },
        { label: 'Status', render: (item) => {
          const s = item.account_status;
          if (!s) return '—';
          return (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color ?? '#9ca3af' }}
              />
              {s.name}
            </span>
          );
        }},
      ],
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: FiShield,
      fields: [
        {
          render: (item) => (
            <div className="flex flex-wrap gap-2">
              {(item.roles || []).length > 0
                ? (item.roles || []).map((r, i) => {
                    const roleName = typeof r === 'object' ? r.name : r;
                    const geoLevel = typeof r === 'object' ? (r.geographical_level?.name ?? null) : null;
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                        <FiShield className="w-3 h-3 flex-shrink-0" />
                        {geoLevel ? `${roleName} (${geoLevel})` : roleName}
                      </span>
                    );
                  })
                : <span className="text-sm text-gray-400 italic">No roles assigned</span>}
            </div>
          ),
        },
      ],
    },
    {
      id: 'scope',
      label: 'Area Scope',
      icon: FiMapPin,
      fields: [
        {
          render: (item) => (
            <AreaAssignmentPicker
              userId={item.id}
              roleIds={(item.roles || []).map((r) => (typeof r === 'object' ? r.id : r))}
              readOnly
            />
          ),
        },
      ],
    },
  ];

  const hasPerm = (name) => Array.isArray(authUser?.permissions?.flat) && authUser.permissions.flat.includes(name);
  const canViewUsers = hasPerm('view-users');
  const canCreateUsers = hasPerm('create-users');
  const canEditUsers = hasPerm('edit-users');
  const canDeleteUsers = hasPerm('delete-users');
  const canSuspendUsers = hasPerm('suspend-users');
  const canUnsuspendUsers = hasPerm('unsuspend-users') || canSuspendUsers;

  // ── Access denied ──────────────────────────────────────────────────────────
  if (!canViewUsers) {
    return <AccessDeniedState message="You do not have permission to view users." />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <CRUDPage
      pageConfig={{
        ...pageConfig,
        hideAddButton: !canCreateUsers,
        hideActions: [
          ...(!canViewUsers ? ['view'] : []),
          ...(!canEditUsers ? ['edit'] : []),
          ...(!canDeleteUsers ? ['delete'] : []),
        ]
      }}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      selfId={authUser?.id}
      formFields={formFields}
      viewTabs={viewTabs}
      modalTitle="User"
      modalMaxWidth="max-w-3xl"
      crud={crud}
      filterOptions={roleFilterOptions}
      extraActions={[
        ...(canSuspendUsers ? [{
          type: 'suspend',
          label: 'Suspend',
          icon: FiSlash,
          onClick: handleSuspend,
          visible: (row) => row.id !== authUser?.id && row.suspended_at == null && !row.deleted_at
        }] : []),
        ...(canUnsuspendUsers ? [{
          type: 'activate',
          label: 'Unsuspend',
          icon: FiZapOff,
          onClick: handleActivate,
          visible: (row) => row.id !== authUser?.id && row.suspended_at != null && !row.deleted_at
        }] : []),
      ]}
    />
  );
};

export default UserList;

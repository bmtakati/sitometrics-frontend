import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiToggleRight, FiPlus, FiX, FiCheck, FiClock, FiAlertCircle,
  FiRefreshCw, FiEye, FiChevronLeft, FiChevronRight,
  FiUser, FiArchive, FiSend, FiShield, FiSave,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import useDarkMode from '../hooks/useDarkMode';
import apiFetch from '../utils/apiFetch';
import { API_BASE_URL } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import AccessDeniedState from '../components/AccessDeniedState';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

// ── Custom time-spinner used inside the DatePicker calendar popup ─────────────
// react-datepicker clones this element and injects `value` ("HH:mm") + `onChange`.
const CustomTimeInput = React.forwardRef(function CustomTimeInput(
  { value, onChange, darkMode },
  _ref
) {
  // Parse 24-h "HH:mm" → { hour12: 1-12, minute: 0-59, period: 'AM'|'PM' }
  const parse24 = (v) => {
    const [h = 0, m = 0] = (v || '00:00').split(':').map(Number);
    return {
      hour:   h === 0 ? 12 : h > 12 ? h - 12 : h,
      minute: m,
      period: h < 12 ? 'AM' : 'PM',
    };
  };

  const parsed        = parse24(value);
  const [hour,   setHour]   = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(parsed.minute);
  const [period, setPeriod] = React.useState(parsed.period);

  // Keep local state in sync when datepicker resets value externally
  React.useEffect(() => {
    const p = parse24(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]); // eslint-disable-line

  const emit = React.useCallback((h, m, p) => {
    let h24 = p === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }, [onChange]);

  const spin = (type, delta) => {
    if (type === 'hour') {
      const next = ((hour - 1 + delta + 12) % 12) + 1; // cycles 1-12
      setHour(next);
      emit(next, minute, period);
    } else {
      const next = (minute + delta + 60) % 60;          // cycles 0-59
      setMinute(next);
      emit(hour, next, period);
    }
  };

  const togglePeriod = () => {
    const next = period === 'AM' ? 'PM' : 'AM';
    setPeriod(next);
    emit(hour, minute, next);
  };

  const handleInput = (type, raw) => {
    const n = parseInt(raw, 10);
    if (type === 'hour') {
      const clamped = isNaN(n) ? 1 : Math.min(12, Math.max(1, n));
      setHour(clamped);
      emit(clamped, minute, period);
    } else {
      const clamped = isNaN(n) ? 0 : Math.min(59, Math.max(0, n));
      setMinute(clamped);
      emit(hour, clamped, period);
    }
  };

  const dark = darkMode;

  /* ── shared style tokens ── */
  const spinBtn = `w-full h-6 flex items-center justify-center rounded text-[11px] font-bold leading-none transition-colors select-none
    ${dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300'}`;
  const numInput = `w-10 text-center text-sm font-semibold bg-transparent outline-none appearance-none
    ${dark ? 'text-white' : 'text-gray-800'}`;

  return (
    <div className={`w-full rounded-lg border px-2 pt-1.5 pb-2
      ${dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>

      {/* Row label */}
      <span className={`block text-[9px] font-semibold uppercase tracking-widest mb-1.5
        ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Time</span>

      {/* Spinner row */}
      <div className="flex items-stretch justify-center gap-2">

        {/* Hour */}
        <div className={`flex flex-col items-center rounded-lg border overflow-hidden min-w-[40px]
          ${dark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button type="button" className={spinBtn} onClick={() => spin('hour', 1)}>▲</button>
          <div className="flex flex-col items-center py-0.5">
            <input
              type="number" min={1} max={12} value={hour}
              onChange={e => handleInput('hour', e.target.value)}
              className={numInput}
              style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
            />
            <span className={`text-[8px] leading-none ${dark ? 'text-gray-600' : 'text-gray-400'}`}>HH</span>
          </div>
          <button type="button" className={spinBtn} onClick={() => spin('hour', -1)}>▼</button>
        </div>

        <span className={`self-center text-base font-bold ${dark ? 'text-gray-400' : 'text-gray-400'}`}>:</span>

        {/* Minute */}
        <div className={`flex flex-col items-center rounded-lg border overflow-hidden min-w-[40px]
          ${dark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button type="button" className={spinBtn} onClick={() => spin('minute', 1)}>▲</button>
          <div className="flex flex-col items-center py-0.5">
            <input
              type="number" min={0} max={59} value={String(minute).padStart(2, '0')}
              onChange={e => handleInput('minute', e.target.value)}
              className={numInput}
              style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
            />
            <span className={`text-[8px] leading-none ${dark ? 'text-gray-600' : 'text-gray-400'}`}>MM</span>
          </div>
          <button type="button" className={spinBtn} onClick={() => spin('minute', -1)}>▼</button>
        </div>

        {/* AM / PM */}
        <div className={`flex flex-col rounded-lg overflow-hidden border self-stretch
          ${dark ? 'border-gray-600' : 'border-gray-300'}`}>
          {['AM', 'PM'].map(p => (
            <button
              key={p} type="button" onClick={togglePeriod}
              className={`flex-1 px-3 text-xs font-semibold transition-colors
                ${ period === p
                  ? 'bg-primary-600 text-white'
                  : dark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
            >{p}</button>
          ))}
        </div>

      </div>
    </div>
  );
});

const TABS = [
  { id: 'active',  label: 'Active',       icon: FiShield    },
  { id: 'history', label: 'History',       icon: FiArchive   },
  { id: 'create',  label: 'New Handover',  icon: FiPlus      },
];

const STATUS_BADGE = {
  active:    'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  expired:   'bg-gray-100 text-gray-600',
  returned:  'bg-blue-100 text-blue-700',
};

const STATUS_ICON = {
  active:    <FiCheck  className="w-3 h-3 mr-1" />,
  cancelled: <FiX      className="w-3 h-3 mr-1" />,
  expired:   <FiClock  className="w-3 h-3 mr-1" />,
  returned:  <FiSend   className="w-3 h-3 mr-1" />,
};

const TYPE_BADGE = {
  permanent: 'bg-purple-100 text-purple-700',
  temporary: 'bg-orange-100 text-orange-700',
};

function fullName(user) {
  if (!user) return '—';
  const p = user.person;
  if (!p) return user.email ?? '—';
  return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || user.email;
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── DatePicker custom input (needs forwardRef for react-datepicker) ───────────
const CustomDateInput = React.forwardRef(function CustomDateInput(
  { value, onClick, onKeyDown, className, placeholder, disabled }, ref
) {
  return (
    <input
      ref={ref}
      value={value ?? ''}
      onClick={onClick}
      onKeyDown={onKeyDown}
      readOnly
      disabled={disabled}
      className={className}
      placeholder={placeholder ?? ' '}
    />
  );
});

// ── Field component (matches UserList floating-label style) ─────────────────
const Field = ({ name, label, type = 'text', required, placeholder, colSpan = 1,
                 value, onChange, errors = {}, darkMode, rows = 3, children, disabled = false }) => {
  const hasError = !!errors[name];
  const baseCls = `peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
    hasError
      ? 'border-red-500'
      : darkMode
      ? 'border-gray-600 bg-gray-800 text-white'
      : 'border-gray-300 bg-white text-gray-900'
  }`;
  const labelTransCls = `absolute left-2 -top-2.5 px-1 ${
    darkMode ? 'bg-gray-900' : 'bg-white'
  } text-xs font-medium ${
    darkMode ? 'text-gray-400' : 'text-gray-600'
  } transition-all pointer-events-none
  peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
  peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:${
    darkMode ? 'bg-gray-900' : 'bg-white'
  }`;
  const labelFixedCls = `absolute left-2 -top-2.5 px-1 ${
    darkMode ? 'bg-gray-900' : 'bg-white'
  } text-xs font-medium text-primary-600 pointer-events-none z-10`;

  const errorMsg = errors[name]
    ? (Array.isArray(errors[name]) ? errors[name].join(' ') : errors[name])
    : null;

  const colCls = colSpan > 1 ? `col-span-${colSpan}` : '';

  return (
    <div className={`relative ${colCls}`}>
      {type === 'datetime' ? (
        <>
          <DatePicker
            selected={value || null}
            onChange={onChange}
            showTimeInput
            timeInputLabel=""
            dateFormat="MMM d, yyyy  h:mm aa"
            placeholderText=" "
            isClearable
            disabled={false}
            popperPlacement="bottom-start"
            popperClassName="rdp-wide"
            customTimeInput={<CustomTimeInput darkMode={darkMode} />}
            customInput={
              <CustomDateInput
                className={`${baseCls} cursor-pointer`}
                placeholder=" "
              />
            }
            wrapperClassName="w-full"
          />
          <label className={labelFixedCls}>{label}{required && ' *'}</label>
        </>
      ) : type === 'searchable-select' ? (
        <>
          <SearchableSelect
            options={children ?? []}
            value={String(value ?? '')}
            onChange={onChange}
            placeholder={placeholder || `Select ${label}…`}
            darkMode={darkMode}
            disabled={disabled}
          />
          <label className={labelFixedCls}>{label}{required && ' *'}</label>
        </>
      ) : type === 'textarea' ? (
        <>
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder=" "
            rows={rows}
            className={`${baseCls} resize-none`}
          />
          <label className={labelTransCls}>{label}{required && ' *'}</label>
        </>
      ) : (
        <>
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder=" "
            className={baseCls}
          />
          <label className={labelTransCls}>{label}{required && ' *'}</label>
        </>
      )}
      {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
    </div>
  );
};

// ── Small sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconColor, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value ?? 0}</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center">
          <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

const RoleHandover = () => {
  const darkMode = useDarkMode();
  const { user: authUser, logout, setAuthUser } = useAuth();
  const navigate = useNavigate();
  const canView   = hasPermission(authUser, 'view-role-handovers');
  const canCreate = hasPermission(authUser, 'create-role-handovers');

  if (!canView) {
    return <AccessDeniedState message="You do not have permission to view role handovers." />;
  }

  // ── Tab state
  const [activeTab, setActiveTab] = useState('active');

  // ── List state
  const [handovers, setHandovers]         = useState([]);
  const [listLoading, setListLoading]     = useState(false);
  const [listError, setListError]         = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);

  // ── Stats
  const [stats, setStats] = useState({});

  // ── Detail view
  const [viewItem, setViewItem]           = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // ── Cancel confirm
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelling, setCancelling]       = useState(false);

  // ── Create form state
  const [receivers, setReceivers]         = useState([]);
  const [receiversLoading, setReceiversLoading] = useState(false);
  const [myRoles, setMyRoles]             = useState([]);
  const [submitting, setSubmitting]       = useState(false);

  const [formErrors, setFormErrors]       = useState({});

  const emptyForm = {
    receiver_id: '',
    type: 'temporary',
    role_ids: [],         // empty = all roles
    starts_at: null,
    ends_at: null,
    reason: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch list ──────────────────────────────────────────────────────────

  const fetchHandovers = useCallback(async (tab, page = 1) => {
    if (tab === 'create') return;
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams({ page, per_page: 10, tab });
      const res  = await apiFetch(`${API_BASE_URL}/api/role-handovers?${params}`);
      const json = await res.json();
      setHandovers(json.data ?? []);
      setCurrentPage(json.meta?.current_page ?? 1);
      setLastPage(json.meta?.last_page ?? 1);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      setListError(err?.message ?? 'Failed to load handovers.');
    } finally {
      setListLoading(false);
    }
  }, []);

  // ── Fetch stats ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res  = await apiFetch(`${API_BASE_URL}/api/role-handovers/stats`);
      const json = await res.json();
      setStats(json.data ?? {});
    } catch {}
  }, []);

  // ── On tab change ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
    if (activeTab !== 'create') {
      fetchHandovers(activeTab, 1);
    }
  }, [activeTab]); // eslint-disable-line

  // ── Load receivers + my roles when open create tab ───────────────────────

  useEffect(() => {
    if (activeTab !== 'create') return;
    // Load eligible receivers
    setReceiversLoading(true);
    apiFetch(`${API_BASE_URL}/api/role-handovers/eligible-receivers?per_page=100`)
      .then(res => res.json())
      .then(json => setReceivers(json.data ?? []))
      .catch(() => {})
      .finally(() => setReceiversLoading(false));

    // Load current user roles
    apiFetch(`${API_BASE_URL}/api/users/${authUser?.id}`)
      .then(res => res.json())
      .then(json => setMyRoles(json.data?.roles ?? []))
      .catch(() => setMyRoles([]));
  }, [activeTab, authUser?.id]);

  // ── Pagination ───────────────────────────────────────────────────────────

  const handlePageChange = (page) => {
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
    fetchHandovers(activeTab, page);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res  = await apiFetch(`${API_BASE_URL}/api/role-handovers/${cancelTarget.id}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to cancel.');

      setCancelTarget(null);
      fetchHandovers(activeTab, currentPage);
      fetchStats();

      // Roles have been restored — refresh the in-memory user so permissions
      // are accurate without forcing a full sign-out.
      try {
        const token = localStorage.getItem('auth_token');
        const userRes = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const userJson = await userRes.json();
        const fresh = userJson?.data?.user;
        if (fresh) {
          const enriched = {
            ...fresh,
            role_names: Array.isArray(userJson.data?.roles)
              ? userJson.data.roles
              : (fresh.role_names ?? []),
          };
          setAuthUser(enriched, token);
          await Swal.fire({
            icon: 'success',
            title: 'Handover cancelled',
            html: 'The handover has been cancelled and your roles have been <strong>restored</strong>.<br/>Your session has been updated — no re-login required.',
            confirmButtonText: 'OK',
            timer: 6000,
            timerProgressBar: true,
          });
          return;
        }
      } catch { /* fall through to logout */ }

      // Fallback: could not refresh session — log out so the user re-authenticates
      // with their restored roles.
      await Swal.fire({
        icon: 'info',
        title: 'Handover cancelled',
        html: 'The handover has been cancelled and your original roles have been restored.<br/><br/>You will be signed out so your permissions are refreshed on next login.',
        confirmButtonText: 'Sign out now',
        allowOutsideClick: false,
      });
      logout();
      navigate('/login');
    } catch (err) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: err?.message ?? 'Failed to cancel.', showConfirmButton: false, timer: 4000 });
    } finally {
      setCancelling(false);
    }
  };

  // ── Create handover submit ───────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic client-side validation
    const errs = {};
    if (!form.receiver_id) errs.receiver_id = 'Please select a receiver.';
    if (form.type === 'temporary') {
      if (!form.starts_at) errs.starts_at = 'Start date is required.';
      if (!form.ends_at)   errs.ends_at   = 'End date is required.';
    }
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      const payload = {
        receiver_id: parseInt(form.receiver_id),
        type:        form.type,
        reason:      form.reason || null,
        notes:       form.notes  || null,
        role_ids:    form.role_ids.length > 0 ? form.role_ids.map(Number) : null,
      };
      if (form.type === 'temporary') {
        payload.starts_at = form.starts_at ? format(form.starts_at, "yyyy-MM-dd HH:mm:ss") : null;
        payload.ends_at   = form.ends_at   ? format(form.ends_at,   "yyyy-MM-dd HH:mm:ss") : null;
      }

      const res  = await apiFetch(`${API_BASE_URL}/api/role-handovers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const errData = json.errors;
        const firstMsg = errData
          ? Object.values(errData).flat().join(' ')
          : (json.message ?? 'Failed to create handover.');
        throw new Error(firstMsg);
      }

      setForm(emptyForm);
      setFormErrors({});

      // Refresh session so the initiator sees their updated (reduced) roles.
      try {
        const token = localStorage.getItem('auth_token');
        const userRes = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const userJson = await userRes.json();
        const fresh = userJson?.data?.user;
        if (fresh) {
          const enriched = {
            ...fresh,
            role_names: Array.isArray(userJson.data?.roles)
              ? userJson.data.roles
              : (fresh.role_names ?? []),
          };
          setAuthUser(enriched, token);
        }
      } catch { /* non-critical */ }

      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Handover created. Your roles have been updated.', showConfirmButton: false, timer: 3500, timerProgressBar: true });
      setActiveTab('active');
      fetchStats();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.message ?? 'Failed to create handover.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Role checkbox toggle ─────────────────────────────────────────────────

  const toggleRole = (roleId) => {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(roleId)
        ? f.role_ids.filter(id => id !== roleId)
        : [...f.role_ids, roleId],
    }));
  };

  // ── Receiver options for SearchableSelect ──────────────────────────────

  const receiverOptions = receivers.map(u => ({
    value: String(u.id),
    label: `${fullName(u)}${u.email ? ` (${u.email})` : ''}`,
  }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FiToggleRight}
        title="Role Handover"
        subtitle="Temporarily or permanently transfer your roles to another user"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active"    value={stats.active}    icon={FiShield}   iconColor="text-emerald-600" darkMode={darkMode} />
        <StatCard label="Given"     value={stats.given}     icon={FiSend}     iconColor="text-orange-500"  darkMode={darkMode} />
        <StatCard label="Received"  value={stats.received}  icon={FiUser}     iconColor="text-blue-600"    darkMode={darkMode} />
        <StatCard label="Total"     value={stats.total}     icon={FiRefreshCw} iconColor="text-indigo-600" darkMode={darkMode} />
      </div>

      {/* Tab container */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-stone-300'}`}>

        {/* Tab bar */}
        <div className={`flex items-center border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-stone-50 border-stone-300'}`}>
          {TABS.filter(({ id }) => id !== 'create' || canCreate).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? `border-indigo-500 text-indigo-600 ${darkMode ? 'bg-gray-900' : 'bg-white'}`
                  : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Active / History tab content ── */}
        {(activeTab === 'active' || activeTab === 'history') && (
          <div className={darkMode ? 'bg-gray-900' : 'bg-white'}>
            {listLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <FiRefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
              </div>
            ) : listError ? (
              <div className="flex items-center justify-center py-12 text-red-500 gap-2">
                <FiAlertCircle className="w-5 h-5" /> {listError}
              </div>
            ) : handovers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FiArchive className="w-10 h-10 mb-3 opacity-40" />
                <p>No handovers found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
                      <tr>
                        {['Initiator', 'Receiver', 'Type', 'Status', 'Roles', 'Period', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                      {handovers.map(h => (
                        <tr key={h.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-5 py-3 text-sm">
                            <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                              {fullName(h.initiator)}
                            </span>
                            {h.initiator_id === authUser?.id && (
                              <span className="ml-1.5 text-xs text-indigo-500">(you)</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm">
                            <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                              {fullName(h.receiver)}
                            </span>
                            {h.receiver_id === authUser?.id && (
                              <span className="ml-1.5 text-xs text-emerald-500">(you)</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[h.type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {h.type}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[h.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_ICON[h.status]}
                              {h.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {h.role_ids ? `${h.role_ids.length} role(s)` : 'All roles'}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {h.type === 'temporary' ? (
                              <>
                                <div>{formatDateTime(h.starts_at)}</div>
                                <div className="text-gray-400">→ {formatDateTime(h.ends_at)}</div>
                              </>
                            ) : (
                              <span className="text-purple-500">Permanent</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setViewItem(h); setShowViewModal(true); }}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                              >
                                <FiEye className="w-3.5 h-3.5" /> View
                              </button>
                              {h.status === 'active' && h.initiator_id === authUser?.id && (
                                <button
                                  onClick={() => setCancelTarget(h)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                                >
                                  <FiX className="w-3.5 h-3.5" /> Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {lastPage} &nbsp;·&nbsp; {total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Create Handover tab ── */}
        {activeTab === 'create' && (
          <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-x-5 gap-y-6">

                {/* Receiver (3 cols) */}
                <Field
                  name="receiver_id"
                  label="Receiver"
                  type="searchable-select"
                  required
                  colSpan={3}
                  placeholder={receiversLoading ? 'Loading eligible users…' : 'Type a name to search…'}
                  value={form.receiver_id}
                  onChange={(val) => setForm(f => ({ ...f, receiver_id: val }))}
                  errors={formErrors}
                  darkMode={darkMode}
                  disabled={receiversLoading}
                >
                  {receiverOptions}
                </Field>

                {/* Handover Type — SearchableSelect (3 cols) */}
                <div className="relative col-span-3">
                  <SearchableSelect
                    options={[
                      { value: 'temporary', label: 'Temporary' },
                      { value: 'permanent', label: 'Permanent' },
                    ]}
                    value={form.type}
                    onChange={(val) => setForm(f => ({ ...f, type: val || 'temporary' }))}
                    darkMode={darkMode}
                    placeholder="Select handover type…"
                  />
                  <label className={`absolute left-2 -top-2.5 px-1 z-10 ${
                    darkMode ? 'bg-gray-900' : 'bg-white'
                  } text-xs font-medium text-primary-600 pointer-events-none`}>
                    Handover Type *
                  </label>
                  {form.type === 'permanent' && (
                    <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                      <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      Roles are transferred indefinitely with no automatic return.
                    </p>
                  )}
                </div>

                {/* Start Date + End Date (temporary only, 3 cols each) */}
                {form.type === 'temporary' && (
                  <>
                    <Field
                      name="starts_at"
                      label="Start Date & Time"
                      type="datetime"
                      required
                      colSpan={3}
                      value={form.starts_at}
                      onChange={(date) => setForm(f => ({ ...f, starts_at: date }))}
                      errors={formErrors}
                      darkMode={darkMode}
                    />
                    <Field
                      name="ends_at"
                      label="End Date & Time"
                      type="datetime"
                      required
                      colSpan={3}
                      value={form.ends_at}
                      onChange={(date) => setForm(f => ({ ...f, ends_at: date }))}
                      errors={formErrors}
                      darkMode={darkMode}
                    />
                  </>
                )}

                {/* Reason (3 cols) + Notes (3 cols) */}
                <Field
                  name="reason"
                  label="Reason"
                  type="textarea"
                  rows={3}
                  colSpan={3}
                  placeholder=" "
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  errors={formErrors}
                  darkMode={darkMode}
                />
                <Field
                  name="notes"
                  label="Notes"
                  type="textarea"
                  rows={3}
                  colSpan={3}
                  placeholder=" "
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  errors={formErrors}
                  darkMode={darkMode}
                />

                {/* Roles to Hand Over — checkboxes (full width) */}
                {myRoles.length > 0 && (
                  <div className="col-span-6">
                    <p className={`text-xs font-medium mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Roles to Hand Over
                      <span className="ml-1.5 font-normal text-gray-400">(leave all unchecked to hand over all your roles)</span>
                    </p>
                    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border ${
                      darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {myRoles.map(r => {
                        const checked = form.role_ids.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-lg transition-colors ${
                              checked
                                ? darkMode ? 'bg-primary-900/40' : 'bg-primary-50'
                                : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRole(r.id)}
                              className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                            />
                            <FiShield className={`w-3.5 h-3.5 flex-shrink-0 ${
                              checked ? 'text-primary-600' : darkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm font-medium truncate ${
                              checked
                                ? 'text-primary-600'
                                : darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {r.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons — bottom right */}
              <div className={`flex justify-end gap-3 mt-6 pt-4 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => { setForm(emptyForm); setFormErrors({}); }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-red-900/60 hover:text-red-300'
                      : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <FiX className="w-4 h-4" /> Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {submitting
                    ? <FiRefreshCw className="w-4 h-4 animate-spin" />
                    : <FiSave className="w-5 h-5" />}
                  {submitting ? 'Submitting…' : 'Create Handover'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Detail View Modal ── */}
      {showViewModal && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`relative sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4 z-10`}>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`} />
              <div className="flex items-center gap-3 pl-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FiToggleRight className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Handover Details</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    #{viewItem.id} &mdash; <span className="capitalize">{viewItem.type}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setViewItem(null); }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {[
                { label: 'Initiator',  value: fullName(viewItem.initiator) },
                { label: 'Receiver',   value: fullName(viewItem.receiver)  },
                { label: 'Type',       value: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[viewItem.type]}`}>{viewItem.type}</span> },
                { label: 'Status',     value: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[viewItem.status]}`}>{STATUS_ICON[viewItem.status]}{viewItem.status}</span> },
                { label: 'Roles',      value: viewItem.role_ids ? `${viewItem.role_ids.length} specific role(s)` : 'All initiator roles' },
                { label: 'Starts',     value: formatDateTime(viewItem.starts_at) },
                { label: 'Ends',       value: formatDateTime(viewItem.ends_at)   },
                { label: 'Reason',     value: viewItem.reason || '—' },
                { label: 'Notes',      value: viewItem.notes  || '—' },
                { label: 'Cancelled',  value: formatDateTime(viewItem.cancelled_at) },
                { label: 'Expired',    value: formatDateTime(viewItem.expired_at)   },
                { label: 'Returned',   value: formatDateTime(viewItem.returned_at)  },
                { label: 'Created',    value: formatDateTime(viewItem.created_at)   },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <span className={`w-28 shrink-0 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</span>
                </div>
              ))}

              {/* Logs */}
              {viewItem.logs?.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Activity Log</p>
                  <div className="space-y-1.5">
                    {viewItem.logs.map(log => (
                      <div key={log.id} className={`text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                        <span className="font-medium capitalize">{log.action}</span>
                        {' '}by <span className="font-medium">{fullName(log.actor)}</span>
                        <span className="ml-2 text-gray-400">{formatDateTime(log.created_at)}</span>
                        {log.notes && <div className="mt-0.5 text-gray-400">{log.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
              <button
                onClick={() => { setShowViewModal(false); setViewItem(null); }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Handover"
        message="Are you sure you want to cancel this handover? Your roles will be restored immediately."
        itemName={cancelTarget ? `Handover #${cancelTarget.id} → ${fullName(cancelTarget.receiver)}` : ''}
        confirmText={cancelling ? 'Cancelling…' : 'Yes, Cancel Handover'}
        cancelText="Go Back"
        type="danger"
      />
    </div>
  );
};

export default RoleHandover;

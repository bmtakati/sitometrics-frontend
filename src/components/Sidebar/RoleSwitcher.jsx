import React, { useEffect, useMemo, useState } from 'react';
import { FiRepeat } from 'react-icons/fi';
import { API_BASE_URL, useAuth } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import SearchableSelect from '../SearchableSelect';

const RoleSwitcher = ({ isCollapsed, darkMode, onClose }) => {
  const { user, setAuthUser } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [users, setUsers] = useState([]);
  const [switchingId, setSwitchingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/role-switcher`);
        const payload = await response.json().catch(() => ({}));
        if (cancelled || !response.ok) return;
        const data = payload?.data || {};
        setEnabled(Boolean(data.enabled));
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch {
        if (!cancelled) {
          setEnabled(false);
          setUsers([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const options = useMemo(
    () => users.map((entry) => ({
      value: entry.id,
      label: [entry.role, entry.name].filter(Boolean).join(' — '),
    })),
    [users],
  );

  if (!enabled || !users.length) return null;

  const currentId = user?.id;

  const switchTo = async (value) => {
    if (value === '' || value === null || value === undefined) return;
    const target = users.find((entry) => String(entry.id) === String(value));
    if (!target?.id || String(target.id) === String(currentId) || switchingId) return;
    setSwitchingId(target.id);
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/role-switcher/${target.id}`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.data?.token) return;

      const { user: userObj, token, roles, permissions } = payload.data;
      setAuthUser({
        ...userObj,
        role_names: Array.isArray(roles) ? roles : (userObj.role_names ?? []),
        permissions: permissions ?? userObj.permissions ?? null,
        pos_interface: Boolean(userObj.pos_interface),
      }, token);
      if (window.innerWidth < 1024) onClose?.();
      window.location.assign('/dashboard');
    } finally {
      setSwitchingId(null);
    }
  };

  if (isCollapsed) {
    return (
      <div className="mx-2 mb-2 flex justify-center" title="Switch user">
        <FiRepeat className={`h-5 w-5 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`} />
      </div>
    );
  }

  return (
    <div className="mx-2 mb-3">
      <div className={`mb-1.5 flex items-center gap-2 px-1 text-xs font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
        <FiRepeat className="h-3.5 w-3.5 shrink-0" />
        <span>Switch user</span>
      </div>
      <SearchableSelect
        options={options}
        value={currentId ?? ''}
        onChange={switchTo}
        placeholder="Select user…"
        disabled={Boolean(switchingId)}
        darkMode={darkMode}
        size="compact"
        searchInDropdown
        clearable={false}
      />
    </div>
  );
};

export default RoleSwitcher;

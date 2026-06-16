import React, { useState, useEffect } from 'react';
import { FiShield, FiLoader, FiAlertCircle, FiSearch, FiX, FiChevronDown, FiChevronRight, FiLayers } from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

/**
 * Toggle switch (same visual as PermissionPicker)
 */
const Toggle = ({ checked, onChange, readOnly = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
      readOnly ? 'cursor-default opacity-80 pointer-events-none' : 'cursor-pointer'
    } ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

/**
 * AssignableRolePicker
 *
 * Fetches all roles and lets the user specify which roles THIS role
 * is allowed to delegate (assign) to users.
 *
 * Props:
 *   value     — array of role IDs that are currently delegated
 *   onChange  — (ids: number[]) => void
 *   readOnly  — show only, no interaction
 *   errors    — validation error object
 */
const AssignableRolePicker = ({ value = [], onChange, errors = {}, readOnly = false }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [roles, setRoles]       = useState([]);
  const [grouped, setGrouped]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChanged', handler);
    return () => window.removeEventListener('darkModeChanged', handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res  = await apiFetch(`${API_BASE_URL}/api/roles/all`);
        if (!res.ok) throw new Error('Failed to load roles');
        const json = await res.json();
        const list = json.data ?? json ?? [];
        setRoles(list);

        const groups = {};
        list.forEach((r) => {
          const level = r.geographical_level?.name ?? 'Unscoped / HQ';
          if (!groups[level]) groups[level] = [];
          groups[level].push(r);
        });
        setGrouped(groups);

        // Start all groups expanded
        const exp = {};
        Object.keys(groups).forEach((k) => { exp[k] = true; });
        setExpanded(exp);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derive selected set from value prop
  const selected = new Set((value || []).map(Number));

  const toggle = (id) => {
    if (readOnly) return;
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };

  const toggleAll = () => {
    if (readOnly) return;
    if (selected.size === roles.length) {
      onChange([]);
    } else {
      onChange(roles.map((r) => r.id));
    }
  };

  const toggleGroup = (level) => {
    if (readOnly) return;
    const groupIds = (grouped[level] || []).map((r) => r.id);
    const allOn    = groupIds.every((id) => selected.has(id));
    const next     = new Set(selected);
    if (allOn) {
      groupIds.forEach((id) => next.delete(id));
    } else {
      groupIds.forEach((id) => next.add(id));
    }
    onChange([...next]);
  };

  // Filter roles by search
  const filteredGroups = {};
  const q = search.toLowerCase();
  Object.entries(grouped).forEach(([level, list]) => {
    const filtered = q
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q)
        )
      : list;
    if (filtered.length > 0) filteredGroups[level] = filtered;
  });

  // Stats
  const totalCount    = roles.length;
  const selectedCount = selected.size;
  const allSelected   = totalCount > 0 && selectedCount === totalCount;
  const someSelected  = selectedCount > 0 && selectedCount < totalCount;

  const base   = darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const subBg  = darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200';
  const rowHov = readOnly ? '' : darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';

  if (loading) {
    return (
      <div className={`rounded-xl border p-8 flex flex-col items-center gap-3 ${base}`}>
        <FiLoader className="w-8 h-8 animate-spin text-primary-500" />
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading roles…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={`rounded-xl border p-6 flex items-center gap-3 ${base}`}>
        <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-500">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${base} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <FiShield className="w-4 h-4 text-primary-500" />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Delegated Roles
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            selectedCount > 0
              ? darkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-100 text-primary-700'
              : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}>
            {selectedCount} / {totalCount}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={toggleAll}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              allSelected
                ? darkMode ? 'bg-primary-900/40 text-primary-400 border-primary-700' : 'bg-primary-50 text-primary-700 border-primary-200'
                : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              readOnly
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              className="h-3.5 w-3.5 rounded pointer-events-none accent-primary-600"
            />
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Search */}
      <div className={`px-4 py-2.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="relative">
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            className={`w-full pl-8 pr-8 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className="max-h-96 overflow-y-auto">
        {Object.keys(filteredGroups).length === 0 ? (
          <div className={`p-6 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No roles match your search.
          </div>
        ) : (
          Object.entries(filteredGroups).map(([level, list]) => {
            const groupIds    = list.map((r) => r.id);
            const allOn       = groupIds.every((id) => selected.has(id));
            const someOn      = groupIds.some((id) => selected.has(id)) && !allOn;
            const isExpanded  = expanded[level] !== false;

            return (
              <div key={level} className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Group header */}
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none ${
                    darkMode ? 'hover:bg-gray-700/60 bg-gray-700/70' : 'hover:bg-gray-100 bg-gray-100'
                  }`}
                  onClick={() => setExpanded((prev) => ({ ...prev, [level]: !isExpanded }))}
                >
                  {isExpanded
                    ? <FiChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    : <FiChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
                  <FiLayers className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {level}
                  </span>
                  <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {groupIds.filter((id) => selected.has(id)).length}/{list.length}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleGroup(level); }}
                      className={`ml-2 text-xs px-2 py-0.5 rounded border font-medium transition-colors ${
                        allOn
                          ? darkMode ? 'bg-primary-900/40 text-primary-400 border-primary-700' : 'bg-primary-50 text-primary-700 border-primary-200'
                          : darkMode ? 'text-gray-400 border-gray-600 hover:bg-gray-700' : 'text-gray-500 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={allOn}
                        ref={(el) => { if (el) el.indeterminate = someOn; }}
                        className="h-3 w-3 rounded pointer-events-none accent-primary-600 mr-1"
                      />
                      {allOn ? 'None' : 'All'}
                    </button>
                  )}
                </div>

                {/* Roles in group */}
                {isExpanded && (
                  <div>
                    {list.map((role) => {
                      const isOn = selected.has(role.id);
                      return (
                        <div
                          key={role.id}
                          onClick={() => toggle(role.id)}
                          className={`flex items-center justify-between px-6 py-2.5 border-t cursor-pointer transition-colors ${
                            darkMode ? 'border-gray-700/60' : 'border-gray-100'
                          } ${rowHov} ${isOn ? (darkMode ? 'bg-primary-900/20' : 'bg-primary-50/60') : ''}`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {role.name}
                            </span>
                            {role.description && (
                              <span className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {role.description}
                              </span>
                            )}
                          </div>
                          <Toggle checked={isOn} onChange={() => toggle(role.id)} readOnly={readOnly} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Error */}
      {errors?.assignable_role_ids && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{errors.assignable_role_ids}</p>
        </div>
      )}
    </div>
  );
};

export default AssignableRolePicker;

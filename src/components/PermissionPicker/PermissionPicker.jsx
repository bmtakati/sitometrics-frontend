import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiShield, FiLoader, FiAlertCircle, FiSearch, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

/**
 * Animated toggle switch
 */
const Toggle = ({ checked, onChange, readOnly = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${readOnly ? 'cursor-default opacity-80 pointer-events-none' : 'cursor-pointer'} ${
      checked ? 'bg-primary-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

/**
 * PermissionPicker
 * Fetchs all permissions, groups them by module_name.
 * - Global select-all checkbox (with indeterminate)
 * - Per-module select-all checkbox (with indeterminate) + collapse/expand
 * - Individual permissions rendered as toggle switches
 */
const PermissionPicker = ({ value = [], onChange, errors = {}, readOnly = false }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  /** Convert snake_case / camelCase / PascalCase to Title Case */
  const formatModuleName = (name) => {
    if (!name || name === 'General') return name || 'General';
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase → words
      .replace(/[_\-]+/g, ' ')                // snake_case / kebab-case
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
  };
  const [permissions, setPermissions] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [permSearch, setPermSearch] = useState('');
  const [modSearch, setModSearch]   = useState('');

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChanged', handler);
    return () => window.removeEventListener('darkModeChanged', handler);
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/permissions?per_page=1000`);
        if (!res.ok) throw new Error('Failed to load permissions');
        const json = await res.json();
        const list = json.data?.data || json.data || json || [];
        setPermissions(list);

        const groups = {};
        list.forEach((p) => {
          const mod = p.module_name || 'General';
          if (!groups[mod]) groups[mod] = [];
          groups[mod].push(p);
        });
        setGrouped(groups);

        const expanded = {};
        Object.keys(groups).forEach((m) => {
          expanded[m] = readOnly
            ? groups[m].some((p) => value.map(Number).includes(p.id))  // auto-expand modules with selections
            : false;
        });
        setExpandedModules(expanded);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const selected = new Set(value.map(Number));
  const allIds = permissions.map((p) => p.id);

  const isAllSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const isIndeterminate = !isAllSelected && allIds.some((id) => selected.has(id));

  const moduleIds = (mod) => grouped[mod].map((p) => p.id);
  const isModuleAll = (mod) => moduleIds(mod).every((id) => selected.has(id));
  const isModuleIndeterminate = (mod) =>
    !isModuleAll(mod) && moduleIds(mod).some((id) => selected.has(id));

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };

  const toggleModule = (mod) => {
    const ids = moduleIds(mod);
    const next = new Set(selected);
    if (isModuleAll(mod)) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    onChange([...next]);
  };

  const toggleAll = () => (isAllSelected ? onChange([]) : onChange(allIds));

  const toggleExpand = (mod) =>
    setExpandedModules((prev) => ({ ...prev, [mod]: !prev[mod] }));

  // ── Styles ─────────────────────────────────────────────────────────────
  const cardBg    = darkMode ? 'bg-gray-800 border-gray-700'  : 'bg-gray-50 border-gray-300';
  const headerBg  = darkMode ? 'bg-gray-700/70'               : 'bg-gray-100';
  const rowHover  = darkMode ? 'hover:bg-gray-700/40'         : 'bg-white hover:bg-gray-50';
  const divider   = darkMode ? 'divide-gray-700'              : 'divide-gray-100';
  const textMain  = darkMode ? 'text-gray-200'                : 'text-gray-800';
  const textSub   = darkMode ? 'text-gray-500'                : 'text-gray-400';

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 flex items-center justify-center gap-2 ${cardBg}`}>
        <FiLoader className="w-5 h-5 animate-spin text-primary-500" />
        <span className="text-sm">Loading permissions…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={`rounded-xl border p-4 flex items-center gap-2 border-red-300 ${
        darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
      }`}>
        <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{fetchError}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Top label + global select-all — hidden in readOnly */}
      {!readOnly && (
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <FiShield className="w-4 h-4 text-primary-500" />
          Permissions
        </span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Select all ({allIds.length})
          </span>
        </label>
      </div>
      )}

      {readOnly && (
        <div className={`flex items-center justify-between mb-3`}>
          <span className={`text-sm font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <FiShield className="w-4 h-4 text-primary-500" />
            Assigned Permissions
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            selected.size > 0
              ? darkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-100 text-primary-700'
              : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}>
            {selected.size} / {allIds.length}
          </span>
        </div>
      )}

      {/* Search bar — hidden in readOnly */}
      {!readOnly && (
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <FiSearch className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            placeholder="Search permissions…"
            className={`w-full pl-8 pr-7 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none ${
              darkMode ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
            }`}
          />
          {permSearch && (
            <button type="button" onClick={() => setPermSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <FiX className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
        <div className="relative flex-1">
          <FiSearch className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={modSearch}
            onChange={(e) => setModSearch(e.target.value)}
            placeholder="Search modules…"
            className={`w-full pl-8 pr-7 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none ${
              darkMode ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
            }`}
          />
          {modSearch && (
            <button type="button" onClick={() => setModSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <FiX className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      )}

      {/* One card per module */}
      <div className="space-y-3">
        {Object.keys(grouped).sort()
        .filter((mod) => {
          // filter by module name
          if (modSearch && !mod.toLowerCase().includes(modSearch.toLowerCase())) return false;
          // filter by permission name (keep module if any permission matches)
          if (permSearch) {
            return grouped[mod].some((p) =>
              (p.display_name || p.name || '').toLowerCase().includes(permSearch.toLowerCase())
            );
          }
          return true;
        })
        .map((mod) => {
          // filter permissions within this module
          const filteredPerms = permSearch
            ? grouped[mod].filter((p) =>
                (p.display_name || p.name || '').toLowerCase().includes(permSearch.toLowerCase())
              )
            : grouped[mod];
          const mIds = moduleIds(mod);
          const expanded = expandedModules[mod];
          const selectedCount = mIds.filter((id) => selected.has(id)).length;

          return (
            <div key={mod} className={`rounded-xl border overflow-hidden ${cardBg}`}>
              {/* shadow the original grouped[mod] with filtered list inside the map */}
              {/* We use filteredPerms defined above */}
              {/* Module header */}
              <div className={`flex items-center gap-3 px-4 py-2.5 ${headerBg}`}>
                {/* Checkbox — hidden in readOnly or when module is collapsed */}
                {!readOnly && expanded && (
                  <input
                    type="checkbox"
                    checked={isModuleAll(mod)}
                    ref={(el) => { if (el) el.indeterminate = isModuleIndeterminate(mod); }}
                    onChange={() => toggleModule(mod)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-400 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                )}
                <button
                  type="button"
                  onClick={() => toggleExpand(mod)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  {expanded
                    ? <FiChevronDown className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    : <FiChevronRight className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                  <span className={`text-sm font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {formatModuleName(mod)}
                  </span>
                  <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    selectedCount > 0
                      ? darkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-100 text-primary-700'
                      : darkMode ? 'bg-gray-600 text-gray-400'       : 'bg-gray-200 text-gray-500'
                  }`}>
                    {selectedCount}/{mIds.length}
                  </span>
                </button>
              </div>

              {/* Individual permissions — toggle switches */}
              {expanded && (
                <div className={`divide-y ${divider}`}>
                  {filteredPerms.map((perm) => {
                    const on = selected.has(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => !readOnly && toggleOne(perm.id)}
                        className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${rowHover}`}
                      >
                        <div className="min-w-0">
                          <span className={`block text-sm font-medium ${textMain}`}>
                            {perm.display_name || perm.name}
                          </span>
                          {perm.description && (
                            <span className={`block text-xs truncate mt-0.5 ${textSub}`}>
                              {perm.description}
                            </span>
                          )}
                        </div>
                        <Toggle checked={on} onChange={() => !readOnly && toggleOne(perm.id)} readOnly={readOnly} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errors.permissions && (
        <p className="mt-1 text-sm text-red-500">{errors.permissions}</p>
      )}

      {selected.size > 0 && (
        <p className={`text-xs pt-1.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
          {selected.size} permission{selected.size !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default PermissionPicker;

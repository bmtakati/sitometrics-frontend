import React, { useState, useEffect } from 'react';
import { FiShield, FiLoader, FiAlertCircle, FiCheck, FiSearch, FiX, FiLayers } from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

/**
 * RolePicker
 * Fetches only the roles the logged-in user is permitted to assign
 * (GET /api/users/assignable-roles, backed by the delegation table) and
 * renders them as a scrollable checkbox list with name + description.
 * Supports multi-select.
 *
 * @param {number[]} value    - Currently selected role IDs
 * @param {function} onChange - Called with new array of IDs on change
 * @param {object}   errors   - Validation errors (reads errors.role_ids)
 */
const RolePicker = ({ value = [], onChange, errors = {} }) => {
  const [roles, setRoles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/users/assignable-roles`);
        if (!res.ok) throw new Error('Failed to load roles');
        const json = await res.json();
        const list = json.data || json || [];
        setRoles(Array.isArray(list) ? list : []);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = new Set(value.map(Number));

  const filtered = search.trim()
    ? roles.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : roles;

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  };

  const isAllSelected   = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const isIndeterminate = !isAllSelected && filtered.some((r) => selected.has(r.id));

  const toggleAll = () => {
    if (isAllSelected) {
      // deselect only the currently visible filtered roles
      const filteredIds = new Set(filtered.map((r) => r.id));
      onChange(value.filter((id) => !filteredIds.has(Number(id))));
    } else {
      const next = new Set(value.map(Number));
      filtered.forEach((r) => next.add(r.id));
      onChange([...next]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
        <FiLoader className="w-4 h-4 animate-spin" />
        Loading roles…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
        {fetchError}
      </div>
    );
  }

  if (!roles.length) {
    return <p className="text-sm text-gray-400 italic">No roles available.</p>;
  }

  const selectedRoles = roles.filter((r) => selected.has(r.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-600">
          <FiShield className="w-4 h-4 text-primary-600" />
          Roles *
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <div
            onClick={toggleAll}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors
              ${isAllSelected
                ? 'bg-primary-600 border-primary-600'
                : isIndeterminate
                  ? 'bg-primary-100 border-primary-400'
                  : 'border-gray-300 hover:border-primary-400'}`}
          >
            {isAllSelected && <FiCheck className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            {isIndeterminate && <span className="w-2 h-0.5 bg-primary-600 block" />}
          </div>
          {search.trim() ? 'Select visible' : 'Select all'}
        </label>
      </div>

      {/* Selected role chips */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-primary-50 border border-primary-200 rounded-lg">
          {selectedRoles.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded-full"
            >
              {role.name}
              <button
                type="button"
                onClick={() => toggle(role.id)}
                className="ml-0.5 rounded-full hover:bg-primary-500 transition-colors p-0.5 -mr-0.5"
                aria-label={`Remove ${role.name}`}
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search box */}
      <div className="relative mb-2">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900 placeholder-gray-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden max-h-64 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 italic px-4 py-3">No roles match your search.</p>
        ) : (
          (() => {
            // Group filtered roles by geographical level
            const groups = {};
            filtered.forEach((r) => {
              const level = r.geographical_level?.name ?? 'Unscoped / HQ';
              if (!groups[level]) groups[level] = [];
              groups[level].push(r);
            });
            return Object.entries(groups).map(([level, list]) => (
              <div key={level}>
                {/* Group header */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-gray-100 sticky top-0 z-10">
                  <FiLayers className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{level}</span>
                  <span className="ml-auto text-xs text-gray-300">
                    {list.filter((r) => selected.has(r.id)).length}/{list.length}
                  </span>
                </div>
                {/* Roles in group */}
                <div className="divide-y divide-gray-100">
                  {list.map((role) => {
                    const isChecked = selected.has(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none
                          ${isChecked ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                              ${isChecked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}
                          >
                            {isChecked && <FiCheck className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => toggle(role.id)}>
                          <p className="text-sm font-medium text-gray-900">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{role.description}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        )}
      </div>

      {errors.role_ids && (
        <p className="mt-1 text-sm text-red-600">{errors.role_ids}</p>
      )}
      {!errors.role_ids && value.length === 0 && (
        <p className="mt-1 text-xs text-gray-400">Select at least one role</p>
      )}
    </div>
  );
};

export default RolePicker;

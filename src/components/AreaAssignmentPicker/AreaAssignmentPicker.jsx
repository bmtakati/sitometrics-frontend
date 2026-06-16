import React, { useState, useEffect, useCallback } from 'react';
import {
  FiMapPin, FiLoader, FiAlertCircle, FiX, FiSearch,
  FiPlus, FiShield, FiGlobe, FiInfo, FiCheck, FiChevronRight
} from 'react-icons/fi';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

/* ─── Geo-level resolution ─────────────────────────────────────────────────
   Maps a role's geographical_level name → an internal config used for
   fetching areas and posting assignments.

   Each level (except region) has a `cascade` array that describes the
   parent selector steps the user must complete before the final area list
   is shown.
───────────────────────────────────────────────────────────────────────────── */
const LEVEL_CONFIGS = {
  region: {
    label: 'Region',
    levelType: 'region',
    nameKey: 'name',
    idKey: 'id',
    cascade: [],
    apiAll: () => '/api/regions/all',
  },
  council: {
    label: 'Council',
    levelType: 'council',
    nameKey: 'name',
    idKey: 'id',
    cascade: [
      {
        key: 'region',
        label: 'Region',
        apiAll: () => '/api/regions/all',
      },
    ],
    apiAll: (filters) =>
      `/api/councils/all${filters.region ? `?region_id=${filters.region}` : ''}`,
  },
  ward: {
    label: 'Ward',
    levelType: 'ward',
    nameKey: 'name',
    idKey: 'id',
    cascade: [
      {
        key: 'region',
        label: 'Region',
        apiAll: () => '/api/regions/all',
      },
      {
        key: 'council',
        label: 'Council',
        apiAll: (filters) => `/api/councils/all?region_id=${filters.region}`,
        dependsOn: 'region',
      },
    ],
    apiAll: (filters) =>
      `/api/wards/all${filters.council ? `?council_id=${filters.council}` : ''}`,
  },
  village: {
    label: 'Street/Village',
    levelType: 'village',
    nameKey: 'name',
    idKey: 'code',
    cascade: [
      {
        key: 'region',
        label: 'Region',
        apiAll: () => '/api/regions/all',
      },
      {
        key: 'council',
        label: 'Council',
        apiAll: (filters) => `/api/councils/all?region_id=${filters.region}`,
        dependsOn: 'region',
      },
      {
        key: 'ward',
        label: 'Ward',
        apiAll: (filters) => `/api/wards/all?council_id=${filters.council}`,
        dependsOn: 'council',
      },
    ],
    apiAll: (filters) =>
      `/api/street-villages/all${filters.ward ? `?ward_id=${filters.ward}` : ''}`,
  },
  school: {
    label: 'School',
    levelType: 'school',
    nameKey: 'name',
    idKey: 'id',
    cascade: [
      {
        key: 'region',
        label: 'Region',
        apiAll: () => '/api/regions/all',
      },
      {
        key: 'council',
        label: 'Council',
        apiAll: (filters) => `/api/councils/all?region_id=${filters.region}`,
        dependsOn: 'region',
      },
      {
        key: 'ward',
        label: 'Ward',
        apiAll: (filters) => `/api/wards/all?council_id=${filters.council}`,
        dependsOn: 'council',
      },
      {
        key: 'village',
        label: 'Street/Village (optional)',
        apiAll: (filters) => `/api/street-villages/all?ward_id=${filters.ward}`,
        dependsOn: 'ward',
        optional: true,
        valueKey: 'code',  // villages use code not id as the FK on schools
      },
    ],
    apiAll: (filters) => {
      const params = new URLSearchParams();
      if (filters.region)  params.set('region_id',    filters.region);
      if (filters.council) params.set('council_id',   filters.council);
      if (filters.ward)    params.set('ward_id',      filters.ward);
      if (filters.village) params.set('village_code', filters.village);
      return `/api/schools/all?${params.toString()}`;
    },
  },
};

/** Resolve a level-type string from a role's geographical_level name */
function resolveLevelKey(geoLevelName) {
  if (!geoLevelName) return null;
  const n = geoLevelName.toLowerCase();
  if (/hq/.test(n)) return 'hq';
  if (/region/.test(n)) return 'region';
  if (/district|council/.test(n)) return 'council';
  if (/ward/.test(n)) return 'ward';
  if (/village|street/.test(n)) return 'village';
  if (/school/.test(n)) return 'school';
  return null;
}

/* ─── CascadeStep ──────────────────────────────────────────────────────────
   Renders a single parent-level select dropdown row for cascade filtering.
───────────────────────────────────────────────────────────────────────────── */
const CascadeStep = ({ step, value, options, loading, onChange, darkMode, isLast }) => {
  const selectCls = `w-full py-2 pl-3 pr-8 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } ${loading ? 'opacity-60 cursor-wait' : ''}`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {step.label}
        </label>
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className={selectCls}
          >
            <option value="">— Select {step.label} —</option>
            {options.map((opt) => {
              const val = step.valueKey ? opt[step.valueKey] : (opt.id ?? opt.code);
              return (
                <option key={val} value={val}>{opt.name}</option>
              );
            })}
          </select>
          {loading && (
            <FiLoader className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
          )}
        </div>
      </div>
      {!isLast && value && (
        <FiChevronRight className={`w-4 h-4 mt-5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      )}
    </div>
  );
};

/**
 * AreaAssignmentPicker
 *
 * Shows & manages the geographical scope assignments for a user.
 * For council / ward / village levels, displays cascaded parent selectors
 * (region → council → ward) before showing the final area list.
 *
 * Props
 *  userId       – number | null   (null = new user not yet saved)
 *  roleIds      – number[]        (selected role IDs)
 *  darkMode     – boolean
 *  readOnly     – boolean         (view-only mode, no API mutations)
 */
const AreaAssignmentPicker = ({ userId, roleIds = [], darkMode = false, readOnly = false }) => {
  const [roleMap, setRoleMap]         = useState({});   // id → role object
  const [assignments, setAssignments] = useState([]);   // current assignments
  const [availableAreas, setAvailableAreas] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);
  const [saving, setSaving]           = useState(null); // id being removed
  const [addLoading, setAddLoading]   = useState(false);
  const [search, setSearch]           = useState('');
  const [error, setError]             = useState(null);
  const [addError, setAddError]       = useState(null);

  // Cascade drill-down state
  // cascadeSelected: { region: '5', council: '12', ward: '' }
  // cascadeOptions:  { region: [...], council: [...], ward: [] }
  // cascadeLoading:  { region: false, council: true, ward: false }
  const [cascadeSelected, setCascadeSelected] = useState({});
  const [cascadeOptions,  setCascadeOptions]  = useState({});
  const [cascadeLoading,  setCascadeLoading]  = useState({});

  /* ── Step 1: Load roles (to resolve geo level) ──────────────────────── */
  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_BASE_URL}/api/roles/all`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = json.data || json || [];
        const map = {};
        (Array.isArray(list) ? list : []).forEach((r) => { map[r.id] = r; });
        setRoleMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* ── Derive the effective geo-level key from selected roles ─────────── */
  const levelKey = (() => {
    const keys = roleIds
      .map((id) => roleMap[id])
      .filter(Boolean)
      .map((r) => resolveLevelKey(r.geographical_level?.name || r.geographical_level));
    const specific = keys.find((k) => k && k !== 'hq' && k !== 'school');
    if (specific) return specific;
    const all = keys.filter(Boolean);
    if (all.length === 0) return null;
    return all[0];
  })();

  const levelCfg = levelKey && LEVEL_CONFIGS[levelKey] ? LEVEL_CONFIGS[levelKey] : null;

  /* ── Reset cascade when level changes ───────────────────────────────── */
  useEffect(() => {
    setCascadeSelected({});
    setCascadeOptions({});
    setCascadeLoading({});
    setAvailableAreas([]);
    setSearch('');
  }, [levelKey]);

  /* ── Pre-load first cascade step (regions) on mount if needed ───────── */
  useEffect(() => {
    if (!levelCfg || levelCfg.cascade.length === 0) return;
    const firstStep = levelCfg.cascade[0];
    let cancelled = false;
    setCascadeLoading((prev) => ({ ...prev, [firstStep.key]: true }));
    apiFetch(`${API_BASE_URL}${firstStep.apiAll({})}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = json.data || json || [];
        setCascadeOptions((prev) => ({ ...prev, [firstStep.key]: Array.isArray(list) ? list : [] }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCascadeLoading((prev) => ({ ...prev, [firstStep.key]: false }));
      });
    return () => { cancelled = true; };
  }, [levelKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load available areas when level requires no cascade (region) ────── */
  useEffect(() => {
    if (!levelCfg || levelCfg.cascade.length !== 0) return;
    let cancelled = false;
    setAreaLoading(true);
    apiFetch(`${API_BASE_URL}${levelCfg.apiAll({})}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const raw = json.data || json || [];
        setAvailableAreas(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAreaLoading(false); });
    return () => { cancelled = true; };
  }, [levelKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load current assignments when userId changes ───────────────────── */
  const loadAssignments = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    apiFetch(`${API_BASE_URL}/api/users/${userId}/area-assignments`)
      .then((r) => r.json())
      .then((json) => {
        const list = json.data || json || [];
        setAssignments(Array.isArray(list) ? list : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  /* ── Cascade change handler ──────────────────────────────────────────── */
  const handleCascadeChange = useCallback(async (stepKey, stepIndex, value) => {
    if (!levelCfg) return;

    // Update selected value for this step and clear all downstream steps
    const newSelected = { ...cascadeSelected, [stepKey]: value };
    const newOptions  = { ...cascadeOptions };
    const newLoading  = { ...cascadeLoading };

    for (let i = stepIndex + 1; i < levelCfg.cascade.length; i++) {
      const k = levelCfg.cascade[i].key;
      newSelected[k] = '';
      newOptions[k]  = [];
      newLoading[k]  = false;
    }

    setCascadeSelected(newSelected);
    setCascadeOptions(newOptions);
    setCascadeLoading(newLoading);

    if (!value) {
      setAvailableAreas([]);
      return;
    }

    // All required (non-optional) steps complete?
    const requiredComplete = levelCfg.cascade
      .filter((s) => !s.optional)
      .every((s) => !!newSelected[s.key]);

    // Always start loading next step's options (if one exists)
    const nextStep = levelCfg.cascade[stepIndex + 1];
    if (nextStep) {
      setCascadeLoading((prev) => ({ ...prev, [nextStep.key]: true }));
      apiFetch(`${API_BASE_URL}${nextStep.apiAll(newSelected)}`)
        .then((r) => r.json())
        .then((json) => {
          const list = json.data || json || [];
          setCascadeOptions((prev) => ({ ...prev, [nextStep.key]: Array.isArray(list) ? list : [] }));
        })
        .catch(() => setCascadeOptions((prev) => ({ ...prev, [nextStep.key]: [] })))
        .finally(() => setCascadeLoading((prev) => ({ ...prev, [nextStep.key]: false })));
    }

    // Load the area list whenever required steps are all satisfied
    // (triggers at the last required step AND every time an optional step changes)
    if (requiredComplete) {
      setAreaLoading(true);
      try {
        const url  = `${API_BASE_URL}${levelCfg.apiAll(newSelected)}`;
        const res  = await apiFetch(url);
        const json = await res.json();
        const raw  = json.data || json || [];
        setAvailableAreas(Array.isArray(raw) ? raw : []);
      } catch (_) {
        setAvailableAreas([]);
      } finally {
        setAreaLoading(false);
      }
    } else {
      setAvailableAreas([]);
    }
  }, [levelCfg, cascadeSelected, cascadeOptions, cascadeLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Cascade completeness check ─────────────────────────────────────── */
  const needsCascade    = levelCfg && levelCfg.cascade.length > 0;
  const cascadeComplete = !needsCascade || (
    levelCfg.cascade.filter((s) => !s.optional).every((s) => !!cascadeSelected[s.key])
  );

  /* ── Add / Remove handlers ───────────────────────────────────────────── */
  const handleAdd = async (area) => {
    if (!userId || !levelCfg) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const isVillage = levelCfg.levelType === 'village';
      const payload = [{
        level_type:   levelCfg.levelType,
        area_id:      isVillage ? null : (area.id ?? null),
        village_code: isVillage ? (area.code ?? null) : null,
      }];
      const res = await apiFetch(`${API_BASE_URL}/api/users/${userId}/area-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Failed to add assignment');
      }
      const json = await res.json();
      const list = json.data || json || [];
      setAssignments(Array.isArray(list) ? list : []);
      setSearch('');
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (assignment) => {
    if (!userId) return;
    setSaving(assignment.id);
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/api/users/${userId}/area-assignments/${assignment.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove assignment');
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const assignedAreaIds = new Set(
    assignments.map((a) => (levelCfg?.levelType === 'village' ? a.village_code : String(a.area_id)))
  );

  const filteredAreas = search.trim()
    ? availableAreas.filter((a) =>
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.code?.toLowerCase().includes(search.toLowerCase())
      )
    : availableAreas;

  const unassignedAreas = filteredAreas.filter((a) => {
    const key = levelCfg?.levelType === 'village' ? a.code : String(a.id);
    return !assignedAreaIds.has(key);
  });

  /* ── Render ──────────────────────────────────────────────────────────── */
  const containerCls = `space-y-4`;
  const sectionCls   = `rounded-xl border p-4 ${
    darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-2 ${
    darkMode ? 'text-gray-400' : 'text-gray-500'
  }`;
  const tagBase = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border`;

  /* New user — no ID yet */
  if (!userId) {
    return (
      <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${
        darkMode ? 'bg-blue-950/30 border-blue-800' : 'bg-blue-50 border-blue-200'
      }`}>
        <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          Save the user first, then return to edit their area scope assignments.
        </p>
      </div>
    );
  }

  /* No roles selected yet */
  if (!roleIds.length) {
    return (
      <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${
        darkMode ? 'bg-yellow-950/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-500" />
        <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
          Select at least one role in the Roles tab to configure area scope.
        </p>
      </div>
    );
  }

  /* Roles loaded but no geo level found yet (roleMap empty) */
  if (Object.keys(roleMap).length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
        <FiLoader className="w-4 h-4 animate-spin" /> Resolving scope level…
      </div>
    );
  }

  /* HQ — unrestricted */
  if (levelKey === 'hq') {
    return (
      <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${
        darkMode ? 'bg-green-950/30 border-green-800' : 'bg-green-50 border-green-200'
      }`}>
        <FiGlobe className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
        <div>
          <p className={`text-sm font-semibold mb-0.5 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
            Unrestricted Access (HQ)
          </p>
          <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            Users with HQ-level roles can view data across all geographical areas.
            No area assignments are required.
          </p>
        </div>
      </div>
    );
  }

  /* School-level falls through to the main area-picker UI below */

  /* Unknown level */
  if (!levelCfg) {
    return (
      <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${
        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
      }`}>
        <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          The roles assigned to this user have no geographical level defined.
          Update the roles to enable area scoping.
        </p>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      {/* Level indicator */}
      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <FiMapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <span className="text-sm">
          Scope level: <span className="font-semibold text-primary-600">{levelCfg.label}</span>
        </span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          darkMode ? 'bg-primary-900/40 text-primary-300' : 'bg-primary-50 text-primary-700 border border-primary-200'
        }`}>
          {assignments.length} area{assignments.length !== 1 ? 's' : ''} assigned
        </span>
      </div>

      {error && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
          darkMode ? 'bg-red-950/40 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Current Assignments */}
      <div className={sectionCls}>
        <span className={labelCls}>
          Assigned {levelCfg.label}s
        </span>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <FiLoader className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : assignments.length === 0 ? (
          <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No areas assigned — this user cannot view any schools.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => {
              const name =
                a.level_type === 'region'  ? (a.region?.name   || `Region #${a.area_id}`) :
                a.level_type === 'council' ? (a.council?.name  || `Council #${a.area_id}`) :
                a.level_type === 'ward'    ? (a.ward?.name     || `Ward #${a.area_id}`) :
                a.level_type === 'village' ? (a.village?.name  || a.village_code) :
                a.level_type === 'school'  ? (a.school?.name   || `School #${a.area_id}`) :
                `Area #${a.area_id ?? a.village_code}`;
              const isBusy = saving === a.id;
              return (
                <span
                  key={a.id}
                  className={`${tagBase} ${
                    darkMode
                      ? 'bg-primary-900/40 border-primary-700 text-primary-300'
                      : 'bg-primary-50 border-primary-200 text-primary-700'
                  }`}
                >
                  <FiMapPin className="w-3 h-3 flex-shrink-0" />
                  {name}
                  {!readOnly && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRemove(a)}
                      className={`ml-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors p-0.5 ${
                        isBusy ? 'opacity-50 cursor-wait' : ''
                      }`}
                      title="Remove"
                    >
                      {isBusy
                        ? <FiLoader className="w-3 h-3 animate-spin" />
                        : <FiX className="w-3 h-3" />}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Add area (edit mode only) */}
      {!readOnly && (
        <div className={sectionCls}>
          <span className={labelCls}>Add {levelCfg.label}</span>

          {addError && (
            <p className="mb-2 text-xs text-red-500">{addError}</p>
          )}

          {/* ── Cascade drill-down selectors ─────────────────────────────── */}
          {needsCascade && (
            <div className="mb-4 space-y-3">
              {levelCfg.cascade.map((step, idx) => {
                // A step is enabled when all previous steps have been selected
                const prevComplete = idx === 0 || levelCfg.cascade
                  .slice(0, idx)
                  .every((s) => !!cascadeSelected[s.key]);
                const opts = prevComplete ? (cascadeOptions[step.key] || []) : [];
                return (
                  <CascadeStep
                    key={step.key}
                    step={step}
                    value={cascadeSelected[step.key] || ''}
                    options={opts}
                    loading={!!cascadeLoading[step.key]}
                    onChange={(val) => handleCascadeChange(step.key, idx, val)}
                    darkMode={darkMode}
                    isLast={idx === levelCfg.cascade.length - 1}
                  />
                );
              })}

              {/* Breadcrumb showing the current cascade selection */}
              {cascadeComplete && (
                <div className={`flex items-center gap-1 text-xs mt-1 flex-wrap ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {levelCfg.cascade.map((step, idx) => {
                    const opts = cascadeOptions[step.key] || [];
                    const chosen = opts.find((o) => {
                      const val = step.valueKey ? o[step.valueKey] : (o.id ?? o.code);
                      return String(val) === String(cascadeSelected[step.key]);
                    });
                    return (
                      <React.Fragment key={step.key}>
                        {idx > 0 && <FiChevronRight className="w-3 h-3 flex-shrink-0" />}
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {chosen?.name || cascadeSelected[step.key]}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Hint when cascade not complete yet */}
          {needsCascade && !cascadeComplete && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-2 ${
              darkMode ? 'bg-gray-700/60 border border-gray-600 text-gray-400' : 'bg-gray-100 border border-gray-200 text-gray-500'
            }`}>
              <FiInfo className="w-4 h-4 flex-shrink-0" />
              Select {levelCfg.cascade.find((s) => !s.optional && !cascadeSelected[s.key])?.label} above to continue.
            </div>
          )}

          {/* Search — shown only when cascade is complete (or not needed) */}
          {cascadeComplete && (
            <>
              <div className="relative mb-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${levelCfg.label.toLowerCase()}s…`}
                  className={`w-full pl-8 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
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

              {/* Area list */}
              {areaLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <FiLoader className="w-4 h-4 animate-spin" /> Loading areas…
                </div>
              ) : (
                <div className={`border rounded-lg divide-y max-h-44 overflow-y-auto ${
                  darkMode ? 'border-gray-600 divide-gray-600 bg-gray-700/50' : 'border-gray-200 divide-gray-100 bg-white'
                }`}>
                  {unassignedAreas.length === 0 ? (
                    <p className={`text-sm italic px-4 py-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {availableAreas.length === 0
                        ? `No ${levelCfg.label.toLowerCase()}s found — sync from SIS first.`
                        : `All available ${levelCfg.label.toLowerCase()}s are already assigned.`}
                    </p>
                  ) : (
                    unassignedAreas.map((area) => {
                      const alreadyAssigned = assignedAreaIds.has(
                        levelCfg.levelType === 'village' ? area.code : String(area.id)
                      );
                      return (
                        <button
                          key={area.id ?? area.code}
                          type="button"
                          disabled={addLoading || alreadyAssigned}
                          onClick={() => handleAdd(area)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors
                            ${alreadyAssigned
                              ? darkMode ? 'text-green-400 cursor-default' : 'text-green-600 cursor-default'
                              : addLoading
                              ? 'opacity-50 cursor-wait'
                              : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <span className="truncate">{area.name}</span>
                          {alreadyAssigned
                            ? <FiCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                            : addLoading
                            ? <FiLoader className="w-3.5 h-3.5 flex-shrink-0 animate-spin text-gray-400" />
                            : <FiPlus className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaAssignmentPicker;

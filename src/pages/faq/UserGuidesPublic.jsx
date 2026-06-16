import React, { useEffect, useMemo, useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { FaFilePdf } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import SearchFilter from '../../components/SearchFilter';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { resolveApiAssetUrl } from '../../utils/resolveApiAssetUrl';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/** Public listing — GET /api/faq/guides + /api/faq/guide-types (no auth). */
const UserGuidesPublic = () => {
  const [guides, setGuides] = useState([]);
  /** { code -> name } from FAQ → Guide Types (active). */
  const [guideTypeCodeToName, setGuideTypeCodeToName] = useState({});
  const [guideTypeFilterOptions, setGuideTypeFilterOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | guide type code
  const [previewGuide, setPreviewGuide] = useState(null);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handle = (event) => setDarkMode(event.detail.darkMode);
    window.addEventListener('darkModeChanged', handle);
    return () => window.removeEventListener('darkModeChanged', handle);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [guidesRes, typesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/faq/guides`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_BASE_URL}/api/faq/guide-types`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
        ]);

        const payload = await guidesRes.json().catch(() => ({}));
        if (!guidesRes.ok) throw new Error(payload?.message || 'Failed to load guides');
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setGuides(data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));

        const typesPayload = await typesRes.json().catch(() => ({}));
        if (typesRes.ok && Array.isArray(typesPayload?.data)) {
          const sorted = [...typesPayload.data].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          const map = {};
          const opts = [];
          sorted.forEach((row) => {
            const code = row?.code != null ? String(row.code).trim() : '';
            if (!code) return;
            map[code] = row.name || code;
            opts.push({ label: row.name || code, value: code });
          });
          setGuideTypeCodeToName(map);
          setGuideTypeFilterOptions(opts);
        } else {
          setGuideTypeCodeToName({});
          setGuideTypeFilterOptions([]);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') setLoadError(e?.message || 'Failed to load');
        setGuides([]);
        setGuideTypeCodeToName({});
        setGuideTypeFilterOptions([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    return guides.filter((g) => {
      const gCode = String(g.type || '').trim();
      if (typeFilter !== 'all' && gCode.toLowerCase() !== String(typeFilter).toLowerCase()) return false;

      if (!q) return true;
      const typeName = guideTypeCodeToName[g.type] || guideTypeCodeToName[gCode] || '';
      const t = `${g.title || ''} ${g.description || ''} ${gCode} ${typeName} ${g.code || ''}`.toLowerCase();
      return t.includes(q);
    });
  }, [guides, searchTerm, typeFilter, guideTypeCodeToName]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader icon={FaFilePdf} title="User Guides" subtitle="Downloadable guides and documentation" actions={[]} />

      {loadError ? (
        <div
          className={`mb-6 rounded-xl border p-4 ${darkMode ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}
        >
          {loadError}
        </div>
      ) : null}

      <SearchFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search guides..."
        filterOptions={[
          { label: 'All guide types', value: 'all' },
          ...guideTypeFilterOptions,
        ]}
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        showClearButton={true}
        customFilters={null}
        onClear={() => {
          setSearchTerm('');
          setTypeFilter('all');
        }}
      />

      {loading ? (
        <div
          className={`mt-6 rounded-2xl border p-10 flex items-center justify-center ${
            darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
          }`}
        >
          <FiLoader className={`w-8 h-8 ${darkMode ? 'text-primary-400' : 'text-primary-600'} animate-spin`} />
          <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <div
              className={`md:col-span-2 rounded-2xl border p-8 text-center ${
                darkMode ? 'bg-gray-800/40 border-gray-700 text-gray-300' : 'bg-stone-100 border-stone-300 text-gray-700'
              }`}
            >
              No user guides available yet.
            </div>
          ) : (
            filtered.map((g) => {
              const href = resolveApiAssetUrl(g.download_url || '');
              const typeLabel = guideTypeCodeToName[String(g.type || '').trim()] || g.type || '';
              const meta = [typeLabel, g.size || g.duration].filter(Boolean).join(' · ');
              return (
                <div
                  key={g.id ?? g.code ?? g.title}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${
                        darkMode ? 'border-red-500/40 bg-red-950/20' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <FaFilePdf
                        className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{g.title}</h3>
                      {meta ? (
                        <p
                          className={`text-xs mt-1 uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {meta}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {g.description ? (
                    <p className={`mt-3 text-sm flex-1 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {g.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    {href ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewGuide(g)}
                          className={`inline-flex items-center gap-2 text-sm font-semibold ${
                            darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'
                          }`}
                        >
                          <FaFilePdf className="w-4 h-4" aria-hidden />
                          Preview document
                        </button>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-sm font-medium ${
                            darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Open in new tab
                        </a>
                      </>
                    ) : (
                      <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No file attached</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <DocumentPreviewModal
        isOpen={!!previewGuide?.download_url}
        title={previewGuide?.title || 'Document'}
        url={previewGuide?.download_url ? resolveApiAssetUrl(previewGuide.download_url) : ''}
        onClose={() => setPreviewGuide(null)}
      />
    </div>
  );
};

export default UserGuidesPublic;

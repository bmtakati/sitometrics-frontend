import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiChevronDown, FiLoader } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import SearchFilter from '../../components/SearchFilter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const displayQuestionCategoryLabel = (name) =>
  String(name || '')
    .replace(/\s*\(Admin\)\s*$/i, '')
    .trim();

/** Public troubleshooting — GET /api/faq/troubleshooting + /api/faq/question-categories (no auth). */
const TroubleshootingPublic = () => {
  const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const [items, setItems] = useState([]);
  /** Active category names from FAQ → Question Categories (same order as admin). */
  const [questionCategoryNames, setQuestionCategoryNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | category name
  const [expandedId, setExpandedId] = useState(null);

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
        const [trRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/faq/troubleshooting`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_BASE_URL}/api/faq/question-categories`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
        ]);
        const payload = await trRes.json().catch(() => ({}));
        if (!trRes.ok) throw new Error(payload?.message || 'Failed to load troubleshooting');
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setItems(data);

        const catPayload = await catRes.json().catch(() => ({}));
        if (catRes.ok && Array.isArray(catPayload?.data)) {
          const names = [...catPayload.data]
            .filter((c) => c?.name)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((c) => String(c.name).trim())
            .filter(Boolean);
          setQuestionCategoryNames(names);
        } else {
          setQuestionCategoryNames([]);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') setLoadError(e?.message || 'Failed to load');
        setItems([]);
        setQuestionCategoryNames([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const publicItems = useMemo(() => {
    if (questionCategoryNames.length === 0) return items;
    const allowed = new Set(
      questionCategoryNames.map((n) => String(n).trim().toLowerCase()).filter(Boolean)
    );
    return items.filter((row) => {
      const c = String(row.category || '').trim();
      if (!c) return true;
      return allowed.has(c.toLowerCase());
    });
  }, [items, questionCategoryNames]);

  const filtered = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    const tf = String(typeFilter || 'all').toLowerCase();

    return publicItems.filter((row) => {
      const cat = String(row.category || '').trim();
      if (tf !== 'all' && cat.toLowerCase() !== tf.toLowerCase()) return false;

      if (!q) return true;
      const prob = stripHtml(row.problem).toLowerCase();
      const catLower = cat.toLowerCase();
      const solText = Array.isArray(row.solutions)
        ? row.solutions
            .map((s) => (typeof s === 'string' ? s : s?.solution))
            .map(stripHtml)
            .join(' ')
        : '';
      return (
        prob.includes(q) ||
        catLower.includes(q) ||
        String(solText).toLowerCase().includes(q)
      );
    });
  }, [publicItems, searchTerm, typeFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon={FiAlertCircle}
        title="Troubleshooting"
        subtitle="Common issues and how to resolve them"
        actions={[]}
      />

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
        searchPlaceholder="Search problem, category, or solution..."
        filterOptions={[
          { label: 'All categories', value: 'all' },
          ...questionCategoryNames.map((name) => ({
            label: displayQuestionCategoryLabel(name),
            value: name,
          })),
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
        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'}`}>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>No matching troubleshooting topics.</p>
            </div>
          ) : (
            filtered.map((row) => {
              const id = row.id;
              const isOpen = expandedId === id;
              const solutions = Array.isArray(row.solutions) ? row.solutions : [];
              return (
                <div
                  key={id}
                  className={`rounded-2xl border overflow-hidden ${
                    darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : id)}
                    className={`w-full px-6 py-5 flex items-start justify-between text-left gap-4 ${
                      darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-primary-300' : 'text-primary-600'}`}>
                        {row.category ? displayQuestionCategoryLabel(row.category) : 'General'}
                      </p>
                      <p className={`mt-1 font-semibold text-base md:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stripHtml(row.problem)}
                      </p>
                    </div>
                    <FiChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                    <div className={`px-6 pb-6 pt-0 border-t space-y-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {solutions.length === 0 ? (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No solutions listed.</p>
                      ) : (
                        <ol className={`list-decimal pl-5 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {solutions.map((s, idx) => (
                            <li key={s?.id ?? idx} className="leading-relaxed">
                              <span
                                dangerouslySetInnerHTML={{ __html: typeof s === 'string' ? s : s?.solution || '' }}
                              />
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TroubleshootingPublic;

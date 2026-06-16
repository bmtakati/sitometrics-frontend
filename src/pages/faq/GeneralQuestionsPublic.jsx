import React, { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiLoader,
  FiMessageSquare,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import SearchFilter from '../../components/SearchFilter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const FAQ_LIST_PAGE_SIZE = 5;

const displayQuestionCategoryLabel = (name) =>
  String(name || '')
    .replace(/\s*\(Admin\)\s*$/i, '')
    .trim();

/** Public FAQ — GET /api/faq/general + /api/faq/question-categories (no auth). */
const GeneralQuestionsPublic = () => {
  const [faqs, setFaqs] = useState([]);
  /** Active category names from FAQ → Question Categories (same order as admin). */
  const [questionCategoryNames, setQuestionCategoryNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
        const [generalRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/faq/general`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_BASE_URL}/api/faq/question-categories`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
        ]);
        const generalPayload = await generalRes.json().catch(() => ({}));
        if (!generalRes.ok) throw new Error(generalPayload?.message || 'Failed to load questions');
        const items = Array.isArray(generalPayload?.data) ? generalPayload.data : [];
        setFaqs(items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));

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
        setFaqs([]);
        setQuestionCategoryNames([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const [activeFaqCategory, setActiveFaqCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqListPage, setFaqListPage] = useState(1);

  const categories = useMemo(() => ['all', ...questionCategoryNames], [questionCategoryNames]);

  /** Drop items tied to inactive / unknown categories when we have an active category list (defense in depth; API also filters). */
  const publicFaqs = useMemo(() => {
    if (questionCategoryNames.length === 0) return faqs;
    const allowed = new Set(
      questionCategoryNames.map((n) => String(n).trim().toLowerCase()).filter(Boolean)
    );
    return faqs.filter((f) => {
      const c = String(f.category || '').trim();
      if (!c) return true;
      return allowed.has(c.toLowerCase());
    });
  }, [faqs, questionCategoryNames]);

  const filteredFaqs = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    const base =
      activeFaqCategory === 'all'
        ? publicFaqs
        : publicFaqs.filter((f) => String(f.category || '').trim() === activeFaqCategory);
    if (!q) return base;
    return base.filter(
      (f) =>
        String(f.question || '').toLowerCase().includes(q) ||
        String(f.answer || '').toLowerCase().includes(q)
    );
  }, [searchTerm, activeFaqCategory, publicFaqs]);

  const faqTotalPages = Math.max(1, Math.ceil(filteredFaqs.length / FAQ_LIST_PAGE_SIZE));
  const faqPageStart = (faqListPage - 1) * FAQ_LIST_PAGE_SIZE;
  const paginatedFaqs = filteredFaqs.slice(faqPageStart, faqPageStart + FAQ_LIST_PAGE_SIZE);

  useEffect(() => {
    setFaqListPage(1);
  }, [activeFaqCategory, searchTerm]);

  useEffect(() => {
    setFaqListPage((p) => Math.min(Math.max(1, p), faqTotalPages));
  }, [faqTotalPages]);

  const pageConfig = {
    icon: FiMessageSquare,
    title: 'General Questions',
    subtitle: 'Browse frequently asked questions',
    searchPlaceholder: 'Search questions...',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader icon={pageConfig.icon} title={pageConfig.title} subtitle={pageConfig.subtitle} actions={[]} />

      {loadError ? (
        <div
          className={`mb-6 rounded-xl border p-4 ${darkMode ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}
        >
          {loadError}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className={`lg:w-80 hidden lg:block`}>
          <div
            className={`rounded-2xl border p-5 ${
              darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Question categories</h3>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const isActive = activeFaqCategory === cat;
                const label = cat === 'all' ? 'All FAQs' : displayQuestionCategoryLabel(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveFaqCategory(cat);
                      setExpandedFaq(null);
                      setFaqListPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : darkMode
                          ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <SearchFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={pageConfig.searchPlaceholder}
            filterOptions={[]}
            showClearButton={true}
            customFilters={null}
            onClear={() => {
              setSearchTerm('');
              setFaqListPage(1);
            }}
          />

          {loading ? (
            <div
              className={`rounded-2xl border p-10 flex items-center justify-center ${
                darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
              }`}
            >
              <FiLoader className={`w-8 h-8 ${darkMode ? 'text-primary-400' : 'text-primary-600'} animate-spin`} />
              <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'}`}>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    No general questions found for this category.
                  </p>
                </div>
              ) : (
                paginatedFaqs.map((faq) => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      id={`faq-${faq.id}`}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                        darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
                      } ${isOpen ? 'shadow-sm' : 'shadow-sm hover:shadow-md'}`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedFaq(isOpen ? null : faq.id);
                          }
                        }}
                        className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center border ${
                              darkMode
                                ? 'border-primary-400/50 text-primary-300'
                                : 'border-primary-600/50 text-primary-600 bg-primary-50/50'
                            }`}
                          >
                            <FiHelpCircle className="w-4 h-4" />
                          </div>
                          <h3 className={`font-semibold text-base md:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {faq.question}
                          </h3>
                        </div>

                        <FiChevronDown
                          className={`w-5 h-5 ml-3 flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          } ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        />
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                      >
                        <div className={`px-6 pb-5 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div
                            className={`leading-relaxed ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                            // answer is stored HTML from the rich editor
                            dangerouslySetInnerHTML={{ __html: faq.answer || '' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {filteredFaqs.length > 0 && faqTotalPages > 1 ? (
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <p className="text-sm">
                    Showing{' '}
                    <span className="font-medium">{faqPageStart + 1}</span>
                    {'–'}
                    <span className="font-medium">
                      {Math.min(faqPageStart + FAQ_LIST_PAGE_SIZE, filteredFaqs.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredFaqs.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={faqListPage <= 1}
                      onClick={() => setFaqListPage((p) => Math.max(1, p - 1))}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        faqListPage <= 1
                          ? darkMode
                            ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : darkMode
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                            : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className={`text-sm px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Page {faqListPage} of {faqTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={faqListPage >= faqTotalPages}
                      onClick={() => setFaqListPage((p) => Math.min(faqTotalPages, p + 1))}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        faqListPage >= faqTotalPages
                          ? darkMode
                            ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : darkMode
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                            : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralQuestionsPublic;

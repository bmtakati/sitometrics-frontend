import React, { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiHelpCircle,
  FiLoader,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import PageHeader from '../../components/PageHeader';
import SearchFilter from '../../components/SearchFilter';
import FormModal from '../../components/FormModal/FormModal';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const FAQ_LIST_PAGE_SIZE = 5;

/** Admin CRUD for FAQ general questions (requires auth). Public listing uses /faq/general. */
const FaqGeneralQuestionsAdmin = () => {
  const [questionCategoryRows, setQuestionCategoryRows] = useState([]);

  useEffect(() => {
    const loadQuestionCategories = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/faq-question-categories/all`);
        if (!res.ok) return;
        const payload = await res.json();
        if (!payload?.success || !Array.isArray(payload.data)) return;
        const rows = [...payload.data]
          .filter((c) => c?.name)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setQuestionCategoryRows(rows);
      } catch {
      }
    };

    loadQuestionCategories();
  }, []);

  const [activeFaqCategory, setActiveFaqCategory] = useState('all');

  // Used by sidebar filters (active categories only)
  const questionCategoryOptions = useMemo(
    () =>
      questionCategoryRows
        .filter((c) => {
          const status = c.status ? String(c.status).toLowerCase() : '';
          return !status || status === 'active';
        })
        .map((c) => ({ value: c.name, label: c.name })),
    [questionCategoryRows]
  );

  useEffect(() => {
    setActiveFaqCategory((prev) => {
      if (prev === 'all') return prev;
      const stillExists = questionCategoryOptions.some((o) => o.value === prev);
      return stillExists ? prev : 'all';
    });
  }, [questionCategoryOptions]);

  const crud = useApiCrud('faq-general-questions', {
    initialFormData: {
      question: '',
      answer: '',
      category: '',
      sort_order: 1,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.question?.trim()) errors.question = 'Question is required';
      // `answer` is HTML from a rich editor. Validate by stripping tags.
      const answerHtml = String(data.answer || '');
      const answerText = answerHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!answerText) errors.answer = 'Answer is required';
      if (!data.category?.trim()) errors.category = 'Category is required';
      return errors;
    },
    resourceName: 'General Question',
    itemsPerPage: 10,
    transformResponse: (value) => {
      if (Array.isArray(value)) {
        return value.map((item) => ({
          ...item,
          name: item.name ?? item.question,
        }));
      }
      return {
        ...value,
        name: value.name ?? value.question,
      };
    },
    autoLoad: true,
  });

  // Used by add/edit modal assignment (include all categories).
  const categoryFieldOptions = useMemo(() => {
    const mapped = questionCategoryRows.map((c) => {
      const isInactive = String(c.status || '').toLowerCase() === 'inactive';
      return {
        value: c.name,
        label: isInactive ? `${c.name} (Inactive)` : c.name,
      };
    });

    // Ensure edit mode can keep/assign legacy categories not in master list.
    const current = String(crud?.formData?.category || '').trim();
    if (current && !mapped.some((o) => o.value === current)) {
      return [{ value: current, label: `${current} (Legacy)` }, ...mapped];
    }

    return mapped;
  }, [questionCategoryRows, crud.formData?.category]);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    const handle = (event) => setDarkMode(event.detail.darkMode);
    window.addEventListener('darkModeChanged', handle);
    return () => window.removeEventListener('darkModeChanged', handle);
  }, []);

  const pageConfig = {
    icon: FiMessageSquare,
    title: 'General Questions',
    subtitle: 'Manage FAQ general questions',
    addButtonLabel: 'Add Question',
    searchPlaceholder: 'Search questions...',
  };

  const formFields = [
    {
      name: 'question',
      label: 'Question',
      type: 'text',
      required: true,
      autoFocus: true,
    },
    {
      name: 'category',
      label: 'Question category',
      type: 'select',
      required: true,
      placeholder: 'Select category',
      options: [
        ...(categoryFieldOptions.length
          ? categoryFieldOptions
          : [{ value: '', label: 'No active question categories' }]),
      ],
    },
    {
      name: 'sort_order',
      label: 'List position',
      type: 'number',
      required: false,
      placeholder: '1 = top of list',
    },
    {
      name: 'answer',
      label: 'Answer',
      type: 'custom',
      fullWidth: true,
      required: true,
      render: (formData, onInputChange, errors, darkMode) => {
        const errorMsg = errors?.answer || null;
        return (
          <div className="relative">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Answer *
            </label>
            <RichTextEditor
              value={formData.answer || ''}
              onChange={(html) => {
                onInputChange({ target: { name: 'answer', value: html } });
              }}
              error={errorMsg}
              darkMode={darkMode}
            />
            {errorMsg ? <p className="mt-1 text-sm text-red-600">{errorMsg}</p> : null}
          </div>
        );
      },
    },
  ];

  const faqs = Array.isArray(crud.allData) ? crud.allData : [];

  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqListPage, setFaqListPage] = useState(1);

  /** Sidebar matches FAQ → Question Categories (active), same order as registration dropdown. */
  const categories = useMemo(
    () => ['all', ...questionCategoryOptions.map((o) => o.value)],
    [questionCategoryOptions]
  );

  const filteredFaqs = useMemo(() => {
    const q = String(crud.searchTerm || '').trim().toLowerCase();
    const base =
      activeFaqCategory === 'all'
        ? faqs
        : faqs.filter((f) => String(f.category || '').trim() === activeFaqCategory);
    if (!q) return base;
    return base.filter(
      (f) =>
        String(f.question || '').toLowerCase().includes(q) ||
        String(f.answer || '').toLowerCase().includes(q)
    );
  }, [crud.searchTerm, activeFaqCategory, faqs]);

  const faqTotalPages = Math.max(1, Math.ceil(filteredFaqs.length / FAQ_LIST_PAGE_SIZE));
  const faqPageStart = (faqListPage - 1) * FAQ_LIST_PAGE_SIZE;
  const paginatedFaqs = filteredFaqs.slice(faqPageStart, faqPageStart + FAQ_LIST_PAGE_SIZE);

  useEffect(() => {
    setFaqListPage(1);
  }, [activeFaqCategory, crud.searchTerm]);

  useEffect(() => {
    setFaqListPage((p) => Math.min(Math.max(1, p), faqTotalPages));
  }, [faqTotalPages]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon={pageConfig.icon}
        title={pageConfig.title}
        subtitle={pageConfig.subtitle}
        actions={[
          {
            label: pageConfig.addButtonLabel,
            icon: FiPlus,
            onClick: crud.handleAdd,
            variant: 'primary',
            disabled: crud.actionLoading,
          },
        ]}
      />

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
                const label = cat === 'all' ? 'All FAQs' : cat;
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
            searchValue={crud.searchTerm}
            onSearchChange={crud.handleSearch}
            searchPlaceholder={pageConfig.searchPlaceholder}
            filterOptions={[]}
            showClearButton={true}
            customFilters={null}
            onClear={() => {
              crud.handleSearch('');
              setFaqListPage(1);
            }}
          />

          {crud.loading ? (
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

                        <div className="flex items-center gap-3 ml-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              crud.handleEdit(faq);
                            }}
                            className="text-primary-600 hover:text-primary-700"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              crud.handleDelete(faq);
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                          <FiChevronDown
                            className={`w-5 h-5 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            } ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          />
                        </div>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                      >
                        <div className={`px-6 pb-5 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div
                            className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
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

      <FormModal
        isOpen={crud.showModal}
        onClose={crud.handleCloseModal}
        title="General Question"
        fields={formFields}
        formData={crud.formData}
        onInputChange={crud.handleInputChange}
        onSubmit={crud.handleSubmit}
        errors={crud.errors}
        isLoading={crud.actionLoading}
        isEditing={crud.isEditing}
        fieldsLayout="three-col"
        maxWidth="max-w-5xl"
      />
    </div>
  );
};

export default FaqGeneralQuestionsAdmin;

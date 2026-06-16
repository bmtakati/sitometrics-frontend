import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

/** Admin CRUD for troubleshooting (requires auth). Public listing uses /faq/troubleshooting. */
const FaqTroubleshootingAdmin = () => {
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
        // ignore
      }
    };
    loadQuestionCategories();
  }, []);

  const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Convert rich-editor HTML into an array of solution fragments.
  // - If the user uses lists, we take each <li> as a solution.
  // - Otherwise we take each <p> as a solution.
  const htmlToSolutions = (html) => {
    const raw = String(html || '');
    if (!raw.trim()) return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
      const listItems = Array.from(doc.body.querySelectorAll('li'));
      const paragraphs = Array.from(doc.body.querySelectorAll('p'));

      const candidates = listItems.length ? listItems : paragraphs;
      const fragments = candidates
        .map((el) => el.innerHTML)
        .map((s) => (s == null ? '' : String(s)))
        .filter((s) => stripHtml(s).length > 0);

      if (fragments.length) return fragments;
      // Fallback: if we couldn't split into fragments, store plain text as a single solution.
      const plain = stripHtml(raw);
      return plain ? [plain] : [];
    } catch {
      const plain = stripHtml(raw);
      return plain ? [plain] : [];
    }
  };

  const solutionsToEditorHtml = (solutions) => {
    if (!Array.isArray(solutions) || solutions.length === 0) return '';
    // Wrap each solution string as <p>... so the editor can re-create paragraphs.
    // Solutions may already include HTML; we intentionally keep it as-is.
    return solutions
      .map((s) => (s == null ? '' : String(s)))
      .map((s) => s.trim())
      .filter((s) => stripHtml(s).length > 0)
      .map((s) => `<p>${s}</p>`)
      .join('');
  };

  const crud = useApiCrud('faq-troubleshooting', {
    initialFormData: {
      problem: '',
      category: '',
      sort_order: 1,
      solutionsText: '',
    },
    validateForm: (data) => {
      const errors = {};
      const problemHtml = String(data.problem || '');
      const problemText = problemHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!problemText) errors.problem = 'Problem is required';
      if (!data.category?.trim()) errors.category = 'Category is required';

      const solutions = htmlToSolutions(data.solutionsText);

      if (solutions.length === 0) errors.solutionsText = 'At least one solution is required';
      return errors;
    },
    resourceName: 'Troubleshooting',
    itemsPerPage: 10,
    transformFormData: (data) => {
      const solutions = htmlToSolutions(data.solutionsText);

      return {
        problem: data.problem,
        category: data.category,
        sort_order: data.sort_order,
        solutions,
      };
    },
    transformResponse: (value) => {
      const toSolutionsText = (solutions) => solutionsToEditorHtml(solutions);

      if (Array.isArray(value)) {
        return value.map((item) => ({
          ...item,
          name: item.name ?? item.problem,
        }));
      }

      return {
        ...value,
        name: value.name ?? value.problem,
        solutionsText: toSolutionsText(value.solutions),
      };
    },
    autoLoad: true,
  });

  /** Modal dropdown: FAQ → Question Categories (all rows + legacy current value). */
  const categoryFieldOptions = useMemo(() => {
    const mapped = questionCategoryRows.map((c) => {
      const isInactive = String(c.status || '').toLowerCase() === 'inactive';
      return {
        value: c.name,
        label: isInactive ? `${c.name} (Inactive)` : c.name,
      };
    });
    const current = String(crud?.formData?.category || '').trim();
    if (current && !mapped.some((o) => o.value === current)) {
      return [{ value: current, label: `${current} (Legacy)` }, ...mapped];
    }
    return mapped;
  }, [questionCategoryRows, crud.formData?.category]);

  const formatCategoryForTable = (stored) => {
    const s = String(stored ?? '').trim();
    if (!s) return '—';
    const row = questionCategoryRows.find((r) => String(r.name || '').trim() === s);
    if (row && String(row.status || '').toLowerCase() === 'inactive') {
      return `${s} (Inactive)`;
    }
    return s;
  };

  const prevCategoryCount = useRef(0);
  useEffect(() => {
    const len = questionCategoryRows.length;
    if (len > 0 && prevCategoryCount.current === 0) {
      void crud.reload();
    }
    prevCategoryCount.current = len;
  }, [questionCategoryRows.length, crud.reload]);

  const pageConfig = {
    icon: FiAlertCircle,
    title: 'Troubleshooting',
    subtitle: 'Manage troubleshooting problems and solutions',
    addButtonLabel: 'Add Problem',
    searchPlaceholder: 'Search problem or category...',
  };

  const tableColumns = [
    {
      header: 'Problem',
      accessor: 'problem',
      type: 'truncate',
      render: (row, darkMode) => {
        const text = stripHtml(row?.problem);
        return (
          <div
            className={`text-sm ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            } max-w-xs truncate`}
            title={text || ''}
          >
            {text || '—'}
          </div>
        );
      },
    },
    {
      header: 'Category',
      accessor: 'category',
      type: 'truncate',
      noWrap: true,
      render: (row, darkMode) => {
        const text = formatCategoryForTable(row?.category);
        return (
          <div
            className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs truncate`}
            title={text}
          >
            {text}
          </div>
        );
      },
    },
    {
      header: 'Sort',
      accessor: 'sort_order',
      noWrap: true,
    },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No troubleshooting items found',
      description: 'Create your first troubleshooting entry.',
    },
  };

  const formFields = useMemo(
    () => [
      {
        name: 'problem',
        label: 'Problem',
        type: 'custom',
        fullWidth: true,
        required: true,
        autoFocus: true,
        render: (formData, onInputChange, errors, darkMode) => {
          const errorMsg = errors?.problem || null;
          return (
            <div className="relative">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Problem *
              </label>
              <RichTextEditor
                value={formData.problem || ''}
                darkMode={darkMode}
                minHeight={120}
                maxHeight={120}
                error={errorMsg}
                onChange={(html) => {
                  onInputChange({ target: { name: 'problem', value: html } });
                }}
              />
              {errorMsg ? <p className="mt-1 text-sm text-red-600">{errorMsg}</p> : null}
            </div>
          );
        },
      },
      {
        name: 'solutionsText',
        label: 'Solutions',
        type: 'custom',
        fullWidth: true,
        required: true,
        render: (formData, onInputChange, errors, darkMode) => {
          const errorMsg = errors?.solutionsText || null;
          return (
            <div className="relative">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Solutions *
              </label>
              <RichTextEditor
                value={formData.solutionsText || ''}
                darkMode={darkMode}
                minHeight={160}
                maxHeight={160}
                error={errorMsg}
                onChange={(html) => {
                  onInputChange({ target: { name: 'solutionsText', value: html } });
                }}
              />
              {errorMsg ? <p className="mt-1 text-sm text-red-600">{errorMsg}</p> : null}
            </div>
          );
        },
      },
      {
        name: 'category',
        label: 'Question category',
        type: 'select',
        required: true,
        placeholder: 'Select category',
        options: categoryFieldOptions.length
          ? categoryFieldOptions
          : [{ value: '', label: 'No question categories — add them under FAQ → Question Categories' }],
      },
    {
      name: 'sort_order',
      label: 'List position',
      type: 'number',
      required: false,
      placeholder: '1 = top of list',
    },
    ],
    [categoryFieldOptions]
  );

  const filterOptions = [{ label: 'All', value: 'all' }];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={null}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Troubleshooting Item"
      modalMaxWidth="max-w-5xl"
      formFieldsLayout="three-col"
      crud={crud}
      filterOptions={filterOptions}
    />
  );
};

export default FaqTroubleshootingAdmin;

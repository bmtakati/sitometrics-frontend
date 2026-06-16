import React from 'react';
import { FiTag, FiDroplet } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';

/**
 * Color picker field — read-only text box showing the hex code.
 * The right-side button is overlaid by a transparent <input type="color">
 * that covers the entire button area, so any click on the button
 * directly hits the native color input and opens the OS picker.
 */
const ColorPickerInput = ({ value, onChange, darkMode, error }) => {
  const hasColor = value && value !== '';

  const inputBase = darkMode
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <div>
      {/* Label */}
      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Color
      </label>

      <div className={`flex items-stretch rounded-lg border overflow-hidden
        ${error ? 'border-red-400' : darkMode ? 'border-gray-600' : 'border-gray-300'}`}
      >
        {/* Read-only text showing hex value */}
        <input
          type="text"
          readOnly
          value={hasColor ? value : ''}
          placeholder="Click  to pick a color"
          className={`flex-1 px-3 py-2 text-sm focus:outline-none cursor-default ${inputBase} ${darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
        />

        {/* Swatch + icon button — the native color input sits on top, covering it entirely */}
        <div
          className={`relative flex items-center gap-1.5 px-3 border-l cursor-pointer
            ${darkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          {/* Visible swatch dot */}
          <span
            className="w-5 h-5 rounded-full border border-gray-300 shadow-sm flex-shrink-0 pointer-events-none"
            style={{ backgroundColor: hasColor ? value : '#e5e7eb' }}
          />
          {/* Droplet icon */}
          <FiDroplet className={`w-4 h-4 pointer-events-none ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />

          {/* Native color input — covers the entire button area, fully transparent */}
          <input
            type="color"
            value={hasColor ? value : '#3b82f6'}
            title="Open color picker"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
            onChange={(e) => onChange({ target: { name: 'color', value: e.target.value } })}
          />
        </div>

        {/* Clear × button */}
        {hasColor && (
          <button
            type="button"
            title="Clear color"
            onClick={() => onChange({ target: { name: 'color', value: '' } })}
            className={`flex items-center px-2 border-l transition-colors text-gray-400 hover:text-red-500
              ${darkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            <span className="text-base leading-none">×</span>
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

/**
 * Statuses Management
 * Manage system-wide statuses (workflow, account, assessment, etc.)
 */
const Statuses = () => {
  const crud = useApiCrud('statuses', {
    initialFormData: {
      name: '',
      description: '',
      color: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Status name is required';
      return errors;
    },
    resourceName: 'Status',
    itemsPerPage: 15
  });

  const pageConfig = {
    icon: FiTag,
    title: 'Statuses',
    subtitle: 'Manage system-wide statuses used across modules',
    addButtonLabel: 'Add Status',
    searchPlaceholder: 'Search statuses…'
  };

  const tableColumns = [
    {
      header: 'Status Name',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return (
          <div className="flex items-center gap-2">
            {row.color && (
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              {row.name}
            </span>
          </div>
        );
      }
    },
    { header: 'Code',  accessor: 'code',  noWrap: true },
    {
      header: 'Color',
      accessor: 'color',
      noWrap: true,
      render: (row) =>
        row.color ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-5 h-5 rounded border border-gray-200"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-xs text-gray-500">{row.color}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
    },
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Statuses Found',
      description: 'Get started by creating your first system status.'
    }
  };

  const formFields = [
    {
      name: 'name',
      label: 'Status Name',
      type: 'text',
      required: true,
      autoFocus: true,
      placeholder: 'e.g. Pending, Approved, Rejected…'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 3
    },
    {
      name: 'color',
      label: 'Color',
      type: 'custom',
      render: (formData, onInputChange, errors, darkMode) => (
        <ColorPickerInput
          value={formData.color}
          onChange={onInputChange}
          darkMode={darkMode}
          error={errors?.color}
        />
      )
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Status"
      crud={crud}
    />
  );
};

export default Statuses;

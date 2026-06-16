import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCheck, FiLoader, FiAlertCircle, FiPlus, FiEdit2 } from 'react-icons/fi';
import ThreeColumnFieldsGrid from './ThreeColumnFieldsGrid';
import TwoColumnFieldsGrid from './TwoColumnFieldsGrid';
import StatusIdSelect from './StatusIdSelect';
import SearchableSelect from '../SearchableSelect';
import { normalizeFormFieldsForLayout } from '../../utils/formFieldLayout';

/**
 * Reusable Form Modal Component
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Handler for closing the modal
 * @param {string} title - Modal title (will add "Edit" or "Add New" prefix based on isEditing)
 * @param {array} fields - Array of field configurations
 * @param {object} formData - Form data object
 * @param {function} onInputChange - Input change handler
 * @param {function} onSubmit - Form submit handler
 * @param {object} errors - Validation errors object
 * @param {boolean} isLoading - Loading state for submit button
 * @param {boolean} isEditing - Whether in edit mode
 * @param {string} gradientFrom - Starting color for header gradient (default: 'blue-600')
 * @param {string} gradientTo - Ending color for header gradient (default: 'green-500')
 * @param {string} submitLabel - Custom submit button label (auto-generated if not provided)
 * @param {string} maxWidth - Maximum width of modal (default: 'max-w-md')
 * 
 * Field Configuration:
 * {
 *   name: string,        // Field name (matches formData key)
 *   label: string,       // Field label
 *   type: string,        // 'text', 'textarea', 'select' (searchable combobox), 'searchable_select' (same), 'number', 'email', 'password', 'date'
 *   required: boolean,   // Whether field is required
 *   placeholder: string, // Placeholder text (optional)
 *   options: array,      // For select: [{ value, label }]
 *   rows: number,        // For textarea: number of rows
 *   disabled: boolean,   // Whether field is disabled
 *   autoFocus: boolean   // Whether field should auto-focus
 * }
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  fields = [],
  formData = {},
  onInputChange,
  onSubmit,
  errors = {},
  isLoading = false,
  isEditing = false,
  gradientFrom = 'blue-600',
  gradientTo = 'green-500',
  submitLabel,
  maxWidth = 'max-w-4xl',
  tabs = null,
  fieldsLayout = 'two-col', // 'stack' | 'two-col' | 'three-col'
  readOnly = false
}) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [activeTab, setActiveTab] = useState(null);

  const uploadErrorBannerData = (() => {
    // Some backend upload failures show up as `errors.upload`,
    // others show up as a generic `errors.submit` message.
    const uploadErr = errors?.upload ?? errors?.submit;
    if (!uploadErr) return { banner: null, suppressFieldErrors: false };

    const messages = Array.isArray(uploadErr) ? uploadErr : [uploadErr];
    const raw = messages.filter(Boolean).join(' ') || '';
    const lower = String(raw).toLowerCase();

    const allowedFormats = 'pdf, doc, docx, xls, xlsx, ppt, pptx, mp4, webm, ogg';
    const maxMb = 20;

    const isPayloadTooLarge =
      lower.includes('post data is too large') ||
      lower.includes('request entity too large') ||
      lower.includes('payload too large') ||
      lower.includes('413');

    const isUploadFailed =
      lower.includes('failed to upload') || lower.includes('upload failed') || lower.includes('upload error');

    const isMimeError = lower.includes('mimes') || lower.includes('mimetypes') || lower.includes('file type');

    // If the upload itself failed, we don't want unrelated fields (e.g. "Size") to look invalid.
    const suppressFieldErrors = isPayloadTooLarge || isUploadFailed || isMimeError;

    if (isPayloadTooLarge) {
      return {
        banner: `Document exceeds the maximum upload size. Please upload a file up to ${maxMb}MB.`,
        suppressFieldErrors,
      };
    }

    if (isMimeError) {
      return {
        banner: `Upload failed: unsupported file type. Allowed: ${allowedFormats}.`,
        suppressFieldErrors,
      };
    }

    if (lower.includes('size') || lower.includes('max:') || lower.includes('too large')) {
      return {
        banner: `Document exceeds the maximum upload size. Please upload a file up to ${maxMb}MB.`,
        suppressFieldErrors,
      };
    }

    if (isUploadFailed) {
      return {
        banner: `Upload failed. Please try again, or choose a valid file (${allowedFormats}, max ${maxMb}MB).`,
        suppressFieldErrors,
      };
    }

    return {
      banner: `Upload failed: ${messages[0] || 'please try again'}`,
      suppressFieldErrors,
    };
  })();

  const uploadErrorBanner = uploadErrorBannerData.banner;
  const suppressFieldErrors = uploadErrorBannerData.suppressFieldErrors;

  useEffect(() => {
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  useEffect(() => {
    if (isOpen && tabs?.length) {
      setActiveTab(tabs[0].id);
    }
  }, [isOpen]);

  const normalizedFields = useMemo(
    () => normalizeFormFieldsForLayout(fields),
    [fields]
  );

  const normalizedTabs = useMemo(
    () => tabs?.map((tab) => ({
      ...tab,
      fields: normalizeFormFieldsForLayout(tab.fields),
    })),
    [tabs]
  );

  const modalTitle = readOnly ? title : (isEditing ? `Edit ${title}` : `Add New ${title}`);
  const modalDescription = readOnly
    ? `Viewing ${title} details.`
    : (isEditing ? `Update the ${title} details below.` : `Fill in the details to create a new ${title}.`);
  const defaultSubmitLabel = isEditing ? 'Save Changes' : `Add ${title}`;
  const loadingLabel     = isEditing ? 'Saving...' : 'Creating...';

  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      required = false,
      placeholder,
      options = [],
      rows = 3,
      disabled = false,
      autoFocus = false
    } = field;
    const isDisabled = disabled || readOnly;

    const hasFieldError = errors[name] && !(suppressFieldErrors && name !== 'upload');
    const shellColors = hasFieldError
      ? 'border-red-500'
      : darkMode
        ? 'border-gray-600 bg-gray-800 text-white'
        : 'border-gray-300 bg-white text-gray-900';
    const shellDisabled = isDisabled ? (darkMode ? 'bg-gray-900 cursor-not-allowed' : 'bg-gray-50 cursor-not-allowed') : '';

    // Single-line controls share a fixed height so selects match text inputs.
    const singleLineClasses = `peer w-full h-12 min-h-[48px] px-3 py-0 border rounded-lg box-border leading-normal focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${shellColors} ${shellDisabled}`;

    const multilineClasses = `peer w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${shellColors} ${shellDisabled}`;

    const labelClasses = darkMode
      ? `absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 transition-all pointer-events-none
          peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent
          peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-400 peer-focus:bg-gray-900
            ${isDisabled ? 'opacity-50' : ''}`
      : `absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 transition-all pointer-events-none
          peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
          peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:bg-white
            ${isDisabled ? 'opacity-50' : ''}`;

    switch (type) {
      case 'file': {
        const fileObj = formData[name];
        const fileName =
          fileObj && (fileObj.name || typeof fileObj === 'string') ? (fileObj.name || fileObj) : '';

        return (
          <div key={name} className="relative">
            {label ? (
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {label}{required && ' *'}
              </label>
            ) : null}
            <input
              type="file"
              name={name}
              onChange={onInputChange}
              // Tailwind `file:*` styles keep the "Choose File" button consistent with other inputs.
              className={`${singleLineClasses}
                file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-semibold file:cursor-pointer
                file:bg-primary-600 file:text-white
                file:disabled:cursor-not-allowed
                ${isDisabled ? (darkMode ? 'file:bg-gray-700 file:text-gray-300' : 'file:bg-gray-200 file:text-gray-600') : ''}
                ${errors[name] ? 'border-red-500' : ''}`}
              disabled={isDisabled}
            />

            {fileName ? (
              <p className={`mt-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Selected: <span className="font-medium">{fileName}</span>
              </p>
            ) : null}
          </div>
        );
      }
      case 'custom':
        return (
          <div key={name}>
            {field.render(formData, onInputChange, errors, darkMode)}
          </div>
        );

      case 'status_id':
        return (
          <div key={name} className="relative">
            <StatusIdSelect
              name={name}
              value={formData[name]}
              onChange={onInputChange}
              errors={errors}
              darkMode={darkMode}
              required={required}
              label={label}
              readOnly={readOnly}
            />
          </div>
        );

      case 'select':
      case 'searchable_select':
        return (
          <div key={name} className="relative">
            <SearchableSelect
              options={options}
              value={formData[name] ?? ''}
              onChange={(val) => onInputChange({ target: { name, value: val } })}
              placeholder={placeholder || `Select ${label}`}
              disabled={isDisabled}
              darkMode={darkMode}
              autoFocus={!readOnly && autoFocus}
              invalid={hasFieldError}
            />
            <label
              className={
                darkMode
                  ? 'absolute left-2 -top-2.5 px-1 z-10 bg-gray-900 text-xs font-medium text-gray-400 pointer-events-none'
                  : 'absolute left-2 -top-2.5 px-1 z-10 bg-white text-xs font-medium text-gray-600 pointer-events-none'
              }
            >
              {label}{required && ' *'}
            </label>
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
            )}
          </div>
        );

      case 'textarea':
        if (readOnly || isDisabled) {
          return (
            <div key={name} className="relative">
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`}>
                {label}{required && ' *'}
              </label>
              <textarea
                name={name}
                value={formData[name] || ''}
                onChange={onInputChange}
                rows={rows}
                className={`${multilineClasses} resize-none`}
                disabled={isDisabled}
                readOnly={true}
              />
            </div>
          );
        }

        return (
          <div key={name} className="relative">
            <textarea
              name={name}
              value={formData[name] || ''}
              onChange={onInputChange}
              rows={rows}
              className={`${multilineClasses} resize-none`}
              placeholder=" "
              disabled={isDisabled}
              autoFocus={!readOnly && autoFocus}
              readOnly={readOnly}
            />
            <label className={labelClasses}>
              {label}{required && ' *'}
            </label>
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
            )}
          </div>
        );

      case 'static':
        return (
          <div key={name} className="relative">
            <div className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
              darkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300'
                : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}>
              {field.displayValue || formData[name] || '—'}
            </div>
            <label className={`absolute left-2 -top-2.5 px-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} text-xs font-medium text-primary-600 pointer-events-none`}>
              {label}
            </label>
          </div>
        );

      case 'checkbox': {
        const isChecked = !!formData[name];
        return (
          <div key={name} className="flex items-center justify-between gap-4 py-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {label}{required && ' *'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isChecked}
              disabled={isDisabled}
              onClick={() => onInputChange({ target: { name, value: !isChecked } })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${isChecked ? 'bg-primary-600' : (darkMode ? 'bg-gray-600' : 'bg-gray-300')}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-semibold min-w-[2.5rem] text-right ${isChecked ? 'text-primary-600' : (darkMode ? 'text-gray-400' : 'text-gray-400')}`}>
              {isChecked ? 'Yes' : 'No'}
            </span>
          </div>
        );
      }

      default:
        if (readOnly || isDisabled) {
          return (
            <div key={name} className="relative">
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`}>
                {label}{required && ' *'}
              </label>
              <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={onInputChange}
                className={singleLineClasses}
                disabled={isDisabled}
                readOnly={true}
              />
            </div>
          );
        }

        return (
          <div key={name} className="relative">
            <input
              type={type}
              name={name}
              value={formData[name] || ''}
              onChange={onInputChange}
              className={singleLineClasses}
              placeholder=" "
              disabled={isDisabled}
              autoFocus={!readOnly && autoFocus}
              readOnly={readOnly}
            />
            <label className={labelClasses}>
              {label}{required && ' *'}
            </label>
            {errors[name] && (
              <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
            )}
          </div>
        );
    }
  };

  const renderFields = (fieldsToRender) => {
    if (fieldsLayout === 'three-col') {
      return <ThreeColumnFieldsGrid fields={fieldsToRender} renderField={renderField} />;
    }
    if (fieldsLayout === 'two-col') {
      return <TwoColumnFieldsGrid fields={fieldsToRender} renderField={renderField} />;
    }
    return fieldsToRender.map(renderField);
  };

  if (!isOpen) return null;

  // Resolve the currently active tab id (fall back to first tab on initial render)
  const currentTabId = activeTab || normalizedTabs?.[0]?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative ${darkMode ? 'bg-stone-900' : 'bg-white'} w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`}>
        {/* Header */}
        <div className={`relative flex items-center justify-between overflow-hidden border-b px-6 py-4 ${
          darkMode ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-gradient-to-r from-white via-emerald-50/30 to-amber-50/20'
        }`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" aria-hidden />
          <div className="flex items-start gap-3 pl-1">
            <div className={`rounded-xl border p-2.5 ${
              darkMode ? 'border-emerald-800/60 bg-emerald-950/50' : 'border-emerald-100 bg-emerald-50'
            }`}>
              {isEditing ? (
                <FiEdit2 className={`h-5 w-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <FiPlus className={`h-5 w-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              )}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}>
                {modalTitle}
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {modalDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${darkMode ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-100'}`}
            type="button"
            aria-label="Close modal"
            title="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={readOnly ? (e) => e.preventDefault() : onSubmit} className="space-y-6 p-6">
          {/* Global Error */}
          {errors.submit && (
            <div className={`${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-4`}>
              <div className="flex">
                <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload error banner (top of modal, user-friendly) */}
          {uploadErrorBanner && (
            <div className={`${darkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border rounded-lg p-4 mb-4`}>
              <div className="flex items-start">
                <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-800'}`}>{uploadErrorBanner}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs (when provided) */}
          {normalizedTabs ? (
            <>
              {/* Tab bar */}
              <div className={`flex border-b -mt-2 mb-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {normalizedTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = currentTabId === tab.id;
                  const tabFieldNames = tab.fields.map((f) => f.name).filter(Boolean);
                  const hasError = tabFieldNames.some((n) => errors[n]);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-primary-500 text-primary-600'
                          : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {TabIcon && <TabIcon className="w-4 h-4" />}
                      {tab.label}
                      {hasError && (
                        <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Cross-tab error banner */}
              {(() => {
                const otherTabErrors = normalizedTabs
                  .filter((t) => t.id !== currentTabId)
                  .flatMap((t) =>
                    t.fields
                      .map((f) => f.name)
                      .filter((n) => n && errors[n])
                      .map((n) => ({ tabId: t.id, tabLabel: t.label, msg: errors[n] }))
                  );
                if (!otherTabErrors.length) return null;
                return (
                  <div className={`mb-4 rounded-lg border px-4 py-3 ${
                    darkMode ? 'border-red-700 bg-red-950/40' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold mb-1 ${
                          darkMode ? 'text-red-400' : 'text-red-700'
                        }`}>
                          Please fix the following before submitting:
                        </p>
                        <ul className="space-y-0.5">
                          {otherTabErrors.map(({ tabId, tabLabel, msg }, i) => {
                            const messages = Array.isArray(msg) ? msg : [msg];
                            return messages.map((m, j) => (
                              <li key={`${tabId}-${i}-${j}`} className={`text-xs flex items-center gap-1.5 ${
                                darkMode ? 'text-red-300' : 'text-red-600'
                              }`}>
                                <span
                                  className="font-medium underline cursor-pointer hover:opacity-80"
                                  onClick={() => setActiveTab(tabId)}
                                >
                                  [{tabLabel} tab]
                                </span>
                                {m}
                              </li>
                            ));
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Active tab fields */}
              {(fieldsLayout === 'three-col' || fieldsLayout === 'two-col') ? (
                renderFields(normalizedTabs.find((t) => t.id === currentTabId)?.fields || [])
              ) : (
                <div className="space-y-6">
                  {(normalizedTabs.find((t) => t.id === currentTabId)?.fields || []).map(renderField)}
                </div>
              )}
            </>
          ) : (
            /* Regular flat fields */
            (fieldsLayout === 'three-col' || fieldsLayout === 'two-col') ? renderFields(normalizedFields) : normalizedFields.map(renderField)
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 border rounded-xl transition-all duration-200 font-medium ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Close
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 border-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
                    : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    {submitLabel || defaultSubmitLabel}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;

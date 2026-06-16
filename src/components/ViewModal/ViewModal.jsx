import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import SearchableSelect from '../SearchableSelect';

/**
 * Reusable View Modal Component
 * Displays all item details including timestamps
 * 
 * @param {Object} props
 * @param {Boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.item - Item to display
 * @param {String} props.title - Modal title
 * @param {Array} props.fields - Array of field configurations to display
 * @param {Object} props.icon - Icon component
 */
const ViewModal = ({ 
  isOpen, 
  onClose, 
  item = {}, 
  title = 'View Details',
  fields = [],
  icon: Icon,
  tabs = null,
  renderAsFormFields = false
}) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  useEffect(() => {
    if (isOpen && tabs?.length) setActiveTab(tabs[0].id);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatValue = (value, field) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    // Rich-text fields (custom) are stored as HTML strings.
    if (field.type === 'custom') {
      return <div dangerouslySetInnerHTML={{ __html: value || '' }} />;
    }

    // Handle textarea - show full text
    if (field.type === 'textarea') {
      return <div className="whitespace-pre-wrap">{value}</div>;
    }

    // Handle status badges
    if (field.type === 'status' || field.accessor === 'status') {
      // New object format from relationship: { id, name, color, code }
      if (value && typeof value === 'object') {
        const color = value.color ?? '#9ca3af';
        return (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {value.name}
          </span>
        );
      }
      // Legacy string fallback
      const nameLower = (value ?? '').toLowerCase();
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          nameLower === 'active'
            ? 'bg-green-100 text-green-800'
            : nameLower === 'inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '—'}
        </span>
      );
    }

    // Handle select fields - capitalize
    if (field.type === 'select') {
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    }

    // Handle dates
    if (field.type === 'date' || field.accessor.includes('date')) {
      return new Date(value).toLocaleDateString();
    }

    // Handle datetime
    if (field.type === 'datetime' || field.accessor.includes('_at')) {
      return new Date(value).toLocaleString();
    }

    // Handle custom render
    if (field.render) {
      return field.render(item);
    }

    return String(value);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderReadonlyField = (field, value, displayValue) => {
    if (field.type === 'custom') return displayValue;

    if (field.type === 'textarea') {
      return (
        <textarea
          value={displayValue ?? ''}
          rows={field.rows || 2}
          disabled
          readOnly
          className={`w-full px-3 py-3 border rounded-lg resize-none ${
            darkMode
              ? 'border-gray-600 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
      );
    }

    if (field.type === 'searchable_select') {
      const hasSelectedOption = (field.options || []).some((opt) => String(opt.value) === String(value ?? ''));
      if (!hasSelectedOption) {
        return (
          <input
            type="text"
            value={displayValue ?? ''}
            disabled
            readOnly
            className={`w-full px-3 py-3 border rounded-lg ${
              darkMode
                ? 'border-gray-600 bg-gray-800 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        );
      }

      return (
        <SearchableSelect
          options={field.options || []}
          value={String(value ?? '')}
          onChange={() => {}}
          placeholder={field.placeholder || `Select ${field.label || ''}`}
          disabled
          darkMode={darkMode}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select
          value={String(value ?? '')}
          disabled
          className={`w-full px-3 py-3 border rounded-lg ${
            darkMode
              ? 'border-gray-600 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {(field.options || []).map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type || 'text'}
        value={displayValue ?? ''}
        disabled
        readOnly
        className={`w-full px-3 py-3 border rounded-lg ${
          darkMode
            ? 'border-gray-600 bg-gray-800 text-white'
            : 'border-gray-300 bg-white text-gray-900'
        }`}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } max-h-[90vh] overflow-y-auto animate-scale-up`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 relative ${darkMode ? 'border-gray-700' : 'border-gray-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4`}>
          <div className="flex items-center gap-3 pl-3">
            {Icon && <Icon className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />}
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-b-2xl`}>

          {tabs ? (
            /* ── Tabbed layout ── */
            <>
              {/* Tab bar */}
              <div className={`flex border-b mb-5 -mt-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = (activeTab || tabs[0].id) === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-primary-500 text-primary-600'
                          : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {TabIcon && <TabIcon className="w-4 h-4" />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Active tab content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tabs.find((t) => t.id === (activeTab || tabs[0].id))?.fields || []).map((field, idx) => {
                  const value = (field.accessor || field.name || '').split('.').reduce((obj, k) => obj?.[k], item);
                  const displayValue = field.render
                    ? field.render(item)
                    : field.valueRender
                    ? field.valueRender(item)
                    : formatValue(value, field);
                  return (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } ${field.fullWidth ? 'md:col-span-2' : ''}`}>
                      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>{field.label}</label>
                      {renderAsFormFields ? (
                        renderReadonlyField(field, value, displayValue)
                      ) : (
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {displayValue}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Flat layout (original) ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {fields.map((field, idx) => {
                const value = field.accessor.split('.').reduce((obj, key) => obj?.[key], item);
                return (
                  <div key={idx} className={field.fullWidth ? 'md:col-span-2' : ''}>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {field.label}
                    </label>
                    <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatValue(value, field)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timestamps Section */}
          {!tabs && (item.created_at || item.updated_at) && (
            <>
              <div className={`border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Created At */}
                  {item.created_at && (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiCalendar className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Created At
                        </span>
                      </div>
                      <p className={`text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatTimestamp(item.created_at)}
                      </p>
                    </div>
                  )}

                  {/* Updated At */}
                  {item.updated_at && (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiClock className={darkMode ? 'text-green-400' : 'text-green-600'} />
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Last Updated
                        </span>
                      </div>
                      <p className={`text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatTimestamp(item.updated_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex justify-end gap-2 p-6 border-t ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;

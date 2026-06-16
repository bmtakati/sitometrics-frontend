/**
 * SearchableSelect — a Select2-style combobox that lets users type to filter
 * options. Built on @headlessui/react Combobox (v1.x).
 *
 * Props
 *   options   : Array<{ value: string, label: string, disabled?: boolean }> — rows with empty value are treated as placeholders and omitted from the list (use `placeholder` on the input instead).
 *   value     : string          — currently selected option value
 *   onChange  : (value) => void
 *   placeholder: string         — shown when nothing is selected (optional)
 *   disabled  : boolean
 *   darkMode  : boolean
 *   className : string          — extra classes on the trigger wrapper
 */
import React, { useState, useRef, useMemo, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Combobox } from '@headlessui/react';
import { FiChevronDown, FiCheck, FiX } from 'react-icons/fi';

const ComboboxOptionsPortal = ({
  open,
  triggerRef,
  darkMode,
  filtered,
  query,
}) => {
  const [menuStyle, setMenuStyle] = useState(null);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return undefined;
    }

    updateMenuPosition();
    const handle = () => updateMenuPosition();
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [open, updateMenuPosition]);

  if (!open || !menuStyle) return null;

  return createPortal(
    <Combobox.Options
      static
      style={menuStyle}
      className={`max-h-60 overflow-auto rounded-lg border shadow-lg text-sm outline-none ${
        darkMode
          ? 'bg-gray-800 border-gray-600 text-gray-200'
          : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      {filtered.length === 0 ? (
        <div className={`px-3 py-2 text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          No options match "{query}"
        </div>
      ) : (
        filtered.map((option) => (
          <Combobox.Option
            key={`${String(option.value)}-${option.label}`}
            value={String(option.value)}
            disabled={option.disabled}
            className={({ active }) =>
              `flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-colors ${
                option.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : active
                  ? darkMode
                    ? 'bg-primary-900/40 text-white'
                    : 'bg-primary-50 text-primary-900'
                  : ''
              }`
            }
          >
            {({ selected }) => (
              <>
                <span className={`truncate ${selected ? 'font-medium' : ''}`}>{option.label}</span>
                {selected && <FiCheck className="w-4 h-4 flex-shrink-0 text-primary-600 ml-2" />}
              </>
            )}
          </Combobox.Option>
        ))
      )}
    </Combobox.Options>,
    document.body
  );
};

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  darkMode = false,
  className = '',
  autoFocus = false,
  invalid = false,
  size = 'default',
}) => {
  const [query, setQuery] = useState('');
  const inputRef          = useRef(null);
  const buttonRef         = useRef(null);
  const triggerRef        = useRef(null);

  const hasRealValue =
    value !== '' && value !== null && value !== undefined;

  /** Exclude synthetic "Select…" rows ({ value: '' }) so their label is never used as input text. */
  const selectableOptions = useMemo(
    () =>
      options.filter(
        (o) => o.value !== '' && o.value !== null && o.value !== undefined
      ),
    [options]
  );

  const selectedOption = hasRealValue
    ? options.find((o) => String(o.value) === String(value)) ?? null
    : null;

  const handleChange = (newValue) => {
    onChange(newValue);
    setQuery('');
  };

  useEffect(() => {
    setQuery('');
  }, [value]);

  const filtered =
    query.trim() === ''
      ? selectableOptions
      : selectableOptions.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  const sizeClasses =
    size === 'compact'
      ? 'h-[38px] min-h-[38px]'
      : 'h-12 min-h-[48px]';
  const base = `relative flex items-center gap-1 px-3 ${sizeClasses} rounded-lg border text-sm cursor-pointer transition-colors ${className}`;
  const colors = invalid
    ? darkMode
      ? 'bg-gray-800 border-red-500 text-gray-300'
      : 'bg-white border-red-500 text-gray-900'
    : darkMode
      ? 'bg-gray-800 border-gray-600 text-gray-300'
      : 'bg-white border-gray-300 text-gray-900';
  const focusRing = 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none';
  const disabledCls = disabled ? 'opacity-50 pointer-events-none' : '';

  return (
    <Combobox
      as="div"
      value={String(value ?? '')}
      onChange={handleChange}
      disabled={disabled}
      className={`relative min-w-0 w-full ${disabledCls}`}
      nullable
    >
      {({ open }) => (
        <>
          {/* Input + chevron trigger */}
          <div ref={triggerRef} className={`${base} ${colors} ${focusRing}`}>
            <Combobox.Input
              ref={inputRef}
              className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${
                darkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'
              }`}
              displayValue={() => {
                if (query !== '') return query;
                return selectedOption?.label ?? '';
              }}
              onChange={(e) => setQuery(e.target.value)}
              onClick={() => { if (!open) buttonRef.current?.click(); }}
              onFocus={() => { if (!open) buttonRef.current?.click(); }}
              placeholder={placeholder}
              autoComplete="off"
              autoFocus={autoFocus}
            />
            {/* Clear button */}
            {selectedOption && hasRealValue && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); handleChange(''); }}
                className={`flex-shrink-0 rounded p-0.5 hover:bg-gray-200/60 ${darkMode ? 'hover:bg-gray-700' : ''}`}
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
            <Combobox.Button
              ref={buttonRef}
              as="button"
              type="button"
              tabIndex={-1}
              className="flex-shrink-0 focus:outline-none"
              onClick={() => { if (!open) setQuery(''); }}
            >
              <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </Combobox.Button>
          </div>

          <ComboboxOptionsPortal
            open={open}
            triggerRef={triggerRef}
            darkMode={darkMode}
            filtered={filtered}
            query={query}
          />
        </>
      )}
    </Combobox>
  );
};

export default SearchableSelect;


import React, { useState, useRef, useMemo, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiSearch } from 'react-icons/fi';

const MultiSearchableSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Search and select items…',
  disabled = false,
  darkMode = false,
  className = '',
  invalid = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const selectedSet = useMemo(() => new Set(selectedValues.map(String)), [selectedValues]);

  const selectableOptions = useMemo(
    () => options.filter((o) => o.value !== '' && o.value != null),
    [options]
  );

  const matchesQuery = useCallback(
    (option) => {
      if (!query.trim()) return true;
      return option.label.toLowerCase().includes(query.toLowerCase());
    },
    [query]
  );

  const { selectedOptions, availableOptions } = useMemo(() => {
    const selected = [];
    const available = [];
    selectableOptions.forEach((option) => {
      if (!matchesQuery(option)) return;
      if (selectedSet.has(String(option.value))) {
        selected.push(option);
      } else {
        available.push(option);
      }
    });
    return { selectedOptions: selected, availableOptions: available };
  }, [selectableOptions, selectedSet, matchesQuery]);

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
  }, []);

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

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      const menu = document.getElementById('multi-searchable-select-menu');
      if (menu?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const toggleValue = (value) => {
    const key = String(value);
    const next = new Set(selectedValues.map(String));
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  const shellClass = invalid
    ? darkMode
      ? 'border-red-500 bg-gray-800'
      : 'border-red-500 bg-white'
    : darkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';

  const textClass = darkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400';

  const renderOption = (option, isSelected) => (
    <button
      key={`${option.value}-${option.label}`}
      type="button"
      onClick={() => toggleValue(option.value)}
      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
        isSelected
          ? darkMode
            ? 'bg-emerald-900/40 text-emerald-200'
            : 'bg-emerald-50 text-emerald-800'
          : darkMode
            ? 'text-gray-200 hover:bg-gray-700'
            : 'text-gray-800 hover:bg-gray-50'
      }`}
    >
      <span className="min-w-0 truncate">{option.label}</span>
      {isSelected ? <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" /> : null}
    </button>
  );

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            id="multi-searchable-select-menu"
            style={menuStyle}
            className={`max-h-72 overflow-auto rounded-lg border shadow-lg outline-none ${
              darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
            }`}
          >
            {selectedOptions.length ? (
              <div>
                <div
                  className={`sticky top-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                    darkMode ? 'bg-gray-800 text-emerald-400' : 'bg-white text-emerald-700'
                  }`}
                >
                  Selected ({selectedOptions.length})
                </div>
                {selectedOptions.map((option) => renderOption(option, true))}
              </div>
            ) : null}

            {selectedOptions.length && availableOptions.length ? (
              <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            ) : null}

            {availableOptions.length ? (
              <div>
                <div
                  className={`sticky top-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                    darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                  }`}
                >
                  Available
                </div>
                {availableOptions.map((option) => renderOption(option, false))}
              </div>
            ) : null}

            {!selectedOptions.length && !availableOptions.length ? (
              <div className={`px-3 py-2 text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {query.trim() ? `No items match "${query}"` : 'No items available'}
              </div>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={triggerRef} className={`relative min-w-0 w-full ${className}`}>
        <div
          className={`flex h-[38px] min-h-[38px] items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none ${
            disabled ? 'pointer-events-none opacity-50' : ''
          } ${shellClass}`}
        >
          <FiSearch className={`h-4 w-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              selectedValues.length
                ? `${selectedValues.length} selected — ${placeholder}`
                : placeholder
            }
            disabled={disabled}
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${textClass}`}
            autoComplete="off"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((prev) => !prev)}
            className="flex-shrink-0 focus:outline-none"
          >
            <FiChevronDown
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''} ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
          </button>
        </div>
      </div>
      {menu}
    </>
  );
};

export default MultiSearchableSelect;

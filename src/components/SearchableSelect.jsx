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
 *   searchInDropdown: boolean — when true, selected value stays on the trigger and search is a field at the top of the dropdown list
 */
import React, { useState, useRef, useMemo, useEffect, useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Combobox } from '@headlessui/react';
import { FiChevronDown, FiCheck, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { getPosMode, subscribePosMode } from '../context/PosModeContext';

const CreateOptionButton = ({ darkMode, label, onClick, className = '' }) => (
  <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium ${
      darkMode
        ? 'border-gray-600 bg-gray-800 text-emerald-400 hover:bg-gray-700'
        : 'border-gray-200 bg-white text-emerald-700 hover:bg-emerald-50'
    } ${className}`}
  >
    <FiPlus className="h-4 w-4 shrink-0" />
    <span>{label}</span>
  </button>
);

const TouchChoiceField = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  darkMode,
  createOption,
}) => {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const selectable = useMemo(
    () => options.filter((o) => o.value !== '' && o.value !== null && o.value !== undefined && !o.disabled),
    [options]
  );

  const selected = selectable.find((o) => String(o.value) === String(value)) ?? null;

  const filtered = query.trim()
    ? selectable.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : selectable;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, open]);

  const choose = (next) => {
    onChange(String(next));
    setQuery('');
    setOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={`flex min-h-[4.5rem] min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border px-5 py-5 text-left text-xl font-semibold ${
            darkMode
              ? 'border-stone-600 bg-stone-800 text-stone-100'
              : 'border-stone-300 bg-white text-stone-900'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <span className={selected ? '' : 'font-medium text-stone-400'}>
            {selected?.label || placeholder}
          </span>
          <FiChevronDown className="h-7 w-7 shrink-0 text-emerald-600" />
        </button>
        {selected ? (
          <button
            type="button"
            disabled={disabled}
            onClick={clearSelection}
            className="inline-flex min-h-[4.5rem] min-w-[4.5rem] items-center justify-center gap-2 rounded-2xl border border-red-300 px-4 text-lg font-semibold text-red-600"
            aria-label="Clear selection"
          >
            <FiX className="h-7 w-7" />
          </button>
        ) : null}
      </div>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 flex flex-col bg-stone-100 dark:bg-stone-950"
              style={{ zIndex: 2147483646 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-4 dark:border-stone-700 dark:bg-stone-900">
                <h2 className="text-2xl font-bold">{placeholder}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-14 rounded-xl border px-5 text-lg font-semibold"
                >
                  Close
                </button>
              </div>
              {selectable.length > PAGE_SIZE ? (
                <div className="px-4 pt-4">
                  <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 dark:border-stone-600 dark:bg-stone-800">
                    <FiSearch className="h-6 w-6 text-stone-400" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="min-h-14 w-full bg-transparent text-xl outline-none"
                      autoFocus
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-4 sm:grid-cols-2">
                {selected ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="col-span-full flex min-h-20 items-center justify-center gap-3 rounded-2xl border border-red-300 bg-white px-6 py-5 text-xl font-semibold text-red-600 dark:bg-stone-900"
                  >
                    <FiX className="h-7 w-7" />
                    Clear selected item
                  </button>
                ) : null}
                {pageItems.map((option) => {
                  const active = String(option.value) === String(value);
                  return (
                    <button
                      key={`${option.value}-${option.label}`}
                      type="button"
                      onClick={() => choose(option.value)}
                      className={`flex min-h-20 items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-xl font-semibold ${
                        active
                          ? 'bg-emerald-600 text-white'
                          : 'border border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100'
                      }`}
                    >
                      <span>{option.label}</span>
                      {active ? <FiCheck className="h-7 w-7 shrink-0" /> : null}
                    </button>
                  );
                })}
                {!filtered.length ? (
                  <p className="col-span-full px-2 py-6 text-xl text-stone-500">No matches.</p>
                ) : null}
                {createOption ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      createOption.onClick();
                    }}
                    className="col-span-full flex min-h-20 items-center justify-center gap-3 rounded-2xl border border-emerald-600 bg-white px-6 py-5 text-xl font-semibold text-emerald-700 dark:bg-stone-900 dark:text-emerald-400"
                  >
                    <FiPlus className="h-7 w-7" />
                    {createOption.label}
                  </button>
                ) : null}
              </div>
              {filtered.length > PAGE_SIZE ? (
                <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="inline-flex min-h-14 items-center gap-2 rounded-2xl border px-5 text-lg font-semibold disabled:opacity-40"
                  >
                    <FiChevronLeft className="h-6 w-6" />
                    Previous
                  </button>
                  <span className="text-lg font-semibold">
                    {safePage} / {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    className="inline-flex min-h-14 items-center gap-2 rounded-2xl border px-5 text-lg font-semibold disabled:opacity-40"
                  >
                    Next
                    <FiChevronRight className="h-6 w-6" />
                  </button>
                </div>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
};


const useMenuPosition = (open, triggerRef) => {
  const [menuStyle, setMenuStyle] = useState(null);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 2147483600,
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

  return menuStyle;
};

const ComboboxOptionsPortal = ({
  open,
  triggerRef,
  darkMode,
  filtered,
  query,
  createOption,
  onCreateOption,
}) => {
  const menuStyle = useMenuPosition(open, triggerRef);

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
      {createOption ? (
        <CreateOptionButton
          darkMode={darkMode}
          label={createOption.label}
          onClick={onCreateOption}
          className="sticky bottom-0"
        />
      ) : null}
    </Combobox.Options>,
    document.body
  );
};

const MenuSearchSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  darkMode,
  className,
  invalid,
  size,
  createOption,
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const menuStyle = useMenuPosition(open, triggerRef);

  const hasRealValue = value !== '' && value !== null && value !== undefined;
  const selectableOptions = useMemo(
    () => options.filter((o) => o.value !== '' && o.value !== null && o.value !== undefined),
    [options]
  );
  const selectedOption = hasRealValue
    ? options.find((o) => String(o.value) === String(value)) ?? null
    : null;

  const filtered = query.trim() === ''
    ? selectableOptions
    : selectableOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const sizeClasses = size === 'compact' ? 'h-[38px] min-h-[38px]' : 'h-12 min-h-[48px]';
  const base = `relative flex items-center gap-1 px-3 ${sizeClasses} rounded-lg border text-sm cursor-pointer transition-colors ${className}`;
  const colors = invalid
    ? darkMode
      ? 'bg-gray-800 border-red-500 text-gray-300'
      : 'bg-white border-red-500 text-gray-900'
    : darkMode
      ? 'bg-gray-800 border-gray-600 text-gray-300'
      : 'bg-white border-gray-300 text-gray-900';
  const focusRing = open ? 'ring-2 ring-primary-500 outline-none' : '';
  const disabledCls = disabled ? 'opacity-50 pointer-events-none' : '';

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }

    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    const handlePointer = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const choose = (next) => {
    onChange(String(next));
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={`relative min-w-0 w-full ${disabledCls}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${base} ${colors} ${focusRing} w-full text-left`}
      >
        <span
          className={`flex-1 min-w-0 truncate ${
            selectedOption
              ? darkMode ? 'text-gray-300' : 'text-gray-700'
              : darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>
        {clearable && selectedOption && hasRealValue ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setQuery('');
              setOpen(false);
            }}
            className={`flex-shrink-0 rounded p-0.5 hover:bg-gray-200/60 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            aria-label="Clear selection"
          >
            <FiX className="w-3 h-3" />
          </button>
        ) : null}
        <FiChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className={`max-h-72 overflow-hidden rounded-lg border shadow-lg text-sm outline-none flex flex-col ${
                darkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
              role="listbox"
            >
              <div
                className={`sticky top-0 z-10 flex items-center gap-2 border-b px-2.5 py-2 ${
                  darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}
              >
                <FiSearch className={`h-3.5 w-3.5 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                    darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-56 overflow-auto">
                {filtered.length === 0 ? (
                  <div className={`px-3 py-2 text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    No options match "{query}"
                  </div>
                ) : (
                  filtered.map((option) => {
                    const selected = String(option.value) === String(value);
                    return (
                      <button
                        key={`${String(option.value)}-${option.label}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={option.disabled}
                        onClick={() => choose(option.value)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left cursor-pointer select-none transition-colors ${
                          option.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : darkMode
                              ? 'hover:bg-primary-900/40 hover:text-white'
                              : 'hover:bg-primary-50 hover:text-primary-900'
                        }`}
                      >
                        <span className={`truncate ${selected ? 'font-medium' : ''}`}>{option.label}</span>
                        {selected ? <FiCheck className="w-4 h-4 flex-shrink-0 text-primary-600 ml-2" /> : null}
                      </button>
                    );
                  })
                )}
                {createOption ? (
                  <CreateOptionButton
                    darkMode={darkMode}
                    label={createOption.label}
                    onClick={() => {
                      setOpen(false);
                      createOption.onClick?.();
                    }}
                    className="sticky bottom-0"
                  />
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
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
  createOption = null,
  searchInDropdown = false,
  clearable = true,
}) => {
  const posMode = useSyncExternalStore(subscribePosMode, getPosMode, () => false);
  const useTouch = posMode;
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

  if (useTouch) {
    return (
      <TouchChoiceField
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        darkMode={darkMode}
        createOption={createOption}
      />
    );
  }

  if (searchInDropdown) {
    return (
      <MenuSearchSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        darkMode={darkMode}
        className={className}
        invalid={invalid}
        size={size}
        createOption={createOption}
        clearable={clearable}
      />
    );
  }

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
            createOption={createOption}
            onCreateOption={() => {
              if (open) buttonRef.current?.click();
              createOption?.onClick?.();
            }}
          />
        </>
      )}
    </Combobox>
  );
};

export default SearchableSelect;


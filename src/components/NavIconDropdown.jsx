import React, { useState, useEffect, useRef } from 'react';
import {
  FiChevronDown,
  FiSun,
  FiMoon,
  FiMonitor,
  FiGlobe,
  FiType,
  FiZoomOut,
  FiZoomIn,
  FiMaximize2,
} from 'react-icons/fi';
import { resolveApiAssetUrl } from '../utils/resolveApiAssetUrl';
import { LOCALE_FLAG_ASSETS } from '../utils/localeFlags';

export const LANGUAGE_OPTIONS = [
  {
    value: 'en',
    label: 'English',
    flagUrl: resolveApiAssetUrl(LOCALE_FLAG_ASSETS.en),
  },
  {
    value: 'sw',
    label: 'Kiswahili',
    flagUrl: resolveApiAssetUrl(LOCALE_FLAG_ASSETS.sw),
  },
];

export const THEME_OPTIONS_WITH_ICONS = [
  { value: 'system', label: 'Device', Icon: FiMonitor },
  { value: 'light', label: 'Light', Icon: FiSun },
  { value: 'dark', label: 'Dark', Icon: FiMoon },
];

export const FONT_SIZE_OPTIONS_WITH_ICONS = [
  { value: 'sm', label: 'Small', Icon: FiZoomOut },
  { value: 'md', label: 'Medium', Icon: FiType },
  { value: 'lg', label: 'Large', Icon: FiZoomIn },
  { value: 'xl', label: 'Extra large', Icon: FiMaximize2 },
];

const navDropdownTriggerClass = (isDark, triggerVariant = 'default') => {
  const base =
    'flex h-9 items-center gap-1 rounded-md px-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  if (triggerVariant === 'ghost') {
    return `${base} ${
      isDark
        ? 'text-gray-300 hover:bg-gray-800/80 focus:ring-gray-600 focus:ring-offset-gray-900'
        : 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400 focus:ring-offset-white'
    }`;
  }

  return `${base} h-10 px-2.5 rounded-lg border ${
    isDark
      ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-900'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-400 focus:ring-offset-white'
  }`;
};

const navDropdownPanelClass = (isDark) =>
  `absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border py-1 shadow-lg ${
    isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
  }`;

const navDropdownItemClass = (isDark, selected) =>
  `flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
    selected
      ? isDark
        ? 'bg-primary-900/40 text-primary-200'
        : 'bg-primary-50 text-primary-800'
      : isDark
        ? 'text-gray-200 hover:bg-gray-700'
        : 'text-gray-800 hover:bg-gray-50'
  }`;

function FlagImage({ src, className }) {
  return (
    <img
      src={src}
      alt=""
      className={`${className} rounded-sm border border-gray-200/80 object-cover dark:border-gray-600`}
      loading="lazy"
      decoding="async"
    />
  );
}

function OptionMedia({ option, className, variant }) {
  if (option?.flagUrl) {
    const flagClass =
      variant === 'language'
        ? `${className} aspect-[4/3]`
        : `${className} aspect-[4/3]`;
    return <FlagImage src={option.flagUrl} className={flagClass} />;
  }
  if (option?.Icon) {
    const Icon = option.Icon;
    return <Icon className={className} strokeWidth={1.75} aria-hidden />;
  }
  return <FiGlobe className={className} strokeWidth={1.75} aria-hidden />;
}

/**
 * Icon-only trigger; open menu shows icon + label for each option.
 */
export default function NavIconDropdown({
  id,
  value,
  onChange,
  options,
  darkMode,
  ariaLabel,
  className = '',
  /** When true, trigger shows flag/icon plus uppercase locale code (e.g. EN). */
  showCodeInTrigger = false,
  /** 'language' — flag-first styling for locale switcher */
  variant = 'default',
  triggerVariant = 'default',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const safeOptions = options?.length ? options : LANGUAGE_OPTIONS;
  const selected = safeOptions.find((o) => o.value === value) ?? safeOptions[0];
  const selectedCode = String(selected?.value || '').toUpperCase();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={
          showCodeInTrigger && selectedCode
            ? `${ariaLabel}: ${selected.label} (${selectedCode})`
            : `${ariaLabel}: ${selected.label}`
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        title={showCodeInTrigger && selectedCode ? `${selected.label} (${selectedCode})` : selected.label}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`${navDropdownTriggerClass(darkMode, triggerVariant)} ${disabled ? 'pointer-events-none opacity-50' : ''} ${
          variant === 'language' ? 'min-w-[4.5rem] gap-1.5' : ''
        }`}
      >
        <OptionMedia
          option={selected}
          variant={variant}
          className={
            variant === 'language'
              ? 'h-4 w-6 shrink-0'
              : showCodeInTrigger
                ? 'h-4 w-6 shrink-0'
                : 'h-5 w-5 shrink-0'
          }
        />
        {showCodeInTrigger && selectedCode ? (
          <span
            className={`shrink-0 font-mono text-xs font-semibold uppercase tracking-tight ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            {selectedCode}
          </span>
        ) : null}
        <FiChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <ul role="listbox" aria-labelledby={id} className={navDropdownPanelClass(darkMode)}>
          {safeOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={navDropdownItemClass(darkMode, isSelected)}
                >
                  <OptionMedia option={opt} variant={variant} className="h-4 w-6 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  FiChevronDown,
  FiSun,
  FiMoon,
  FiMonitor,
  FiGlobe,
  FiMessageCircle,
  FiType,
  FiZoomOut,
  FiZoomIn,
  FiMaximize2,
} from 'react-icons/fi';

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', Icon: FiGlobe },
  { value: 'sw', label: 'Kiswahili', Icon: FiMessageCircle },
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

const navDropdownTriggerClass = (isDark) =>
  `flex h-10 items-center gap-1 rounded-lg border px-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    isDark
      ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-900'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-400 focus:ring-offset-white'
  }`;

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

function OptionMedia({ option, className }) {
  if (option?.flagUrl) {
    return (
      <img
        src={option.flagUrl}
        alt=""
        className={`${className} rounded-sm border border-gray-200/80 object-contain dark:border-gray-600`}
        width={option.flagUrl.endsWith('.svg') ? undefined : 24}
        height={option.flagUrl.endsWith('.svg') ? undefined : 16}
      />
    );
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
        aria-label={
          showCodeInTrigger && selectedCode
            ? `${ariaLabel}: ${selected.label} (${selectedCode})`
            : `${ariaLabel}: ${selected.label}`
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        title={showCodeInTrigger && selectedCode ? `${selected.label} (${selectedCode})` : selected.label}
        onClick={() => setOpen((prev) => !prev)}
        className={navDropdownTriggerClass(darkMode)}
      >
        <OptionMedia
          option={selected}
          className={showCodeInTrigger ? 'h-4 w-6 shrink-0' : 'h-5 w-5 shrink-0'}
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
                  <OptionMedia option={opt} className="h-4 w-6 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

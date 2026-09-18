import React from 'react';
import useDarkMode from '../hooks/useDarkMode';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const PageTabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  buttonClassName = '',
  ariaLabel = 'Tabs',
  resetOnChange,
}) => {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx('flex items-center overflow-x-auto overflow-y-hidden border-b mb-4 scrollbar-hide', darkMode ? 'border-gray-700' : 'border-gray-200', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              onChange(tab.id);
              resetOnChange?.(tab.id);
            }}
            className={cx(
              'relative flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary-600 text-primary-600'
                : darkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-200'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              buttonClassName,
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.badge != null && tab.badge !== false && (
              <span className={cx(
                'ml-1 rounded-full px-1.5 py-0.5 text-xs leading-none text-white',
                tab.badgeClassName || 'bg-red-500',
              )}>
                {tab.badge}
              </span>
            )}
            {tab.hasError && (
              <span className="absolute right-0.5 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PageTabs;

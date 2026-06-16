import React from 'react';
import PropTypes from 'prop-types';
import useDarkMode from '../hooks/useDarkMode';

const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  actions = [],
  className = '',
}) => {
  const darkMode = useDarkMode();

  const variantClasses = {
    primary: darkMode
      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-900/30'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20',
    secondary: darkMode
      ? 'border border-stone-600 text-stone-200 hover:bg-stone-800'
      : 'border border-stone-300 text-stone-700 hover:bg-stone-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border mb-6 ${
        darkMode
          ? 'bg-stone-900/80 border-stone-700/80 shadow-lg shadow-black/20'
          : 'bg-gradient-to-br from-white via-stone-50 to-emerald-50/40 border-stone-200/80 shadow-sm'
      } ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" aria-hidden />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                darkMode
                  ? 'border-emerald-800/60 bg-emerald-950/60 text-emerald-400'
                  : 'border-emerald-100 bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={`text-xl font-semibold tracking-tight sm:text-2xl ${
                darkMode ? 'text-stone-50' : 'text-stone-900'
              }`}
            >
              {title}
            </h1>
            {subtitle && (
              <p className={`mt-1 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    variantClasses[action.variant || 'primary']
                  } ${action.className || ''}`}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
      disabled: PropTypes.bool,
      className: PropTypes.string,
    })
  ),
  className: PropTypes.string,
  accentColor: PropTypes.string,
};

export default PageHeader;

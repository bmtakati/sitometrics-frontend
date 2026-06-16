import React from 'react';
import PropTypes from 'prop-types';
import useDarkMode from '../hooks/useDarkMode';
import { resolveIconColor, resolveIconBg } from '../utils/iconColors';

const StatsGrid = ({ stats = [], columns = 4, loading = false }) => {
  const darkMode = useDarkMode();

  const getGridClass = () => {
    const gridClasses = {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-6',
    };
    return gridClasses[columns] || 'grid-cols-1 md:grid-cols-4';
  };

  if (loading) {
    return (
      <div className={`mb-6 grid ${getGridClass()} gap-4`}>
        {[...Array(columns)].map((_, index) => (
          <div
            key={index}
            className={`animate-pulse rounded-2xl border p-5 ${
              darkMode ? 'border-stone-700 bg-stone-900/70' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`mb-2 h-3 w-24 rounded ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`} />
                <div className={`h-8 w-16 rounded ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`} />
              </div>
              <div className={`h-11 w-11 rounded-xl ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className={`mb-6 grid ${getGridClass()} gap-4`}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const iconClass = resolveIconColor(stat.iconColor);
        const iconBg = resolveIconBg(stat.iconColor?.replace('text-', ''), darkMode);

        return (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              darkMode
                ? 'border-stone-700/80 bg-stone-900/70 hover:border-emerald-800/60 hover:shadow-lg hover:shadow-emerald-950/20'
                : 'border-stone-200/90 bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${
                darkMode ? 'bg-emerald-600/70' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
              }`}
              aria-hidden
            />

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p
                  className={`mb-1 text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}>
                  {stat.value !== undefined && stat.value !== null ? stat.value : '0'}
                </p>
                {stat.subtext && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {stat.subtext}
                  </p>
                )}
              </div>
              {IconComponent && (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
                    darkMode ? 'border-stone-700' : 'border-stone-100'
                  } ${iconBg}`}
                >
                  <IconComponent className={`h-5 w-5 ${iconClass}`} strokeWidth={2.25} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

StatsGrid.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      icon: PropTypes.elementType,
      iconColor: PropTypes.string,
      subtext: PropTypes.string,
    })
  ),
  columns: PropTypes.oneOf([2, 3, 4, 5, 6]),
  loading: PropTypes.bool,
};

export default StatsGrid;

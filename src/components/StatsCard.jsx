import React from 'react';
import useDarkMode from '../hooks/useDarkMode';
import { resolveIconColor, resolveIconBg } from '../utils/iconColors';

const StatsCard = ({ label, value, icon: Icon, iconColor, className = '' }) => {
  const darkMode = useDarkMode();
  const iconClass = resolveIconColor(iconColor);
  const iconBg = resolveIconBg(iconColor, darkMode);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
        darkMode
          ? 'border-stone-700/80 bg-stone-900/70 hover:border-emerald-800/60 hover:shadow-lg hover:shadow-emerald-950/20'
          : 'border-stone-200/90 bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50'
      } ${className}`}
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
            {label}
          </p>
          <p className={`text-2xl font-bold tabular-nums ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}>
            {value ?? 0}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
              darkMode ? 'border-stone-700' : 'border-stone-100'
            } ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconClass}`} strokeWidth={2.25} />
          </div>
        )}
      </div>
    </div>
  );
};

export const StatsCards = ({ cards, columns = 4, className = '' }) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  return (
    <div className={`mb-6 grid grid-cols-1 gap-4 ${gridCols[columns] || 'md:grid-cols-4'} ${className}`}>
      {cards.map((card, index) => (
        <StatsCard
          key={index}
          label={card.label}
          value={card.value}
          icon={card.icon}
          iconColor={card.iconColor}
          className={card.className}
        />
      ))}
    </div>
  );
};

export default StatsCard;

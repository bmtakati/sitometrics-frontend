import React from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import PropTypes from 'prop-types';

const SitometricsLogo = ({ collapsed = false, darkMode = false, className = '' }) => {
  const iconShell = `flex shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
    darkMode
      ? 'border-emerald-700/50 bg-emerald-950/60 text-emerald-400 group-hover:border-emerald-500 group-hover:bg-emerald-900/70 group-hover:text-emerald-300 group-hover:shadow-emerald-900/40'
      : 'border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:border-emerald-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:shadow-emerald-200/80'
  }`;

  if (collapsed) {
    return (
      <div className={`group flex justify-center ${className}`}>
        <div className={`${iconShell} h-10 w-10`}>
          <FiBarChart2 className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`${iconShell} h-10 w-10`}>
        <FiBarChart2 className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <h1
          className={`truncate text-base font-bold tracking-tight transition-colors duration-300 group-hover:text-emerald-600 ${
            darkMode ? 'text-stone-50 group-hover:text-emerald-300' : 'text-stone-900'
          }`}
        >
          SITOMETRICS
        </h1>
        <p
          className={`truncate text-[10px] uppercase tracking-wider transition-colors duration-300 group-hover:text-emerald-600 ${
            darkMode ? 'text-emerald-500/80 group-hover:text-emerald-400' : 'text-emerald-700'
          }`}
        >
          F&B Inventory & Procurement
        </p>
      </div>
    </div>
  );
};

SitometricsLogo.propTypes = {
  collapsed: PropTypes.bool,
  darkMode: PropTypes.bool,
  className: PropTypes.string,
};

export default SitometricsLogo;

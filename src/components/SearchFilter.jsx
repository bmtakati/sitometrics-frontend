import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

/**
 * Reusable SearchFilter Component
 * 
 * @param {Object} props
 * @param {String} props.searchValue - Current search term value
 * @param {Function} props.onSearchChange - Handler for search input change
 * @param {String} props.searchPlaceholder - Placeholder text for search input
 * @param {Array} props.filterOptions - Array of filter option objects
 * @param {String} props.filterValue - Current filter value
 * @param {Function} props.onFilterChange - Handler for filter dropdown change
 * @param {Function} props.onClear - Handler for clear button click
 * @param {Boolean} props.showClearButton - Whether to show clear button
 * @param {Object} props.customFilters - Additional custom filter elements
 */
const SearchFilter = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  filterValue = 'all',
  onFilterChange,
  onClear,
  showClearButton = true,
  customFilters = null
}) => {
  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleFilterChange = (e) => {
    if (onFilterChange) {
      onFilterChange(e.target.value);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);

  return (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} rounded-xl shadow-card border p-6 mb-6`}>
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors`}
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Standard Filter Dropdown */}
          {filterOptions.length > 0 && (
            <select
              value={filterValue}
              onChange={handleFilterChange}
              className={`px-4 py-2 border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors`}
            >
              {filterOptions.map((option, idx) => (
                <option key={idx} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Custom Filters */}
          {customFilters}

          {/* Clear Button */}
          {showClearButton && (
            <button
              onClick={handleClear}
              className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;

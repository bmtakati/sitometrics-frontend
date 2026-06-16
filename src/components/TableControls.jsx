import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiPlus } from 'react-icons/fi';
import SearchableSelect from './SearchableSelect';
import useDarkMode from '../hooks/useDarkMode';

/**
 * Reusable Table Controls Component
 * Displays entries per page selector, search input, and filter dropdown
 * Positioned above the DataTable
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination configuration
 * @param {Number} props.pagination.itemsPerPage - Current items per page
 * @param {Function} props.pagination.onItemsPerPageChange - Items per page change handler
 * @param {Object} props.search - Search configuration
 * @param {String} props.search.value - Search value
 * @param {Function} props.search.onChange - Search change handler
 * @param {String} props.search.placeholder - Search placeholder
 * @param {Object} props.filter - Filter configuration
 * @param {Array} props.filter.options - Filter options array
 * @param {String} props.filter.value - Current filter value
 * @param {Function} props.filter.onChange - Filter change handler
 */
const TableControls = ({
  pagination = null,
  search = null,
  filter = null,
  emailFilter = null,
  // Array of { options, value, onChange } — extra filter selects rendered after the main filter
  extraFilters = null,
  // Add button: { label, icon, onClick, disabled }
  addButton = null
}) => {
  const darkMode = useDarkMode();
  
  // Local search input state to prevent focus loss
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef(null);

  // Initialize searchInput from search.value
  useEffect(() => {
    if (search?.value !== undefined) {
      setSearchInput(search.value);
    }
  }, []); // Run only once on mount

  // Sync searchInput with external search value when it changes externally
  useEffect(() => {
    if (search?.value !== undefined && search.value !== searchInput) {
      setSearchInput(search.value);
    }
  }, [search?.value]);

  // Debounced search effect
  useEffect(() => {
    if (!search) return;
    
    const timer = setTimeout(() => {
      if (searchInput !== search.value) {
        search.onChange(searchInput);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Email filter (optional): applied only when user clicks Filter.
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    // Keep email input synced with applied value.
    if (emailFilter?.value !== undefined && emailFilter.value !== emailInput) {
      setEmailInput(emailFilter.value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFilter?.value]);

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    if (search) {
      search.onChange('');
    }
    if (filter && filter.options && filter.options.length > 0) {
      // Reset to first option (usually 'All')
      filter.onChange(filter.options[0].value);
    }
    // Reset extra filters to their first option
    if (extraFilters) {
      extraFilters.forEach((ef) => {
        if (ef.options && ef.options.length > 0) {
          ef.onChange(ef.options[0].value);
        }
      });
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchInput
    || (filter && filter.value !== filter.options?.[0]?.value)
    || (extraFilters && extraFilters.some((ef) => ef.value !== (ef.options?.[0]?.value ?? 'all')));
  const hasEmailValue = (emailInput || '').trim().length > 0;
  const showEmailClear = emailFilter && ((emailFilter.value || '').trim().length > 0 || hasEmailValue);

  const hasFilters = (filter && filter.options) || (extraFilters && extraFilters.length > 0) || emailFilter;

  const shellClass = darkMode
    ? 'border-stone-700/80 bg-stone-900/70 shadow-lg shadow-black/10'
    : 'border-stone-200/90 bg-white shadow-sm';

  const inputClass = darkMode
    ? 'border-stone-600 bg-stone-800/80 text-stone-200 placeholder-stone-500'
    : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400';

  return (
    <div className={`relative z-30 overflow-visible rounded-t-2xl border border-b-0 ${shellClass}`}>
      <div className="space-y-2 px-6 py-4">

        {/* Row 1: Entries per page + Search + Filter + Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Entries Per Page */}
          <div className="flex items-center gap-2">
            {pagination && pagination.itemsPerPage && pagination.onItemsPerPageChange && (
              <>
                <label className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  Show
                </label>
                <select
                  value={String(pagination.itemsPerPage)}
                  onChange={(e) => pagination.onItemsPerPageChange(Number(e.target.value))}
                  className={`rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClass}`}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                  entries
                </span>
              </>
            )}
          </div>

          {/* Right: Search + Status Filter + Clear */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            {search && (
              <div className="relative">
                <FiSearch className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  darkMode ? 'text-stone-500' : 'text-stone-400'
                }`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={search.placeholder || 'Search...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`h-[38px] w-64 rounded-lg border py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClass}`}
                />
              </div>
            )}

            {/* Status filter */}
            {filter && filter.options && (
              <div className="relative z-30 w-48">
                <SearchableSelect
                  options={filter.options}
                  value={filter.value}
                  onChange={filter.onChange}
                  darkMode={darkMode}
                  size="compact"
                />
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  darkMode
                    ? 'border-stone-600 bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-white'
                }`}
                title="Clear all filters"
              >
                <FiX className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}

            {/* Add Button */}
            {addButton && (() => {
              const AddIcon = addButton.icon || FiPlus;
              return (
                <button
                  onClick={addButton.onClick}
                  disabled={addButton.disabled}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    darkMode
                      ? 'border-emerald-700/60 text-emerald-400 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
                      : 'border-emerald-600 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <AddIcon className="w-4 h-4" />
                  {addButton.label}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Row 2: Extra filters / Email filter (only when present) */}
        {(extraFilters?.length > 0 || emailFilter) && (
          <div className="flex flex-nowrap items-center gap-2">
            {/* Extra Filters (geo dropdowns etc.) */}
            {extraFilters && extraFilters.map((ef, idx) => (
              <div key={idx} className="relative z-30 w-52 shrink-0">
                {ef.label && (
                  <label className={`mb-1 block text-xs font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {ef.label}
                  </label>
                )}
                <SearchableSelect
                  options={ef.options ?? []}
                  value={ef.value}
                  onChange={ef.onChange}
                  darkMode={darkMode}
                  size="compact"
                />
              </div>
            ))}

            {/* Email Filter */}
            {emailFilter && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="email"
                  placeholder={emailFilter.placeholder || 'Filter by email...'}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-56 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => emailFilter.onFilter && emailFilter.onFilter(emailInput)}
                  disabled={!hasEmailValue}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    !hasEmailValue
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                      : darkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Apply email filter"
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                {showEmailClear && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('');
                      emailFilter.onClear && emailFilter.onClear();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Clear email filter"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableControls;

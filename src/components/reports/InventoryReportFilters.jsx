import React, { useEffect, useMemo, useState } from 'react';
import { FiBarChart2, FiCalendar } from 'react-icons/fi';
import SearchableSelect from '../SearchableSelect';
import apiFetch from '../../utils/apiFetch';
import { API_BASE_URL } from '../../context/AuthContext';

export const formatReportNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

export const useInventoryLookups = () => {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storeRes, itemRes, categoryRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/stores/all`),
          apiFetch(`${API_BASE_URL}/api/items/all`),
          apiFetch(`${API_BASE_URL}/api/item-categories/all`),
        ]);
        const [storeJson, itemJson, categoryJson] = await Promise.all([
          storeRes.json().catch(() => ({})),
          itemRes.json().catch(() => ({})),
          categoryRes.json().catch(() => ({})),
        ]);
        if (cancelled) return;
        setStores(Array.isArray(storeJson?.data) ? storeJson.data : []);
        setItems(Array.isArray(itemJson?.data) ? itemJson.data : []);
        setCategories(Array.isArray(categoryJson?.data) ? categoryJson.data : []);
      } catch {
        if (!cancelled) {
          setStores([]);
          setItems([]);
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stores, items, categories };
};

const InventoryReportFilters = ({
  darkMode,
  values,
  onChange,
  onRun,
  showDates = false,
  showDaysAhead = false,
}) => {
  const { stores, items, categories } = useInventoryLookups();

  const storeOptions = useMemo(() => [
    { value: '', label: 'All stores' },
    ...stores.map((store) => ({ value: String(store.id), label: store.code ? `${store.name} (${store.code})` : store.name })),
  ], [stores]);

  const itemOptions = useMemo(() => [
    { value: '', label: 'All items' },
    ...items.map((item) => ({ value: String(item.id), label: item.code ? `${item.name} (${item.code})` : item.name })),
  ], [items]);

  const categoryOptions = useMemo(() => [
    { value: '', label: 'All categories' },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.code ? `${category.name} (${category.code})` : category.name,
    })),
  ], [categories]);

  const inputClass = `h-10 rounded-md border px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
    darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
  }`;

  return (
    <div className={`rounded-lg border p-4 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {showDates && (
          <>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} w-full pl-9`}
                type="date"
                value={values.dateFrom || ''}
                onChange={(event) => onChange('dateFrom', event.target.value)}
              />
            </div>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} w-full pl-9`}
                type="date"
                value={values.dateTo || ''}
                onChange={(event) => onChange('dateTo', event.target.value)}
              />
            </div>
          </>
        )}
        <SearchableSelect
          options={categoryOptions}
          value={values.categoryId || ''}
          onChange={(value) => onChange('categoryId', value)}
          placeholder="All categories"
          darkMode={darkMode}
        />
        <SearchableSelect
          options={storeOptions}
          value={values.storeId || ''}
          onChange={(value) => onChange('storeId', value)}
          placeholder="All stores"
          darkMode={darkMode}
        />
        <SearchableSelect
          options={itemOptions}
          value={values.itemId || ''}
          onChange={(value) => onChange('itemId', value)}
          placeholder="All items"
          darkMode={darkMode}
        />
        {showDaysAhead && (
          <input
            className={inputClass}
            type="number"
            min="1"
            value={values.daysAhead || 30}
            onChange={(event) => onChange('daysAhead', event.target.value)}
            placeholder="Days ahead"
          />
        )}
        <button
          type="button"
          onClick={onRun}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
        >
          <FiBarChart2 className="h-4 w-4" />
          Run Report
        </button>
      </div>
    </div>
  );
};

export default InventoryReportFilters;

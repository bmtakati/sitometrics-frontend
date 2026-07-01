import React, { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { formatDate } from '../../utils/formatDate';

const ExchangeRate = () => {
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/currencies/all`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        const rows = Array.isArray(json?.data) ? json.data : [];
        setCurrencies(
          rows
            .map((row) => ({ id: row.id, code: row.code, name: row.name }))
            .filter((row) => row.id != null && row.code)
        );
      } catch (_) {
        // optional lookup list
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currencyById = useMemo(
    () => Object.fromEntries(currencies.map((c) => [String(c.id), c])),
    [currencies]
  );

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({
      value: String(c.id),
      label: `${c.code} — ${c.name}`
    })),
    [currencies]
  );

  const crud = useApiCrud('exchange-rates', {
    initialFormData: {
      from_currency_id: '',
      to_currency_id: '',
      rate: '',
      start_date: '',
      end_date: '',
      status_id: ''
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.from_currency_id) errors.from_currency_id = 'From currency is required';
      if (!data.to_currency_id) errors.to_currency_id = 'To currency is required';
      if (data.from_currency_id && data.to_currency_id && String(data.from_currency_id) === String(data.to_currency_id)) {
        errors.to_currency_id = 'From and to currencies must differ';
      }
      if (!data.rate || Number(data.rate) <= 0) errors.rate = 'Rate must be greater than zero';
      if (!data.start_date) errors.start_date = 'Start date is required';
      if (data.end_date && data.start_date && data.end_date < data.start_date) {
        errors.end_date = 'End date must be on or after the start date';
      }
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    transformFormData: (data) => ({
      from_currency_id: Number(data.from_currency_id),
      to_currency_id: Number(data.to_currency_id),
      rate: Number(data.rate),
      start_date: data.start_date,
      end_date: data.end_date || null,
      status_id: Number(data.status_id)
    }),
    resourceName: 'Exchange Rate',
    itemsPerPage: 10
  });

  const pageConfig = {
    icon: FiRefreshCw,
    title: 'Exchange Rates',
    subtitle: 'Manage currency conversion rates by date range',
    addButtonLabel: 'Add Exchange Rate',
    searchPlaceholder: 'Search exchange rates...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' }
    ]
  };

  const tableColumns = [
    {
      header: 'From',
      accessor: 'from_currency_id',
      noWrap: true,
      render: (row) => row.from_currency?.code || currencyById[String(row.from_currency_id)]?.code || '—'
    },
    {
      header: 'To',
      accessor: 'to_currency_id',
      noWrap: true,
      render: (row) => row.to_currency?.code || currencyById[String(row.to_currency_id)]?.code || '—'
    },
    {
      header: 'Rate',
      accessor: 'rate',
      noWrap: true,
      render: (row) => (row.rate != null
        ? Number(row.rate).toLocaleString(undefined, { maximumFractionDigits: 8 })
        : '—')
    },
    {
      header: 'Start Date',
      accessor: 'start_date',
      type: 'date',
      noWrap: true,
    },
    {
      header: 'End Date',
      accessor: 'end_date',
      noWrap: true,
      render: (row) => (row.end_date ? formatDate(row.end_date) : 'Open-ended'),
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true }
  ];

  const tableConfig = {
    emptyState: {
      title: 'No Exchange Rates Found',
      description: 'Get started by creating your first exchange rate.'
    }
  };

  const formFields = [
    {
      name: 'from_currency_id',
      label: 'From Currency',
      type: 'select',
      required: true,
      autoFocus: true,
      options: currencyOptions
    },
    {
      name: 'to_currency_id',
      label: 'To Currency',
      type: 'select',
      required: true,
      options: currencyOptions
    },
    { name: 'rate', label: 'Rate', type: 'number', required: true, min: 0, step: 'any', placeholder: 'e.g. 2650' },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: false, placeholder: 'Leave blank for open-ended' },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true }
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      tableConfig={tableConfig}
      formFields={formFields}
      modalTitle="Exchange Rate"
      crud={crud}
    />
  );
};

export default ExchangeRate;

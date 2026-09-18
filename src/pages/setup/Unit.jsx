import React, { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiGitMerge,
  FiPackage,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import PageTabs from '../../components/PageTabs';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const formatFactor = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

const Unit = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [unitOptions, setUnitOptions] = useState([{ value: '', label: 'Select unit' }]);
  const [unitFilter, setUnitFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/units/all`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const rows = Array.isArray(json?.data) ? json.data : [];
        setUnitOptions([
          { value: '', label: 'Select unit' },
          ...rows.map((unit) => ({
            value: String(unit.id),
            label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`,
          })),
        ]);
      } catch {
        if (!cancelled) setUnitOptions([{ value: '', label: 'Select unit' }]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const unitsCrud = useApiCrud('units', {
    initialFormData: {
      name: '',
      symbol: '',
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Unit name is required';
      if (!data.symbol?.trim()) errors.symbol = 'Unit code is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      return errors;
    },
    resourceName: 'Unit',
    itemsPerPage: 10,
  });

  const mappingsCrud = useApiCrud('unit-mappings', {
    initialFormData: {
      from_unit_id: '',
      to_unit_id: '',
      factor: '1',
      remarks: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.from_unit_id) errors.from_unit_id = 'From unit is required';
      if (!data.to_unit_id) errors.to_unit_id = 'To unit is required';
      if (!data.factor || Number(data.factor) <= 0) {
        errors.factor = 'Factor must be greater than zero';
      }
      return errors;
    },
    transformFormData: (data) => ({
      from_unit_id: Number(data.from_unit_id),
      to_unit_id: Number(data.to_unit_id),
      factor: Number(data.factor),
      remarks: data.remarks || null,
    }),
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        from_unit_id: row?.from_unit_id != null ? String(row.from_unit_id) : '',
        to_unit_id: row?.to_unit_id != null ? String(row.to_unit_id) : '',
        factor: row?.factor != null ? String(row.factor) : '1',
        remarks: row?.remarks || '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    resourceName: 'Unit Mapping',
    itemsPerPage: 10,
  });

  const unitFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All units' },
      ...unitOptions.filter((option) => option.value !== ''),
    ],
    [unitOptions]
  );

  const handleUnitFilter = (value) => {
    const next = value || 'all';
    setUnitFilter(next);
    mappingsCrud.setExtraListParams(next === 'all' ? {} : { unit_id: next });
    mappingsCrud.handlePageChange(1);
  };
  const tabs = useMemo(
    () => [
      { id: 'list', label: 'Unit List', icon: FiPackage },
      { id: 'mappings', label: 'Unit Mappings', icon: FiGitMerge },
    ],
    []
  );

  const unitsPageConfig = {
    icon: FiPackage,
    title: 'Units',
    subtitle: 'Manage inventory measurement units. Each unit gets an identity mapping (1 KG = 1 KG).',
    addButtonLabel: 'Add Unit',
    searchPlaceholder: 'Search units...',
  };

  const mappingsPageConfig = {
    icon: FiGitMerge,
    title: 'Unit Mappings',
    subtitle: 'Define conversions such as 1 KG = 1000 G so ingredients can use grams while stock is kept in kilograms.',
    addButtonLabel: 'Add Mapping',
    searchPlaceholder: 'Search mappings...',
  };

  const unitsStatsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const mappingsStatsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'identity', label: 'Identity', icon: FiCheck, iconColor: 'green-600' },
      { key: 'cross', label: 'Cross-unit', icon: FiGitMerge, iconColor: 'orange-600' },
    ],
  };

  const unitsTableColumns = [
    {
      header: 'Unit Name',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return (
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            {row.name}
          </div>
        );
      },
    },
    { header: 'Code', accessor: 'symbol', noWrap: true },
    {
      header: 'Mappings',
      accessor: 'mappings_count',
      noWrap: true,
      render: (row) => row.mappings_count ?? '—',
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const mappingsTableColumns = [
    {
      header: 'From',
      accessor: 'from_unit',
      noWrap: true,
      render: (row) => {
        const unit = row.from_unit || row.fromUnit;
        return unit ? `${unit.name} (${unit.symbol})` : row.from_unit_id;
      },
    },
    {
      header: 'Equals',
      accessor: 'factor',
      noWrap: true,
      render: (row) => {
        const from = row.from_unit || row.fromUnit;
        const to = row.to_unit || row.toUnit;
        return `1 ${from?.symbol || '?'} = ${formatFactor(row.factor)} ${to?.symbol || '?'}`;
      },
    },
    {
      header: 'To',
      accessor: 'to_unit',
      noWrap: true,
      render: (row) => {
        const unit = row.to_unit || row.toUnit;
        return unit ? `${unit.name} (${unit.symbol})` : row.to_unit_id;
      },
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      noWrap: false,
    },
  ];

  const unitsFormFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'symbol', label: 'Code', type: 'text', required: true },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  const mappingsFormFields = [
    {
      name: 'from_unit_id',
      label: 'From Unit',
      type: 'searchable_select',
      required: true,
      options: unitOptions,
      autoFocus: true,
    },
    {
      name: 'to_unit_id',
      label: 'To Unit',
      type: 'searchable_select',
      required: true,
      options: unitOptions,
    },
    {
      name: 'factor',
      label: 'Factor (1 From = N To)',
      type: 'number',
      required: true,
      step: 'any',
      min: '0',
      fullWidth: false,
    },
    {
      name: 'remarks',
      label: 'Remarks',
      type: 'text',
      required: false,
      fullWidth: false,
    },
  ];

  const pageTabs = (
    <PageTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} ariaLabel="Unit sections" />
  );

  if (activeTab === 'mappings') {
    return (
      <CRUDPage
        pageConfig={mappingsPageConfig}
        statsConfig={mappingsStatsConfig}
        tableColumns={mappingsTableColumns}
        tableConfig={{
          emptyState: {
            title: 'No Unit Mappings Found',
            description: 'Add mappings like 1 KG = 1000 G for ingredient and stock conversion.',
          },
        }}
        formFields={mappingsFormFields}
        formFieldsLayout="two-col"
        modalTitle="Unit Mapping"
        belowStats={pageTabs}
        crud={mappingsCrud}
        extraFilters={[
          {
            options: unitFilterOptions,
            value: unitFilter,
            onChange: handleUnitFilter,
            placeholder: 'Filter by unit…',
          },
        ]}
      />
    );
  }

  return (
    <CRUDPage
      pageConfig={unitsPageConfig}
      statsConfig={unitsStatsConfig}
      tableColumns={unitsTableColumns}
      tableConfig={{
        emptyState: {
          title: 'No Units Found',
          description: 'Get started by creating your first measurement unit.',
        },
      }}
      formFields={unitsFormFields}
      modalTitle="Unit"
      belowStats={pageTabs}
      crud={unitsCrud}
    />
  );
};

export default Unit;

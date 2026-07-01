import React, { useEffect, useMemo, useState } from 'react';
import { FiCoffee, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiInfo, FiGrid } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import OutletTablesEditor from '../../components/OutletTablesEditor';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const OUTLET_TYPES = [
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'POOL_BAR', label: 'Pool Bar' },
  { value: 'ROOM_SERVICE', label: 'Room Service' },
  { value: 'LOUNGE', label: 'Lounge' },
  { value: 'CAFE', label: 'Cafe' },
];

const outletTypeLabel = (type) => OUTLET_TYPES.find((opt) => opt.value === type)?.label || type || '—';

const patchOutletRow = (row) => ({
  ...row,
  hotel_id: row.hotel_id != null ? String(row.hotel_id) : '',
  store_id: row.store_id != null ? String(row.store_id) : '',
  tables: (row.tables || []).map((table) => ({
    id: table.id,
    table_number: table.table_number || '',
    name: table.name || '',
    seats: table.seats ?? 2,
    zone: table.zone || '',
  })),
});

const Outlet = () => {
  const [hotels, setHotels] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [hotelsRes, storesRes] = await Promise.all([
          apiFetch(`${API_BASE_URL}/api/hotels/all`),
          apiFetch(`${API_BASE_URL}/api/stores/all`),
        ]);

        const hotelsJson = await hotelsRes.json().catch(() => ({}));
        const storesJson = await storesRes.json().catch(() => ({}));

        if (cancelled) return;

        setHotels(Array.isArray(hotelsJson?.data) ? hotelsJson.data : []);
        setStores(Array.isArray(storesJson?.data) ? storesJson.data : []);
      } catch {
        if (!cancelled) {
          setHotels([]);
          setStores([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hotelOptions = useMemo(
    () =>
      hotels.map((hotel) => ({
        value: String(hotel.id),
        label: hotel.code ? `${hotel.name} (${hotel.code})` : hotel.name,
      })),
    [hotels]
  );

  const storeOptions = useMemo(
    () => [
      { value: '', label: '— No linked store —' },
      ...stores.map((store) => ({
        value: String(store.id),
        label: store.code ? `${store.name} (${store.code})` : store.name,
      })),
    ],
    [stores]
  );

  const crud = useApiCrud('outlets', {
    initialFormData: {
      hotel_id: '',
      name: '',
      type: 'RESTAURANT',
      store_id: '',
      description: '',
      status_id: '',
      tables: [{ table_number: '', name: '', seats: 2, zone: '' }],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.hotel_id) errors.hotel_id = 'Please select a hotel';
      if (!data.name?.trim()) errors.name = 'Outlet name is required';
      if (!data.type) errors.type = 'Outlet type is required';
      if (!data.status_id) errors.status_id = 'Please select a status';

      const numberedTables = (data.tables || []).filter((row) => row.table_number?.trim());
      const numbers = numberedTables.map((row) => row.table_number.trim().toLowerCase());
      if (new Set(numbers).size !== numbers.length) {
        errors.tables = 'Table numbers must be unique within this outlet';
      }

      return errors;
    },
    transformFormData: (data) => {
      const payload = {
        hotel_id: Number(data.hotel_id),
        name: data.name?.trim(),
        type: data.type,
        store_id: data.store_id ? Number(data.store_id) : null,
        description: data.description?.trim() || null,
        status_id: Number(data.status_id),
      };

      if (Array.isArray(data.tables)) {
        payload.tables = data.tables
          .filter((row) => row.table_number?.trim())
          .map((row) => ({
            ...(row.id ? { id: Number(row.id) } : {}),
            table_number: row.table_number.trim(),
            name: row.name?.trim() || null,
            seats: Number(row.seats || 2),
            zone: row.zone?.trim() || null,
          }));
      }

      return payload;
    },
    transformResponse: (data) => {
      if (Array.isArray(data)) return data.map(patchOutletRow);
      const patched = patchOutletRow(data);
      if (!patched.tables?.length) {
        patched.tables = [{ table_number: '', name: '', seats: 2, zone: '' }];
      }
      return patched;
    },
    resourceName: 'Outlet',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiCoffee,
    title: 'Outlets',
    subtitle: 'Manage F&B outlets and guest table numbers per hotel',
    addButtonLabel: 'Add Outlet',
    searchPlaceholder: 'Search outlets...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const tableColumns = [
    {
      header: 'Outlet',
      accessor: 'name',
      noWrap: true,
      render: (row) => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        return <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{row.name}</div>;
      },
    },
    { header: 'Code', accessor: 'code', noWrap: true },
    {
      header: 'Hotel',
      accessor: 'hotel.name',
      noWrap: true,
      render: (row) => row.hotel?.name || '—',
    },
    {
      header: 'Type',
      accessor: 'type',
      noWrap: true,
      render: (row) => outletTypeLabel(row.type),
    },
    {
      header: 'Tables',
      accessor: 'tables_count',
      noWrap: true,
      render: (row) => row.tables_count ?? 0,
    },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formTabs = useMemo(
    () => [
      {
        id: 'details',
        label: 'Outlet Details',
        icon: FiInfo,
        fields: [
          {
            name: 'hotel_id',
            label: 'Hotel',
            type: 'select',
            required: true,
            options: hotelOptions,
          },
          { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
          {
            name: 'type',
            label: 'Outlet Type',
            type: 'select',
            required: true,
            options: OUTLET_TYPES,
          },
          {
            name: 'store_id',
            label: 'Linked Store',
            type: 'select',
            required: false,
            options: storeOptions,
          },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
          { name: 'status_id', label: 'Status', type: 'status_id', required: true },
        ],
      },
      {
        id: 'tables',
        label: 'Table Numbers',
        icon: FiGrid,
        fields: [
          {
            name: 'tables',
            type: 'custom',
            render: (formData, onInputChange, errors, darkMode) => (
              <OutletTablesEditor
                fieldName="tables"
                value={formData.tables}
                onChange={onInputChange}
                errors={errors}
                darkMode={darkMode}
              />
            ),
          },
        ],
      },
    ],
    [hotelOptions, storeOptions]
  );

  const viewTabs = [
    {
      id: 'details',
      label: 'Outlet Details',
      icon: FiInfo,
      fields: [
        { label: 'Name', accessor: 'name' },
        { label: 'Code', accessor: 'code' },
        {
          label: 'Hotel',
          accessor: 'hotel.name',
          valueRender: (item) => item.hotel?.name || '—',
        },
        {
          label: 'Type',
          accessor: 'type',
          valueRender: (item) => outletTypeLabel(item.type),
        },
        {
          label: 'Linked Store',
          accessor: 'store.name',
          valueRender: (item) => item.store?.name || '—',
        },
        { label: 'Description', accessor: 'description', fullWidth: true },
        {
          label: 'Tables',
          accessor: 'tables_count',
          valueRender: (item) => item.tables_count ?? item.tables?.length ?? 0,
        },
        { label: 'Status', accessor: 'status.name', type: 'status' },
      ],
    },
    {
      id: 'tables',
      label: 'Table Numbers',
      icon: FiGrid,
      fields: [
        {
          label: 'Tables',
          accessor: 'tables',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.tables || [];
            if (!rows.length) return '—';

            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Table #</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Seats</th>
                      <th className="px-3 py-2">Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((table) => (
                      <tr key={table.id || table.table_number} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 font-medium">{table.table_number}</td>
                        <td className="px-3 py-2">{table.name || '—'}</td>
                        <td className="px-3 py-2">{table.seats ?? '—'}</td>
                        <td className="px-3 py-2">{table.zone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          },
        },
      ],
    },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formTabs={formTabs}
      viewTabs={viewTabs}
      modalTitle="Outlet"
      modalMaxWidth="max-w-5xl"
      crud={crud}
    />
  );
};

export default Outlet;

import React, { useEffect, useMemo, useState } from 'react';
import { FiCoffee, FiTrendingUp, FiAlertCircle, FiTrash2, FiCheck, FiInfo, FiGrid, FiPrinter } from 'react-icons/fi';
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
  printer_connection: row.printer_connection || 'network',
  printer_host: row.printer_host || '',
  printer_port: row.printer_port != null ? String(row.printer_port) : '9100',
  uses_pos: Boolean(row.uses_pos),
  print_via_agent: row.print_via_agent !== false,
  tables: (row.tables || []).map((table) => ({
    id: table.id,
    table_number: table.table_number || '',
    name: table.name || '',
    zone: table.zone || '',
    seat_numbers: (table.table_seats || table.tableSeats || []).map((seat) => seat.seat_number).filter(Boolean),
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
      uses_pos: false,
      printer_connection: 'network',
      printer_host: '',
      printer_port: '9100',
      print_via_agent: true,
      status_id: '',
      tables: [{ table_number: '', name: '', zone: '', seat_numbers: ['1', '2'] }],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.hotel_id) errors.hotel_id = 'Please select a hotel';
      if (!data.name?.trim()) errors.name = 'Outlet name is required';
      if (!data.type) errors.type = 'Outlet type is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (data.printer_connection === 'network' && data.printer_port !== '' && data.printer_port != null) {
        const port = Number(data.printer_port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          errors.printer_port = 'Printer port must be between 1 and 65535';
        }
      }

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
        uses_pos: Boolean(data.uses_pos),
        printer_connection: data.printer_connection || 'network',
        printer_host: data.printer_host?.trim() || null,
        print_via_agent: data.print_via_agent !== false,
        printer_port:
          data.printer_connection === 'windows'
            ? null
            : data.printer_port === '' || data.printer_port == null
              ? 9100
              : Number(data.printer_port),
        status_id: Number(data.status_id),
      };

      if (Array.isArray(data.tables)) {
        payload.tables = data.tables
          .filter((row) => row.table_number?.trim())
          .map((row) => ({
            ...(row.id ? { id: Number(row.id) } : {}),
            table_number: row.table_number.trim(),
            name: row.name?.trim() || null,
            zone: row.zone?.trim() || null,
            seat_numbers: (row.seat_numbers || [])
              .map((seat) => String(seat).trim())
              .filter(Boolean),
          }));
      }

      return payload;
    },
    transformResponse: (data) => {
      if (Array.isArray(data)) return data.map(patchOutletRow);
      const patched = patchOutletRow(data);
      if (!patched.tables?.length) {
        patched.tables = [{ table_number: '', name: '', zone: '', seat_numbers: ['1', '2'] }];
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
          {
            name: 'type',
            label: 'Outlet Type',
            type: 'select',
            required: true,
            options: OUTLET_TYPES,
          },
          { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
          {
            name: 'store_id',
            label: 'Linked Store',
            type: 'select',
            required: false,
            options: storeOptions,
          },
          { name: 'status_id', label: 'Status', type: 'status_id', required: true },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: false },
          {
            name: 'uses_pos',
            label: 'POS / touch station outlet',
            type: 'checkbox',
            required: false,
          },
        ],
      },
      {
        id: 'printer',
        label: 'Thermal Printer',
        icon: FiPrinter,
        fields: [
          {
            name: 'printer_connection',
            label: 'Connection type',
            type: 'select',
            required: false,
            options: [
              { value: 'network', label: 'Network (IP + port 9100)' },
              { value: 'windows', label: 'Windows printer share / USB name' },
            ],
          },
          {
            name: 'printer_host',
            label: 'Printer IP or Windows printer name',
            type: 'text',
            required: false,
            placeholder: '192.168.0.103  or  POS-80',
          },
          {
            name: 'printer_port',
            label: 'Network port (network mode only)',
            type: 'number',
            required: false,
            min: 1,
            max: 65535,
            placeholder: '9100',
          },
          {
            name: 'print_via_agent',
            label: 'Print via local agent (required when API is in the cloud)',
            type: 'checkbox',
            required: false,
          },
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
            fullWidth: true,
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
          label: 'POS / touch station',
          accessor: 'uses_pos',
          valueRender: (item) => (item.uses_pos ? 'Yes' : 'No'),
        },
        {
          label: 'Printer',
          accessor: 'printer_host',
          valueRender: (item) => {
            if (!item.printer_host) return '—';
            if (item.printer_connection === 'windows') {
              return `Windows · ${item.printer_host}`;
            }
            return `Network · ${item.printer_host}:${item.printer_port || 9100}`;
          },
        },
        {
          label: 'Print via local agent',
          accessor: 'print_via_agent',
          valueRender: (item) => (item.print_via_agent !== false ? 'Yes' : 'No (direct from server)'),
        },
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
                      <th className="px-3 py-2">Seat numbers</th>
                      <th className="px-3 py-2">Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((table) => (
                      <tr key={table.id || table.table_number} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 font-medium">{table.table_number}</td>
                        <td className="px-3 py-2">{table.name || '—'}</td>
                        <td className="px-3 py-2">
                          {(table.seat_numbers || table.table_seats || table.tableSeats || [])
                            .map((seat) => (typeof seat === 'string' ? seat : seat.seat_number))
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
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

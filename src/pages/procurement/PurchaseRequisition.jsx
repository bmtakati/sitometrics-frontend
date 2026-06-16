import { FiClipboard, FiTrendingUp, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';

const WORKFLOW_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CONVERTED_TO_LPO', label: 'Converted To LPO' }
];

const PurchaseRequisition = () => {
  const [sampleItemId, setSampleItemId] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/items/all`);
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (rows[0]?.id) setSampleItemId(rows[0].id);
      } catch (_) {
        // optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const crud = useApiCrud('purchase-requisitions', {
    initialFormData: {
      requisition_date: new Date().toISOString().slice(0, 10),
      workflow_status: 'DRAFT',
      remarks: '',
      items_json: '',
      status_id: '',
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.requisition_date) errors.requisition_date = 'Requisition date is required';
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.items_json?.trim()) {
        errors.items_json = 'Items JSON is required';
      } else {
        try {
          const parsed = JSON.parse(data.items_json);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            errors.items_json = 'Items JSON must be a non-empty array';
          }
        } catch (_) {
          errors.items_json = 'Items JSON must be valid JSON';
        }
      }
      return errors;
    },
    transformResponse: (payload) => {
      const normalize = (row) => ({
        ...row,
        items: Array.isArray(row?.items) ? row.items : [],
        items_json: Array.isArray(row?.items)
          ? JSON.stringify(
              row.items.map((line) => ({
                item_id: line.item_id,
                quantity: line.quantity,
                remarks: line.remarks || '',
              })),
              null,
              2
            )
          : '',
      });
      return Array.isArray(payload) ? payload.map(normalize) : normalize(payload);
    },
    transformFormData: (data) => ({
      requisition_date: data.requisition_date,
      workflow_status: data.workflow_status,
      remarks: data.remarks || null,
      status_id: Number(data.status_id),
      items: (() => {
        try {
          const parsed = JSON.parse(data.items_json || '[]');
          return Array.isArray(parsed)
            ? parsed.map((line) => ({
                item_id: Number(line.item_id),
                quantity: Number(line.quantity),
                remarks: line.remarks || null,
              }))
            : [];
        } catch (_) {
          return [];
        }
      })(),
    }),
    resourceName: 'Purchase Requisition',
    itemsPerPage: 10,
    enrichStats: ({ stats }) => ({
      ...stats,
      draft: Number(stats?.draft || 0),
      submitted: Number(stats?.submitted || 0),
      approved: Number(stats?.approved || 0),
      rejected: Number(stats?.rejected || 0),
    }),
  });

  const pageConfig = {
    icon: FiClipboard,
    title: 'Purchase Requisitions',
    subtitle: 'Manage requisition workflow from draft to conversion',
    addButtonLabel: 'Add Requisition',
    searchPlaceholder: 'Search requisitions...'
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'draft', label: 'Draft', icon: FiClock, iconColor: 'yellow-600' },
      { key: 'approved', label: 'Approved', icon: FiCheckCircle, iconColor: 'green-600' },
      { key: 'rejected', label: 'Rejected', icon: FiXCircle, iconColor: 'red-600' },
    ]
  };

  const tableColumns = [
    { header: 'Code', accessor: 'code', noWrap: true },
    { header: 'Date', accessor: 'requisition_date', noWrap: true },
    { header: 'Workflow', accessor: 'workflow_status', noWrap: true },
    { header: 'Items', accessor: 'items', noWrap: true, render: (row) => Array.isArray(row.items) ? row.items.length : 0 },
    { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
  ];

  const formFields = [
    { name: 'requisition_date', label: 'Requisition Date', type: 'date', required: true },
    { name: 'workflow_status', label: 'Workflow Status', type: 'select', required: true, options: WORKFLOW_OPTIONS },
    { name: 'remarks', label: 'Remarks', type: 'textarea', rows: 3, required: false },
    {
      name: 'items_json',
      label: 'Items (JSON)',
      type: 'textarea',
      rows: 8,
      required: true,
      placeholder: JSON.stringify([{ item_id: sampleItemId, quantity: 1, remarks: 'optional' }], null, 2),
    },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  return (
    <CRUDPage
      pageConfig={pageConfig}
      statsConfig={statsConfig}
      tableColumns={tableColumns}
      formFields={formFields}
      modalTitle="Purchase Requisition"
      crud={crud}
      filterOptions={[
        { label: 'All', value: 'all' },
        { label: 'Workflow: Draft', value: 'workflow:DRAFT' },
        { label: 'Workflow: Submitted', value: 'workflow:SUBMITTED' },
        { label: 'Workflow: Approved', value: 'workflow:APPROVED' },
        { label: 'Workflow: Rejected', value: 'workflow:REJECTED' },
        { label: 'Workflow: Converted To LPO', value: 'workflow:CONVERTED_TO_LPO' },
        { label: 'Trashed', value: 'trashed' },
      ]}
    />
  );
};

export default PurchaseRequisition;

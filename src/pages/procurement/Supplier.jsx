import React, { useEffect, useMemo, useState } from 'react';
import {
  FiTruck,
  FiTrendingUp,
  FiAlertCircle,
  FiTrash2,
  FiCheck,
  FiFileText,
  FiInfo,
  FiPackage,
} from 'react-icons/fi';
import useApiCrud from '../../hooks/useApiCrud';
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import SupplierItemsEditor from '../../components/SupplierItemsEditor';
import SupplierContractField from '../../components/SupplierContractField';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import { resolveApiAssetUrl } from '../../utils/resolveApiAssetUrl';

const Supplier = () => {
  const [itemOptions, setItemOptions] = useState([]);
  const [contractPreview, setContractPreview] = useState({ open: false, title: '', url: '' });

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/items/all`);
        const payload = await res.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setItemOptions(
          rows.map((item) => ({
            value: String(item.id),
            label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
          }))
        );
      } catch {
        setItemOptions([]);
      }
    };
    loadItems();
  }, []);

  const crud = useApiCrud('suppliers', {
    initialFormData: {
      name: '',
      phone: '',
      email: '',
      address: '',
      tin: '',
      vrn: '',
      status_id: '',
      contract: null,
      remove_contract: false,
      supplier_items: [{ item_id: '', agreed_price: '' }],
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) errors.name = 'Supplier name is required';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please enter a valid email';
      }
      if (!data.status_id) errors.status_id = 'Please select a status';
      if (!data.contract && !data.contract_url) {
        errors.contract = 'Supplier contract PDF is required';
      } else if (data.contract instanceof File && data.contract.type && data.contract.type !== 'application/pdf') {
        errors.contract = 'Contract must be a PDF file';
      }

      const validLines = (data.supplier_items || []).filter(
        (line) => line.item_id && Number(line.agreed_price) >= 0 && line.agreed_price !== ''
      );
      if (validLines.length === 0) {
        errors.supplier_items = 'Add at least one item with an agreed price';
      }

      const itemIds = validLines.map((line) => String(line.item_id));
      if (new Set(itemIds).size !== itemIds.length) {
        errors.supplier_items = 'Each item can only appear once per supplier';
      }

      return errors;
    },
    transformFormData: (data) => {
      const validItems = (data.supplier_items || [])
        .filter((line) => line.item_id && line.agreed_price !== '')
        .map((line) => ({
          item_id: Number(line.item_id),
          agreed_price: Number(line.agreed_price),
        }));

      const hasContractFile = data.contract instanceof File;

      return {
        name: data.name?.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        tin: data.tin?.trim() || null,
        vrn: data.vrn?.trim() || null,
        status_id: Number(data.status_id),
        remove_contract: data.remove_contract ? '1' : '0',
        items: hasContractFile ? JSON.stringify(validItems) : validItems,
        ...(hasContractFile ? { contract: data.contract } : {}),
      };
    },
    transformResponse: (data) => {
      const patch = (row) => ({
        ...row,
        contract: null,
        remove_contract: false,
        supplier_items: (row.supplier_items || []).map((line) => ({
          item_id: String(line.item_id),
          agreed_price: line.agreed_price,
        })),
      });
      if (Array.isArray(data)) return data.map(patch);
      if (data && typeof data === 'object') {
        const patched = patch(data);
        if (!patched.supplier_items?.length) {
          patched.supplier_items = [{ item_id: '', agreed_price: '' }];
        }
        return patched;
      }
      return data;
    },
    resourceName: 'Supplier',
    itemsPerPage: 10,
  });

  const pageConfig = {
    icon: FiTruck,
    title: 'Suppliers',
    subtitle: 'Manage suppliers, contracts, and agreed item prices',
    addButtonLabel: 'Add Supplier',
    searchPlaceholder: 'Search suppliers...',
  };

  const statsConfig = {
    cards: [
      { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
      { key: 'active', label: 'Active', icon: FiCheck, iconColor: 'green-600' },
      { key: 'inactive', label: 'Inactive', icon: FiAlertCircle, iconColor: 'yellow-600' },
      { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
    ],
  };

  const formatMoney = (value) =>
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tableColumns = useMemo(
    () => [
      {
        header: 'Supplier',
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
      { header: 'Code', accessor: 'code', noWrap: true },
      { header: 'Phone', accessor: 'phone', noWrap: true },
      { header: 'Email', accessor: 'email', noWrap: true },
      {
        header: 'Contract',
        accessor: 'contract_url',
        noWrap: true,
        render: (row) =>
          row.contract_url ? (
            <button
              type="button"
              onClick={() =>
                setContractPreview({
                  open: true,
                  title: row.contract_original_name || `${row.name} contract`,
                  url: row.contract_url,
                })
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              <FiFileText className="h-4 w-4" />
              View
            </button>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
      {
        header: 'Items',
        accessor: 'supplier_items_count',
        noWrap: true,
        render: (row) => row.supplier_items_count ?? row.supplier_items?.length ?? 0,
      },
      { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
    ],
    []
  );

  const detailFields = [
    { name: 'name', label: 'Name', type: 'text', required: true, autoFocus: true },
    { name: 'phone', label: 'Phone', type: 'text', required: false },
    { name: 'email', label: 'Email', type: 'email', required: false },
    { name: 'tin', label: 'TIN', type: 'text', required: false },
    { name: 'vrn', label: 'VRN', type: 'text', required: false },
    { name: 'address', label: 'Address', type: 'textarea', rows: 3, required: false },
    { name: 'status_id', label: 'Status', type: 'status_id', required: true },
  ];

  const formTabs = [
    {
      id: 'details',
      label: 'Supplier Details',
      icon: FiInfo,
      fields: detailFields,
    },
    {
      id: 'contract',
      label: 'Contract',
      icon: FiFileText,
      fields: [
        {
          name: 'contract',
          type: 'custom',
          render: (formData, onInputChange, errors, darkMode) => (
            <SupplierContractField
              formData={formData}
              onInputChange={onInputChange}
              errors={errors}
              darkMode={darkMode}
              isEditing={crud.isEditing}
            />
          ),
        },
      ],
    },
    {
      id: 'items',
      label: 'Agreed Items',
      icon: FiPackage,
      fields: [
        {
          name: 'supplier_items',
          type: 'custom',
          render: (formData, onInputChange, errors, darkMode) => (
            <SupplierItemsEditor
              value={formData.supplier_items}
              onChange={onInputChange}
              itemOptions={itemOptions}
              errors={errors}
              darkMode={darkMode}
            />
          ),
        },
      ],
    },
  ];

  const viewTabs = [
    {
      id: 'details',
      label: 'Supplier Details',
      icon: FiInfo,
      fields: [
        { label: 'Name', accessor: 'name' },
        { label: 'Code', accessor: 'code' },
        { label: 'Phone', accessor: 'phone' },
        { label: 'Email', accessor: 'email' },
        { label: 'TIN', accessor: 'tin' },
        { label: 'VRN', accessor: 'vrn' },
        { label: 'Address', accessor: 'address', type: 'textarea' },
        { label: 'Status', accessor: 'status', type: 'status' },
      ],
    },
    {
      id: 'contract',
      label: 'Contract',
      icon: FiFileText,
      fields: [
        {
          label: 'Contract document',
          accessor: 'contract_url',
          fullWidth: true,
          valueRender: (item) =>
            item.contract_url ? (
              <button
                type="button"
                onClick={() =>
                  setContractPreview({
                    open: true,
                    title: item.contract_original_name || `${item.name} contract`,
                    url: item.contract_url,
                  })
                }
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                <FiFileText className="h-4 w-4" />
                {item.contract_original_name || 'View contract'}
              </button>
            ) : (
              '—'
            ),
        },
      ],
    },
    {
      id: 'items',
      label: 'Agreed Items',
      icon: FiPackage,
      fields: [
        {
          label: 'Agreed item prices',
          accessor: 'supplier_items',
          fullWidth: true,
          valueRender: (item) => {
            const rows = item.supplier_items || [];
            if (!rows.length) return '—';
            return (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Agreed price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((line) => (
                      <tr key={line.id || `${line.item_id}-${line.agreed_price}`} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2">{line.item?.name || line.item_id}</td>
                        <td className="px-3 py-2">{line.item?.code || '—'}</td>
                        <td className="px-3 py-2 font-medium">{formatMoney(line.agreed_price)}</td>
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
    <>
      <CRUDPage
        pageConfig={pageConfig}
        statsConfig={statsConfig}
        tableColumns={tableColumns}
        formTabs={formTabs}
        viewTabs={viewTabs}
        modalTitle="Supplier"
        modalMaxWidth="max-w-4xl"
        crud={crud}
        extraActions={[
          {
            type: 'contract',
            label: 'Contract',
            icon: FiFileText,
            visible: (row) => Boolean(row.contract_url),
            onClick: (row) =>
              setContractPreview({
                open: true,
                title: row.contract_original_name || `${row.name} contract`,
                url: row.contract_url,
              }),
          },
        ]}
      />

      <DocumentPreviewModal
        isOpen={contractPreview.open}
        title={contractPreview.title}
        url={resolveApiAssetUrl(contractPreview.url)}
        onClose={() => setContractPreview({ open: false, title: '', url: '' })}
      />
    </>
  );
};

export default Supplier;

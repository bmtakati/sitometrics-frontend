import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiEye, FiEdit2, FiTrash2, FiX, FiLoader } from 'react-icons/fi';
import { FaFilePdf } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import FormModal from '../../components/FormModal/FormModal';
import useApiCrud from '../../hooks/useApiCrud';
import { StatsCards } from '../../components/StatsCard';
import SearchFilter from '../../components/SearchFilter';
import TableControls from '../../components/TableControls';
import useDarkMode from '../../hooks/useDarkMode';
import { API_BASE_URL } from '../../context/AuthContext';
import apiFetch from '../../utils/apiFetch';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import { resolveApiAssetUrl } from '../../utils/resolveApiAssetUrl';

const FaqUserGuidesAdmin = () => {
  const darkMode = useDarkMode();
  const [guideTypeRows, setGuideTypeRows] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all'); // all | guide type codes
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive

  useEffect(() => {
    const loadGuideTypes = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/faq-guide-types/all`);
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.success && Array.isArray(payload.data)) {
          const sorted = [...payload.data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setGuideTypeRows(sorted);
        }
      } catch {
      }
    };

    loadGuideTypes();
  }, []);

  const activeGuideTypes = (guideTypeRows || []).filter((d) => {
    if (!d) return false;
    const status = d.status ? String(d.status).toLowerCase() : '';
    return !status || status === 'active';
  });

  // Guides should store Guide Type code, but show the Guide Type name in the UI.
  const guideTypes = activeGuideTypes
    .filter((d) => d?.code)
    .map((d) => ({
      value: d.code,
      label: d.name || d.code,
    }));

  /** Code → label for table/view using every loaded type (active + inactive) so the list column stays correct. */
  const guideTypeCodeToLabel = useMemo(() => {
    const acc = {};
    (guideTypeRows || []).forEach((d) => {
      if (d?.code) acc[String(d.code).trim()] = String(d.name || d.code).trim() || d.code;
    });
    return acc;
  }, [guideTypeRows]);

  const resolveGuideTypeLabel = useCallback(
    (typeValue) => {
      const raw = String(typeValue ?? '').trim();
      if (!raw) return '—';
      if (guideTypeCodeToLabel[raw]) return guideTypeCodeToLabel[raw];
      const byName = (guideTypeRows || []).find(
        (r) => String(r?.name ?? '').trim().toLowerCase() === raw.toLowerCase()
      );
      if (byName) return String(byName.name || byName.code).trim() || raw;
      return raw;
    },
    [guideTypeCodeToLabel, guideTypeRows]
  );

  const initialTypeValue = guideTypes[0]?.value || '';

  const crud = useApiCrud('faq-user-guides', {
    initialFormData: {
      title: '',
      description: '',
      type: initialTypeValue,
      status: 'active',
      size: '',
      sort_order: 1,
      upload: null,
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.title?.trim()) errors.title = 'Title is required';
      if (!data.description?.trim()) errors.description = 'Description is required';
      if (!data.type) errors.type = 'Type is required';
      if (!data.status_id) errors.status = 'Status is required';
      // For create: file is required (download_url is empty).
      // For edit: allow user to keep existing document by leaving upload empty.
      if (!data.upload && !data.download_url) {
        errors.upload = 'Upload guide document is required';
      }
      return errors;
    },
    resourceName: 'User Guide',
    itemsPerPage: 10,
    transformResponse: (value) => {
      // Ensure `name` exists for delete/restore confirmation dialogs (Guide Type label is set in filteredData).
      if (Array.isArray(value)) {
        return value.map((item) => ({
          ...item,
          name: item.name ?? item.title,
        }));
      }
      return {
        ...value,
        name: value.name ?? value.title,
      };
    },
  });

  const prevGuideTypeCount = useRef(0);
  useEffect(() => {
    const len = guideTypeRows.length;
    if (len > 0 && prevGuideTypeCount.current === 0) {
      void crud.reload();
    }
    prevGuideTypeCount.current = len;
  }, [guideTypeRows.length, crud.reload]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);

  const closeViewModal = () => {
    setDocPreviewOpen(false);
    setShowViewModal(false);
    setViewItem(null);
  };

  const viewColumns = useMemo(
    () => [
      { header: 'Title', accessor: 'title', type: 'truncate' },
      { header: 'Guide Type', accessor: 'type_name', noWrap: true },
      { header: 'Status', accessor: 'status', type: 'status', noWrap: true },
      { header: 'Sort Order', accessor: 'sort_order', noWrap: true },
    ],
    []
  );

  const pageConfig = {
    icon: FaFilePdf,
    title: 'User Guides',
    subtitle: 'Manage FAQ user guides and tutorials',
    addButtonLabel: 'Add Guide',
    searchPlaceholder: 'Search guides...',
  };

  const tableConfig = {
    emptyState: {
      title: 'No user guides found',
      description: 'Create your first user guide entry.',
    },
  };

  const formFields = [
    { name: 'title', label: 'Title', type: 'text', required: true, autoFocus: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 4, required: true },
    {
      name: 'type',
      label: 'Guide Type',
      type: 'select',
      required: true,
      placeholder: 'Select Guide Type',
      options: guideTypes.length ? guideTypes : [{ value: '', label: 'No active guide types' }],
    },
    { name: 'upload', label: '', type: 'file', required: false },
    {
      name: 'status_id',
      label: 'Status',
      type: 'status_id',
      required: true
    },
    { name: 'size', label: 'Size (auto)', type: 'text', required: false, disabled: true },
    {
      name: 'sort_order',
      label: 'List position',
      type: 'number',
      required: false,
      placeholder: '1 = top of list',
    },
  ];

  const filteredData = useMemo(() => {
    const tf = String(typeFilter || 'all').toLowerCase();
    const sf = String(statusFilter || 'all').toLowerCase();

    return (crud.data || [])
      .map((g) => ({
        ...g,
        type_name: resolveGuideTypeLabel(g.type),
      }))
      .filter((g) => {
        const gType = String(g.type || '').toLowerCase();
        const gStatus = String(g.status || '').toLowerCase();

        if (tf !== 'all' && gType !== tf.toLowerCase()) return false;
        if (sf !== 'all' && gStatus !== sf) return false;
        return true;
      });
  }, [crud.data, typeFilter, statusFilter, resolveGuideTypeLabel]);

  // Keep Size as "auto": backend can compute it, but we also set it immediately for UX.
  const handleInputChange = (e) => {
    if (e?.target?.type === 'file') {
      const file = e?.target?.files?.[0] || null;
      if (file) {
        const sizeString = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        crud.handleInputChange(e);
        crud.setFormData((prev) => ({
          ...prev,
          size: sizeString,
        }));
        return;
      }
    }

    crud.handleInputChange(e);
  };

  const handleView = (item) => {
    setViewItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon={pageConfig.icon}
        title={pageConfig.title}
        subtitle={pageConfig.subtitle}
        actions={[
          {
            label: pageConfig.addButtonLabel,
            icon: null,
            onClick: crud.handleAdd,
            variant: 'primary',
            disabled: crud.actionLoading,
          },
        ]}
      />

      {crud.stats && (
        <StatsCards
          cards={[
            { key: 'total', label: 'Total', icon: FaFilePdf, iconColor: 'red-600' },
            { key: 'active', label: 'Active', icon: FiEye, iconColor: 'green-600' },
            { key: 'inactive', label: 'Inactive', icon: FiX, iconColor: 'yellow-600' },
            { key: 'trashed', label: 'Trashed', icon: FiTrash2, iconColor: 'red-600' },
          ].map((c) => ({
            ...c,
            value: crud.stats?.[c.key] ?? 0,
          }))}
        />
      )}

      <div>
        <TableControls
          pagination={{ itemsPerPage: crud.itemsPerPage, onItemsPerPageChange: crud.handleItemsPerPageChange }}
          search={{ value: crud.searchTerm, onChange: crud.handleSearch, placeholder: pageConfig.searchPlaceholder }}
          filter={{
            options: [
              { label: 'All Guide Types', value: 'all' },
              ...guideTypes.map((gt) => ({ label: gt.label, value: gt.value })),
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          }}
          extraFilters={[
            {
              options: [
                { label: 'All Status',  value: 'all'      },
                { label: 'Active',      value: 'active'   },
                { label: 'Inactive',    value: 'inactive' },
              ],
              value: statusFilter,
              onChange: setStatusFilter,
            },
          ]}
        />

        <DataTable
          columns={viewColumns}
          data={filteredData}
          loading={crud.loading}
          emptyState={{
            icon: pageConfig.icon,
            title: tableConfig.emptyState.title,
            description: tableConfig.emptyState.description,
            actionButton: {
              label: pageConfig.addButtonLabel,
              onClick: crud.handleAdd,
            },
          }}
          pagination={{
            currentPage: crud.currentPage,
            totalPages: crud.totalPages,
            totalItems: crud.totalItems,
            itemsPerPage: crud.itemsPerPage,
            onPageChange: crud.handlePageChange,
            onItemsPerPageChange: crud.handleItemsPerPageChange,
          }}
          actions={[
            {
              type: 'view',
              label: 'View',
              onClick: handleView,
              icon: FiEye,
              colorClass: 'text-blue-600 hover:text-blue-700',
            },
            { type: 'edit', label: 'Edit', onClick: crud.handleEdit, icon: FiEdit2 },
            { type: 'delete', label: 'Delete', onClick: crud.handleDelete, icon: FiTrash2 },
            { type: 'restore', label: 'Restore', onClick: crud.handleRestore },
          ]}
          filterStatus={crud.filterStatus}
          actionLoading={crud.actionLoading}
        />
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={crud.showModal}
        onClose={crud.handleCloseModal}
        title="User Guide"
        fields={formFields}
        formData={crud.formData}
        onInputChange={handleInputChange}
        onSubmit={crud.handleSubmit}
        errors={crud.errors}
        isLoading={crud.actionLoading}
        isEditing={crud.isEditing}
        fieldsLayout="three-col"
        maxWidth="max-w-4xl"
      />

      {/* View Modal */}
      {showViewModal && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh]`}>
            {/* Header */}
            <div className={`relative sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4 z-10`}>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
              <div className="pl-3">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{viewItem.title}</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {resolveGuideTypeLabel(viewItem.type)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
            <div className="space-y-3">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl p-4 border`}>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Description</h3>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} mt-1 whitespace-pre-wrap`}>{viewItem.description || '—'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl p-4 border`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Size</p>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{viewItem.size || '—'}</p>
                </div>
              </div>

              {viewItem.download_url ? (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl p-4 border`}>
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase flex items-center gap-2`}>
                    <FaFilePdf className="w-4 h-4 text-red-600" aria-hidden />
                    Document
                  </h3>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setDocPreviewOpen(true)}
                      className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm text-left"
                    >
                      <FaFilePdf className="w-4 h-4 flex-shrink-0" aria-hidden />
                      Preview document
                    </button>
                    <a
                      href={resolveApiAssetUrl(viewItem.download_url)}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-sm font-medium ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : null}

              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Status:{' '}
                <span
                  className={`font-medium ${
                    viewItem.status === 'inactive'
                      ? darkMode
                        ? 'text-yellow-300'
                        : 'text-yellow-700'
                      : darkMode
                      ? 'text-green-300'
                      : 'text-green-700'
                  }`}
                >
                  {viewItem.status === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              </div>

              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Sort Order: <span className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{viewItem.sort_order ?? '—'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeViewModal}
                className={`px-6 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <DocumentPreviewModal
        isOpen={docPreviewOpen && !!viewItem?.download_url}
        title={viewItem?.title || 'Document'}
        url={viewItem?.download_url ? resolveApiAssetUrl(viewItem.download_url) : ''}
        onClose={() => setDocPreviewOpen(false)}
      />
    </div>
  );
};

export default FaqUserGuidesAdmin;


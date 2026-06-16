import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../PageHeader';
import { StatsCards } from '../StatsCard';
import TableControls from '../TableControls';
import DataTable from '../DataTable';
import FormModal from '../FormModal/FormModal';
import ViewModal from '../ViewModal/ViewModal';
import ErrorPage from '../ErrorPage/ErrorPage';

/**
 * Reusable CRUD Page Layout Component
 * Combines common CRUD page elements into a single component
 * 
 * @param {object} pageConfig - Page configuration
 * @param {string} pageConfig.title - Page title
 * @param {string} pageConfig.subtitle - Page subtitle
 * @param {object} pageConfig.icon - Page icon component
 * @param {string} pageConfig.addButtonLabel - Add button label
 * @param {string} pageConfig.searchPlaceholder - Search input placeholder
 * 
 * @param {object} statsConfig - Stats cards configuration
 * @param {object} stats - Stats data
 * @param {array} statsConfig.cards - Array of stat card configs
 * 
 * @param {array} tableColumns - DataTable columns configuration
 * @param {object} tableConfig - DataTable configuration
 * @param {object} tableConfig.emptyState - Empty state config
 * 
 * @param {array} formFields - Form fields configuration
 * @param {string} modalTitle - Modal title (resource name)
 * 
 * @param {object} crud - CRUD hook return object (from useApiCrud)
 * @param {array} filterOptions - Filter options for SearchFilter
 */
const CRUDPage = ({
  // Page config
  pageConfig,

  // Header actions
  headerActions = [],
  
  // Stats config
  statsConfig,
  
  // Table config
  tableColumns,
  tableConfig = {},
  
  // Form config
  formFields,
  formTabs,
  viewTabs,
  modalTitle,
  modalMaxWidth,

  // Optional extra UI rendered between stats cards and table controls.
  belowStats = null,

  // Extra per-row actions injected before delete
  extraActions = [],

  // When set, hides edit/delete actions for the row whose id matches (current user's own row)
  selfId = null,

  // CRUD hook
  crud,
  
  // Filter options
  filterOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Trashed', value: 'trashed' }
  ]
  ,
  // Optional extra filter UI (e.g. email) to render on the right side of the table controls.
  emailFilter = null,
  // Controls how FormModal lays out fields inside the create/edit modal.
  // 'stack', 'two-col' (default), or 'three-col'.
  formFieldsLayout = 'two-col'
}) => {
  const {
    data,
    stats,
    loading,
    actionLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    searchTerm,
    filterStatus,
    showModal,
    isEditing,
    formData,
    errors,
    handleSearch,
    handleFilterChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleRestore,
    handleCloseModal,
    handlePageChange,
    handleItemsPerPageChange,
    handleInputChange,
    handleAdd,
    reload
  } = crud;

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  // Handle view action
  const handleView = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingItem(null);
  };

  // Error state
  if (error) {
    return <ErrorPage message={error} onRetry={reload} />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        icon={pageConfig.icon}
        title={pageConfig.title}
        subtitle={pageConfig.subtitle}
        actions={headerActions}
      />

      {/* Stats Cards */}
      {statsConfig && (
        <StatsCards cards={statsConfig.cards.map(card => ({ ...card, value: stats[card.key] }))} />
      )}

      {/* Optional slot between stats and table */}
      {belowStats}

      {/* Table Controls */}
      <TableControls
        pagination={{
          itemsPerPage,
          onItemsPerPageChange: handleItemsPerPageChange
        }}
        search={{
          value: searchTerm,
          onChange: handleSearch,
          placeholder: pageConfig.searchPlaceholder || 'Search...'
        }}
        filter={{
          options: filterOptions,
          value: filterStatus,
          onChange: handleFilterChange
        }}
        emailFilter={emailFilter}
        addButton={pageConfig.hideAddButton ? null : {
          label: pageConfig.addButtonLabel || 'Add Item',
          icon: FiPlus,
          onClick: handleAdd,
          disabled: actionLoading
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={data}
        loading={loading}
        emptyState={{
          icon: pageConfig.icon,
          title: tableConfig.emptyState?.title || 'No Data Found',
          description: tableConfig.emptyState?.description || 'Get started by adding your first item.',
          actionButton: pageConfig.hideAddButton
            ? null
            : {
                label: pageConfig.addButtonLabel || 'Add Item',
                onClick: handleAdd
              }
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          onPageChange: handlePageChange,
          itemsPerPage,
          onItemsPerPageChange: handleItemsPerPageChange
        }}
        actions={[
          { type: 'view',    label: 'View',    onClick: handleView    },
          { type: 'edit',    label: 'Edit',    onClick: handleEdit,    ...(selfId != null ? { visible: (row) => row.id !== selfId } : {}) },
          ...extraActions,
          { type: 'delete',  label: 'Delete',  onClick: handleDelete,  ...(selfId != null ? { visible: (row) => row.id !== selfId } : {}) },
          { type: 'restore', label: 'Restore', onClick: handleRestore }
        ].filter(a => !(pageConfig.hideActions || []).includes(a.type))}
        filterStatus={filterStatus}
        actionLoading={actionLoading}
      />

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalTitle}
        fields={formFields}
        tabs={formTabs}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        errors={errors}
        isLoading={actionLoading}
        isEditing={isEditing}
        maxWidth={modalMaxWidth || 'max-w-4xl'}
        fieldsLayout={formFieldsLayout}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        item={viewingItem}
        title={`View ${modalTitle}`}
        fields={formFields.map(field => ({
          label: field.label,
          accessor: field.name,
          type: field.type,
          options: field.options,
          placeholder: field.placeholder,
          render: field.render,
          valueRender: field.valueRender,
          fullWidth: field.fullWidth === true || (field.type === 'textarea' && field.name !== 'description')
        }))}
        tabs={viewTabs}
        icon={pageConfig.icon}
      />
    </div>
  );
};

export default CRUDPage;

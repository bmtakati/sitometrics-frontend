import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../context/AuthContext';
import { showErrorDialog, showSuccessToast, showDeleteConfirm, showRestoreConfirm } from '../utils/dialogUtils';
import apiFetch from '../utils/apiFetch';

/**
 * Custom hook for handling CRUD operations with API
 * 
 * @param {string} endpoint - API endpoint (e.g., 'school-categories')
 * @param {object} options - Configuration options
 * @param {object} options.initialFormData - Initial form data structure
 * @param {function} options.validateForm - Form validation function
 * @param {function} options.transformResponse - Transform API response
 * @param {function} options.transformFormData - Transform form data before submission
 * @param {number} options.itemsPerPage - Items per page (default: 10)
 * @param {string} options.resourceName - Resource name for messages (e.g., 'Category')
 * @param {boolean} options.autoLoad - Auto load data on mount (default: true)
 * 
 * @returns {object} - State and handlers for CRUD operations
 */
const useApiCrud = (endpoint, options = {}) => {
  const {
    initialFormData = {},
    validateForm = () => ({}),
    transformResponse = (data) => data,
    transformFormData = (data) => data,
    itemsPerPage = 10,
    resourceName = 'Item',
    autoLoad = true,
    deleteLabelKey = 'name',
    enrichStats: enrichStatsOption
  } = options;

  // State management
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, trashed: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  // API Service
  const getAuthHeaders = (includeJsonContentType = true) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  // Get paginated list with search & filter
  const fetchData = useCallback(async (page = 1, search = '', status = 'all') => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: itemsPerPageState.toString(),
      ...(search && { search })
    });

    // Handle filter types
    if (status === 'trashed') {
      params.append('trashed', 'only');
    } else if (status?.startsWith('role:')) {
      const roleId = status.split(':')[1];
      params.append('role_id', roleId);
    } else if (status?.startsWith('module:')) {
      const moduleName = status.split(':').slice(1).join(':');
      params.append('module_name', moduleName);
    } else if (status?.startsWith('framework:')) {
      const frameworkId = status.split(':')[1];
      params.append('framework_id', frameworkId);
    } else if (status?.startsWith('domain:')) {
      const domainId = status.split(':')[1];
      params.append('domain_id', domainId);
    } else if (status?.startsWith('book_type:')) {
      params.append('book_type_id', status.split(':')[1]);
    } else if (status?.startsWith('school_class:')) {
      params.append('school_class_id', status.split(':')[1]);
    } else if (status?.startsWith('subject:')) {
      params.append('subject_id', status.split(':')[1]);
    } else if (status?.startsWith('book:')) {
      params.append('book_id', status.split(':')[1]);
    } else if (status !== 'all' && status !== '__sep__') {
      params.append('status', status);
    }

    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch ${resourceName.toLowerCase()}s`);
    return await response.json();
  }, [endpoint, itemsPerPageState, resourceName]);

  // Get all data (for dropdowns)
  const fetchAllData = useCallback(async () => {
    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/all`);
    if (!response.ok) throw new Error(`Failed to fetch all ${resourceName.toLowerCase()}s`);
    return await response.json();
  }, [endpoint, resourceName]);

  // Get statistics
  const fetchStats = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params);
    const qs = query.toString();
    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/stats${qs ? `?${qs}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch statistics');
    return await response.json();
  }, [endpoint]);

  // Create item
  const createItem = async (itemData) => {
    const transformed = transformFormData(itemData);
    const hasFile = Object.values(transformed).some((v) => v instanceof File);

    const fetchOptions = hasFile
      ? {
          method: 'POST',
          headers: getAuthHeaders(false),
          body: (() => {
            const form = new FormData();
            Object.entries(transformed).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              if (value instanceof File) {
                form.append(key, value, value.name || 'upload');
                return;
              }
              form.append(key, String(value));
            });
            return form;
          })(),
        }
      : {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify(transformed),
        };

    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}`, fetchOptions);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || `Failed to create ${resourceName.toLowerCase()}`);
      if (errorData.errors) err.fieldErrors = errorData.errors;
      throw err;
    }
    return await response.json();
  };

  // Get item details
  const fetchItemDetails = async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch ${resourceName.toLowerCase()} details`);
    return await response.json();
  };

  // Update item
  const updateItem = async (id, itemData) => {
    const transformed = transformFormData(itemData);
    const hasFile = Object.values(transformed).some((v) => v instanceof File);

    // Multipart file updates: use real POST to /{id} (see api routes) so PHP parses files; apiFetch omits JSON Content-Type for FormData.
    const fetchOptions = hasFile
      ? {
          method: 'POST',
          headers: getAuthHeaders(false),
          body: (() => {
            const form = new FormData();
            Object.entries(transformed).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              if (value instanceof File) {
                form.append(key, value, value.name || 'upload');
                return;
              }
              form.append(key, String(value));
            });
            return form;
          })(),
        }
      : {
          method: 'PUT',
          headers: getAuthHeaders(true),
          body: JSON.stringify(transformed),
        };

    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/${id}`, fetchOptions);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || `Failed to update ${resourceName.toLowerCase()}`);
      if (errorData.errors) err.fieldErrors = errorData.errors;
      throw err;
    }
    return await response.json();
  };

  // Delete item
  const deleteItem = async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete ${resourceName.toLowerCase()}`);
    return await response.json();
  };

  // Restore item
  const restoreItem = async (id) => {
    const response = await apiFetch(`${API_BASE_URL}/api/${endpoint}/${id}/restore`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error(`Failed to restore ${resourceName.toLowerCase()}`);
    return await response.json();
  };

  // Load data with current filters
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchData(currentPage, searchTerm, filterStatus);

      // Handle backend response structure
      if (response.success && response.data) {
        const transformedData = transformResponse(response.data) || [];
        setData(transformedData);
        setTotalPages(response.meta?.last_page || 1);
        setTotalItems(response.meta?.total || 0);
      } else {
        setData([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, fetchData, transformResponse, resourceName]);

  // Load additional data
  const loadStats = useCallback(async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus && filterStatus !== 'all' && filterStatus !== '__sep__') {
        if (filterStatus === 'trashed') {
          params.trashed = 'only';
        } else if (filterStatus.startsWith('role:')) {
          params.role_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('module:')) {
          params.module_name = filterStatus.split(':').slice(1).join(':');
        } else if (filterStatus.startsWith('framework:')) {
          params.framework_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('domain:')) {
          params.domain_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('book_type:')) {
          params.book_type_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('school_class:')) {
          params.school_class_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('subject:')) {
          params.subject_id = filterStatus.split(':')[1];
        } else if (filterStatus.startsWith('book:')) {
          params.book_id = filterStatus.split(':')[1];
        } else {
          params.status = filterStatus;
        }
      }
      const statsRes = await fetchStats(params);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data || { total: 0, active: 0, inactive: 0, trashed: 0 });
      }
    } catch (_) {}
  }, [filterStatus, searchTerm, fetchStats]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAdditionalData = useCallback(async () => {
    const [allDataResult, statsResult] = await Promise.allSettled([
      fetchAllData(),
      fetchStats()
    ]);

    if (allDataResult.status === 'fulfilled') {
      const allDataRes = allDataResult.value;
      if (allDataRes.success && allDataRes.data) {
        setAllData(transformResponse(allDataRes.data) || []);
      }
    }

    if (statsResult.status === 'fulfilled') {
      const statsRes = statsResult.value;
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data || { total: 0, active: 0, inactive: 0, trashed: 0 });
      }
    }
  }, [fetchAllData, fetchStats, transformResponse]);

  // Initial data load
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, currentPage, searchTerm, filterStatus, itemsPerPageState]);

  useEffect(() => {
    if (autoLoad) {
      loadAdditionalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  // Re-fetch stats whenever filter or search changes (after initial mount)
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, filterStatus, searchTerm]);

  // Search and filter handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setActionLoading(true);

      if (isEditing) {
        await updateItem(editingId, formData);
        showSuccessToast(`${resourceName} updated successfully`);
      } else {
        await createItem(formData);
        showSuccessToast(`${resourceName} created successfully`);
      }

      // Reload data and close modal
      await Promise.all([loadData(), loadAdditionalData()]);
      handleCloseModal();

    } catch (err) {
      if (err.fieldErrors) {
        // Spread backend field-level errors into the form (values may be arrays)
        setErrors(err.fieldErrors);
      } else {
        setErrors({ submit: err.message });
        showErrorDialog(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (item) => {
    try {
      setActionLoading(true);
      const details = await fetchItemDetails(item.id);

      // Handle backend response structure
      if (details.success && details.data) {
        setFormData(transformResponse(details.data));
      } else {
        throw new Error('Invalid response format');
      }
      setEditingId(item.id);
      setIsEditing(true);
      setShowModal(true);
      setErrors({});

    } catch (err) {
      showErrorDialog(`Failed to load ${resourceName.toLowerCase()} details`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const deleteLabel = item?.[deleteLabelKey] ?? item?.name ?? item?.title ?? '';
    const result = await showDeleteConfirm(deleteLabel, resourceName);

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteItem(item.id);

        showSuccessToast(`${resourceName} deleted successfully`, 'delete');

        await Promise.all([loadData(), loadAdditionalData()]);

      } catch (err) {
        showErrorDialog(err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRestore = async (item) => {
    const restoreLabel = item?.[deleteLabelKey] ?? item?.name ?? item?.title ?? '';
    const result = await showRestoreConfirm(restoreLabel, resourceName);

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await restoreItem(item.id);

        showSuccessToast(`${resourceName} restored successfully`, 'restore');

        await Promise.all([loadData(), loadAdditionalData()]);

      } catch (err) {
        showErrorDialog(err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormData);
    setErrors({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPageState(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files && files.length ? files[0] : null;
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
      return;
    }

    // Toggle/switch fields pass a boolean directly as value
    const finalValue = typeof value === 'boolean' ? value : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setFormData(initialFormData);
    setErrors({});
    setShowModal(true);
  };

  const reload = async () => {
    setError(null);
    await Promise.all([loadData(), loadAdditionalData()]);
  };

  const resilientStats = useMemo(() => {
    const currentStats = stats || { total: 0, active: 0, inactive: 0, trashed: 0 };
    const hasAnyData = Number(totalItems || 0) > 0 || (data?.length || 0) > 0 || (allData?.length || 0) > 0;
    const statsAllZero = ['total', 'active', 'inactive', 'trashed']
      .every((key) => Number(currentStats[key] || 0) === 0);

    let merged;

    if (!hasAnyData || !statsAllZero) {
      merged = currentStats;
    } else {
      const rawSource = (allData?.length || 0) > 0 ? allData : data;
      const source = Array.isArray(rawSource) ? rawSource : [];
      const getStatusName = (item) => {
        if (item?.status && typeof item.status === 'object') {
          return String(item.status.name || '').toLowerCase();
        }
        return String(item?.status || '').toLowerCase();
      };

      const active = source.filter((item) => getStatusName(item) === 'active').length;
      const inactive = source.filter((item) => getStatusName(item) === 'inactive').length;
      const trashed = source.filter((item) => !!item?.deleted_at).length;

      merged = {
        ...currentStats,
        total: Math.max(Number(totalItems || 0), source.length),
        active,
        inactive,
        trashed,
      };
    }

    if (typeof enrichStatsOption === 'function') {
      const extra = enrichStatsOption({
        stats: merged,
        rawStats: stats,
        data,
        allData,
        totalItems,
      });
      if (extra && typeof extra === 'object') {
        return { ...merged, ...extra };
      }
    }

    return merged;
  }, [stats, totalItems, data, allData, enrichStatsOption]);

  return {
    // State
    data,
    allData,
    stats: resilientStats,
    rawStats: stats,
    loading,
    actionLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: itemsPerPageState,
    searchTerm,
    filterStatus,
    showModal,
    isEditing,
    formData,
    editingId,
    errors,

    // Setters
    setFormData,
    setErrors,
    setShowModal,
    setIsEditing,

    // Handlers
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
    reload,

    // Direct API functions (for custom operations)
    api: {
      fetchData,
      fetchAllData,
      fetchStats,
      createItem,
      fetchItemDetails,
      updateItem,
      deleteItem,
      restoreItem
    }
  };
};

export default useApiCrud;

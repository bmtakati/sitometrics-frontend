import React, { useState, useMemo } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiTrendingUp, FiSave, FiAlertCircle, FiMap } from 'react-icons/fi';
import Swal from 'sweetalert2';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import useDarkMode from '../../hooks/useDarkMode';
import PageHeader from '../../components/PageHeader';
import { StatsCards } from '../../components/StatsCard';
import { normalizeFormFieldsForLayout } from '../../utils/formFieldLayout';

const SetupPageTemplate = ({ title, description, icon: _icon, pageIcon, sampleData, fields }) => {
  // icon from setupConfig is an emoji string; pageIcon is an optional React component.
  // Fall back to FiMap so PageHeader always gets a valid component.
  const HeaderIcon = typeof pageIcon === 'function' ? pageIcon : FiMap;
  const darkMode = useDarkMode();

  // Helper function to convert plural title to singular for button labels
  const getSingularTitle = (pluralTitle) => {
    if (pluralTitle.endsWith('ies')) {
      return pluralTitle.slice(0, -3) + 'y';
    } else if (pluralTitle.endsWith('ses') || pluralTitle.endsWith('xes') || pluralTitle.endsWith('zes')) {
      return pluralTitle.slice(0, -2);
    } else if (pluralTitle.endsWith('s')) {
      return pluralTitle.slice(0, -1);
    }
    return pluralTitle;
  };

  const singularTitle = getSingularTitle(title);
  const layoutFields = normalizeFormFieldsForLayout(fields);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Initialize form data based on fields
  const initialFormData = fields.reduce((acc, field) => {
    acc[field.name] = field.default || '';
    return acc;
  }, { status: 'Active' });

  const [formData, setFormData] = useState(initialFormData);
  const [editFormData, setEditFormData] = useState({ id: null, ...initialFormData });
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // Validate field
  const validateField = (name, value, fieldConfig) => {
    if (fieldConfig.required && !value) {
      return `${fieldConfig.label} is required`;
    }
    return '';
  };

  // Filter and paginate
  const filteredData = useMemo(() => {
    if (!sampleData) return [];
    return sampleData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return Object.values(item).some(value => 
        value.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [searchTerm, sampleData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name], field);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${title} added successfully`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
  };

  const handleEdit = (item) => {
    setEditFormData({ ...item });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field.name, editFormData[field.name], field);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    setShowEditModal(false);
    setEditFormData({ id: null, ...initialFormData });
    setEditErrors({});
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${title} updated successfully`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({ id: null, ...initialFormData });
    setEditErrors({});
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${singularTitle} deleted successfully`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    
    setItemToDelete(null);
  };

  const activeCount = sampleData ? sampleData.filter(item => item.status === 'Active').length : 0;
  const inactiveCount = sampleData ? sampleData.filter(item => item.status === 'Inactive').length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={HeaderIcon}
        title={title}
        subtitle={description}
        actions={[
          {
            label: `Add ${singularTitle}`,
            icon: FiPlus,
            onClick: () => setShowModal(true),
            variant: 'primary',
          }
        ]}
        className="!mb-0"
      />

      {/* Stats Cards */}
      <StatsCards
        columns={4}
        cards={[
          { label: 'Total',    value: sampleData?.length ?? 0,  icon: FiTrendingUp,  iconColor: 'blue-600'   },
          { label: 'Active',   value: activeCount,               icon: FiCheck,       iconColor: 'green-600'  },
          { label: 'Inactive', value: inactiveCount,             icon: FiAlertCircle, iconColor: 'yellow-600' },
          { label: 'Trashed',  value: 0,                         icon: FiTrash2,      iconColor: 'red-600'    },
        ]}
      />

      {/* Table Card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border`}>
        {/* Search Bar */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                {fields.map((field) => (
                  <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {paginatedData.map((item) => (
                <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                  {fields.map((field) => (
                    <td key={field.name} className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item[field.name]}</span>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'Active' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-danger-100 text-danger-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> of{' '}
            <span className="font-medium">{filteredData.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 border rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className={`relative sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4 z-10`}>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
              <div className="flex items-center gap-3 pl-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New {singularTitle}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create a new {singularTitle.toLowerCase()} entry</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Bootstrap-style grid layout */}
              <div className="space-y-4">
                {/* Arrange fields in rows of 2, including status */}
                {Array.from({ length: Math.ceil((layoutFields.length + 1) / 2) }, (_, rowIndex) => {
                  const allFields = [...layoutFields, { name: 'status', label: 'Status', type: 'status' }];
                  const rowFields = allFields.slice(rowIndex * 2, rowIndex * 2 + 2);
                  
                  return (
                    <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rowFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-danger-600">*</span>}
                          </label>
                          {field.type === 'status' ? (
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              value={formData[field.name]}
                              onChange={(e) => {
                                setFormData({ ...formData, [field.name]: e.target.value });
                                if (errors[field.name]) {
                                  setErrors({ ...errors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                              placeholder={field.placeholder}
                              rows={field.name === 'description' ? 1 : 3}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={formData[field.name]}
                              onChange={(e) => {
                                setFormData({ ...formData, [field.name]: e.target.value });
                                if (errors[field.name]) {
                                  setErrors({ ...errors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={formData[field.name]}
                              onChange={(e) => {
                                setFormData({ ...formData, [field.name]: e.target.value });
                                if (errors[field.name]) {
                                  setErrors({ ...errors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                              placeholder={field.placeholder}
                            />
                          )}
                          {errors[field.name] && (
                            <p className="mt-1 text-sm text-danger-600">{errors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiSave className="w-5 h-5" />
                  Add {singularTitle}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className={`relative sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} overflow-hidden border-b flex items-center justify-between px-6 py-4 z-10`}>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
              <div className="flex items-center gap-3 pl-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <FiEdit2 className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit {singularTitle}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Update {singularTitle.toLowerCase()} information</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              {/* Bootstrap-style grid layout */}
              <div className="space-y-4">
                {/* Arrange fields in rows of 2, including status */}
                {Array.from({ length: Math.ceil((layoutFields.length + 1) / 2) }, (_, rowIndex) => {
                  const allFields = [...layoutFields, { name: 'status', label: 'Status', type: 'status' }];
                  const rowFields = allFields.slice(rowIndex * 2, rowIndex * 2 + 2);
                  
                  return (
                    <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rowFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-danger-600">*</span>}
                          </label>
                          {field.type === 'status' ? (
                            <select
                              value={editFormData.status}
                              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              value={editFormData[field.name]}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, [field.name]: e.target.value });
                                if (editErrors[field.name]) {
                                  setEditErrors({ ...editErrors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                editErrors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                              placeholder={field.placeholder}
                              rows="3"
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={editFormData[field.name]}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, [field.name]: e.target.value });
                                if (editErrors[field.name]) {
                                  setEditErrors({ ...editErrors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                editErrors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={editFormData[field.name]}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, [field.name]: e.target.value });
                                if (editErrors[field.name]) {
                                  setEditErrors({ ...editErrors, [field.name]: '' });
                                }
                              }}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                editErrors[field.name] ? 'border-danger-500' : 'border-gray-300'
                              }`}
                              placeholder={field.placeholder}
                            />
                          )}
                          {editErrors[field.name] && (
                            <p className="mt-1 text-sm text-danger-600">{editErrors[field.name]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiSave className="w-5 h-5" />
                  Update {singularTitle}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${singularTitle}`}
        message={`Are you sure you want to delete ""? This action cannot be undone.`}
        itemName={itemToDelete?.name || itemToDelete?.title || ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SetupPageTemplate;

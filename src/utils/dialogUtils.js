import Swal from 'sweetalert2';

/**
 * Shows a modern error dialog with custom styling
 * @param {string} message - The error message to display
 */
export const showErrorDialog = (message) => {
  Swal.fire({
    html: `
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error</h3>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
    `,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium'
    },
    buttonsStyling: true,
    width: '400px',
    allowOutsideClick: true
  });
};

/**
 * Shows a modern success toast notification
 * @param {string} message - The success message to display
 * @param {string} type - Type of toast: 'success', 'delete', or 'restore'
 */
export const showSuccessToast = (message, type = 'success') => {
  const config = {
    success: {
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      icon: `<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`
    },
    delete: {
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      icon: `<svg class="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>`
    },
    restore: {
      gradient: 'from-blue-400 via-cyan-500 to-teal-500',
      icon: `<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>`
    }
  };

  const { gradient, icon } = config[type] || config.success;

  Swal.fire({
    toast: true,
    position: 'top-end',
    html: `
      <div class="relative overflow-hidden bg-gradient-to-r ${gradient} rounded-xl shadow-2xl backdrop-blur-sm">
        <div class="flex items-center p-4 pb-5">
          <div class="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            ${icon}
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-semibold text-white drop-shadow-lg">${message}</p>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30">
          <div class="h-full bg-white progress-bar-animation"></div>
        </div>
      </div>
      <style>
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .progress-bar-animation {
          animation: progressBar 4s linear forwards;
        }
      </style>
    `,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: false,
    background: 'transparent',
    customClass: {
      popup: 'bg-transparent shadow-none'
    },
    didOpen: (toast) => {
      toast.style.boxShadow = 'none';
    }
  });
};

/**
 * Shows a modern confirmation dialog
 * @param {Object} options - Configuration options for the dialog
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message (can include HTML)
 * @param {string} options.confirmText - Text for the confirm button
 * @param {string} options.confirmColor - Color for the confirm button (hex)
 * @param {string} options.icon - SVG icon HTML string
 * @param {string} options.iconBg - Background color class for icon (e.g., 'bg-red-100')
 * @returns {Promise} - Promise that resolves with the dialog result
 */
export const showConfirmDialog = ({ title, message, confirmText, confirmColor, icon, iconBg }) => {
  return Swal.fire({
    html: `
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBg} mb-4">
          ${icon}
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium',
      cancelButton: 'px-4 py-2 rounded-lg font-medium'
    },
    buttonsStyling: true,
    width: '400px',
    allowOutsideClick: true
  });
};

/**
 * Pre-configured delete confirmation dialog
 * @param {string} itemName - Name of the item to delete
 * @param {string} itemType - Type of the item (e.g., 'Category', 'Classification', 'User')
 * @returns {Promise} - Promise that resolves with the dialog result
 */
export const showDeleteConfirm = (itemName = 'this item', itemType = 'Item') => {
  return showConfirmDialog({
    title: `Delete ${itemType}`,
    message: itemName 
      ? `Are you sure you want to delete <span class="font-medium text-gray-900">"${itemName}"</span>?`
      : `Are you sure you want to delete this ${itemType.toLowerCase()}? This action cannot be undone.`,
    confirmText: 'Delete',
    confirmColor: '#ef4444',
    iconBg: 'bg-red-100',
    icon: `<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>`
  });
};

/**
 * Pre-configured restore confirmation dialog
 * @param {string} itemName - Name of the item to restore
 * @param {string} itemType - Type of the item (e.g., 'Category', 'Classification', 'User')
 * @returns {Promise} - Promise that resolves with the dialog result
 */
export const showRestoreConfirm = (itemName = 'this item', itemType = 'Item') => {
  return showConfirmDialog({
    title: `Restore ${itemType}`,
    message: itemName 
      ? `Are you sure you want to restore <span class="font-medium text-gray-900">"${itemName}"</span>?`
      : `Are you sure you want to restore this ${itemType.toLowerCase()}?`,
    confirmText: 'Restore',
    confirmColor: '#10b981',
    iconBg: 'bg-green-100',
    icon: `<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>`
  });
};

/**
 * Shows a loading dialog
 * @param {string} title - Loading title
 * @param {string} message - Loading message
 */
export const showLoadingDialog = (title = 'Processing...', message = 'Please wait') => {
  Swal.fire({
    title,
    html: `<p class="text-gray-600">${message}</p>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

/**
 * Closes any open SweetAlert dialog
 */
export const closeDialog = () => {
  Swal.close();
};

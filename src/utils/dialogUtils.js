import Swal from 'sweetalert2';

const ICONS = {
  error: `<svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  warning: `<svg class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
  success: `<svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  info: `<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  question: `<svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  delete: `<svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
  restore: `<svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
};

const ICON_BG = {
  error: 'bg-red-50',
  warning: 'bg-amber-50',
  success: 'bg-emerald-50',
  info: 'bg-blue-50',
  question: 'bg-indigo-50',
  delete: 'bg-red-50',
  restore: 'bg-emerald-50',
};

const COMPACT_CLASS = {
  popup: 'compact-alert rounded-xl shadow-lg border border-stone-200/80',
  title: 'compact-alert-title',
  htmlContainer: 'compact-alert-body',
  confirmButton: 'compact-alert-btn compact-alert-btn-confirm',
  cancelButton: 'compact-alert-btn compact-alert-btn-cancel',
  input: 'compact-alert-input',
  actions: 'compact-alert-actions',
};

const mergeClasses = (base, extra = {}) => ({ ...base, ...extra });

const compactBody = (icon, iconBg, title, message) => `
  <div class="compact-alert-content">
    <div class="compact-alert-icon ${iconBg}">${icon}</div>
    <div class="compact-alert-text">
      <h3 class="compact-alert-heading">${title}</h3>
      ${message ? `<p class="compact-alert-message">${message}</p>` : ''}
    </div>
  </div>
`;

/** Base compact SweetAlert — prefer helpers below over calling this directly. */
export const fireAlert = (options = {}) =>
  Swal.fire({
    width: '20rem',
    padding: 0,
    buttonsStyling: false,
    reverseButtons: true,
    allowOutsideClick: true,
    ...options,
    customClass: mergeClasses(COMPACT_CLASS, options.customClass),
  });

export const showErrorDialog = (message, title = 'Error') =>
  fireAlert({
    html: compactBody(ICONS.error, ICON_BG.error, title, message),
    confirmButtonText: 'OK',
    confirmButtonColor: undefined,
  });

export const showWarningDialog = (title, message = '') =>
  fireAlert({
    html: compactBody(ICONS.warning, ICON_BG.warning, title, message),
    confirmButtonText: 'OK',
  });

export const showInfoDialog = (title, message = '') =>
  fireAlert({
    html: compactBody(ICONS.info, ICON_BG.info, title, message),
    confirmButtonText: 'OK',
  });

export const showQuickError = (title, message = '') => {
  if (message) return showErrorDialog(message, title);
  return showErrorDialog(title, 'Error');
};

export const showSuccessToast = (message, type = 'success') => {
  const styles = {
    success: 'from-emerald-500 to-teal-600',
    delete: 'from-rose-500 to-red-600',
    restore: 'from-sky-500 to-blue-600',
    info: 'from-blue-500 to-indigo-600',
    warning: 'from-amber-500 to-orange-600',
  };

  return Swal.fire({
    toast: true,
    position: 'top-end',
    timer: 2800,
    timerProgressBar: true,
    showConfirmButton: false,
    background: 'transparent',
    customClass: { popup: 'compact-toast' },
    html: `
      <div class="compact-toast-card bg-gradient-to-r ${styles[type] || styles.success}">
        <span class="compact-toast-text">${message}</span>
      </div>
    `,
  });
};

export const showQuickSuccess = (message) => showSuccessToast(message, 'success');

export const showConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#059669',
  icon = ICONS.question,
  iconBg = ICON_BG.question,
}) =>
  fireAlert({
    html: compactBody(icon, iconBg, title, message),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: mergeClasses(COMPACT_CLASS, {
      confirmButton:
        confirmColor === '#dc2626'
          ? 'compact-alert-btn compact-alert-btn-danger'
          : 'compact-alert-btn compact-alert-btn-confirm',
    }),
  });

export const showDeleteConfirm = (itemName = 'this item', itemType = 'Item') =>
  showConfirmDialog({
    title: `Delete ${itemType}`,
    message: itemName
      ? `Delete <strong>${itemName}</strong>? This cannot be undone.`
      : `Delete this ${itemType.toLowerCase()}? This cannot be undone.`,
    confirmText: 'Delete',
    confirmColor: '#dc2626',
    icon: ICONS.delete,
    iconBg: ICON_BG.delete,
  });

export const showRestoreConfirm = (itemName = 'this item', itemType = 'Item') =>
  showConfirmDialog({
    title: `Restore ${itemType}`,
    message: itemName
      ? `Restore <strong>${itemName}</strong>?`
      : `Restore this ${itemType.toLowerCase()}?`,
    confirmText: 'Restore',
    confirmColor: '#059669',
    icon: ICONS.restore,
    iconBg: ICON_BG.restore,
  });

export const showWorkflowConfirm = async ({
  title,
  message = '',
  confirmText = 'Confirm',
  withRemarks = false,
  remarksLabel = 'Remarks',
}) => {
  const result = await fireAlert({
    html: `${compactBody(ICONS.question, ICON_BG.question, title, message)}`,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    input: withRemarks ? 'textarea' : undefined,
    inputLabel: withRemarks ? remarksLabel : undefined,
    inputPlaceholder: withRemarks ? 'Optional…' : undefined,
    inputAttributes: withRemarks ? { 'aria-label': remarksLabel } : undefined,
  });

  const remarks =
    typeof result.value === 'string' && result.value.trim() ? result.value.trim() : null;

  return { isConfirmed: result.isConfirmed, remarks, value: result.value };
};

export const showSelectPrompt = ({
  title,
  message = '',
  options = {},
  confirmText = 'Confirm',
  placeholder = 'Select…',
  validator,
}) =>
  fireAlert({
    html: `
      <p class="compact-alert-heading">${title}</p>
      ${message ? `<p class="compact-alert-message mb-2">${message}</p>` : ''}
    `,
    input: 'select',
    inputOptions: options,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    inputValidator: validator,
  });

export const showTextPrompt = ({
  title,
  message = '',
  placeholder = '',
  confirmText = 'Continue',
  validator,
  inputValue = '',
}) =>
  fireAlert({
    html: `
      <p class="compact-alert-heading">${title}</p>
      ${message ? `<p class="compact-alert-message mb-2">${message}</p>` : ''}
    `,
    input: 'text',
    inputValue,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    inputValidator: validator,
  });

export const showNumberPrompt = ({
  title,
  message = '',
  value = '',
  min,
  max,
  step = 1,
  confirmText = 'Confirm',
}) =>
  fireAlert({
    html: `
      <p class="compact-alert-heading">${title}</p>
      ${message ? `<p class="compact-alert-message mb-2">${message}</p>` : ''}
    `,
    input: 'number',
    inputValue: value,
    inputAttributes: { min, max, step },
    showCancelButton: true,
    confirmButtonText: confirmText,
  });

export const showLoadingDialog = (title = 'Processing…', message = 'Please wait') =>
  fireAlert({
    title,
    html: `<p class="compact-alert-message">${message}</p>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    width: '16rem',
    didOpen: () => Swal.showLoading(),
  });

export const closeDialog = () => Swal.close();

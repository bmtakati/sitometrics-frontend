# Dialog & Toast Utilities Guide

This guide explains how to use the reusable dialog and toast utilities across all pages in the application.

## Import

```javascript
import { 
  showErrorDialog, 
  showSuccessToast, 
  showConfirmDialog,
  showDeleteConfirm,
  showRestoreConfirm,
  showLoadingDialog,
  closeDialog 
} from '../../utils/dialogUtils';
```

## Available Functions

### 1. Error Dialog

Shows a modern error dialog with a red icon and custom styling.

```javascript
showErrorDialog('Something went wrong!');
```

**Use cases:**
- API errors
- Validation failures
- Connection issues

---

### 2. Success Toast

Shows a gradient toast notification in the top-right corner with an animated progress bar.

```javascript
// Success toast (green gradient)
showSuccessToast('Category created successfully!');

// Delete toast (red gradient)
showSuccessToast('Item deleted successfully!', 'delete');

// Restore toast (blue gradient)
showSuccessToast('Item restored successfully!', 'restore');
```

**Parameters:**
- `message` (string): The message to display
- `type` (string, optional): `'success'` | `'delete'` | `'restore'` (default: `'success'`)

**Use cases:**
- Success messages after create/update
- Confirmation after delete
- Confirmation after restore

---

### 3. Confirmation Dialog

General-purpose confirmation dialog with full customization.

```javascript
const result = await showConfirmDialog({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Yes, Proceed',
  confirmColor: '#3b82f6',
  iconBg: 'bg-blue-100',
  icon: `<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`
});

if (result.isConfirmed) {
  // User clicked confirm button
  console.log('User confirmed!');
}
```

**Parameters:**
- `title` (string): Dialog title
- `message` (string): Dialog message (can include HTML)
- `confirmText` (string): Text for confirm button
- `confirmColor` (string): Hex color for confirm button
- `iconBg` (string): Tailwind class for icon background (e.g., `'bg-red-100'`)
- `icon` (string): SVG icon as HTML string

**Returns:** Promise that resolves with `{ isConfirmed: boolean }`

---

### 4. Delete Confirmation (Pre-configured)

Simplified delete confirmation with pre-configured red styling and trash icon.

```javascript
// With item name
const result = await showDeleteConfirm('Math Category', 'Category');
if (result.isConfirmed) {
  // Delete the item
}

// Without item name (generic message)
const result = await showDeleteConfirm(null, 'User');
if (result.isConfirmed) {
  // Delete the item
}
```

**Parameters:**
- `itemName` (string|null): Name of the item to delete (will be highlighted in message)
- `itemType` (string): Type of item (e.g., 'Category', 'User', 'Post')

**Message examples:**
- With name: "Are you sure you want to delete **"Math Category"**?"
- Without name: "Are you sure you want to delete this category? This action cannot be undone."

---

### 5. Restore Confirmation (Pre-configured)

Simplified restore confirmation with pre-configured green styling and restore icon.

```javascript
// With item name
const result = await showRestoreConfirm('Math Category', 'Category');
if (result.isConfirmed) {
  // Restore the item
}

// Without item name (generic message)
const result = await showRestoreConfirm(null, 'User');
if (result.isConfirmed) {
  // Restore the item
}
```

**Parameters:**
- `itemName` (string|null): Name of the item to restore (will be highlighted in message)
- `itemType` (string): Type of item (e.g., 'Category', 'User', 'Post')

---

### 6. Loading Dialog

Shows a loading dialog with spinner (useful for long operations).

```javascript
// Show loading
showLoadingDialog('Processing...', 'Please wait while we process your request');

// Perform async operation
await performLongOperation();

// Close loading dialog
closeDialog();
```

**Parameters:**
- `title` (string, optional): Loading title (default: 'Processing...')
- `message` (string, optional): Loading message (default: 'Please wait')

---

### 7. Close Dialog

Closes any open SweetAlert dialog.

```javascript
closeDialog();
```

---

## Complete Example

Here's a complete example showing all utilities in action:

```javascript
import React, { useState } from 'react';
import { 
  showErrorDialog, 
  showSuccessToast, 
  showDeleteConfirm,
  showRestoreConfirm 
} from '../../utils/dialogUtils';
import apiService from '../../services/apiService';

const MyComponent = () => {
  const [items, setItems] = useState([]);

  const handleCreate = async (data) => {
    try {
      await apiService.createItem(data);
      showSuccessToast('Item created successfully!');
      loadItems();
    } catch (err) {
      showErrorDialog(err.message);
    }
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm(item.name, 'Item');
    
    if (result.isConfirmed) {
      try {
        await apiService.deleteItem(item.id);
        showSuccessToast('Item deleted successfully!', 'delete');
        loadItems();
      } catch (err) {
        showErrorDialog(err.message);
      }
    }
  };

  const handleRestore = async (item) => {
    const result = await showRestoreConfirm(item.name, 'Item');
    
    if (result.isConfirmed) {
      try {
        await apiService.restoreItem(item.id);
        showSuccessToast('Item restored successfully!', 'restore');
        loadItems();
      } catch (err) {
        showErrorDialog(err.message);
      }
    }
  };

  // ... rest of component
};
```

---

## Benefits

✅ **Consistent UI**: All dialogs and toasts have the same modern design  
✅ **Less Code**: No need to repeat dialog definitions in every page  
✅ **Easy Maintenance**: Update styling in one place  
✅ **Type Safety**: Clear function signatures  
✅ **Reusable**: Works across all components and pages

---

## Design Features

- Modern gradient backgrounds
- Animated progress bars
- Custom SVG icons
- Tailwind CSS styling
- Smooth transitions
- Responsive design
- Backdrop blur effects
- Shadow elevations

---

## Migration Guide

### Before (Old way - defining in each file):
```javascript
import Swal from 'sweetalert2';

const MyComponent = () => {
  const showErrorDialog = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  };
  
  // ... 50+ lines of dialog definitions
};
```

### After (New way - using utilities):
```javascript
import { showErrorDialog, showSuccessToast } from '../../utils/dialogUtils';

const MyComponent = () => {
  // Just use the functions directly!
  // No local definitions needed
};
```

---

## Notes

- All dialogs are promise-based (use `async/await`)
- Toast notifications auto-close after 4 seconds
- Confirmation dialogs return `{ isConfirmed: boolean }`
- HTML is supported in messages for formatting
- Dialogs are non-blocking and accessible

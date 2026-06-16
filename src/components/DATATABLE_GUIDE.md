# DataTable Component Usage Guide

The `DataTable` component is a fully reusable table component that handles loading states, empty states, pagination, and actions. It can be used across all pages in the application.

## Import

```javascript
import DataTable from '../../components/DataTable';
import { FiBookOpen } from 'react-icons/fi'; // For empty state icon
```

## Basic Usage

```javascript
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  emptyState={emptyStateConfig}
  pagination={paginationConfig}
  actions={actions}
  filterStatus={filterStatus}
  actionLoading={actionLoading}
/>
```

## Props

### 1. columns (Required)
Array of column definitions. Each column object can have:

```javascript
const columns = [
  {
    header: 'Column Name',        // Header text
    accessor: 'fieldName',        // Path to data field (supports nested: 'user.name')
    type: 'status',               // Optional: 'status', 'truncate', 'badge' or omit for default
    noWrap: true,                 // Optional: prevent text wrapping
    width: '200px',               // Optional: fixed column width
    className: 'text-right',      // Optional: custom thead className
    cellClassName: 'bg-gray-50',  // Optional: custom td className
    render: (row) => <Custom />   // Optional: custom render function
  }
];
```

#### Column Types:

**Default (no type specified):**
```javascript
{ header: 'Name', accessor: 'name' }
// Renders: <div class="text-sm text-gray-600">{value || '—'}</div>
```

**Status:**
```javascript
{ header: 'Status', accessor: 'status', type: 'status' }
// Renders color-coded badge: green for 'active', red for 'inactive', gray for others
```

**Truncate:**
```javascript
{ header: 'Description', accessor: 'description', type: 'truncate' }
// Renders truncated text with full content in title tooltip
```

**Badge:**
```javascript
{ header: 'Role', accessor: 'role', type: 'badge' }
// Renders: <span class="badge">value</span>
```

**Custom Render:**
```javascript
{
  header: 'User',
  accessor: 'user',
  render: (row) => (
    <div className="flex items-center">
      <img src={row.avatar} className="w-8 h-8 rounded-full mr-2" />
      <span>{row.user.name}</span>
    </div>
  )
}
```

**Row Number:**
```javascript
{ header: '#', accessor: '_rowNumber' }
// Automatically renders sequential row numbers
```

### 2. data (Required)
Array of data objects to display. Each object should have an `id` property for React keys.

```javascript
const data = [
  { id: 1, name: 'John Doe', status: 'active', role: 'Admin' },
  { id: 2, name: 'Jane Smith', status: 'inactive', role: 'User' }
];
```

### 3. loading (Optional)
Boolean to show loading state.

```javascript
loading={loading}
```

### 4. emptyState (Optional)
Configuration for when data is empty:

```javascript
emptyState={{
  icon: FiBookOpen,                    // React icon component
  title: 'No Data Found',              // Main heading
  description: 'Brief description',    // Subtitle
  actionButton: {                      // Optional button
    label: 'Add New Item',
    onClick: () => setShowModal(true)
  }
}}
```

### 5. pagination (Optional)
Pass `null` to disable pagination, or provide config:

```javascript
pagination={{
  currentPage: 1,
  totalPages: 10,
  onPageChange: (page) => setCurrentPage(page)
}}
```

### 6. actions (Optional)
Array of action button configurations:

```javascript
actions={[
  {
    type: 'edit',                    // String identifier
    label: 'Edit',                   // Tooltip text
    icon: FiEdit2,                   // Optional: custom icon (defaults based on type)
    colorClass: 'text-blue-600',     // Optional: custom color classes
    onClick: (row) => handleEdit(row)
  },
  {
    type: 'delete',
    label: 'Delete',
    onClick: (row) => handleDelete(row)
  },
  {
    type: 'restore',                 // Only shown when filterStatus === 'trashed'
    label: 'Restore',
    onClick: (row) => handleRestore(row)
  },
  {
    type: 'custom',                  // Custom action
    label: 'Download',
    icon: FiDownload,
    colorClass: 'text-green-600 hover:text-green-700',
    onClick: (row) => downloadFile(row)
  }
]}
```

**Built-in Action Types:**
- `edit` - Blue color, FiEdit2 icon
- `delete` - Red color, FiTrash2 icon
- `restore` - Green color, FiRotateCcw icon (only shown for trashed items)

### 7. filterStatus (Optional)
Current filter status. When set to `'trashed'`, only restore actions are shown.

```javascript
filterStatus={filterStatus}  // 'all', 'active', 'inactive', 'trashed'
```

### 8. actionLoading (Optional)
Boolean to disable action buttons during operations.

```javascript
actionLoading={actionLoading}
```

---

## Complete Examples

### Example 1: School Categories

```javascript
import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { FiBookOpen } from 'react-icons/fi';

const SchoolCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const handleEdit = (category) => {
    console.log('Edit:', category);
  };

  const handleDelete = (category) => {
    console.log('Delete:', category);
  };

  const handleRestore = (category) => {
    console.log('Restore:', category);
  };

  return (
    <DataTable
      columns={[
        {
          header: 'Category',
          accessor: 'name',
          noWrap: true,
          render: (row) => <div className="text-sm font-medium text-gray-900">{row.name}</div>
        },
        {
          header: 'Code',
          accessor: 'code',
          noWrap: true
        },
        {
          header: 'Description',
          accessor: 'description',
          type: 'truncate'
        },
        {
          header: 'Status',
          accessor: 'status',
          type: 'status',
          noWrap: true
        }
      ]}
      data={categories}
      loading={loading}
      emptyState={{
        icon: FiBookOpen,
        title: 'No Categories Found',
        description: 'Get started by creating your first school category.',
        actionButton: {
          label: 'Add Category',
          onClick: () => setShowModal(true)
        }
      }}
      pagination={totalPages > 1 ? {
        currentPage,
        totalPages,
        onPageChange: setCurrentPage
      } : null}
      actions={[
        { type: 'edit', label: 'Edit', onClick: handleEdit },
        { type: 'delete', label: 'Delete', onClick: handleDelete },
        { type: 'restore', label: 'Restore', onClick: handleRestore }
      ]}
      filterStatus={filterStatus}
      actionLoading={actionLoading}
    />
  );
};
```

### Example 2: User List

```javascript
<DataTable
  columns={[
    { header: '#', accessor: '_rowNumber', noWrap: true },
    {
      header: 'User',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <img src={row.avatar} className="w-8 h-8 rounded-full mr-2" alt="" />
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Role', accessor: 'role', type: 'badge' },
    { header: 'Status', accessor: 'status', type: 'status' }
  ]}
  data={users}
  loading={loading}
  emptyState={{
    icon: FiUsers,
    title: 'No Users Found',
    description: 'No users match your search criteria.'
  }}
  actions={[
    { type: 'edit', label: 'Edit User', onClick: handleEditUser },
    { type: 'delete', label: 'Delete User', onClick: handleDeleteUser }
  ]}
  actionLoading={actionLoading}
/>
```

### Example 3: Simple List (No Actions)

```javascript
<DataTable
  columns={[
    { header: 'Item Name', accessor: 'name' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Price', accessor: 'price', render: (row) => `$${row.price}` }
  ]}
  data={items}
  loading={loading}
  emptyState={{
    title: 'No Items',
    description: 'Your inventory is empty.'
  }}
/>
```

### Example 4: With Custom Actions

```javascript
import { FiDownload, FiMail, FiEye } from 'react-icons/fi';

<DataTable
  columns={[
    { header: 'Document', accessor: 'title' },
    { header: 'Type', accessor: 'type', type: 'badge' },
    { header: 'Date', accessor: 'created_at' }
  ]}
  data={documents}
  loading={loading}
  actions={[
    {
      type: 'view',
      label: 'View',
      icon: FiEye,
      colorClass: 'text-indigo-600 hover:text-indigo-700',
      onClick: (doc) => viewDocument(doc)
    },
    {
      type: 'download',
      label: 'Download',
      icon: FiDownload,
      colorClass: 'text-green-600 hover:text-green-700',
      onClick: (doc) => downloadDocument(doc)
    },
    {
      type: 'email',
      label: 'Email',
      icon: FiMail,
      colorClass: 'text-blue-600 hover:text-blue-700',
      onClick: (doc) => emailDocument(doc)
    }
  ]}
  actionLoading={actionLoading}
/>
```

---

## Features

✅ **Responsive Design** - Mobile-friendly with horizontal scroll  
✅ **Loading States** - Automatic loading spinner  
✅ **Empty States** - Customizable empty state with action button  
✅ **Pagination** - First/Previous/Next/Last navigation with page numbers  
✅ **Flexible Columns** - Multiple column types and custom rendering  
✅ **Action Buttons** - Built-in edit/delete/restore actions  
✅ **Conditional Rendering** - Different actions based on filter status  
✅ **Hover Effects** - Row hover highlighting  
✅ **Type Safety** - Clear prop structure  
✅ **Customizable** - Override styles with className props

---

## Column Type Reference

| Type | Description | Example |
|------|-------------|---------|
| `default` | Plain text with em dash for empty values | `{ accessor: 'name' }` |
| `status` | Color-coded badge (green/red/gray) | `{ accessor: 'status', type: 'status' }` |
| `truncate` | Truncated text with tooltip | `{ accessor: 'description', type: 'truncate' }` |
| `badge` | Blue badge styling | `{ accessor: 'role', type: 'badge' }` |
| `custom` | Fully custom render function | `{ render: (row) => <Custom /> }` |
| `_rowNumber` | Sequential row numbering | `{ accessor: '_rowNumber' }` |

---

## Best Practices

1. **Always provide an `id`** in your data objects for React keys
2. **Use `noWrap`** for columns that should not wrap (names, codes, status)
3. **Use `truncate` type** for long text fields (descriptions, comments)
4. **Provide meaningful empty states** with action buttons when appropriate
5. **Disable pagination** (pass `null`) when data fits on one page
6. **Use `filterStatus`** to conditionally show restore vs edit/delete actions
7. **Set `actionLoading`** to prevent multiple simultaneous actions
8. **Use custom render functions** for complex cell content (avatars, badges, etc.)

---

## Migration from Manual Tables

**Before:**
```javascript
<table className="w-full">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.status}</td>
        <td>
          <button onClick={() => handleEdit(item)}>Edit</button>
          <button onClick={() => handleDelete(item)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```javascript
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: 'status', type: 'status' }
  ]}
  data={data}
  actions={[
    { type: 'edit', label: 'Edit', onClick: handleEdit },
    { type: 'delete', label: 'Delete', onClick: handleDelete }
  ]}
/>
```

---

## Troubleshooting

**Table doesn't show data:**
- Check that `data` is an array
- Verify `accessor` matches your data structure
- Check browser console for errors

**Pagination not showing:**
- Ensure `totalPages > 1`
- Pass proper pagination object (not `null`)

**Actions not working:**
- Verify action `onClick` is a function
- Check that action `type` is correct
- Ensure `filterStatus` matches your logic

**Custom render not working:**
- Use arrow function: `render: (row) => <Custom />`
- Access row data correctly within render function
- Ensure JSX is valid

---

## Support

For issues or feature requests related to the DataTable component, please check:
1. This documentation first
2. The component source code: `src/components/DataTable.jsx`
3. Working examples in: `src/pages/schools/SchoolCategory.jsx`

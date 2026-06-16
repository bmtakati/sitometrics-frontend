# useApiCrud Hook Guide

A powerful custom hook that handles all CRUD operations, reducing boilerplate code by ~80%.

## Features

- ✅ Complete CRUD operations (Create, Read, Update, Delete, Restore)
- ✅ Pagination, search, and filtering
- ✅ Modal state management
- ✅ Form state and validation
- ✅ Loading and error states
- ✅ Auto-loading data
- ✅ Statistics tracking
- ✅ Customizable transformations
- ✅ Built-in success/error notifications

## Import

```jsx
import useApiCrud from '../../hooks/useApiCrud';
```

## Basic Usage

```jsx
const MyComponent = () => {
  const crud = useApiCrud('school-categories', {
    initialFormData: {
      name: '',
      description: '',
      status: 'active'
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Name is required';
      }
      return errors;
    },
    resourceName: 'Category'
  });

  return (
    <div>
      {/* Use crud state and handlers */}
      {crud.loading && <div>Loading...</div>}
      {crud.error && <div>{crud.error}</div>}
      {/* ... */}
    </div>
  );
};
```

## Parameters

### `endpoint` (required)
API endpoint path (without `/api/` prefix)
```jsx
useApiCrud('school-categories')
useApiCrud('schools')
useApiCrud('users')
```

### `options` (optional)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialFormData` | `object` | `{}` | Initial form data structure |
| `validateForm` | `function` | `() => ({})` | Form validation function |
| `transformResponse` | `function` | `(data) => data` | Transform API response data |
| `transformFormData` | `function` | `(data) => data` | Transform form data before submit |
| `itemsPerPage` | `number` | `10` | Items per page |
| `resourceName` | `string` | `'Item'` | Resource name for messages |
| `autoLoad` | `boolean` | `true` | Auto load data on mount |

## Returned Object

### State

```jsx
const {
  // Data
  data,              // Paginated data array
  allData,           // All data (for dropdowns)
  stats,             // Statistics { total, active, inactive, trashed }
  
  // Loading states
  loading,           // Initial loading
  actionLoading,     // Action in progress (save, delete, etc.)
  error,             // Error message
  
  // Pagination
  currentPage,       // Current page number
  totalPages,        // Total pages
  
  // Search & Filter
  searchTerm,        // Search term
  filterStatus,      // Filter status
  
  // Modal
  showModal,         // Modal visibility
  isEditing,         // Edit mode flag
  
  // Form
  formData,          // Form data object
  editingId,         // ID being edited
  errors,            // Form errors
  
  // ... handlers
} = crud;
```

### Handlers

```jsx
const {
  handleSearch,        // (value) => void
  handleFilterChange,  // (status) => void
  handleSubmit,        // (e) => Promise<void>
  handleEdit,          // (item) => Promise<void>
  handleDelete,        // (item) => Promise<void>
  handleRestore,       // (item) => Promise<void>
  handleCloseModal,    // () => void
  handlePageChange,    // (page) => void
  handleInputChange,   // (e) => void
  handleAdd,           // () => void
  reload,              // () => Promise<void>
} = crud;
```

### API Functions

```jsx
const { api } = crud;

// Direct API access for custom operations
await api.fetchData(page, search, status);
await api.createItem(data);
await api.updateItem(id, data);
await api.deleteItem(id);
// ... etc
```

## Complete Example (Before/After)

### Before (550 lines)

```jsx
const SchoolCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // ... 30+ lines of state
  
  const apiService = {
    getCategories: async () => { /* ... */ },
    createCategory: async () => { /* ... */ },
    updateCategory: async () => { /* ... */ },
    // ... 100+ lines of API code
  };
  
  const loadCategories = async () => { /* ... */ };
  const handleSubmit = async () => { /* ... */ };
  const handleEdit = async () => { /* ... */ };
  // ... 200+ lines of handlers
  
  return (
    <div>
      {/* ... 200+ lines of JSX */}
    </div>
  );
};
```

### After (120 lines)

```jsx
const SchoolCategory = () => {
  const crud = useApiCrud('school-categories', {
    initialFormData: {
      name: '',
      description: '',
      status: 'active'
    },
    validateForm: (data) => {
      const errors = {};
      if (!data.name?.trim()) {
        errors.name = 'Category name is required';
      }
      return errors;
    },
    resourceName: 'Category'
  });

  const formFields = [
    { name: 'name', label: 'Category Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: [...] }
  ];

  if (crud.error) {
    return <ErrorPage message={crud.error} onRetry={crud.reload} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader {...headerConfig} />
      <StatsCards {...statsConfig} />
      <SearchFilter {...searchConfig} />
      <DataTable {...tableConfig} />
      <FormModal {...modalConfig} />
    </div>
  );
};
```

## Advanced Usage

### Custom Validation

```jsx
const crud = useApiCrud('schools', {
  initialFormData: {
    name: '',
    email: '',
    capacity: 0
  },
  validateForm: (data) => {
    const errors = {};
    
    if (!data.name?.trim()) {
      errors.name = 'School name is required';
    }
    
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (data.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    return errors;
  },
  resourceName: 'School'
});
```

### Data Transformation

```jsx
const crud = useApiCrud('schools', {
  // Transform API response
  transformResponse: (data) => {
    return data.map(item => ({
      ...item,
      fullName: `${item.name} (${item.code})`
    }));
  },
  
  // Transform data before submission
  transformFormData: (data) => {
    return {
      ...data,
      capacity: parseInt(data.capacity, 10),
      email: data.email.toLowerCase()
    };
  }
});
```

### Manual Data Loading

```jsx
const crud = useApiCrud('schools', {
  autoLoad: false  // Don't load automatically
});

// Load data manually
useEffect(() => {
  if (someCondition) {
    crud.reload();
  }
}, [someCondition]);
```

### Custom API Operations

```jsx
const crud = useApiCrud('schools', options);

// Use direct API access for custom operations
const handleBulkImport = async (file) => {
  try {
    // Custom API call
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/schools/bulk-import`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Import failed');
    
    // Reload data after custom operation
    await crud.reload();
    showSuccessToast('Import successful');
  } catch (error) {
    showErrorDialog(error.message);
  }
};
```

### Using with CRUDPage Component

```jsx
import CRUDPage from '../../components/CRUDPage/CRUDPage';
import useApiCrud from '../../hooks/useApiCrud';
import { FiBookOpen } from 'react-icons/fi';

const SchoolCategory = () => {
  const crud = useApiCrud('school-categories', {
    initialFormData: { name: '', description: '', status: 'active' },
    validateForm: (data) => (!data.name ? { name: 'Required' } : {}),
    resourceName: 'Category'
  });

  return (
    <CRUDPage
      pageConfig={{
        icon: FiBookOpen,
        title: 'School Categories',
        subtitle: 'Manage school categories',
        addButtonLabel: 'Add Category',
        searchPlaceholder: 'Search categories...'
      }}
      statsConfig={{
        cards: [
          { key: 'total', label: 'Total', icon: FiTrendingUp, iconColor: 'blue-600' },
          { key: 'active', label: 'Active', icon: FiBookOpen, iconColor: 'green-600' }
        ]
      }}
      tableColumns={[
        { header: 'Name', accessor: 'name' },
        { header: 'Status', accessor: 'status', type: 'status' }
      ]}
      formFields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' }
      ]}
      modalTitle="Category"
      crud={crud}
    />
  );
};
```

## API Requirements

Your backend API should follow this structure:

```
GET    /api/{endpoint}?page=1&per_page=10&search=&status=active
GET    /api/{endpoint}/all
GET    /api/{endpoint}/stats
GET    /api/{endpoint}/{id}
POST   /api/{endpoint}
PUT    /api/{endpoint}/{id}
DELETE /api/{endpoint}/{id}
POST   /api/{endpoint}/{id}/restore
```

### Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "last_page": 5,
    "current_page": 1,
    "total": 50
  }
}
```

## Tips

1. **Combine with CRUDPage** for maximum code reduction
2. **Custom validation** - Provide specific validation rules
3. **Transform data** - Use transformers for data formatting
4. **Manual control** - Set `autoLoad: false` for conditional loading
5. **Direct API access** - Use `crud.api.*` for custom operations
6. **Reload on demand** - Call `crud.reload()` after custom operations

## Migration Guide

To convert an existing component:

1. Import the hook
2. Replace all state declarations with the hook
3. Replace API service with hook's built-in functions
4. Replace handlers with hook's handlers
5. Update JSX to use hook's state/handlers
6. Remove boilerplate code

Result: ~70-80% code reduction!

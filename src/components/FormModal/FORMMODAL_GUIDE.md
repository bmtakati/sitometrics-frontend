# FormModal Component Guide

A reusable, accessible modal component for creating and editing forms across your application.

## Features

- ✅ Fully reusable and configurable
- ✅ Support for multiple input types (text, textarea, select, number, email, password, date)
- ✅ Built-in validation error display
- ✅ Loading states
- ✅ Edit/Create mode detection
- ✅ Customizable styling
- ✅ Accessible (keyboard navigation, ARIA labels)
- ✅ Backdrop click to close
- ✅ Responsive design

## Import

```jsx
import FormModal from '../../components/FormModal/FormModal';
```

## Basic Usage

```jsx
const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Your API call here
      if (isEditing) {
        await updateItem(formData);
      } else {
        await createItem(formData);
      }
      setShowModal(false);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    {
      name: 'name',
      label: 'Category Name',
      type: 'text',
      required: true,
      autoFocus: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Add Item
      </button>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Category"
        fields={fields}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        errors={errors}
        isLoading={isLoading}
        isEditing={isEditing}
      />
    </>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | **Required.** Controls modal visibility |
| `onClose` | `function` | - | **Required.** Handler for closing the modal |
| `title` | `string` | - | **Required.** Modal title (auto-prefixed with "Edit" or "Add New") |
| `fields` | `array` | `[]` | **Required.** Array of field configurations |
| `formData` | `object` | `{}` | Form data object |
| `onInputChange` | `function` | - | **Required.** Input change handler |
| `onSubmit` | `function` | - | **Required.** Form submit handler |
| `errors` | `object` | `{}` | Validation errors object |
| `isLoading` | `boolean` | `false` | Loading state for submit button |
| `isEditing` | `boolean` | `false` | Whether in edit mode |
| `gradientFrom` | `string` | `'blue-600'` | Starting color for header gradient |
| `gradientTo` | `string` | `'green-500'` | Ending color for header gradient |
| `submitLabel` | `string` | Auto | Custom submit button label |
| `maxWidth` | `string` | `'max-w-md'` | Maximum width of modal |

## Field Configuration

Each field in the `fields` array should have the following structure:

```jsx
{
  name: 'fieldName',           // Field name (matches formData key)
  label: 'Field Label',        // Display label
  type: 'text',                // Input type (see types below)
  required: true,              // Whether field is required
  placeholder: 'Enter value',  // Placeholder text (optional)
  options: [],                 // For select: [{ value, label }]
  rows: 3,                     // For textarea: number of rows
  disabled: false,             // Whether field is disabled
  autoFocus: false             // Whether field should auto-focus
}
```

### Supported Field Types

- `text` - Standard text input
- `textarea` - Multi-line text area
- `select` - Dropdown select
- `number` - Number input
- `email` - Email input
- `password` - Password input
- `date` - Date picker

## Examples

### Simple Text Form

```jsx
const fields = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true
  }
];
```

### Select with Options

```jsx
const fields = [
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: [
      { value: 'primary', label: 'Primary School' },
      { value: 'secondary', label: 'Secondary School' },
      { value: 'tertiary', label: 'Tertiary Institution' }
    ]
  }
];
```

### Multi-line Textarea

```jsx
const fields = [
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    rows: 5,
    placeholder: 'Enter detailed description...'
  }
];
```

### Number Input

```jsx
const fields = [
  {
    name: 'capacity',
    label: 'Student Capacity',
    type: 'number',
    required: true
  }
];
```

### Email Input

```jsx
const fields = [
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true
  }
];
```

### Disabled Field

```jsx
const fields = [
  {
    name: 'code',
    label: 'Category Code',
    type: 'text',
    disabled: true
  }
];
```

### Custom Styling

```jsx
<FormModal
  // ... other props
  gradientFrom="purple-600"
  gradientTo="pink-500"
  maxWidth="max-w-2xl"
  submitLabel="Save Changes"
/>
```

## Error Handling

### Field-Specific Errors

```jsx
const [errors, setErrors] = useState({
  name: 'Name is required',
  email: 'Invalid email format'
});
```

### Global Submit Error

```jsx
const [errors, setErrors] = useState({
  submit: 'Failed to save. Please try again.'
});
```

## Complete Example

```jsx
import React, { useState } from 'react';
import FormModal from '../../components/FormModal/FormModal';

const SchoolManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const fields = [
    {
      name: 'name',
      label: 'School Name',
      type: 'text',
      required: true,
      autoFocus: true
    },
    {
      name: 'type',
      label: 'School Type',
      type: 'select',
      required: true,
      options: [
        { value: 'primary', label: 'Primary School' },
        { value: 'secondary', label: 'Secondary School' }
      ]
    },
    {
      name: 'capacity',
      label: 'Student Capacity',
      type: 'number',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'School name is required';
    }
    if (!formData.type) {
      newErrors.type = 'School type is required';
    }
    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Valid capacity is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await updateSchool(formData);
      } else {
        await createSchool(formData);
      }
      setShowModal(false);
      // Reload data
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (school) => {
    setFormData(school);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      type: '',
      capacity: '',
      description: '',
      status: 'active'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  return (
    <div>
      <button onClick={handleAdd}>Add School</button>

      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setErrors({});
        }}
        title="School"
        fields={fields}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        errors={errors}
        isLoading={isLoading}
        isEditing={isEditing}
      />
    </div>
  );
};

export default SchoolManagement;
```

## Best Practices

1. **Clear errors on input change** - Clear field-specific errors when the user starts typing
2. **Validate before submit** - Always validate form data before submitting
3. **Handle loading states** - Show loading indicators during async operations
4. **Reset form on close** - Clear form data and errors when closing the modal
5. **Auto-focus first field** - Set `autoFocus: true` on the first input for better UX
6. **Provide meaningful error messages** - Use clear, actionable error messages

## Accessibility

The component includes:
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Proper semantic HTML

## Browser Support

Works in all modern browsers that support:
- ES6+
- CSS Grid
- Flexbox
- Backdrop filter

# PageHeader Component Guide

A reusable header component with consistent styling for all pages.

## Features

- 🎨 Left accent bar for visual emphasis
- 🔤 Title with optional icon
- 📝 Subtitle/description text
- ⚡ Action buttons with variants (primary, secondary, danger, success)
- 📱 Fully responsive layout
- ♿ Disabled state support

---

## Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | ✅ | - | Main page title |
| `subtitle` | string | ❌ | - | Description text below title |
| `icon` | Component | ❌ | - | Icon from react-icons/fi |
| `actions` | Array | ❌ | [] | Array of action button objects |
| `className` | string | ❌ | '' | Additional container classes |
| `accentColor` | string | ❌ | 'bg-gray-900' | Tailwind bg color for accent bar |

### Action Object Structure

```javascript
{
  label: string,           // Button text (required)
  icon: Component,         // Icon component (optional)
  onClick: function,       // Click handler (required)
  variant: string,         // 'primary'|'secondary'|'danger'|'success'
  disabled: boolean,       // Disable button (optional)
  className: string        // Additional button classes (optional)
}
```

---

## Usage Examples

### Example 1: Basic Header with Single Action

```jsx
import PageHeader from '../../components/PageHeader';
import { FiBookOpen, FiPlus } from 'react-icons/fi';

<PageHeader
  icon={FiBookOpen}
  title="School Categories"
  subtitle="Manage school categories and classifications"
  actions={[
    {
      label: 'Add Category',
      icon: FiPlus,
      onClick: () => setShowModal(true),
      variant: 'primary'
    }
  ]}
/>
```

### Example 2: Multiple Actions

```jsx
import PageHeader from '../../components/PageHeader';
import { FiUsers, FiPlus, FiDownload } from 'react-icons/fi';

<PageHeader
  icon={FiUsers}
  title="User Management"
  subtitle="Manage system users and permissions"
  actions={[
    {
      label: 'Export',
      icon: FiDownload,
      onClick: handleExport,
      variant: 'secondary'
    },
    {
      label: 'Add User',
      icon: FiPlus,
      onClick: () => setShowModal(true),
      variant: 'primary'
    }
  ]}
/>
```

### Example 3: No Subtitle, No Actions

```jsx
import PageHeader from '../../components/PageHeader';
import { FiBarChart } from 'react-icons/fi';

<PageHeader
  icon={FiBarChart}
  title="Dashboard"
/>
```

### Example 4: With Disabled Action

```jsx
import PageHeader from '../../components/PageHeader';
import { FiFileText, FiSave } from 'react-icons/fi';

<PageHeader
  icon={FiFileText}
  title="Reports"
  subtitle="Generate and download reports"
  actions={[
    {
      label: 'Generate Report',
      icon: FiSave,
      onClick: handleGenerate,
      variant: 'primary',
      disabled: isGenerating
    }
  ]}
/>
```

### Example 5: Custom Accent Color

```jsx
import PageHeader from '../../components/PageHeader';
import { FiSettings } from 'react-icons/fi';

<PageHeader
  icon={FiSettings}
  title="Settings"
  subtitle="Configure system preferences"
  accentColor="bg-blue-600"
/>
```

### Example 6: Danger Action

```jsx
import PageHeader from '../../components/PageHeader';
import { FiTrash, FiTrash2 } from 'react-icons/fi';

<PageHeader
  icon={FiTrash}
  title="Trash"
  subtitle="View deleted items"
  actions={[
    {
      label: 'Empty Trash',
      icon: FiTrash2,
      onClick: handleEmptyTrash,
      variant: 'danger'
    }
  ]}
/>
```

---

## Action Button Variants

| Variant | Colors | Use Case |
|---------|--------|----------|
| `primary` | Blue background | Main actions (Add, Create, Save) |
| `secondary` | Gray background | Secondary actions (Export, Filter) |
| `danger` | Red background | Destructive actions (Delete, Remove) |
| `success` | Green background | Positive actions (Approve, Publish) |

---

## Migration Guide

### Before (Manual Header)

```jsx
<div className="relative bg-white rounded-xl shadow-card p-4 overflow-hidden mb-6">
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-gray-900 rounded-r-full"></div>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ml-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FiBookOpen className="text-primary-600" />
        School Categories
      </h1>
      <p className="text-gray-600 mt-1">Manage school categories and classifications</p>
    </div>
    <button
      onClick={() => setShowModal(true)}
      className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
    >
      <FiPlus className="w-4 h-4" />
      Add Category
    </button>
  </div>
</div>
```

### After (PageHeader Component)

```jsx
import PageHeader from '../../components/PageHeader';

<PageHeader
  icon={FiBookOpen}
  title="School Categories"
  subtitle="Manage school categories and classifications"
  actions={[
    {
      label: 'Add Category',
      icon: FiPlus,
      onClick: () => setShowModal(true),
      variant: 'primary'
    }
  ]}
/>
```

**Lines saved**: ~15 lines per page! ✨

---

## Common Icons

From `react-icons/fi`:

- **FiBookOpen**: Categories, Items, Content
- **FiUsers**: Users, Teams, Groups
- **FiSettings**: Settings, Configuration
- **FiBarChart**: Dashboard, Analytics
- **FiFileText**: Reports, Documents
- **FiGrid**: Grid views, Modules
- **FiLayers**: Classifications, Levels
- **FiPackage**: Products, Items
- **FiShield**: Permissions, Security
- **FiTool**: Tools, Utilities

---

## Best Practices

1. **Always provide a title** - It's the only required prop
2. **Use clear, concise subtitles** - Explain the page purpose in one line
3. **Limit actions to 1-3 buttons** - Too many actions clutter the header
4. **Use appropriate variants** - Match button color to action severity
5. **Include icons in actions** - Visual cues improve UX
6. **Keep icon consistent** - Use the same icon style across your app

---

## Advanced Patterns

### Conditional Actions

```jsx
<PageHeader
  icon={FiBookOpen}
  title="Categories"
  subtitle="Manage categories"
  actions={[
    canCreate && {
      label: 'Add Category',
      icon: FiPlus,
      onClick: () => setShowModal(true),
      variant: 'primary'
    }
  ].filter(Boolean)}
/>
```

### Loading State

```jsx
<PageHeader
  icon={FiUsers}
  title="Users"
  subtitle="Manage system users"
  actions={[
    {
      label: isLoading ? 'Loading...' : 'Add User',
      icon: FiPlus,
      onClick: handleAdd,
      variant: 'primary',
      disabled: isLoading
    }
  ]}
/>
```

### Dynamic Title

```jsx
const [stats, setStats] = useState({ total: 0 });

<PageHeader
  icon={FiBookOpen}
  title={`Categories (${stats.total})`}
  subtitle="Manage school categories"
  actions={[...]}
/>
```

---

## Troubleshooting

**Issue**: Icon not displaying
- **Solution**: Ensure icon is imported from 'react-icons/fi' and passed as component reference (not JSX)

**Issue**: Action button not styled correctly
- **Solution**: Check variant prop is one of: 'primary', 'secondary', 'danger', 'success'

**Issue**: Header too narrow on mobile
- **Solution**: Component handles responsive design automatically, but check parent container width

**Issue**: Multiple buttons not aligned
- **Solution**: Actions automatically flex in a row with gap-3 spacing

**Issue**: Accent bar wrong color
- **Solution**: Use Tailwind background class: 'bg-blue-600', 'bg-green-600', etc.

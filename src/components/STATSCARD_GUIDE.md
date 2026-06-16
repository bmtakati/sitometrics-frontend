# StatsCard Component Guide

A reusable component system for displaying statistics cards with icons.

## Components

### 1. StatsCard (Individual Card)
Single stat card component for custom layouts.

### 2. StatsCards (Grid Container)
Wrapper component that renders multiple cards in a responsive grid.

---

## Props Reference

### StatsCard Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | string | ✅ | - | Label text above the value |
| `value` | number/string | ✅ | - | Stat value to display |
| `icon` | Component | ✅ | - | Icon component from react-icons/fi |
| `iconColor` | string | ✅ | - | Tailwind color (e.g., 'blue-600') |
| `className` | string | ❌ | '' | Additional container classes |

### StatsCards Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cards` | Array | ✅ | - | Array of card objects |
| `columns` | number | ❌ | 4 | Grid columns (2-6) |
| `className` | string | ❌ | '' | Additional grid classes |

**Card Object Structure:**
```javascript
{
  label: string,      // Card label
  value: number,      // Stat value
  icon: Component,    // Icon component
  iconColor: string,  // Tailwind color
  className: string   // Optional card-specific classes
}
```

---

## Usage Examples

### Example 1: Using StatsCards (Recommended)

```jsx
import { StatsCards } from '../../components/StatsCard';
import { FiTrendingUp, FiBookOpen, FiAlertCircle, FiTrash2 } from 'react-icons/fi';

function SchoolCategory() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, trashed: 0 });

  return (
    <div>
      <StatsCards
        cards={[
          {
            label: 'Total Categories',
            value: stats.total,
            icon: FiTrendingUp,
            iconColor: 'blue-600'
          },
          {
            label: 'Active Categories',
            value: stats.active,
            icon: FiBookOpen,
            iconColor: 'green-600'
          },
          {
            label: 'Inactive Categories',
            value: stats.inactive,
            icon: FiAlertCircle,
            iconColor: 'yellow-600'
          },
          {
            label: 'Trashed',
            value: stats.trashed,
            icon: FiTrash2,
            iconColor: 'red-600'
          }
        ]}
      />
    </div>
  );
}
```

### Example 2: Three Column Grid

```jsx
<StatsCards
  columns={3}
  cards={[
    { label: 'Total Users', value: 250, icon: FiUsers, iconColor: 'blue-600' },
    { label: 'Active', value: 200, icon: FiCheckCircle, iconColor: 'green-600' },
    { label: 'Pending', value: 50, icon: FiClock, iconColor: 'yellow-600' }
  ]}
/>
```

### Example 3: Individual Cards with Custom Layout

```jsx
import StatsCard from '../../components/StatsCard';
import { FiDollarSign, FiShoppingCart } from 'react-icons/fi';

function Dashboard() {
  return (
    <div className="flex gap-4">
      <StatsCard
        label="Revenue"
        value="$12,500"
        icon={FiDollarSign}
        iconColor="green-600"
        className="flex-1"
      />
      <StatsCard
        label="Orders"
        value={145}
        icon={FiShoppingCart}
        iconColor="blue-600"
        className="flex-1"
      />
    </div>
  );
}
```

### Example 4: Dynamic Stats from API

```jsx
import { StatsCards } from '../../components/StatsCard';
import { FiUsers, FiUserCheck, FiUserX, FiUserMinus } from 'react-icons/fi';

function UserList() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });

  useEffect(() => {
    // Fetch stats from API
    fetchStats().then(data => setStats(data));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.total, icon: FiUsers, iconColor: 'blue-600' },
    { label: 'Active', value: stats.active, icon: FiUserCheck, iconColor: 'green-600' },
    { label: 'Inactive', value: stats.inactive, icon: FiUserX, iconColor: 'yellow-600' },
    { label: 'Suspended', value: stats.suspended, icon: FiUserMinus, iconColor: 'red-600' }
  ];

  return (
    <div>
      <StatsCards cards={statCards} />
      {/* Rest of component */}
    </div>
  );
}
```

---

## Color Options

Common Tailwind colors for icons:

- **Blue**: `blue-600` - General/Total stats
- **Green**: `green-600` - Active/Success states
- **Yellow**: `yellow-600` - Warning/Inactive states
- **Red**: `red-600` - Error/Deleted states
- **Purple**: `purple-600` - Special categories
- **Indigo**: `indigo-600` - Primary actions
- **Orange**: `orange-600` - Pending states

---

## Common Icon Choices

From `react-icons/fi`:

- **FiTrendingUp**: Total/Growth metrics
- **FiUsers**: User counts
- **FiBookOpen**: Categories/Items
- **FiCheckCircle**: Active/Completed
- **FiAlertCircle**: Warnings/Inactive
- **FiTrash2**: Deleted/Trashed
- **FiClock**: Pending/Waiting
- **FiDollarSign**: Revenue/Money
- **FiShoppingCart**: Orders/Purchases
- **FiFileText**: Documents/Reports
- **FiBarChart**: Analytics/Stats

---

## Migration Guide

### Before (Manual Cards)

```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">Total Categories</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="w-12 h-12 flex items-center justify-center">
        <FiTrendingUp className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
      </div>
    </div>
  </div>
  {/* Repeat for each card... */}
</div>
```

### After (StatsCards Component)

```jsx
import { StatsCards } from '../../components/StatsCard';

<StatsCards
  cards={[
    { label: 'Total Categories', value: stats.total, icon: FiTrendingUp, iconColor: 'blue-600' },
    { label: 'Active', value: stats.active, icon: FiBookOpen, iconColor: 'green-600' },
    { label: 'Inactive', value: stats.inactive, icon: FiAlertCircle, iconColor: 'yellow-600' },
    { label: 'Trashed', value: stats.trashed, icon: FiTrash2, iconColor: 'red-600' }
  ]}
/>
```

**Lines saved**: ~40 lines per page! ✨

---

## Best Practices

1. **Always use StatsCards** for standard grid layouts (most common use case)
2. **Use individual StatsCard** only for custom/complex layouts
3. **Keep icon colors consistent** across similar stat types
4. **Use descriptive labels** that are clear and concise
5. **Format large numbers** with commas or abbreviations (1.2K, 1.5M)

---

## Troubleshooting

**Issue**: Icon not displaying
- **Solution**: Ensure icon is imported from 'react-icons/fi' and passed as component (not string)

**Issue**: Wrong icon color
- **Solution**: Use Tailwind color format: 'blue-600' not 'text-blue-600'

**Issue**: Grid not responsive
- **Solution**: StatsCards handles this automatically, but check parent container width

**Issue**: Stats showing 0 or undefined
- **Solution**: Ensure stats state is initialized with default values before API loads

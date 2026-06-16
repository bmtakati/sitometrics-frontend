import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiArrowUp,
  FiArrowDown,
  FiMoreVertical,
  FiActivity,
  FiTarget,
  FiAward
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Card = ({ darkMode, className = '', children, ...props }) => (
  <div
    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border ${className}`}
    {...props}
  >
    {children}
  </div>
);

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Sync dark mode from localStorage and custom events
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    
    // Listen to storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    // Listen to custom event (from same tab/window)
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    // Check on mount
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChanged', handleDarkModeChange);
    };
  }, []);

  const stats = [
    {
      id: 1,
      title: 'Total Revenue',
      value: '$45,231',
      change: '+12.5%',
      isPositive: true,
      icon: FiDollarSign,
      color: 'primary',
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      title: 'Total Users',
      value: '8,462',
      change: '+8.2%',
      isPositive: true,
      icon: FiUsers,
      color: 'success',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      title: 'Total Orders',
      value: '2,341',
      change: '-3.5%',
      isPositive: false,
      icon: FiShoppingBag,
      color: 'secondary',
      bgGradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      title: 'Growth Rate',
      value: '24.8%',
      change: '+4.3%',
      isPositive: true,
      icon: FiTrendingUp,
      color: 'warning',
      bgGradient: 'from-orange-500 to-orange-600'
    }
  ];

  const recentOrders = [
    {
      id: 1,
      customer: 'John Doe',
      product: 'Wireless Headphones',
      amount: '$129.99',
      status: 'completed',
      date: '2024-03-10'
    },
    {
      id: 2,
      customer: 'Jane Smith',
      product: 'Smart Watch Pro',
      amount: '$299.99',
      status: 'pending',
      date: '2024-03-10'
    },
    {
      id: 3,
      customer: 'Mike Johnson',
      product: 'Laptop Stand',
      amount: '$49.99',
      status: 'completed',
      date: '2024-03-09'
    },
    {
      id: 4,
      customer: 'Sarah Williams',
      product: 'Mechanical Keyboard',
      amount: '$159.99',
      status: 'shipping',
      date: '2024-03-09'
    },
    {
      id: 5,
      customer: 'Tom Brown',
      product: 'USB-C Hub',
      amount: '$39.99',
      status: 'completed',
      date: '2024-03-08'
    }
  ];

  const topProducts = [
    {
      id: 1,
      name: 'Wireless Mouse',
      sales: 234,
      revenue: '$11,700',
      trend: 'up',
      color: 'primary'
    },
    {
      id: 2,
      name: 'USB Keyboard',
      sales: 189,
      revenue: '$9,450',
      trend: 'up',
      color: 'secondary'
    },
    {
      id: 3,
      name: 'Monitor Stand',
      sales: 156,
      revenue: '$7,800',
      trend: 'down',
      color: 'success'
    },
    {
      id: 4,
      name: 'Desk Lamp',
      sales: 142,
      revenue: '$7,100',
      trend: 'up',
      color: 'warning'
    }
  ];

  const activities = [
    {
      id: 1,
      type: 'order',
      message: 'New order received from John Doe',
      time: '5 min ago',
      icon: FiShoppingBag,
      color: 'primary'
    },
    {
      id: 2,
      type: 'user',
      message: '3 new users registered',
      time: '15 min ago',
      icon: FiUsers,
      color: 'success'
    },
    {
      id: 3,
      type: 'achievement',
      message: 'Monthly goal achieved!',
      time: '1 hour ago',
      icon: FiAward,
      color: 'warning'
    },
    {
      id: 4,
      type: 'activity',
      message: 'System backup completed',
      time: '2 hours ago',
      icon: FiActivity,
      color: 'secondary'
    }
  ];

  // Chart Data
  const revenueData = [
    { month: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
    { month: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
    { month: 'Mar', revenue: 5000, expenses: 3800, profit: 1200 },
    { month: 'Apr', revenue: 4500, expenses: 3908, profit: 592 },
    { month: 'May', revenue: 6000, expenses: 4800, profit: 1200 },
    { month: 'Jun', revenue: 7000, expenses: 3800, profit: 3200 },
    { month: 'Jul', revenue: 8500, expenses: 4300, profit: 4200 }
  ];

  const userGrowthData = [
    { month: 'Jan', users: 4000 },
    { month: 'Feb', users: 5200 },
    { month: 'Mar', users: 6100 },
    { month: 'Apr', users: 7300 },
    { month: 'May', users: 8000 },
    { month: 'Jun', users: 8462 },
    { month: 'Jul', users: 9100 }
  ];

  const salesByCategory = [
    { name: 'Electronics', value: 4500, color: '#0ea5e9' },
    { name: 'Clothing', value: 3200, color: '#22c55e' },
    { name: 'Home & Garden', value: 2800, color: '#d946ef' },
    { name: 'Sports', value: 1900, color: '#f97316' }
  ];

  const performanceData = [
    { metric: 'Mon', orders: 45, revenue: 23 },
    { metric: 'Tue', orders: 52, revenue: 31 },
    { metric: 'Wed', orders: 61, revenue: 42 },
    { metric: 'Thu', orders: 58, revenue: 38 },
    { metric: 'Fri', orders: 73, revenue: 51 },
    { metric: 'Sat', orders: 89, revenue: 67 },
    { metric: 'Sun', orders: 67, revenue: 45 }
  ];


  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-success-100 text-success-700',
      pending: 'bg-warning-100 text-warning-700',
      shipping: 'bg-primary-100 text-primary-700',
      cancelled: 'bg-danger-100 text-danger-700'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card p-4 overflow-hidden border`}>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 ${darkMode ? 'bg-stone-100' : 'bg-gray-900'} rounded-r-full`}></div>
        <div className="mb-3">
          <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
            <FiActivity className="w-4 h-4" />
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-50 border-stone-300'} rounded-xl shadow-card border p-4 card-hover`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{stat.title}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.id === 1 ? 'bg-green-500' :
                stat.id === 2 ? 'bg-yellow-400' :
                stat.id === 3 ? 'bg-gray-900' :
                'bg-blue-500'
              }`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  stat.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {stat.isPositive ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Overview Chart */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Revenue Overview</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Monthly revenue, expenses, and profit</p>
            </div>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FiMoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" stroke="#f97316" fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Growth</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Total users over time</p>
            </div>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FiMoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sales by Category</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Distribution of sales across categories</p>
            </div>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FiMoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Performance */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Performance</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Orders and revenue this week</p>
            </div>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FiMoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              <Bar dataKey="revenue" fill="#d946ef" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-card border`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h2>
              <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} border-b`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Product
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Amount
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {recentOrders.map((order) => (
                  <tr key={order.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-medium">
                          {order.customer[0]}
                        </div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {order.product}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {order.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`w-5 h-5 text-${activity.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activity.message}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top Products</h2>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}>
              <FiMoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topProducts.map((product) => (
              <div
                key={product.id}
                className={`p-4 rounded-lg border-2 ${darkMode ? 'border-gray-700 hover:border-primary-500' : 'border-gray-100 hover:border-primary-200'} transition-colors card-hover`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${product.color}-100 flex items-center justify-center`}>
                    <FiTarget className={`w-5 h-5 text-${product.color}-600`} />
                  </div>
                  {product.trend === 'up' ? (
                    <FiArrowUp className="w-5 h-5 text-success-600" />
                  ) : (
                    <FiArrowDown className="w-5 h-5 text-danger-600" />
                  )}
                </div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{product.name}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>{product.sales} sales</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome Card - Matching starter kit style */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'} rounded-xl shadow-card border`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Kick start your project development!</h2>
        </div>
        <div className="p-6">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
            Getting started with your project custom requirements using a ready template which is quite difficult and time taking process, 
            Mofi Admin provides useful features to kick start your project development with no efforts!
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-sm">✓</span>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mofi Admin provides you getting start pages with different layouts, use the layout as per your custom requirements 
                and just change the branding, menu & content.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-success-600 text-sm">✓</span>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Every components in Mofi Admin are decoupled, it means use only components you actually need! 
                Remove unnecessary and extra code easily just by excluding the path to specific SCSS, JS file.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-secondary-600 text-sm">✓</span>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Built with modern React and Tailwind CSS for maximum performance and beautiful design. 
                Fully responsive and optimized for all devices.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

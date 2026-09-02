import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiDollarSign, FiTruck, FiEye } from 'react-icons/fi';
import useDarkMode from '../../hooks/useDarkMode';

const ReportsList = () => {
  const darkMode = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');

  const reports = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Closed order sales by outlet and date range with payment breakdown and top items',
      icon: FiDollarSign,
      color: 'from-emerald-500 to-green-600',
      category: 'Finance',
      lastUpdated: new Date().toISOString().slice(0, 10),
      path: '/reports/sales',
    },
    {
      id: 'suppliers',
      name: 'Suppliers Report',
      description: 'Supplier directory with agreed items and local purchase order activity by date range',
      icon: FiTruck,
      color: 'from-blue-500 to-indigo-600',
      category: 'Procurement',
      lastUpdated: new Date().toISOString().slice(0, 10),
      path: '/reports/suppliers',
    },
  ];

  const filteredReports = reports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reports</h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>View and export system reports</p>
      </div>

      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-md border p-6`}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="search" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Search Reports
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by report name, description, or category..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiFileText className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>No reports found</p>
            <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-1`}>Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Link
              key={report.id}
              to={report.path}
              className={`group ${darkMode ? 'bg-gray-900 border-gray-700 hover:border-blue-500' : 'bg-stone-100 border-stone-300 hover:border-blue-300'} rounded-xl shadow-md border hover:shadow-xl transition-all duration-300 overflow-hidden`}
            >
              <div className={`bg-gradient-to-r ${report.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <report.icon className="w-10 h-10" />
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {report.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-blue-600 transition-colors`}>
                  {report.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
                  {report.description}
                </p>

                <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Updated: {new Date(report.lastUpdated).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 font-medium text-sm">
                    <span>View Report</span>
                    <FiEye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'} rounded-xl border p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {new Set(reports.map((r) => r.category)).size}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{filteredReports.length}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Matching Search</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsList;

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiFilter, FiCalendar, FiFileText } from 'react-icons/fi';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import useDarkMode from '../../hooks/useDarkMode';

const ReportView = () => {
  const darkMode = useDarkMode();
  const { reportId } = useParams();
  const [exportFormat, setExportFormat] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isExporting, setIsExporting] = useState(false);

  // Sample report data - this would come from your API
  const reportData = {
    1: {
      name: 'School Assessment Summary Report',
      description: 'Comprehensive overview of all school assessments and their outcomes',
      data: [
        { id: 1, school: 'Mwanza Primary School', type: 'WSV', status: 'Completed', date: '2024-03-10', score: 85 },
        { id: 2, school: 'Dodoma Secondary School', type: 'FSV', status: 'In Progress', date: '2024-03-12', score: 78 },
        { id: 3, school: 'Dar es Salaam High School', type: 'SSE', status: 'Completed', date: '2024-03-08', score: 92 },
        { id: 4, school: 'Arusha Community School', type: 'WSV', status: 'Pending', date: '2024-03-14', score: 0 },
        { id: 5, school: 'Kilimanjaro Academy', type: 'FSV', status: 'Completed', date: '2024-03-09', score: 88 },
      ]
    },
    2: {
      name: 'SSE Performance Report',
      description: 'School Self Evaluation performance metrics and trends',
      data: [
        { id: 1, school: 'Zanzibar School', category: 'Academic', score: 90, grade: 'A', year: 2024 },
        { id: 2, school: 'Morogoro Institute', category: 'Infrastructure', score: 75, grade: 'B', year: 2024 },
        { id: 3, school: 'Tanga Primary', category: 'Teaching', score: 82, grade: 'A-', year: 2024 },
      ]
    },
    // Add more report data as needed
  };

  const currentReport = reportData[reportId] || {
    name: 'Report Not Found',
    description: 'The requested report could not be found',
    data: []
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      const headers = getTableHeaders();
      const success = format === 'pdf' 
        ? await exportToPDF(currentReport.name, currentReport.data, headers)
        : await exportToExcel(currentReport.name, currentReport.data);

      if (success) {
        // Show success message (you can use a toast notification library)
      } else {
        alert(`Failed to export to ${format.toUpperCase()}`);
      }
    } catch (error) {
      alert(`Error exporting to ${format.toUpperCase()}: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  const getTableHeaders = () => {
    if (!Array.isArray(currentReport.data) || currentReport.data.length === 0) return [];
    const firstRow = currentReport.data[0];
    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) return [];
    return Object.keys(firstRow).filter(key => key !== 'id');
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/reports"
            className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <FiArrowLeft className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </Link>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentReport.name}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{currentReport.description}</p>
          </div>
        </div>
      </div>

      {/* Export and Filters Card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-md border p-6`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              <FiCalendar className="inline w-4 h-4 mr-2" />
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} self-center`}>to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex items-end">
            <button className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <FiFilter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>

          {/* Export Buttons */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              <FiDownload className="inline w-4 h-4 mr-2" />
              Export Data
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isExporting && exportFormat === 'pdf'
                    ? 'bg-red-400 text-white cursor-wait'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isExporting && exportFormat === 'pdf' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FiFileText className="w-4 h-4" />
                    PDF
                  </>
                )}
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isExporting && exportFormat === 'excel'
                    ? 'bg-green-400 text-white cursor-wait'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isExporting && exportFormat === 'excel' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4" />
                    Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-md border`}>
        <div className="p-6">
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Report Data</h2>
          
          {currentReport.data.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>No data available</p>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-1`}>This report currently has no data to display</p>
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'} border-b`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      #
                    </th>
                    {getTableHeaders().map((header, index) => (
                      <th
                        key={index}
                        className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider whitespace-nowrap`}
                      >
                        {header.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                  {currentReport.data.map((row, rowIndex) => (
                    <tr key={row.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>
                        {rowIndex + 1}
                      </td>
                      {getTableHeaders().map((header, colIndex) => (
                        <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {header === 'status' ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                row[header] === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : row[header] === 'In Progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {row[header]}
                            </span>
                          ) : header === 'score' ? (
                            <span
                              className={`font-semibold ${
                                row[header] >= 85
                                  ? 'text-green-600'
                                  : row[header] >= 70
                                  ? 'text-yellow-600'
                                  : row[header] > 0
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {row[header] > 0 ? `${row[header]}%` : 'N/A'}
                            </span>
                          ) : (
                            row[header]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Stats */}
          {currentReport.data.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Total Records</div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {currentReport.data.length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 font-medium">Average Score</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {currentReport.data.some(item => 'score' in item)
                    ? Math.round(
                        currentReport.data.reduce((sum, item) => sum + (item.score || 0), 0) /
                          currentReport.data.length
                      ) + '%'
                    : 'N/A'}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">Report ID</div>
                <div className="text-2xl font-bold text-purple-700 mt-1">#{reportId}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;

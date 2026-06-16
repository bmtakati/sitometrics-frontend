import React from 'react';
import { FiMail, FiBell, FiCalendar } from 'react-icons/fi';
import useDarkMode from '../../hooks/useDarkMode';

const Announcements = () => {
  const darkMode = useDarkMode();
  const announcements = [
    {
      id: 1,
      title: 'New Feature Release: Advanced Reporting',
      content: 'We are excited to announce the release of our advanced reporting feature. This new capability allows you to generate comprehensive reports with custom filters and export options.',
      author: 'System Administrator',
      date: '2026-03-15',
      category: 'Product Update'
    },
    {
      id: 2,
      title: 'Upcoming Training Session',
      content: 'Join us for a comprehensive training session on March 25, 2026. Learn about the latest features and best practices for using the SQAS platform.',
      author: 'Training Team',
      date: '2026-03-14',
      category: 'Training'
    },
    {
      id: 3,
      title: 'System Maintenance Notice',
      content: 'Scheduled system maintenance will take place on March 20, 2026, from 2:00 AM to 4:00 AM. The system will be unavailable during this period.',
      author: 'IT Department',
      date: '2026-03-13',
      category: 'Maintenance'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiMail className="w-6 h-6 text-white" />
          </div>
          Announcements
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Important announcements and updates</p>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{announcement.title}</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {announcement.category}
              </span>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{announcement.content}</p>
            <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-1">
                <FiBell className="w-4 h-4" />
                {announcement.author}
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                {new Date(announcement.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;

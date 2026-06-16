import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiCamera, FiLock, FiBriefcase, FiAward } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import apiFetch from '../utils/apiFetch';
import { showErrorDialog, showSuccessToast } from '../utils/dialogUtils';

const Profile = () => {
  const location = useLocation();
  const { user: authUser, setAuthUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const passwordPromptOpened = useRef(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const handleDarkModeChange = (event) => {
      setDarkMode(event.detail.darkMode);
    };
    window.addEventListener('darkModeChanged', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChanged', handleDarkModeChange);
  }, []);
  const [profileData, setProfileData] = useState({
    name: authUser?.full_name || 'Admin User',
    email: authUser?.email || 'user@example.com',
    phone: '+1 234 567 8900',
    location: 'Nairobi, Kenya',
    department: 'Quality Assurance',
    position: 'System Administrator',
    joinDate: 'January 2024',
    bio: 'Experienced system administrator with expertise in quality assurance systems and educational technology.',
    avatar: 'https://i.pravatar.cc/150?img=68'
  });

  const [editData, setEditData] = useState({ ...profileData });

  useEffect(() => {
    if (!authUser) {
      return;
    }

    setProfileData((current) => ({
      ...current,
      name: authUser.full_name || current.name,
      email: authUser.email || current.email,
    }));
    setEditData((current) => ({
      ...current,
      name: authUser.full_name || current.name,
      email: authUser.email || current.email,
    }));
  }, [authUser]);

  const handleEdit = () => {
    setEditData({ ...profileData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfileData({ ...editData });
    setIsEditing(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Profile updated successfully',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleAvatarChange = () => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Avatar upload feature coming soon',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const handlePasswordChange = () => {
    Swal.fire({
      title: 'Change Password',
      html: `
        <input type="password" id="current-password" class="swal2-input" placeholder="Current Password">
        <input type="password" id="new-password" class="swal2-input" placeholder="New Password">
        <input type="password" id="confirm-password" class="swal2-input" placeholder="Confirm New Password">
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Password',
      confirmButtonColor: '#0ea5e9',
      preConfirm: async () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }
        
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('New passwords do not match');
          return false;
        }
        
        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }

        const response = await apiFetch(`${API_BASE_URL}/api/password/change`, {
          method: 'POST',
          body: JSON.stringify({
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmPassword,
          }),
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.success) {
          const validationMessage = json.errors?.current_password?.[0]
            || json.errors?.password?.[0]
            || json.message
            || 'Failed to update password.';
          Swal.showValidationMessage(validationMessage);
          return false;
        }

        return json.data;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const token = localStorage.getItem('auth_token');
        const nextUser = authUser ? { ...authUser, ...result.value } : authUser;

        if (nextUser) {
          setAuthUser(nextUser, token);
        }

        showSuccessToast('Password updated successfully');
      }
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const forcePasswordChange = params.get('forcePasswordChange') === '1';

    if (authUser?.password_change_required && forcePasswordChange && !passwordPromptOpened.current) {
      passwordPromptOpened.current = true;
      handlePasswordChange();
    }
  }, [authUser, location.search]);

  const stats = [
    { label: 'Active Projects', value: '12', icon: FiBriefcase, color: 'bg-primary-100 text-primary-600' },
    { label: 'Completed Tasks', value: '248', icon: FiAward, color: 'bg-success-100 text-success-600' },
    { label: 'Team Members', value: '34', icon: FiUser, color: 'bg-warning-100 text-warning-600' },
    { label: 'Years Experience', value: '5+', icon: FiCalendar, color: 'bg-secondary-100 text-secondary-600' }
  ];

  const activities = [
    { action: 'Updated user permissions', time: '2 hours ago', icon: FiUser },
    { action: 'Generated monthly report', time: '5 hours ago', icon: FiBriefcase },
    { action: 'Added new role: Content Manager', time: '1 day ago', icon: FiAward },
    { action: 'Modified system settings', time: '2 days ago', icon: FiEdit2 },
    { action: 'Completed security audit', time: '3 days ago', icon: FiLock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage your account information and settings</p>
        </div>
      </div>

      {authUser?.password_change_required && (
        <div className={`${darkMode ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'} rounded-xl border p-4 flex items-start gap-3`}>
          <FiLock className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">Password change required</p>
            <p className="text-sm mt-1">
              Your password has reached the configured age limit. Update it now to stay aligned with the password policy.
            </p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-2xl shadow-sm border overflow-hidden`}>
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        
        {/* Profile Content */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className={`w-32 h-32 rounded-2xl border-4 ${darkMode ? 'border-gray-900' : 'border-white'} shadow-lg object-cover`}
              />
              <button
                onClick={handleAvatarChange}
                className={`absolute bottom-2 right-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-2 rounded-full shadow-lg transition-colors`}
              >
                <FiCamera className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 mt-16 sm:mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData.name}</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{profileData.position}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{profileData.department}</p>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button
                        onClick={handlePasswordChange}
                        className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors flex items-center gap-2`}
                      >
                        <FiLock className="w-4 h-4" />
                        Change Password
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className={`px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                rows="3"
                placeholder="Write a short bio..."
              />
            ) : (
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profileData.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Personal Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiMail className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className={`mt-1 w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                ) : (
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-5 h-5 text-success-600" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className={`mt-1 w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                ) : (
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiMapPin className="w-5 h-5 text-warning-600" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className={`mt-1 w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                ) : (
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData.location}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profileData.joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className={`flex items-start gap-3 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} last:border-0 last:pb-0`}>
                <div className={`w-8 h-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{activity.action}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

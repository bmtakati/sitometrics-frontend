import React from 'react';
import { FiLock } from 'react-icons/fi';

const AccessDeniedState = ({ message = 'You do not have permission to view this page.' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <FiLock className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};

export default AccessDeniedState;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPageTest = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-12 max-w-lg text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SQAS Landing Page
        </h1>
        <p className="text-gray-600 mb-8">
          School Quality Assurance System
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default LandingPageTest;

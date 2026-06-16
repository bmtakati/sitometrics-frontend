import React from 'react';
import { FiLoader } from 'react-icons/fi';

/** Shared fallback for lazy FAQ route chunks */
const FaqRouteFallback = () => (
  <div className="p-6 flex items-center justify-center min-h-[40vh] max-w-7xl mx-auto">
    <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

export default FaqRouteFallback;

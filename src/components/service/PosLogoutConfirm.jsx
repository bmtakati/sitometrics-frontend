import React from 'react';
import { FiLogOut } from 'react-icons/fi';

const PosLogoutConfirm = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cancel logout"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <FiLogOut className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-stone-900 dark:text-stone-50">Sign out?</h2>
        <p className="mt-2 text-center text-lg text-stone-500 dark:text-stone-400">
          Are you sure you want to leave the system?
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-16 rounded-2xl border border-stone-300 px-4 text-lg font-semibold text-stone-700 dark:border-stone-600 dark:text-stone-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-16 rounded-2xl bg-red-600 px-4 text-lg font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosLogoutConfirm;

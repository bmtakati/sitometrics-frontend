import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiAlertCircle, FiClock } from 'react-icons/fi';

const InactivityTimeout = () => {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const INACTIVITY_TIME = (import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES || 15) * 60 * 1000; // Convert minutes to milliseconds
  const COUNTDOWN_TIME = 30; // 30 seconds countdown before auto-logout
  
  const inactivityTimer = useRef(null);
  const countdownTimer = useRef(null);

  const handleLogout = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    logout();
    navigate('/landing', { replace: true });
  }, [logout, navigate]);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_TIME);
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }

    // Close modal if it's showing
    setShowModal((current) => {
      if (current) {
        setCountdown(COUNTDOWN_TIME);
        return false;
      }
      return current;
    });

    // Start new inactivity timer
    inactivityTimer.current = setTimeout(() => {
      setShowModal(true);
      startCountdown();
    }, INACTIVITY_TIME);
  }, [startCountdown]);

  const handleStay = useCallback(() => {
    setShowModal(false);
    setCountdown(COUNTDOWN_TIME);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [resetTimer]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center">
              <FiClock className="w-8 h-8 text-warning-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Are you still there?
          </h2>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-3">
              You've been inactive for a while. For your security, you'll be logged out in:
            </p>
            <div className="inline-flex items-center gap-2 bg-warning-50 border border-warning-200 rounded-lg px-4 py-2">
              <FiAlertCircle className="w-5 h-5 text-info-600" />
              <span className="text-3xl font-bold text-info-600">{countdown}</span>
              <span className="text-sm text-info-600">seconds</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
            >
              Logout
            </button>
            <button
              onClick={handleStay}
              className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 shadow-lg"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityTimeout;

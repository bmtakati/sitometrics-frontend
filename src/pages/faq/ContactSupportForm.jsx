import React, { useEffect, useState } from 'react';
import { FiMail, FiSend, FiUser, FiCheckCircle } from 'react-icons/fi';
import useDarkMode from '../../hooks/useDarkMode';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CATEGORIES = [
  'Technical Issue',
  'Account Problem',
  'Feature Request',
  'Data Query',
  'General Inquiry',
  'Other',
];

/**
 * Public contact form (POST /api/faq/contact).
 * @param {boolean} requireCaptcha - Landing modal uses CAPTCHA; FAQ page does not.
 */
const ContactSupportForm = ({ requireCaptcha = false }) => {
  const darkMode = useDarkMode();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [captcha, setCaptcha] = useState({
    question: '',
    answer: '',
    response: '',
  });
  const [captchaError, setCaptchaError] = useState('');

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 90 + 10);
    const b = Math.floor(Math.random() * 90 + 10);
    setCaptcha({
      question: `${a} + ${b}`,
      answer: String(a + b),
      response: '',
    });
    setCaptchaError('');
  };

  useEffect(() => {
    if (!requireCaptcha) return;
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireCaptcha]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const messageHtml = String(formData.message || '');
    const messageText = messageHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!messageText) {
      setError('Message is required');
      return;
    }

    if (requireCaptcha) {
      const expected = captcha.answer;
      const got = (captcha.response || '').trim();
      if (!got || got !== expected) {
        setCaptchaError('Please complete CAPTCHA correctly.');
        generateCaptcha();
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/faq/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to submit message');
      }

      setSubmitted(true);

      if (requireCaptcha) generateCaptcha();
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
        });
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Failed to submit message');
      if (requireCaptcha) generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6`}>
      {submitted ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Message Sent Successfully!</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Thank you for contacting us. We will get back to you within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Send us a message</h3>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {captchaError && <p className="text-red-600 text-sm mb-4">{captchaError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Your Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="Brief subject line"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Message <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={formData.message}
              darkMode={darkMode}
              minHeight={130}
              maxHeight={130}
              onChange={(html) => {
                setFormData((prev) => ({
                  ...prev,
                  message: html,
                }));
              }}
            />
          </div>

          {requireCaptcha && (
            <div className="mb-6">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                CAPTCHA <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>What is {captcha.question} ?</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={captcha.response}
                    onChange={(e) => {
                      setCaptchaError('');
                      setCaptcha((p) => ({ ...p, response: e.target.value }));
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Enter answer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const a = Math.floor(Math.random() * 90 + 10);
                    const b = Math.floor(Math.random() * 90 + 10);
                    setCaptcha({
                      question: `${a} + ${b}`,
                      answer: String(a + b),
                      response: '',
                    });
                    setCaptchaError('');
                  }}
                  className={`px-4 py-2 rounded-lg border whitespace-nowrap ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'}`}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            disabled={loading}
          >
            <FiSend className="w-5 h-5" />
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactSupportForm;

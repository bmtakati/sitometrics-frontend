import React, { useEffect, useState } from 'react';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import useDarkMode from '../../hooks/useDarkMode';
import FaqRouteFallback from './FaqRouteFallback';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/** Guest view: public contact info (GET /api/faq/contact-info). */
const ContactSupportPublic = () => {
  const darkMode = useDarkMode();
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    address: '',
    support_hours: '',
  });
  const [contactInfoLoading, setContactInfoLoading] = useState(true);
  const [contactInfoError, setContactInfoError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setContactInfoLoading(true);
        setContactInfoError('');
        const res = await fetch(`${API_BASE_URL}/api/faq/contact-info`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load contact info');
        const data = payload?.data || {};
        setContactInfo({
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          support_hours: data.support_hours ?? '',
        });
      } catch (e) {
        if (e?.name !== 'AbortError') setContactInfoError(e?.message || 'Failed to load contact info');
      } finally {
        setContactInfoLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    contactInfoLoading ? <FaqRouteFallback /> : (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={FiMail}
        title="Contact Support"
        subtitle="Get in touch — we are here to help"
        accentColor="bg-green-600"
        className="mb-0"
      />
      <div className="max-w-2xl">
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Contact Information</h3>
          {contactInfoError && <p className="text-red-600 text-sm mb-4">{contactInfoError}</p>}
          {contactInfoLoading ? (
            <div className="space-y-3">
              <div className={`h-10 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded`} />
              <div className={`h-10 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded`} />
              <div className={`h-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded`} />
            </div>
          ) : (
            <div className={`space-y-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex gap-3">
                <FiMail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>Email</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contactInfo.email || '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiPhone className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>Phone</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contactInfo.phone || '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiMapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>Address</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>{contactInfo.address || '—'}</p>
                </div>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide mb-1`}>Support hours</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>{contactInfo.support_hours || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    )
  );
};

export default ContactSupportPublic;

import React from 'react';
import ContactSupportForm from './ContactSupportForm';
import ContactSupportPublic from './ContactSupportPublic';
import FaqContactSupportAdmin from '../setup/FaqContactSupportAdmin';
import { useFaqRouteAuth } from '../../hooks/useFaqRouteAuth';
import FaqRouteFallback from './FaqRouteFallback';

/**
 * /faq/support — guests: public contact info only.
 * Logged in: full admin (same as Setup → FAQ Contact Support).
 * Landing modal: contact form with CAPTCHA only.
 */
const ContactSupport = ({ variant = 'page' }) => {
  const { isAuthenticated, showAuthSpinner } = useFaqRouteAuth();

  if (variant === 'modal') {
    return <ContactSupportForm requireCaptcha />;
  }

  if (showAuthSpinner) {
    return <FaqRouteFallback />;
  }

  return isAuthenticated ? <FaqContactSupportAdmin /> : <ContactSupportPublic />;
};

export default ContactSupport;

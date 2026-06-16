import React, { lazy, Suspense } from 'react';
import { useFaqRouteAuth } from '../../hooks/useFaqRouteAuth';
import FaqRouteFallback from './FaqRouteFallback';

const TroubleshootingPublic = lazy(() => import('./TroubleshootingPublic'));
const FaqTroubleshootingAdmin = lazy(() => import('../setup/FaqTroubleshootingAdmin'));

/**
 * /faq/troubleshooting — public browse for guests; full CRUD (same as Setup → FAQ Troubleshooting) when logged in.
 */
const Troubleshooting = () => {
  const { isAuthenticated, showAuthSpinner } = useFaqRouteAuth();

  if (showAuthSpinner) {
    return <FaqRouteFallback />;
  }

  return (
    <Suspense fallback={<FaqRouteFallback />}>
      {isAuthenticated ? <FaqTroubleshootingAdmin /> : <TroubleshootingPublic />}
    </Suspense>
  );
};

export default Troubleshooting;

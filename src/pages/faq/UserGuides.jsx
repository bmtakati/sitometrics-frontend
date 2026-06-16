import React, { lazy, Suspense } from 'react';
import { useFaqRouteAuth } from '../../hooks/useFaqRouteAuth';
import FaqRouteFallback from './FaqRouteFallback';

const UserGuidesPublic = lazy(() => import('./UserGuidesPublic'));
const FaqUserGuidesAdmin = lazy(() => import('../setup/FaqUserGuidesAdmin'));

/**
 * /faq/guides — public browse for guests; full CRUD (same as Setup → FAQ User Guides) when logged in.
 */
const UserGuides = () => {
  const { isAuthenticated, showAuthSpinner } = useFaqRouteAuth();

  if (showAuthSpinner) {
    return <FaqRouteFallback />;
  }

  return (
    <Suspense fallback={<FaqRouteFallback />}>
      {isAuthenticated ? <FaqUserGuidesAdmin /> : <UserGuidesPublic />}
    </Suspense>
  );
};

export default UserGuides;

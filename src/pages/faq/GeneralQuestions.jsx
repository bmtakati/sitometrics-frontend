import React, { lazy, Suspense } from 'react';
import { useFaqRouteAuth } from '../../hooks/useFaqRouteAuth';
import FaqRouteFallback from './FaqRouteFallback';

const GeneralQuestionsPublic = lazy(() => import('./GeneralQuestionsPublic'));
const FaqGeneralQuestionsAdmin = lazy(() => import('../setup/FaqGeneralQuestionsAdmin'));

/**
 * /faq/general — public FAQ for guests; full CRUD (same as Setup → FAQ General Questions) when logged in.
 */
const GeneralQuestions = () => {
  const { isAuthenticated, showAuthSpinner } = useFaqRouteAuth();

  if (showAuthSpinner) {
    return <FaqRouteFallback />;
  }

  return (
    <Suspense fallback={<FaqRouteFallback />}>
      {isAuthenticated ? <FaqGeneralQuestionsAdmin /> : <GeneralQuestionsPublic />}
    </Suspense>
  );
};

export default GeneralQuestions;

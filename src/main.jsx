import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { applyFontSizePreference, getInitialFontSizePreference } from './utils/fontSize';
import { applyThemePreference, getInitialThemePreference } from './utils/theme';
import './index.css';

applyFontSizePreference(getInitialFontSizePreference());
applyThemePreference(getInitialThemePreference());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

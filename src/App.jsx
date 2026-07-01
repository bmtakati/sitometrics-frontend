import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasPermission } from './utils/permissions';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import LandingPageTest from './pages/LandingPageTest';
import ResetPassword from './pages/ResetPassword';
import Permissions from './pages/Permissions';
import PasswordPolicy from './pages/PasswordPolicy';
import PasswordHistory from './pages/PasswordHistory';
import Roles from './pages/Roles';
import UserList from './pages/UserList';
import RoleHandover from './pages/RoleHandover';
import Profile from './pages/Profile';

// Logs Pages
import AuditTrail from './pages/logs/AuditTrail';
import Errors from './pages/logs/Errors';
import FailedLogins from './pages/logs/FailedLogins';

// Reports Pages
import ReportsList from './pages/reports/ReportsList';
import ReportView from './pages/reports/ReportView';

// Notifications Pages
import AllNotifications from './pages/notifications/AllNotifications';
import Unread from './pages/notifications/Unread';
import SystemAlerts from './pages/notifications/SystemAlerts';
import Announcements from './pages/notifications/Announcements';

// FAQ Pages (code-split: not loaded until first visit; ContactSupport stays eager — LandingPage uses it for modal)
const GeneralQuestions = lazy(() => import('./pages/faq/GeneralQuestions'));
const GuideTypes = lazy(() => import('./pages/faq/GuideTypes'));
const UserGuides = lazy(() => import('./pages/faq/UserGuides'));
const QuestionCategories = lazy(() => import('./pages/faq/QuestionCategories'));
const Troubleshooting = lazy(() => import('./pages/faq/Troubleshooting'));
import ContactSupport from './pages/faq/ContactSupport';

// Setup Pages
import Module from './pages/setup/Module';
import Statuses from './pages/setup/Statuses';
import StatusGroups from './pages/setup/StatusGroups';
import StatusMapping from './pages/setup/StatusMapping';
const FaqGeneralQuestionsAdmin = lazy(() => import('./pages/setup/FaqGeneralQuestionsAdmin'));
const FaqUserGuidesAdmin = lazy(() => import('./pages/setup/FaqUserGuidesAdmin'));
const FaqTroubleshootingAdmin = lazy(() => import('./pages/setup/FaqTroubleshootingAdmin'));
import FaqContactSupportAdmin from './pages/setup/FaqContactSupportAdmin';
import ItemCategory from './pages/setup/ItemCategory';
import FoodCategory from './pages/setup/FoodCategory';
import BeverageCategory from './pages/setup/BeverageCategory';
import Item from './pages/setup/Item';
import Unit from './pages/setup/Unit';
import Currency from './pages/setup/Currency';
import ExchangeRate from './pages/setup/ExchangeRate';
import Locale from './pages/setup/Locale';
import SlideshowSlides from './pages/setup/SlideshowSlides';
import Hotel from './pages/setup/Hotel';
import Outlet from './pages/setup/Outlet';
import Supplier from './pages/procurement/Supplier';
import Store from './pages/setup/Store';
import PurchaseRequisition from './pages/procurement/PurchaseRequisition';
import LocalPurchaseOrder from './pages/procurement/LocalPurchaseOrder';
import GoodsReceivedNote from './pages/procurement/GoodsReceivedNote';
import StoreRequest from './pages/procurement/StoreRequest';
import StoreIssue from './pages/procurement/StoreIssue';
import StockAdjustment from './pages/procurement/StockAdjustment';
import StockCountSession from './pages/procurement/StockCountSession';
import Menu from './pages/procurement/Menu';
import MenuRecipe from './pages/procurement/MenuRecipe';
import ConsumptionPosting from './pages/procurement/ConsumptionPosting';
import BarTransaction from './pages/procurement/BarTransaction';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
  }
  
  return isAuthenticated ? children : <Navigate to="/landing" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const can = (perm) => hasPermission(user, perm);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/landing-test" element={<LandingPageTest />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/permissions" element={can('view-permissions') ? <Permissions /> : <Navigate to="/" replace />} />
        <Route path="users/password-policy" element={can('view-password-policy') ? <PasswordPolicy /> : <Navigate to="/" replace />} />
        <Route path="users/password-history" element={can('view-password-history') ? <PasswordHistory /> : <Navigate to="/" replace />} />
        <Route path="users/roles" element={can('view-roles') ? <Roles /> : <Navigate to="/" replace />} />
        <Route path="users/list" element={can('view-users') ? <UserList /> : <Navigate to="/" replace />} />
        <Route path="users/role-handover" element={can('view-role-handovers') ? <RoleHandover /> : <Navigate to="/" replace />} />
        
        {/* Logs Routes */}
        <Route path="logs/audit-trail" element={<AuditTrail />} />
        <Route path="logs/errors" element={<Errors />} />
        <Route path="logs/failed-logins" element={<FailedLogins />} />
        
        {/* Reports Routes */}
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/view/:reportId" element={<ReportView />} />
        
        {/* Notifications Routes */}
        <Route path="notifications/all" element={<AllNotifications />} />
        <Route path="notifications/unread" element={<Unread />} />
        <Route path="notifications/system-alerts" element={<SystemAlerts />} />
        <Route path="notifications/announcements" element={<Announcements />} />
        
        {/* FAQ Routes */}
        <Route path="faq/general" element={<GeneralQuestions />} />
        <Route path="faq/guide-types" element={<GuideTypes />} />
        <Route path="faq/guides" element={<UserGuides />} />
        <Route path="faq/question-categories" element={<QuestionCategories />} />
        <Route path="faq/troubleshooting" element={<Troubleshooting />} />
        <Route path="faq/support" element={<ContactSupport />} />
        
        {/* Setup Routes */}
        <Route path="setup/modules" element={<Module />} />
        <Route path="setup/statuses" element={<Statuses />} />
        <Route path="setup/status-groups" element={<StatusGroups />} />
        <Route path="setup/status-mapping" element={<StatusMapping />} />
        <Route path="setup/faq-general" element={<FaqGeneralQuestionsAdmin />} />
        <Route path="setup/faq-guides" element={<FaqUserGuidesAdmin />} />
        <Route path="setup/faq-troubleshooting" element={<FaqTroubleshootingAdmin />} />
        <Route path="setup/faq-contact" element={<FaqContactSupportAdmin />} />
        <Route path="setup/item-category" element={<ItemCategory />} />
        <Route path="setup/food-categories" element={<FoodCategory />} />
        <Route path="setup/beverage-categories" element={<BeverageCategory />} />
        <Route path="setup/item" element={<Item />} />
        <Route path="setup/unit" element={<Unit />} />
        <Route path="setup/currencies" element={<Currency />} />
        <Route path="setup/exchange-rates" element={<ExchangeRate />} />
        <Route path="setup/locales" element={<Locale />} />
        <Route path="setup/slideshow-slides" element={<SlideshowSlides />} />
        <Route path="setup/hotels" element={<Hotel />} />
        <Route path="setup/outlets" element={<Outlet />} />
        <Route path="procurement/suppliers" element={<Supplier />} />
        <Route path="setup/store" element={<Store />} />
        <Route path="procurement/purchase-requisitions" element={<PurchaseRequisition />} />
        <Route path="procurement/local-purchase-orders" element={<LocalPurchaseOrder />} />
        <Route path="procurement/goods-received-notes" element={<GoodsReceivedNote />} />
        <Route path="procurement/store-requests" element={<StoreRequest />} />
        <Route path="procurement/store-issues" element={<StoreIssue />} />
        <Route path="procurement/stock-adjustments" element={<StockAdjustment />} />
        <Route path="procurement/stock-count-sessions" element={<StockCountSession />} />
        <Route path="procurement/menus" element={<Menu />} />
        <Route path="procurement/menu-recipes" element={<MenuRecipe />} />
        <Route path="procurement/consumptions" element={<ConsumptionPosting />} />
        <Route path="procurement/bar-transactions" element={<BarTransaction />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

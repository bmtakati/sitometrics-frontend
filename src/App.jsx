import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasPermission } from './utils/permissions';
import Layout from './components/Layout/Layout';

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LandingPageTest = lazy(() => import('./pages/LandingPageTest'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Permissions = lazy(() => import('./pages/Permissions'));
const PasswordPolicy = lazy(() => import('./pages/PasswordPolicy'));
const PasswordHistory = lazy(() => import('./pages/PasswordHistory'));
const Roles = lazy(() => import('./pages/Roles'));
const UserList = lazy(() => import('./pages/UserList'));
const RoleHandover = lazy(() => import('./pages/RoleHandover'));
const Profile = lazy(() => import('./pages/Profile'));

// Logs Pages
const AuditTrail = lazy(() => import('./pages/logs/AuditTrail'));
const Errors = lazy(() => import('./pages/logs/Errors'));
const FailedLogins = lazy(() => import('./pages/logs/FailedLogins'));

// Reports Pages
const ReportsList = lazy(() => import('./pages/reports/ReportsList'));
const SalesReport = lazy(() => import('./pages/reports/SalesReport'));
const SuppliersReport = lazy(() => import('./pages/reports/SuppliersReport'));

// Notifications Pages
const AllNotifications = lazy(() => import('./pages/notifications/AllNotifications'));
const Unread = lazy(() => import('./pages/notifications/Unread'));
const SystemAlerts = lazy(() => import('./pages/notifications/SystemAlerts'));
const Announcements = lazy(() => import('./pages/notifications/Announcements'));

// FAQ Pages
const GeneralQuestions = lazy(() => import('./pages/faq/GeneralQuestions'));
const GuideTypes = lazy(() => import('./pages/faq/GuideTypes'));
const UserGuides = lazy(() => import('./pages/faq/UserGuides'));
const QuestionCategories = lazy(() => import('./pages/faq/QuestionCategories'));
const Troubleshooting = lazy(() => import('./pages/faq/Troubleshooting'));
const ContactSupport = lazy(() => import('./pages/faq/ContactSupport'));

// Setup Pages
const Module = lazy(() => import('./pages/setup/Module'));
const Statuses = lazy(() => import('./pages/setup/Statuses'));
const StatusGroups = lazy(() => import('./pages/setup/StatusGroups'));
const StatusMapping = lazy(() => import('./pages/setup/StatusMapping'));
const FaqGeneralQuestionsAdmin = lazy(() => import('./pages/setup/FaqGeneralQuestionsAdmin'));
const FaqUserGuidesAdmin = lazy(() => import('./pages/setup/FaqUserGuidesAdmin'));
const FaqTroubleshootingAdmin = lazy(() => import('./pages/setup/FaqTroubleshootingAdmin'));
const FaqContactSupportAdmin = lazy(() => import('./pages/setup/FaqContactSupportAdmin'));
const ItemCategory = lazy(() => import('./pages/setup/ItemCategory'));
const FoodCategory = lazy(() => import('./pages/setup/FoodCategory'));
const BeverageCategory = lazy(() => import('./pages/setup/BeverageCategory'));
const Item = lazy(() => import('./pages/setup/Item'));
const Unit = lazy(() => import('./pages/setup/Unit'));
const Currency = lazy(() => import('./pages/setup/Currency'));
const PaymentMethod = lazy(() => import('./pages/setup/PaymentMethod'));
const OrderType = lazy(() => import('./pages/setup/OrderType'));
const ExchangeRate = lazy(() => import('./pages/setup/ExchangeRate'));
const Locale = lazy(() => import('./pages/setup/Locale'));
const SlideshowSlides = lazy(() => import('./pages/setup/SlideshowSlides'));
const Hotel = lazy(() => import('./pages/setup/Hotel'));
const Outlet = lazy(() => import('./pages/setup/Outlet'));
const Store = lazy(() => import('./pages/setup/Store'));

// Procurement Pages
const Supplier = lazy(() => import('./pages/procurement/Supplier'));
const PurchaseRequisition = lazy(() => import('./pages/procurement/PurchaseRequisition'));
const LocalPurchaseOrder = lazy(() => import('./pages/procurement/LocalPurchaseOrder'));
const GoodsReceivedNote = lazy(() => import('./pages/procurement/GoodsReceivedNote'));
const StoreRequest = lazy(() => import('./pages/procurement/StoreRequest'));
const StoreIssue = lazy(() => import('./pages/procurement/StoreIssue'));
const StockAdjustment = lazy(() => import('./pages/procurement/StockAdjustment'));
const StockCountSession = lazy(() => import('./pages/procurement/StockCountSession'));
const Menu = lazy(() => import('./pages/procurement/Menu'));
const MenuRecipe = lazy(() => import('./pages/procurement/MenuRecipe'));
const ConsumptionPosting = lazy(() => import('./pages/procurement/ConsumptionPosting'));
const BarTransaction = lazy(() => import('./pages/procurement/BarTransaction'));

// Service Pages
const WaiterOrders = lazy(() => import('./pages/service/WaiterOrders'));
const KitchenQueue = lazy(() => import('./pages/service/KitchenQueue'));
const BarQueue = lazy(() => import('./pages/service/BarQueue'));
const CashierSales = lazy(() => import('./pages/service/CashierSales'));

const DocumentVerify = lazy(() => import('./pages/DocumentVerify'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const can = (perm) => hasPermission(user, perm);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={<PageLoader />}
    >
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/permissions" element={can('view-permissions') ? <Permissions /> : <Navigate to="/dashboard" replace />} />
        <Route path="users/password-policy" element={can('view-password-policy') ? <PasswordPolicy /> : <Navigate to="/dashboard" replace />} />
        <Route path="users/password-history" element={can('view-password-history') ? <PasswordHistory /> : <Navigate to="/dashboard" replace />} />
        <Route path="users/roles" element={can('view-roles') ? <Roles /> : <Navigate to="/dashboard" replace />} />
        <Route path="users/list" element={can('view-users') ? <UserList /> : <Navigate to="/dashboard" replace />} />
        <Route path="users/role-handover" element={can('view-role-handovers') ? <RoleHandover /> : <Navigate to="/dashboard" replace />} />
        
        {/* Logs Routes */}
        <Route path="logs/audit-trail" element={<AuditTrail />} />
        <Route path="logs/errors" element={<Errors />} />
        <Route path="logs/failed-logins" element={<FailedLogins />} />
        
        {/* Reports Routes */}
        <Route path="reports" element={can('view-reports') ? <ReportsList /> : <Navigate to="/dashboard" replace />} />
        <Route path="reports/sales" element={can('view-reports') ? <SalesReport /> : <Navigate to="/dashboard" replace />} />
        <Route path="reports/suppliers" element={can('view-reports') ? <SuppliersReport /> : <Navigate to="/dashboard" replace />} />
        
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
        <Route path="setup/payment-methods" element={can('manage-payment-methods') ? <PaymentMethod /> : <Navigate to="/dashboard" replace />} />
        <Route path="setup/order-types" element={can('manage-order-types') ? <OrderType /> : <Navigate to="/dashboard" replace />} />
        <Route path="setup/exchange-rates" element={<ExchangeRate />} />
        <Route path="setup/locales" element={<Locale />} />
        <Route path="setup/slideshow-slides" element={<SlideshowSlides />} />
        <Route path="setup/hotels" element={<Hotel />} />
        <Route path="setup/outlets" element={<Outlet />} />
        <Route path="procurement/suppliers" element={<Supplier />} />
        <Route path="setup/store" element={<Store />} />
        <Route
          path="procurement/purchase-requisitions"
          element={can('view-purchase-requisitions') || can('manage-purchase-requisitions') ? <PurchaseRequisition /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="procurement/local-purchase-orders"
          element={can('view-local-purchase-orders') || can('manage-local-purchase-orders') ? <LocalPurchaseOrder /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="procurement/goods-received-notes" element={<GoodsReceivedNote />} />
        <Route path="procurement/store-requests" element={<StoreRequest />} />
        <Route path="procurement/store-issues" element={<StoreIssue />} />
        <Route path="procurement/stock-adjustments" element={<StockAdjustment />} />
        <Route path="procurement/stock-count-sessions" element={<StockCountSession />} />
        <Route path="procurement/menus" element={<Menu />} />
        <Route path="procurement/menu-recipes" element={<MenuRecipe />} />
        <Route path="procurement/consumptions" element={<ConsumptionPosting />} />
        <Route path="procurement/bar-transactions" element={<BarTransaction />} />
        <Route path="service/waiter-orders" element={<WaiterOrders />} />
        <Route path="service/kitchen-queue" element={<KitchenQueue />} />
        <Route path="service/bar-queue" element={<BarQueue />} />
        <Route path="service/cashier" element={can('view-cashier-sales') ? <CashierSales /> : <Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/verify/:code" element={<DocumentVerify />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/landing-test" element={<LandingPageTest />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;

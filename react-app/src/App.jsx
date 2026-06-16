import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import LandingPageTest from './pages/LandingPageTest';
import Permissions from './pages/Permissions';
import Roles from './pages/Roles';
import UserList from './pages/UserList';
import TransferRequests from './pages/TransferRequests';
import Profile from './pages/Profile';

// Logs Pages
import AuditTrail from './pages/logs/AuditTrail';
import Errors from './pages/logs/Errors';

// Books Pages
import BookTypes from './pages/books/BookTypes';
import BooksList from './pages/books/BooksList';

// Assessments Pages
import Assessments from './pages/assessments/Assessments';

// Reports Pages
import ReportsList from './pages/reports/ReportsList';
import ReportView from './pages/reports/ReportView';

// Schools Pages
import SchoolCategory from './pages/schools/SchoolCategory';
import SchoolClassification from './pages/schools/SchoolClassification';
import SchoolOwner from './pages/schools/SchoolOwner';
import SchoolGenderType from './pages/schools/SchoolGenderType';
import SponsorshipType from './pages/schools/SponsorshipType';
import SchoolType from './pages/schools/SchoolType';
import ServiceType from './pages/schools/ServiceType';
import SchoolsList from './pages/schools/SchoolsList';

// Notifications Pages
import AllNotifications from './pages/notifications/AllNotifications';
import Unread from './pages/notifications/Unread';
import SystemAlerts from './pages/notifications/SystemAlerts';
import Announcements from './pages/notifications/Announcements';

// FAQ Pages
import GeneralQuestions from './pages/faq/GeneralQuestions';
import UserGuides from './pages/faq/UserGuides';
import Troubleshooting from './pages/faq/Troubleshooting';
import ContactSupport from './pages/faq/ContactSupport';

// Geographical Pages
import GeographicalLevel from './pages/geographical/GeographicalLevel';
import Country from './pages/geographical/Country';
import Region from './pages/geographical/Region';
import Council from './pages/geographical/Council';
import Ward from './pages/geographical/Ward';
import StreetVillage from './pages/geographical/StreetVillage';

// Setup Pages
import AbsenteeismStatus from './pages/setup/AbsenteeismStatus';
import AbsenteeismType from './pages/setup/AbsenteeismType';
import ApprovalStatusType from './pages/setup/ApprovalStatusType';
import AvailabilityStatusType from './pages/setup/AvailabilityStatusType';
import BookType from './pages/setup/BookType';
import Class from './pages/setup/Class';
import Combination from './pages/setup/Combination';
import CompletionStatus from './pages/setup/CompletionStatus';
import DocumentType from './pages/setup/DocumentType';
import DropoutReason from './pages/setup/DropoutReason';
import EducationLevel from './pages/setup/EducationLevel';
import FacilityType from './pages/setup/FacilityType';
import FundingSource from './pages/setup/FundingSource';
import Gender from './pages/setup/Gender';
import Level from './pages/setup/Level';
import LevelCategory from './pages/setup/LevelCategory';
import OccupationType from './pages/setup/OccupationType';
import OwnershipType from './pages/setup/OwnershipType';
import NamePrefix from './pages/setup/NamePrefix';
import Profession from './pages/setup/Profession';
import Responsibility from './pages/setup/Responsibility';
import ResourceType from './pages/setup/ResourceType';
import ReviewScore from './pages/setup/ReviewScore';
import SalaryScale from './pages/setup/SalaryScale';
import SchoolSpecialization from './pages/setup/SchoolSpecialization';
import StaffType from './pages/setup/StaffType';
import SpecialNeedType from './pages/setup/SpecialNeedType';
import SSVInitiator from './pages/setup/SSVInitiator';
import SSVType from './pages/setup/SSVType';
import SubjectCategory from './pages/setup/SubjectCategory';
import Subject from './pages/setup/Subject';
import Years from './pages/setup/Years';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
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
  
  return isAuthenticated ? children : <Navigate to="/landing" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

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
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/landing-test" element={<LandingPageTest />} />
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
        <Route path="users/permissions" element={<Permissions />} />
        <Route path="users/roles" element={<Roles />} />
        <Route path="users/list" element={<UserList />} />
        <Route path="users/transfer-requests" element={<TransferRequests />} />
        
        {/* Logs Routes */}
        <Route path="logs/audit-trail" element={<AuditTrail />} />
        <Route path="logs/errors" element={<Errors />} />
        
        {/* Books Routes */}
        <Route path="books/types" element={<BookTypes />} />
        <Route path="books/list" element={<BooksList />} />
        
        {/* Assessments Routes */}
        <Route path="assessments" element={<Assessments />} />
        
        {/* Reports Routes */}
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/view/:reportId" element={<ReportView />} />
        
        {/* Schools Routes */}
        <Route path="schools/category" element={<SchoolCategory />} />
        <Route path="schools/classification" element={<SchoolClassification />} />
        <Route path="schools/owner" element={<SchoolOwner />} />
        <Route path="schools/gender-type" element={<SchoolGenderType />} />
        <Route path="schools/sponsorship-type" element={<SponsorshipType />} />
        <Route path="schools/type" element={<SchoolType />} />
        <Route path="schools/service-type" element={<ServiceType />} />
        <Route path="schools/list" element={<SchoolsList />} />
        
        {/* Notifications Routes */}
        <Route path="notifications/all" element={<AllNotifications />} />
        <Route path="notifications/unread" element={<Unread />} />
        <Route path="notifications/system-alerts" element={<SystemAlerts />} />
        <Route path="notifications/announcements" element={<Announcements />} />
        
        {/* FAQ Routes */}
        <Route path="faq/general" element={<GeneralQuestions />} />
        <Route path="faq/guides" element={<UserGuides />} />
        <Route path="faq/troubleshooting" element={<Troubleshooting />} />
        <Route path="faq/support" element={<ContactSupport />} />
        
        {/* Geographical Routes */}
        <Route path="geographical/geographical-level" element={<GeographicalLevel />} />
        <Route path="geographical/country" element={<Country />} />
        <Route path="geographical/region" element={<Region />} />
        <Route path="geographical/council" element={<Council />} />
        <Route path="geographical/ward" element={<Ward />} />
        <Route path="geographical/street-village" element={<StreetVillage />} />
        
        {/* Setup Routes */}
        <Route path="setup/absenteeism-status" element={<AbsenteeismStatus />} />
        <Route path="setup/absenteeism-type" element={<AbsenteeismType />} />
        <Route path="setup/approval-status-type" element={<ApprovalStatusType />} />
        <Route path="setup/availability-status-type" element={<AvailabilityStatusType />} />
        <Route path="setup/book-type" element={<BookType />} />
        <Route path="setup/class" element={<Class />} />
        <Route path="setup/combination" element={<Combination />} />
        <Route path="setup/completion-status" element={<CompletionStatus />} />
        <Route path="setup/document-type" element={<DocumentType />} />
        <Route path="setup/dropout-reason" element={<DropoutReason />} />
        <Route path="setup/education-level" element={<EducationLevel />} />
        <Route path="setup/facility-type" element={<FacilityType />} />
        <Route path="setup/funding-source" element={<FundingSource />} />
        <Route path="setup/gender" element={<Gender />} />
        <Route path="setup/level" element={<Level />} />
        <Route path="setup/level-category" element={<LevelCategory />} />
        <Route path="setup/occupation-type" element={<OccupationType />} />
        <Route path="setup/ownership-type" element={<OwnershipType />} />
        <Route path="setup/name-prefix" element={<NamePrefix />} />
        <Route path="setup/profession" element={<Profession />} />
        <Route path="setup/responsibility" element={<Responsibility />} />
        <Route path="setup/resource-type" element={<ResourceType />} />
        <Route path="setup/review-score" element={<ReviewScore />} />
        <Route path="setup/salary-scale" element={<SalaryScale />} />
        <Route path="schools/specialization" element={<SchoolSpecialization />} />
        <Route path="setup/staff-type" element={<StaffType />} />
        <Route path="setup/special-need-type" element={<SpecialNeedType />} />
        <Route path="setup/ssv-initiator" element={<SSVInitiator />} />
        <Route path="setup/ssv-type" element={<SSVType />} />
        <Route path="setup/subject-category" element={<SubjectCategory />} />
        <Route path="setup/subject" element={<Subject />} />
        <Route path="setup/years" element={<Years />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, CheckSquare, Settings, LogIn, UserPlus, FileText, Calendar, BarChart2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import ContactsPage from '@/components/contacts/ContactsPage';
import AssessmentsPage from '@/components/assessments/AssessmentsPage';
import LoginPage from '@/components/auth/LoginPage';
import AuthProvider, { useAuth } from '@/services/firebase/AuthProvider';
import DealsPage from '@/components/deals/DealsPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import AssessmentToolsPage from './pages/AssessmentToolsPage';
import AssessmentResultsPage from './pages/AssessmentResultsPage';
import CalendarPage from './pages/CalendarPage';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="assessment-hub" element={<AssessmentToolsPage />} />
              <Route path="assessment-results" element={<AssessmentResultsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App; 
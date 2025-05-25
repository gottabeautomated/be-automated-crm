import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import ContactsPage from '@/components/contacts/ContactsPage';
import AssessmentsPage from '@/components/assessments/AssessmentsPage';
import LoginPage from '@/components/auth/LoginPage'; // Assuming LoginPage will be created
import AuthProvider, { useAuth } from '@/services/firebase/AuthProvider'; // Assuming AuthProvider will be created

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <Routes>
      {user ? (
        <Route path="/*" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          {/* Add other protected routes here */}
        </Route>
      ) : (
        <Route path="/*" element={<LoginPage />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App; 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import InterviewPage from './pages/interview/InterviewPage';
import { APP_ROUTES } from './routes';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: string[] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to={APP_ROUTES.LOGIN} replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />

              <Route
                path={APP_ROUTES.ADMIN.DASHBOARD}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hr']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path={APP_ROUTES.INTERVIEW.INTRO}
                element={
                  <ProtectedRoute allowedRoles={['admin', 'hr', 'interviewer']}>
                    <InterviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

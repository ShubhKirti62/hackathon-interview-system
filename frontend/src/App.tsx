import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast/ToastContainer';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FaceVerificationProvider } from './context/FaceVerificationContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Loader from './components/shared/Loader';
import RegisterPage from './pages/RegisterPage';
import DemoPage from './pages/DemoPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import InterviewPage from './pages/interview/InterviewPage';
import InterviewSetupPage from './pages/interview/InterviewSetupPage';
import CandidateHome from './pages/candidate/CandidateHome';
import LiveMeetingPage from './pages/interview/LiveMeetingPage';
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

// Redirect if already authenticated
const RedirectIfAuthenticated = ({ children }: { children: React.ReactElement }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // If still loading auth state, just show loader or children
  if (loading) return children;

  if (isAuthenticated && user) {
    if (user.role === 'admin' || user.role === 'interviewer') {
      return <Navigate to={APP_ROUTES.ADMIN.DASHBOARD} replace />;
    }
    // All other authenticated users (candidate) go to candidate home
    return <Navigate to={APP_ROUTES.CANDIDATE.DASHBOARD} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Loader />
        <AuthProvider>
          <FaceVerificationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={
                    <RedirectIfAuthenticated>
                      <RegisterPage />
                    </RedirectIfAuthenticated>
                  } />

                  <Route path={APP_ROUTES.LOGIN} element={
                    <RedirectIfAuthenticated>
                      <LoginPage />
                    </RedirectIfAuthenticated>
                  } />

                  <Route path={APP_ROUTES.DEMO} element={<DemoPage />} />

                  <Route
                    path={APP_ROUTES.ADMIN.DASHBOARD}
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'hr', 'interviewer']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={APP_ROUTES.INTERVIEW.INTRO}
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'hr', 'interviewer', 'candidate']}>
                        <InterviewPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={APP_ROUTES.INTERVIEW.SETUP}
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'hr', 'interviewer', 'candidate']}>
                        <InterviewSetupPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={APP_ROUTES.INTERVIEW.SESSION}
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'hr', 'interviewer', 'candidate']}>
                        <InterviewPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={APP_ROUTES.INTERVIEW.MEETING}
                    element={
                      <ProtectedRoute allowedRoles={['candidate', 'admin', 'hr', 'interviewer']}>
                        <LiveMeetingPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={APP_ROUTES.CANDIDATE.DASHBOARD}
                    element={
                      <ProtectedRoute allowedRoles={['candidate', 'admin', 'hr', 'interviewer']}>
                        <CandidateHome />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
          </FaceVerificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

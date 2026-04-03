import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import UserProtectedRoute from './components/ui/UserProtectedRoute';
import LandingPage from './pages/LandingPage';
import GymDetailPage from './pages/GymDetailPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserLoginPage from './pages/user/UserLoginPage';
import UserSignupPage from './pages/user/UserSignupPage';
import UserDashboard from './pages/user/UserDashboard';

export default function App() {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/gym/:slug" element={<GymDetailPage />} />

            {/* User Routes */}
            <Route path="/login" element={<UserLoginPage />} />
            <Route path="/signup" element={<UserSignupPage />} />
            <Route
              path="/dashboard"
              element={
                <UserProtectedRoute>
                  <UserDashboard />
                </UserProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </UserAuthProvider>
    </AuthProvider>
  );
}

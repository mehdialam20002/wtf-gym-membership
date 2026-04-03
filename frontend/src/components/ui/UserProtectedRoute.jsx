import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

export default function UserProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUserAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.status === 'pending') return <Navigate to="/pending" replace />;
  if (user.status === 'rejected') return <Navigate to="/rejected" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/feed" replace />;

  return children;
}

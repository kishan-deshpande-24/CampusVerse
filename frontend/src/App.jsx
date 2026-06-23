import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import useAuthStore from './store/authStore';
import useSocketStore from './store/socketStore';

import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PendingPage from './pages/PendingPage';

import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import NotesPage from './pages/NotesPage';
import EventsPage from './pages/EventsPage';
import TeamsPage from './pages/TeamsPage';
import MarketplacePage from './pages/MarketplacePage';
import LostFoundPage from './pages/LostFoundPage';
import ReviewsPage from './pages/ReviewsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

import AdminLayout from './pages/admin/AdminLayout';

export default function App() {
  const { user, token, fetchMe } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  useEffect(() => {
    if (user?.id && user?.status === 'approved') {
      connect(user.id);
      return () => disconnect();
    }
  }, [user?.id, user?.status]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0f0f1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
          success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/pending" element={<PendingPage />} />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        } />

        {/* Protected app routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/lost-found" element={<LostFoundPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={token ? '/feed' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

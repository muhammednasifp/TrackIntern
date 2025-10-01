import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { useAuthStore } from './stores/authStore';
import { AuthModal } from './components/auth/AuthModal';
import { StudentProfilePage } from './components/profile/StudentProfilePage';
import { OpportunitiesPage } from './components/opportunities/OpportunitiesPage';

function App() {
  const navigate = useNavigate();
  const { user, loading, checkSession } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TrackIntern...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <Navbar navigateTo={navigateTo} />
        <main className="pt-16">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <HeroSection
                    onLoginClick={() => openAuth('signin')}
                    onGetStartedClick={() => openAuth('signup')}
                  />
                )
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                user ? (
                  <StudentDashboard navigateTo={navigateTo} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/profile"
              element={
                user ? (
                  <StudentProfilePage navigateTo={navigateTo} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/opportunities"
              element={
                user ? (
                  <OpportunitiesPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
      />
      <Toaster position="top-right" />
    </>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { BackgroundWrapper } from './components/layout/BackgroundWrapper';
import { HeroSection } from './components/landing/HeroSection';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { useAuthStore } from './stores/authStore';
import { AuthModal } from './components/auth/AuthModal';
import { StudentProfilePage } from './components/profile/StudentProfilePage';
import { OpportunitiesPage } from './components/opportunities/OpportunitiesPage';
import { ApplicationTrackerPage } from './components/applications/ApplicationTrackerPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Determine navbar theme based on current route
  const getNavbarTheme = () => {
    return location.pathname === '/opportunities' ? 'dark' : 'light';
  };

  if (loading) {
    return (
      <BackgroundWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading TrackIntern...</p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <>
      <BackgroundWrapper>
        <div className="min-h-screen">
          <Navbar navigateTo={navigateTo} theme={getNavbarTheme()} />
          <main>
            <Routes>
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

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<StudentDashboard navigateTo={navigateTo} />} />
                <Route path="/profile" element={<StudentProfilePage navigateTo={navigateTo} />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/applications" element={<ApplicationTrackerPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BackgroundWrapper>

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
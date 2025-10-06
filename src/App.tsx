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
import { CompanyDashboard } from './components/company/CompanyDashboard';
import { OpportunityForm } from './components/company/OpportunityForm';
import { ApplicantsPage } from './components/company/ApplicantsPage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, checkSession, userType } = useAuthStore();
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
          <Navbar navigateTo={navigateTo} theme={getNavbarTheme()} currentPath={location.pathname} />
          <main>
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to={userType === 'company' ? '/company' : '/dashboard'} replace />
                  ) : (
                    <HeroSection
                      onLoginClick={() => openAuth('signin')}
                      onGetStartedClick={() => openAuth('signup')}
                    />
                  )
                }
              />

              <Route element={<ProtectedRoute />}>
                {/* Student routes */}
                <Route path="/dashboard" element={userType === 'company' ? <Navigate to="/company" replace /> : <StudentDashboard navigateTo={navigateTo} />} />
                <Route path="/profile" element={userType === 'company' ? <Navigate to="/company" replace /> : <StudentProfilePage navigateTo={navigateTo} />} />
                <Route path="/opportunities" element={userType === 'company' ? <Navigate to="/company/opportunities" replace /> : <OpportunitiesPage />} />
                <Route path="/applications" element={userType === 'company' ? <Navigate to="/company" replace /> : <ApplicationTrackerPage />} />

                {/* Company routes */}
                <Route path="/company" element={userType === 'student' ? <Navigate to="/dashboard" replace /> : <CompanyDashboard navigateTo={navigateTo} />} />
                <Route path="/company/opportunities/new" element={userType === 'student' ? <Navigate to="/dashboard" replace /> : <OpportunityForm />} />
                <Route path="/company/opportunities/:id/edit" element={userType === 'student' ? <Navigate to="/dashboard" replace /> : <OpportunityForm />} />
                <Route path="/company/opportunities/:id/applicants" element={userType === 'student' ? <Navigate to="/dashboard" replace /> : <ApplicantsPage />} />
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
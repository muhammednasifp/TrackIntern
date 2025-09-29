import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { useAuthStore } from './stores/authStore';
import { AuthModal } from './components/auth/AuthModal';

function App() {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <Navbar />
        {user ? (
          <div className="pt-16">
            <StudentDashboard />
          </div>
        ) : (
          <HeroSection 
            onLoginClick={() => openAuth('signin')}
            onGetStartedClick={() => openAuth('signup')}
          />
        )}
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
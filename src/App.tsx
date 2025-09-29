import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { FeaturesSection } from './components/landing/FeaturesSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { Footer } from './components/landing/Footer';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { useAuthStore } from './stores/authStore';

function App() {
  const { user, loading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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

  // If user is authenticated, show dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <StudentDashboard />
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
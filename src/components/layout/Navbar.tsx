import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface NavbarProps {
  navigateTo: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ navigateTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuthStore();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    navigateTo('/');
  };

  const handleNavigate = (path: string) => {
    navigateTo(path);
    setIsOpen(false);
    setIsProfileOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo(`/opportunities?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo(user ? '/dashboard' : '/')}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-gray-800">TrackIntern</span>
          </motion.div>

          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <button onClick={() => handleNavigate('/dashboard')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Dashboard</button>
                <button onClick={() => handleNavigate('/opportunities')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Opportunities</button>
                <button onClick={() => handleNavigate('/applications')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Applications</button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-100 border border-gray-200/80 rounded-full py-2 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                </form>

                <NotificationDropdown />

                <div className="relative" ref={profileRef}>
                  <motion.button onClick={() => setIsProfileOpen(!isProfileOpen)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <UserCircleIcon className="h-8 w-8 text-gray-500 hover:text-gray-800" />
                  </motion.button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200/80 z-50">
                        <div className="p-2">
                          <button onClick={() => handleNavigate('/profile')} className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Profile</button>
                          <div className="border-t border-gray-100 my-2"></div>
                          <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">Sign Out</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
                <div className="hidden md:flex items-center gap-2">
                    {/* Placeholder for future Login/Signup buttons if needed */}
                </div>
            )}
            <div className="md:hidden">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-gray-900 transition-colors">
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white/90 backdrop-blur-lg border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              {user ? (
                <>
                  <button onClick={() => handleNavigate('/dashboard')} className="block w-full text-left text-gray-700 hover:text-gray-900 transition-colors">Dashboard</button>
                  <button onClick={() => handleNavigate('/opportunities')} className="block w-full text-left text-gray-700 hover:text-gray-900 transition-colors">Opportunities</button>
                   <button onClick={() => handleNavigate('/applications')} className="block w-full text-left text-gray-700 hover:text-gray-900 transition-colors">Applications</button>
                  <button onClick={() => handleNavigate('/profile')} className="block w-full text-left text-gray-700 hover:text-gray-900 transition-colors">Profile</button>
                  <div className="border-t border-gray-200 pt-4">
                    <button onClick={handleSignOut} className="block w-full text-left text-red-600 hover:text-red-800 transition-colors">Sign Out</button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
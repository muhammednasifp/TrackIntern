import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

interface NavbarProps {
  navigateTo: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ navigateTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuthStore();

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigateTo('/');
  };

  const handleNavigate = (path: string) => {
    navigateTo(path);
    setIsOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo(`/opportunities?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && !notificationRef.current.contains(event.target as Node) &&
        profileRef.current && !profileRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef, profileRef]); // Added refs to the dependency array

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-lg border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigateTo(user ? '/dashboard' : '/')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              TrackIntern
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <div className="flex items-center space-x-6">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </form>

                <div className="relative" ref={notificationRef}>
                  {/* Notification Button */}
                  <motion.button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </motion.button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 top-14 w-80 bg-dark-matter/90 backdrop-blur-lg rounded-lg shadow-xl border border-glass-border z-50"
                      >
                        <div className="p-4">
                          <h4 className="font-bold text-stellar-white mb-3">Notifications</h4>
                          <ul className="space-y-2">
                            <li className="p-2 rounded-lg hover:bg-cosmic-blue cursor-pointer">
                              <p className="text-sm font-semibold text-stellar-white">Application Update</p>
                              <p className="text-xs text-gray-400">Your application for the React Developer role has been shortlisted.</p>
                            </li>
                            <li className="p-2 rounded-lg hover:bg-cosmic-blue cursor-pointer">
                              <p className="text-sm font-semibold text-stellar-white">New Opportunity</p>
                              <p className="text-xs text-gray-400">A new internship matching your skills has been posted.</p>
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  </motion.button>
                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-dark-matter/90 backdrop-blur-lg rounded-lg shadow-xl border border-glass-border z-50"
                      >
                        <div className="p-2">
                          <button onClick={() => handleNavigate('/dashboard')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                            Dashboard
                          </button>
                          <button onClick={() => handleNavigate('/opportunities')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                            Opportunities
                          </button>
                          <button onClick={() => handleNavigate('/profile')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                            Profile
                          </button>
                          <div className="border-t border-glass-border my-2"></div>
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-matter/90 backdrop-blur-lg border-t border-glass-border"
          >
            <div className="px-4 py-4 space-y-4">
              {user ? (
                <div className="space-y-2">
                  <button onClick={() => handleNavigate('/dashboard')} className="block text-gray-300 hover:text-white transition-colors">Dashboard</button>
                  <button onClick={() => handleNavigate('/opportunities')} className="block text-gray-300 hover:text-white transition-colors">Opportunities</button>
                  <button onClick={() => handleNavigate('/profile')} className="block text-gray-300 hover:text-white transition-colors">Profile</button>
                  <button onClick={handleSignOut} className="block w-full text-left text-red-400 hover:text-red-300 transition-colors">Sign Out</button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

// The props for click handlers are no longer needed
// interface NavbarProps {
//   onSignInClick: () => void;
//   onGetStartedClick: () => void;
// }

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  return (
    <>
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
              className="flex items-center space-x-2"
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
                <div className="flex items-center space-x-4">
                   <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </motion.button>
                  
                  <div className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <UserCircleIcon className="h-8 w-8 text-gray-700" />
                    </motion.button>
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <div className="p-2">
                        <a href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition-colors">
                          Dashboard
                        </a>
                        <a href="/profile" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition-colors">
                          Profile
                        </a>
                        <a href="/settings" className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-lg transition-colors">
                          Settings
                        </a>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button 
                          onClick={signOut}
                          className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // When logged out, show nothing here
                null
              )}
            </div>

            {/* Mobile menu button - only show if user is logged in */}
            {user && (
              <div className="md:hidden">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                >
                  {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/90 backdrop-blur-lg border-t border-white/20"
            >
              <div className="px-4 py-4 space-y-4">
                <div className="space-y-2">
                  <a href="/dashboard" className="block text-gray-700 hover:text-purple-600 transition-colors">Dashboard</a>
                  <a href="/profile" className="block text-gray-700 hover:text-purple-600 transition-colors">Profile</a>
                  <button onClick={signOut} className="block w-full text-left text-red-600 hover:text-red-700 transition-colors">Sign Out</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

interface NavbarProps {
  navigateTo: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ navigateTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigateTo('/');
  }

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
                <div className="flex items-center space-x-4">
                   <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors"
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
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    </motion.button>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-dark-matter/90 backdrop-blur-lg rounded-lg shadow-xl border border-glass-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <div className="p-2">
                        <button onClick={() => navigateTo('/dashboard')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                          Dashboard
                        </button>
                        <button onClick={() => navigateTo('/opportunities')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                          Opportunities
                        </button>
                        <button onClick={() => navigateTo('/profile')} className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                          Profile
                        </button>
                        <button className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-cosmic-blue rounded-lg transition-colors">
                          Settings
                        </button>
                        <div className="border-t border-glass-border my-2"></div>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                null
              )}
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
                    <button onClick={() => { navigateTo('/dashboard'); setIsOpen(false); }} className="block text-gray-300 hover:text-white transition-colors">Dashboard</button>
                    <button onClick={() => { navigateTo('/opportunities'); setIsOpen(false); }} className="block text-gray-300 hover:text-white transition-colors">Opportunities</button>
                    <button onClick={() => { navigateTo('/profile'); setIsOpen(false); }} className="block text-gray-300 hover:text-white transition-colors">Profile</button>
                    <button onClick={handleSignOut} className="block w-full text-left text-red-400 hover:text-red-300 transition-colors">Sign Out</button>
                  </div>
                ) : (
                    <div></div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

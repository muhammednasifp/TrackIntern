import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface NavbarProps {
  navigateTo: (path: string) => void;
  theme?: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({ navigateTo, theme = 'light' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mouseInNavArea, setMouseInNavArea] = useState(false);
  const { user, signOut } = useAuthStore();
  const profileRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    navigateTo('/');
  };

  const handleNavigate = (path: string) => {
    navigateTo(path);
    setIsExpanded(false);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setMouseInNavArea(true);
    setIsExpanded(true);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setMouseInNavArea(false);
    // Delay collapse to allow moving to dropdowns
    collapseTimeoutRef.current = setTimeout(() => {
      if (!mouseInNavArea) {
        setIsExpanded(false);
        setIsProfileOpen(false);
      }
    }, 200);
  };

  // Handle mouse enter on dropdown areas
  const handleDropdownMouseEnter = () => {
    setMouseInNavArea(true);
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  // Handle mouse leave from dropdown areas
  const handleDropdownMouseLeave = () => {
    setMouseInNavArea(false);
    collapseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setIsProfileOpen(false);
    }, 200);
  };

  // Dynamic styles based on theme
  const navStyles = theme === 'dark' 
    ? "fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
    : "fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80";
    
  const textStyles = theme === 'dark' 
    ? "text-white" 
    : "text-gray-800";
    
  const linkStyles = theme === 'dark'
    ? "text-slate-200 hover:text-white"
    : "text-gray-600 hover:text-gray-900";
    
  const searchStyles = theme === 'dark'
    ? "bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400"
    : "bg-gray-100 border border-gray-200/80 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-purple-500";
    
  const iconStyles = theme === 'dark'
    ? "text-slate-300 hover:text-white"
    : "text-gray-500 hover:text-gray-800";
    
  const dropdownStyles = theme === 'dark'
    ? "bg-slate-800/95 border-slate-600/50 backdrop-blur-lg"
    : "bg-white border-gray-200/80";
    
  const mobileMenuStyles = theme === 'dark'
    ? "bg-slate-900/90 backdrop-blur-lg border-slate-700"
    : "bg-white/90 backdrop-blur-lg border-gray-200";

  return (
    <motion.nav
      ref={navRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed top-4 left-1/2 z-50 transition-all duration-300 ease-out"
      style={{ transform: 'translateX(-50%)' }}
    >
      <motion.div
        animate={{
          borderRadius: '24px',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`${
          theme === 'dark' 
            ? 'bg-slate-900/90 border-slate-700/50' 
            : 'bg-white/90 border-gray-200/50'
        } backdrop-blur-lg border shadow-lg whitespace-nowrap max-w-[90vw]`}
      >
        <div className="flex items-center px-4 py-3">
          {/* Logo/Title - Always visible */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => navigateTo(user ? '/dashboard' : '/')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className={`text-lg font-bold ${textStyles} whitespace-nowrap`}>TrackIntern</span>
          </motion.div>

          {/* Navigation Links - Appear on hover */}
          <AnimatePresence>
            {isExpanded && user && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center ml-6 space-x-4 overflow-hidden"
              >
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleNavigate('/dashboard')} 
                  className={`${linkStyles} font-medium transition-colors whitespace-nowrap hover:scale-105`}
                >
                  Dashboard
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => handleNavigate('/opportunities')} 
                  className={`${linkStyles} font-medium transition-colors whitespace-nowrap hover:scale-105`}
                >
                  Opportunities
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleNavigate('/applications')} 
                  className={`${linkStyles} font-medium transition-colors whitespace-nowrap hover:scale-105`}
                >
                  Applications
                </motion.button>

                {/* Notifications */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="notification-dropdown"
                  data-dropdown="notifications"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <NotificationDropdown 
                    theme={theme} 
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                  />
                </motion.div>

                {/* Profile Dropdown */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative profile-dropdown" 
                  ref={profileRef}
                  data-dropdown="profile"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <motion.button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.95 }}
                    className="p-1"
                  >
                    <UserCircleIcon className={`h-7 w-7 ${iconStyles}`} />
                  </motion.button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${dropdownStyles}`}
                        data-dropdown="profile"
                      >
                        <div className="p-2">
                          <button 
                            onClick={() => handleNavigate('/profile')} 
                            className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              theme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Profile
                          </button>
                          <div className={`border-t my-2 ${theme === 'dark' ? 'border-slate-600' : 'border-gray-100'}`}></div>
                          <button 
                            onClick={handleSignOut} 
                            className={`block w-full text-left px-3 py-2 text-red-600 rounded-lg transition-colors ${
                              theme === 'dark' ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                            }`}
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.nav>
  );
};
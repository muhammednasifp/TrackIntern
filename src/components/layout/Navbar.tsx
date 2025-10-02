import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface NavbarProps {
  navigateTo: (path: string) => void;
  theme?: 'light' | 'dark';
}

export const Navbar: React.FC<NavbarProps> = ({ navigateTo, theme = 'light' }) => {
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={navStyles}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2 cursor-pointer" onClick={() => navigateTo(user ? '/dashboard' : '/')}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className={`text-xl font-bold ${textStyles}`}>TrackIntern</span>
          </motion.div>

          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <button onClick={() => handleNavigate('/dashboard')} className={`${linkStyles} font-medium transition-colors`}>Dashboard</button>
                <button onClick={() => handleNavigate('/opportunities')} className={`${linkStyles} font-medium transition-colors`}>Opportunities</button>
                <button onClick={() => handleNavigate('/applications')} className={`${linkStyles} font-medium transition-colors`}>Applications</button>
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
                    className={`${searchStyles} rounded-full py-2 pl-10 pr-4 focus:outline-none`}
                  />
                  <MagnifyingGlassIcon className={`h-5 w-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'} absolute left-3 top-1/2 -translate-y-1/2`}/>
                </form>

                <NotificationDropdown theme={theme} />

                <div className="relative" ref={profileRef}>
                  <motion.button onClick={() => setIsProfileOpen(!isProfileOpen)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <UserCircleIcon className={`h-8 w-8 ${iconStyles}`} />
                  </motion.button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 ${dropdownStyles}`}>
                        <div className="p-2">
                          <button onClick={() => handleNavigate('/profile')} className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}>Profile</button>
                          <div className={`border-t my-2 ${theme === 'dark' ? 'border-slate-600' : 'border-gray-100'}`}></div>
                          <button onClick={handleSignOut} className={`block w-full text-left px-3 py-2 text-red-600 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>Sign Out</button>
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
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className={`${linkStyles} transition-colors`}>
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`md:hidden border-t ${mobileMenuStyles}`}>
            <div className="px-4 py-4 space-y-4">
              {user ? (
                <>
                  <button onClick={() => handleNavigate('/dashboard')} className={`block w-full text-left ${linkStyles} transition-colors`}>Dashboard</button>
                  <button onClick={() => handleNavigate('/opportunities')} className={`block w-full text-left ${linkStyles} transition-colors`}>Opportunities</button>
                   <button onClick={() => handleNavigate('/applications')} className={`block w-full text-left ${linkStyles} transition-colors`}>Applications</button>
                  <button onClick={() => handleNavigate('/profile')} className={`block w-full text-left ${linkStyles} transition-colors`}>Profile</button>
                  <div className={`border-t pt-4 ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                    <button onClick={handleSignOut} className={`block w-full text-left text-red-600 transition-colors ${theme === 'dark' ? 'hover:text-red-400' : 'hover:text-red-800'}`}>Sign Out</button>
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
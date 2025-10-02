import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNavigate } from 'react-router-dom';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  theme?: 'light' | 'dark';
  onKeepExpanded?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ theme = 'light', onKeepExpanded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (url: string) => {
    navigate(url);
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onKeepExpanded?.();
        }}
        className={`relative p-2 transition-colors rounded-full ${
          theme === 'dark' 
            ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-96 backdrop-blur-lg rounded-2xl shadow-2xl border z-[10001] max-h-96 overflow-hidden ${
              theme === 'dark' 
                ? 'bg-slate-800/95 border-slate-600/50' 
                : 'bg-white/95 border-gray-200/50'
            }`}
            data-dropdown="notifications"
            onMouseEnter={() => {
              onKeepExpanded?.();
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                setIsOpen(false);
              }, 300);
            }}
          >
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-600/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {recentNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onRemove={removeNotification}
                      onAction={handleAction}
                    />
                  ))}

                  {notifications.length > 5 && (
                    <div className="p-3 text-center">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setIsOpen(false);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View all notifications ({notifications.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

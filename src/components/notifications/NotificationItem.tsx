import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Notification } from '../../stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onAction?: (url: string) => void;
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
    case 'error':
      return <XCircleIcon className="w-6 h-6 text-red-500" />;
    default:
      return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
  }
};

const getBorderColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500';
    case 'warning':
      return 'border-l-yellow-500';
    case 'error':
      return 'border-l-red-500';
    default:
      return 'border-l-blue-500';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = React.memo(({
  notification,
  onMarkAsRead,
  onRemove,
  onAction,
}) => {
  const handleAction = () => {
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative p-4 border-l-4 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        getBorderColor(notification.type)
      } ${!notification.read ? 'bg-blue-50/80' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                notification.read ? 'text-gray-600' : 'text-gray-700'
              }`}>
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => onRemove(notification.id)}
              className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </div>

            <div className="flex items-center space-x-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark as read
                </button>
              )}

              {notification.actionText && notification.actionUrl && (
                <button
                  onClick={handleAction}
                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                >
                  {notification.actionText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </motion.div>
  );
});

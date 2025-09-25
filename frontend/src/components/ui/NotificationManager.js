import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationManager = ({ 
  notifications = [], 
  position = 'top-right',
  maxNotifications = 3,
  onRemove 
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    const baseStyles = "flex items-center justify-between p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out max-w-sm w-full mb-3";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  const handleRemove = (id) => {
    if (onRemove) {
      onRemove(id);
    }
  };

  // Limit the number of notifications shown
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`fixed z-50 ${getPositionStyles()}`}>
      <div className="space-y-2">
        {visibleNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`${getStyles(notification.type)} ${
              notification.isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
            style={{
              transform: `translateY(${index * 8}px)`,
              zIndex: 1000 - index
            }}
          >
            <div className="flex items-center space-x-3">
              {getIcon(notification.type)}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => handleRemove(notification.id)}
              className="ml-4 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;

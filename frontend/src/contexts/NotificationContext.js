import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationManager from '../components/ui/NotificationManager';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({ type, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type,
      message,
      duration,
      isExiting: false
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isExiting: true }
          : notification
      )
    );

    // Remove from state after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  }, []);

  const success = useCallback((message, duration) => {
    return addNotification({ type: 'success', message, duration });
  }, [addNotification]);

  const error = useCallback((message, duration) => {
    return addNotification({ type: 'error', message, duration });
  }, [addNotification]);

  const warning = useCallback((message, duration) => {
    return addNotification({ type: 'warning', message, duration });
  }, [addNotification]);

  const info = useCallback((message, duration) => {
    return addNotification({ type: 'info', message, duration });
  }, [addNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationManager
        notifications={notifications}
        onRemove={removeNotification}
        position="top-right"
        maxNotifications={3}
      />
    </NotificationContext.Provider>
  );
};

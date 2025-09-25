import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnline, setLastOnline] = useState(null);
  const [offlineSince, setOfflineSince] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(new Date());
      setOfflineSince(null);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineSince(new Date());
    };

    // Set initial values
    if (navigator.onLine) {
      setLastOnline(new Date());
    } else {
      setOfflineSince(new Date());
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getOfflineDuration = () => {
    if (!offlineSince) return null;
    const now = new Date();
    const diff = now - offlineSince;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds };
  };

  const checkConnection = async () => {
    try {
      // Try to fetch a small resource to test connection
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnline,
    offlineSince,
    getOfflineDuration,
    checkConnection
  };
};

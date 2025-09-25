import React, { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

const OfflineBanner = ({ 
  show = true, 
  onRetry, 
  dismissible = true,
  className = "" 
}) => {
  const { isOffline } = useOffline();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOffline && show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOffline, show]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 shadow-lg ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              Network Connection Lost
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm opacity-90">
                Check your internet connection
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-1 px-3 py-1 bg-red-700 hover:bg-red-800 rounded-md transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-red-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;

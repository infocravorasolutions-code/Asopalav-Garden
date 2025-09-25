import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X, Signal, AlertTriangle } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

const OfflineOverlay = ({ 
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
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connection Lost
          </h2>
          <p className="text-gray-600">
            Your internet connection has been interrupted.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Signal className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">Network Status</span>
            </div>
            <span className="text-sm font-medium text-red-500">Disconnected</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">Connection Type</span>
            </div>
            <span className="text-sm font-medium text-red-500">WiFi/Mobile</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Quick Actions:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Check your WiFi connection</li>
            <li>• Try switching to mobile data</li>
            <li>• Restart your router</li>
            <li>• Contact your network provider</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
          
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              Continue Offline
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Panther Secure System • Offline Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineOverlay;

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Home, Signal, AlertTriangle } from 'lucide-react';

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (isOnline) {
    return null; // Don't show offline page when online
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Signal className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">Network Status</span>
            </div>
            <span className="text-sm font-medium text-red-500">Disconnected</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Wifi className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600">WiFi Connection</span>
            </div>
            <span className="text-sm font-medium text-red-500">Unavailable</span>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your WiFi connection</li>
                <li>• Try turning WiFi off and on</li>
                <li>• Check if your device has mobile data</li>
                <li>• Restart your router if possible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again ({retryCount})
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Panther Secure System • Offline Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;

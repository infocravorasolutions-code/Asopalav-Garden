import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, ArrowLeft, Clock, Database, AlertCircle } from 'lucide-react';

const FeatureOfflinePage = ({ 
  featureName = "This Feature", 
  onRetry, 
  onGoBack,
  showCachedData = false,
  lastSyncTime = null 
}) => {
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
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  if (isOnline) {
    return null; // Don't show offline page when online
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {featureName} is Unavailable
          </h1>
          <p className="text-gray-600">
            This feature requires an internet connection to work properly.
          </p>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-700">Connection Status</span>
            </div>
            <span className="text-sm font-medium text-red-500">Offline</span>
          </div>
          
          {lastSyncTime && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Last Sync</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Cached Data Notice */}
        {showCachedData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Cached Data Available
                </h3>
                <p className="text-sm text-blue-800">
                  You can view previously loaded data, but it may not be up to date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What You Can Do */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">
            What you can do:
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Try again when connection is restored</li>
            <li>• Use mobile data if WiFi is unavailable</li>
            <li>• Contact support if the issue persists</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again ({retryCount})
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
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

export default FeatureOfflinePage;

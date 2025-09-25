import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

const OfflineIndicator = ({ 
  showText = false, 
  className = "",
  size = "sm" 
}) => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`${sizeClasses[size]} bg-red-500 rounded-full animate-pulse`} />
      {showText && (
        <span className="text-xs text-red-600 font-medium">Offline</span>
      )}
    </div>
  );
};

export default OfflineIndicator;

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Globe, Clock, RefreshCw, Target } from 'lucide-react';
import { getLocationFromCoordinates, getPreciseNearbyLocation, formatCoordinates } from '../../utils/locationUtils';
import toast from 'react-hot-toast';

const LocationDisplay = ({ 
  latitude, 
  longitude, 
  address, 
  showCoordinates = true, 
  showMapLink = true,
  className = "",
  size = "default", // "small", "default", "large"
  usePreciseLocation = true // New prop to enable precise nearby location search
}) => {
  const [resolvedAddress, setResolvedAddress] = useState(address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [locationMode, setLocationMode] = useState(usePreciseLocation ? 'precise' : 'standard');

  // Size variants
  const sizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  // Resolve address from coordinates if not provided
  useEffect(() => {
    if (!address && latitude && longitude) {
      resolveAddress();
    } else if (address) {
      // Clean up old "Auto-detected:" prefix if present
      const cleanAddress = address.replace(/^Auto-detected:\s*/, '');
      setResolvedAddress(cleanAddress);
    }
  }, [latitude, longitude, address]);

  const resolveAddress = async () => {
    if (!latitude || !longitude) return;
    
    setIsLoading(true);
    try {
      let location;
      
      if (locationMode === 'precise') {
        // Use precise location detection
        location = await getPreciseNearbyLocation(latitude, longitude, 1000);
      } else {
        // Use standard location detection
        location = await getLocationFromCoordinates(latitude, longitude);
      }
      
      if (location) {
        setResolvedAddress(location);
        setLastUpdated(new Date());
      } else {
        setResolvedAddress('Location not available');
      }
    } catch (error) {
      console.error('Error resolving address:', error);
      setResolvedAddress('Location not available');
      toast.error('Failed to resolve location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    resolveAddress();
  };

  const openInMaps = () => {
    if (latitude && longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className={`${iconSizes[size]} text-secondary-400`} />
        <span className={`${sizeClasses[size]} text-secondary-600 flex items-center space-x-1`}>
          <RefreshCw className={`${iconSizes[size]} animate-spin`} />
          <span>Resolving {locationMode === 'precise' ? 'precise' : 'standard'} location...</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-2 group relative ${className}`}>
      <MapPin className={`${iconSizes[size]} text-secondary-400 flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1 min-w-0">
        {/* Address Display */}
        <div className="flex items-center space-x-2">
          <span 
            className={`${sizeClasses[size]} text-secondary-600 break-words cursor-help flex-1`}
            title={resolvedAddress || 'Location not available'}
          >
            {isLoading ? (
              <span className="flex items-center space-x-1">
                <RefreshCw className={`${iconSizes[size]} animate-spin`} />
                <span>Resolving {locationMode === 'precise' ? 'precise' : 'standard'} location...</span>
              </span>
            ) : (
              resolvedAddress || 'Location not available'
            )}
          </span>
          
          {/* Location Mode Toggle */}
          {/* {latitude && longitude && (
            <button
              onClick={() => {
                setLocationMode(locationMode === 'precise' ? 'standard' : 'precise');
                resolveAddress(); // Refresh with new mode
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary-100 rounded"
              title={`Switch to ${locationMode === 'precise' ? 'standard' : 'precise'} location mode`}
            >
              <Target className={`${iconSizes[size]} text-secondary-400 hover:text-secondary-600 ${
                locationMode === 'precise' ? 'text-blue-500' : 'text-secondary-400'
              }`} />
            </button>
          )} */}
          
          {/* Refresh Button */}
          {/* {latitude && longitude && (
            <button
              onClick={handleRefresh}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary-100 rounded"
              title="Refresh location"
            >
              <RefreshCw className={`${iconSizes[size]} text-secondary-400 hover:text-secondary-600`} />
            </button>
          )} */}
          
          {/* Map Link */}
          {showMapLink && latitude && longitude && (
            <button
              onClick={openInMaps}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-secondary-100 rounded"
              title="Open in Google Maps"
            >
              <Globe className={`${iconSizes[size]} text-blue-500 hover:text-blue-600`} />
            </button>
          )}
        </div>
        
        {/* Coordinates Display */}
        {showCoordinates && latitude && longitude && (
          <div className={`${sizeClasses[size]} text-secondary-400 font-mono mt-1`}>
            {formatCoordinates(latitude, longitude)}
          </div>
        )}
        
        {/* Last Updated */}
        {lastUpdated && (
          <div className={`${sizeClasses[size]} text-secondary-400 mt-1 flex items-center space-x-1`}>
            <Clock className={`${iconSizes[size]}`} />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDisplay;
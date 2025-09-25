import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Globe, Clock, RefreshCw, ExternalLink, Copy, Check, Ruler } from 'lucide-react';
import { getLocationFromCoordinates, getPreciseNearbyLocation } from '../../utils/locationUtils';
import { getGeoFencingConfig } from '../../config/staticConfig';
import toast from 'react-hot-toast';

const LocationDetailsModal = ({ isOpen, onClose, coordinates, locationName }) => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState(null);

  useEffect(() => {
    if (isOpen && coordinates) {
      resolveAddress();
      calculateDistanceToGeoFence();
    }
  }, [isOpen, coordinates]);

  // Calculate distance to geo-fence area
  const calculateDistanceToGeoFence = () => {
    if (!coordinates) return;

    const geoFencingConfig = getGeoFencingConfig();
    const riverfrontLine = geoFencingConfig.riverfrontLine;
    
    // Calculate distance to the riverfront line (start and end points)
    const distanceToStart = calculateDistance(
      coordinates.latitude, 
      coordinates.longitude, 
      riverfrontLine.startPoint.latitude, 
      riverfrontLine.startPoint.longitude
    );
    
    const distanceToEnd = calculateDistance(
      coordinates.latitude, 
      coordinates.longitude, 
      riverfrontLine.endPoint.latitude, 
      riverfrontLine.endPoint.longitude
    );
    
    // Calculate distance to the center of the geo-fence area
    const mainAreaCenter = geoFencingConfig.mainArea.center;
    const distanceToCenter = calculateDistance(
      coordinates.latitude, 
      coordinates.longitude, 
      mainAreaCenter.latitude, 
      mainAreaCenter.longitude
    );
    
    // Determine if within geo-fence (within main area radius)
    const isWithinGeoFence = distanceToCenter <= (geoFencingConfig.mainArea.radius / 1000); // Convert to km
    
    setDistanceInfo({
      distanceToStart: Math.round(distanceToStart),
      distanceToEnd: Math.round(distanceToEnd),
      distanceToCenter: Math.round(distanceToCenter),
      isWithinGeoFence,
      geoFenceRadius: Math.round(geoFencingConfig.mainArea.radius / 1000) // Convert to km
    });
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  };

  const resolveAddress = async () => {
    if (!coordinates?.latitude || !coordinates?.longitude) return;
    
    setIsLoading(true);
    try {
      const location = await getPreciseNearbyLocation(coordinates.latitude, coordinates.longitude, 1000);
      setAddress(location || 'Location not available');
    } catch (error) {
      console.error('Error resolving address:', error);
      setAddress('Location not available');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCoordinates = async () => {
    if (coordinates) {
      const coordText = `${coordinates.latitude}, ${coordinates.longitude}`;
      try {
        await navigator.clipboard.writeText(coordText);
        setCopied(true);
        toast.success('Coordinates copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy coordinates');
      }
    }
  };

  const openInMaps = () => {
    if (coordinates) {
      const mapsUrl = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {locationName || 'Location Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Coordinates */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Coordinates</h4>
              <button
                onClick={copyCoordinates}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-sm text-gray-600 font-mono">
              <div>Latitude: {coordinates?.latitude?.toFixed(6)}</div>
              <div>Longitude: {coordinates?.longitude?.toFixed(6)}</div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Address</h4>
              <button
                onClick={resolveAddress}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Resolving address...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {address || 'Address not available'}
              </div>
            )}
          </div>

          {/* Distance to Geo-Fence */}
          {distanceInfo && (
            <div className={`rounded-lg p-4 ${distanceInfo.isWithinGeoFence ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Ruler className={`h-5 w-5 ${distanceInfo.isWithinGeoFence ? 'text-green-600' : 'text-orange-600'}`} />
                <h4 className={`font-medium ${distanceInfo.isWithinGeoFence ? 'text-green-900' : 'text-orange-900'}`}>
                  Distance to Geo-Fence
                </h4>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className={`flex justify-between ${distanceInfo.isWithinGeoFence ? 'text-green-700' : 'text-orange-700'}`}>
                  <span>Status:</span>
                  <span className="font-medium">
                    {distanceInfo.isWithinGeoFence ? '✅ Within Geo-Fence' : '⚠️ Outside Geo-Fence'}
                  </span>
                </div>
                
                <div className={`flex justify-between ${distanceInfo.isWithinGeoFence ? 'text-green-700' : 'text-orange-700'}`}>
                  <span>Distance to Center:</span>
                  <span className="font-medium">{distanceInfo.distanceToCenter}m</span>
                </div>
                
                <div className={`flex justify-between ${distanceInfo.isWithinGeoFence ? 'text-green-700' : 'text-orange-700'}`}>
                  <span>Geo-Fence Radius:</span>
                  <span className="font-medium">{distanceInfo.geoFenceRadius}km</span>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <div>Distance to Ellis Bridge: {distanceInfo.distanceToStart}m</div>
                    <div>Distance to Torrent Power: {distanceInfo.distanceToEnd}m</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={openInMaps}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Maps</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailsModal;

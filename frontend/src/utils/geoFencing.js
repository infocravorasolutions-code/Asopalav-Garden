// Geo-Fencing Implementation for Sabarmati Riverfront Security Zone

// Define the riverfront geo-fence area
export const RIVERFRONT_GEOFENCE = {
  startPoint: {
    lat: 23.0224,
    lng: 72.5745,
    name: "Ellis Bridge"
  },
  endPoint: {
    lat: 23.0702,
    lng: 72.5925,
    name: "Torrent Power Limited"
  },
  lengthKm: 10,
  widthKm: 1,
  bufferMeters: 50
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Calculate distance from a point to a line segment
 * @param {object} point - Point with lat/lng properties
 * @param {object} lineStart - Start point of line with lat/lng properties
 * @param {object} lineEnd - End point of line with lat/lng properties
 * @returns {number} Distance in meters
 */
export const distanceToLineSegment = (point, lineStart, lineEnd) => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return calculateDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
  }

  let param = dot / lenSq;
  let xx, yy;

  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  return calculateDistance(point.lat, point.lng, xx, yy);
};

/**
 * Validate if a location is within the Sabarmati Riverfront area
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {object} Validation result with details
 */
export const isWithinRiverfrontArea = (latitude, longitude) => {
  try {
    const userPoint = { lat: latitude, lng: longitude };
    
    // Validate coordinates
    if (!latitude || !longitude || 
        isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return {
        isValid: false,
        reason: "Invalid coordinates provided",
        distance: null,
        nearestPoint: null,
        error: "Invalid coordinates"
      };
    }

    // Calculate distance to riverfront line
    const distanceToRiverfront = distanceToLineSegment(
      userPoint,
      RIVERFRONT_GEOFENCE.startPoint,
      RIVERFRONT_GEOFENCE.endPoint
    );

    // Check if within allowed width (1km + 50m buffer)
    const maxAllowedDistance = (RIVERFRONT_GEOFENCE.widthKm * 1000) + RIVERFRONT_GEOFENCE.bufferMeters;
    const isWithinWidth = distanceToRiverfront <= maxAllowedDistance;

    // Calculate distances to start and end points
    const distanceToStart = calculateDistance(
      latitude, longitude,
      RIVERFRONT_GEOFENCE.startPoint.lat, RIVERFRONT_GEOFENCE.startPoint.lng
    );
    const distanceToEnd = calculateDistance(
      latitude, longitude,
      RIVERFRONT_GEOFENCE.endPoint.lat, RIVERFRONT_GEOFENCE.endPoint.lng
    );

    // Check if within the length of the riverfront area
    const riverfrontLength = calculateDistance(
      RIVERFRONT_GEOFENCE.startPoint.lat, RIVERFRONT_GEOFENCE.startPoint.lng,
      RIVERFRONT_GEOFENCE.endPoint.lat, RIVERFRONT_GEOFENCE.endPoint.lng
    );
    
    const lengthBuffer = 2000; // 2km buffer for length
    const isWithinLength = (distanceToStart <= riverfrontLength + lengthBuffer) && 
                          (distanceToEnd <= riverfrontLength + lengthBuffer);

    const isValid = isWithinWidth && isWithinLength;

    // Determine nearest landmark
    let nearestPoint = RIVERFRONT_GEOFENCE.startPoint.name;
    if (distanceToEnd < distanceToStart) {
      nearestPoint = RIVERFRONT_GEOFENCE.endPoint.name;
    }

    return {
      isValid,
      reason: isValid ? "Location approved - within riverfront area" : 
              !isWithinWidth ? `Too far from riverfront (${Math.round(distanceToRiverfront)}m away, max ${Math.round(maxAllowedDistance)}m)` :
              !isWithinLength ? "Outside the designated riverfront zone" :
              "Location not within designated area",
      distance: Math.round(distanceToRiverfront),
      distanceToStart: Math.round(distanceToStart),
      distanceToEnd: Math.round(distanceToEnd),
      nearestPoint,
      coordinates: { lat: latitude, lng: longitude },
      area: {
        name: "Sabarmati Riverfront Security Zone",
        startPoint: RIVERFRONT_GEOFENCE.startPoint,
        endPoint: RIVERFRONT_GEOFENCE.endPoint,
        maxWidth: maxAllowedDistance
      }
    };

  } catch (error) {
    console.error('❌ [geoFencing] Error in geo-fence validation:', error);
    return {
      isValid: false,
      reason: "Error validating location",
      distance: null,
      nearestPoint: null,
      error: error.message
    };
  }
};

/**
 * Get current location using browser Geolocation API or WebView injection
 * @param {object} options - Geolocation options
 * @returns {Promise<object>} Location coordinates with accuracy
 */
export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if in WebView and location is injected
    const isWebView = window.ReactNativeWebView !== undefined;
    
    if (isWebView && window.injectedLocation) {
      console.log('📱 [geoFencing] Using WebView injected location');
      resolve({
        latitude: window.injectedLocation.latitude,
        longitude: window.injectedLocation.longitude,
        accuracy: window.injectedLocation.accuracy || 10,
        source: 'webview'
      });
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      ...options
    };

    console.log('🌐 [geoFencing] Getting location from browser API');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          source: 'browser'
        };
        
        console.log('✅ [geoFencing] Location obtained:', {
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy
        });
        
        resolve(location);
      },
      (error) => {
        console.error('❌ [geoFencing] Geolocation error:', error);
        
        let errorMessage = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unknown location error';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    console.log('📍 [geoFencing] Getting address for coordinates:', { lat, lng });
    
    // Use OpenStreetMap Nominatim (free service)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PantherSecurity/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data.display_name) {
      const fullAddress = data.display_name;
      
      // Truncate very long addresses
      if (fullAddress.length > 100) {
        const addressParts = fullAddress.split(', ');
        const relevantParts = addressParts.slice(0, 6).join(', ');
        return relevantParts;
      }
      
      return fullAddress;
    }
    
    // Fallback to structured address
    if (data.address) {
      const address = data.address;
      const addressParts = [];
      
      if (address.building) addressParts.push(address.building);
      if (address.road) addressParts.push(address.road);
      if (address.suburb) addressParts.push(address.suburb);
      if (address.city) addressParts.push(address.city);
      if (address.state) addressParts.push(address.state);
      if (address.postcode) addressParts.push(address.postcode);
      if (address.country) addressParts.push(address.country);
      
      const formattedAddress = addressParts.join(', ');
      return formattedAddress || 'Address not available';
    }
    
    return 'Address not available';
    
  } catch (error) {
    console.error('❌ [geoFencing] Error getting address:', error);
    return 'Address not available';
  }
};

/**
 * Watch location changes with geo-fencing validation
 * @param {function} callback - Callback function for location updates
 * @param {object} options - Watch options
 * @returns {number} Watch ID for clearing
 */
export const watchLocationWithGeoFencing = (callback, options = {}) => {
  if (!navigator.geolocation) {
    callback({ error: 'Geolocation not supported' });
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 10000,
    ...options
  };

  console.log('👁️ [geoFencing] Starting location watch with geo-fencing');

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        // Perform geo-fence validation
        const geoFenceResult = isWithinRiverfrontArea(location.latitude, location.longitude);
        
        // Get address
        let address = 'Location not available';
        try {
          address = await getAddressFromCoordinates(location.latitude, location.longitude);
        } catch (addressError) {
          console.warn('⚠️ [geoFencing] Address lookup failed:', addressError);
        }

        callback({
          ...location,
          address,
          geoFence: geoFenceResult,
          isValid: geoFenceResult.isValid
        });

      } catch (error) {
        console.error('❌ [geoFencing] Watch location error:', error);
        callback({ error: error.message });
      }
    },
    (error) => {
      console.error('❌ [geoFencing] Watch position error:', error);
      callback({ error: error.message });
    },
    defaultOptions
  );

  return watchId;
};

/**
 * Stop watching location
 * @param {number} watchId - Watch ID to clear
 */
export const stopLocationWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    console.log('🛑 [geoFencing] Location watch stopped');
  }
};

/**
 * Get battery level (if available)
 * @returns {Promise<number|null>} Battery level percentage
 */
export const getBatteryLevel = async () => {
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    }
    return null;
  } catch (error) {
    console.warn('⚠️ [geoFencing] Battery API not available:', error);
    return null;
  }
};

/**
 * Get formatted area information for display
 * @returns {object} Area information
 */
export const getAreaInfo = () => {
  return {
    name: "Sabarmati Riverfront Security Zone",
    description: "10km riverfront area with 1km width coverage",
    landmarks: [
      {
        name: RIVERFRONT_GEOFENCE.startPoint.name,
        coordinates: RIVERFRONT_GEOFENCE.startPoint,
        type: "start"
      },
      {
        name: RIVERFRONT_GEOFENCE.endPoint.name,
        coordinates: RIVERFRONT_GEOFENCE.endPoint,
        type: "end"
      }
    ],
    boundaries: {
      length: `${RIVERFRONT_GEOFENCE.lengthKm} km`,
      width: `${RIVERFRONT_GEOFENCE.widthKm} km`,
      buffer: `${RIVERFRONT_GEOFENCE.bufferMeters} meters`
    }
  };
};

/**
 * Validate coordinates format
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
export const isValidCoordinates = (lat, lng) => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return 'Unknown';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

export default {
  RIVERFRONT_GEOFENCE,
  isWithinRiverfrontArea,
  getCurrentLocation,
  getAddressFromCoordinates,
  watchLocationWithGeoFencing,
  stopLocationWatch,
  getBatteryLevel,
  calculateDistance,
  distanceToLineSegment,
  getAreaInfo,
  isValidCoordinates,
  formatDistance
};

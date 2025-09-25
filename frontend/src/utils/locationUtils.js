// Location utilities for handling coordinates and address conversion
import toast from 'react-hot-toast';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/**
 * Reverse geocode coordinates to get human-readable address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Human-readable address
 */
export const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    return 'Coordinates not available';
  }

  // Ensure coordinates are numbers
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates provided:', { latitude, longitude });
    return 'Invalid coordinates';
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured. Please set REACT_APP_GOOGLE_MAPS_API_KEY environment variable.');
    return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  try {
    // Check if we're in development (localhost) - Google APIs have CORS issues in dev
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      console.log('⚠️ Development environment detected. Using OpenStreetMap fallback...');
      return await getOpenStreetMapLocation(lat, lng);
    }
    
    // Try multiple geocoding strategies for better precision
    let data = null;
    let response = null;
    
    // Strategy 1: Try to get the most specific result possible
    const strategies = [
      // Most specific - look for exact addresses and establishments
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&result_type=street_address|establishment|premise|point_of_interest`,
      // Medium specific - look for routes and neighborhoods
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&result_type=route|neighborhood|sublocality`,
      // General - get any result
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    ];

    for (const strategy of strategies) {
      try {
        response = await fetch(strategy);
        data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          console.log(`✅ Geocoding successful with strategy: ${strategy.includes('result_type') ? 'specific' : 'general'}`);
          break;
        } else {
          console.warn(`⚠️ Strategy failed: ${data.status} - ${data.error_message || 'No results'}`);
        }
      } catch (error) {
        console.warn(`⚠️ Strategy error:`, error);
        continue;
      }
    }

    if (!data || data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('⚠️ All Google geocoding strategies failed, falling back to OpenStreetMap');
      return await getOpenStreetMapLocation(lat, lng);
    }

    // Process the best result
    const result = data.results[0];
    const addressComponents = result.address_components;
    const formattedAddress = result.formatted_address;
    
    console.log('📍 Google Geocoding result:', {
      formatted_address: formattedAddress,
      types: result.types,
      place_id: result.place_id
    });

    // Try to extract the most specific location name
    let specificLocation = '';
    
    // Look for specific place types first
    if (result.types.includes('establishment') || result.types.includes('point_of_interest')) {
      // This is a specific business or landmark
      specificLocation = addressComponents.find(comp => 
        comp.types.includes('establishment') || 
        comp.types.includes('point_of_interest')
      )?.long_name || formattedAddress.split(',')[0];
    } else if (result.types.includes('street_address') || result.types.includes('premise')) {
      // This is a specific address
      const streetNumber = addressComponents.find(comp => comp.types.includes('street_number'))?.long_name;
      const route = addressComponents.find(comp => comp.types.includes('route'))?.long_name;
      specificLocation = streetNumber && route ? `${streetNumber} ${route}` : formattedAddress.split(',')[0];
    } else if (result.types.includes('route')) {
      // This is a street/road
      specificLocation = addressComponents.find(comp => comp.types.includes('route'))?.long_name || formattedAddress.split(',')[0];
    } else if (result.types.includes('neighborhood') || result.types.includes('sublocality')) {
      // This is a neighborhood
      specificLocation = addressComponents.find(comp => 
        comp.types.includes('neighborhood') || comp.types.includes('sublocality')
      )?.long_name || formattedAddress.split(',')[0];
    } else {
      // Fallback to first part of formatted address
      specificLocation = formattedAddress.split(',')[0];
    }

    // Clean up the location name
    specificLocation = specificLocation.trim();
    
    // If the location is too generic, try to get more context
    if (specificLocation.length < 5 || specificLocation.toLowerCase().includes('ahmedabad')) {
      const parts = formattedAddress.split(',');
      if (parts.length > 1) {
        specificLocation = parts.slice(0, 2).join(', ').trim();
      }
    }

    console.log('📍 Final location:', specificLocation);
    return specificLocation;

  } catch (error) {
    console.error('❌ Google geocoding failed:', error);
    console.log('🔄 Falling back to OpenStreetMap...');
    return await getOpenStreetMapLocation(lat, lng);
  }
};

/**
 * Fallback to OpenStreetMap for geocoding (works in development)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Human-readable address
 */
const getOpenStreetMapLocation = async (lat, lng) => {
  try {
    console.log('🌍 Using OpenStreetMap for geocoding...');
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📍 OpenStreetMap response:', data);
    
    if (data.display_name) {
      const fullAddress = data.display_name;
      console.log('📍 Full address:', fullAddress);
      
      // Check if the location is in Ahmedabad/Gujarat
      const isAhmedabad = fullAddress.toLowerCase().includes('ahmedabad') || 
                         fullAddress.toLowerCase().includes('gujarat');
      
      if (!isAhmedabad) {
        console.warn('⚠️ Location does not appear to be in Ahmedabad:', fullAddress);
      }
      
      // Try to get a more specific location
      let specificLocation = '';
      
      if (data.address) {
        const addr = data.address;
        // Priority order for Ahmedabad areas
        if (addr.suburb && addr.suburb !== 'Ahmedabad') {
          specificLocation = addr.suburb;
        } else if (addr.neighbourhood && addr.neighbourhood !== 'Ahmedabad') {
          specificLocation = addr.neighbourhood;
        } else if (addr.village && addr.village !== 'Ahmedabad') {
          specificLocation = addr.village;
        } else if (addr.road) {
          specificLocation = addr.road;
        } else if (addr.city && addr.city !== 'Ahmedabad') {
          specificLocation = addr.city;
        }
      }
      
      if (specificLocation) {
        console.log('📍 Specific location found:', specificLocation);
        return specificLocation;
      }
      
      // Fallback to truncated full address
      if (fullAddress.length > 100) {
        const addressParts = fullAddress.split(', ');
        const relevantParts = addressParts.slice(0, 4).join(', '); // Reduced to 4 parts
        console.log('📍 Truncated address:', relevantParts);
        return relevantParts;
      }
      
      return fullAddress;
    }
    
    console.warn('⚠️ No display_name in response');
    return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
  } catch (error) {
    console.error('❌ OpenStreetMap geocoding failed:', error);
    return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

/**
 * Format coordinates for display
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude) => {
  if (!latitude || !longitude) return 'No coordinates';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Get location from coordinates (alias for reverseGeocode)
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Human-readable address
 */
export const getLocationFromCoordinates = reverseGeocode;

/**
 * Get precise nearby location using enhanced detection
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {number} radiusMeters - Search radius in meters
 * @returns {Promise<string>} Precise location name
 */
export const getPreciseNearbyLocation = async (latitude, longitude, radiusMeters = 500) => {
  try {
    console.log(`🔍 Getting precise location for coordinates: ${latitude}, ${longitude}`);
    
    // First try Google Places API for nearby places
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const nearbyPlaces = await getNearbyPlaces(latitude, longitude, radiusMeters);
        if (nearbyPlaces && nearbyPlaces.length > 0) {
          const closestPlace = nearbyPlaces[0];
          console.log('✅ Found nearby place:', closestPlace.name);
          return `Near: ${closestPlace.name}`;
        }
      } catch (error) {
        console.log('⚠️ Google Places API failed, trying geocoding:', error.message);
      }
    }
    
    // Fallback to enhanced geocoding
    const location = await reverseGeocode(latitude, longitude);
    
    if (location && !location.includes('Coordinates:')) {
      console.log('✅ Found location via geocoding:', location);
      return location;
    }
    
    console.log('⚠️ No specific location found, using coordinates');
    return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
  } catch (error) {
    console.error('❌ Error getting precise location:', error);
    return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get nearby places using Google Places API
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {number} radiusMeters - Search radius in meters
 * @returns {Promise<Array>} Array of nearby places
 */
const getNearbyPlaces = async (latitude, longitude, radiusMeters = 500) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results.map(place => ({
        name: place.name,
        vicinity: place.vicinity,
        types: place.types,
        rating: place.rating,
        place_id: place.place_id
      }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ Google Places API error:', error);
    return [];
  }
};

/**
 * Debug function for location detection
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Debug information
 */
export const debugPreciseLocation = async (latitude, longitude) => {
  // Getting location for coordinates
  
  try {
    // Try Google Places first
    if (GOOGLE_MAPS_API_KEY) {
      // Trying Google Places API
      const nearbyPlaces = await getNearbyPlaces(latitude, longitude, 200);
      // Google Places results
      
      if (nearbyPlaces && nearbyPlaces.length > 0) {
        const closestPlace = nearbyPlaces[0];
        // Found nearby place
        return `Near: ${closestPlace.name}`;
      }
    }
    
    // Try geocoding
    const location = await reverseGeocode(latitude, longitude);
    // Geocoding result
    
    if (location && !location.includes('Coordinates:')) {
      // Found location
      return location;
    }
    
    // No location found, using coordinates
    return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('🔍 Debug: Error getting location:', error);
    return `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

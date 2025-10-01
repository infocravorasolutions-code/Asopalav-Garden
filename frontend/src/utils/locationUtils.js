// Default fallback coordinates (Ahmedabad, Gujarat, India)
const DEFAULT_COORDINATES = {
    latitude: 23.0341367,
    longitude: 72.5723255,
    address: 'Ahmedabad, Gujarat, India'
};

/**
 * Get current location with fallback to default coordinates
 * @param {Object} options - Options for geolocation
 * @returns {Promise<Object>} Location object with coordinates and address
 */
export const getCurrentLocationWithFallback = async (options = {}) => {
    const defaultOptions = {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000 // 5 minutes
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Check if geolocation is supported
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser, using default location');
        return {
            success: false,
            coordinates: DEFAULT_COORDINATES,
            address: DEFAULT_COORDINATES.address,
            isFallback: true
        };
    }

    try {
        // Try to get current position
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, finalOptions);
        });

        const { latitude, longitude } = position.coords;
        
        // Try to get address from coordinates
        let address = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            if (data.locality) {
                const addressParts = [];
                if (data.locality && typeof data.locality === 'string') addressParts.push(data.locality);
                if (data.principalSubdivision && typeof data.principalSubdivision === 'string') addressParts.push(data.principalSubdivision);
                if (data.countryName && typeof data.countryName === 'string') addressParts.push(data.countryName);
                if (data.postcode && typeof data.postcode === 'string') addressParts.push(data.postcode);
                if (data.city && typeof data.city === 'string') addressParts.push(data.city);
                if (data.administrativeArea && typeof data.administrativeArea === 'string') addressParts.push(data.administrativeArea);

                address = addressParts.join(', ');
            }
        } catch (error) {
            console.log('Could not get address from coordinates, using coordinates as location');
        }

        return {
            success: true,
            coordinates: { latitude, longitude },
            address,
            isFallback: false
        };

    } catch (error) {
        console.warn('Could not get current location, using default location:', error.message);
        
        return {
            success: false,
            coordinates: DEFAULT_COORDINATES,
            address: DEFAULT_COORDINATES.address,
            isFallback: true
        };
    }
};

/**
 * Get location with automatic fallback
 * This function will always return a location, either real or default
 */
export const getLocationWithAutoFallback = async (options = {}) => {
    const result = await getCurrentLocationWithFallback(options);
    
    // Always return the location, whether it's real or fallback
    return {
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
        address: result.address,
        isFallback: result.isFallback,
        success: true // Always true since we have a fallback
    };
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latitude, longitude) => {
    return `${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E`;
};

/**
 * Get default location for testing
 */
export const getDefaultLocation = () => {
    return {
        latitude: DEFAULT_COORDINATES.latitude,
        longitude: DEFAULT_COORDINATES.longitude,
        address: DEFAULT_COORDINATES.address,
        isFallback: true
    };
};

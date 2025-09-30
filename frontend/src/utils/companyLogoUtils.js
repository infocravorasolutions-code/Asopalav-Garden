/**
 * Utility functions for handling company logos
 */

/**
 * Get company logo path based on company code
 * @param {string} companyCode - The company code
 * @returns {string} - Path to the company logo
 */
export const getCompanyLogoPath = (companyCode) => {
    if (!companyCode) {
        return null;
    }

    // Convert company code to uppercase for filename matching
    const normalizedCode = companyCode.toUpperCase();

    // Map company codes to their logo filenames
    const logoMap = {
        'HARIKRISHNA': 'HARIKRISHNA.jpg',
        'NEELKANTH': 'NEELKANTH.jpg',
        'NILKANTH': 'NEELKANTH.jpg', // Alternative spelling
        // Add more company codes as needed
    };

    const logoFileName = logoMap[normalizedCode];

    if (logoFileName) {
        // Return the path to the logo in the company-logo folder
        return `/src/company-logo/${logoFileName}`;
    }

    return null;
};

/**
 * Get company logo with fallback
 * @param {string} companyCode - The company code
 * @param {string} fallbackLogoUrl - Fallback logo URL from database
 * @returns {string|null} - Path to the company logo or fallback
 */
export const getCompanyLogo = (companyCode, fallbackLogoUrl = null) => {
    const logoPath = getCompanyLogoPath(companyCode);

    if (logoPath) {
        return logoPath;
    }

    // Return fallback logo URL if available
    return fallbackLogoUrl;
};

/**
 * Check if a company logo exists
 * @param {string} companyCode - The company code
 * @returns {boolean} - Whether the logo exists
 */
export const companyLogoExists = (companyCode) => {
    return getCompanyLogoPath(companyCode) !== null;
};

/**
 * Get all available company logos
 * @returns {Array} - Array of available company codes
 */
export const getAvailableCompanyLogos = () => {
    return ['HARIKRISHNA', 'NEELKANTH'];
};

/**
 * Utility functions for handling company logos
 */

const DEFAULT_LOGO = 'mahakali-logo.png';

/**
 * Get company logo path based on company code
 * @param {string} companyCode - The company code
 * @returns {string} - Path to the company logo
 */
export const getCompanyLogoPath = (companyCode) => {
    const logoMap = {
        'HARIKRISHNA': 'HARIKRISHNA.jpg',
        'ASOPALAV': DEFAULT_LOGO,
        'MAHAKALI': DEFAULT_LOGO,
    };

    if (!companyCode) {
        return `/assets/${DEFAULT_LOGO}`;
    }

    const logoFileName = logoMap[companyCode.toUpperCase()] || DEFAULT_LOGO;
    return `/assets/${logoFileName}`;
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
    return fallbackLogoUrl || `/assets/${DEFAULT_LOGO}`;
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
    return ['HARIKRISHNA', 'ASOPALAV', 'MAHAKALI'];
};

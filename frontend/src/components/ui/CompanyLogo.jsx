import React from 'react';
import { Building } from 'lucide-react';
import { getCompanyLogo } from '../../utils/companyLogoUtils';

const CompanyLogo = ({
    companyCode,
    fallbackLogoUrl = null,
    size = 'md',
    className = '',
    showFallback = true,
    style = {},
    noContainer = false
}) => {
    const logoUrl = getCompanyLogo(companyCode, fallbackLogoUrl);

    // Size classes
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
        '2xl': 'w-20 h-20'
    };

    const iconSizes = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
        '2xl': 'h-10 w-10'
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const iconSize = iconSizes[size] || iconSizes.md;

    if (logoUrl) {
        const containerClasses = noContainer ? '' : 'relative';
        const imageClasses = noContainer
            ? `${className} object-contain`
            : `${sizeClass} rounded-lg object-contain border border-gray-200 shadow-sm bg-white`;

        return (
            <div className={containerClasses}>
                <img
                    src={logoUrl}
                    alt={`${companyCode} Logo`}
                    className={imageClasses}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        ...style
                    }}
                    onError={(e) => {
                        // Hide image and show fallback if error
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                        }
                    }}
                />
                {showFallback && !noContainer && (
                    <div
                        className={`${sizeClass} rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200 shadow-sm hidden`}
                        style={{
                            padding: '4px',
                            boxSizing: 'border-box',
                            ...style
                        }}
                    >
                        <Building className={`${iconSize} text-gray-500`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    </div>
                )}
            </div>
        );
    }

    if (showFallback) {
        return (
            <div
                className={`${sizeClass} rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200 shadow-sm ${className}`}
                style={{
                    padding: '4px',
                    boxSizing: 'border-box',
                    ...style
                }}
            >
                <Building
                    className={`${iconSize} text-gray-500`}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
            </div>
        );
    }

    return null;
};

export default CompanyLogo;

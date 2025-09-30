import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCompanyLogo } from '../utils/companyLogoUtils';

const CompanyThemeContext = createContext();

export const useCompanyTheme = () => {
  const context = useContext(CompanyThemeContext);
  if (!context) {
    throw new Error('useCompanyTheme must be used within a CompanyThemeProvider');
  }
  return context;
};

export const CompanyThemeProvider = ({ children }) => {
  const { company, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState({
    // Default theme
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    backgroundColor: '#F8FAFC',
    textColor: '#1F2937',
    fontFamily: 'Inter',
    logo: null,
    logoUrl: null,
    companyName: 'Company',
    companyCode: '',
    mode: 'light',
    borderRadius: '8px',
    shadow: 'sm',
    spacing: 'comfortable'
  });

  // Update theme when company data changes
  useEffect(() => {
    try {
      if (company && isAuthenticated) {
        const newTheme = {
          primaryColor: company.primaryColor || '#3B82F6',
          secondaryColor: company.secondaryColor || '#1E40AF',
          accentColor: company.accentColor || '#F59E0B',
          backgroundColor: company.backgroundColor || '#F8FAFC',
          textColor: company.textColor || '#1F2937',
          fontFamily: company.fontFamily || 'Inter',
          logo: company.logo || null,
          logoUrl: getCompanyLogo(company.code, company.logoUrl) || null,
          companyName: company.name || 'Company',
          companyCode: company.code || '',
          mode: company.theme?.mode || 'light',
          borderRadius: company.theme?.borderRadius || '8px',
          shadow: company.theme?.shadow || 'sm',
          spacing: company.theme?.spacing || 'comfortable',
          // Additional company details
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          industry: company.industry || '',
          description: company.description || '',
          address: company.address || '',
          timezone: company.timezone || 'Asia/Kolkata',
          settings: company.settings || {}
        };

        setTheme(newTheme);

        // Apply theme to document root
        applyThemeToDocument(newTheme);
      }
    } catch (error) {
      console.error('Error updating company theme:', error);
    }
  }, [company, isAuthenticated]);

  // Apply theme styles to document
  const applyThemeToDocument = (themeData) => {
    try {
      const root = document.documentElement;

      // Set CSS custom properties
      root.style.setProperty('--company-primary', themeData.primaryColor);
      root.style.setProperty('--company-secondary', themeData.secondaryColor);
      root.style.setProperty('--company-accent', themeData.accentColor);
      root.style.setProperty('--company-background', themeData.backgroundColor);
      root.style.setProperty('--company-text', themeData.textColor);
      root.style.setProperty('--company-font', themeData.fontFamily);
      root.style.setProperty('--company-border-radius', themeData.borderRadius);

      // Apply font family to body
      document.body.style.fontFamily = themeData.fontFamily;

      // Apply theme mode class
      document.body.className = `theme-${themeData.mode}`;
    } catch (error) {
      console.error('Error applying theme to document:', error);
    }
  };

  // Generate CSS variables for Tailwind
  const generateTailwindConfig = () => {
    return {
      colors: {
        primary: {
          50: lightenColor(theme.primaryColor, 0.9),
          100: lightenColor(theme.primaryColor, 0.8),
          200: lightenColor(theme.primaryColor, 0.6),
          300: lightenColor(theme.primaryColor, 0.4),
          400: lightenColor(theme.primaryColor, 0.2),
          500: theme.primaryColor,
          600: darkenColor(theme.primaryColor, 0.2),
          700: darkenColor(theme.primaryColor, 0.4),
          800: darkenColor(theme.primaryColor, 0.6),
          900: darkenColor(theme.primaryColor, 0.8),
        },
        secondary: {
          50: lightenColor(theme.secondaryColor, 0.9),
          100: lightenColor(theme.secondaryColor, 0.8),
          200: lightenColor(theme.secondaryColor, 0.6),
          300: lightenColor(theme.secondaryColor, 0.4),
          400: lightenColor(theme.secondaryColor, 0.2),
          500: theme.secondaryColor,
          600: darkenColor(theme.secondaryColor, 0.2),
          700: darkenColor(theme.secondaryColor, 0.4),
          800: darkenColor(theme.secondaryColor, 0.6),
          900: darkenColor(theme.secondaryColor, 0.8),
        },
        accent: {
          50: lightenColor(theme.accentColor, 0.9),
          100: lightenColor(theme.accentColor, 0.8),
          200: lightenColor(theme.accentColor, 0.6),
          300: lightenColor(theme.accentColor, 0.4),
          400: lightenColor(theme.accentColor, 0.2),
          500: theme.accentColor,
          600: darkenColor(theme.accentColor, 0.2),
          700: darkenColor(theme.accentColor, 0.4),
          800: darkenColor(theme.accentColor, 0.6),
          900: darkenColor(theme.accentColor, 0.8),
        }
      }
    };
  };

  // Helper functions for color manipulation
  const lightenColor = (color, amount) => {
    // Simple color lightening - in production, use a proper color library
    return color;
  };

  const darkenColor = (color, amount) => {
    // Simple color darkening - in production, use a proper color library
    return color;
  };

  const value = {
    theme,
    setTheme,
    applyThemeToDocument,
    generateTailwindConfig,
    // Company info
    companyName: theme.companyName,
    companyCode: theme.companyCode,
    logo: theme.logo,
    logoUrl: theme.logoUrl,
    // Theme colors
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    // Additional company details
    phone: theme.phone,
    email: theme.email,
    website: theme.website,
    industry: theme.industry,
    description: theme.description,
    address: theme.address,
    timezone: theme.timezone,
    settings: theme.settings
  };

  try {
    return (
      <CompanyThemeContext.Provider value={value}>
        {children}
      </CompanyThemeContext.Provider>
    );
  } catch (error) {
    console.error('Error in CompanyThemeProvider:', error);
    return <div>Error loading theme</div>;
  }
};

export default CompanyThemeContext;

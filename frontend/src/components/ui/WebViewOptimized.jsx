import React, { useEffect, useState } from 'react';

/**
 * WebViewOptimized Component
 * Provides optimizations for React Native WebView compatibility
 */
const WebViewOptimized = ({ children, className = '', ...props }) => {
  const [isWebView, setIsWebView] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    // Detect if running in WebView
    const detectWebView = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Check for React Native WebView
      if (userAgent.includes('ReactNativeWebView')) {
        setIsWebView(true);
        return;
      }
      
      // Check for other WebView indicators
      if (userAgent.includes('wv') || 
          (window.ReactNativeWebView !== undefined) ||
          (window.webkit && window.webkit.messageHandlers)) {
        setIsWebView(true);
      }
    };

    // Detect screen size
    const detectScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    detectWebView();
    detectScreenSize();

    // Listen for resize events
    const handleResize = () => {
      detectScreenSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply WebView-specific optimizations
  const webViewClasses = isWebView ? 'webview-optimized' : '';
  const screenClasses = `screen-${screenSize}`;

  return (
    <div 
      className={`${webViewClasses} ${screenClasses} ${className}`}
      data-webview={isWebView}
      data-screen-size={screenSize}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Touch-friendly button component
 */
export const TouchButton = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  ...props 
}) => {
  const baseClasses = 'touch-manipulation select-none';
  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2 text-base',
    lg: 'min-h-[52px] px-6 py-3 text-lg'
  };
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Responsive grid component
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '4',
  className = ''
}) => {
  const gridClasses = `
    grid gap-${gap}
    grid-cols-${cols.mobile}
    sm:grid-cols-${cols.tablet}
    lg:grid-cols-${cols.desktop}
    ${className}
  `;

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

/**
 * Mobile-optimized card component
 */
export const MobileCard = ({ 
  children, 
  className = '',
  padding = 'default',
  ...props 
}) => {
  const paddingClasses = {
    sm: 'p-3',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Responsive text component
 */
export const ResponsiveText = ({ 
  children, 
  size = 'base',
  weight = 'normal',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  return (
    <span className={`${sizeClasses[size]} ${weightClasses[weight]} ${className}`}>
      {children}
    </span>
  );
};

/**
 * Touch-friendly input component
 */
export const TouchInput = ({ 
  className = '',
  ...props 
}) => {
  return (
    <input
      className={`touch-manipulation min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
};

/**
 * Mobile-optimized modal component
 */
export const MobileModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WebViewOptimized;

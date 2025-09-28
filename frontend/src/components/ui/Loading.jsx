import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const Loading = ({
  // Content
  text = 'Loading...',
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  variant = 'spinner', // 'spinner', 'dots', 'pulse'
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  // Text size classes
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Container classes
  const containerClasses = `
    flex flex-col items-center justify-center gap-3
    ${fullScreen ? 'min-h-screen' : 'py-8'}
    ${overlay ? 'fixed inset-0 bg-white bg-opacity-75 z-50' : ''}
    ${className}
  `.trim();

  // Spinner component
  const Spinner = () => (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
  );

  // Dots component
  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size].replace('h-', 'h-').replace('w-', 'w-')} bg-primary-600 rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  // Pulse component
  const Pulse = () => (
    <div className={`${sizeClasses[size]} bg-primary-600 rounded-full animate-pulse`} />
  );

  // Render appropriate loading indicator
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      case 'spinner':
      default:
        return <Spinner />;
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoadingIndicator()}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton loading component
export const Skeleton = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  lines = 1
}) => {
  if (lines === 1) {
    return (
      <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}
          style={{
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Inline loading component
export const InlineLoading = ({
  text = 'Loading...',
  size = 'sm',
  className = ''
}) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

// Page loading component
export const PageLoading = ({
  text = 'Loading page...',
  className = ''
}) => (
  <Loading
    text={text}
    size="lg"
    fullScreen
    className={className}
  />
);

// Button loading component
export const ButtonLoading = ({ size = 'sm' }) => (
  <Loader2 className={`${sizeClasses[size]} animate-spin`} />
);

export default Loading;

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  // Content
  children,
  leftIcon,
  rightIcon,
  
  // Styling
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger', 'success'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  
  // States
  loading = false,
  disabled = false,
  
  // Behavior
  type = 'button',
  fullWidth = false,
  
  // Other props
  ...props
}, ref) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500'
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={baseClasses}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}

      {/* Left Icon */}
      {!loading && leftIcon && (
        <span className="flex-shrink-0">
          {leftIcon}
        </span>
      )}

      {/* Button Content */}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>

      {/* Right Icon */}
      {!loading && rightIcon && (
        <span className="flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

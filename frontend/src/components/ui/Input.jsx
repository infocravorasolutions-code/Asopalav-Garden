import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Input = forwardRef(({
  // Basic props
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onBlur,
  onFocus,
  name,
  id,
  disabled = false,
  required = false,
  readOnly = false,
  
  // Label and help text
  label = '',
  helpText = '',
  error = '',
  success = '',
  
  // Styling
  size = 'md', // 'sm', 'md', 'lg'
  variant = 'default', // 'default', 'filled', 'outlined'
  className = '',
  
  // Icons
  leftIcon,
  rightIcon,
  
  // Password specific
  showPasswordToggle = false,
  
  // Loading state
  loading = false,
  
  // Validation
  isValid = null, // null, true, false
  
  // Auto complete
  autoComplete = 'off',
  
  // Other props
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100',
    outlined: 'border-2 border-gray-300 bg-transparent'
  };

  // Base input classes
  const baseClasses = `
    w-full rounded-lg transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    read-only:bg-gray-50 read-only:cursor-default
    ${sizeClasses[size]}
    ${variantClasses[variant]}
  `;

  // Error state classes
  const errorClasses = error ? 'border-error-500 focus:ring-error-500' : '';
  
  // Success state classes
  const successClasses = success ? 'border-success-500 focus:ring-success-500' : '';
  
  // Focus state classes
  const focusClasses = isFocused ? 'ring-2 ring-primary-500 ring-offset-1' : '';

  // Final input classes
  const inputClasses = `
    ${baseClasses}
    ${errorClasses}
    ${successClasses}
    ${focusClasses}
    ${className}
  `.trim();

  // Label classes
  const labelClasses = `
    block text-sm font-medium mb-2
    ${error ? 'text-error-700' : success ? 'text-success-700' : 'text-gray-700'}
    ${disabled ? 'text-gray-400' : ''}
  `;

  // Help text classes
  const helpTextClasses = `
    mt-1 text-xs
    ${error ? 'text-error-600' : success ? 'text-success-600' : 'text-gray-500'}
  `;

  // Icon container classes
  const iconContainerClasses = `
    absolute inset-y-0 flex items-center pointer-events-none
    ${leftIcon ? 'left-0 pl-3' : ''}
    ${rightIcon || showPasswordToggle || loading ? 'right-0 pr-3' : ''}
  `;

  // Input padding classes based on icons
  const inputPaddingClasses = `
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || showPasswordToggle || loading ? 'pr-10' : ''}
  `;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={id || name} className={labelClasses}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`${iconContainerClasses} ${leftIcon ? 'left-0 pl-3' : ''}`}>
            <div className="text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type={inputType}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          autoComplete={autoComplete}
          className={`${inputClasses} ${inputPaddingClasses}`}
          {...props}
        />

        {/* Right Icons */}
        <div className={`${iconContainerClasses} ${rightIcon || showPasswordToggle || loading ? 'right-0 pr-3' : ''}`}>
          {/* Loading Spinner */}
          {loading && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}

          {/* Password Toggle */}
          {!loading && type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Right Icon */}
          {!loading && rightIcon && (
            <div className="text-gray-400">
              {rightIcon}
            </div>
          )}

          {/* Validation Icons */}
          {!loading && !rightIcon && !showPasswordToggle && (
            <>
              {error && (
                <AlertCircle className="h-4 w-4 text-error-500" />
              )}
              {success && !error && (
                <CheckCircle className="h-4 w-4 text-success-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Help Text / Error Message */}
      {(helpText || error || success) && (
        <div className={helpTextClasses}>
          {error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
          {success && !error && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>{success}</span>
            </div>
          )}
          {!error && !success && helpText && (
            <span>{helpText}</span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

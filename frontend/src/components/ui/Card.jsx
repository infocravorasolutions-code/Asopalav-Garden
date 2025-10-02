import React, { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  className = '',
  padding = 'default', // 'none', 'sm', 'default', 'lg'
  shadow = 'default', // 'none', 'sm', 'default', 'lg'
  rounded = 'default', // 'none', 'sm', 'default', 'lg', 'xl'
  border = true,
  hover = false,
  ...props
}, ref) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    default: 'p-6',
    lg: 'p-8'
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-sm',
    lg: 'shadow-lg'
  };

  // Rounded classes
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    default: 'rounded-lg',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  // Base classes
  const baseClasses = `
    bg-white
    ${border ? 'border border-gray-200' : ''}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${roundedClasses[rounded]}
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${className}
  `.trim();

  return (
    <div
      ref={ref}
      className={baseClasses}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header component
export const CardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`border-b border-gray-200 pb-4 mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card Title component
export const CardTitle = forwardRef(({
  children,
  className = '',
  size = 'lg', // 'sm', 'md', 'lg', 'xl'
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <h3
      ref={ref}
      className={`font-semibold text-gray-900 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

// Card Content component
export const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={className}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Card Footer component
export const CardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`border-t border-gray-200 pt-4 mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export default Card;

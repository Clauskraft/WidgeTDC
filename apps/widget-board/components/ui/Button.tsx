import React from 'react';

type ButtonVariant = 'primary' | 'subtle' | 'destructive' | 'success';
type ButtonSize = 'default' | 'small';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Based on Fluent Design principles adapted for Tailwind
const baseClasses =
  'ms-focusable inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150';

const variantClasses = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600 disabled:cursor-not-allowed',
  subtle:
    'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  success: 'bg-green-500 text-white hover:bg-green-600',
};

const sizeClasses = {
  default: 'px-4 py-2 text-sm',
  small: 'px-3 py-1 text-sm',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        // Important: allow className to override base styles for flexibility
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

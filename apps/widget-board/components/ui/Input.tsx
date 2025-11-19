import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, className = '', ...props }, ref) => {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
      {label && <span className="font-medium">{label}</span>}
      <input
        ref={ref}
        className={`px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    </label>
  );
});

Input.displayName = 'Input';

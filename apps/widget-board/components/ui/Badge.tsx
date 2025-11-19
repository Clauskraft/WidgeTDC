import React from 'react';

type BadgeVariant = 'default' | 'destructive';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  destructive: 'bg-rose-100 text-rose-700',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', ...props }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`} {...props} />
);

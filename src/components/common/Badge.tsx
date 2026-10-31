import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-violet-50 text-violet-700 border-violet-200/80',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' {
  const s = status.toUpperCase();
  if (['ACTIVE', 'PAID', 'COMPLETED', 'HEALTHY', 'DELIVERED', 'ACCEPTED', 'EXACT'].includes(s)) {
    return 'success';
  }
  if (['PAUSED', 'CONFIRMED', 'AT_RISK', 'AT RISK', 'POSSIBLE', 'SENT', 'PARTIALLY_PAID', 'PENDING'].includes(s)) {
    return 'warning';
  }
  if (['OVERDUE', 'CRITICAL', 'FAILED', 'REVERSED', 'CANCELLED', 'CLOSED', 'EXPIRED', 'REJECTED', 'UNMATCHED'].includes(s)) {
    return 'danger';
  }
  if (['RENEWAL_PENDING', 'INVESTIGATING', 'CONVERTED', 'DUPLICATE'].includes(s)) {
    return 'purple';
  }
  return 'neutral';
}

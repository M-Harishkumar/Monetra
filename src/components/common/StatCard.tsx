import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    period?: string;
  };
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 bg-white ${
        highlight
          ? 'border-teal-500/30 shadow-md ring-1 ring-teal-500/20'
          : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-tabular-nums">
            {value}
          </h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
            highlight
              ? 'bg-teal-50 text-teal-600 border-teal-200/60'
              : 'bg-slate-50 text-slate-700 border-slate-200/80'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-slate-100 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
          <span className="text-slate-500">{trend.period || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};

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
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-white ${
        highlight
          ? 'border-[#368CE7]/40 shadow-md ring-1 ring-[#368CE7]/20'
          : 'border-[#D9E8F5] shadow-xs hover:border-[#368CE7]/40 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#647A91]">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#243B53] font-tabular-nums font-heading">
            {value}
          </h3>
          {subtitle && <p className="mt-1 text-xs text-[#647A91]">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            highlight
              ? 'bg-[#EAF4FF] text-[#368CE7] border-[#DCEEFF]'
              : 'bg-[#F4F9FF] text-[#368CE7] border-[#D9E8F5]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-[#D9E8F5] text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-semibold ${
              trend.isPositive ? 'text-[#249B70]' : 'text-[#D9535D]'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
          <span className="text-[#647A91]">{trend.period || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};

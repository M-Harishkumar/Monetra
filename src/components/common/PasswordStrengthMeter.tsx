import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import {
  evaluatePasswordStrength,
  PasswordStrengthResult,
} from '../../utils/password-strength.ts';

interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showCriteria = true,
  className = '',
}) => {
  const result: PasswordStrengthResult = evaluatePasswordStrength(password);
  const { score, level, label, colorClass, barColorClass, isCompliant, criteria } = result;

  if (!password) {
    return (
      <div className={`mt-2 space-y-2 text-xs ${className}`}>
        {/* Empty placeholder guide */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            Password Strength:
          </span>
          <span className="text-slate-400 font-medium">Not entered</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          <div className="rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        {showCriteria && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <div className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                </div>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Get indicator icon
  const getIcon = () => {
    if (isCompliant) {
      return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />;
    }
    if (score >= 2) {
      return <Shield className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />;
    }
    return <ShieldAlert className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />;
  };

  return (
    <div className={`mt-2 space-y-2 text-xs transition-all duration-200 ${className}`}>
      {/* Header: Label & Status Badge */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
          {getIcon()}
          <span>Password Security:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold uppercase tracking-wider text-[10px] ${colorClass}`}>
            {label}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              isCompliant
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {criteria.filter((c) => c.satisfied).length}/5 met
          </span>
        </div>
      </div>

      {/* Visual Multi-Segment Strength Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div
          className={`rounded-full transition-all duration-300 ${
            score >= 1 ? barColorClass : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`rounded-full transition-all duration-300 ${
            score >= 2 ? barColorClass : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`rounded-full transition-all duration-300 ${
            score >= 3 ? barColorClass : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
        <div
          className={`rounded-full transition-all duration-300 ${
            score >= 4 ? barColorClass : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
      </div>

      {/* Real-Time Requirement Checklist */}
      {showCriteria && (
        <div className="mt-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 p-2.5">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Security Requirements (Must fulfill all):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {criteria.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-1.5 transition-colors ${
                  c.satisfied
                    ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {c.satisfied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                  </div>
                )}
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

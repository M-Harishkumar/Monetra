/**
 * NEXORA Enterprise Password Security & Strength Evaluator
 * 
 * Enforces robust credential requirements:
 * - Minimum 8 characters (10+ recommended for strong rating)
 * - Mix of uppercase and lowercase alphabetic characters
 * - Numeric digits (0-9)
 * - Special symbols / punctuation (!@#$%^&* etc.)
 */

export interface PasswordCriterion {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol';
  label: string;
  satisfied: boolean;
  hint: string;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  label: string;
  colorClass: string;
  barColorClass: string;
  isCompliant: boolean;
  criteria: PasswordCriterion[];
  feedback: string[];
}

export const SPECIAL_SYMBOLS_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'empty',
      label: 'Enter password',
      colorClass: 'text-slate-400',
      barColorClass: 'bg-slate-700',
      isCompliant: false,
      criteria: [
        { id: 'length', label: 'At least 8 characters', satisfied: false, hint: 'Minimum 8 characters' },
        { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', satisfied: false, hint: 'A-Z' },
        { id: 'lowercase', label: 'At least one lowercase letter (a-z)', satisfied: false, hint: 'a-z' },
        { id: 'number', label: 'At least one number (0-9)', satisfied: false, hint: '0-9' },
        { id: 'symbol', label: 'At least one special symbol (!@#$...)', satisfied: false, hint: 'Symbols' },
      ],
      feedback: ['Password is required.'],
    };
  }

  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = SPECIAL_SYMBOLS_REGEX.test(password);

  const criteria: PasswordCriterion[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      satisfied: hasLength,
      hint: `${password.length}/8 characters`,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      satisfied: hasUppercase,
      hint: 'Include uppercase letter',
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      satisfied: hasLowercase,
      hint: 'Include lowercase letter',
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      satisfied: hasNumber,
      hint: 'Include a number',
    },
    {
      id: 'symbol',
      label: 'At least one special symbol (!@#$...)',
      satisfied: hasSymbol,
      hint: 'Include symbol (!@#$%^&*)',
    },
  ];

  const satisfiedCount = criteria.filter((c) => c.satisfied).length;
  const isCompliant = satisfiedCount === 5;

  const feedback: string[] = [];
  if (!hasLength) feedback.push('Must be at least 8 characters long.');
  if (!hasUppercase) feedback.push('Must include at least one uppercase letter.');
  if (!hasLowercase) feedback.push('Must include at least one lowercase letter.');
  if (!hasNumber) feedback.push('Must include at least one numeric digit.');
  if (!hasSymbol) feedback.push('Must include at least one special symbol (e.g. !@#$%).');

  // Compute score from 0 to 4
  let score = 0;
  if (satisfiedCount <= 2 || password.length < 6) {
    score = 1;
  } else if (satisfiedCount === 3 || (satisfiedCount === 4 && password.length < 8)) {
    score = 2;
  } else if (satisfiedCount === 4 || (isCompliant && password.length < 10)) {
    score = 3;
  } else if (isCompliant && password.length >= 10) {
    score = 4;
  } else {
    score = 2;
  }

  let level: PasswordStrengthLevel = 'weak';
  let label = 'Weak';
  let colorClass = 'text-rose-500';
  let barColorClass = 'bg-rose-500';

  switch (score) {
    case 1:
      level = 'weak';
      label = 'Weak';
      colorClass = 'text-rose-500 dark:text-rose-400';
      barColorClass = 'bg-rose-500';
      break;
    case 2:
      level = 'fair';
      label = 'Fair';
      colorClass = 'text-amber-500 dark:text-amber-400';
      barColorClass = 'bg-amber-500';
      break;
    case 3:
      level = 'good';
      label = 'Good';
      colorClass = 'text-teal-500 dark:text-teal-400';
      barColorClass = 'bg-teal-500';
      break;
    case 4:
      level = 'strong';
      label = 'Strong';
      colorClass = 'text-emerald-500 dark:text-emerald-400';
      barColorClass = 'bg-emerald-500';
      break;
  }

  return {
    score,
    level,
    label,
    colorClass,
    barColorClass,
    isCompliant,
    criteria,
    feedback,
  };
}

/**
 * Server-side & API validation helper:
 * Returns boolean and list of failing reasons.
 */
export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const result = evaluatePasswordStrength(password);
  return {
    valid: result.isCompliant,
    errors: result.feedback,
  };
}

import React from 'react';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskBadgeProps {
  level: RiskLevel | string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function normalizeRiskLevel(level: string): RiskLevel {
  const l = (level || '').toLowerCase().trim();
  if (l === 'critical' || l === 'severe' || l === 'emergency') return 'critical';
  if (l === 'high' || l === 'warning') return 'high';
  if (l === 'moderate' || l === 'watch' || l === 'elevated') return 'moderate';
  return 'low';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  label,
  size = 'sm',
  dot = true,
  pulse = false,
  className = '',
  children
}) => {
  const normLevel = normalizeRiskLevel(level);

  const styles: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
    low: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-500'
    },
    moderate: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-500/100'
    },
    high: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20',
      dot: 'bg-orange-500'
    },
    critical: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-500/100'
    }
  };

  const current = styles[normLevel];

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }[size];

  const displayLabel = children ?? label ?? (level.charAt(0).toUpperCase() + level.slice(1).toLowerCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          {(pulse || normLevel === 'critical') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${current.dot}`} />
        </span>
      )}
      <span className="font-mono font-medium tracking-tight uppercase text-[10px]">{displayLabel}</span>
    </span>
  );
};

import React from 'react';

interface RiskDialProps {
  score: number;
  size?: number;
  label?: string;
  invertColor?: boolean;
}

export const RiskDial: React.FC<RiskDialProps> = ({
  score,
  size = 120,
  label = 'Score',
  invertColor = false,
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine color based on score
  let colorClass = 'text-forest-700';
  if (score < 40) {
    colorClass = invertColor ? 'text-rose-600' : 'text-forest-700';
  } else if (score < 75) {
    colorClass = 'text-amber-500';
  } else {
    colorClass = invertColor ? 'text-forest-700' : 'text-rose-600';
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-sand-200"
          fill="transparent"
        />
        {/* Progress Value */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold font-mono text-ink-900">{score}%</span>
        {label && <span className="text-[10px] uppercase font-mono text-ink-500 tracking-wider">{label}</span>}
      </div>
    </div>
  );
};
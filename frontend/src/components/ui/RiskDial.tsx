import React, { useEffect, useRef, useState } from 'react';

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
  const [animatedScore, setAnimatedScore] = useState(0);
  const prevScore = useRef(0);

  useEffect(() => {
    const start = prevScore.current;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevScore.current = end;
  }, [score]);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, animatedScore));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let colorClass = 'text-teal-500';
  let glowColor = 'rgba(45, 212, 191, 0.3)';
  if (score < 40) {
    colorClass = invertColor ? 'text-rose-500' : 'text-teal-500';
    glowColor = invertColor ? 'rgba(244, 63, 94, 0.3)' : 'rgba(45, 212, 191, 0.3)';
  } else if (score < 75) {
    colorClass = 'text-ochre-500';
    glowColor = 'rgba(245, 158, 11, 0.3)';
  } else {
    colorClass = invertColor ? 'text-teal-500' : 'text-rose-500';
    glowColor = invertColor ? 'rgba(45, 212, 191, 0.3)' : 'rgba(244, 63, 94, 0.3)';
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Glow filter */}
        <defs>
          <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-700"
          fill="transparent"
        />
        {/* Glow layer */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={glowColor}
          strokeWidth={strokeWidth + 6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          fill="transparent"
          filter="url(#gauge-glow)"
          opacity="0.5"
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
        <span className="text-xl font-bold font-mono text-ink-900">{animatedScore}%</span>
        {label && <span className="text-[10px] uppercase font-mono text-ink-500 tracking-wider">{label}</span>}
      </div>
    </div>
  );
};

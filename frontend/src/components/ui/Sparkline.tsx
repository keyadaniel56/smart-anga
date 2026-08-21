import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDot?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#2dd4bf',
  height = 32,
  width = 80,
  showDot = true,
}) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
  const lastPoint = points[points.length - 1]?.split(',');

  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={`sparkline-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkline-grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDot && lastPoint && (
        <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.5" fill={color} className="animate-pulse-glow" />
      )}
    </svg>
  );
};

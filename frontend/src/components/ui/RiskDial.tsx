import React from 'react';
import { normalizeRiskLevel, RiskLevel } from './RiskBadge';

export interface RiskDialProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
  riskLevel?: RiskLevel | string;
  invertColor?: boolean; // True for Readiness/Resilience (higher = greener), False for Hazard/Vulnerability (higher = redder)
  className?: string;
  showTicks?: boolean;
}

export const RiskDial: React.FC<RiskDialProps> = ({
  score,
  maxScore = 100,
  size = 140,
  label,
  sublabel,
  unit,
  riskLevel,
  invertColor = false,
  className = '',
  showTicks = true
}) => {
  const normalizedScore = Math.max(0, Math.min(maxScore, isNaN(score) ? 0 : score));
  const percentage = normalizedScore / maxScore;

  // Determine semantic color
  let calculatedRisk: RiskLevel;
  if (riskLevel) {
    calculatedRisk = normalizeRiskLevel(riskLevel);
  } else if (invertColor) {
    if (percentage >= 0.75) calculatedRisk = 'low';
    else if (percentage >= 0.5) calculatedRisk = 'moderate';
    else if (percentage >= 0.25) calculatedRisk = 'high';
    else calculatedRisk = 'critical';
  } else {
    if (percentage < 0.3) calculatedRisk = 'low';
    else if (percentage < 0.6) calculatedRisk = 'moderate';
    else if (percentage < 0.8) calculatedRisk = 'high';
    else calculatedRisk = 'critical';
  }

  const colorMap: Record<RiskLevel, { stroke: string; fill: string; text: string; bgBadge: string }> = {
    low: {
      stroke: '#15803d', // Emerald-700
      fill: 'rgba(21, 128, 61, 0.1)',
      text: 'text-emerald-700',
      bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    moderate: {
      stroke: '#d97706', // Amber-600
      fill: 'rgba(217, 119, 6, 0.1)',
      text: 'text-amber-700',
      bgBadge: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    high: {
      stroke: '#c2410c', // Orange-700
      fill: 'rgba(194, 65, 12, 0.1)',
      text: 'text-orange-700',
      bgBadge: 'bg-orange-50 text-orange-800 border-orange-200'
    },
    critical: {
      stroke: '#b91c1c', // Rose-700
      fill: 'rgba(185, 28, 28, 0.1)',
      text: 'text-rose-700',
      bgBadge: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  };

  const currentColor = colorMap[calculatedRisk];

  // SVG Geometry for 270-degree arc
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const startAngle = 135; // degrees (bottom-left)
  const totalArc = 270; // degrees

  // Helper to convert polar to cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  // Generate SVG path for an arc
  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, startAngle + totalArc);
  const activeArcAngle = startAngle + totalArc * percentage;
  const activeArc = describeArc(center, center, radius, startAngle, activeArcAngle);

  // Generate tick marks
  const tickCount = 18;
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const tickAngle = startAngle + (i / tickCount) * totalArc;
    const isMajor = i % 3 === 0;
    const tickLen = isMajor ? 6 : 3;
    const outer = polarToCartesian(center, center, radius - 6, tickAngle);
    const inner = polarToCartesian(center, center, radius - 6 - tickLen, tickAngle);
    const isPassed = (i / tickCount) <= percentage;
    return {
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      isMajor,
      isPassed
    };
  });

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background track */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#e7e2d6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Ticks */}
        {showTicks &&
          ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isPassed ? currentColor.stroke : '#d5cebf'}
              strokeWidth={t.isMajor ? 1.5 : 1}
              opacity={t.isPassed ? 0.85 : 0.45}
            />
          ))}

        {/* Active Arc with smooth stroke */}
        {percentage > 0.01 && (
          <path
            d={activeArc}
            fill="none"
            stroke={currentColor.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      {/* Centered Score in IBM Plex Mono and Fraunces label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-1">
        <div className="flex items-baseline justify-center">
          <span
            className="font-mono font-bold tracking-tight text-ink-900 leading-none"
            style={{ fontSize: `${Math.round(size * 0.24)}px` }}
          >
            {Math.round(normalizedScore)}
          </span>
          {unit && (
            <span className="font-mono text-xs text-ink-500 font-medium ml-0.5">
              {unit}
            </span>
          )}
        </div>

        {label && (
          <span
            className="text-[10px] font-sans font-semibold text-ink-500 uppercase tracking-wider mt-1"
            style={{ fontSize: `${Math.max(9, Math.round(size * 0.075))}px` }}
          >
            {label}
          </span>
        )}

        {sublabel && (
          <span className="text-[9px] font-mono text-ink-400 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
};

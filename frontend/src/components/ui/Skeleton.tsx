import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'chart' | 'metric';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full w-10 h-10';
      case 'card':
        return 'rounded-2xl p-5 h-36 w-full';
      case 'chart':
        return 'rounded-2xl h-64 w-full';
      case 'metric':
        return 'rounded-xl h-24 w-full';
      case 'text':
      default:
        return 'h-4 rounded-md w-full';
    }
  };

  const elements = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-sand-200/80 border border-sand-300/50 ${getVariantStyles()} ${className}`}
    />
  ));

  return count === 1 ? elements[0] : <div className="space-y-2.5 w-full">{elements}</div>;
};

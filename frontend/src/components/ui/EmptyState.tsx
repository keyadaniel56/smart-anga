import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-surface-800/50 rounded-2xl border border-dashed border-surface-500">
      <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-ink-500 mb-3">
        {icon || <AlertCircle className="w-5 h-5" />}
      </div>
      <h4 className="text-xs font-bold font-mono text-ink-900 uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-xs text-ink-500 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
};

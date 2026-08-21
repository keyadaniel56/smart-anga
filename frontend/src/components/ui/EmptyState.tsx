import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/70 border border-sand-200 shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center text-ink-500 mb-3.5 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-bold text-ink-900 font-serif">{title}</h4>
      {description && (
        <p className="text-xs text-ink-500 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-forest-800 hover:bg-forest-900 text-sand-50 text-xs font-semibold rounded-xl transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

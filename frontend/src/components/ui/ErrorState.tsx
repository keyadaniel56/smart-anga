import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = ''
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('common.errorNotice', 'Weather Feed Connection Notice');
  const displayMessage = message || t('common.errorNoticeDesc', 'Unable to connect to live weather sensors. Displaying saved safety data.');

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-sm ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-ink-900 font-serif">{displayTitle}</h4>
      <p className="text-xs text-ink-700 max-w-sm mt-1 leading-relaxed">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.retry', 'Retry')}
        </button>
      )}
    </div>
  );
};

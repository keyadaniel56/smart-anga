import React, { useState, useRef, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineScrubberProps {
  days: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  data?: { label: string; values: (number | null)[] }[];
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  days,
  selectedIndex,
  onSelectIndex,
  data = [],
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTrackInteraction = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (days.length - 1));
    onSelectIndex(idx);
  }, [days.length, onSelectIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTrackInteraction(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) handleTrackInteraction(e.clientX);
  }, [isDragging, handleTrackInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const pct = days.length > 1 ? (selectedIndex / (days.length - 1)) * 100 : 0;
  const selectedDay = days[selectedIndex];
  const formattedDate = selectedDay ? new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-ink-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-teal-600" />
          <span className="uppercase tracking-wider font-bold">Timeline</span>
        </div>
        <span className="text-ink-700 font-bold">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600 flex items-center justify-center disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-ink-700" />
        </button>

        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          className="flex-1 relative h-8 cursor-pointer select-none group"
        >
          {/* Track background */}
          <div className="absolute top-3 left-0 right-0 h-1.5 bg-surface-700 rounded-full" />

          {/* Track fill */}
          <div
            className="absolute top-3 left-0 h-1.5 bg-gradient-to-r from-teal-700 to-teal-500 rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />

          {/* Day markers */}
          {days.map((day, i) => {
            const x = (i / (days.length - 1)) * 100;
            const isSelected = i === selectedIndex;
            const isPast = i < selectedIndex;
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onSelectIndex(i); }}
                className="absolute top-1.5 -translate-x-1/2 z-10"
                style={{ left: `${x}%` }}
              >
                <span className={`block w-2 h-2 rounded-full transition-all ${
                  isSelected
                    ? 'bg-teal-400 ring-2 ring-teal-400/30 scale-150'
                    : isPast
                    ? 'bg-teal-600'
                    : 'bg-surface-500 group-hover:bg-surface-400'
                }`} />
              </button>
            );
          })}

          {/* Thumb */}
          <div
            className="absolute top-1.5 -translate-x-1/2 z-20 pointer-events-none transition-all duration-150"
            style={{ left: `${pct}%` }}
          >
            <div className="w-4 h-4 -mt-0.5 rounded-full bg-teal-400 border-2 border-surface-900 shadow-lg shadow-teal-500/30" />
          </div>
        </div>

        <button
          onClick={() => onSelectIndex(Math.min(days.length - 1, selectedIndex + 1))}
          disabled={selectedIndex === days.length - 1}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600 flex items-center justify-center disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-ink-700" />
        </button>
      </div>

      {/* Mini legend */}
      {data.length > 0 && (
        <div className="flex items-center gap-3 text-[10px] font-mono text-ink-500">
          {data.map((series, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series.label === 'Precipitation' ? '#06b6d4' : series.label === 'Temperature' ? '#f97316' : '#8b5cf6' }} />
              {series.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

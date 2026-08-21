import React from 'react';

export const WeatherSkeleton: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-3 w-24 bg-slate-800 rounded" />
      <div className="h-3 w-16 bg-slate-800 rounded" />
    </div>
    <div className="h-8 w-32 bg-slate-800 rounded" />
    <div className="h-3 w-48 bg-slate-800 rounded" />
  </div>
);

export const IncidentListSkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-slate-800 rounded" />
          <div className="h-3 w-1/2 bg-slate-800 rounded" />
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded-lg" />
      </div>
    ))}
  </div>
);

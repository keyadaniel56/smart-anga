import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Sparkles, 
  FileText, 
  Compass, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { LocationProfile, EarlyWarningAlert, LiveWeatherData } from '../types/climate';
import { GLOBAL_HOTSPOTS } from '../data/mockClimateData';

interface HeaderProps {
  locations?: LocationProfile[];
  currentLocation: LocationProfile;
  onSelectLocation: (loc: LocationProfile) => void;
  activeAlerts?: EarlyWarningAlert[];
  liveWeather?: LiveWeatherData | null;
  weatherLoading?: boolean;
  onOpenAdvisor?: () => void;
  onOpenReportModal?: () => void;
  onOpenReportGenerator?: () => void;
  onOpenAIChat?: () => void;
  activeIncidentCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  locations = GLOBAL_HOTSPOTS,
  currentLocation,
  onSelectLocation,
  activeAlerts = [],
  onOpenAdvisor,
  onOpenReportModal,
  onOpenReportGenerator,
  onOpenAIChat,
  activeIncidentCount = 0
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Live UTC Clock for Bento Grid header aesthetic
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utcDateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      }).toUpperCase();
      const utcTimeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
      });
      setCurrentDate(utcDateStr);
      setCurrentTime(utcTimeStr);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const criticalAlerts = activeAlerts.filter(a => a.severity === 'Emergency' || a.severity === 'Warning' || a.active);

  const filteredHotspots = locations.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdvisorClick = () => {
    if (onOpenAIChat) onOpenAIChat();
    else if (onOpenAdvisor) onOpenAdvisor();
  };

  const handleReportClick = () => {
    if (onOpenReportGenerator) onOpenReportGenerator();
    else if (onOpenReportModal) onOpenReportModal();
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc: LocationProfile = {
            id: 'user-gps-location',
            name: 'Local Monitored Zone',
            region: 'Current Coordinates',
            country: 'Custom GPS',
            coordinates: [pos.coords.latitude, pos.coords.longitude],
            elevationM: 25,
            population: 150000,
            primaryRisk: 'flood',
            vulnerabilityIndex: 65,
            criticalAssetsCount: 18
          };
          onSelectLocation(userLoc);
          setDropdownOpen(false);
        },
        (err) => {
          console.warn('Geolocation denied, using default hotspot:', err);
        }
      );
    }
  };

  return (
    <header id="platform-header" className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Critical Early Warning Ticker */}
      {criticalAlerts.length > 0 && (
        <div id="critical-alert-ticker" className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Active Climate Alert:
            </span>
            <span className="truncate font-medium">
              {criticalAlerts[0].title} — {criticalAlerts[0].headline}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded font-mono text-[11px] border border-rose-700/50">
              {activeIncidentCount > 0 ? `${activeIncidentCount} Active Dispatches` : 'Alert Active'}
            </span>
          </div>
        </div>
      )}

      {/* Main Bento Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Identity (Bento Grid Style) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded-sm rotate-45 flex-shrink-0 shadow-sm shadow-emerald-500/40"></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TERRA INTELLIGENCE
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold tracking-wider border border-emerald-500/20">
                  CLIMASHIELD
                </span>
              </h1>
              <p className="text-slate-400 text-[11px] uppercase tracking-widest mt-0.5 font-medium">
                Climate Risk & Resilience Operations
              </p>
            </div>
          </div>

          {/* Mobile System Status Badge */}
          <div className="flex md:hidden items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE</span>
          </div>
        </div>

        {/* Middle: Location Selector Dropdown */}
        <div className="relative flex-1 max-w-md">
          <button
            id="location-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-left transition-all text-xs sm:text-sm group shadow-inner"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate">
                <span className="font-semibold text-slate-200">{currentLocation.name}</span>
                <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">
                  ({currentLocation.coordinates[0].toFixed(2)}°, {currentLocation.coordinates[1].toFixed(2)}°)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-lg font-mono font-semibold ${
                currentLocation.vulnerabilityIndex > 75 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : currentLocation.vulnerabilityIndex > 60
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                Risk {currentLocation.vulnerabilityIndex}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Location Dropdown Modal */}
          {dropdownOpen && (
            <div 
              id="location-dropdown-panel"
              className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search river basin, city or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="py-1">
                <button
                  id="gps-locate-btn"
                  onClick={handleUseCurrentLocation}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-950/50 rounded-xl transition-colors border border-dashed border-emerald-800/60 mb-1"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  Use Current Device GPS Telemetry
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Global Hotspots & River Basins
                </div>
                {filteredHotspots.map((spot) => (
                  <button
                    key={spot.id}
                    id={`select-loc-${spot.id}`}
                    onClick={() => {
                      onSelectLocation(spot);
                      setDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      currentLocation.id === spot.id 
                        ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-200' 
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{spot.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {spot.region}, {spot.country} • Basin: {spot.riverBasin || 'Regional Catchment'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="capitalize text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-medium">
                        {spot.primaryRisk.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Operational Status, UTC Clock & Actions (Bento Pattern) */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Operational Pulse */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>

          {/* UTC Clock & Date Bento Pill */}
          <div className="hidden sm:flex bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl items-center gap-3 text-slate-300 text-xs font-mono">
            <span>{currentDate || 'OCT 24, 2026'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-medium">{currentTime || '14:32:05 UTC'}</span>
          </div>

          {/* AI Copilot & PDF Report Trigger */}
          <div className="flex items-center gap-2">
            <button
              id="open-ai-advisor-btn"
              onClick={handleAdvisorClick}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className="sm:hidden">Copilot</span>
            </button>

            <button
              id="generate-audit-report-btn"
              onClick={handleReportClick}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">Generate PDF</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

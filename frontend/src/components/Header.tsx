import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Search, 
  Compass, 
  AlertTriangle, 
  ChevronDown, 
  Sparkles, 
  Thermometer,
  Languages,
  Globe,
  Loader2
} from 'lucide-react';
import { LocationProfile, EarlyWarningAlert, LiveWeatherData } from '../types/climate';
import { GLOBAL_HOTSPOTS } from '../data/mockClimateData';
import { RiskBadge } from './ui/RiskBadge';
import { useTranslation } from '../context/LanguageContext';

interface HeaderProps {
  locations?: LocationProfile[];
  currentLocation: LocationProfile;
  onSelectLocation: (loc: LocationProfile) => void;
  activeAlerts?: EarlyWarningAlert[];
  liveWeather?: LiveWeatherData | null;
  weatherLoading?: boolean;
  activeIncidentCount?: number;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  category: string;
  importance: number;
  address?: Record<string, string>;
}

export const Header: React.FC<HeaderProps> = ({
  locations = GLOBAL_HOTSPOTS,
  currentLocation,
  onSelectLocation,
  activeAlerts = [],
  liveWeather,
  activeIncidentCount = 0
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [geoResults, setGeoResults] = useState<NominatimResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const fetchGeocodeResults = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setGeoResults([]);
      setGeoLoading(false);
      return;
    }
    try {
      setGeoLoading(true);
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '8',
        addressdetails: '1',
        'accept-language': 'en'
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        setGeoResults([]);
        return;
      }
      const data: NominatimResult[] = await res.json();
      setGeoResults(data);
    } catch {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length >= 3) {
      setGeoLoading(true);
      debounceRef.current = setTimeout(() => {
        fetchGeocodeResults(searchQuery);
      }, 500);
    } else {
      setGeoResults([]);
      setGeoLoading(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchGeocodeResults]);

  const criticalAlerts = activeAlerts.filter(a => a.severity === 'Emergency' || a.severity === 'Warning' || a.active);

  const filteredHotspots = locations.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectGeoResult = (result: NominatimResult) => {
    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
    const country = addr.country || '';
    const displayName = city ? `${city}, ${country}` : result.display_name.split(',').slice(0, 2).join(',').trim();
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const absLat = Math.abs(lat);
    const isTropical = absLat < 23.5;
    const isCoastal = result.type === 'sea' || result.type === 'bay' || result.type === 'cape'
      || (addr.country && ['Japan', 'Philippines', 'Indonesia', 'Bangladesh', 'Netherlands', 'United Kingdom'].includes(addr.country))
      || absLat < 15;
    const isArid = addr.country && ['Saudi Arabia', 'Libya', 'Egypt', 'Algeria', 'Sudan', 'Namibia', 'Australia'].includes(addr.country);

    const primaryRisk = isCoastal ? 'coastal_surge' : isArid ? 'drought' : isTropical ? 'flood' : 'flood';
    const vulnerabilityIndex = Math.min(95, Math.max(25, Math.floor(
      40 + absLat * -0.3 + (isCoastal ? 15 : 0) + (isTropical ? 10 : 0) + (isArid ? 8 : 0) + (Math.random() * 15)
    )));
    const population = addr.city || addr.town || addr.village ? Math.floor(50000 + Math.random() * 2000000) : Math.floor(5000 + Math.random() * 200000);

    const loc: LocationProfile = {
      id: `geocoded-${result.place_id}`,
      name: displayName,
      region: addr.state || addr.region || city || 'Searched Area',
      country: country || 'Unknown',
      coordinates: [lat, lng],
      elevationM: addr.city ? Math.floor(5 + Math.random() * 200) : Math.floor(Math.random() * 50),
      population,
      primaryRisk,
      vulnerabilityIndex,
      riverBasin: `${city || addr.state || 'Regional'} Catchment`,
      criticalAssetsCount: Math.floor(5 + Math.random() * 40)
    };
    onSelectLocation(loc);
    setDropdownOpen(false);
    setSearchQuery('');
    setGeoResults([]);
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

  const formatGeoType = (result: NominatimResult) => {
    const addr = result.address || {};
    const parts: string[] = [];
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    return parts.length > 0 ? parts.join(', ') : result.type;
  };

  const showGeoSection = geoResults.length > 0 || geoLoading;
  const showHotspotsSection = filteredHotspots.length > 0;
  const showEmptyState = !showGeoSection && !showHotspotsSection && searchQuery.trim().length >= 3;

  return (
    <header id="platform-header" className="bg-surface-900/95 border-b border-surface-600 sticky top-0 z-40 backdrop-blur-md">
      {/* Critical Alert Ticker */}
      {criticalAlerts.length > 0 && (
        <div
          id="critical-alert-ticker"
          className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-rose-400 shadow-xs"
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 font-mono text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {t('header.activeAlertLabel', 'Emergency Weather Alert')}:
            </span>
            <span className="truncate font-medium text-rose-300">
              {criticalAlerts[0].title} — {criticalAlerts[0].headline}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <RiskBadge
              level="critical"
              size="xs"
              label={activeIncidentCount > 0 ? `${activeIncidentCount} Dispatched` : t('common.active', 'Active')}
            />
          </div>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-forest-800 text-teal-500 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-forest-600 font-serif">
                  {t('header.title', 'SmartAnga')}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 text-[10px] font-mono font-bold tracking-wide border border-forest-800/30">
                  {t('header.badge', 'COMMUNITY SAFETY')}
                </span>
              </div>
              <p className="text-ink-500 text-[11px] font-medium tracking-wide">
                {t('header.subtitle', 'Community Climate & Weather Safety Platform')}
              </p>
            </div>
          </div>

          {/* Mobile Live Status & Language Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center bg-surface-800 p-0.5 rounded-lg border border-surface-600 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-all ${
                  language === 'en' ? 'bg-forest-800 text-ink-900 shadow-2xs' : 'text-ink-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('sw')}
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-all ${
                  language === 'sw' ? 'bg-forest-800 text-ink-900 shadow-2xs' : 'text-ink-500'
                }`}
              >
                SW
              </button>
            </div>
            {liveWeather && (
              <span className="font-mono text-xs font-bold text-forest-600 bg-surface-800 px-2 py-1 rounded-lg border border-surface-600">
                {liveWeather.temperature.toFixed(1)}°C
              </span>
            )}
          </div>
        </div>

        {/* Location Selector */}
        <div className="relative flex-1 max-w-md">
          <button
            id="location-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-surface-800/90 hover:bg-surface-700 border border-surface-600 hover:border-surface-500 rounded-xl px-3.5 py-2 text-left transition-all text-xs sm:text-sm shadow-xs group"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate">
                <span className="font-bold text-ink-900">{currentLocation.name}</span>
                <span className="text-xs text-ink-500 ml-1.5 hidden sm:inline font-mono">
                  ({currentLocation.coordinates[0].toFixed(2)}°, {currentLocation.coordinates[1].toFixed(2)}°)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <RiskBadge
                level={
                  currentLocation.vulnerabilityIndex > 75 ? 'critical' :
                  currentLocation.vulnerabilityIndex > 60 ? 'high' :
                  currentLocation.vulnerabilityIndex > 40 ? 'moderate' : 'low'
                }
                size="xs"
                label={`Risk ${currentLocation.vulnerabilityIndex}`}
              />
              <ChevronDown className="w-4 h-4 text-ink-300" />
            </div>
          </button>

          {/* Location Dropdown Modal */}
          {dropdownOpen && (
            <div 
              id="location-dropdown-panel"
              className="absolute left-0 right-0 mt-2 bg-surface-700 border border-surface-600 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-2 border-b border-surface-600 flex items-center gap-2 bg-surface-800/50 rounded-t-xl">
                <Search className="w-4 h-4 text-ink-300 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={t('header.searchPlaceholder', 'Search any town, city, or country...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-ink-900 placeholder-ink-300 focus:outline-none"
                  autoFocus
                />
                {geoLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-ink-300 animate-spin flex-shrink-0" />
                )}
              </div>

              <div className="py-1">
                <button
                  id="gps-locate-btn"
                  onClick={handleUseCurrentLocation}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-forest-600 hover:bg-surface-600 rounded-xl transition-colors border border-dashed border-surface-500 mb-1"
                >
                  <Compass className="w-3.5 h-3.5 text-teal-500" />
                  {t('header.useGps', 'Use My Current Device Location')}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1 py-1">
                {/* Geocoding results */}
                {showGeoSection && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold text-forest-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      {searchQuery.trim().length >= 3 && !geoLoading && geoResults.length > 0
                        ? `Search Results for "${searchQuery}"`
                        : geoLoading ? 'Searching worldwide...' : ''}
                    </div>
                    {geoResults.map((result) => (
                      <button
                        key={result.place_id}
                        id={`geo-loc-${result.place_id}`}
                        onClick={() => selectGeoResult(result)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors hover:bg-forest-50 text-ink-700 border border-transparent hover:border-forest-800/30"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Globe className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-ink-900 truncate">{result.display_name.split(',')[0]}</div>
                            <div className="text-[11px] text-ink-500 truncate">
                              {formatGeoType(result)}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-50 text-forest-600 border border-forest-800/30 font-medium flex-shrink-0 ml-2">
                          Add
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* Monitored hotspots */}
                {showHotspotsSection && (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold text-ink-300 uppercase tracking-wider font-mono">
                      {searchQuery.trim().length > 0
                        ? 'Monitored Locations'
                        : t('header.selectHotspot', 'Select Monitored Town or Catchment Area')}
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                          currentLocation.id === spot.id 
                            ? 'bg-forest-50 border border-forest-800/30 text-forest-600 font-bold' 
                            : 'hover:bg-surface-600 text-ink-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-ink-900">{spot.name}</div>
                          <div className="text-[11px] text-ink-500 font-sans">
                            {spot.region}, {spot.country} • Basin: {spot.riverBasin || 'Regional Catchment'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="capitalize text-[10px] px-2 py-0.5 rounded-md bg-surface-800 text-ink-700 border border-surface-600 font-medium">
                            {spot.primaryRisk.replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Empty state */}
                {showEmptyState && (
                  <div className="px-3 py-4 text-center text-ink-300 text-xs">
                    <MapPin className="w-5 h-5 mx-auto mb-1.5 text-ink-300" />
                    No matches found. Try a different search or use GPS.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live System Telemetry, UTC Time & Desktop Language Switcher */}
        <div className="hidden md:flex items-center gap-3 justify-end">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-surface-800/90 border border-surface-600 p-1 rounded-xl shadow-xs">
            <Languages className="w-3.5 h-3.5 text-forest-600 ml-1 mr-1.5" />
            <div className="flex items-center bg-surface-800 p-0.5 rounded-lg border border-surface-600 text-xs">
              <button
                id="lang-btn-en"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs transition-all ${
                  language === 'en' ? 'bg-forest-800 text-ink-900 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                EN
              </button>
              <button
                id="lang-btn-sw"
                onClick={() => setLanguage('sw')}
                className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs transition-all ${
                  language === 'sw' ? 'bg-forest-800 text-ink-900 shadow-xs' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                SW
              </button>
            </div>
          </div>

          {liveWeather && (
            <div className="flex items-center gap-2 bg-surface-800/90 border border-surface-600 px-3 py-1.5 rounded-xl text-xs shadow-xs">
              <Thermometer className="w-3.5 h-3.5 text-ochre-600" />
              <span className="font-mono font-bold text-ink-900">{liveWeather.temperature.toFixed(1)}°C</span>
              <span className="text-ink-300">|</span>
              <span className="text-[11px] text-ink-500 font-mono">{liveWeather.humidity}% RH</span>
            </div>
          )}

          <div className="flex bg-surface-800/90 border border-surface-600 px-3 py-1.5 rounded-xl items-center gap-2 text-ink-700 text-xs font-mono shadow-xs">
            <span>{currentDate || 'OCT 24, 2026'}</span>
            <span className="text-surface-500">|</span>
            <span className="text-forest-600 font-bold">{currentTime || '14:32:05 UTC'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

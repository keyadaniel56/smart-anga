import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Layers, 
  Waves, 
  Sun, 
  Flame, 
  Building, 
  Radio, 
  AlertCircle, 
  Maximize2, 
  Minimize2,
  X,
  SlidersHorizontal,
  Search,
  MapPin,
  Loader2
} from 'lucide-react';
import { LocationProfile, SensorNode, CriticalAsset, DepartmentIncident } from '../types/climate';
import { useTranslation } from '../context/LanguageContext';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  category: string;
  address?: Record<string, string>;
}

interface RiskMapProps {
  location: LocationProfile;
  sensors: SensorNode[];
  assets: CriticalAsset[];
  incidents: DepartmentIncident[];
  onSearchLocation?: (loc: LocationProfile) => void;
}

export const RiskMap: React.FC<RiskMapProps> = ({
  location,
  sensors,
  assets,
  incidents,
  onSearchLocation
}) => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const layerGroupsRef = useRef<{ [key: string]: any }>({});

  const [layersVisibility, setLayersVisibility] = useState({
    floodPlumes: true,
    droughtZones: true,
    heatIslands: true,
    criticalAssets: true,
    sensorNodes: true,
    activeIncidents: true
  });

  const [mapStyle, setMapStyle] = useState<'dark' | 'light' | 'satellite' | 'terrain'>('dark');
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoResults, setGeoResults] = useState<NominatimResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destroyMap = useCallback(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      layerGroupsRef.current = {};
    }
  }, []);

  const renderMapLayers = useCallback((L: any) => {
    const groups = layerGroupsRef.current;
    if (!groups.floodPlumes) return;

    Object.values(groups).forEach((g: any) => g.clearLayers());

    const [lat, lng] = location.coordinates;

    if (layersVisibility.floodPlumes) {
      L.polygon([
        [lat + 0.03, lng - 0.04],
        [lat + 0.02, lng - 0.01],
        [lat + 0.005, lng + 0.02],
        [lat - 0.015, lng + 0.05],
        [lat - 0.025, lng + 0.04],
        [lat - 0.01, lng + 0.01],
        [lat + 0.01, lng - 0.02]
      ], {
        color: '#0891b2', fillColor: '#06b6d4', fillOpacity: 0.3, weight: 2, dashArray: '4, 4'
      })
      .bindPopup(`
        <div class="space-y-1 font-sans">
          <div class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">High Risk Inundation Zone</div>
          <div class="text-xs font-bold text-ink-900">${location.riverBasin || 'Catchment Basin'} Flood Plain</div>
          <div class="text-xs text-ink-700">Projected 50-Year Stage: <strong class="font-mono">5.40m</strong></div>
          <div class="text-[11px] text-cyan-400 font-mono font-semibold">Catchment Saturation: 87.4%</div>
        </div>
      `)
      .addTo(groups.floodPlumes);

      L.circle([lat + 0.015, lng - 0.025], {
        radius: 1800, color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.25, weight: 1.5
      }).bindPopup('<div class="p-1 font-sans text-xs"><strong>Flash Runoff Hotspot</strong><br/>Time to peak: 45 minutes</div>').addTo(groups.floodPlumes);
    }

    if (layersVisibility.droughtZones) {
      L.circle([lat - 0.02, lng - 0.03], {
        radius: 2600, color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 1.5, dashArray: '6, 6'
      })
      .bindPopup(`
        <div class="space-y-1 font-sans">
          <div class="text-[10px] font-bold text-amber-400 uppercase font-mono">Agricultural Soil Deficit</div>
          <div class="text-xs text-ink-700">Root-zone (0-28cm) moisture: <strong class="font-mono">14.2%</strong></div>
          <div class="text-[11px] text-amber-400 font-mono font-semibold">SPEI Index: -1.82 (Severe Drought)</div>
        </div>
      `)
      .addTo(groups.droughtZones);
    }

    if (layersVisibility.heatIslands) {
      L.circle([lat + 0.01, lng + 0.01], {
        radius: 2000, color: '#e11d48', fillColor: '#fb7185', fillOpacity: 0.22, weight: 1.5
      })
      .bindPopup(`
        <div class="space-y-1 font-sans">
          <div class="text-[10px] font-bold text-rose-400 uppercase font-mono">Urban Heat Island (UHI) Core</div>
          <div class="text-xs text-ink-700">Wet-Bulb Temp (WBGT): <strong class="font-mono">31.8°C</strong></div>
          <div class="text-[11px] text-rose-400 font-mono font-semibold">Thermal Anomaly: +4.2°C</div>
        </div>
      `)
      .addTo(groups.heatIslands);
    }

    if (layersVisibility.criticalAssets) {
      assets.forEach((asset) => {
        const isSevere = asset.riskRating === 'Severe';
        const isHigh = asset.riskRating === 'High';
        const customIcon = L.divIcon({
          className: 'custom-asset-marker',
          html: `<div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 ${
            isSevere ? 'bg-rose-600 border-white text-white shadow-md shadow-rose-600/40'
            : isHigh ? 'bg-amber-500/100 border-white text-white shadow-sm shadow-amber-500/30'
            : 'bg-forest-600 border-white text-white shadow-xs'
          }"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>`,
          iconSize: [28, 28], iconAnchor: [14, 14]
        });
        const marker = L.marker(asset.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="space-y-1.5 font-sans min-w-[200px]">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-bold uppercase tracking-wider text-ink-500 font-mono">${asset.category.replace('_', ' ')}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isSevere ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">${asset.riskRating}</span>
            </div>
            <div class="font-bold text-ink-900 text-xs">${asset.name}</div>
            <div class="text-[11px] text-ink-700">Value: <strong class="text-forest-600 font-mono">$${asset.estimatedAssetValueMillionsUSD}M</strong> | Flood Limit: <strong class="font-mono">${asset.floodBreachThresholdM}m</strong></div>
            <div class="pt-1 border-t border-surface-600 text-[10px] text-ink-500">Mitigation: ${asset.protectiveMeasures.join(', ')}</div>
          </div>
        `);
        marker.addTo(groups.criticalAssets);
      });
    }

    if (layersVisibility.sensorNodes) {
      sensors.forEach((sensor) => {
        const isCritical = sensor.status === 'critical';
        const isWarning = sensor.status === 'warning';
        const customIcon = L.divIcon({
          className: 'custom-sensor-marker',
          html: `<div class="relative flex items-center justify-center w-6 h-6 rounded-full border ${
            isCritical ? 'bg-rose-600 text-white border-white ring-2 ring-rose-400 shadow-sm'
            : isWarning ? 'bg-amber-500/100 text-white border-white ring-2 ring-amber-300'
            : 'bg-forest-800 text-ink-900 border-white'
          }"><span class="text-[8px] font-extrabold font-mono">${sensor.type === 'river_stage' ? 'H2O' : sensor.type === 'soil_moisture' ? 'SOIL' : sensor.type === 'wet_bulb_temp' ? 'WB' : 'RN'}</span></div>`,
          iconSize: [24, 24], iconAnchor: [12, 12]
        });
        const marker = L.marker(sensor.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="space-y-1 font-sans min-w-[190px]">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-forest-600">${sensor.id}</span>
              <span class="text-ink-500 font-mono">Batt: ${sensor.batteryPct}%</span>
            </div>
            <div class="font-bold text-ink-900 text-xs">${sensor.name}</div>
            <div class="text-[11px] text-ink-700">Live Value: <span class="font-mono font-bold ${isWarning ? 'text-amber-400' : 'text-forest-600'}">${sensor.currentValue} ${sensor.unit}</span></div>
            <div class="text-[10px] text-ink-300 font-mono">Normal: ${sensor.normalRange[0]} - ${sensor.normalRange[1]} ${sensor.unit}</div>
          </div>
        `);
        marker.addTo(groups.sensorNodes);
      });
    }

    if (layersVisibility.activeIncidents) {
      incidents.forEach((inc) => {
        const customIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: `<div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg shadow-rose-600/40 animate-bounce"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>`,
          iconSize: [32, 32], iconAnchor: [16, 16]
        });
        const marker = L.marker(inc.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="space-y-1.5 font-sans min-w-[220px]">
            <div class="flex items-center justify-between">
              <span class="bg-rose-500/10 text-rose-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold border border-rose-500/20">${inc.id}</span>
              <span class="text-[10px] text-rose-400 font-mono font-bold uppercase">${inc.severity}</span>
            </div>
            <div class="font-bold text-ink-900 text-xs leading-snug">${inc.title}</div>
            <div class="text-[11px] text-ink-700">${inc.department} • <span class="font-medium text-amber-400 capitalize">${inc.status.replace('_', ' ')}</span></div>
          </div>
        `);
        marker.addTo(groups.activeIncidents);
      });
    }
  }, [location, sensors, assets, incidents, layersVisibility]);

  // Initialize Leaflet map — re-init when expanded changes (DOM element moves)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;

    let cancelled = false;

    const initMap = async () => {
      destroyMap();

      const L = (window as any).L || (await import('leaflet')).default;
      if (cancelled) return;

      const map = L.map(container, {
        center: location.coordinates,
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tileUrl = mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : mapStyle === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      leafletMapRef.current = map;
      (leafletMapRef.current as any)._baseTile = tileLayer;

      layerGroupsRef.current = {
        floodPlumes: L.layerGroup().addTo(map),
        droughtZones: L.layerGroup().addTo(map),
        heatIslands: L.layerGroup().addTo(map),
        criticalAssets: L.layerGroup().addTo(map),
        sensorNodes: L.layerGroup().addTo(map),
        activeIncidents: L.layerGroup().addTo(map)
      };

      renderMapLayers(L);

      // Force a size recalculation after mount
      setTimeout(() => {
        if (!cancelled && leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 50);
    };

    initMap();

    return () => {
      cancelled = true;
      destroyMap();
    };
  }, [expanded, location, mapStyle, destroyMap, renderMapLayers]);

  // Re-render layers when data/visibility changes without re-initting the whole map
  useEffect(() => {
    const update = async () => {
      const L = (window as any).L || (await import('leaflet')).default;
      if (!leafletMapRef.current) return;
      renderMapLayers(L);
    };
    update();
  }, [layersVisibility, sensors, assets, incidents, location, renderMapLayers]);

  // Body scroll lock + Escape key
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setExpanded(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [expanded]);

  // Nominatim geocoding for fullscreen search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchQuery.trim().length < 3) {
      setGeoResults([]);
      setGeoLoading(false);
      return;
    }
    setGeoLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery, format: 'json', limit: '6', addressdetails: '1', 'accept-language': 'en'
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) { setGeoResults([]); return; }
        setGeoResults(await res.json());
      } catch {
        setGeoResults([]);
      } finally {
        setGeoLoading(false);
      }
    }, 500);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  const selectGeoResult = useCallback((result: NominatimResult) => {
    if (!onSearchLocation) return;
    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
    const country = addr.country || '';
    const displayName = city ? `${city}, ${country}` : result.display_name.split(',').slice(0, 2).join(',').trim();
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const absLat = Math.abs(lat);
    const isTropical = absLat < 23.5;
    const isCoastal = absLat < 15 || result.type === 'sea' || result.type === 'bay';
    const isArid = addr.country && ['Saudi Arabia', 'Libya', 'Egypt', 'Algeria', 'Sudan', 'Namibia', 'Australia'].includes(addr.country);
    const primaryRisk = isCoastal ? 'coastal_surge' : isArid ? 'drought' : isTropical ? 'flood' : 'flood';
    const vulnerabilityIndex = Math.min(95, Math.max(25, Math.floor(
      40 + absLat * -0.3 + (isCoastal ? 15 : 0) + (isTropical ? 10 : 0) + (isArid ? 8 : 0) + (Math.random() * 15)
    )));

    onSearchLocation({
      id: `geocoded-${result.place_id}`,
      name: displayName,
      region: addr.state || addr.region || city || 'Searched Area',
      country: country || 'Unknown',
      coordinates: [lat, lng],
      elevationM: addr.city ? Math.floor(5 + Math.random() * 200) : Math.floor(Math.random() * 50),
      population: addr.city || addr.town || addr.village ? Math.floor(50000 + Math.random() * 2000000) : Math.floor(5000 + Math.random() * 200000),
      primaryRisk,
      vulnerabilityIndex,
      riverBasin: `${city || addr.state || 'Regional'} Catchment`,
      criticalAssetsCount: Math.floor(5 + Math.random() * 40)
    });
    setSearchQuery('');
    setGeoResults([]);
  }, [onSearchLocation]);

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const layerControls = (
    <div
      className={`absolute top-3 right-3 z-30 bg-surface-700/95 border border-surface-600 rounded-2xl p-3.5 shadow-lg backdrop-blur-md max-w-xs space-y-3 transition-all ${
        mobileControlsOpen ? 'block' : 'hidden sm:block'
      }`}
    >
      <div className="flex items-center justify-between border-b border-surface-600 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-900 font-mono">
          <Layers className="w-3.5 h-3.5 text-forest-600" />
          {t('map.layersTitle', 'Map Layers')}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/100/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {t('common.live', 'Live')}
          </span>
          <button
            onClick={() => setMobileControlsOpen(false)}
            className="sm:hidden w-6 h-6 rounded-full bg-surface-800 flex items-center justify-center text-ink-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {([
          { key: 'floodPlumes', icon: Waves, iconClass: 'text-cyan-600', label: t('map.floodInundation', 'Flood Danger Zones') },
          { key: 'droughtZones', icon: Sun, iconClass: 'text-amber-600', label: t('map.droughtSoil', 'Dry Soil Areas') },
          { key: 'heatIslands', icon: Flame, iconClass: 'text-rose-600', label: t('map.heatIslands', 'Extreme Heat Areas') },
          { key: 'criticalAssets', icon: Building, iconClass: 'text-forest-600', label: `${t('map.criticalAssets', 'Protected Buildings')} (${assets.length})` },
          { key: 'sensorNodes', icon: Radio, iconClass: 'text-teal-500', label: `${t('map.sensors', 'Water & Weather Sensors')} (${sensors.length})` },
          { key: 'activeIncidents', icon: AlertCircle, iconClass: 'text-rose-600', label: `${t('map.incidents', 'Active Warnings')} (${incidents.length})` },
        ] as const).map(({ key, icon: Icon, iconClass, label }) => (
          <label key={key} className="flex items-center justify-between text-ink-700 hover:text-ink-900 cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
              {label}
            </span>
            <input
              type="checkbox"
              checked={layersVisibility[key]}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, [key]: e.target.checked })}
              className="rounded text-forest-600 accent-forest-700"
            />
          </label>
        ))}
      </div>

      <div className="pt-2 border-t border-surface-600 flex items-center justify-between gap-1">
        {(['dark', 'light', 'satellite', 'terrain'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all ${
              mapStyle === style ? 'bg-forest-800 text-ink-900 font-bold' : 'bg-surface-800 text-ink-600 hover:bg-surface-600'
            }`}
          >
            {t(`map.style${style.charAt(0).toUpperCase() + style.slice(1)}`, style.charAt(0).toUpperCase() + style.slice(1))}
          </button>
        ))}
      </div>
    </div>
  );

  const legendBar = (
    <div className={`absolute bottom-3 left-3 right-16 z-20 bg-surface-700/90 border border-surface-600 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs ${expanded ? 'max-w-3xl' : ''}`}>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-semibold text-ink-500 text-[10px] uppercase tracking-wider font-mono">{t('map.keyLabel', 'Key')}:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 border border-white"></span>
          <span className="text-ink-700 text-[11px]">{t('map.floodInundation', 'Flood Danger Zones')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/100 border border-white"></span>
          <span className="text-ink-700 text-[11px]">{t('map.droughtSoil', 'Dry Soil Areas')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white animate-ping"></span>
          <span className="text-ink-900 font-bold text-[11px]">{t('map.activeEmergency', 'Active Warning')}</span>
        </div>
      </div>
      <div className="hidden md:block text-[11px] font-mono text-ink-500">
        Area: <span className="text-forest-600 font-bold">{location.name}</span> ({location.elevationM}m ASL)
      </div>
    </div>
  );

  // ── Collapsed: inline in the page layout ──
  const collapsedView = (
    <div
      id="gis-risk-map-panel"
      className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] bg-surface-800 rounded-3xl overflow-hidden select-none"
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <button
        onClick={toggleExpand}
        className="absolute top-3 left-3 z-30 bg-surface-700/95 border border-surface-600 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-700 backdrop-blur-md hover:bg-surface-700 transition-colors"
        title="Expand map"
      >
        <Maximize2 className="w-3.5 h-3.5 text-forest-600" />
        <span className="hidden sm:inline">{t('map.expand', 'Expand')}</span>
      </button>

      <button
        onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
        className="sm:hidden absolute top-3 right-3 z-30 bg-surface-700/95 border border-surface-600 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-700 backdrop-blur-md"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-forest-600" />
        <span>{t('map.layersBtn', 'Map Layers')} ({Object.values(layersVisibility).filter(Boolean).length})</span>
      </button>

      {layerControls}
      {legendBar}
    </div>
  );

  // ── Expanded: portaled to document.body for true fullscreen ──
  const expandedView = (
    <div
      id="gis-risk-map-panel"
      className="fixed inset-0 z-[9999] bg-surface-800"
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top bar: collapse button + search */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-start gap-2">
        <button
          onClick={toggleExpand}
          className="flex-shrink-0 bg-surface-700/95 border border-surface-600 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-700 backdrop-blur-md hover:bg-surface-700 transition-colors"
          title="Collapse map"
        >
          <Minimize2 className="w-3.5 h-3.5 text-forest-600" />
          <span>{t('map.collapse', 'Collapse')}</span>
        </button>

        {/* Fullscreen search bar */}
        {onSearchLocation && (
          <div className="relative flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-surface-700/95 border border-surface-600 rounded-xl px-3 py-1.5 shadow-md backdrop-blur-md">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                placeholder={t('map.searchPlaceholder', 'Search any place...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-ink-900 placeholder-ink-400 focus:outline-none"
              />
              {geoLoading && <Loader2 className="w-3 h-3 text-ink-300 animate-spin flex-shrink-0" />}
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setGeoResults([]); }} className="text-ink-500 hover:text-ink-700">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {geoResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-700 border border-surface-600 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {geoResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectGeoResult(result)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-forest-50 transition-colors border-b border-surface-700 last:border-b-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-ink-900 truncate">{result.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-ink-500 truncate">
                        {[result.address?.state, result.address?.country].filter(Boolean).join(', ') || result.type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
        className="sm:hidden absolute top-3 right-3 z-30 bg-surface-700/95 border border-surface-600 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-700 backdrop-blur-md"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-forest-600" />
        <span>{t('map.layersBtn', 'Map Layers')} ({Object.values(layersVisibility).filter(Boolean).length})</span>
      </button>

      {layerControls}
      {legendBar}
    </div>
  );

  return expanded
    ? createPortal(expandedView, document.body)
    : collapsedView;
};

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
  SlidersHorizontal
} from 'lucide-react';
import { LocationProfile, SensorNode, CriticalAsset, DepartmentIncident } from '../types/climate';
import { useTranslation } from '../context/LanguageContext';

interface RiskMapProps {
  location: LocationProfile;
  sensors: SensorNode[];
  assets: CriticalAsset[];
  incidents: DepartmentIncident[];
}

export const RiskMap: React.FC<RiskMapProps> = ({
  location,
  sensors,
  assets,
  incidents
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

  const [mapStyle, setMapStyle] = useState<'light' | 'satellite' | 'terrain'>('light');
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
          <div class="text-[10px] font-bold text-cyan-800 uppercase tracking-wider font-mono">High Risk Inundation Zone</div>
          <div class="text-xs font-bold text-ink-900">${location.riverBasin || 'Catchment Basin'} Flood Plain</div>
          <div class="text-xs text-ink-700">Projected 50-Year Stage: <strong class="font-mono">5.40m</strong></div>
          <div class="text-[11px] text-cyan-800 font-mono font-semibold">Catchment Saturation: 87.4%</div>
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
          <div class="text-[10px] font-bold text-amber-800 uppercase font-mono">Agricultural Soil Deficit</div>
          <div class="text-xs text-ink-700">Root-zone (0-28cm) moisture: <strong class="font-mono">14.2%</strong></div>
          <div class="text-[11px] text-amber-800 font-mono font-semibold">SPEI Index: -1.82 (Severe Drought)</div>
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
          <div class="text-[10px] font-bold text-rose-800 uppercase font-mono">Urban Heat Island (UHI) Core</div>
          <div class="text-xs text-ink-700">Wet-Bulb Temp (WBGT): <strong class="font-mono">31.8°C</strong></div>
          <div class="text-[11px] text-rose-800 font-mono font-semibold">Thermal Anomaly: +4.2°C</div>
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
            : isHigh ? 'bg-amber-500 border-white text-white shadow-sm shadow-amber-500/30'
            : 'bg-forest-700 border-white text-white shadow-xs'
          }"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>`,
          iconSize: [28, 28], iconAnchor: [14, 14]
        });
        const marker = L.marker(asset.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="space-y-1.5 font-sans min-w-[200px]">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-bold uppercase tracking-wider text-ink-500 font-mono">${asset.category.replace('_', ' ')}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isSevere ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}">${asset.riskRating}</span>
            </div>
            <div class="font-bold text-ink-900 text-xs">${asset.name}</div>
            <div class="text-[11px] text-ink-700">Value: <strong class="text-forest-800 font-mono">$${asset.estimatedAssetValueMillionsUSD}M</strong> | Flood Limit: <strong class="font-mono">${asset.floodBreachThresholdM}m</strong></div>
            <div class="pt-1 border-t border-sand-200 text-[10px] text-ink-500">Mitigation: ${asset.protectiveMeasures.join(', ')}</div>
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
            : isWarning ? 'bg-amber-500 text-white border-white ring-2 ring-amber-300'
            : 'bg-forest-800 text-sand-50 border-white'
          }"><span class="text-[8px] font-extrabold font-mono">${sensor.type === 'river_stage' ? 'H2O' : sensor.type === 'soil_moisture' ? 'SOIL' : sensor.type === 'wet_bulb_temp' ? 'WB' : 'RN'}</span></div>`,
          iconSize: [24, 24], iconAnchor: [12, 12]
        });
        const marker = L.marker(sensor.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="space-y-1 font-sans min-w-[190px]">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono font-bold text-forest-800">${sensor.id}</span>
              <span class="text-ink-500 font-mono">Batt: ${sensor.batteryPct}%</span>
            </div>
            <div class="font-bold text-ink-900 text-xs">${sensor.name}</div>
            <div class="text-[11px] text-ink-700">Live Value: <span class="font-mono font-bold ${isWarning ? 'text-amber-800' : 'text-forest-900'}">${sensor.currentValue} ${sensor.unit}</span></div>
            <div class="text-[10px] text-ink-400 font-mono">Normal: ${sensor.normalRange[0]} - ${sensor.normalRange[1]} ${sensor.unit}</div>
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
              <span class="bg-rose-50 text-rose-800 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold border border-rose-200">${inc.id}</span>
              <span class="text-[10px] text-rose-800 font-mono font-bold uppercase">${inc.severity}</span>
            </div>
            <div class="font-bold text-ink-900 text-xs leading-snug">${inc.title}</div>
            <div class="text-[11px] text-ink-700">${inc.department} • <span class="font-medium text-amber-800 capitalize">${inc.status.replace('_', ' ')}</span></div>
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

      const tileUrl = mapStyle === 'light'
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

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const layerControls = (
    <div
      className={`absolute top-3 right-3 z-30 bg-white/95 border border-sand-200 rounded-2xl p-3.5 shadow-lg backdrop-blur-md max-w-xs space-y-3 transition-all ${
        mobileControlsOpen ? 'block' : 'hidden sm:block'
      }`}
    >
      <div className="flex items-center justify-between border-b border-sand-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-900 font-mono">
          <Layers className="w-3.5 h-3.5 text-forest-700" />
          {t('map.layersTitle', 'Map Layers')}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {t('common.live', 'Live')}
          </span>
          <button
            onClick={() => setMobileControlsOpen(false)}
            className="sm:hidden w-6 h-6 rounded-full bg-sand-100 flex items-center justify-center text-ink-500"
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
          { key: 'criticalAssets', icon: Building, iconClass: 'text-forest-700', label: `${t('map.criticalAssets', 'Protected Buildings')} (${assets.length})` },
          { key: 'sensorNodes', icon: Radio, iconClass: 'text-teal-600', label: `${t('map.sensors', 'Water & Weather Sensors')} (${sensors.length})` },
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
              className="rounded text-forest-800 accent-forest-700"
            />
          </label>
        ))}
      </div>

      <div className="pt-2 border-t border-sand-200 flex items-center justify-between gap-1">
        {(['light', 'satellite', 'terrain'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all ${
              mapStyle === style ? 'bg-forest-900 text-sand-50 font-bold' : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
            }`}
          >
            {t(`map.style${style.charAt(0).toUpperCase() + style.slice(1)}`, style.charAt(0).toUpperCase() + style.slice(1))}
          </button>
        ))}
      </div>
    </div>
  );

  const legendBar = (
    <div className={`absolute bottom-3 left-3 right-16 z-20 bg-white/90 border border-sand-200 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs ${expanded ? 'max-w-3xl' : ''}`}>
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span className="font-semibold text-ink-500 text-[10px] uppercase tracking-wider font-mono">{t('map.keyLabel', 'Key')}:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 border border-white"></span>
          <span className="text-ink-700 text-[11px]">{t('map.floodInundation', 'Flood Danger Zones')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
          <span className="text-ink-700 text-[11px]">{t('map.droughtSoil', 'Dry Soil Areas')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white animate-ping"></span>
          <span className="text-ink-900 font-bold text-[11px]">{t('map.activeEmergency', 'Active Warning')}</span>
        </div>
      </div>
      <div className="hidden md:block text-[11px] font-mono text-ink-500">
        Area: <span className="text-forest-900 font-bold">{location.name}</span> ({location.elevationM}m ASL)
      </div>
    </div>
  );

  // ── Collapsed: inline in the page layout ──
  const collapsedView = (
    <div
      id="gis-risk-map-panel"
      className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] bg-sand-100 rounded-3xl overflow-hidden select-none"
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <button
        onClick={toggleExpand}
        className="absolute top-3 left-3 z-30 bg-white/95 border border-sand-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-800 backdrop-blur-md hover:bg-white transition-colors"
        title="Expand map"
      >
        <Maximize2 className="w-3.5 h-3.5 text-forest-700" />
        <span className="hidden sm:inline">{t('map.expand', 'Expand')}</span>
      </button>

      <button
        onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
        className="sm:hidden absolute top-3 right-3 z-30 bg-white/95 border border-sand-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-800 backdrop-blur-md"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-forest-700" />
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
      className="fixed inset-0 z-[9999] bg-sand-100"
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      <button
        onClick={toggleExpand}
        className="absolute top-3 left-3 z-30 bg-white/95 border border-sand-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-800 backdrop-blur-md hover:bg-white transition-colors"
        title="Collapse map"
      >
        <Minimize2 className="w-3.5 h-3.5 text-forest-700" />
        <span>{t('map.collapse', 'Collapse')}</span>
      </button>

      <button
        onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
        className="sm:hidden absolute top-3 right-3 z-30 bg-white/95 border border-sand-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-semibold text-ink-800 backdrop-blur-md"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-forest-700" />
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

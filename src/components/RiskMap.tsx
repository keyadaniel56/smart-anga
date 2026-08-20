import React, { useEffect, useRef, useState } from 'react';
import { 
  Layers, 
  Waves, 
  Sun, 
  Flame, 
  Building, 
  Radio, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Zap, 
  Compass
} from 'lucide-react';
import { LocationProfile, SensorNode, CriticalAsset, DepartmentIncident } from '../types/climate';

interface RiskMapProps {
  location: LocationProfile;
  sensors: SensorNode[];
  assets: CriticalAsset[];
  incidents: DepartmentIncident[];
  onTriggerDispatch?: (incident: Partial<DepartmentIncident>) => void;
  onSelectSensor?: (sensor: SensorNode) => void;
}

export const RiskMap: React.FC<RiskMapProps> = ({
  location,
  sensors,
  assets,
  incidents,
  onTriggerDispatch,
  onSelectSensor
}) => {
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

  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'terrain'>('dark');
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Dynamically require or check window.L / leaflet
    const initMap = async () => {
      const L = (window as any).L || (await import('leaflet')).default;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: location.coordinates,
          zoom: 12,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Base Tile Layer (CartoDB Dark Matter)
        const tileUrl = mapStyle === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : mapStyle === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(tileUrl, {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 18
        }).addTo(map);

        leafletMapRef.current = map;
        (leafletMapRef.current as any)._baseTile = tileLayer;

        // Initialize Layer Groups
        layerGroupsRef.current = {
          floodPlumes: L.layerGroup().addTo(map),
          droughtZones: L.layerGroup().addTo(map),
          heatIslands: L.layerGroup().addTo(map),
          criticalAssets: L.layerGroup().addTo(map),
          sensorNodes: L.layerGroup().addTo(map),
          activeIncidents: L.layerGroup().addTo(map)
        };
      } else {
        leafletMapRef.current.setView(location.coordinates, 12, { animate: true });
      }

      renderMapLayers(L);
    };

    initMap();

    return () => {
      // Map cleanup if component unmounts
    };
  }, [location, mapStyle]);

  // Update layers whenever data or visibility changes
  useEffect(() => {
    const updateLayers = async () => {
      const L = (window as any).L || (await import('leaflet')).default;
      if (!leafletMapRef.current) return;
      renderMapLayers(L);
    };
    updateLayers();
  }, [layersVisibility, sensors, assets, incidents, location]);

  const renderMapLayers = (L: any) => {
    const groups = layerGroupsRef.current;
    if (!groups.floodPlumes) return;

    // Clear previous layers
    Object.values(groups).forEach((g: any) => g.clearLayers());

    const [lat, lng] = location.coordinates;

    // 1. Flood Inundation Plumes (Dynamic Catchment Polygons)
    if (layersVisibility.floodPlumes) {
      // High-risk river corridor buffer
      const floodCoords = [
        [lat + 0.03, lng - 0.04],
        [lat + 0.02, lng - 0.01],
        [lat + 0.005, lng + 0.02],
        [lat - 0.015, lng + 0.05],
        [lat - 0.025, lng + 0.04],
        [lat - 0.01, lng + 0.01],
        [lat + 0.01, lng - 0.02]
      ];

      L.polygon(floodCoords, {
        color: '#06b6d4',
        fillColor: '#0891b2',
        fillOpacity: 0.35,
        weight: 2,
        dashArray: '4, 4'
      })
      .bindPopup(`
        <div class="p-2 space-y-1">
          <div class="text-xs font-bold text-cyan-400 uppercase tracking-wider">High Risk Inundation Zone</div>
          <div class="text-sm font-semibold text-slate-100">${location.riverBasin || 'Catchment Basin'} Flood Plain</div>
          <div class="text-xs text-slate-300">Projected 1-in-50 Year Stage Height: <strong>5.4m</strong></div>
          <div class="text-xs text-amber-300 font-mono">Catchment Saturation: 87.4%</div>
        </div>
      `)
      .addTo(groups.floodPlumes);

      // Flash Flood Surge Circle
      L.circle([lat + 0.015, lng - 0.025], {
        radius: 1800,
        color: '#3b82f6',
        fillColor: '#2563eb',
        fillOpacity: 0.25,
        weight: 1.5
      }).bindPopup('<div class="p-1 font-sans text-xs"><strong>Flash Runoff Hotspot</strong><br/>Time to peak: 45 minutes</div>').addTo(groups.floodPlumes);
    }

    // 2. Drought & Soil Moisture Depletion Zones
    if (layersVisibility.droughtZones) {
      L.circle([lat - 0.02, lng - 0.03], {
        radius: 2600,
        color: '#d97706',
        fillColor: '#b45309',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '6, 6'
      })
      .bindPopup(`
        <div class="p-2 space-y-1">
          <div class="text-xs font-bold text-amber-400 uppercase">Agricultural Soil Deficit</div>
          <div class="text-xs text-slate-200">Root-zone (0-28cm) moisture down to <strong>14.2%</strong></div>
          <div class="text-xs text-red-300">SPEI Index: -1.82 (Severe Drought)</div>
        </div>
      `)
      .addTo(groups.droughtZones);
    }

    // 3. Urban Heat Island Hotspots
    if (layersVisibility.heatIslands) {
      L.circle([lat + 0.01, lng + 0.01], {
        radius: 2000,
        color: '#ef4444',
        fillColor: '#dc2626',
        fillOpacity: 0.25,
        weight: 1.5
      })
      .bindPopup(`
        <div class="p-2 space-y-1">
          <div class="text-xs font-bold text-red-400 uppercase">Urban Heat Island (UHI) Core</div>
          <div class="text-xs text-slate-200">Wet-Bulb Globe Temp (WBGT): <strong>31.8°C</strong></div>
          <div class="text-xs text-amber-300">Thermal Anomaly: +4.2°C vs surrounding rural baseline</div>
        </div>
      `)
      .addTo(groups.heatIslands);
    }

    // 4. Critical Infrastructure Assets
    if (layersVisibility.criticalAssets) {
      assets.forEach((asset) => {
        const iconHtml = `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            asset.riskRating === 'Severe'
              ? 'bg-red-950 border-red-500 text-red-400 shadow-lg shadow-red-500/40 animate-pulse'
              : asset.riskRating === 'High'
              ? 'bg-amber-950 border-amber-500 text-amber-400 shadow-md shadow-amber-500/30'
              : 'bg-teal-950 border-teal-500 text-teal-400'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-asset-marker',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker(asset.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="p-2 space-y-1.5 font-sans min-w-[200px]">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${asset.category.replace('_', ' ')}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${
                asset.riskRating === 'Severe' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }">${asset.riskRating} Risk</span>
            </div>
            <div class="font-bold text-slate-100 text-sm">${asset.name}</div>
            <div class="text-xs text-slate-300">Est. Asset Value: <strong class="text-emerald-400">$${asset.estimatedAssetValueMillionsUSD}M</strong></div>
            <div class="text-xs text-slate-300">Elevation: <strong>${asset.elevationM}m</strong> | Flood Limit: <strong>${asset.floodBreachThresholdM}m</strong></div>
            <div class="pt-1 border-t border-slate-700/60 text-[11px] text-slate-400">
              Protective: ${asset.protectiveMeasures.join(', ')}
            </div>
          </div>
        `);
        marker.addTo(groups.criticalAssets);
      });
    }

    // 5. Live IoT Sensor Nodes
    if (layersVisibility.sensorNodes) {
      sensors.forEach((sensor) => {
        const isWarning = sensor.status === 'warning' || sensor.status === 'critical';
        const iconHtml = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full border ${
            sensor.status === 'critical'
              ? 'bg-red-500 text-white border-red-200 ring-4 ring-red-500/30 shadow-md'
              : sensor.status === 'warning'
              ? 'bg-amber-500 text-slate-950 border-amber-200 ring-2 ring-amber-500/30'
              : 'bg-teal-500 text-slate-950 border-teal-200'
          }">
            <span class="text-[10px] font-extrabold font-mono">
              ${sensor.type === 'river_stage' ? 'H2O' : sensor.type === 'soil_moisture' ? 'SOIL' : sensor.type === 'wet_bulb_temp' ? 'WBGT' : 'RN'}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-sensor-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker(sensor.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="p-2 space-y-1 font-sans min-w-[210px]">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono text-teal-400">${sensor.id}</span>
              <span class="text-slate-400 font-medium">Battery: ${sensor.batteryPct}%</span>
            </div>
            <div class="font-bold text-slate-100 text-sm">${sensor.name}</div>
            <div class="text-xs text-slate-300">
              Live Value: <span class="font-mono font-bold text-base ${isWarning ? 'text-amber-400' : 'text-teal-300'}">${sensor.currentValue} ${sensor.unit}</span>
            </div>
            <div class="text-[11px] text-slate-400">Normal Range: ${sensor.normalRange[0]} - ${sensor.normalRange[1]} ${sensor.unit}</div>
            <div class="text-[10px] text-slate-500">Updated: ${sensor.lastUpdated}</div>
          </div>
        `);
        marker.addTo(groups.sensorNodes);
      });
    }

    // 6. Active Emergency Incidents
    if (layersVisibility.activeIncidents) {
      incidents.forEach((inc) => {
        const iconHtml = `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-xl shadow-red-600/50 animate-bounce">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker(inc.coordinates, { icon: customIcon });
        marker.bindPopup(`
          <div class="p-2 space-y-1.5 font-sans min-w-[240px]">
            <div class="flex items-center justify-between">
              <span class="bg-red-500/20 text-red-400 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">${inc.id}</span>
              <span class="text-[10px] text-red-300 font-bold uppercase">${inc.severity} Priority</span>
            </div>
            <div class="font-bold text-slate-100 text-sm leading-tight">${inc.title}</div>
            <div class="text-xs text-slate-300">Dept: <strong>${inc.department}</strong> (${inc.assignedTo})</div>
            <div class="text-xs text-slate-400">Status: <strong class="text-amber-300 capitalize">${inc.status.replace('_', ' ')}</strong></div>
            <div class="text-[11px] text-slate-300 bg-slate-800/80 p-1.5 rounded border border-slate-700">
              ${inc.actionsTaken[0] || 'Coordinating dispatch teams'}
            </div>
          </div>
        `);
        marker.addTo(groups.activeIncidents);
      });
    }
  };

  return (
    <div id="gis-risk-map-panel" className="relative w-full h-[640px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Controls Panel */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            GIS Overlays
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE SYNC</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              Flood Inundation
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.floodPlumes}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, floodPlumes: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Drought & Soil
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.droughtZones}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, droughtZones: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Heat Island (UHI)
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.heatIslands}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, heatIslands: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              Critical Assets ({assets.length})
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.criticalAssets}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, criticalAssets: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              IoT Hydro Sensors ({sensors.length})
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.sensorNodes}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, sensorNodes: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Incidents ({incidents.length})
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.activeIncidents}
              onChange={(e) => setLayersVisibility({ ...layersVisibility, activeIncidents: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
          </label>
        </div>

        {/* Base Map Switcher */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
          <button
            onClick={() => setMapStyle('dark')}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg ${
              mapStyle === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg ${
              mapStyle === 'satellite' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('terrain')}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg ${
              mapStyle === 'terrain' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Terrain
          </button>
        </div>
      </div>

      {/* Bottom Map Legend Bar */}
      <div className="absolute bottom-4 left-4 right-16 z-20 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Hazard Key:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 border border-cyan-300"></span>
            <span className="text-slate-300 text-[11px]">Flood Inundation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-300"></span>
            <span className="text-slate-300 text-[11px]">Drought Deficit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-300"></span>
            <span className="text-slate-300 text-[11px]">Urban Heat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white animate-ping"></span>
            <span className="text-slate-300 font-bold text-[11px]">Live Emergency</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Target Catchment: <span className="text-emerald-400 font-semibold">{location.name}</span> ({location.elevationM}m ASL)
        </div>
      </div>
    </div>
  );
};

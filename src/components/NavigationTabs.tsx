import React from 'react';
import { 
  Map, 
  Waves, 
  Sun, 
  ShieldAlert, 
  Radio, 
  Building2, 
  FlaskConical, 
  Cpu
} from 'lucide-react';
import { NavigationTabType } from '../types/climate';

interface NavigationTabsProps {
  activeTab: NavigationTabType;
  onSelectTab: (tab: NavigationTabType) => void;
  activeAlertsCount?: number;
  activeIncidentsCount?: number;
  activeAlertCount?: number;
  activeIncidentCount?: number;
  anomaliesDetectedCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount = 0,
  activeIncidentsCount = 0,
  activeAlertCount = 0,
  activeIncidentCount = 0,
  anomaliesDetectedCount = 0
}) => {
  const alertsTotal = activeAlertsCount || activeAlertCount;
  const incidentsTotal = activeIncidentsCount || activeIncidentCount;

  const tabs: {
    id: NavigationTabType;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview_gis',
      label: 'Overview & GIS',
      icon: Map,
      badge: alertsTotal > 0 ? `${alertsTotal} Active` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      id: 'flood_prediction',
      label: 'Flood Prediction',
      icon: Waves,
      badge: 'Live Hydro',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      id: 'drought_assessment',
      label: 'Drought & Agro Risk',
      icon: Sun,
      badge: 'SPEI Deficit',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'vulnerability_var',
      label: 'Vulnerability & VaR',
      icon: ShieldAlert,
      badge: undefined
    },
    {
      id: 'early_warning',
      label: 'EWS & Dispatch',
      icon: Radio,
      badge: incidentsTotal > 0 ? `${incidentsTotal} Incidents` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    {
      id: 'sme_preparedness',
      label: 'SME Preparedness',
      icon: Building2,
      badge: 'Resilience AI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'scenario_simulator',
      label: 'Climate Stress Studio',
      icon: FlaskConical,
      badge: 'Simulator',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'sensor_telemetry',
      label: 'IoT Sensors & Anomaly',
      icon: Cpu,
      badge: anomaliesDetectedCount > 0 ? `${anomaliesDetectedCount} Alert` : 'Online',
      badgeColor: anomaliesDetectedCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400'
    }
  ];

  return (
    <nav id="module-navigation" className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white border border-slate-700 shadow-md shadow-slate-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono border ${tab.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { 
  Map, 
  Waves, 
  Sun, 
  ShieldAlert, 
  Radio, 
  Building2, 
  FlaskConical, 
  Cpu,
  Menu,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { NavigationTabType } from '../types/climate';
import { RiskBadge } from './ui/RiskBadge';

interface NavigationTabsProps {
  activeTab: NavigationTabType;
  onSelectTab: (tab: NavigationTabType) => void;
  activeAlertsCount?: number;
  activeIncidentsCount?: number;
  activeAlertCount?: number;
  activeIncidentCount?: number;
  anomaliesDetectedCount?: number;
  isMobileDrawerOpen?: boolean;
  onToggleMobileDrawer?: () => void;
}

export const NAV_ITEMS: {
  id: NavigationTabType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'overview_gis',
    label: 'Overview & GIS',
    shortLabel: 'Overview',
    icon: Map,
    description: 'Multi-hazard regional map & live telemetry matrix'
  },
  {
    id: 'flood_prediction',
    label: 'Flood Prediction',
    shortLabel: 'Flood',
    icon: Waves,
    description: 'Stream discharge, hydrographs & flood defense'
  },
  {
    id: 'drought_assessment',
    label: 'Drought & Agro Risk',
    shortLabel: 'Drought',
    icon: Sun,
    description: 'SPEI index, soil moisture horizons & crop stress'
  },
  {
    id: 'vulnerability_var',
    label: 'Vulnerability & VaR',
    shortLabel: 'Vulnerability',
    icon: ShieldAlert,
    description: 'Financial Value-at-Risk & infrastructure registry'
  },
  {
    id: 'early_warning',
    label: 'EWS & Dispatch',
    shortLabel: 'EWS',
    icon: Radio,
    description: 'CAP protocol broadcast & inter-agency dispatch'
  },
  {
    id: 'sme_preparedness',
    label: 'SME Preparedness',
    shortLabel: 'SME',
    icon: Building2,
    description: 'Facility hardening & business continuity plans'
  },
  {
    id: 'scenario_simulator',
    label: 'Climate Stress Studio',
    shortLabel: 'Simulator',
    icon: FlaskConical,
    description: 'Cascade impact simulation & adaptation modeling'
  },
  {
    id: 'sensor_telemetry',
    label: 'IoT Sensors & Feed',
    shortLabel: 'Sensors',
    icon: Cpu,
    description: 'Live hardware stream gauges & anomaly detection'
  }
];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount = 0,
  activeIncidentsCount = 0,
  activeAlertCount = 0,
  activeIncidentCount = 0,
  anomaliesDetectedCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const alertsTotal = activeAlertsCount || activeAlertCount;
  const incidentsTotal = activeIncidentsCount || activeIncidentCount;

  const getBadgeForTab = (id: NavigationTabType) => {
    if (id === 'overview_gis' && alertsTotal > 0) {
      return <RiskBadge level="critical" size="xs" label={`${alertsTotal} Alert${alertsTotal > 1 ? 's' : ''}`} />;
    }
    if (id === 'early_warning' && incidentsTotal > 0) {
      return <RiskBadge level="high" size="xs" label={`${incidentsTotal} Active`} />;
    }
    if (id === 'sensor_telemetry' && anomaliesDetectedCount > 0) {
      return <RiskBadge level="moderate" size="xs" label={`${anomaliesDetectedCount} Anomaly`} />;
    }
    return null;
  };

  // Primary 4 tabs for bottom mobile navigation bar
  const primaryMobileTabs: NavigationTabType[] = [
    'overview_gis',
    'flood_prediction',
    'drought_assessment',
    'early_warning'
  ];

  return (
    <>
      {/* Desktop Sidebar (~256px fixed/sticky) */}
      <aside
        id="desktop-sidebar-navigation"
        className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-sand-100/80 border-r border-sand-200 p-4 space-y-6 select-none"
      >
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-ink-500 uppercase">
            Operations & Analytics
          </div>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge = getBadgeForTab(item.id);

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                    isActive
                      ? 'bg-forest-900 text-sand-50 shadow-md shadow-forest-900/20 font-bold'
                      : 'text-ink-700 hover:text-ink-900 hover:bg-sand-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-teal-400' : 'text-ink-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {badge && <div className="flex-shrink-0 ml-1.5">{badge}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Environmental System Integrity Info Card */}
        <div className="mt-auto p-3.5 rounded-2xl bg-white/80 border border-sand-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-forest-900 font-serif">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              SmartAnga Engine
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              v2.4
            </span>
          </div>
          <p className="text-[11px] text-ink-500 leading-snug">
            Integrated catchment hydrology & institutional resilience protocol.
          </p>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sand-50/95 border-t border-sand-200 backdrop-blur-md px-2 py-1.5 shadow-lg select-none"
      >
        <div className="flex items-center justify-around">
          {primaryMobileTabs.map((tabId) => {
            const item = NAV_ITEMS.find((n) => n.id === tabId)!;
            const Icon = item.icon;
            const isActive = activeTab === tabId;
            const hasAlert =
              (tabId === 'overview_gis' && alertsTotal > 0) ||
              (tabId === 'early_warning' && incidentsTotal > 0);

            return (
              <button
                key={tabId}
                id={`mobile-tab-${tabId}`}
                onClick={() => {
                  onSelectTab(tabId);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-forest-900 font-bold'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-forest-900 text-sand-50' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{item.shortLabel}</span>
                {hasAlert && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-sand-50" />
                )}
              </button>
            );
          })}

          {/* More / Menu Drawer Toggle */}
          <button
            id="mobile-more-tabs-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              mobileMenuOpen || !primaryMobileTabs.includes(activeTab)
                ? 'text-forest-900 font-bold'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                mobileMenuOpen || !primaryMobileTabs.includes(activeTab)
                  ? 'bg-forest-900 text-sand-50'
                  : ''
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Modules</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay for All 8 Modules */}
      {mobileMenuOpen && (
        <div
          id="mobile-modules-sheet"
          className="lg:hidden fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-sand-50 rounded-t-3xl border-t border-sand-200 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div>
                <h3 className="text-base font-bold text-ink-900 font-serif">All System Modules</h3>
                <p className="text-xs text-ink-500">Select a climate analytics & response domain</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-sand-200/80 flex items-center justify-center text-ink-700 hover:bg-sand-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-6">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = getBadgeForTab(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-forest-900 text-sand-50 border-forest-900 shadow-md'
                        : 'bg-white/80 border-sand-200 text-ink-900 hover:bg-sand-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-forest-800 text-teal-300' : 'bg-sand-100 text-forest-800 border border-sand-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className={`text-[10px] ${isActive ? 'text-sand-200' : 'text-ink-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {badge}
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-sand-200' : 'text-ink-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

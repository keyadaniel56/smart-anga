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
import { useTranslation } from '../context/LanguageContext';

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

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  activeAlertsCount = 0,
  activeIncidentsCount = 0,
  activeAlertCount = 0,
  activeIncidentCount = 0,
  anomaliesDetectedCount = 0
}) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const alertsTotal = activeAlertsCount || activeAlertCount;
  const incidentsTotal = activeIncidentsCount || activeIncidentCount;

  const navItems: {
    id: NavigationTabType;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    description: string;
  }[] = [
    {
      id: 'overview_gis',
      label: t('nav.overview', 'Overview & Map'),
      shortLabel: t('nav.overview', 'Overview'),
      icon: Map,
      description: t('nav.overviewDesc', 'Community map and live local conditions')
    },
    {
      id: 'flood_prediction',
      label: t('nav.flood', 'River & Flood Watch'),
      shortLabel: t('nav.flood', 'Flood Watch'),
      icon: Waves,
      description: t('nav.floodDesc', 'River height, water flow forecast, and flood defense')
    },
    {
      id: 'drought_assessment',
      label: t('nav.drought', 'Drought & Farming'),
      shortLabel: t('nav.drought', 'Drought'),
      icon: Sun,
      description: t('nav.droughtDesc', 'Soil dryness, reservoir levels, and crop water guides')
    },
    {
      id: 'vulnerability_var',
      label: t('nav.vulnerability', 'Area Risk & Losses'),
      shortLabel: t('nav.vulnerability', 'Risk & Loss'),
      icon: ShieldAlert,
      description: t('nav.vulnerabilityDesc', 'Estimated damage risk to homes, clinics, power, and farms')
    },
    {
      id: 'early_warning',
      label: t('nav.earlyWarning', 'Alerts & Dispatches'),
      shortLabel: t('nav.earlyWarning', 'Alerts'),
      icon: Radio,
      description: t('nav.earlyWarningDesc', 'Official warnings and emergency team responses')
    },
    {
      id: 'sme_preparedness',
      label: t('nav.sme', 'Business Readiness'),
      shortLabel: t('nav.sme', 'Business'),
      icon: Building2,
      description: t('nav.smeDesc', 'Safety checklists and protection for local businesses')
    },
    {
      id: 'scenario_simulator',
      label: t('nav.simulator', 'Weather Shock Test'),
      shortLabel: t('nav.simulator', 'Shock Test'),
      icon: FlaskConical,
      description: t('nav.simulatorDesc', 'Test what happens in severe storms or dry spells')
    },
    {
      id: 'sensor_telemetry',
      label: t('nav.sensors', 'Local Sensor Network'),
      shortLabel: t('nav.sensors', 'Sensors'),
      icon: Cpu,
      description: t('nav.sensorsDesc', 'Live river gauges, soil monitors, and weather sensors')
    }
  ];

  const getBadgeForTab = (id: NavigationTabType) => {
    if (id === 'overview_gis' && alertsTotal > 0) {
      return <RiskBadge level="critical" size="xs" label={`${alertsTotal} ${t('common.active', 'Active')}`} />;
    }
    if (id === 'early_warning' && incidentsTotal > 0) {
      return <RiskBadge level="high" size="xs" label={`${incidentsTotal} ${t('common.active', 'Active')}`} />;
    }
    if (id === 'sensor_telemetry' && anomaliesDetectedCount > 0) {
      return <RiskBadge level="moderate" size="xs" label={`${anomaliesDetectedCount} Alert`} />;
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
        className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-surface-800/80 border-r border-surface-600 p-4 space-y-6 select-none overflow-y-auto min-h-0"
      >
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-ink-500 uppercase">
            {t('nav.operationsTitle', 'Navigation')}
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
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
                      ? 'bg-forest-800 text-ink-900 shadow-md shadow-forest-900/20 font-bold'
                      : 'text-ink-700 hover:text-ink-900 hover:bg-surface-600/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-teal-500' : 'text-ink-500'
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
        <div className="mt-auto p-3.5 rounded-2xl bg-surface-700/80 border border-surface-600 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-forest-500 font-serif">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              SmartAnga
            </span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-500 border border-teal-800/30">
              v2.4
            </span>
          </div>
          <p className="text-[11px] text-ink-500 leading-snug">
            {t('overview.reportCardDesc', 'Clear safety summary and risk assessment for your area.')}
          </p>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 border-t border-surface-600 backdrop-blur-md px-2 py-1.5 shadow-lg select-none"
      >
        <div className="flex items-center justify-around">
          {primaryMobileTabs.map((tabId) => {
            const item = navItems.find((n) => n.id === tabId)!;
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
                    ? 'text-forest-500 font-bold'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-forest-800 text-ink-900' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{item.shortLabel}</span>
                {hasAlert && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-surface-900" />
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
                ? 'text-forest-500 font-bold'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                mobileMenuOpen || !primaryMobileTabs.includes(activeTab)
                  ? 'bg-forest-800 text-ink-900'
                  : ''
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.allModules', 'Modules')}</span>
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
            className="bg-surface-900 rounded-t-3xl border-t border-surface-600 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-600">
              <div>
                <h3 className="text-base font-bold text-ink-900 font-serif">{t('nav.allModules', 'All System Modules')}</h3>
                <p className="text-xs text-ink-500">{t('nav.selectDomain', 'Select a weather risk & safety area')}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-600/80 flex items-center justify-center text-ink-700 hover:bg-surface-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-6">
              {navItems.map((item) => {
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
                        ? 'bg-forest-800 text-ink-900 border-forest-800 shadow-md'
                        : 'bg-surface-700/80 border-surface-600 text-ink-900 hover:bg-surface-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-forest-800 text-teal-300' : 'bg-surface-800 text-forest-500 border border-surface-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className={`text-[10px] ${isActive ? 'text-ink-300' : 'text-ink-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {badge}
                      <ChevronRight className="w-4 h-4 text-ink-300" />
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

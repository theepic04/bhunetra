import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  ScanSearch,
  AlertTriangle,
  History,
  LifeBuoy,
  Navigation,
  ListTodo,
  Network,
  Radio,
  Activity
} from 'lucide-react';
import { UserRole, LanguageCode } from '../types';
import { getTranslation } from '../data/translations';
import { LiveTelemetryModal } from './LiveTelemetryModal';

interface SidebarProps {
  currentRole?: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  selectedLanguage?: LanguageCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole = 'citizen',
  activePage,
  onNavigate,
  isMobileMenuOpen,
  onCloseMobileMenu,
  selectedLanguage = 'en'
}) => {
  const langCode: LanguageCode = (selectedLanguage as LanguageCode) || 'en';
  const t = getTranslation(langCode);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [syncSeconds, setSyncSeconds] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSeconds((prev) => (prev >= 18 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const citizenNavItems = [
    {
      id: 'citizen-dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
      description: 'Your area risk & rainfall'
    },
    {
      id: 'risk-map',
      label: t.riskMap,
      icon: MapPin,
      description: 'NER regional risk zones'
    },
    {
      id: 'check-risk',
      label: t.aiRiskCheck,
      icon: ScanSearch,
      description: 'Photo & location analyzer'
    },
    {
      id: 'alerts',
      label: t.alerts,
      icon: AlertTriangle,
      description: 'Active disaster warnings'
    },
    {
      id: 'safe-routes',
      label: t.safeRoutes,
      icon: Navigation,
      description: 'Shelters & clear bypasses'
    },
    {
      id: 'history',
      label: t.history,
      icon: History,
      description: '24-Month rainfall & slides'
    },
    {
      id: 'emergency',
      label: t.emergencyHelp,
      icon: LifeBuoy,
      highlight: true,
      description: 'Hospitals, shelters & routes'
    }
  ];

  const authorityNavItems = [
    {
      id: 'authority-dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
      description: 'Regional monitoring overview'
    },
    {
      id: 'risk-map',
      label: t.riskMap,
      icon: MapPin,
      description: 'Interactive NER hazard map'
    },
    {
      id: 'alerts',
      label: t.alerts,
      icon: AlertTriangle,
      description: 'Disaster warning broadcast'
    },
    {
      id: 'alert-management',
      label: t.alertManagement,
      icon: ListTodo,
      authorityOnly: true,
      description: 'Triage & workflow actions'
    },
    {
      id: 'history',
      label: t.history,
      icon: History,
      description: 'Historical incidents archive'
    },
    {
      id: 'infrastructure-risk',
      label: t.infrastructureRisk,
      icon: Network,
      authorityOnly: true,
      description: 'NH-10, rail & power lines'
    },
    {
      id: 'safe-routes',
      label: t.safeRoutes,
      icon: Navigation,
      description: 'Shelters & clear bypasses'
    },
    {
      id: 'check-risk',
      label: t.aiRiskCheck,
      icon: ScanSearch,
      description: 'Photo terrain evaluator'
    },
    {
      id: 'emergency',
      label: t.emergencyHelp,
      icon: LifeBuoy,
      description: 'Relief bases & safe routes'
    }
  ];

  const navItems = currentRole === 'authority' ? authorityNavItems : citizenNavItems;

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Desktop & Mobile Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
              {currentRole === 'authority' ? t.authorityPortal : t.citizenPortal}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                currentRole === 'authority'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {(currentRole || 'citizen').toUpperCase()}
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : item.highlight
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-950/60'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-white dark:text-slate-900'
                        : item.highlight
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                        : item.highlight
                        ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Sidebar Info & Portal Return */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
          <button
            type="button"
            id="sidebar-open-telemetry-btn"
            onClick={() => setIsTelemetryModalOpen(true)}
            className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-2xs group"
            title="Click to inspect real-time Doppler radar & piezometer telemetry feeds"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Regional Sensor Mesh</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                Synced {syncSeconds}s ago
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              IMD Doppler radar & piezometer feeds syncing continuously.
            </p>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <Radio className="w-3 h-3" />
              <span>Inspect Live Telemetry Stream →</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Live IoT Doppler Radar & Piezometer Telemetry Stream Modal */}
      <LiveTelemetryModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
      />
    </>
  );
};

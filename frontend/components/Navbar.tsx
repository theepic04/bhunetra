import React, { useState } from 'react';
import {
  Globe,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { UserRole, LanguageCode } from '../types';
import { LANGUAGES } from '../data/mockData';
import { getTranslation } from '../data/translations';
import { ThemeToggle } from './ThemeToggle';
import { BhuNetraSymbol } from './BhuNetraLogo';

interface NavbarProps {
  currentRole?: UserRole;
  onSelectRole: (role: UserRole) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onNavigate: (page: string) => void;
  activePage: string;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole = 'citizen',
  onSelectRole,
  selectedLanguage,
  onSelectLanguage,
  onNavigate,
  activePage,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];
  const t = getTranslation(selectedLanguage);

  const citizenNavItems = [
    { id: 'citizen-dashboard', label: t.dashboard },
    { id: 'risk-map', label: t.riskMap },
    { id: 'check-risk', label: t.aiRiskCheck },
    { id: 'alerts', label: t.alerts },
    { id: 'safe-routes', label: t.safeRoutes },
    { id: 'history', label: t.history },
    { id: 'emergency', label: t.emergencyHelp }
  ];

  const authorityNavItems = [
    { id: 'authority-dashboard', label: t.dashboard },
    { id: 'risk-map', label: t.riskMap },
    { id: 'alerts', label: t.alerts },
    { id: 'alert-management', label: t.alertManagement },
    { id: 'history', label: t.history },
    { id: 'infrastructure-risk', label: t.infrastructureRisk },
    { id: 'safe-routes', label: t.safeRoutes },
    { id: 'check-risk', label: t.aiRiskCheck },
    { id: 'emergency', label: t.emergencyHelp }
  ];

  const publicNavItems = [
    { id: 'citizen-dashboard', label: t.dashboard },
    { id: 'risk-map', label: t.riskMap },
    { id: 'check-risk', label: t.aiRiskCheck },
    { id: 'safe-routes', label: t.safeRoutes },
    { id: 'emergency', label: t.emergencyHelp }
  ];

  const isPortal = activePage !== 'landing' && activePage !== 'login' && activePage !== 'authority-login';
  const currentNavItems = currentRole === 'authority' ? authorityNavItems : citizenNavItems;

  const getActivePageLabel = () => {
    const allItems = [...authorityNavItems, ...citizenNavItems, ...publicNavItems];
    const found = allItems.find((item) => item.id === activePage);
    if (found) return found.label;
    if (activePage === 'authority-dashboard') return t.authorityDashboard || 'Dashboard';
    if (activePage === 'citizen-dashboard') return t.citizenDashboard || 'Dashboard';
    if (activePage === 'risk-map') return t.riskMap || 'Risk Map';
    if (activePage === 'alerts') return t.alerts || 'Alerts';
    if (activePage === 'alert-management') return t.alertManagement || 'Alert Management';
    if (activePage === 'infrastructure-risk') return t.infrastructureRisk || 'Infrastructure Risk';
    if (activePage === 'check-risk') return t.aiRiskCheck || 'AI Risk Check';
    if (activePage === 'safe-routes') return t.safeRoutes || 'Safe Routes';
    if (activePage === 'emergency') return t.emergencyHelp || 'Emergency Help';
    if (activePage === 'history') return t.history || 'Incident History';
    return 'Console';
  };

  const activeLabel = getActivePageLabel();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors w-full">
      {/* Main navigation bar spanning full width: Left brand & breadcrumbs, Center status/links, Right utilities */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Left-most: Logo, Brand "BhuNetra" & Context Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="mobile-menu-toggle-btn"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              id="brand-logo-btn"
              onClick={() => onNavigate(isPortal ? (currentRole === 'citizen' ? 'citizen-dashboard' : 'authority-dashboard') : 'landing')}
              className="flex items-center space-x-2.5 text-left focus:outline-hidden group cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 bhunetra-logo-frame border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shadow-2xs group-hover:border-emerald-500 transition-colors shrink-0">
                <BhuNetraSymbol className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="shrink-0">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  BhuNetra
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  See Risk. Save Lives.
                </span>
              </div>
            </button>

            {/* Portal Context Breadcrumb for active portal view */}
            {isPortal && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                    currentRole === 'authority'
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {currentRole === 'authority' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span>{currentRole === 'authority' ? 'Authority Console' : 'Citizen Portal'}</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600 text-xs">/</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px] lg:max-w-[220px]">
                  {activeLabel}
                </span>
              </div>
            )}
          </div>

          {/* Center: Public Links on Landing; Status Indicator on Portal */}
          {!isPortal ? (
            <nav className="hidden lg:flex flex-1 items-center justify-center px-4 xl:px-8 min-w-0">
              <div className="flex items-center space-x-1 xl:space-x-1.5 flex-nowrap">
                {publicNavItems.map((item) => {
                  const isActive =
                    activePage === item.id ||
                    (item.id === 'emergency' && activePage === 'safe-routes');
                  return (
                    <button
                      key={item.id}
                      id={`nav-link-${item.id}`}
                      onClick={() => onNavigate(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          ) : (
            <div className="flex-1" />
          )}

          {/* Right-most: Theme Toggle, Notifications, Language, Profile, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 justify-end">
            {/* Theme Toggle (☀️ Light / 🌙 Dark) */}
            <ThemeToggle />

            {/* Language Selector */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                title="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{currentLangObj.label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                    {t.selectLanguage}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      id={`lang-option-${lang.code}`}
                      onClick={() => {
                        onSelectLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        selectedLanguage === lang.code
                          ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {selectedLanguage === lang.code && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile & Logout in Portal View */}
            {isPortal ? (
              <div className="flex items-center space-x-2">
                {/* Profile Button / Dropdown */}
                <div className="relative">
                  <button
                    id="user-profile-btn"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      currentRole === 'authority'
                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {currentRole === 'authority' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="hidden sm:inline font-bold">
                      {currentRole === 'authority' ? 'Authority' : 'Citizen'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50 text-xs">
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {currentRole === 'authority' ? 'Disaster Authority' : 'Citizen Profile'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {currentRole === 'authority'
                            ? 'NDRF / SDMA North Eastern Region'
                            : '📍 Gangtok, Sikkim'}
                        </div>
                        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          currentRole === 'authority'
                            ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60'
                            : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{currentRole === 'authority' ? 'Official Incident Control' : 'Emergency Alerts Active'}</span>
                        </div>
                      </div>

                      <div className="px-1 py-1">
                        <button
                          onClick={() => {
                            onSelectRole('citizen');
                            setIsProfileOpen(false);
                            onNavigate('citizen-dashboard');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.citizenDashboard}</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (currentRole === 'authority') {
                              onNavigate('authority-dashboard');
                            } else {
                              onNavigate('authority-login');
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{t.authorityDashboard}</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onNavigate('login');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  id="navbar-logout-btn"
                  onClick={() => onNavigate('login')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            ) : (
              /* Public / Landing buttons */
              <div className="flex items-center space-x-2">
                <button
                  id="nav-check-area-btn"
                  onClick={() => onNavigate('citizen-dashboard')}
                  className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  {t.checkMyArea}
                </button>
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                >
                  {t.login}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-3 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.theme}</span>
            <ThemeToggle showLabelsOnMobile={true} />
          </div>

          {isPortal ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {currentRole === 'authority' ? 'Authority Portal Menu' : 'Citizen Portal Menu'}
              </div>
              {currentNavItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-portal-nav-${item.id}`}
                    onClick={() => {
                      onNavigate(item.id);
                      onToggleMobileMenu();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? currentRole === 'authority'
                          ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-bold'
                          : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">●</span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <button
                  id="mobile-portal-switch-role"
                  onClick={() => {
                    onSelectRole(currentRole === 'citizen' ? 'authority' : 'citizen');
                    onNavigate(currentRole === 'citizen' ? 'authority-login' : 'citizen-dashboard');
                    onToggleMobileMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {currentRole === 'citizen' ? 'Switch to Authority Login' : 'Switch to Citizen View'}
                </button>
                <button
                  id="mobile-portal-logout"
                  onClick={() => {
                    onNavigate('landing');
                    onToggleMobileMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-between cursor-pointer"
                >
                  <span>{t.logout}</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                id="mobile-nav-check-area"
                onClick={() => {
                  onNavigate('citizen-dashboard');
                  onToggleMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>{t.citizenDashboard}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{t.checkRisk}</span>
              </button>
              <button
                id="mobile-nav-risk-map"
                onClick={() => {
                  onNavigate('risk-map');
                  onToggleMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>{t.riskMap}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">NER States</span>
              </button>
              <button
                id="mobile-nav-check-risk"
                onClick={() => {
                  onNavigate('check-risk');
                  onToggleMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>{t.aiRiskCheck}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{t.uploadImage}</span>
              </button>
              <button
                id="mobile-nav-emergency"
                onClick={() => {
                  onNavigate('emergency');
                  onToggleMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-between cursor-pointer"
              >
                <span>{t.emergencyHelp}</span>
                <span className="text-xs text-red-500 font-bold">1070 / 112</span>
              </button>
              <div className="pt-2">
                <button
                  id="mobile-nav-login"
                  onClick={() => {
                    onNavigate('login');
                    onToggleMobileMenu();
                  }}
                  className="w-full text-center py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {t.login}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

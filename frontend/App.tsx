import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AlertsProvider } from './context/AlertsContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { AuthorityLogin } from './components/AuthorityLogin';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { RiskMapPage } from './components/RiskMapPage';
import { CheckRiskPage } from './components/CheckRiskPage';
import { SafeRoutesPage } from './components/SafeRoutesPage';
import { AlertsPage } from './components/AlertsPage';
import { EmergencyPage } from './components/EmergencyPage';
import { HistoryPage } from './components/HistoryPage';
import { AuthorityAlertManagement } from './components/AuthorityAlertManagement';
import { InfrastructureRiskPage } from './components/InfrastructureRiskPage';
import { AccessRestricted } from './components/AccessRestricted';
import { UserRole, LanguageCode, RiskZone } from './types';
import { MOCK_ZONES } from './data/mockData';
import { getStoredLanguage, setStoredLanguage, getTranslation } from './data/translations';
import {
  LayoutDashboard,
  MapPin,
  ScanSearch,
  AlertTriangle,
  LifeBuoy,
  ListTodo
} from 'lucide-react';

export default function App() {
  // Navigation & Role State
  const [activePage, setActivePage] = useState<string>('landing');
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => getStoredLanguage());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [mapSelectedZone, setMapSelectedZone] = useState<RiskZone | null>(null);

  const t = getTranslation(selectedLanguage);

  const handleSelectLanguage = (lang: LanguageCode) => {
    setSelectedLanguage(lang);
    setStoredLanguage(lang);
  };

  const [selectedAlertIdForManagement, setSelectedAlertIdForManagement] = useState<string | undefined>(undefined);

  // Quick navigation handler
  const handleNavigate = (page: string, extraParam?: string) => {
    let target = page;
    if (page === 'dashboard') {
      target = currentRole === 'authority' ? 'authority-dashboard' : 'citizen-dashboard';
    } else if (page === 'ai-risk-check') {
      target = 'check-risk';
    } else if (page === 'home') {
      target = 'landing';
    } else if (page === 'logout') {
      target = 'login';
    }

    if (target === 'alert-management') {
      if (extraParam) {
        setSelectedAlertIdForManagement(extraParam);
      }
    } else {
      // Clear alert selection when navigating elsewhere
      setSelectedAlertIdForManagement(undefined);
    }

    setActivePage(target);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Login handler
  const handleSelectRoleAndNavigate = (role: UserRole, targetPage: string) => {
    setCurrentRole(role);
    setActivePage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle zone selection for map jump
  const handleSelectZoneForMap = (zoneOrId: RiskZone | string) => {
    if (typeof zoneOrId === 'string') {
      const match = MOCK_ZONES.find((z) => z.id === zoneOrId);
      if (match) setMapSelectedZone(match);
    } else {
      setMapSelectedZone(zoneOrId);
    }
    setActivePage('risk-map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPortalView = activePage !== 'landing' && activePage !== 'login' && activePage !== 'authority-login';

  return (
    <ThemeProvider>
      <AlertsProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
        {/* Top Main Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        onNavigate={handleNavigate}
        activePage={activePage}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full relative">
        {/* Left Sidebar (Only visible in portal view: dashboards & tools) */}
        {isPortalView && (
          <Sidebar
            currentRole={currentRole}
            activePage={activePage}
            onNavigate={handleNavigate}
            isMobileMenuOpen={isMobileMenuOpen}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
            selectedLanguage={selectedLanguage}
          />
        )}

        {/* Content View Container */}
        <main
          className={`flex-1 w-full transition-all pb-16 md:pb-8 ${
            isPortalView ? 'md:ml-64' : 'max-w-full'
          }`}
        >
          {activePage === 'landing' && (
            <LandingPage
              onNavigate={handleNavigate}
              onSelectRole={setCurrentRole}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activePage === 'login' && (
            <LoginPage
              onSelectRoleAndNavigate={handleSelectRoleAndNavigate}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'authority-login' && (
            <AuthorityLogin
              onLoginSuccess={handleSelectRoleAndNavigate}
              onNavigate={handleNavigate}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activePage === 'citizen-dashboard' && (
            <CitizenDashboard
              onNavigate={handleNavigate}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activePage === 'authority-dashboard' && (
            (currentRole === 'authority' || currentRole === 'superadmin') ? (
              <AuthorityDashboard
                onNavigate={handleNavigate}
                onSelectZoneForMap={handleSelectZoneForMap}
                selectedLanguage={selectedLanguage}
              />
            ) : (
              <AccessRestricted
                onNavigate={handleNavigate}
                selectedLanguage={selectedLanguage}
              />
            )
          )}

          {activePage === 'risk-map' && (
            <RiskMapPage
              onNavigate={handleNavigate}
              preSelectedZone={mapSelectedZone}
              currentRole={currentRole}
              selectedLanguage={selectedLanguage}
            />
          )}

          {activePage === 'check-risk' && (
            <CheckRiskPage onNavigate={handleNavigate} />
          )}

          {activePage === 'alerts' && (
            <AlertsPage
              onNavigate={handleNavigate}
              onSelectZoneForMap={handleSelectZoneForMap}
              currentRole={currentRole}
            />
          )}

          {activePage === 'safe-routes' && (
            <SafeRoutesPage onNavigate={handleNavigate} currentRole={currentRole} />
          )}

          {activePage === 'emergency' && (
            <EmergencyPage onNavigate={handleNavigate} currentRole={currentRole} />
          )}

          {activePage === 'history' && (
            <HistoryPage
              selectedLanguage={selectedLanguage}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'alert-management' && (
            (currentRole === 'authority' || currentRole === 'superadmin') ? (
              <AuthorityAlertManagement
                onNavigate={handleNavigate}
                selectedAlertId={selectedAlertIdForManagement}
              />
            ) : (
              <AccessRestricted
                onNavigate={handleNavigate}
                selectedLanguage={selectedLanguage}
              />
            )
          )}

          {activePage === 'infrastructure-risk' && (
            (currentRole === 'authority' || currentRole === 'superadmin') ? (
              <InfrastructureRiskPage />
            ) : (
              <AccessRestricted
                onNavigate={handleNavigate}
                selectedLanguage={selectedLanguage}
              />
            )
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for easy one-thumb access on mobile devices */}
      {isPortalView && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors"
        >
          <button
            onClick={() =>
              handleNavigate(currentRole === 'authority' ? 'authority-dashboard' : 'citizen-dashboard')
            }
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
              activePage === 'citizen-dashboard' || activePage === 'authority-dashboard'
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>{t.dashboard}</span>
          </button>

          <button
            onClick={() => handleNavigate('risk-map')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
              activePage === 'risk-map'
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>{t.riskMap}</span>
          </button>

          <button
            onClick={() => handleNavigate('check-risk')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
              activePage === 'check-risk'
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ScanSearch className="w-5 h-5 mb-0.5" />
            <span>{t.aiRiskCheck}</span>
          </button>

          <button
            onClick={() => handleNavigate('alerts')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold relative transition-colors ${
              activePage === 'alerts'
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mb-0.5" />
            <span>{t.alerts}</span>
          </button>

          {currentRole === 'authority' ? (
            <button
              onClick={() => handleNavigate('alert-management')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                activePage === 'alert-management'
                  ? 'text-blue-700 dark:text-blue-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <ListTodo className="w-5 h-5 mb-0.5" />
              <span>{t.alertManagement}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavigate('emergency')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                activePage === 'emergency'
                  ? 'text-red-700 dark:text-red-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LifeBuoy className="w-5 h-5 mb-0.5" />
              <span>{t.emergencyHelp}</span>
            </button>
          )}
        </nav>
      )}
        </div>
      </AlertsProvider>
    </ThemeProvider>
  );
}

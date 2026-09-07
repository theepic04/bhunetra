import React from 'react';
import {
  CloudRain,
  Droplets,
  Mountain,
  History,
  Brain,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Compass,
  FileCheck2,
  Users
} from 'lucide-react';
import { UserRole, LanguageCode } from '../types';
import { MOCK_ZONES } from '../data/mockData';
import { BhuNetraLogo } from './BhuNetraLogo';
import { getTranslation } from '../data/translations';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onSelectRole: (role: UserRole) => void;
  selectedLanguage?: LanguageCode;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectRole,
  selectedLanguage = 'en'
}) => {
  const t = getTranslation(selectedLanguage);

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Official badge & System Operational indicator */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>System Operational</span>
            <span className="text-emerald-300">•</span>
            <span className="font-normal text-emerald-700">North Eastern Region (NER) Disaster Network</span>
          </div>

          {/* Official Complete BhuNetra Logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs inline-flex items-center justify-center bhunetra-logo-frame">
              <BhuNetraLogo className="w-48 sm:w-60 md:w-68 h-auto" />
            </div>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Early Warning. <span className="text-emerald-700">Safer Communities.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.subTitle}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-check-my-area-btn"
              onClick={() => {
                onSelectRole('citizen');
                onNavigate('citizen-dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t.checkMyArea}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-login-btn"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t.login}</span>
            </button>
          </div>

          {/* Regional coverage chips */}
          <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Covering 8 NER States:</span>
            {['Sikkim', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Assam', 'Tripura'].map((state) => (
              <span key={state} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-600">
                {state}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Section Explaining AI Architecture */}
      {/* Rainfall + Soil Moisture + Terrain + Historical Data → Risk Analysis → Early Warning */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How the Early Warning System Works
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Synthesizing real-time meteorological feeds, ground sensors, and terrain models into proactive public safety warnings.
            </p>
          </div>

          {/* Pipeline flow visual */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Step 1: 4 Inputs */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <CloudRain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Rainfall</h3>
                <p className="text-xs text-slate-500 mt-1">24h & 48h rainfall volume from IMD radar stations.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                  <Droplets className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Soil Moisture</h3>
                <p className="text-xs text-slate-500 mt-1">Sub-surface saturation & pore water pressure sensors.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Mountain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Terrain</h3>
                <p className="text-xs text-slate-500 mt-1">Slope angle, geological bedrock & elevation curvature.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Historical Data</h3>
                <p className="text-xs text-slate-500 mt-1">Decadal landslide records and past failure trigger points.</p>
              </div>
            </div>

            {/* Middle Arrow / Transform */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center p-4">
              <div className="w-full py-4 px-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm text-center relative">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Processing Engine
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  Risk Analysis
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Machine pattern recognition calculating failure thresholds.
                </p>
              </div>
            </div>

            {/* Step 3: Early Warning Output */}
            <div className="lg:col-span-3">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 block">
                  Citizen & NDRF Alert
                </span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">
                  Early Warning
                </span>
                <p className="text-xs text-slate-600 mt-1 leading-normal">
                  Color-coded risk levels, safe evacuation routes and automated SMS notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Regional Status Snapshot */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Live Regional Risk Snapshot
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitored vulnerable transport corridors and mountain districts
              </p>
            </div>
            <button
              id="landing-open-map-btn"
              onClick={() => onNavigate('risk-map')}
              className="mt-3 sm:mt-0 inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>{t.viewFullMap}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_ZONES.slice(0, 3).map((zone) => {
              const isCritical = zone.riskLevel === 'Critical';
              const isHigh = zone.riskLevel === 'High';
              return (
                <div
                  key={zone.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCritical
                      ? 'bg-red-50/50 border-red-200'
                      : isHigh
                      ? 'bg-orange-50/50 border-orange-200'
                      : 'bg-yellow-50/40 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-900 text-sm">{zone.name}</span>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isHigh
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}
                    >
                      {isCritical ? t.critical : isHigh ? t.high : t.watch}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="p-2 rounded-lg bg-white/80 border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">{t.landslideProbability}</span>
                      <span className="font-bold text-slate-900 text-base">{zone.probability}%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">{t.prediction}</span>
                      <span className="font-semibold text-slate-800">{zone.predictionWindow}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                    {zone.activeWarning}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Portal Quick Access */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Select Your Portal
          </h2>
          <p className="text-xs text-slate-600 mb-8 max-w-lg mx-auto">
            Tailored interfaces designed for local residents needing fast evacuation info and government officials managing multi-district operations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {/* Citizen card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t.citizenPortal}</h3>
              <p className="text-xs text-slate-600 mt-2 mb-6">
                {t.checkRisk} • {t.emergencyWarnings} • {t.safeRoutes}
              </p>
              <button
                id="landing-citizen-btn"
                onClick={() => {
                  onSelectRole('citizen');
                  onNavigate('citizen-dashboard');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>{t.login} • {t.citizenPortal}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Authority card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t.authorityPortal}</h3>
              <p className="text-xs text-slate-600 mt-2 mb-6">
                {t.riskMap} • {t.alertManagement} • {t.infrastructureRisk}
              </p>
              <button
                id="landing-authority-btn"
                onClick={() => {
                  onSelectRole('authority');
                  onNavigate('authority-dashboard');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>{t.login} • {t.authorityPortal}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs inline-flex items-center bhunetra-logo-frame">
              <BhuNetraLogo className="w-28 sm:w-32 h-auto" />
            </div>
          </div>
          <div>
            Prototype for Disaster Management & Early Warning • North Eastern Region, India
          </div>
        </div>
      </footer>
    </div>
  );
};

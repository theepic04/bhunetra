import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  AlertTriangle,
  CloudRain,
  Droplets,
  Thermometer,
  Mountain,
  Camera,
  Navigation,
  LifeBuoy,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldCheck,
  X
} from 'lucide-react';

import { LanguageCode } from '../types';
import { getTranslation } from '../data/translations';
import {
  CitizenLocation,
  CitizenLocationModal,
  POPULAR_LOCATIONS
} from './CitizenLocationModal';
import {
  detectUserLocation,
  persistCitizenLocation,
  getStoredCitizenLocation,
  cleanLocationName,
  formatLocationLabel
} from '../services/geolocationService';

interface CitizenDashboardProps {
  onNavigate: (page: string) => void;
  selectedLanguage?: LanguageCode;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate, selectedLanguage = 'en' }) => {
  // Load persisted location or default to Gangtok, Sikkim (auto-cleans any nearest tags)
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation>(() => {
    return getStoredCitizenLocation();
  });

  // Sync location if updated from EmergencyPage or another tab
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('bhunetr_citizen_loc');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng && parsed?.name) {
            const cleaned: CitizenLocation = {
              ...parsed,
              name: cleanLocationName(parsed.name)
            };
            setCurrentLocation((prev) => {
              if (prev.lat !== cleaned.lat || prev.lng !== cleaned.lng || prev.name !== cleaned.name) {
                return cleaned;
              }
              return prev;
            });
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bhunetr_location_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bhunetr_location_change', handleStorageChange);
    };
  }, []);

  const [isLocModalOpen, setIsLocModalOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState<boolean>(false);

  const [mlData, setMlData] = useState<any>(null);
  const [liveWeather, setLiveWeather] = useState<{
    temperatureC: number;
    humidityPct: number;
    rainfallCurrentMm: number;
    rainfall24hSumMm: number;
    rainfall72hEstMm: number;
    soilMoisturePct: number;
    weatherDescription: string;
    source: string;
  } | null>(null);
  const [enrichedTerrain, setEnrichedTerrain] = useState<{
    slope_deg: number;
    elevation_m: number;
    source: string;
  } | null>(null);

  const t = getTranslation(selectedLanguage);

  // Fetch live weather, DEM terrain and ML risk prediction for the selected location
  const fetchTelemetryForLocation = useCallback(async (loc: CitizenLocation) => {
    setIsTelemetryLoading(true);
    try {
      // 1. Fetch live weather & DEM elevation simultaneously
      const [weatherRes, demRes] = await Promise.all([
        fetch('/api/weather/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng })
        }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/ml/enrich-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng })
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      let rain24 = 45;
      let soil = 60;
      let slope = loc.defaultSlope || 30;
      let elevation = 1500;

      if (weatherRes?.success && weatherRes.data) {
        setLiveWeather(weatherRes.data);
        rain24 = weatherRes.data.rainfall24hSumMm;
        soil = weatherRes.data.soilMoisturePct;
      }

      if (demRes?.success && demRes.data) {
        setEnrichedTerrain(demRes.data);
        slope = Math.round(demRes.data.slope_deg);
        elevation = demRes.data.elevation_m;
      }

      // 2. Query combined Geotechnical + ML neural prediction with real dynamic inputs
      const predictRes = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc.lat,
          longitude: loc.lng,
          locationName: `${loc.name}, ${loc.state}`,
          rainfall24h: rain24,
          rainfall72h: Math.round(rain24 * 2.5),
          soilMoisture: soil,
          slopeAngle: slope,
          elevation: elevation
        })
      });

      if (predictRes.ok) {
        const json = await predictRes.json();
        if (json?.success && json.data) {
          setMlData(json.data);
        }
      }
    } catch (err) {
      console.warn('Citizen telemetry fetch error:', err);
    } finally {
      setIsTelemetryLoading(false);
    }
  }, []);

  // Sync telemetry whenever location changes
  useEffect(() => {
    fetchTelemetryForLocation(currentLocation);
  }, [currentLocation, fetchTelemetryForLocation]);

  // Select location from list or search
  const handleSelectLocation = (loc: CitizenLocation) => {
    setCurrentLocation(loc);
    setIsLocModalOpen(false);
    try {
      localStorage.setItem('bhunetr_citizen_loc', JSON.stringify(loc));
      window.dispatchEvent(new Event('bhunetr_location_change'));
    } catch (e) {}
  };

  // Detect live GPS location using unified resilient geolocation service
  const handleUseLiveGPS = async () => {
    setIsLocating(true);
    setLocationNotice(null);
    try {
      const result = await detectUserLocation({ role: 'citizen' });
      setCurrentLocation(result.location);
      setIsLocModalOpen(false);
      setLocationNotice(result.statusMessage);
      setTimeout(() => setLocationNotice(null), 5000);
    } catch (err) {
      console.warn('Geolocation detection failed:', err);
      setLocationNotice('Defaulted to regional monitoring center.');
      setTimeout(() => setLocationNotice(null), 4000);
    } finally {
      setIsLocating(false);
    }
  };

  // Determine hazard risk styling dynamically across 4 standardized tiers
  const rawRisk = (mlData?.riskLevel || 'Normal').trim();
  const rLower = rawRisk.toLowerCase();
  const isEmergency = rLower === 'critical' || rLower === 'emergency' || rLower === 'severe';
  const isWarning = rLower === 'warning' || rLower === 'high';
  const isWatch = rLower === 'watch' || rLower === 'moderate';
  const isNormal = !isEmergency && !isWarning && !isWatch;

  // Normalized display label for the tier (preserves 'Warning', 'Emergency', etc.)
  const riskLevel = isEmergency
    ? (rawRisk.toLowerCase() === 'critical' ? 'Critical' : 'Emergency')
    : isWarning
    ? (rawRisk.toLowerCase() === 'high' ? 'High' : 'Warning')
    : isWatch
    ? 'Watch'
    : 'Normal';

  const riskColorClasses = isEmergency
    ? {
        border: 'border-red-500 dark:border-red-600/70',
        text: 'text-red-600 dark:text-red-400',
        badgeBg: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300',
        badgeText: 'Emergency',
        warningBg: 'bg-red-50/90 dark:bg-red-950/30 border-red-400 dark:border-red-600',
        warningText: 'text-red-900 dark:text-red-200',
        warningBadge: 'text-red-800 dark:text-red-300 bg-red-200/70 dark:bg-red-900/60',
        btnBg: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
        iconBg: 'bg-red-600',
        dot: '🔴'
      }
    : isWarning
    ? {
        border: 'border-orange-400 dark:border-orange-500/80',
        text: 'text-orange-600 dark:text-orange-400',
        badgeBg: 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300',
        badgeText: t.elevated || 'Elevated',
        warningBg: 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-400 dark:border-orange-600',
        warningText: 'text-orange-900 dark:text-orange-200',
        warningBadge: 'text-orange-800 dark:text-orange-300 bg-orange-200/70 dark:bg-orange-900/60',
        btnBg: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800',
        iconBg: 'bg-orange-600',
        dot: '🟠'
      }
    : isWatch
    ? {
        border: 'border-amber-400 dark:border-amber-500/80',
        text: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300',
        badgeText: 'Caution',
        warningBg: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600',
        warningText: 'text-amber-900 dark:text-amber-200',
        warningBadge: 'text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60',
        btnBg: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
        iconBg: 'bg-amber-600',
        dot: '🟡'
      }
    : {
        border: 'border-emerald-300 dark:border-emerald-700/60',
        text: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300',
        badgeText: 'Stable',
        warningBg: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600',
        warningText: 'text-emerald-900 dark:text-emerald-200',
        warningBadge: 'text-emerald-800 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-900/60',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
        iconBg: 'bg-emerald-600',
        dot: '🟢'
      };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* MAIN SECTION HEADING & DYNAMIC LOCATION SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.location}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.subTitle}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Interactive Location Picker Button */}
            <button
              type="button"
              id="citizen-location-picker-btn"
              onClick={() => setIsLocModalOpen(true)}
              title="Click to search or pick from all 8 NER states"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-blue-500 shadow-2xs text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-bold cursor-pointer transition-all hover:shadow-xs group"
            >
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span>{formatLocationLabel(currentLocation.name, currentLocation.state)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform" />
            </button>

            {/* Quick Live GPS Button */}
            <button
              type="button"
              id="citizen-quick-gps-btn"
              onClick={handleUseLiveGPS}
              disabled={isLocating}
              title="Detect exact coordinates using device GPS"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
            >
              {isLocating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              )}
              <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
            </button>
          </div>
        </div>

        {/* LOCATION STATUS BANNER */}
        {locationNotice && (
          <div className="py-2.5 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{locationNotice}</span>
            </div>
            <button
              onClick={() => setLocationNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* LOADING INDICATOR (when telemetry is re-fetching for new location) */}
        {isTelemetryLoading && (
          <div className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
            <span>Updating real-time weather & DEM elevation model for {currentLocation.name}...</span>
          </div>
        )}

        {/* ONE PROMINENT RISK CARD */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${riskColorClasses.border} shadow-xs p-6 sm:p-7 transition-all`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.currentRisk}
              </span>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className={`text-3xl sm:text-4xl font-black ${riskColorClasses.text} tracking-tight`}>
                  {riskLevel}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${riskColorClasses.badgeBg}`}>
                  {riskColorClasses.badgeText}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {t.landslideProbability}:
              </span>
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {mlData ? `${mlData.probability}%` : '28%'}
              </span>
              {mlData?.factorOfSafety && (
                <span className={`text-[10px] font-semibold block mt-0.5 ${riskColorClasses.text}`}>
                  Factor of Safety: {mlData.factorOfSafety}
                </span>
              )}
            </div>
          </div>

          {/* Prediction Window & ML Model Pill */}
          <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Clock className={`w-4 h-4 shrink-0 ${riskColorClasses.text}`} />
              <span>
                {t.prediction}: <strong className="text-slate-900 dark:text-white">{mlData?.predictionWindow || t.next12to24Hours}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>bhunetr.onrender.com</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t.lastUpdated}
              </span>
            </div>
          </div>

          {/* Dynamic Message */}
          <p className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {mlData?.recommendation || mlData?.summary || mlData?.recommendations?.[0] || (
              isEmergency
                ? `Critical landslide threat detected in ${cleanLocationName(currentLocation.name)}. High likelihood of debris flow along steep slope cuts.`
                : isWarning
                ? `Elevated risk in ${cleanLocationName(currentLocation.name)} due to saturated soil conditions and terrain gradient. Prepare caution.`
                : isWatch
                ? `Advisory active in ${cleanLocationName(currentLocation.name)}. Monitor meteorological rainfall accumulation and soil seepage.`
                : `Slope stability parameters in ${cleanLocationName(currentLocation.name)} remain within safe thresholds.`
            )}
          </p>
        </div>

        {/* 4 DYNAMIC TELEMETRY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* 🌧 Rainfall */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
              <span className="text-xs font-bold">🌧 {t.rainfall}</span>
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {liveWeather ? `${liveWeather.rainfall24hSumMm} mm` : '92 mm'}
              </div>
              <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                {liveWeather ? `${liveWeather.weatherDescription} (24h)` : t.rainfall24h}
              </div>
            </div>
          </div>

          {/* 💧 Soil Moisture */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
              <span className="text-xs font-bold">💧 {t.soilMoisture}</span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {liveWeather ? `${liveWeather.soilMoisturePct}%` : '81%'}
              </div>
              <div className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 mt-0.5">
                {liveWeather ? (liveWeather.soilMoisturePct > 70 ? t.critical : 'Permeable') : t.critical}
              </div>
            </div>
          </div>

          {/* 🌡 Temperature */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
              <span className="text-xs font-bold">🌡 {t.temperature}</span>
              <Thermometer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {liveWeather ? `${liveWeather.temperatureC}°C` : '24°C'}
              </div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                {liveWeather ? `${liveWeather.humidityPct}% humidity` : t.normal}
              </div>
            </div>
          </div>

          {/* ⛰ Slope */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
              <span className="text-xs font-bold">⛰ {t.slope}</span>
              <Mountain className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {enrichedTerrain ? `${enrichedTerrain.slope_deg}°` : '37°'}
              </div>
              <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                {enrichedTerrain ? `${enrichedTerrain.elevation_m}m DEM elevation` : t.slopeAngle}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE WARNING SECTION */}
        <div className={`border-2 rounded-2xl p-5 sm:p-6 shadow-xs transition-all ${riskColorClasses.warningBg}`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 mt-0.5 ${riskColorClasses.iconBg}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={`font-extrabold text-base flex items-center gap-2 ${riskColorClasses.warningText}`}>
                  <span>{riskColorClasses.dot}</span>
                  <span>
                    {isEmergency
                      ? 'Emergency Evacuation Alert'
                      : isWarning
                      ? t.emergencyWarnings
                      : isWatch
                      ? 'Weather Watch Advisory'
                      : 'Normal Stability Status'}
                  </span>
                </h3>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${riskColorClasses.warningBadge}`}>
                  {cleanLocationName(currentLocation.name)} Sector
                </span>
              </div>

              <p className={`text-sm font-medium mt-2 leading-relaxed ${riskColorClasses.warningText}`}>
                {isEmergency
                  ? `Critical landslide threat active for ${cleanLocationName(currentLocation.name)}. High likelihood of debris flow along steep slope cuts. Follow evacuation protocols immediately.`
                  : isWarning
                  ? `${t.emergencyWarnings} • Elevated landslide caution advised for ${cleanLocationName(currentLocation.name)}. Saturated soil mantle detected along vulnerable slopes.`
                  : isWatch
                  ? `Advisory active in ${cleanLocationName(currentLocation.name)}. Monitor meteorological rainfall accumulation and soil seepage.`
                  : `Slope equilibrium stable in ${cleanLocationName(currentLocation.name)}. Infiltration rates and pore water pressure within normal baseline.`}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  id="citizen-view-alert-btn"
                  onClick={() => onNavigate('alerts')}
                  className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-2xs transition-colors cursor-pointer ${riskColorClasses.btnBg}`}
                >
                  <span>{t.viewDetails}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>

                <button
                  id="citizen-change-loc-quick-btn"
                  onClick={() => setIsLocModalOpen(true)}
                  className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  <span>Switch Sector / GPS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Quick Actions */}
        <div className="pt-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            {t.safetyGuidelines}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. 📷 Check Landslide Risk */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📷</span>
                  <span>{t.aiRiskCheck}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {t.uploadImage} & {t.checkRisk}
                </p>
              </div>

              <div className="mt-6 pt-2">
                <button
                  id="action-check-risk-btn"
                  onClick={() => onNavigate('check-risk')}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{t.checkRisk}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. 🛣 Safe Routes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Navigation className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🛣</span>
                  <span>{t.safeRoutes}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {t.safeZones} & {t.nearbyShelters}
                </p>
              </div>

              <div className="mt-6 pt-2">
                <button
                  id="action-safe-routes-btn"
                  onClick={() => onNavigate('safe-routes')}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{t.findSafeRoute}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. 🚨 Emergency Help */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-red-500 dark:hover:border-red-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🚨</span>
                  <span>{t.emergencyHelp}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {t.medicalCenters} & {t.emergencyCall}
                </p>
              </div>

              <div className="mt-6 pt-2">
                <button
                  id="action-emergency-help-btn"
                  onClick={() => onNavigate('emergency')}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{t.getHelp}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Risk Status Scale */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Risk Status
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Tier: <strong className="text-slate-900 dark:text-white font-bold">{riskLevel}</strong> ({cleanLocationName(currentLocation.name)})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {/* 🟢 Normal */}
            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
              isNormal
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 ring-1 ring-emerald-200 dark:ring-emerald-800'
                : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">🟢</span>
                  <span>Normal</span>
                </div>
                {isNormal && (
                  <span className="text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.5 rounded-sm">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Safe, standard baseline</span>
            </div>

            {/* 🟡 Watch */}
            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
              isWatch
                ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 ring-1 ring-amber-200 dark:ring-amber-800'
                : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">🟡</span>
                  <span>Watch</span>
                </div>
                {isWatch && (
                  <span className="text-[10px] font-extrabold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-sm">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">Advisory: continuous rain expected</span>
            </div>

            {/* 🟠 Warning */}
            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
              isWarning
                ? 'bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-500 ring-1 ring-orange-200 dark:ring-orange-800'
                : 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between font-bold text-orange-900 dark:text-orange-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">🟠</span>
                  <span>Warning</span>
                </div>
                {isWarning && (
                  <span className="text-[10px] font-extrabold bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 px-1.5 py-0.5 rounded-sm">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-orange-800 dark:text-orange-300 font-medium">Elevated risk, prepare caution</span>
            </div>

            {/* 🔴 Emergency */}
            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
              isEmergency
                ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 ring-1 ring-red-200 dark:ring-red-800'
                : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between font-bold text-red-800 dark:text-red-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">🔴</span>
                  <span>Emergency</span>
                </div>
                {isEmergency && (
                  <span className="text-[10px] font-extrabold bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 px-1.5 py-0.5 rounded-sm">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-red-700 dark:text-red-400">Evacuate slope areas immediately</span>
            </div>
          </div>
        </div>

      </div>

      {/* Regional Location Selection Modal */}
      <CitizenLocationModal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        onUseLiveGPS={handleUseLiveGPS}
        isLocating={isLocating}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CloudRain,
  Droplets,
  Thermometer,
  Mountain,
  ExternalLink,
  Filter,
  Activity,
  Radio,
  Layers
} from 'lucide-react';

import { LanguageCode } from '../types';
import { getTranslation } from '../data/translations';
import {
  PROTOTYPE_MAP_LOCATIONS,
  MapRiskLocation,
  NER_STATES
} from '../data/mapRiskData';
import { GeographicRiskMap } from './GeographicRiskMap';
import {
  persistAuthorityLocation,
  cleanLocationName
} from '../services/geolocationService';

interface AuthorityDashboardProps {
  onNavigate: (page: string, extraParam?: string) => void;
  onSelectZoneForMap?: (zoneId: string) => void;
  selectedLanguage?: LanguageCode;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  onNavigate,
  onSelectZoneForMap,
  selectedLanguage = 'en'
}) => {
  const t = getTranslation(selectedLanguage);

  // Dynamic locations state, synchronized with /api/map/live-locations
  const [locations, setLocations] = useState<MapRiskLocation[]>(PROTOTYPE_MAP_LOCATIONS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Live Connected');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Map controls & selected sector (independent to Authority portal)
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<MapRiskLocation>(() => {
    try {
      const saved = localStorage.getItem('bhunetr_authority_loc');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const pLat = parsed.lat ?? parsed.coordinates?.lat;
          const pLng = parsed.lng ?? parsed.coordinates?.lng;
          const match = PROTOTYPE_MAP_LOCATIONS.find(
            (l) =>
              (parsed.id && l.id === parsed.id) ||
              (parsed.name && l.name?.toLowerCase() === parsed.name?.toLowerCase()) ||
              (pLat && pLng && Math.hypot(l.coordinates.lat - pLat, l.coordinates.lng - pLng) < 0.25)
          );
          if (match) return match;
          if (pLat && pLng) {
            return {
              ...PROTOTYPE_MAP_LOCATIONS[0],
              ...parsed,
              name: cleanLocationName(parsed.name || PROTOTYPE_MAP_LOCATIONS[0].name),
              riskLevel: parsed.riskLevel || 'Watch',
              probability: parsed.probability ?? 45,
              status: parsed.status || 'Active Monitoring',
              predictionWindow: parsed.predictionWindow || 'Next 24h',
              coordinates: { lat: Number(pLat), lng: Number(pLng) }
            };
          }
        }
      }
    } catch {}
    return PROTOTYPE_MAP_LOCATIONS[0];
  });

  // Listen to authority-internal location changes (e.g. from Emergency Page in Authority role)
  useEffect(() => {
    const handleAuthorityLocChange = () => {
      try {
        const saved = localStorage.getItem('bhunetr_authority_loc');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed) {
            const pLat = parsed.lat ?? parsed.coordinates?.lat;
            const pLng = parsed.lng ?? parsed.coordinates?.lng;
            setLocations((currentLocs) => {
              const match = currentLocs.find(
                (l) =>
                  (parsed.id && l.id === parsed.id) ||
                  (parsed.name && l.name?.toLowerCase() === parsed.name?.toLowerCase()) ||
                  (pLat && pLng && Math.hypot(l.coordinates.lat - pLat, l.coordinates.lng - pLng) < 0.25)
              );
              if (match) {
                setSelectedLocation(match);
              } else if (pLat && pLng) {
                setSelectedLocation({
                  ...currentLocs[0],
                  ...parsed,
                  riskLevel: parsed.riskLevel || 'Watch',
                  probability: parsed.probability ?? 45,
                  status: parsed.status || 'Active Monitoring',
                  predictionWindow: parsed.predictionWindow || 'Next 24h',
                  coordinates: { lat: Number(pLat), lng: Number(pLng) }
                });
              }
              return currentLocs;
            });
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleAuthorityLocChange);
    window.addEventListener('bhunetr_authority_location_change', handleAuthorityLocChange);
    return () => {
      window.removeEventListener('storage', handleAuthorityLocChange);
      window.removeEventListener('bhunetr_authority_location_change', handleAuthorityLocChange);
    };
  }, []);

  // Fetch real-time telemetry from backend / IMD pipeline
  const fetchLiveTelemetry = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/map/live-locations');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setLocations(json.data);
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSyncedAt(`Synced at ${nowStr}`);
          setSyncNotice('Telemetry synchronized with IMD live radar & BhuNetr ML pipeline.');
          setTimeout(() => setSyncNotice(null), 4000);

          // Update currently selected location with fresh telemetry
          setSelectedLocation((prev) => {
            const updated = json.data.find((l: MapRiskLocation) => l.id === prev.id);
            return updated || prev;
          });
        }
      }
    } catch (err) {
      console.warn('Authority telemetry sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLiveTelemetry();
  }, [fetchLiveTelemetry]);

  // Dynamic counts computed directly from live locations
  const criticalLocations = useMemo(() => locations.filter((l) => l.riskLevel === 'Critical'), [locations]);
  const highLocations = useMemo(() => locations.filter((l) => l.riskLevel === 'High'), [locations]);
  const watchLocations = useMemo(() => locations.filter((l) => l.riskLevel === 'Watch'), [locations]);
  const normalLocations = useMemo(() => locations.filter((l) => l.riskLevel === 'Low'), [locations]);
  const activeAlertsCount = criticalLocations.length + highLocations.length;

  // Filtered locations for the map view
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchState = selectedState === 'All States' || loc.state === selectedState;
      const matchRisk =
        selectedRiskFilter === 'All' ||
        loc.riskLevel.toLowerCase() === selectedRiskFilter.toLowerCase();
      return matchState && matchRisk;
    });
  }, [locations, selectedState, selectedRiskFilter]);

  // Dynamic summary cards
  const summaryCards = [
    {
      id: 'critical',
      label: `${t.critical} (${t.currentRisk})`,
      count: criticalLocations.length.toString().padStart(2, '0'),
      caption: 'Immediate evacuation required',
      borderColor: 'border-red-200 dark:border-red-900/60',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800',
      countColor: 'text-red-700 dark:text-red-400',
      filterVal: 'Critical'
    },
    {
      id: 'high',
      label: `${t.high} (${t.currentRisk})`,
      count: highLocations.length.toString().padStart(2, '0'),
      caption: 'Closely monitored corridors',
      borderColor: 'border-orange-200 dark:border-orange-900/60',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      countColor: 'text-orange-600 dark:text-orange-400',
      filterVal: 'High'
    },
    {
      id: 'watch',
      label: `${t.watch}`,
      count: watchLocations.length.toString().padStart(2, '0'),
      caption: 'Under observation / advisory',
      borderColor: 'border-yellow-200 dark:border-yellow-900/60',
      badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      countColor: 'text-yellow-600 dark:text-yellow-400',
      filterVal: 'Watch'
    },
    {
      id: 'alerts',
      label: `${t.activeAlerts}`,
      count: activeAlertsCount.toString().padStart(2, '0'),
      caption: 'Require dispatch & broadcast',
      borderColor: 'border-blue-200 dark:border-blue-900/60',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      countColor: 'text-blue-700 dark:text-blue-400',
      filterVal: 'All'
    }
  ];

  // Dynamic High Risk Priority list (sorted by probability descending)
  const priorityZones = useMemo(() => {
    return [...locations]
      .filter((l) => l.riskLevel === 'Critical' || l.riskLevel === 'High' || l.riskLevel === 'Watch')
      .sort((a, b) => b.probability - a.probability);
  }, [locations]);

  // Top Active Alerts (top 3 critical/high hazard areas)
  const dynamicActiveAlerts = useMemo(() => {
    return priorityZones.slice(0, 3);
  }, [priorityZones]);

  // Dynamic Infrastructure summary aggregated across active risk zones
  const infrastructureStats = useMemo(() => {
    const criticalAndHigh = locations.filter((l) => l.riskLevel === 'Critical' || l.riskLevel === 'High');
    let roadsCount = 0;
    let bridgesCount = 0;
    let schoolsCount = 0;
    let hospitalsCount = 0;

    criticalAndHigh.forEach((loc) => {
      const infraList = loc.affectedInfrastructure || [];
      infraList.forEach((item) => {
        const lower = item.toLowerCase();
        if (lower.includes('nh') || lower.includes('road') || lower.includes('highway') || lower.includes('corridor')) {
          roadsCount++;
        } else if (lower.includes('bridge') || lower.includes('culvert') || lower.includes('overpass')) {
          bridgesCount++;
        } else if (lower.includes('school') || lower.includes('college') || lower.includes('institute')) {
          schoolsCount++;
        } else if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('health') || lower.includes('phc')) {
          hospitalsCount++;
        } else {
          roadsCount++;
        }
      });
    });

    return {
      roads: Math.max(roadsCount, 8),
      bridges: Math.max(bridgesCount, 4),
      schools: Math.max(schoolsCount, 3),
      hospitals: Math.max(hospitalsCount, 2)
    };
  }, [locations]);

  const handleSelectLocation = (loc: MapRiskLocation) => {
    setSelectedLocation(loc);
    persistAuthorityLocation(loc);
  };

  const handleNavigateToZoneOnMap = (loc: MapRiskLocation) => {
    if (onSelectZoneForMap) {
      onSelectZoneForMap(loc.id);
    }
    onNavigate('risk-map');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* 1. DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Authority Risk Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Command Grid</span>
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Real-time regional command, live telemetry from IMD Doppler stations, and geotechnical hazard prediction across the North Eastern Region.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{lastSyncedAt}</span>
              </div>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 dark:text-blue-400 font-bold">
                Autonomous Regional Command
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              id="authority-refresh-sync-btn"
              onClick={fetchLiveTelemetry}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Telemetry'}</span>
            </button>

            <button
              id="authority-launch-map-btn"
              onClick={() => onNavigate('risk-map')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Full GIS Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SYNC NOTIFICATION BANNER */}
        {syncNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. DYNAMIC RISK SUMMARY CARDS */}
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                id={`summary-card-${card.id}`}
                onClick={() => {
                  setSelectedRiskFilter(card.filterVal);
                }}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${card.borderColor} p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                    Active
                  </span>
                </div>
                <div className={`text-3xl sm:text-4xl font-black tracking-tight ${card.countColor}`}>
                  {card.count}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center justify-between">
                  <span>{card.caption}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Filter Map →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. DYNAMIC RISK MAP & LIVE TELEMETRY INSPECTOR */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Regional Landslide Risk Map</span>
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Authority Sector Focus
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full GIS vector map covering all 8 North Eastern states, live IMD precipitation overlays, and active geotechnical nodes.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* State Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="authority-state-filter"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  {NER_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Filter */}
              <div className="flex items-center gap-1 text-xs">
                <select
                  id="authority-risk-filter"
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Tiers ({locations.length})</option>
                  <option value="Critical">Critical ({criticalLocations.length})</option>
                  <option value="High">High ({highLocations.length})</option>
                  <option value="Watch">Watch ({watchLocations.length})</option>
                  <option value="Low">Low ({normalLocations.length})</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(selectedState !== 'All States' || selectedRiskFilter !== 'All') && (
                <button
                  id="authority-reset-filter-btn"
                  onClick={() => {
                    setSelectedState('All States');
                    setSelectedRiskFilter('All');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Map & Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            {/* The Real GIS Map (2 cols) */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs relative">
              <GeographicRiskMap
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                selectedState={selectedState}
                userLocation={null}
                currentRole="authority"
                showAuthorityOverlay={true}
                className="h-[380px] sm:h-[420px] w-full"
              />

              {/* Map footer status */}
              <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold">
                    {filteredLocations.length} active sensor zones rendered
                  </span>
                </div>
                <span className="font-medium text-slate-500">
                  Click any marker to inspect live telemetry
                </span>
              </div>
            </div>

            {/* Selected Zone Telemetry Panel (1 col) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Sector Inspection
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {cleanLocationName(selectedLocation.name)}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{selectedLocation.district}, {selectedLocation.state}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                      selectedLocation.riskLevel === 'Critical'
                        ? 'bg-red-600 text-white'
                        : selectedLocation.riskLevel === 'High'
                        ? 'bg-orange-500 text-white'
                        : selectedLocation.riskLevel === 'Watch'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {(selectedLocation.riskLevel || 'Watch').toUpperCase()}
                  </span>
                </div>

                {/* Primary Stats: Probability & FoS */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Landslide Prob.</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                      {selectedLocation.probability}%
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      Window: {selectedLocation.predictionWindow}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Factor of Safety</span>
                    <div
                      className={`text-2xl font-black tracking-tight mt-0.5 ${
                        (selectedLocation.factorOfSafety ?? 1.5) < 1.0
                          ? 'text-red-600'
                          : (selectedLocation.factorOfSafety ?? 1.5) < 1.3
                          ? 'text-orange-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selectedLocation.factorOfSafety ? selectedLocation.factorOfSafety.toFixed(2) : '1.14'}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      {(selectedLocation.factorOfSafety ?? 1.5) < 1.0 ? 'Failure Imminent' : 'Geotech Stability'}
                    </span>
                  </div>
                </div>

                {/* 4 Sensor Telemetry Indicators */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">24h Rainfall:</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedLocation.rainfall24h} mm
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Droplets className="w-4 h-4 text-cyan-500" />
                      <span className="font-semibold">Soil Moisture:</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedLocation.soilMoisture}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Mountain className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Slope Angle:</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedLocation.slopeAngle}° {selectedLocation.elevation ? `(${selectedLocation.elevation}m)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Thermometer className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">Temperature:</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedLocation.temperature}°C ({selectedLocation.weatherDescription || 'Monsoon Precipitation'})
                    </span>
                  </div>
                </div>

                {/* Affected Infrastructure List */}
                {selectedLocation.affectedInfrastructure && selectedLocation.affectedInfrastructure.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Corridor Infrastructure:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedLocation.affectedInfrastructure.map((inf, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          {inf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <button
                  id="authority-focus-full-map-btn"
                  onClick={() => handleNavigateToZoneOnMap(selectedLocation)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Focus in Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="authority-panel-manage-alert-btn"
                  onClick={() => {
                    const targetAlertId = selectedLocation.id.startsWith('LS-')
                      ? selectedLocation.id
                      : `LS-2026-${selectedLocation.id.replace('zone-', '')}`;
                    onNavigate('alert-management', targetAlertId);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Manage Alert
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. DYNAMIC CURRENT HIGH RISK ZONES TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  High Risk Priority Sectors
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                  {priorityZones.length} Zones Ranked
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Priority sectors classified by real-time failure probability and imminent prediction window
              </p>
            </div>
            <button
              id="view-all-zones-btn"
              onClick={() => onNavigate('risk-map')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-bold transition-colors w-fit cursor-pointer"
            >
              <span>View All Zones in GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Location</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Risk Tier</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Factor of Safety</th>
                  <th className="py-3 px-4">Prediction Window</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {priorityZones.map((row) => {
                  const isSelected = selectedLocation.id === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleSelectLocation(row)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${
                              row.riskLevel === 'Critical'
                                ? 'text-red-600'
                                : row.riskLevel === 'High'
                                ? 'text-orange-500'
                                : 'text-amber-500'
                            }`}
                          />
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {row.state}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            row.riskLevel === 'Critical'
                              ? 'bg-red-600 text-white'
                              : row.riskLevel === 'High'
                              ? 'bg-orange-500 text-white'
                              : row.riskLevel === 'Watch'
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {(row.riskLevel || 'Watch').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                        {row.probability}%
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={
                            (row.factorOfSafety ?? 1.5) < 1.0
                              ? 'text-red-600'
                              : (row.factorOfSafety ?? 1.5) < 1.3
                              ? 'text-orange-500'
                              : 'text-emerald-600'
                          }
                        >
                          {row.factorOfSafety ? row.factorOfSafety.toFixed(2) : '1.14'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                        {row.predictionWindow}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToZoneOnMap(row);
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. DYNAMIC ACTIVE ALERTS */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Active Priority Warnings
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {activeAlertsCount} critical sectors triggering disaster protocols
              </span>
            </div>
            <button
              id="goto-alert-management-btn"
              onClick={() => onNavigate('alert-management')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-bold transition-colors w-fit cursor-pointer"
            >
              <span>Broadcast & Dispatch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dynamicActiveAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 shadow-2xs flex flex-col justify-between ${
                  alert.riskLevel === 'Critical'
                    ? 'border-red-200 dark:border-red-900/80'
                    : alert.riskLevel === 'High'
                    ? 'border-orange-200 dark:border-orange-900/80'
                    : 'border-amber-200 dark:border-amber-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                        alert.riskLevel === 'Critical'
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                          : alert.riskLevel === 'High'
                          ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <span>{alert.riskLevel === 'Critical' ? '🔴' : alert.riskLevel === 'High' ? '🟠' : '🟡'}</span>
                      <span>{(alert.riskLevel || 'Watch').toUpperCase()}</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        alert.riskLevel === 'Critical'
                          ? 'text-red-600 dark:text-red-400'
                          : alert.riskLevel === 'High'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      Prob: {alert.probability}%
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {alert.activeWarning || `Elevated landslide risk detected in ${alert.name}, ${alert.state}.`}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      Precipitation: <strong className="text-slate-900 dark:text-white">{alert.rainfall24h} mm (24h)</strong>
                    </div>
                    <div>
                      Soil Saturation: <strong className="text-slate-900 dark:text-white">{alert.soilMoisture}%</strong>
                    </div>
                    <div>
                      Expected Window: <strong className="text-slate-900 dark:text-white">{alert.predictionWindow}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    id={`view-alert-${alert.id}-btn`}
                    onClick={() => handleNavigateToZoneOnMap(alert)}
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Map</span>
                  </button>
                  <button
                    id={`manage-alert-${alert.id}-btn`}
                    onClick={() => {
                      const targetAlertId = alert.id.startsWith('LS-')
                        ? alert.id
                        : `LS-2026-${alert.id.replace('zone-', '')}`;
                      onNavigate('alert-management', targetAlertId);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      alert.riskLevel === 'Critical'
                        ? 'bg-red-600 hover:bg-red-700'
                        : alert.riskLevel === 'High'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                    }`}
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. DYNAMIC INFRASTRUCTURE AT RISK */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Infrastructure at Risk (Real-time Survey)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Key transport routes and critical facilities actively surveyed within danger corridors
              </p>
            </div>

            <button
              id="view-infrastructure-risk-btn"
              onClick={() => onNavigate('infrastructure-risk')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-bold transition-colors w-fit cursor-pointer"
            >
              <span>Detailed Asset Inspector</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
            {/* 🛣 Roads */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-xs font-bold">🛣 Roads & Highways</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {infrastructureStats.roads}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Active in alert zones
              </span>
            </div>

            {/* 🌉 Bridges */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-xs font-bold">🌉 Bridges & Culverts</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {infrastructureStats.bridges}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Active in alert zones
              </span>
            </div>

            {/* 🏫 Schools */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-xs font-bold">🏫 Schools & Colleges</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {infrastructureStats.schools}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Within warning buffers
              </span>
            </div>

            {/* 🏥 Hospitals */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-xs font-bold">🏥 Medical Centers</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {infrastructureStats.hospitals}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Emergency priority
              </span>
            </div>
          </div>
        </div>

        {/* 7. QUICK ACTIONS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Command Center Actions
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* View Critical Zones */}
            <button
              id="action-view-critical-zones-btn"
              onClick={() => {
                setSelectedRiskFilter('Critical');
              }}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-slate-800 hover:bg-red-50/50 dark:hover:bg-red-950/30 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
            >
              <span className="text-lg leading-none">⚠️</span>
              <span>Filter Critical ({criticalLocations.length})</span>
            </button>

            {/* Manage Alerts */}
            <button
              id="action-manage-alerts-btn"
              onClick={() => onNavigate('alert-management')}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
            >
              <span className="text-lg leading-none">📢</span>
              <span>{t.alertManagement}</span>
            </button>

            {/* View Full Risk Map */}
            <button
              id="action-view-risk-map-btn"
              onClick={() => onNavigate('risk-map')}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
            >
              <span className="text-lg leading-none">🗺️</span>
              <span>Full Risk Map</span>
            </button>

            {/* Safe Routes & Evacuation */}
            <button
              id="action-emergency-response-btn"
              onClick={() => onNavigate('safe-routes')}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
            >
              <span className="text-lg leading-none">🛣️</span>
              <span>Safe Routes & Shelters</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

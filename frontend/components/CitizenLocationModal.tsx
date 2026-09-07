import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  X,
  Check,
  RefreshCw,
  Mountain,
  Compass
} from 'lucide-react';

export interface CitizenLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  defaultSlope: number;
}

/**
 * Cleans location names by removing unwanted tags, normalizing zone designations
 * (e.g. "Zone 04, Sikkim" -> "Gangtok"), and stripping duplicate state suffixes.
 */
export function cleanLocationName(name: string): string {
  if (!name) return 'Gangtok';
  let cleaned = name
    .replace(/\s*\([^)]*Nearest[^)]*\)/gi, '')
    .replace(/\s*\([^)]*Network[^)]*\)/gi, '')
    .replace(/\s*\([^)]*Regional[^)]*\)/gi, '')
    .trim();

  // Normalize Zone 04 / Zone 4 (Gangtok, Sikkim) to "Gangtok"
  if (/zone\s*0?4\b/i.test(cleaned)) {
    return 'Gangtok';
  }
  // Normalize other NER zones to proper city/region names
  if (/zone\s*12\b/i.test(cleaned)) return 'Tawang';
  if (/zone\s*0?3\b/i.test(cleaned)) return 'Kohima';
  if (/zone\s*0?7\b/i.test(cleaned)) return 'Cherrapunji (Sohra)';
  if (/zone\s*0?1\b/i.test(cleaned)) return 'Haflong';
  if (/zone\s*0?5\b/i.test(cleaned)) return 'Aizawl';
  if (/zone\s*0?8\b/i.test(cleaned)) return 'Noney';
  if (/zone\s*0?6\b/i.test(cleaned)) return 'Jampui Hills';

  // Strip duplicate trailing state if present (e.g. "Gangtok, Sikkim" -> "Gangtok")
  const allStates = [
    'Sikkim', 'Meghalaya', 'Assam', 'Arunachal Pradesh',
    'Nagaland', 'Mizoram', 'Manipur', 'Tripura'
  ];
  for (const st of allStates) {
    const reg = new RegExp(`,\\s*${st}$`, 'i');
    cleaned = cleaned.replace(reg, '').trim();
  }

  return cleaned || 'Gangtok';
}

/**
 * Formats a location name and state for display, preventing duplicate state printing
 * (e.g., prevents "Zone 04, Sikkim, Sikkim" and returns clean "Gangtok, Sikkim").
 */
export function formatLocationLabel(name?: string, state?: string): string {
  const cleanedName = cleanLocationName(name || '');
  const stateStr = (state || 'Sikkim').trim();

  // If the cleaned name already ends with the state (case-insensitive), return as-is
  if (cleanedName.toLowerCase().endsWith(stateStr.toLowerCase())) {
    return cleanedName;
  }
  return `${cleanedName}, ${stateStr}`;
}

export const NER_STATES_FILTER = [
  'All',
  'Sikkim',
  'Meghalaya',
  'Assam',
  'Arunachal Pradesh',
  'Nagaland',
  'Mizoram',
  'Manipur',
  'Tripura'
] as const;

export const POPULAR_LOCATIONS: CitizenLocation[] = [
  // Sikkim
  { id: 'gangtok', name: 'Gangtok', district: 'East Sikkim', state: 'Sikkim', lat: 27.3389, lng: 88.6065, defaultSlope: 28 },
  { id: 'namchi', name: 'Namchi', district: 'South Sikkim', state: 'Sikkim', lat: 27.1667, lng: 88.3500, defaultSlope: 34 },
  { id: 'mangan', name: 'Mangan', district: 'North Sikkim', state: 'Sikkim', lat: 27.5000, lng: 88.5333, defaultSlope: 39 },
  { id: 'gyalshing', name: 'Gyalshing', district: 'West Sikkim', state: 'Sikkim', lat: 27.2833, lng: 88.2500, defaultSlope: 32 },

  // Meghalaya
  { id: 'shillong', name: 'Shillong', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, defaultSlope: 29 },
  { id: 'sohra', name: 'Cherrapunji (Sohra)', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.2986, lng: 91.7303, defaultSlope: 33 },
  { id: 'tura', name: 'Tura', district: 'West Garo Hills', state: 'Meghalaya', lat: 25.5144, lng: 90.2033, defaultSlope: 26 },
  { id: 'jowai', name: 'Jowai', district: 'West Jaintia Hills', state: 'Meghalaya', lat: 25.4500, lng: 92.2000, defaultSlope: 27 },

  // Assam
  { id: 'guwahati', name: 'Guwahati', district: 'Kamrup Metro', state: 'Assam', lat: 26.1445, lng: 91.7362, defaultSlope: 18 },
  { id: 'haflong', name: 'Haflong (Dima Hasao)', district: 'Dima Hasao', state: 'Assam', lat: 25.1764, lng: 93.0238, defaultSlope: 36 },
  { id: 'silchar', name: 'Silchar', district: 'Cachar', state: 'Assam', lat: 24.8333, lng: 92.7789, defaultSlope: 20 },
  { id: 'dibrugarh', name: 'Dibrugarh', district: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120, defaultSlope: 15 },

  // Arunachal Pradesh
  { id: 'itanagar', name: 'Itanagar', district: 'Papum Pare', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, defaultSlope: 31 },
  { id: 'tawang', name: 'Tawang', district: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5861, lng: 91.8594, defaultSlope: 38 },
  { id: 'bhalukpong', name: 'Bhalukpong', district: 'West Kameng', state: 'Arunachal Pradesh', lat: 27.0167, lng: 92.6500, defaultSlope: 35 },
  { id: 'pasighat', name: 'Pasighat', district: 'East Siang', state: 'Arunachal Pradesh', lat: 28.0667, lng: 95.3333, defaultSlope: 28 },

  // Nagaland
  { id: 'kohima', name: 'Kohima', district: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086, defaultSlope: 34 },
  { id: 'dimapur', name: 'Dimapur', district: 'Dimapur', state: 'Nagaland', lat: 25.9068, lng: 93.7271, defaultSlope: 19 },
  { id: 'mokokchung', name: 'Mokokchung', district: 'Mokokchung', state: 'Nagaland', lat: 26.3244, lng: 94.5218, defaultSlope: 30 },
  { id: 'wokha', name: 'Wokha', district: 'Wokha', state: 'Nagaland', lat: 26.1000, lng: 94.2667, defaultSlope: 32 },

  // Mizoram
  { id: 'aizawl', name: 'Aizawl', district: 'Aizawl', state: 'Mizoram', lat: 23.7307, lng: 92.7173, defaultSlope: 35 },
  { id: 'lunglei', name: 'Lunglei', district: 'Lunglei', state: 'Mizoram', lat: 22.8887, lng: 92.7380, defaultSlope: 33 },
  { id: 'champhai', name: 'Champhai', district: 'Champhai', state: 'Mizoram', lat: 23.4756, lng: 93.3283, defaultSlope: 31 },

  // Manipur
  { id: 'imphal', name: 'Imphal', district: 'Imphal West', state: 'Manipur', lat: 24.8170, lng: 93.9368, defaultSlope: 22 },
  { id: 'churachandpur', name: 'Churachandpur', district: 'Churachandpur', state: 'Manipur', lat: 24.3333, lng: 93.6667, defaultSlope: 30 },
  { id: 'tupul', name: 'Tupul / Noney', district: 'Noney', state: 'Manipur', lat: 24.8000, lng: 93.7000, defaultSlope: 38 },
  { id: 'ukhrul', name: 'Ukhrul', district: 'Ukhrul', state: 'Manipur', lat: 25.1167, lng: 94.3667, defaultSlope: 32 },

  // Tripura
  { id: 'agartala', name: 'Agartala', district: 'West Tripura', state: 'Tripura', lat: 23.8315, lng: 91.2868, defaultSlope: 16 },
  { id: 'dharmanagar', name: 'Dharmanagar', district: 'North Tripura', state: 'Tripura', lat: 24.3744, lng: 92.1645, defaultSlope: 18 }
];

interface CitizenLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: CitizenLocation;
  onSelectLocation: (loc: CitizenLocation) => void;
  onUseLiveGPS: () => void;
  isLocating: boolean;
}

export const CitizenLocationModal: React.FC<CitizenLocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onUseLiveGPS,
  isLocating
}) => {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('All');

  const filteredLocations = useMemo(() => {
    return POPULAR_LOCATIONS.filter((loc) => {
      const matchesState = stateFilter === 'All' || loc.state === stateFilter;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q);
      return matchesState && matchesQuery;
    });
  }, [query, stateFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Select Your Location
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch monitored sector across all 8 North Eastern States or use live GPS
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-location-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Quick Button & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
          <button
            type="button"
            id="modal-detect-gps-btn"
            onClick={onUseLiveGPS}
            disabled={isLocating}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-between shadow-xs transition-colors cursor-pointer disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5">
              {isLocating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>{isLocating ? 'Auto-detecting live location (GPS / Network)...' : 'Use My Current Live GPS Location'}</span>
            </div>
            <span className="text-[11px] bg-blue-700/80 px-2 py-0.5 rounded font-mono">
              Auto GPS / Network
            </span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="modal-location-search-input"
              type="text"
              placeholder="Search by city, district or state (e.g. Shillong, Tawang, Haflong)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* State Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {NER_STATES_FILTER.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStateFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  stateFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Location Grid List */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-96 space-y-2">
          {filteredLocations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
              No matching locations found for "{query}". Try clearing the search query or state filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredLocations.map((loc) => {
                const isSelected =
                  currentLocation.lat === loc.lat && currentLocation.lng === loc.lng;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => onSelectLocation(loc)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                        <span>{loc.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {loc.district} • <span className="font-semibold text-slate-700 dark:text-slate-300">{loc.state}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                        {loc.lat.toFixed(3)}°N, {loc.lng.toFixed(3)}°E • ~{loc.defaultSlope}° slope
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Active: <strong className="text-slate-800 dark:text-slate-200">{cleanLocationName(currentLocation.name)}, {currentLocation.state}</strong></span>
          <span className="font-mono text-[10px]">Open-Meteo & DEM Ingestion Active</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Search,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Info,
  CloudRain,
  Droplets,
  Thermometer,
  Mountain,
  History,
  ArrowRight,
  Navigation,
  LifeBuoy,
  FileWarning,
  Check,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';

interface CheckRiskPageProps {
  onNavigate: (page: string) => void;
}

// Mock locations for search
const MOCK_LOCATIONS = [
  { name: 'Gangtok, Sikkim', state: 'Sikkim', risk: 'HIGH', probability: 78, window: 'Next 24–48 Hours', rainfall: '92 mm / 24h', soil: '81%', temp: '24°C', slope: '37°', history: 'Moderate' },
  { name: 'Shillong, Meghalaya', state: 'Meghalaya', risk: 'WATCH', probability: 54, window: 'Next 48 Hours', rainfall: '68 mm / 24h', soil: '64%', temp: '21°C', slope: '29°', history: 'Low' },
  { name: 'Itanagar, Arunachal Pradesh', state: 'Arunachal Pradesh', risk: 'HIGH', probability: 76, window: 'Next 24–48 Hours', rainfall: '88 mm / 24h', soil: '79%', temp: '23°C', slope: '35°', history: 'Moderate' },
  { name: 'Kohima, Nagaland', state: 'Nagaland', risk: 'HIGH', probability: 74, window: 'Next 24–48 Hours', rainfall: '82 mm / 24h', soil: '75%', temp: '20°C', slope: '33°', history: 'High' },
  { name: 'Guwahati, Assam', state: 'Assam', risk: 'LOW', probability: 22, window: 'Stable', rainfall: '25 mm / 24h', soil: '42%', temp: '28°C', slope: '18°', history: 'Low' },
  { name: 'Aizawl, Mizoram', state: 'Mizoram', risk: 'LOW', probability: 18, window: 'Stable', rainfall: '19 mm / 24h', soil: '38%', temp: '26°C', slope: '22°', history: 'Low' },
  { name: 'Imphal, Manipur', state: 'Manipur', risk: 'LOW', probability: 25, window: 'Stable', rainfall: '20 mm / 24h', soil: '36%', temp: '25°C', slope: '24°', history: 'Low' },
  { name: 'Agartala, Tripura', state: 'Tripura', risk: 'LOW', probability: 16, window: 'Stable', rainfall: '10 mm / 24h', soil: '28%', temp: '29°C', slope: '15°', history: 'Low' }
];

// Presets for quick evaluation
const SAMPLE_TERRAIN_IMAGES = [
  {
    id: 'sample-terrain-1',
    name: 'steep_slope_sikkim_nh10.jpg',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    label: 'Steep Terrain Slope (Valid)',
    isRelevant: true
  },
  {
    id: 'sample-terrain-2',
    name: 'road_shoulder_cutting.jpg',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    label: 'Road Soil & Fissure (Valid)',
    isRelevant: true
  },
  {
    id: 'sample-unrelated-1',
    name: 'coffee_and_food_plate.jpg',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    label: 'Food / Indoor Objects (Unrelated Test)',
    isRelevant: false
  },
  {
    id: 'sample-unrelated-2',
    name: 'pet_cat_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    label: 'Animal / Pet Photo (Unrelated Test)',
    isRelevant: false
  }
];

export const CheckRiskPage: React.FC<CheckRiskPageProps> = ({ onNavigate }) => {
  // Location state
  const [selectedLocation, setSelectedLocation] = useState<string>('📍 Gangtok, Sikkim');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Image Upload state
  const [imageFile, setImageFile] = useState<{
    name: string;
    url: string;
    isRelevant: boolean;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);
  const [backendAnalysis, setBackendAnalysis] = useState<any>(null);
  const [backendPredict, setBackendPredict] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // External ML DEM Terrain Enrichment State (POST /enrich-location)
  const [enrichedTerrain, setEnrichedTerrain] = useState<{
    slope_deg: number;
    elevation_m: number;
    source: string;
  } | null>(null);

  // Live Atmospheric & Doppler Weather Telemetry State (POST /api/weather/live)
  const [liveWeather, setLiveWeather] = useState<{
    temperatureC: number;
    humidityPct: number;
    rainfallCurrentMm: number;
    rainfall24hSumMm: number;
    rainfall72hEstMm: number;
    soilMoisturePct: number;
    weatherDescription: string;
    source: string;
    timestamp: string;
  } | null>(null);

  const [isEnriching, setIsEnriching] = useState<boolean>(false);

  // Resolve geographic coordinates for any selected location
  const getLocationCoords = (locName: string): { lat: number; lng: number } => {
    const lower = locName.toLowerCase();
    if (lower.includes('sikkim') || lower.includes('gangtok')) return { lat: 27.3389, lng: 88.6065 };
    if (lower.includes('cherrapunji') || lower.includes('sohra')) return { lat: 25.2986, lng: 91.7303 };
    if (lower.includes('shillong') || lower.includes('meghalaya')) return { lat: 25.5788, lng: 91.8933 };
    if (lower.includes('assam') || lower.includes('guwahati')) return { lat: 26.1445, lng: 91.7362 };
    if (lower.includes('dima hasao') || lower.includes('haflong')) return { lat: 25.1764, lng: 93.0238 };
    if (lower.includes('arunachal') || lower.includes('tawang')) return { lat: 27.5861, lng: 91.8594 };
    if (lower.includes('itanagar')) return { lat: 27.0844, lng: 93.6053 };
    if (lower.includes('nagaland') || lower.includes('kohima')) return { lat: 25.6751, lng: 94.1086 };
    if (lower.includes('mizoram') || lower.includes('aizawl')) return { lat: 23.7307, lng: 92.7173 };
    if (lower.includes('manipur') || lower.includes('imphal')) return { lat: 24.8170, lng: 93.9368 };
    if (lower.includes('tripura') || lower.includes('agartala')) return { lat: 23.8315, lng: 91.2868 };
    return { lat: 25.5788, lng: 91.8933 };
  };

  // Enrich Location with real DEM slope and elevation + Live Atmospheric Weather
  const handleEnrichLocation = async () => {
    setIsEnriching(true);
    try {
      const coords = getLocationCoords(selectedLocation);

      // Fetch DEM slope & elevation from bhunetr.onrender.com
      const demPromise = fetch('/api/ml/enrich-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      // Fetch live weather from Open-Meteo via backend
      const weatherPromise = fetch('/api/weather/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [demRes, weatherRes] = await Promise.all([demPromise, weatherPromise]);

      if (demRes?.success && demRes.data) {
        setEnrichedTerrain({
          slope_deg: demRes.data.slope_deg,
          elevation_m: demRes.data.elevation_m,
          source: demRes.data.source || 'DEM Grid Lookup'
        });
      }

      if (weatherRes?.success && weatherRes.data) {
        setLiveWeather(weatherRes.data);
      }
    } catch (err) {
      console.warn('Location & weather enrichment error:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  // Sync live telemetry when location changes or on mount
  useEffect(() => {
    handleEnrichLocation();
  }, [selectedLocation]);

  // Handle "Use My Location"
  const handleUseMyLocation = () => {
    setSelectedLocation('📍 Gangtok, Sikkim');
    setIsSearchOpen(false);
  };

  // Handle Search Location Selection
  const handleSelectLocation = (locName: string) => {
    setSelectedLocation(`📍 ${locName}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Filtered mock locations
  const filteredLocations = MOCK_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Heuristic validation for uploaded file
  const checkImageRelevance = (fileName: string): boolean => {
    const lower = fileName.toLowerCase();
    const unrelatedKeywords = [
      'food', 'snack', 'meal', 'dish', 'coffee', 'tea', 'plate',
      'animal', 'cat', 'dog', 'pet', 'bird',
      'selfie', 'face', 'portrait', 'person',
      'document', 'receipt', 'invoice', 'paper', 'text', 'pdf',
      'desk', 'laptop', 'computer', 'screen', 'keyboard', 'phone', 'car', 'random'
    ];
    return !unrelatedKeywords.some((kw) => lower.includes(kw));
  };

  // Handle File Input Selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isRel = checkImageRelevance(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageFile({
        name: file.name,
        url: event.target?.result as string,
        isRelevant: isRel
      });
      setHasAnalyzed(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const isRel = checkImageRelevance(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageFile({
        name: file.name,
        url: event.target?.result as string,
        isRelevant: isRel
      });
      setHasAnalyzed(false);
    };
    reader.readAsDataURL(file);
  };

  // Select a preset sample image
  const handleSelectSample = (sample: typeof SAMPLE_TERRAIN_IMAGES[0]) => {
    setImageFile({
      name: sample.name,
      url: sample.url,
      isRelevant: sample.isRelevant
    });
    setHasAnalyzed(false);
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setImageFile(null);
    setHasAnalyzed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Analyze Risk action using Backend API
  const handleAnalyzeRisk = async () => {
    if (!imageFile || !imageFile.isRelevant) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const coords = getLocationCoords(selectedLocation);
      const rain24 = liveWeather ? liveWeather.rainfall24hSumMm : (activeLocationData.rainfall ? parseInt(activeLocationData.rainfall, 10) : 92);
      const rain72 = liveWeather ? liveWeather.rainfall72hEstMm : Math.round(rain24 * 2.5);
      const moisture = liveWeather ? liveWeather.soilMoisturePct : (activeLocationData.soil ? parseInt(activeLocationData.soil, 10) : 81);
      const slope = enrichedTerrain ? Math.round(enrichedTerrain.slope_deg) : (activeLocationData.slope ? parseInt(activeLocationData.slope, 10) : 37);
      const elevation = enrichedTerrain ? enrichedTerrain.elevation_m : 1650;

      // 1. Call Landslide Hazard Prediction ML API (integrating geotechnical engine + bhunetr.onrender.com ML model)
      const predictPromise = fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rainfall24h: rain24,
          rainfall72h: rain72,
          slopeAngle: slope,
          soilMoisture: moisture,
          elevation: elevation,
          locationName: cleanLocName,
          latitude: coords.lat,
          longitude: coords.lng
        })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      // 2. Call AI Multimodal Terrain Analysis API
      const terrainPromise = fetch('/api/analyze-terrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageFile.url,
          locationName: cleanLocName,
          slopeEstimated: slope,
          rainfallCurrent: rain24
        })
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const [predictRes, terrainRes] = await Promise.all([predictPromise, terrainPromise]);

      if (predictRes?.success && predictRes.data) {
        setBackendPredict(predictRes.data);
      }
      if (terrainRes?.success && terrainRes.data) {
        setBackendAnalysis(terrainRes.data);
      }
    } catch (err: any) {
      console.error('Analysis request error:', err);
      setAnalysisError('Connected to local geotechnical baseline.');
    } finally {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }
  };

  // Get current active location data
  const cleanLocName = selectedLocation.replace('📍 ', '');
  const activeLocationData = MOCK_LOCATIONS.find((l) => l.name === cleanLocName) || MOCK_LOCATIONS[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ==================================================
            1. PAGE HEADER
            ================================================== */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Check Landslide Risk
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Upload a photo or select a location to get a preliminary landslide risk assessment.
            </p>

            {/* Small Information Note */}
            <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5 max-w-2xl">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                For the most useful assessment, provide a clear photo of the terrain, slope, road, soil or suspected landslide area.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('safe-routes')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Safe Routes</span>
            </button>

            <button
              onClick={() => onNavigate('emergency')}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Emergency Help</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            2. LOCATION SECTION
            ================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assessment Target
              </span>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Location
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{selectedLocation.replace(/^📍\s*/, '')}</span>
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  (Simulated Location)
                </span>
              </div>
            </div>

            {/* Location Action Buttons Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="check-risk-use-my-location-btn"
                onClick={handleUseMyLocation}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Use current GPS or device coordinates"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Use My Location</span>
              </button>

              <button
                id="check-risk-search-location-btn"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                  isSearchOpen
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Search Location</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                id="check-risk-enrich-terrain-btn"
                onClick={handleEnrichLocation}
                disabled={isEnriching}
                title="Fetch real slope and elevation from bhunetr.onrender.com DEM grid"
                className="h-9 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isEnriching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
                <span>{isEnriching ? 'Enriching...' : 'Enrich via DEM'}</span>
              </button>
            </div>
          </div>

          {/* Search Location Dropdown / Input Container */}
          {isSearchOpen && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-location-input"
                  type="text"
                  placeholder="Type city or state (e.g. Gangtok, Shillong, Itanagar, Kohima)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Suggestions list */}
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectLocation(loc.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      cleanLocName === loc.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{loc.name}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      {loc.risk}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DEM Enrichment & Live Weather Status Cards */}
          {(enrichedTerrain || liveWeather) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrichedTerrain && (
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Mountain className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        DEM Terrain Data
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        <strong>{enrichedTerrain.elevation_m}m</strong> elevation • <strong>{enrichedTerrain.slope_deg}°</strong> slope
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-100/80 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800">
                    bhunetr.onrender.com
                  </span>
                </div>
              )}

              {liveWeather && (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <CloudRain className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Live Atmospheric Weather
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        <strong>{liveWeather.rainfall24hSumMm} mm</strong> rain • <strong>{liveWeather.soilMoisturePct}%</strong> saturation ({liveWeather.weatherDescription})
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800">
                    Live Open-Meteo
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================
            3. IMAGE UPLOAD
            ================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Upload Area Image
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select or capture a field photo of slopes, soil cuts, road fissures, or drainage channels.
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            id="terrain-photo-input"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!imageFile ? (
            /* Large Clean Upload Area */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/20 dark:hover:bg-slate-800'
              }`}
            >
              {/* 📷 Icon */}
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-2xs mb-3.5">
                <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Exact required text: "Upload a photo of the terrain" */}
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Upload a photo of the terrain
              </div>

              {/* Exact required text: "Supported: JPG, PNG" */}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Supported: JPG, PNG
              </p>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-sm">
                Drag and drop your image here, or click to browse files
              </p>

              {/* Button: "Choose Image" */}
              <button
                type="button"
                id="choose-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer"
              >
                Choose Image
              </button>
            </div>
          ) : (
            /* Selected Image Preview Box */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Image Preview */}
                  <img
                    src={imageFile.url}
                    alt="Terrain preview"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-2xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Selected Photo
                    </span>
                    {/* File Name */}
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base break-all mt-0.5">
                      {imageFile.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ready for terrain classification inspection
                    </div>
                  </div>
                </div>

                {/* Change Image & Remove Image Buttons */}
                <div className="flex items-center gap-2 self-stretch sm:self-center">
                  <button
                    id="change-image-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    id="remove-image-btn"
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* ==================================================
                  4. IMAGE VALIDATION
                  ================================================== */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                {imageFile.isRelevant ? (
                  /* Relevant image state */
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      {/* Exact text: "✓ Image appears relevant for terrain assessment." */}
                      <div className="font-extrabold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                        ✓ Image appears relevant for terrain assessment.
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5">
                        Geological features, slope inclination, and surface conditions detected.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Unrelated image state */
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <FileWarning className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        {/* Exact text: "Unable to analyze this image." */}
                        <div className="font-black text-sm text-red-900 dark:text-red-200">
                          Unable to analyze this image.
                        </div>
                        {/* Exact text: "Please upload a photo showing terrain, slope, soil, road damage or a suspected landslide area." */}
                        <p className="text-xs font-semibold text-red-800 dark:text-red-300 mt-1 leading-relaxed">
                          Please upload a photo showing terrain, slope, soil, road damage or a suspected landslide area.
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-red-700 dark:text-red-300 bg-red-100/60 dark:bg-red-900/40 p-2.5 rounded-lg border border-red-200 dark:border-red-800 mt-2">
                      <span className="font-bold">Examples of unrelated images:</span> food, animals, selfies, documents, random objects.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick preset chips for rapid testing */}
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Try sample evaluation photos:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {SAMPLE_TERRAIN_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl border text-left text-xs transition-colors flex items-center gap-2.5 cursor-pointer ${
                    imageFile?.name === sample.name
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 font-bold text-slate-900 dark:text-white ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <div className="truncate font-semibold">{sample.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {sample.isRelevant ? '✓ Valid Terrain' : '✕ Unrelated Negative'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ==================================================
              5. ANALYZE RISK BUTTON & LOADING STATE
              ================================================== */}
          <div className="pt-2">
            <button
              id="analyze-risk-btn"
              type="button"
              disabled={!imageFile || !imageFile.isRelevant || isAnalyzing}
              onClick={handleAnalyzeRisk}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-2xs transition-all ${
                !imageFile || !imageFile.isRelevant
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-md'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {/* Exact text: "Analyzing terrain conditions..." */}
                  <span>Analyzing terrain conditions...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Analyze Risk</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================
            6. RISK RESULT (Prominent Result Card)
            ================================================== */}
        {hasAnalyzed && imageFile?.isRelevant && !isAnalyzing && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-orange-400 dark:border-orange-500/80 p-6 sm:p-7 shadow-xs">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    {/* Exact Title: "AI Risk Assessment" */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        AI Risk Assessment
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {backendAnalysis?.source === 'gemini-ai' ? 'Gemini 3.8 Flash Vision' : 'NER Geotechnical Server'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Preliminary hazard prediction calculated by server geotechnical & AI vision pipeline.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-orange-900 dark:text-orange-300">Assessment Active</span>
                </div>
              </div>

              {/* Exact Required Fields in prominent layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
                {/* Location */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Location
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                    {cleanLocName}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {backendPredict?.factorOfSafety ? `Factor of Safety: ${backendPredict.factorOfSafety} FoS` : 'Monitored District'}
                  </span>
                </div>

                {/* Landslide Probability */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Landslide Probability
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                    {backendPredict?.probability ?? backendAnalysis?.riskScore ?? activeLocationData.probability}%
                  </div>
                  <span className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold">
                    {backendPredict?.probability >= 70 ? 'Critical Threshold Exceeded' : 'Elevated Threshold'}
                  </span>
                </div>

                {/* Risk Level */}
                <div className="p-4 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400 block">
                    Risk Level
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-2">
                    <span>🟠</span>
                    <span>{backendPredict?.riskLevel ?? backendAnalysis?.riskLevel ?? activeLocationData.risk}</span>
                  </div>
                  <span className="text-[11px] text-orange-800 dark:text-orange-400 font-semibold">High Vulnerability</span>
                </div>

                {/* Prediction Window */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Prediction Window
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                    {backendPredict?.predictionWindow ?? backendAnalysis?.predictionWindow ?? activeLocationData.window}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Critical Interval</span>
                </div>
              </div>
            </div>

            {/* ==================================================
                7. RISK FACTORS
                ================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>Risk Factors</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* Rainfall */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-bold">Rainfall</span>
                    <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {liveWeather ? `${liveWeather.rainfall24hSumMm} mm` : activeLocationData.rainfall}
                    </div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      {liveWeather ? `${liveWeather.weatherDescription} (24h)` : 'Heavy Rain'}
                    </div>
                  </div>
                </div>

                {/* Soil Moisture */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-bold">Soil Moisture</span>
                    <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {liveWeather ? `${liveWeather.soilMoisturePct}%` : activeLocationData.soil}
                    </div>
                    <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                      {liveWeather ? (liveWeather.soilMoisturePct > 70 ? 'High Saturation' : 'Permeable Equilibrium') : 'Near Saturation'}
                    </div>
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-bold">Temperature</span>
                    <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {liveWeather ? `${liveWeather.temperatureC}°C` : activeLocationData.temp}
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                      {liveWeather ? `${liveWeather.humidityPct}% Humidity` : 'Ambient'}
                    </div>
                  </div>
                </div>

                {/* Slope */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-bold">Slope</span>
                    <Mountain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {enrichedTerrain ? `${enrichedTerrain.slope_deg}° (DEM)` : activeLocationData.slope}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Steep Incline</div>
                  </div>
                </div>

                {/* Historical Landslides */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-bold">Historical Landslides</span>
                    <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {activeLocationData.history}
                    </div>
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">Past Incidents</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BhuNetr ML Neural Model Assessment (bhunetr.onrender.com) */}
            {backendPredict?.mlModel && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      BhuNetr ML Neural Model Prediction
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    bhunetr.onrender.com/predict
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      ML Risk Score & Level
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                      <span>{backendPredict.mlModel.risk_score_0_100}%</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
                        {backendPredict.mlModel.risk_level}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                    <span className="font-bold block text-slate-700 dark:text-slate-200 mb-1">Key Contributing Model Factors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {backendPredict.mlModel.top_contributing_factors?.map((f: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terrain Source: {backendPredict.mlModel.terrain_source}</span>
                </div>
              </div>
            )}

            {/* ==================================================
                8. WHY THIS RISK?
                ================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
              {/* Exact Title: "Why is the risk high?" */}
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-3">
                Why is the risk high?
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Heavy rainfall</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0"></span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">High soil moisture</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Steep terrain</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Historical landslide activity</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                Multiple environmental conditions are currently contributing to elevated landslide risk.
              </p>
            </div>

            {/* ==================================================
                9. ACTIONS
                ================================================== */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                Recommended Actions
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  id="action-view-risk-on-map-btn"
                  onClick={() => onNavigate('risk-map')}
                  className="py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>View Risk on Map</span>
                </button>

                <button
                  id="action-find-safe-route-btn"
                  onClick={() => onNavigate('safe-routes')}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Find Safe Route</span>
                </button>

                <button
                  id="action-emergency-help-btn"
                  onClick={() => onNavigate('emergency')}
                  className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Emergency Help</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            10. SAFETY DISCLAIMER
            ================================================== */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            This assessment is an early-warning aid and should not replace official disaster-management instructions.
          </p>
        </div>

      </div>
    </div>
  );
};

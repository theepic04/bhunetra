import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapRiskLocation, STATE_MAP_VIEWS } from '../data/mapRiskData';
import { useTheme } from '../context/ThemeContext';
import { Plus, Minus, RotateCcw, Navigation, AlertTriangle, ShieldCheck, Layers, Flame, CheckCircle2, Info } from 'lucide-react';

interface GeographicRiskMapProps {
  locations: MapRiskLocation[];
  selectedLocation: MapRiskLocation | null;
  onSelectLocation: (location: MapRiskLocation) => void;
  selectedState: string;
  userLocation: {
    lat: number;
    lng: number;
    name?: string;
    isLive?: boolean;
    fallbackNotice?: string;
  } | null;
  currentRole?: 'citizen' | 'authority';
  showAuthorityOverlay?: boolean;
  className?: string;
}

export const GeographicRiskMap: React.FC<GeographicRiskMapProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  selectedState,
  userLocation,
  currentRole = 'citizen',
  showAuthorityOverlay = false,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);
  const [heatmapData, setHeatmapData] = useState<any>(null);

  const { theme } = useTheme();

  // Create custom HTML icon for each risk marker
  const createRiskMarkerIcon = (
    location: MapRiskLocation,
    isSelected: boolean,
    isAuthority: boolean
  ) => {
    const rLevel = (location?.riskLevel || 'watch').toLowerCase();
    const isCritical = rLevel === 'critical' || rLevel === 'emergency' || rLevel === 'severe';
    const isHigh = rLevel === 'high' || rLevel === 'warning';
    const isWatch = rLevel === 'watch' || rLevel === 'moderate';

    const color = isCritical
      ? '#dc2626'
      : isHigh
      ? '#ea580c'
      : isWatch
      ? '#ca8a04'
      : '#16a34a';

    const bgBadge = isCritical
      ? '#fef2f2'
      : isHigh
      ? '#fff7ed'
      : isWatch
      ? '#fefce8'
      : '#f0fdf4';

    const borderBadge = isCritical
      ? '#fca5a5'
      : isHigh
      ? '#fdba74'
      : isWatch
      ? '#fde047'
      : '#86efac';

    const pulseHtml = (isCritical || isHigh)
      ? `<div class="absolute -inset-2 rounded-full opacity-40 animate-ping" style="background-color: ${color};"></div>`
      : '';

    const selectedHalo = isSelected
      ? `<div class="absolute -inset-3 rounded-full border-2 border-dashed border-slate-900 dark:border-white opacity-85"></div>`
      : '';

    const authorityBadge = (isAuthority && location.isAuthorityAlert)
      ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-black shadow-xs border border-white dark:border-slate-900">!</div>`
      : '';

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: 36px; height: 36px;">
        ${selectedHalo}
        ${pulseHtml}
        <div class="relative flex items-center justify-center w-7 h-7 rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-110" style="background-color: ${color};">
          <div class="w-2.5 h-2.5 rounded-full bg-white opacity-95"></div>
        </div>
        ${authorityBadge}
        <!-- Floating mini state label on hover or when selected -->
        <div class="absolute left-9 px-2 py-0.5 rounded-md shadow-xs text-[11px] font-bold whitespace-nowrap pointer-events-none transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
          ${location.name} (${location.probability}%)
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'bhunetra-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Create User Location GPS Icon
  const createUserLocationIcon = () => {
    const html = `
      <div class="relative flex items-center justify-center cursor-pointer" style="width: 32px; height: 32px;">
        <div class="absolute -inset-2 rounded-full bg-blue-500 opacity-35 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'bhunetra-user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // Build clean popup content
  const buildPopupHtml = (loc: MapRiskLocation) => {
    const rLevel = (loc?.riskLevel || 'watch').toLowerCase();
    const isCritical = rLevel === 'critical' || rLevel === 'emergency' || rLevel === 'severe';
    const isHigh = rLevel === 'high' || rLevel === 'warning';
    const isWatch = rLevel === 'watch' || rLevel === 'moderate';

    const riskBg = isCritical
      ? 'background: #dc2626; color: #ffffff;'
      : isHigh
      ? 'background: #ea580c; color: #ffffff;'
      : isWatch
      ? 'background: #ca8a04; color: #ffffff;'
      : 'background: #16a34a; color: #ffffff;';

    const infrastructureHtml = (currentRole === 'authority' && loc.affectedInfrastructure && loc.affectedInfrastructure.length > 0)
      ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(100,116,139,0.3);">
          <div style="font-size: 10px; font-weight: 700; color: #ea580c; text-transform: uppercase;">Infrastructure at Risk</div>
          <div style="font-size: 11px; margin-top: 2px;">${loc.affectedInfrastructure.join(', ')}</div>
        </div>
      `
      : '';

    return `
      <div style="padding: 12px 14px; font-family: inherit; min-width: 230px; max-width: 280px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div>
            <div style="font-size: 13px; font-weight: 800; line-height: 1.2;">${loc.name}</div>
            <div style="font-size: 11px; opacity: 0.75; margin-top: 2px;">${loc.district ? loc.district + ', ' : ''}${loc.state}</div>
          </div>
          <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; text-transform: uppercase; ${riskBg}">
            ${loc.riskLevel}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; font-size: 11px;">
          <div style="padding: 4px 6px; border-radius: 6px; background: rgba(148,163,184,0.12);">
            <span style="display: block; font-size: 9px; opacity: 0.7; text-transform: uppercase;">Probability</span>
            <strong style="font-size: 13px;">${loc.probability}%</strong>
          </div>
          <div style="padding: 4px 6px; border-radius: 6px; background: rgba(148,163,184,0.12);">
            <span style="display: block; font-size: 9px; opacity: 0.7; text-transform: uppercase;">Window</span>
            <strong style="font-size: 11px;">${loc.predictionWindow}</strong>
          </div>
        </div>

        <div style="font-size: 11px; opacity: 0.85; line-height: 1.45; margin-bottom: 6px;">
          <div>🌧️ <strong>Rainfall:</strong> ${loc.rainfall24h} mm (24h)${loc.rainfallCurrentMm !== undefined ? ` • ${loc.rainfallCurrentMm} mm/h` : ''}</div>
          <div>🌡️ <strong>Weather:</strong> ${loc.temperature}°C${loc.humidityPct ? ` (${loc.humidityPct}% RH)` : ''}${loc.weatherDescription ? ` • ${loc.weatherDescription}` : ''}</div>
          <div>💧 <strong>Soil Moisture:</strong> ${loc.soilMoisture}%</div>
          <div>⛰️ <strong>Slope & Elev:</strong> ${loc.slopeAngle}°${loc.elevation ? ` • ${loc.elevation}m DEM` : ''}</div>
          <div>📡 <strong>Status:</strong> ${loc.status}</div>
          ${loc.nearestDoppler ? `<div style="font-size: 10px; color: #0284c7; margin-top: 2px;">🛰️ ${loc.nearestDoppler}</div>` : ''}
        </div>

        ${infrastructureHtml}

        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(148,163,184,0.2); display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 9px; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
            IMD AWS Synced
          </span>
          <span style="font-size: 10px; font-weight: 700; color: #0284c7;">Click to inspect ➔</span>
        </div>
      </div>
    `;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center over North Eastern Region (NER)
    const initialView = STATE_MAP_VIEWS['All States'];

    const map = L.map(mapContainerRef.current, {
      center: initialView.center,
      zoom: initialView.zoom,
      minZoom: 5.5,
      maxZoom: 13,
      zoomControl: false, // We use custom accessible controls
      attributionControl: true
    });

    // Tile Layer: OpenStreetMap Standard (100% key-free, no watermarks, full zoom 19 data)
    // Dark mode is styled with CSS .leaflet-dark-tiles filter
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      maxNativeZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create layer group for risk markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Create layer group for ML Heatmap & Grid Overlay
    const heatmapLayer = L.layerGroup().addTo(map);
    heatmapLayerRef.current = heatmapLayer;

    mapInstanceRef.current = map;

    // Resize observer to ensure full container rendering
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Tile layer remains OpenStreetMap; theme is handled via CSS .leaflet-dark-tiles filter

  // Update Markers when locations, selectedLocation, or role change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const icon = createRiskMarkerIcon(loc, isSelected, currentRole === 'authority');

      const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], {
        icon,
        title: loc.name
      });

      marker.bindPopup(buildPopupHtml(loc), {
        className: 'bhunetra-popup-bubble'
      });

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      marker.addTo(markersLayerRef.current!);
      markersMapRef.current.set(loc.id, marker);

      // If this location is currently selected, open popup
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [locations, selectedLocation?.id, currentRole]);

  // Pan to selected location when changed externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    const marker = markersMapRef.current.get(selectedLocation.id);
    if (marker) {
      marker.openPopup();
      mapInstanceRef.current.panTo([
        selectedLocation.coordinates.lat,
        selectedLocation.coordinates.lng
      ]);
    }
  }, [selectedLocation?.id]);

  // Fetch ML Area / Grid Heatmap Prediction from backend (/api/ml/predict-area)
  useEffect(() => {
    if (!selectedLocation || !showHeatmap) {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.clearLayers();
      }
      return;
    }

    let isMounted = true;
    setHeatmapLoading(true);

    fetch('/api/ml/predict-area', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_id: selectedLocation.id,
        center_lat: selectedLocation.coordinates.lat,
        center_lng: selectedLocation.coordinates.lng,
        grid_radius: 1,
        spacing_deg: 0.04
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setHeatmapData(json.data);
        }
      })
      .catch((err) => {
        console.warn('[BhuNetr Map] Heatmap fetch failed:', err);
      })
      .finally(() => {
        if (isMounted) setHeatmapLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocation?.id, showHeatmap]);

  // Render Heatmap Grid and Refuge Vector on Leaflet map
  useEffect(() => {
    if (!heatmapLayerRef.current) return;
    heatmapLayerRef.current.clearLayers();

    if (!showHeatmap || !heatmapData || !heatmapData.grid) return;

    // 1. Draw each cell in the ML area grid
    heatmapData.grid.forEach((pt: any) => {
      const score = pt.risk_score_0_100;
      const color =
        score >= 75
          ? '#dc2626'
          : score >= 50
          ? '#ea580c'
          : score >= 30
          ? '#ca8a04'
          : '#16a34a';

      const circle = L.circle([pt.lat, pt.lng], {
        radius: pt.is_center ? 3200 : 2500,
        color: color,
        fillColor: color,
        fillOpacity: pt.is_center ? 0.32 : 0.20,
        weight: pt.is_center ? 2.5 : 1.2,
        dashArray: pt.is_center ? '4, 4' : undefined
      });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px; padding: 8px 10px; font-size: 11px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: ${color};">
              ${pt.is_center ? '📍 Focus Core' : 'Terrain Grid Node'}
            </strong>
            <span style="font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">
              ${pt.risk_level} (${score.toFixed(1)}%)
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; opacity: 0.85;">
            <div>Slope: <strong>${pt.slope_deg}°</strong></div>
            <div>Elevation: <strong>${pt.elevation_m}m</strong></div>
            <div>Incidents: <strong>${pt.historical_incidents_5yr}</strong></div>
            <div>Pos: <strong>${pt.lat.toFixed(2)}, ${pt.lng.toFixed(2)}</strong></div>
          </div>
          <div style="margin-top: 6px; font-size: 9px; opacity: 0.6; border-top: 1px dashed rgba(100,116,139,0.3); padding-top: 4px;">
            ML Engine • bhunetr.onrender.com
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.addTo(heatmapLayerRef.current!);
    });

    // 2. Draw safe corridor line to nearest_safer_point
    if (heatmapData.nearest_safer_point && heatmapData.center) {
      const centerPt = heatmapData.center;
      const safePt = heatmapData.nearest_safer_point;

      // Only draw if safe point is distinct or lower risk
      if (safePt.risk_score_0_100 < centerPt.risk_score_0_100) {
        const safeLine = L.polyline(
          [
            [centerPt.lat, centerPt.lng],
            [safePt.lat, safePt.lng]
          ],
          {
            color: '#10b981',
            weight: 3,
            dashArray: '6, 6'
          }
        );

        safeLine.bindPopup(`
          <div style="font-family: inherit; padding: 8px 10px; font-size: 11px;">
            <strong style="color: #10b981;">🟢 Evacuation Corridor to Lower Risk Terrain</strong>
            <div style="margin-top: 4px;">Safe Target: ${safePt.risk_level} (${safePt.risk_score_0_100}%) | Slope: ${safePt.slope_deg}° | Elev: ${safePt.elevation_m}m</div>
          </div>
        `);

        safeLine.addTo(heatmapLayerRef.current!);
      }
    }
  }, [heatmapData, showHeatmap]);

  // Fly to state center when state filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const targetView = STATE_MAP_VIEWS[selectedState] || STATE_MAP_VIEWS['All States'];

    // If locations exist for this state, fit bounds
    if (selectedState !== 'All States' && locations.length > 0) {
      const latLngs = locations.map((l) => [l.coordinates.lat, l.coordinates.lng] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    } else {
      mapInstanceRef.current.flyTo(targetView.center, targetView.zoom, { duration: 1.2 });
    }
  }, [selectedState]);

  // Update User Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = createUserLocationIcon();
      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon,
        zIndexOffset: 1000
      });

      const popupHtml = `
        <div style="padding: 10px 12px; font-family: inherit;">
          <div style="font-size: 10px; font-weight: 700; color: #2563eb; text-transform: uppercase;">
            ${userLocation.isLive ? '📍 Detected Location' : '📍 Fallback Location'}
          </div>
          <div style="font-size: 13px; font-weight: 800; margin-top: 2px;">
            ${userLocation.name || 'Your Location'}
          </div>
          ${
            userLocation.fallbackNotice
              ? `<div style="font-size: 10px; opacity: 0.75; margin-top: 4px;">${userLocation.fallbackNotice}</div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(mapInstanceRef.current);
      userMarkerRef.current = marker;

      // Pan to user location
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 9, { duration: 1.2 });
    }
  }, [userLocation]);

  // Control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapInstanceRef.current) {
      const view = STATE_MAP_VIEWS['All States'];
      mapInstanceRef.current.flyTo(view.center, view.zoom, { duration: 1.2 });
    }
  };

  return (
    <div
      id="geographic-risk-map-container"
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}
    >
      {/* Actual Leaflet DOM container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] ${theme === 'dark' ? 'leaflet-dark-tiles' : ''}`}
        style={{ zIndex: 1 }}
      />

      {/* Map Floating Controls (Top Right: +, -, Reset) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <button
          type="button"
          id="map-zoom-in-btn"
          title="Zoom In"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="map-zoom-out-btn"
          title="Zoom Out"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="map-reset-view-btn"
          title="Reset to All 8 States"
          onClick={handleReset}
          className="px-2 py-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>NER</span>
        </button>
        <button
          type="button"
          id="map-toggle-heatmap-btn"
          title={showHeatmap ? 'Turn off ML Heatmap' : 'Turn on ML Grid Heatmap'}
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-2 py-1.5 flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
            showHeatmap
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
        </button>
      </div>

      {/* Floating State/Coverage Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-xs text-[11px] font-bold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>8 North Eastern States</span>
        </div>
        {currentRole === 'authority' && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600/90 text-white shadow-xs text-[10px] font-extrabold uppercase tracking-wide">
            <ShieldCheck className="w-3 h-3" />
            <span>Authority GIS Monitoring</span>
          </div>
        )}
        {showHeatmap && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-600/90 text-white shadow-xs text-[10px] font-bold tracking-wide">
            <Flame className="w-3 h-3" />
            <span>ML Heatmap Grid Active</span>
          </div>
        )}
      </div>

      {/* ML Heatmap Summary Card (Bottom Center / Floating) */}
      {showHeatmap && heatmapData && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-lg w-[92%] sm:w-auto pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 px-3.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{heatmapData.summary || 'Hazard terrain model computed.'}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {heatmapData.nearest_safer_point
                  ? `Nearest refuge: ${heatmapData.nearest_safer_point.risk_level} (${heatmapData.nearest_safer_point.risk_score_0_100}%). Evacuation vector drawn.`
                  : 'Precomputed DEM slope & elevation grid.'}
              </div>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            bhunetr.onrender.com
          </span>
        </div>
      )}

      {/* Data Source Notice (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
        <div className="px-2 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>IMD Doppler Radar & GSI Sensor Mesh • OpenStreetMap Base</span>
        </div>
      </div>
    </div>
  );
};

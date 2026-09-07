import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Layers,
  Compass,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  CornerDownRight,
  ArrowUpRight,
  Car,
  Footprints,
  ShieldAlert,
  Info,
  X,
  Volume2,
  VolumeX,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Shield
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CitizenLocation } from './CitizenLocationModal';
import {
  getRegionalRouteConfig,
  SafeFacilityDetail,
  SafeRouteOption
} from '../data/safeRoutesData';

interface GoogleMapsSafeRouteProps {
  selectedFacility: 'shelter' | 'hospital' | 'services';
  onSelectFacility: (facility: 'shelter' | 'hospital' | 'services') => void;
  onFacilityAction?: (name: string, action: string) => void;
  currentLocation: CitizenLocation;
  onOpenLocationPicker?: () => void;
  activeRouteOptionId?: 'safe-ridge' | 'secondary-link' | 'valley-highway';
  onSelectRouteOptionId?: (id: 'safe-ridge' | 'secondary-link' | 'valley-highway') => void;
  simulateBlockage?: boolean;
  travelMode?: 'driving' | 'walking' | 'convoy';
  onTravelModeChange?: (mode: 'driving' | 'walking' | 'convoy') => void;
  focusedStepIndex?: number | null;
}

export const GoogleMapsSafeRoute: React.FC<GoogleMapsSafeRouteProps> = ({
  selectedFacility,
  onSelectFacility,
  onFacilityAction,
  currentLocation,
  onOpenLocationPicker,
  activeRouteOptionId = 'safe-ridge',
  onSelectRouteOptionId,
  simulateBlockage = false,
  travelMode: externalTravelMode,
  onTravelModeChange,
  focusedStepIndex
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const hazardLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const navAnimIntervalRef = useRef<number | null>(null);

  // Map Tile Style
  const [mapType, setMapType] = useState<'default' | 'satellite' | 'terrain'>('default');
  const [internalTravelMode, setInternalTravelMode] = useState<'driving' | 'walking' | 'convoy'>('driving');
  const travelMode = externalTravelMode || internalTravelMode;

  const handleModeChange = (mode: 'driving' | 'walking' | 'convoy') => {
    setInternalTravelMode(mode);
    if (onTravelModeChange) {
      onTravelModeChange(mode);
    }
  };

  const [showHazardOverlay, setShowHazardOverlay] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navProgressIndex, setNavProgressIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showDirectionsList, setShowDirectionsList] = useState<boolean>(false);

  // Dynamic regional route and hazard configuration derived from user's active location
  const regionConfig = useMemo(() => {
    return getRegionalRouteConfig(currentLocation, simulateBlockage);
  }, [currentLocation, simulateBlockage]);

  // Determine active destination and route coordinates
  const activeDest: SafeFacilityDetail =
    regionConfig.destinations[selectedFacility] || regionConfig.destinations.shelter;

  // Active route option (Safe Ridge, Secondary Link, or Valley Highway)
  const activeRouteOption: SafeRouteOption = useMemo(() => {
    const found = regionConfig.routeOptions.find((r) => r.id === activeRouteOptionId);
    return found || regionConfig.routeOptions[0];
  }, [regionConfig, activeRouteOptionId]);

  // When shelter is selected, we can show multi-route alternatives; for hospital/services we follow their specific routes
  const activeCoordinates: [number, number][] =
    selectedFacility === 'shelter'
      ? activeRouteOption.routeCoordinates
      : activeDest.routeCoordinates;

  const activeWaypoints =
    selectedFacility === 'shelter' ? activeRouteOption.waypoints : activeDest.waypoints;

  const userCoords = regionConfig.userCoords;
  const blockedRoadCoords = regionConfig.blockedRoadCoordinates;
  const hazardCenter = regionConfig.hazardCenter;

  // Cleanup navigation interval on unmount
  useEffect(() => {
    return () => {
      if (navAnimIntervalRef.current) {
        window.clearInterval(navAnimIntervalRef.current);
        navAnimIntervalRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech Synthesis Audio guidance
  const speakInstruction = (text: string) => {
    if (isAudioMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  };

  // Helper: Create Google Maps style Pulsing Blue User Location Marker
  const createUserLocationIcon = () => {
    const html = `
      <div class="relative flex items-center justify-center select-none" style="width: 48px; height: 48px;">
        <div class="absolute inset-0 rounded-full bg-blue-500 opacity-25 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-blue-500 opacity-40 animate-pulse"></div>
        <div class="absolute w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'gmaps-user-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  };

  // Helper: Create Google Maps style Teardrop Destination Pin Marker
  const createDestinationPinIcon = (color: string, emojiIcon: string, isSelected: boolean) => {
    const size = isSelected ? 42 : 34;
    const anchorY = isSelected ? 42 : 34;
    const ring = isSelected ? 'ring-3 ring-white shadow-2xl scale-110' : 'shadow-md';
    const html = `
      <div class="relative flex flex-col items-center justify-center cursor-pointer select-none transition-all" style="width: ${size}px; height: ${size}px;">
        <div class="w-full h-full rounded-full flex items-center justify-center text-white text-base ${ring}" style="background-color: ${color}; clip-path: polygon(50% 100%, 0% 50%, 0% 0%, 100% 0%, 100% 50%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg);">
          <span style="transform: rotate(45deg);">${emojiIcon}</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'gmaps-dest-pin',
      iconSize: [size, size],
      iconAnchor: [size / 2, anchorY]
    });
  };

  // Helper: Create Google Maps style Hazard / Blocked Road Sign Marker
  const createHazardMarkerIcon = (label: string, isBlocked: boolean) => {
    const bg = isBlocked ? '#dc2626' : '#ea580c';
    const icon = isBlocked ? '⛔' : '⚠️';
    const html = `
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-black shadow-lg border-2 border-white select-none whitespace-nowrap cursor-pointer animate-bounce" style="background-color: ${bg}; transform: translate(-50%, -50%);">
        <span>${icon}</span>
        <span>${label}</span>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'gmaps-hazard-badge',
      iconSize: [160, 28],
      iconAnchor: [80, 14]
    });
  };

  // Helper: Create Waypoint Turn Dot
  const createWaypointIcon = (stepNum: number, isHighlighted = false) => {
    const borderColor = isHighlighted ? '#2563eb' : '#059669';
    const textColor = isHighlighted ? '#1d4ed8' : '#065f46';
    const scale = isHighlighted ? 'scale-125 ring-2 ring-blue-400 ring-offset-2' : '';
    const html = `
      <div class="w-5 h-5 rounded-full bg-white border-2 shadow-md flex items-center justify-center text-[10px] font-black transition-all ${scale}" style="border-color: ${borderColor}; color: ${textColor}; transform: translate(-50%, -50%);">
        ${stepNum}
      </div>
    `;
    return L.divIcon({
      html,
      className: 'gmaps-waypoint-dot',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  };

  // Tile layer configuration
  const getTileLayerConfig = (type: 'default' | 'satellite' | 'terrain') => {
    let tileUrl = '';
    let attribution = '';
    let maxZoom = 19;
    let maxNativeZoom = 19;
    let subdomains: string[] | string = ['a', 'b', 'c'];

    if (type === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
      maxZoom = 19;
      maxNativeZoom = 17;
    } else if (type === 'terrain') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Topo Map &copy; OpenStreetMap';
      maxZoom = 19;
      maxNativeZoom = 15;
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      maxZoom = 19;
      maxNativeZoom = 19;
    }

    return { tileUrl, attribution, maxZoom, maxNativeZoom, subdomains };
  };

  // Switch Tile Layer based on mapType and app theme
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const { tileUrl, attribution, maxZoom, maxNativeZoom, subdomains } = getTileLayerConfig(mapType);

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      maxNativeZoom,
      attribution,
      subdomains
    });

    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [mapType, theme]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userCoords,
        zoom: 14,
        minZoom: 9,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true
      });

      const { tileUrl, attribution, maxZoom, maxNativeZoom, subdomains } = getTileLayerConfig(mapType);

      const initialTile = L.tileLayer(tileUrl, {
        maxZoom,
        maxNativeZoom,
        attribution,
        subdomains
      }).addTo(map);

      tileLayerRef.current = initialTile;

      const routeGroup = L.layerGroup().addTo(map);
      const hazardGroup = L.layerGroup().addTo(map);

      routeLayerGroupRef.current = routeGroup;
      hazardLayerGroupRef.current = hazardGroup;
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Position, Route Polylines, Markers, and Hazards whenever location, destination, route option, or simulation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerGroupRef.current;
    const hazardGroup = hazardLayerGroupRef.current;
    if (!map || !routeGroup || !hazardGroup) return;

    routeGroup.clearLayers();
    hazardGroup.clearLayers();

    // 1. User Location Marker
    const userMarker = L.marker(userCoords, {
      icon: createUserLocationIcon(),
      zIndexOffset: 1000
    });
    userMarker.bindPopup(`
      <div class="p-1 text-slate-800 dark:text-slate-100 font-sans">
        <div class="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">GPS Origin</div>
        <div class="text-sm font-black text-slate-900 dark:text-white mt-0.5">${currentLocation.name}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${regionConfig.locationName}</div>
        <div class="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span>● GPS Locked</span> • <span>Accuracy ±5m</span>
        </div>
      </div>
    `);
    routeGroup.addLayer(userMarker);

    // 2. Destination Markers
    const destinationsList: SafeFacilityDetail[] = [
      regionConfig.destinations.shelter,
      regionConfig.destinations.hospital,
      regionConfig.destinations.services
    ];

    destinationsList.forEach((dest) => {
      const isSelected = dest.id === selectedFacility;
      const emoji = dest.id === 'shelter' ? '🏠' : dest.id === 'hospital' ? '🏥' : '🚒';

      const destMarker = L.marker([dest.lat, dest.lng], {
        icon: createDestinationPinIcon(dest.badgeColor, emoji, isSelected),
        zIndexOffset: isSelected ? 900 : 800
      });

      destMarker.on('click', () => {
        onSelectFacility(dest.id);
        if (onFacilityAction) {
          onFacilityAction(dest.name, 'Selected Destination');
        }
      });

      destMarker.bindPopup(`
        <div class="p-1 font-sans text-slate-800 dark:text-slate-100 min-w-[210px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase px-1.5 py-0.5 rounded text-white" style="background-color: ${dest.badgeColor};">
              ${dest.status}
            </span>
            <span class="text-xs font-bold text-slate-500">${dest.distanceKm} km</span>
          </div>
          <div class="text-sm font-black text-slate-900 dark:text-white mt-1.5">${dest.name}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${dest.address}</div>
          ${dest.capacity ? `<div class="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">${dest.capacity}</div>` : ''}
          <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>🚗 ${dest.driveTimeMin} min</span>
            <span>🚶 ${dest.walkTimeMin} min</span>
          </div>
        </div>
      `);

      routeGroup.addLayer(destMarker);
    });

    // 3. Render Alternate Routes (when in Shelter mode)
    if (selectedFacility === 'shelter') {
      regionConfig.routeOptions.forEach((opt) => {
        const isActive = opt.id === activeRouteOptionId;
        if (!isActive) {
          // Inactive alternate route shown in dashed line
          const altPolyline = L.polyline(opt.routeCoordinates, {
            color: opt.id === 'valley-highway' ? '#ef4444' : '#64748b',
            weight: 3.5,
            dashArray: opt.id === 'valley-highway' ? '6, 6' : '4, 6',
            opacity: 0.65,
            lineCap: 'round',
            lineJoin: 'round'
          });

          altPolyline.on('click', () => {
            if (onSelectRouteOptionId) {
              onSelectRouteOptionId(opt.id);
            }
          });

          altPolyline.bindTooltip(
            `<b>${opt.name}</b><br/>${opt.distanceKm} km • ${opt.driveTimeMin ? `${opt.driveTimeMin} min` : 'BLOCKED'} • Click to switch`,
            { direction: 'top', sticky: true }
          );

          routeGroup.addLayer(altPolyline);
        }
      });
    }

    // 4. Render Active Selected Route
    const activeRouteCoords = activeCoordinates;

    // Outer glow polyline
    const outerColor =
      activeRouteOptionId === 'valley-highway'
        ? '#ef4444'
        : activeRouteOptionId === 'secondary-link'
        ? '#f59e0b'
        : '#10b981';

    const mainColor =
      activeRouteOptionId === 'valley-highway'
        ? '#dc2626'
        : activeRouteOptionId === 'secondary-link'
        ? '#d97706'
        : '#059669';

    const outerPolyline = L.polyline(activeRouteCoords, {
      color: outerColor,
      weight: 10,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    });
    routeGroup.addLayer(outerPolyline);

    const mainPolyline = L.polyline(activeRouteCoords, {
      color: mainColor,
      weight: 5.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });
    routeGroup.addLayer(mainPolyline);

    // Numbered Waypoint Turn Dots along the active route
    activeWaypoints.forEach((wp, idx) => {
      if (idx > 0 && idx < activeWaypoints.length - 1) {
        const isHighlighted = focusedStepIndex === idx;
        const wpMarker = L.marker([wp.lat, wp.lng], {
          icon: createWaypointIcon(idx, isHighlighted),
          zIndexOffset: isHighlighted ? 950 : 750
        });
        wpMarker.bindTooltip(`<b>Step ${idx}:</b> ${wp.name}<br/>${wp.instruction}`, {
          direction: 'top',
          offset: [0, -10]
        });
        routeGroup.addLayer(wpMarker);
      }
    });

    // 5. Hazard & Blocked Road Overlays
    if (showHazardOverlay) {
      // Landslide Risk Perimeter Circle
      const hazardCircle = L.circle(hazardCenter, {
        color: '#ea580c',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#f97316',
        fillOpacity: 0.2,
        radius: 300
      });
      hazardCircle.bindPopup(`
        <div class="p-1 font-sans text-slate-800 dark:text-slate-100">
          <div class="text-[10px] uppercase font-black text-orange-600">⚠️ Active Landslide Slip Zone</div>
          <div class="text-xs font-black mt-0.5">High Soil Saturation Corridor</div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-1">${regionConfig.hazardDescription}</p>
          <div class="text-[10px] font-bold text-red-600 mt-1">Status: EVACUATION DETOUR ENFORCED</div>
        </div>
      `);
      hazardGroup.addLayer(hazardCircle);

      // Blocked Road Segment (Dashed Red Line)
      const blockedRoadPolyline = L.polyline(blockedRoadCoords, {
        color: '#dc2626',
        weight: 6,
        dashArray: '8, 6',
        opacity: 0.9,
        lineCap: 'round'
      });
      hazardGroup.addLayer(blockedRoadPolyline);

      // Blocked Road Barrier Marker
      const midBlockedIdx = Math.floor(blockedRoadCoords.length / 2);
      const blockedSignMarker = L.marker(blockedRoadCoords[midBlockedIdx], {
        icon: createHazardMarkerIcon(
          simulateBlockage
            ? `⛔ ROAD BLOCKED: ${regionConfig.blockedRoadName.split('(')[0]}`
            : `CLOSED: ${regionConfig.blockedRoadName.split('(')[0]}`,
          true
        ),
        zIndexOffset: 850
      });
      blockedSignMarker.bindPopup(`
        <div class="p-1 font-sans text-slate-800 dark:text-slate-100">
          <div class="text-xs font-black text-red-600 flex items-center gap-1">
            <span>⛔ Highway Blocked by Mud & Rockfall</span>
          </div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            ${regionConfig.blockedRoadName} is impassable. Local SDRF taskforce has diverted all citizen traffic to the high-elevation <strong>${regionConfig.safeCorridorName}</strong>.
          </div>
        </div>
      `);
      hazardGroup.addLayer(blockedSignMarker);
    }

    // Fit map bounds smoothly to encompass the active safe route, origin, destination and hazard
    const allRoutePoints: L.LatLngExpression[] = [
      userCoords,
      ...activeRouteCoords,
      hazardCenter
    ];
    const bounds = L.latLngBounds(allRoutePoints);
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16
    });

  }, [
    selectedFacility,
    activeRouteOptionId,
    currentLocation,
    simulateBlockage,
    travelMode,
    showHazardOverlay,
    focusedStepIndex
  ]);

  // Focus to step waypoint when clicked in parent
  useEffect(() => {
    if (focusedStepIndex !== null && focusedStepIndex !== undefined && mapInstanceRef.current) {
      const step = activeWaypoints[focusedStepIndex];
      if (step) {
        mapInstanceRef.current.setView([step.lat, step.lng], 16, { animate: true });
      }
    }
  }, [focusedStepIndex, activeWaypoints]);

  // Turn-by-turn Navigation Simulation Engine with Speech Audio
  const handleToggleNavigation = () => {
    if (isNavigating) {
      // Stop navigation
      setIsNavigating(false);
      if (navAnimIntervalRef.current) {
        window.clearInterval(navAnimIntervalRef.current);
        navAnimIntervalRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setNavProgressIndex(0);
    } else {
      // Start navigation simulation
      setIsNavigating(true);
      setNavProgressIndex(0);

      const coords = activeCoordinates;
      let currentIndex = 0;

      if (mapInstanceRef.current && coords.length > 0) {
        mapInstanceRef.current.setView(coords[0], 16, { animate: true });
      }

      // Initial spoken instruction
      if (activeWaypoints[0]) {
        speakInstruction(`Starting route to ${activeDest.name}. ${activeWaypoints[0].instruction}`);
      }

      navAnimIntervalRef.current = window.setInterval(() => {
        currentIndex += 1;
        if (currentIndex >= coords.length) {
          currentIndex = coords.length - 1;
          setIsNavigating(false);
          if (navAnimIntervalRef.current) {
            window.clearInterval(navAnimIntervalRef.current);
            navAnimIntervalRef.current = null;
          }
          speakInstruction(`You have arrived at your destination, ${activeDest.name}. Emergency personnel are on site.`);
        } else {
          // Speak current waypoint turn
          const currentWp = activeWaypoints[Math.min(currentIndex, activeWaypoints.length - 1)];
          if (currentWp) {
            speakInstruction(currentWp.instruction);
          }
        }
        setNavProgressIndex(currentIndex);

        if (mapInstanceRef.current && coords[currentIndex]) {
          mapInstanceRef.current.panTo(coords[currentIndex], { animate: true, duration: 0.8 });
        }
      }, 3500);
    }
  };

  // Recenter to active route
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const allRoutePoints: L.LatLngExpression[] = [
      userCoords,
      ...activeCoordinates,
      hazardCenter
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(allRoutePoints), {
      padding: [50, 50],
      maxZoom: 16
    });
  };

  // Current active step text
  const currentStep =
    activeWaypoints[Math.min(navProgressIndex, activeWaypoints.length - 1)] || activeWaypoints[0];
  const nextStep =
    activeWaypoints[Math.min(navProgressIndex + 1, activeWaypoints.length - 1)];

  // Distance & time metrics
  const activeDistanceKm =
    selectedFacility === 'shelter' ? activeRouteOption.distanceKm : activeDest.distanceKm;

  const activeEtaMin =
    travelMode === 'driving'
      ? (selectedFacility === 'shelter' ? activeRouteOption.driveTimeMin : activeDest.driveTimeMin)
      : travelMode === 'walking'
      ? (selectedFacility === 'shelter' ? activeRouteOption.walkTimeMin : activeDest.walkTimeMin)
      : (selectedFacility === 'shelter' ? activeRouteOption.convoyTimeMin : (activeDest.convoyTimeMin || 16));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-900 select-none">

      {/* =========================================================================
          TOP FLOATING DIRECTIONS & NAVIGATION BAR
          ========================================================================= */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-30 space-y-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 space-y-2.5 transition-all">

          {/* Origin & Destination Rows */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-between py-1 self-stretch">
              <div className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white dark:bg-slate-900 shrink-0"></div>
              <div className="w-0.5 flex-1 bg-slate-300 dark:bg-slate-700 my-1"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 shrink-0 shadow-xs"></div>
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  Start: {currentLocation.name}, {currentLocation.state}
                </span>
                {onOpenLocationPicker && (
                  <button
                    type="button"
                    onClick={onOpenLocationPicker}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 ml-1.5 flex items-center gap-0.5 cursor-pointer"
                    title="Change location"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="font-extrabold text-emerald-900 dark:text-emerald-200 truncate">
                  To: {activeDest.name}
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded shrink-0 ml-1">
                  SAFE HUB
                </span>
              </div>
            </div>
          </div>

          {/* Travel Mode Toggle + ETA & Distance Badge */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleModeChange('driving')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  travelMode === 'driving'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{selectedFacility === 'shelter' ? activeRouteOption.driveTimeMin : activeDest.driveTimeMin}m</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('walking')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  travelMode === 'walking'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>{selectedFacility === 'shelter' ? activeRouteOption.walkTimeMin : activeDest.walkTimeMin}m</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('convoy')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  travelMode === 'convoy'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Escorted SDRF Convoy"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Convoy</span>
              </button>
            </div>

            {/* Distance / Status badge */}
            <div className="text-right shrink-0">
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {activeDistanceKm} km
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
                {activeRouteOptionId === 'valley-highway' ? '⚠️ High Risk Section' : 'Via Safe Ridge'}
              </div>
            </div>
          </div>

          {/* Quick Destination Switcher Pills */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              id="gmaps-dest-shelter-btn"
              onClick={() => onSelectFacility('shelter')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                selectedFacility === 'shelter'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              <span>🏠</span>
              <span className="truncate">Shelter</span>
            </button>

            <button
              type="button"
              id="gmaps-dest-hospital-btn"
              onClick={() => onSelectFacility('hospital')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                selectedFacility === 'hospital'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <span>🏥</span>
              <span className="truncate">Hospital</span>
            </button>

            <button
              type="button"
              id="gmaps-dest-services-btn"
              onClick={() => onSelectFacility('services')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer truncate ${
                selectedFacility === 'services'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
              }`}
            >
              <span>🚒</span>
              <span className="truncate">SDRF Post</span>
            </button>
          </div>
        </div>

        {/* Turn-By-Turn Maneuver Navigation Banner */}
        <div className="bg-emerald-700 text-white rounded-2xl p-2.5 sm:p-3 shadow-xl border border-emerald-600 flex items-center justify-between gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 border border-emerald-500/50">
            <CornerDownRight className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-emerald-200 font-black flex items-center gap-1.5">
              <span>{isNavigating ? `Step ${navProgressIndex + 1} of ${activeWaypoints.length}` : 'Active Safe Bypass'}</span>
              {isNavigating && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              )}
            </div>
            <div className="text-xs font-black text-white truncate mt-0.5">
              {currentStep.instruction}
            </div>
            <div className="text-[10px] text-emerald-200/90 truncate">
              Then {nextStep ? nextStep.name : 'reach destination safe gate'}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="gmaps-start-nav-btn"
              onClick={handleToggleNavigation}
              className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 ${
                isNavigating
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white hover:bg-emerald-50 text-emerald-900'
              }`}
            >
              {isNavigating ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextMuted = !isAudioMuted;
                setIsAudioMuted(nextMuted);
                if (!nextMuted && 'speechSynthesis' in window) {
                  speakInstruction('Voice guidance enabled.');
                }
              }}
              title={isAudioMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
              className="p-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 hover:text-white cursor-pointer"
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LEAFLET INTERACTIVE MAP CONTAINER
          ========================================================================= */}
      <div
        ref={mapContainerRef}
        id="google-maps-leaflet-canvas"
        className={`w-full h-[480px] sm:h-[550px] relative z-10 focus:outline-hidden ${
          theme === 'dark' && mapType === 'default' ? 'leaflet-dark-tiles' : ''
        }`}
        style={{ cursor: 'grab' }}
      />

      {/* =========================================================================
          BOTTOM-LEFT LAYER SWITCHER WIDGET
          ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-1 flex items-center gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMapType('default')}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              mapType === 'default'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🗺️ Street
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType('terrain')}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              mapType === 'terrain'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⛰️ Terrain
          </button>
        </div>

        {/* Hazard Overlay Toggle */}
        <button
          type="button"
          onClick={() => setShowHazardOverlay(!showHazardOverlay)}
          className={`px-3 py-2 rounded-2xl text-xs font-bold shadow-xl border backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 ${
            showHazardOverlay
              ? 'bg-orange-600 text-white border-orange-500 shadow-orange-500/20'
              : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{showHazardOverlay ? 'Hazards Visible' : 'Hazards Hidden'}</span>
        </button>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT CONTROLS (+, -, Recenter, Info)
          ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-30 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
          <button
            type="button"
            id="gmaps-zoom-in-btn"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="gmaps-zoom-out-btn"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          id="gmaps-recenter-btn"
          onClick={handleRecenter}
          className="w-10 h-10 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-all"
          title="Re-center on Route"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowDirectionsList(!showDirectionsList)}
          className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-xl border flex items-center justify-center transition-all cursor-pointer ${
            showDirectionsList
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Turn-by-Turn Steps"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          COLLAPSIBLE TURN-BY-TURN STEPS DRAWER
          ========================================================================= */}
      {showDirectionsList && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 shadow-2xl z-40 p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Turn-by-Turn Guidance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectionsList(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs border-b border-slate-100 dark:border-slate-800 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mt-3">
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {activeDistanceKm} km • {activeEtaMin} min ({travelMode})
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Via {regionConfig.safeCorridorName.split('(')[0]}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                Avoids {regionConfig.blockedRoadName.split('(')[0]} slide zone
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeWaypoints.map((wp, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([wp.lat, wp.lng], 16, { animate: true });
                    }
                  }}
                  className={`flex items-start gap-3 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    focusedStepIndex === idx
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center shrink-0 text-[11px] border border-slate-200 dark:border-slate-700 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {wp.name}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      {wp.instruction}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Emergency Convoy Escort: Dial <strong>1077</strong> for SDRF escorted transit.
          </div>
        </div>
      )}

      {/* =========================================================================
          BOTTOM REAL-TIME ADVISORY FOOTER BAR
          ========================================================================= */}
      <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-20 relative">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
          <span className="font-bold text-slate-900 dark:text-white">
            {regionConfig.safeCorridorName.split('(')[0]}:
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Confirmed open & patrolled by SDRF Taskforce. Real-time telemetry linked.
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <span>Elevation Gain: <strong>+{regionConfig.elevationGainM}m</strong></span>
          <span>Max Grade: <strong>{regionConfig.maxGradePct}%</strong></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Active Sensor Sync</span>
        </div>
      </div>
    </div>
  );
};

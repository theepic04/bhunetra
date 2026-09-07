import { RiskZone } from '../types';
import { MOCK_ZONES } from './mockData';

export interface MapRiskLocation {
  id: string;
  name: string;
  state: string;
  district: string;
  subRegion: string;
  riskLevel: 'Low' | 'Watch' | 'High' | 'Critical';
  probability: number;
  rainfall24h: number; // in mm
  rainfallCurrentMm?: number; // current intensity mm/h
  soilMoisture: number; // percentage
  temperature: number; // in Celsius
  humidityPct?: number; // relative humidity percentage
  weatherDescription?: string; // e.g. Continuous Monsoon Rain
  slopeAngle: number; // in degrees
  elevation?: number; // in meters (DEM)
  factorOfSafety?: number; // geotechnical FoS ratio
  hazardScore?: number; // 0-100 hazard index
  predictionWindow: string;
  status: string; // e.g. 'Active Monitoring', 'High Hazard Warning', 'Stable'
  activeWarning?: string;
  lastUpdated: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Authority GIS metadata
  isAuthorityAlert?: boolean;
  affectedInfrastructure?: string[];
  monitoringStation?: string;
  responseTeamAssigned?: string;
  nearestDoppler?: string;
  isLiveSynced?: boolean;
}

export const NER_STATES = [
  'All States',
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
] as const;

export type NERStateName = typeof NER_STATES[number];

// Center coordinates and default zoom for all 8 North Eastern States
export const STATE_MAP_VIEWS: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  'All States': { center: [26.15, 92.9], zoom: 6.5 },
  'Arunachal Pradesh': { center: [27.75, 93.85], zoom: 7.5 },
  'Assam': { center: [26.2, 92.8], zoom: 7.5 },
  'Manipur': { center: [24.8, 93.9], zoom: 8 },
  'Meghalaya': { center: [25.5, 91.5], zoom: 8 },
  'Mizoram': { center: [23.4, 92.8], zoom: 8 },
  'Nagaland': { center: [25.9, 94.2], zoom: 8 },
  'Sikkim': { center: [27.45, 88.55], zoom: 8.5 },
  'Tripura': { center: [23.85, 91.6], zoom: 8.5 }
};

// Prototype dataset covering all 8 NER states, structured for easy migration to real 2-year landslide dataset
export const PROTOTYPE_MAP_LOCATIONS: MapRiskLocation[] = [
  {
    id: 'zone-04',
    name: 'Gangtok',
    state: 'Sikkim',
    district: 'East Sikkim',
    subRegion: 'Gangtok & East Sikkim Corridor',
    riskLevel: 'Low',
    probability: 28,
    rainfall24h: 15,
    rainfallCurrentMm: 0.5,
    soilMoisture: 49,
    temperature: 20,
    humidityPct: 92,
    weatherDescription: 'Heavy Rain Showers',
    slopeAngle: 14.02,
    elevation: 3021,
    factorOfSafety: 2.53,
    hazardScore: 28,
    predictionWindow: 'Stable',
    status: 'Nominal Stability',
    activeWarning: 'Slope stability parameters remain within safe thresholds.',
    lastUpdated: 'Live IMD Synced',
    coordinates: { lat: 27.3389, lng: 88.6065 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['NH-10 Highway Corridor', 'Singtam Bailey Bridge', 'Dikchu Valley Route'],
    monitoringStation: 'GSI Automatic Inclinometer Node SK-04',
    responseTeamAssigned: 'NDRF 2nd Bn Team A',
    nearestDoppler: 'IMD Gangtok AWS / S-Band Radar Link',
    isLiveSynced: true
  },
  {
    id: 'zone-12',
    name: 'Tawang',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    subRegion: 'Bhalukpong–Tawang Mountain Corridor',
    riskLevel: 'High',
    probability: 78,
    rainfall24h: 88,
    soilMoisture: 76,
    temperature: 18,
    slopeAngle: 35,
    predictionWindow: 'Next 24–48 Hours',
    status: 'High Instability Warning',
    activeWarning: 'Saturated soil mantle detected along mountain pass curves. Heavy commercial transit restricted.',
    lastUpdated: '25 mins ago',
    coordinates: { lat: 27.5861, lng: 91.8594 },
    isAuthorityAlert: true,
    affectedInfrastructure: ['Bhalukpong-Bomdila-Tawang Highway', 'Sela Tunnel Approach Road'],
    monitoringStation: 'BRO Seismogeotechnical Unit AR-12',
    responseTeamAssigned: 'BRO Earthmover Quick Response'
  },
  {
    id: 'zone-03',
    name: 'Kohima',
    state: 'Nagaland',
    district: 'Kohima',
    subRegion: 'Kohima–Zubza Bypass (NH-29)',
    riskLevel: 'High',
    probability: 74,
    rainfall24h: 81,
    soilMoisture: 74,
    temperature: 20,
    slopeAngle: 34,
    predictionWindow: 'Next 24–48 Hours',
    status: 'Slope Subsidence Warning',
    activeWarning: 'Minor slope subsidence detected on eastern shoulder. Precautionary barricades deployed.',
    lastUpdated: '15 mins ago',
    coordinates: { lat: 25.6751, lng: 94.1086 },
    isAuthorityAlert: true,
    affectedInfrastructure: ['NH-29 Zubza Valley Section', 'Kohima Transit Bypass Bridge'],
    monitoringStation: 'NSDMA Piezometer Telemetry NL-03',
    responseTeamAssigned: 'State Disaster Response Force NL-1'
  },
  {
    id: 'zone-07',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    subRegion: 'Cherrapunji–Sohra Cliff Slopes',
    riskLevel: 'Watch',
    probability: 54,
    rainfall24h: 62,
    soilMoisture: 65,
    temperature: 22,
    slopeAngle: 28,
    predictionWindow: 'Next 48 Hours',
    status: 'Active Field Monitoring',
    activeWarning: 'Moderate seepage observed along cliff edges. Regular monitoring active by district disaster cell.',
    lastUpdated: '40 mins ago',
    coordinates: { lat: 25.2986, lng: 91.7086 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['Sohra-Shella Hill Route', 'Wah Kaba Viewing Culvert'],
    monitoringStation: 'Meghalaya SDMA Weather Doppler ML-07'
  },
  {
    id: 'zone-01',
    name: 'Haflong',
    state: 'Assam',
    district: 'Dima Hasao',
    subRegion: 'Dima Hasao Hill Slopes (Haflong–Jatinga)',
    riskLevel: 'Low',
    probability: 22,
    rainfall24h: 15,
    soilMoisture: 35,
    temperature: 28,
    slopeAngle: 18,
    predictionWindow: 'Stable',
    status: 'Nominal Stability',
    activeWarning: 'Slope stability normal. Regular sensor telemetry active with no anomalous movement.',
    lastUpdated: '50 mins ago',
    coordinates: { lat: 25.1834, lng: 93.0248 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['Lumding-Badarpur Hill Railway Line'],
    monitoringStation: 'N.F. Railway Hill Sensor AS-01'
  },
  {
    id: 'zone-05',
    name: 'Aizawl',
    state: 'Mizoram',
    district: 'Aizawl',
    subRegion: 'Aizawl West & Sairang Slopes',
    riskLevel: 'Low',
    probability: 18,
    rainfall24h: 12,
    soilMoisture: 30,
    temperature: 26,
    slopeAngle: 22,
    predictionWindow: 'Stable',
    status: 'Nominal Stability',
    activeWarning: 'Normal drainage runoff with localized saturated pockets. Slopes stable.',
    lastUpdated: '1 hour ago',
    coordinates: { lat: 23.7271, lng: 92.7176 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['Aizawl-Lengpui Airport Road'],
    monitoringStation: 'Mizoram Disaster Management Station MZ-05'
  },
  {
    id: 'zone-08',
    name: 'Noney',
    state: 'Manipur',
    district: 'Noney',
    subRegion: 'Noney & Tupul Valley Corridor',
    riskLevel: 'Low',
    probability: 25,
    rainfall24h: 20,
    soilMoisture: 36,
    temperature: 25,
    slopeAngle: 24,
    predictionWindow: 'Stable',
    status: 'Nominal Stability',
    activeWarning: 'Conditions stable. Catchment sensors reporting nominal drainage.',
    lastUpdated: '2 hours ago',
    coordinates: { lat: 24.817, lng: 93.702 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['Jiribam-Imphal Railway Project Site'],
    monitoringStation: 'Manipur Geohazard Unit MN-08'
  },
  {
    id: 'zone-06',
    name: 'Jampui Hills',
    state: 'Tripura',
    district: 'North Tripura',
    subRegion: 'Jampui Hills Foothills & Ridges',
    riskLevel: 'Low',
    probability: 16,
    rainfall24h: 10,
    soilMoisture: 28,
    temperature: 29,
    slopeAngle: 15,
    predictionWindow: 'Stable',
    status: 'Nominal Stability',
    activeWarning: 'All slopes nominal. Clear weather forecast across southern ridges.',
    lastUpdated: '2 hours ago',
    coordinates: { lat: 23.8315, lng: 91.2868 },
    isAuthorityAlert: false,
    affectedInfrastructure: ['NH-8 Southern Link'],
    monitoringStation: 'Tripura SDMA Ridge Sensor TR-06'
  }
];

/**
 * Data Access Layer for Risk Map
 * In future iterations, this function will fetch from the real 2-year landslide dataset/API.
 */
export const getMapRiskLocations = async (): Promise<MapRiskLocation[]> => {
  // Simulating async API retrieval for clean separation
  return Promise.resolve(PROTOTYPE_MAP_LOCATIONS);
};

export const getMapRiskLocationsSync = (): MapRiskLocation[] => {
  return PROTOTYPE_MAP_LOCATIONS;
};

/**
 * Adapter converting MapRiskLocation to RiskZone (for backward-compatibility with other modules)
 */
export const mapLocationToRiskZone = (loc: MapRiskLocation): RiskZone => {
  return {
    id: loc.id,
    name: loc.name,
    state: loc.state,
    subRegion: loc.subRegion,
    riskLevel: loc.riskLevel,
    probability: loc.probability,
    predictionWindow: loc.predictionWindow,
    rainfall24h: loc.rainfall24h,
    soilMoisture: loc.soilMoisture,
    temperature: loc.temperature,
    slopeAngle: loc.slopeAngle,
    coordinates: {
      x: 50,
      y: 50,
      lat: loc.coordinates.lat,
      lng: loc.coordinates.lng
    },
    activeWarning: loc.activeWarning,
    lastUpdated: loc.lastUpdated
  };
};

/**
 * Search helper across the 8 NER states
 */
export const searchMapLocations = (query: string, locations: MapRiskLocation[]): MapRiskLocation[] => {
  const clean = query.trim().toLowerCase();
  if (!clean) return locations;

  return locations.filter((loc) => {
    return (
      loc.name.toLowerCase().includes(clean) ||
      loc.state.toLowerCase().includes(clean) ||
      loc.district.toLowerCase().includes(clean) ||
      loc.subRegion.toLowerCase().includes(clean) ||
      loc.id.toLowerCase().includes(clean)
    );
  });
};

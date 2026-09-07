import {
  RiskZone,
  AlertItem,
  WorkflowAlert,
  MonthlyHistoryData,
  EmergencyFacility,
  LanguageOption
} from '../types';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'हिन्दी', native: 'हिन्दी' },
  { code: 'as', label: 'অসমীয়া', native: 'অসমীয়া' },
  { code: 'bn', label: 'বাংলা', native: 'বাংলা' },
  { code: 'mni', label: 'Meitei (Manipuri)', native: 'Meitei (Manipuri)' },
  { code: 'mizo', label: 'Mizo', native: 'Mizo' },
  { code: 'khasi', label: 'Khasi', native: 'Khasi' },
  { code: 'garo', label: 'Garo', native: 'Garo' },
  { code: 'nagamese', label: 'Nagamese', native: 'Nagamese' }
];

export const MOCK_ZONES: RiskZone[] = [
  {
    id: 'zone-04',
    name: 'Gangtok',
    state: 'Sikkim',
    subRegion: 'Gangtok & East Sikkim Corridor',
    riskLevel: 'Low',
    probability: 28,
    predictionWindow: 'Stable',
    rainfall24h: 15,
    soilMoisture: 49,
    temperature: 20,
    slopeAngle: 14.02,
    coordinates: { x: 16, y: 34, lat: 27.3389, lng: 88.6065 },
    activeWarning: 'Slope stability parameters in Gangtok remain within safe thresholds.',
    lastUpdated: 'Live Synced'
  },
  {
    id: 'zone-12',
    name: 'Tawang',
    state: 'Arunachal Pradesh',
    subRegion: 'Bhalukpong–Tawang Highway',
    riskLevel: 'High',
    probability: 78,
    predictionWindow: 'Next 24–48 Hours',
    rainfall24h: 88,
    soilMoisture: 76,
    temperature: 18,
    slopeAngle: 35,
    coordinates: { x: 62, y: 20, lat: 27.5861, lng: 91.8594 },
    activeWarning: 'Saturated soil mantle detected along mountain pass curves. Heavy commercial transit restricted.',
    lastUpdated: '25 mins ago'
  },
  {
    id: 'zone-07',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    subRegion: 'East Khasi Hills (Cherrapunji–Sohra)',
    riskLevel: 'Watch',
    probability: 54,
    predictionWindow: 'Next 48 Hours',
    rainfall24h: 62,
    soilMoisture: 65,
    temperature: 22,
    slopeAngle: 28,
    coordinates: { x: 35, y: 64, lat: 25.2986, lng: 91.7086 },
    activeWarning: 'Moderate seepage observed along cliff edges. Regular monitoring active by district disaster cell.',
    lastUpdated: '40 mins ago'
  },
  {
    id: 'zone-03',
    name: 'Kohima',
    state: 'Nagaland',
    subRegion: 'Kohima–Zubza Bypass (NH-29)',
    riskLevel: 'High',
    probability: 74,
    predictionWindow: 'Next 24–48 Hours',
    rainfall24h: 81,
    soilMoisture: 74,
    temperature: 20,
    slopeAngle: 34,
    coordinates: { x: 80, y: 48, lat: 25.6751, lng: 94.1086 },
    activeWarning: 'Minor slope subsidence detected on eastern shoulder. Precautionary barricades deployed.',
    lastUpdated: '15 mins ago'
  },
  {
    id: 'zone-01',
    name: 'Haflong',
    state: 'Assam',
    subRegion: 'Dima Hasao Hill Slopes',
    riskLevel: 'Low',
    probability: 22,
    predictionWindow: 'Stable',
    rainfall24h: 15,
    soilMoisture: 35,
    temperature: 28,
    slopeAngle: 18,
    coordinates: { x: 48, y: 46, lat: 25.1834, lng: 93.0248 },
    activeWarning: 'Slope stability normal. Regular sensor telemetry active with no anomalous movement.',
    lastUpdated: '50 mins ago'
  },
  {
    id: 'zone-05',
    name: 'Aizawl',
    state: 'Mizoram',
    subRegion: 'Aizawl West & Sairang Slopes',
    riskLevel: 'Low',
    probability: 18,
    predictionWindow: 'Stable',
    rainfall24h: 12,
    soilMoisture: 30,
    temperature: 26,
    slopeAngle: 22,
    coordinates: { x: 62, y: 84, lat: 23.7271, lng: 92.7176 },
    activeWarning: 'Normal drainage runoff with localized saturated pockets. Slopes stable.',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'zone-08',
    name: 'Noney',
    state: 'Manipur',
    subRegion: 'Noney & Tupul Valley Corridor',
    riskLevel: 'Low',
    probability: 25,
    predictionWindow: 'Stable',
    rainfall24h: 20,
    soilMoisture: 36,
    temperature: 25,
    slopeAngle: 24,
    coordinates: { x: 74, y: 68, lat: 24.817, lng: 93.702 },
    activeWarning: 'Conditions stable. Catchment sensors reporting nominal drainage.',
    lastUpdated: '2 hours ago'
  },
  {
    id: 'zone-06',
    name: 'Jampui Hills',
    state: 'Tripura',
    subRegion: 'Jampui Hills Foothills',
    riskLevel: 'Low',
    probability: 16,
    predictionWindow: 'Stable',
    rainfall24h: 10,
    soilMoisture: 28,
    temperature: 29,
    slopeAngle: 15,
    coordinates: { x: 38, y: 80, lat: 23.8315, lng: 91.2868 },
    activeWarning: 'All slopes nominal. Clear weather forecast across southern ridges.',
    lastUpdated: '2 hours ago'
  }
];

// Citizen default location (Sikkim, Gangtok as required by prompt)
export const CITIZEN_DEFAULT_DATA: RiskZone = {
  id: 'citizen-gangtok',
  name: 'Sikkim, Gangtok',
  state: 'Sikkim',
  subRegion: 'East Sikkim Urban & Suburban Slopes',
  riskLevel: 'High',
  probability: 78,
  predictionWindow: 'Next 24–48 Hours',
  rainfall24h: 92,
  soilMoisture: 81,
  temperature: 24,
  slopeAngle: 37,
  coordinates: { x: 18, y: 35, lat: 27.3389, lng: 88.6065 },
  activeWarning: 'High landslide probability detected near NH-10, Sikkim due to continuous rainfall over the last 36 hours. Saturated upper slope strata poses rockfall and mudflow danger.',
  lastUpdated: 'Just now'
};

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'alt-01',
    level: 'Emergency',
    title: 'CRITICAL LANDSLIDE ALERT',
    description: 'High landslide probability detected near NH-10, Sikkim. Rockfall and mudflow risk along Singtam-Dikchu belt.',
    location: 'Gangtok, Sikkim (NH-10 Corridor)',
    zoneId: 'zone-04',
    probability: 86,
    expectedTime: 'Next 12–24 hours',
    affectedRoad: 'National Highway 10 (KM 24 to 32)',
    timestamp: 'Today, 06:30 AM',
    actionRequired: 'Avoid non-essential travel. Evacuate vulnerable roadside hillside dwellings to Paljor Shelter Camp.'
  },
  {
    id: 'alt-02',
    level: 'Warning',
    title: 'HIGH SLOPE INSTABILITY WARNING',
    description: 'Excessive pore water pressure on steep cut-slopes along Bhalukpong to Tawang road.',
    location: 'Arunachal Pradesh, Tawang Route (Zone 12)',
    zoneId: 'zone-12',
    probability: 78,
    expectedTime: 'Next 24–48 hours',
    affectedRoad: 'Bhalukpong-Bomdila-Tawang Highway',
    timestamp: 'Today, 05:15 AM',
    actionRequired: 'Heavy vehicles diverted via alternate bypass. BRO earthmovers staged on standby.'
  },
  {
    id: 'alt-03',
    level: 'Warning',
    title: 'RAIL EMBANKMENT SEEPAGE ALERT',
    description: 'Continuous heavy rainfall in Dima Hasao hills creating rapid saturation of cuttings.',
    location: 'Assam, Dima Hasao (Zone 15)',
    zoneId: 'zone-15',
    probability: 69,
    expectedTime: 'Next 24–48 hours',
    affectedRoad: 'Haflong - Jatinga Hill Corridor',
    timestamp: 'Yesterday, 11:45 PM',
    actionRequired: 'Train speeds restricted to 20 kmph. Continuous visual monitoring by engineering patrol.'
  },
  {
    id: 'alt-04',
    level: 'Watch',
    title: 'SLOPE DEBRIS WATCH ADVISORY',
    description: 'Surface fissures noted after cloudburst spell near Cherrapunji escarpment.',
    location: 'Meghalaya, East Khasi Hills (Zone 07)',
    zoneId: 'zone-07',
    probability: 54,
    expectedTime: 'Next 48 hours',
    affectedRoad: 'Sohra-Shella Road',
    timestamp: 'Yesterday, 04:00 PM',
    actionRequired: 'District emergency helpline 1077 on active dispatch. Village council notified.'
  },
  {
    id: 'alt-05',
    level: 'Normal',
    title: 'ROUTINE MONITORING - STABLE CONDITIONS',
    description: 'All sensor nodes report normal soil moisture and zero creep velocity.',
    location: 'Manipur, Noney & Tupul Valley (Zone 02)',
    zoneId: 'zone-02',
    probability: 22,
    expectedTime: 'Next 5 Days',
    affectedRoad: 'Imphal-Jiribam Highway',
    timestamp: 'Today, 07:00 AM',
    actionRequired: 'Standard operational status. No protective measures needed currently.'
  }
];

export const MOCK_WORKFLOW_ALERTS: WorkflowAlert[] = [
  {
    id: 'wf-101',
    alertCode: 'NER-SKM-2026-041',
    zone: 'Gangtok, Sikkim (Singtam / NH-10)',
    state: 'Sikkim',
    riskScore: 91,
    hazardType: 'Rapid Debris Flow / Mudslip',
    currentStep: 'Acknowledged',
    assignedTeam: 'SDRF Unit 2, Gangtok Station',
    lastActionTime: '18 mins ago',
    notes: 'Soil displacement sensor SG-04 triggered 14mm sudden displacement. Evacuation advisory drafted.'
  },
  {
    id: 'wf-102',
    alertCode: 'NER-ARP-2026-018',
    zone: 'Arunachal Pradesh - Zone 12 (Sela Pass approach)',
    state: 'Arunachal Pradesh',
    riskScore: 78,
    hazardType: 'Rockfall & Scree Avalanche',
    currentStep: 'Response Team Assigned',
    assignedTeam: 'BRO Project Vartak Team Bravo',
    lastActionTime: '45 mins ago',
    notes: 'Heavy earthmoving equipment deployed near KM 68. Warning signage installed.'
  },
  {
    id: 'wf-103',
    alertCode: 'NER-ASM-2026-009',
    zone: 'Assam - Zone 15 (Haflong Cuttings)',
    state: 'Assam',
    riskScore: 69,
    hazardType: 'Embankment Slump',
    currentStep: 'Field Verification',
    assignedTeam: 'District Geotechnical Inspection Cell',
    lastActionTime: '1 hour ago',
    notes: 'Ground drone survey underway. Drainage ditch clearing initiated.'
  },
  {
    id: 'wf-104',
    alertCode: 'NER-NGL-2026-015',
    zone: 'Nagaland - Zone 03 (Zubza Slope)',
    state: 'Nagaland',
    riskScore: 74,
    hazardType: 'Tensional Ground Crack',
    currentStep: 'Action Taken',
    assignedTeam: 'NDRF 1st Bn & Traffic Police',
    lastActionTime: '2 hours ago',
    notes: 'Traffic restricted to one lane. Plastic tarpaulin sheet covering laid over fissure zone.'
  },
  {
    id: 'wf-105',
    alertCode: 'NER-MEG-2026-003',
    zone: 'Meghalaya - Zone 07 (Mawkdok Escarpment)',
    state: 'Meghalaya',
    riskScore: 42,
    hazardType: 'Minor Runoff Gullying',
    currentStep: 'Resolved',
    assignedTeam: 'PWD Roads & Bridges Sohra',
    lastActionTime: 'Yesterday',
    notes: 'Retaining wall inspection completed. Gully clear of debris. Normal traffic resumed.'
  }
];

export const HISTORY_STATS = {
  totalLandslides: 47,
  highRainfallEvents: 31,
  criticalAlerts: 12,
  roadBlockages: 8
};

export const MONTHLY_HISTORY_DATA: MonthlyHistoryData[] = [
  { month: 'Sep 25', rainfallMm: 310, landslideIncidents: 8, highRainfallDays: 6, criticalAlerts: 3 },
  { month: 'Oct 25', rainfallMm: 120, landslideIncidents: 2, highRainfallDays: 2, criticalAlerts: 0 },
  { month: 'Nov 25', rainfallMm: 45, landslideIncidents: 0, highRainfallDays: 0, criticalAlerts: 0 },
  { month: 'Dec 25', rainfallMm: 22, landslideIncidents: 0, highRainfallDays: 0, criticalAlerts: 0 },
  { month: 'Jan 26', rainfallMm: 30, landslideIncidents: 1, highRainfallDays: 0, criticalAlerts: 0 },
  { month: 'Feb 26', rainfallMm: 55, landslideIncidents: 1, highRainfallDays: 1, criticalAlerts: 0 },
  { month: 'Mar 26', rainfallMm: 95, landslideIncidents: 2, highRainfallDays: 2, criticalAlerts: 1 },
  { month: 'Apr 26', rainfallMm: 190, landslideIncidents: 4, highRainfallDays: 4, criticalAlerts: 1 },
  { month: 'May 26', rainfallMm: 380, landslideIncidents: 9, highRainfallDays: 8, criticalAlerts: 2 },
  { month: 'Jun 26', rainfallMm: 490, landslideIncidents: 11, highRainfallDays: 10, criticalAlerts: 4 },
  { month: 'Jul 26', rainfallMm: 420, landslideIncidents: 6, highRainfallDays: 9, criticalAlerts: 3 },
  { month: 'Aug 26', rainfallMm: 280, landslideIncidents: 3, highRainfallDays: 5, criticalAlerts: 1 }
];

export const EMERGENCY_FACILITIES: EmergencyFacility[] = [
  {
    name: 'Sir Thutob Namgyal Memorial (STNM) Hospital',
    type: 'Hospital',
    distanceKm: 2.4,
    contact: '+91 3592 202944 / 102',
    address: 'Sochyagang, Gangtok, Sikkim 737102',
    capacity: '24/7 Trauma Care & Emergency Beds Available',
    status: 'Operational'
  },
  {
    name: 'Paljor Indoor Community Relief Shelter',
    type: 'Shelter',
    distanceKm: 1.8,
    contact: '+91 3592 201123',
    address: 'Paljor Stadium Complex, Gangtok, Sikkim',
    capacity: 'Accommodates 450 persons with clean water & food supplies',
    status: 'Operational'
  },
  {
    name: 'SDRF & Fire Emergency Operations Center',
    type: 'Emergency Services',
    distanceKm: 3.2,
    contact: '+91 3592 202111 / 112',
    address: 'Control Room, Deorali, Gangtok, Sikkim',
    capacity: 'Heavy search & rescue crane, all-terrain rescue vehicles',
    status: 'Operational'
  },
  {
    name: 'Namchi District Relief Base',
    type: 'Relief Center',
    distanceKm: 9.6,
    contact: '+91 3595 254201',
    address: 'Community Center, Namchi, South Sikkim',
    capacity: 'Standby emergency shelter for 300 persons',
    status: 'Standby'
  }
];

// Pre-built test photos for the AI Landslide Risk Check Page
export interface SamplePhoto {
  id: string;
  name: string;
  type: 'terrain_slope' | 'road_fissure' | 'saturated_mud' | 'unrelated';
  description: string;
  imageUrl: string;
  isLandslideRelated: boolean;
  mockResult?: {
    location: string;
    landslideProbability: number;
    riskLevel: 'HIGH' | 'CRITICAL' | 'MODERATE' | 'LOW';
    predictionWindow: string;
    slope: string;
    saturation: string;
  };
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-1',
    name: 'Steep Wet Slope (Sikkim NH-10)',
    type: 'terrain_slope',
    description: 'Saturated cutting slope showing loose gravel, seepage tracks, and overhang.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    isLandslideRelated: true,
    mockResult: {
      location: 'Sikkim, Gangtok (NH-10 Sector)',
      landslideProbability: 78,
      riskLevel: 'HIGH',
      predictionWindow: 'Next 24–48 Hours',
      slope: '41° inclination',
      saturation: 'High water saturation detected'
    }
  },
  {
    id: 'sample-2',
    name: 'Road Surface Fissure (Hill Highway)',
    type: 'road_fissure',
    description: 'Longitudinal tensional ground cracks along mountain highway shoulder.',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    isLandslideRelated: true,
    mockResult: {
      location: 'Arunachal Pradesh, Tawang Route',
      landslideProbability: 84,
      riskLevel: 'HIGH',
      predictionWindow: 'Next 12–24 Hours',
      slope: '36° slope',
      saturation: 'Sub-surface shear line visible'
    }
  },
  {
    id: 'sample-3',
    name: 'Indoor Desk / Coffee Cup (Test Invalid)',
    type: 'unrelated',
    description: 'An indoor workplace photograph containing no terrain or geological features.',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    isLandslideRelated: false
  }
];

export interface ZoneData {
  id: string;
  name: string;
  state: string;
  subRegion: string;
  riskLevel: 'Low' | 'Watch' | 'Warning' | 'High' | 'Critical';
  probability: number;
  predictionWindow: string;
  rainfall24h: number;
  rainfall72h: number;
  soilMoisture: number;
  temperature: number;
  slopeAngle: number;
  elevation: number;
  lithology: string;
  porePressureKPa: number;
  coordinates: { x: number; y: number; lat: number; lng: number };
  activeWarning?: string;
  lastUpdated: string;
}

export interface IncidentReport {
  id: string;
  reporterName: string;
  contactNumber?: string;
  locationName: string;
  state: string;
  lat: number;
  lng: number;
  hazardType: 'Debris Flow' | 'Rockfall' | 'Road Washout' | 'Soil Creep' | 'Mudslide';
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  roadBlocked: boolean;
  blockedHighway?: string;
  description: string;
  timestamp: string;
  status: 'Reported' | 'Verified' | 'Response Dispatched' | 'Cleared';
}

export interface EmergencySosTicket {
  id: string;
  timestamp: string;
  callerName: string;
  phoneNumber: string;
  peopleCount: number;
  needEvacuation: boolean;
  hasInjuries: boolean;
  notes: string;
  lat: number;
  lng: number;
  district: string;
  state: string;
  status: 'Received' | 'Dispatched' | 'Rescued';
  assignedUnit: string;
}

export interface AlertRecord {
  id: string;
  level: 'Emergency' | 'Warning' | 'Watch';
  title: string;
  location: string;
  state: string;
  district: string;
  zoneId: string;
  probability: number;
  expectedTime: string;
  cause: string;
  message: string;
  rainfall: string;
  soilMoisture: string;
  slope: string;
  temperature: string;
  timestamp: string;
  recommendedAction: string;
  isCurrentArea: boolean;
  affectedRoad?: string;
  isRead: boolean;
  currentStep: string;
  assignedTeam?: string;
  fieldVerification: string;
  responseAction: string;
  isResolved: boolean;
  timeline: { step: string; timestamp: string; note: string }[];
}

export const INITIAL_ZONES: ZoneData[] = [
  {
    id: 'zone-04',
    name: 'Gangtok',
    state: 'Sikkim',
    subRegion: 'Gangtok & NH-10 Corridor',
    riskLevel: 'Low',
    probability: 28,
    predictionWindow: 'Stable',
    rainfall24h: 14.5,
    rainfall72h: 36,
    soilMoisture: 49,
    temperature: 20,
    slopeAngle: 14,
    elevation: 3021,
    lithology: 'Weathered Phyllite & Mica Schist',
    porePressureKPa: 14.2,
    coordinates: { x: 16, y: 34, lat: 27.3389, lng: 88.6065 },
    activeWarning: 'Routine automated telemetry: Normal slope stability and controlled precipitation.',
    lastUpdated: 'Just now'
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
    rainfall72h: 184,
    soilMoisture: 76,
    temperature: 18,
    slopeAngle: 35,
    elevation: 2100,
    lithology: 'Gneissic Bedrock with Fragile Overburden',
    porePressureKPa: 36.2,
    coordinates: { x: 62, y: 20, lat: 27.5861, lng: 91.8594 },
    activeWarning: 'Saturated soil mantle detected along mountain pass curves. Heavy commercial transit restricted.',
    lastUpdated: '15 mins ago'
  },
  {
    id: 'zone-07',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    subRegion: 'East Khasi Hills (Cherrapunji–Sohra)',
    riskLevel: 'Watch',
    probability: 44,
    predictionWindow: 'Next 48 Hours',
    rainfall24h: 52,
    rainfall72h: 110,
    soilMoisture: 63,
    temperature: 20,
    slopeAngle: 28,
    elevation: 1430,
    lithology: 'Karstic Sandstone & Limestone Escarpment',
    porePressureKPa: 22.8,
    coordinates: { x: 44, y: 64, lat: 25.2986, lng: 91.7322 },
    activeWarning: 'Water runoff elevated near canyon edges; structural integrity currently stable.',
    lastUpdated: '30 mins ago'
  },
  {
    id: 'zone-09',
    name: 'Aizawl',
    state: 'Mizoram',
    subRegion: 'Aizawl Slope Belts & NH-54',
    riskLevel: 'High',
    probability: 72,
    predictionWindow: 'Next 24–48 Hours',
    rainfall24h: 76,
    rainfall72h: 165,
    soilMoisture: 71,
    temperature: 22,
    slopeAngle: 33,
    elevation: 1132,
    lithology: 'Turbidite Sandstone & Friable Shale',
    porePressureKPa: 31.4,
    coordinates: { x: 55, y: 92, lat: 23.7271, lng: 92.7176 },
    activeWarning: 'Increased creep velocity on eastern settlement ridge. Civil defense advised to inspect retaining structures.',
    lastUpdated: '45 mins ago'
  },
  {
    id: 'zone-01',
    name: 'Haflong',
    state: 'Assam',
    subRegion: 'Dima Hasao (Haflong–Jatinga Valley)',
    riskLevel: 'Watch',
    probability: 39,
    predictionWindow: 'Stable',
    rainfall24h: 38,
    rainfall72h: 82,
    soilMoisture: 58,
    temperature: 26,
    slopeAngle: 24,
    elevation: 680,
    lithology: 'Disang Shales with Clay Infill',
    porePressureKPa: 18.5,
    coordinates: { x: 58, y: 55, lat: 25.1764, lng: 93.0238 },
    lastUpdated: '1 hour ago'
  },
  {
    id: 'zone-02',
    name: 'Kohima',
    state: 'Nagaland',
    subRegion: 'Kohima–Dimapur NH-29 Bypass',
    riskLevel: 'Watch',
    probability: 35,
    predictionWindow: 'Stable',
    rainfall24h: 34,
    rainfall72h: 75,
    soilMoisture: 54,
    temperature: 23,
    slopeAngle: 26,
    elevation: 1444,
    lithology: 'Barail Sandstone & Fractured Mudstone',
    porePressureKPa: 16.9,
    coordinates: { x: 78, y: 48, lat: 25.6751, lng: 94.1086 },
    lastUpdated: '1 hour ago'
  },
  {
    id: 'zone-03',
    name: 'Tamenglong',
    state: 'Manipur',
    subRegion: 'Tamenglong & NH-37 (Imphal–Jiribam)',
    riskLevel: 'Low',
    probability: 28,
    predictionWindow: 'Stable',
    rainfall24h: 22,
    rainfall72h: 48,
    soilMoisture: 46,
    temperature: 25,
    slopeAngle: 22,
    elevation: 1200,
    lithology: 'Sedimentary Siltstone & Clay Bed',
    porePressureKPa: 12.1,
    coordinates: { x: 74, y: 72, lat: 24.9868, lng: 93.4939 },
    lastUpdated: '2 hours ago'
  },
  {
    id: 'zone-08',
    name: 'Jampui Hills',
    state: 'Tripura',
    subRegion: 'Jampui Hills Ridge',
    riskLevel: 'Low',
    probability: 21,
    predictionWindow: 'Stable',
    rainfall24h: 18,
    rainfall72h: 40,
    soilMoisture: 42,
    temperature: 27,
    slopeAngle: 19,
    elevation: 750,
    lithology: 'Bhuban Formation Micaceous Sandstone',
    porePressureKPa: 9.8,
    coordinates: { x: 38, y: 84, lat: 23.8293, lng: 92.2687 },
    lastUpdated: '2 hours ago'
  }
];

export const INITIAL_ALERTS: AlertRecord[] = [
  {
    id: 'LS-2026-003',
    level: 'Warning',
    title: 'High Landslide Risk Advisory — Tawang Corridor',
    location: 'Zone 12, Arunachal Pradesh',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    zoneId: 'zone-12',
    probability: 78,
    expectedTime: 'Next 24–48 Hours',
    cause: 'Continuous heavy rainfall & elevated pore water pressure',
    message: 'Elevated slope instability detected. Heavy runoff across mountain passes. Exercise extreme caution.',
    rainfall: '68 mm / 24h',
    soilMoisture: '74%',
    slope: '32°',
    temperature: '21°C',
    timestamp: 'Today, 15:10',
    recommendedAction: 'Limit non-essential travel along hillside passes and keep emergency kits on standby.',
    isCurrentArea: false,
    affectedRoad: 'Bhalukpong-Bomdila-Tawang Highway',
    isRead: false,
    currentStep: 'Acknowledged',
    assignedTeam: 'Road & Infrastructure Team',
    fieldVerification: 'Verified',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 14:45', note: 'IMD Red rainfall threshold breached (68mm)' },
      { step: 'Authority Notified', timestamp: 'Today, 15:10', note: 'West Kameng DM office dispatched warning advisory' },
      { step: 'Acknowledged', timestamp: 'Today, 15:25', note: 'BRO Task Force acknowledged route caution' }
    ]
  },
  {
    id: 'LS-2026-002',
    level: 'Warning',
    title: 'Elevated Landslide Alert — NH-54 Corridor',
    location: 'Zone 09, Mizoram',
    state: 'Mizoram',
    district: 'Aizawl',
    zoneId: 'zone-09',
    probability: 72,
    expectedTime: 'Next 24–48 Hours',
    cause: 'Creep velocity acceleration on eastern residential ridges',
    message: 'Continuous monsoonal seepage into unconsolidated shale. Civil defense monitoring active cut-slopes.',
    rainfall: '76 mm / 24h',
    soilMoisture: '71%',
    slope: '33°',
    temperature: '22°C',
    timestamp: 'Today, 12:40',
    recommendedAction: 'Residents of Ramhlun and Bawngkawn eastern slopes should inspect retaining walls.',
    isCurrentArea: false,
    affectedRoad: 'Aizawl-Lunglei Road (NH-54)',
    isRead: false,
    currentStep: 'Team Assigned',
    assignedTeam: 'District Emergency Team',
    fieldVerification: 'Verified',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 12:00', note: 'Inclinometer sensor MZ-09 showed 8mm tilt' },
      { step: 'Authority Notified', timestamp: 'Today, 12:40', note: 'State Disaster Management Authority briefed' }
    ]
  },
  {
    id: 'LS-2026-005',
    level: 'Watch',
    title: 'Hill Cutting & Seepage Watch — Dima Hasao',
    location: 'Zone 15, Assam',
    state: 'Assam',
    district: 'Dima Hasao',
    zoneId: 'zone-15',
    probability: 58,
    expectedTime: 'Next 24–48 Hours',
    cause: 'Continuous precipitation creating rapid slope topsoil saturation',
    message: 'Rail cutting embankment seepage detected. Saturated strata prone to slumping along Haflong slopes.',
    rainfall: '55 mm / 24h',
    soilMoisture: '68%',
    slope: '28°',
    temperature: '26°C',
    timestamp: 'Today, 13:20',
    recommendedAction: 'Engineering patrols deployed along railway corridor. Maintain distance from steep cuttings.',
    isCurrentArea: false,
    affectedRoad: 'Haflong - Jatinga Hill Corridor',
    isRead: false,
    currentStep: 'Authority Notified',
    assignedTeam: 'District Emergency Team',
    fieldVerification: 'Pending',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 13:15', note: 'Soil pore pressure sensor triggered elevated watch' },
      { step: 'Authority Notified', timestamp: 'Today, 13:20', note: 'Forwarded to District Disaster Cell' }
    ]
  }
];

export const EMERGENCY_FACILITIES = [
  {
    name: 'Singtam District Hospital',
    type: 'Hospital',
    distanceKm: 3.2,
    contact: '+91 3592 231201',
    address: 'Hospital Road, Singtam, East Sikkim 737134',
    capacity: '120 beds, 24/7 Trauma Unit',
    status: 'Operational'
  },
  {
    name: 'SDRF 2nd Battalion Camp (Singtam)',
    type: 'Emergency Services',
    distanceKm: 4.8,
    contact: '1070 / +91 3592 201124',
    address: 'Bermiok Road, Singtam East Sikkim',
    capacity: 'Heavy earthmovers, 4 quick response teams',
    status: 'Operational'
  },
  {
    name: 'Paljor Stadium Relief Shelter',
    type: 'Shelter',
    distanceKm: 8.5,
    contact: '+91 3592 202723',
    address: 'Paljor Stadium Rd, Gangtok 737101',
    capacity: 'Capacity for 800 displaced persons',
    status: 'Standby'
  },
  {
    name: 'Bomdila Civil Hospital',
    type: 'Hospital',
    distanceKm: 12.0,
    contact: '+91 3782 222215',
    address: 'Main Town, Bomdila, West Kameng, Arunachal Pradesh',
    capacity: '75 beds, Emergency OT',
    status: 'Operational'
  },
  {
    name: 'NDRF 1st Bn Base Camp (Patgaon/Guwahati)',
    type: 'Emergency Services',
    distanceKm: 45.0,
    contact: '+91 361 2840284',
    address: 'Rani Road, Patgaon, Guwahati, Assam',
    capacity: 'Flood & Landslide Specialized Rescue Teams',
    status: 'Operational'
  }
];

// Active state storage
class DataStore {
  public zones: ZoneData[] = [...INITIAL_ZONES];
  public alerts: AlertRecord[] = [...INITIAL_ALERTS];
  public incidents: IncidentReport[] = [
    {
      id: 'INC-2026-081',
      reporterName: 'Pema Bhutia',
      contactNumber: '+91 98450 12345',
      locationName: 'NH-10 Mile 29 near Teesta River',
      state: 'Sikkim',
      lat: 27.2415,
      lng: 88.5123,
      hazardType: 'Debris Flow',
      severity: 'Severe',
      roadBlocked: true,
      blockedHighway: 'NH-10',
      description: 'Mud and boulders flowing across 40 meters of highway. Small vehicles stranded.',
      timestamp: 'Today, 17:15',
      status: 'Response Dispatched'
    },
    {
      id: 'INC-2026-082',
      reporterName: 'Tashi Norbu',
      contactNumber: '+91 94360 88712',
      locationName: 'Bhalukpong pass curve 14',
      state: 'Arunachal Pradesh',
      lat: 27.0215,
      lng: 92.6514,
      hazardType: 'Rockfall',
      severity: 'Moderate',
      roadBlocked: false,
      blockedHighway: 'Bhalukpong-Bomdila Rd',
      description: 'Small rock shards falling from upper cutting. One lane open.',
      timestamp: 'Today, 14:20',
      status: 'Verified'
    }
  ];
  public sosTickets: EmergencySosTicket[] = [];

  getZones() {
    return this.zones;
  }

  getZoneById(id: string) {
    return this.zones.find((z) => z.id === id);
  }

  getAlerts(filterState?: string, filterLevel?: string) {
    let list = this.alerts;
    if (filterState && filterState !== 'All') {
      list = list.filter((a) => a.state.toLowerCase() === filterState.toLowerCase());
    }
    if (filterLevel && filterLevel !== 'All') {
      list = list.filter((a) => a.level.toLowerCase() === filterLevel.toLowerCase());
    }
    return list;
  }

  setAlerts(alerts: AlertRecord[]) {
    this.alerts = alerts;
  }

  acknowledgeAlert(id: string, notes?: string) {
    return this.updateAlertStep(id, 'Acknowledged', undefined, notes || 'Alert acknowledged by duty monitoring officer.');
  }

  addAlert(alert: AlertRecord) {
    this.alerts.unshift(alert);
    return alert;
  }

  updateAlertStep(id: string, step: string, assignedTeam?: string, notes?: string) {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.currentStep = step;
    if (assignedTeam) alert.assignedTeam = assignedTeam;
    alert.timeline.push({
      step,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: notes || `Step updated to ${step}`
    });
    if (step === 'Resolved') {
      alert.isResolved = true;
    }
    return alert;
  }

  addIncident(incident: Omit<IncidentReport, 'id' | 'timestamp' | 'status'>): IncidentReport {
    const newIncident: IncidentReport = {
      ...incident,
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: 'Just now',
      status: 'Reported'
    };
    this.incidents.unshift(newIncident);
    return newIncident;
  }

  addSosTicket(ticket: Omit<EmergencySosTicket, 'id' | 'timestamp' | 'status' | 'assignedUnit'>): EmergencySosTicket {
    const newTicket: EmergencySosTicket = {
      ...ticket,
      id: `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Received',
      assignedUnit: 'SDRF Quick Response Unit 1'
    };
    this.sosTickets.unshift(newTicket);
    return newTicket;
  }
}

export const dataStore = new DataStore();

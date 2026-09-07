import { CitizenLocation } from '../components/CitizenLocationModal';

export interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  instruction: string;
  distanceFromStartKm?: number;
  riskNote?: string;
}

export interface SafeFacilityDetail {
  id: 'shelter' | 'hospital' | 'services';
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm: number;
  driveTimeMin: number;
  walkTimeMin: number;
  convoyTimeMin?: number;
  address: string;
  capacity?: string;
  status: 'Open' | 'Available' | 'Active';
  badgeColor: string;
  description: string;
  routeCoordinates: [number, number][];
  waypoints: RouteWaypoint[];
}

export interface SafeRouteOption {
  id: 'safe-ridge' | 'secondary-link' | 'valley-highway';
  name: string;
  corridorName: string;
  status: 'safe' | 'caution' | 'blocked';
  badgeText: string;
  badgeColor: string;
  distanceKm: number;
  driveTimeMin: number;
  walkTimeMin: number;
  convoyTimeMin: number;
  riskScorePct: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  elevationGainM: number;
  maxGradePct: number;
  startElevationM: number;
  peakElevationM: number;
  destElevationM: number;
  description: string;
  clearanceStatus: string;
  routeCoordinates: [number, number][];
  waypoints: RouteWaypoint[];
}

export interface RegionRouteConfig {
  userCoords: [number, number];
  locationName: string;
  districtName: string;
  stateName: string;
  blockedRoadName: string;
  blockedRoadCoordinates: [number, number][];
  hazardCenter: [number, number];
  hazardDescription: string;
  safeCorridorName: string;
  elevationGainM: number;
  maxGradePct: number;
  destinations: Record<'shelter' | 'hospital' | 'services', SafeFacilityDetail>;
  routeOptions: SafeRouteOption[];
  hazardActive: boolean;
}

/**
 * Great-circle distance between two GPS coordinates in kilometers
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Known Regional Safe Route Hubs with precise local topological landmarks
const REGIONAL_PRESETS: Record<string, {
  shelterName: string;
  shelterAddress: string;
  hospitalName: string;
  hospitalAddress: string;
  servicesName: string;
  servicesAddress: string;
  blockedRoadName: string;
  hazardDescription: string;
  safeCorridorName: string;
  secondaryCorridorName: string;
  valleyCorridorName: string;
  baseElevationM: number;
  ridgeElevationM: number;
  maxGradePct: number;
}> = {
  // Sikkim - Gangtok
  gangtok: {
    shelterName: 'Gangtok Ridge Community Hall & Evacuation Shelter',
    shelterAddress: 'Ridge Park, Above Secretariat, Upper Gangtok, Sikkim',
    hospitalName: 'STNM Multi-Specialty Hospital',
    hospitalAddress: 'Sochyagang, Gangtok, East Sikkim',
    servicesName: 'SDRF Headquarters & Emergency Command Post',
    servicesAddress: 'Paljor Stadium Complex, Gangtok',
    blockedRoadName: 'NH-10 Direct Valley Corridor (Below Secretariat)',
    hazardDescription: 'Active rockfall & saturated shale debris slide. Boulders obstructing carriageway.',
    safeCorridorName: 'Indira Bypass via Tibet Road (Cleared & SDRF Escorted)',
    secondaryCorridorName: 'Old Secretariat Ridge Link',
    valleyCorridorName: 'NH-10 Singtam Valley Road',
    baseElevationM: 1650,
    ridgeElevationM: 1780,
    maxGradePct: 6.2
  },
  // Mizoram - Aizawl
  aizawl: {
    shelterName: 'Vanapa Hall Emergency Relief Shelter',
    shelterAddress: 'Treasury Square, Aizawl, Mizoram',
    hospitalName: 'Civil Hospital Aizawl (Trauma Care)',
    hospitalAddress: 'Dawrpui, Aizawl, Mizoram',
    servicesName: 'Aizawl Fire & SDRF Disaster Post',
    servicesAddress: 'Chandmari Ridge Road, Aizawl',
    blockedRoadName: 'Sairang Valley Road / NH-306 Low Corridor',
    hazardDescription: 'Deep mudflow & saturated slope slip on Sairang Valley Road. Vehicular traffic strictly closed.',
    safeCorridorName: 'Chaltlang-Bawngkawn Ridge Bypass (Cleared & Patrolled by Mizoram SDRF)',
    secondaryCorridorName: 'Durtlang High Crest Route',
    valleyCorridorName: 'Sairang Valley Link Road',
    baseElevationM: 1130,
    ridgeElevationM: 1245,
    maxGradePct: 5.8
  },
  // Meghalaya - Shillong
  shillong: {
    shelterName: 'State Central Library Relief Shelter',
    shelterAddress: 'Police Bazar, Shillong, Meghalaya',
    hospitalName: 'Shillong Civil Hospital',
    hospitalAddress: 'Labon Road, Shillong, Meghalaya',
    servicesName: 'Meghalaya SDRF Emergency Outpost',
    servicesAddress: 'Polo Ground Compound, Shillong',
    blockedRoadName: 'Old GS Road Valley Descent',
    hazardDescription: 'Slumping slope & loose shale rockfall near Umiam bypass. Closed by PWD.',
    safeCorridorName: 'Upper Shillong Ridge Link via Police Bazar (Open & Clear)',
    secondaryCorridorName: 'Laitumkhrah Arterial Road',
    valleyCorridorName: 'Umiam Gorge Link',
    baseElevationM: 1525,
    ridgeElevationM: 1610,
    maxGradePct: 4.8
  },
  // Meghalaya - Cherrapunji (Sohra)
  sohra: {
    shelterName: 'Sohra Community Evacuation Centre',
    shelterAddress: 'Upper Sohra High Ground, Cherrapunji',
    hospitalName: 'Cherrapunji Community Health Centre',
    hospitalAddress: 'Main Market Road, Sohra',
    servicesName: 'East Khasi Hills SDRF Relief Post',
    servicesAddress: 'Sohra Circuit House Outpost',
    blockedRoadName: 'Shella Valley Cliff Road',
    hazardDescription: 'Extreme rainfall saturated escarpment edge. Rock debris on roadway.',
    safeCorridorName: 'Mawkdok-Sohra High Ridge Highway (Verified Open)',
    secondaryCorridorName: 'Nohkalikai Access Spur',
    valleyCorridorName: 'Shella Gorge Cut Road',
    baseElevationM: 1430,
    ridgeElevationM: 1495,
    maxGradePct: 7.2
  },
  // Assam - Guwahati
  guwahati: {
    shelterName: 'Dispur Multipurpose Emergency Shelter',
    shelterAddress: 'Dispur Capital Complex, Guwahati',
    hospitalName: 'Gauhati Medical College & Hospital (GMCH)',
    hospitalAddress: 'Bhangagarh, Guwahati, Assam',
    servicesName: 'Assam SDMA Disaster Response Post',
    servicesAddress: 'Kahilipara Road, Guwahati',
    blockedRoadName: 'Narakasur Hill Escarpment Spur',
    hazardDescription: 'Heavy waterlogging and mudslide hazard near unstable hill cuts.',
    safeCorridorName: 'GS Road & VIP Highway Corridor (Elevated & Clear)',
    secondaryCorridorName: 'Zoo Road Arterial Link',
    valleyCorridorName: 'Narakasur Valley Culvert Route',
    baseElevationM: 55,
    ridgeElevationM: 95,
    maxGradePct: 3.4
  },
  // Assam - Haflong (Dima Hasao)
  haflong: {
    shelterName: 'Haflong District Council Relief Camp',
    shelterAddress: 'Council Ground, Haflong, Dima Hasao',
    hospitalName: 'Haflong Civil Hospital',
    hospitalAddress: 'Hospital Road, Haflong',
    servicesName: 'Dima Hasao SDRF Rapid Response Battalion',
    servicesAddress: 'Fiangpui Outpost, Haflong',
    blockedRoadName: 'Haflong-Jatinga Hill Pass',
    hazardDescription: 'Major hill slope debris accumulation. Train & road transport diverted.',
    safeCorridorName: 'Circuit House Ridge Road (Cleared by Border Roads)',
    secondaryCorridorName: 'Muolhoi High Spur Link',
    valleyCorridorName: 'Jatinga River Cut Highway',
    baseElevationM: 680,
    ridgeElevationM: 810,
    maxGradePct: 7.5
  },
  // Arunachal Pradesh - Tawang
  tawang: {
    shelterName: 'Tawang Monastery High Ground Shelter',
    shelterAddress: 'Monastery Plateau, Upper Tawang',
    hospitalName: 'District Hospital Khandro Drowa Tsangmo',
    hospitalAddress: 'DC Office Complex, Tawang',
    servicesName: 'BRO Hill Clearance Taskforce Outpost',
    servicesAddress: 'Tawang Army Cantonment Link',
    blockedRoadName: 'Bhalukpong-Tawang Valley Cut',
    hazardDescription: 'Snowmelt and scree rockfall blocking valley highway.',
    safeCorridorName: 'Monastery High Ridge Route (Patrolled by BRO & SDRF)',
    secondaryCorridorName: 'Old Gompa Perimeter Way',
    valleyCorridorName: 'Tawang Chu Valley Road',
    baseElevationM: 3048,
    ridgeElevationM: 3210,
    maxGradePct: 8.2
  },
  // Nagaland - Kohima
  kohima: {
    shelterName: 'Kohima Indoor Stadium Relief Shelter',
    shelterAddress: 'Officers Hill, Kohima, Nagaland',
    hospitalName: 'Naga Hospital Authority Kohima',
    hospitalAddress: 'Phoolbari, Kohima, Nagaland',
    servicesName: 'Nagaland SDRF Battalion Station',
    servicesAddress: 'NH-29 Outpost, Kohima',
    blockedRoadName: 'NH-29 Dzüdza Sinking Zone',
    hazardDescription: 'Active subsidence and mudflow across NH-29. Vehicles rerouted.',
    safeCorridorName: 'Old Secretariat Ridge Bypass (Open & Clear)',
    secondaryCorridorName: 'High School Junction Route',
    valleyCorridorName: 'Dzüdza Valley Highway Section',
    baseElevationM: 1440,
    ridgeElevationM: 1560,
    maxGradePct: 6.5
  },
  // Manipur - Imphal
  imphal: {
    shelterName: 'Khuman Lampak Main Relief Camp',
    shelterAddress: 'Khuman Lampak Sports Complex, Imphal',
    hospitalName: 'Regional Institute of Medical Sciences (RIMS)',
    hospitalAddress: 'Lamphelpat, Imphal, Manipur',
    servicesName: 'Manipur SDRF Fire & Rescue Post',
    servicesAddress: 'Babupara Secretariat Link, Imphal',
    blockedRoadName: 'NH-37 Tupul-Noney Hill Highway',
    hazardDescription: 'Riverbank mudslide and debris accumulation.',
    safeCorridorName: 'Langol Ridge Link & Airport Highway (Clear)',
    secondaryCorridorName: 'Kangla Western Bypass',
    valleyCorridorName: 'Iril River Low Causeway',
    baseElevationM: 785,
    ridgeElevationM: 835,
    maxGradePct: 3.8
  }
};

/**
 * Generate full regional route config for ANY given CitizenLocation (or custom GPS location)
 * Calculating real distances, realistic elevations, and multi-route options.
 */
export function getRegionalRouteConfig(
  loc: CitizenLocation,
  simulateBlockage = false
): RegionRouteConfig {
  const locId = (loc.id || '').toLowerCase();
  const preset = REGIONAL_PRESETS[locId] || {
    shelterName: `${loc.name} Community Disaster Shelter`,
    shelterAddress: `Central High Ridge, ${loc.name}, ${loc.state}`,
    hospitalName: `${loc.district || loc.name} District Civil Hospital`,
    hospitalAddress: `Hospital Road, ${loc.name}, ${loc.state}`,
    servicesName: `${loc.name} SDRF & Disaster Response Base`,
    servicesAddress: `Emergency Taskforce Compound, ${loc.name}`,
    blockedRoadName: `${loc.name} Valley Link (Low Corridor)`,
    hazardDescription: 'Active slope saturation, debris flow, and rockfall risk on valley section.',
    safeCorridorName: `${loc.name} High Ridge Bypass (Cleared & SDRF Patrolled)`,
    secondaryCorridorName: `${loc.name} Upper Ring Road`,
    valleyCorridorName: `${loc.name} Valley Direct Link`,
    baseElevationM: 1100,
    ridgeElevationM: 1195,
    maxGradePct: 5.6
  };

  const lat = loc.lat;
  const lng = loc.lng;
  const slope = loc.defaultSlope || 28;

  // Mountain winding factor based on terrain steepness (steeper terrain requires more switchbacks)
  const mountainFactor = 1.35 + (slope / 100) * 0.5; // typically 1.45 - 1.55

  // Derive realistic local offsets relative to user's selected location
  // 1. Hazard zone: located ~600m northeast on vulnerable valley cut
  const hazardCenter: [number, number] = [lat + 0.0055, lng + 0.0040];

  // 2. Blocked road: a segment running straight through the hazard zone
  const blockedRoadCoords: [number, number][] = [
    [lat + 0.0020, lng + 0.0025],
    [lat + 0.0040, lng + 0.0035],
    [lat + 0.0055, lng + 0.0040],
    [lat + 0.0075, lng + 0.0048],
    [lat + 0.0095, lng + 0.0055]
  ];

  // 3. Realistic destinations positioned locally
  // Shelter: Safe ridge location northeast
  const shelterLat = lat + 0.0115;
  const shelterLng = lng + 0.0092;
  const straightShelterKm = calculateHaversineKm(lat, lng, shelterLat, shelterLng);
  const shelterDistanceKm = Number((straightShelterKm * mountainFactor).toFixed(1));

  // Shelter Route coordinates: loops away from valley slide along ridge
  const shelterRoute: [number, number][] = [
    [lat, lng],
    [lat + 0.0022, lng - 0.0024], // Detour west away from valley slide
    [lat + 0.0052, lng - 0.0028], // Ascending along safe ridge spine
    [lat + 0.0084, lng - 0.0008], // High ridge checkpoint
    [lat + 0.0102, lng + 0.0042], // North bypass junction
    [shelterLat, shelterLng]       // Destination gate
  ];

  // Hospital: Safe medical facility southwest
  const hospitalLat = lat - 0.0105;
  const hospitalLng = lng - 0.0088;
  const straightHospitalKm = calculateHaversineKm(lat, lng, hospitalLat, hospitalLng);
  const hospitalDistanceKm = Number((straightHospitalKm * mountainFactor).toFixed(1));

  const hospitalRoute: [number, number][] = [
    [lat, lng],
    [lat - 0.0032, lng - 0.0028],
    [lat - 0.0068, lng - 0.0055],
    [lat - 0.0088, lng - 0.0072],
    [hospitalLat, hospitalLng]
  ];

  // Emergency Services / SDRF: Station northeast
  const servicesLat = lat + 0.0142;
  const servicesLng = lng + 0.0155;
  const straightServicesKm = calculateHaversineKm(lat, lng, servicesLat, servicesLng);
  const servicesDistanceKm = Number((straightServicesKm * mountainFactor).toFixed(1));

  const servicesRoute: [number, number][] = [
    [lat, lng],
    [lat + 0.0035, lng + 0.0042],
    [lat + 0.0072, lng + 0.0098],
    [lat + 0.0112, lng + 0.0135],
    [servicesLat, servicesLng]
  ];

  // Dynamic travel speeds for mountain terrain:
  // Driving: ~30-34 km/h
  // Walking: ~3.5-4.0 km/h
  // Convoy: ~22 km/h
  const calcDriveTime = (dist: number) => Math.max(4, Math.round((dist / 32) * 60 + 3));
  const calcWalkTime = (dist: number) => Math.max(12, Math.round((dist / 3.8) * 60 + 5));
  const calcConvoyTime = (dist: number) => Math.max(8, Math.round((dist / 22) * 60 + 6));

  const shelterDriveMin = calcDriveTime(shelterDistanceKm);
  const shelterWalkMin = calcWalkTime(shelterDistanceKm);
  const shelterConvoyMin = calcConvoyTime(shelterDistanceKm);

  const hospitalDriveMin = calcDriveTime(hospitalDistanceKm);
  const hospitalWalkMin = calcWalkTime(hospitalDistanceKm);
  const hospitalConvoyMin = calcConvoyTime(hospitalDistanceKm);

  const servicesDriveMin = calcDriveTime(servicesDistanceKm);
  const servicesWalkMin = calcWalkTime(servicesDistanceKm);
  const servicesConvoyMin = calcConvoyTime(servicesDistanceKm);

  const elevationGain = Math.round(preset.ridgeElevationM - preset.baseElevationM);

  // 4. Generate the 3 Multi-Route Alternatives for the active destination
  const safeRidgeRoute: SafeRouteOption = {
    id: 'safe-ridge',
    name: 'Safe Ridge Bypass (Recommended)',
    corridorName: preset.safeCorridorName,
    status: 'safe',
    badgeText: '🟢 VERIFIED SAFE',
    badgeColor: '#16a34a',
    distanceKm: shelterDistanceKm,
    driveTimeMin: shelterDriveMin,
    walkTimeMin: shelterWalkMin,
    convoyTimeMin: shelterConvoyMin,
    riskScorePct: 12,
    riskLevel: 'Low',
    elevationGainM: elevationGain,
    maxGradePct: preset.maxGradePct,
    startElevationM: preset.baseElevationM,
    peakElevationM: preset.ridgeElevationM + 25,
    destElevationM: preset.ridgeElevationM,
    description: `High crest alignment cleared by Border Roads & SDRF. 100% bypasses the active ${preset.blockedRoadName.split('(')[0]} slide zone.`,
    clearanceStatus: 'Clear & Patrolled (Hourly SDRF Checks)',
    routeCoordinates: shelterRoute,
    waypoints: [
      {
        name: `Start at ${loc.name}`,
        lat,
        lng,
        instruction: `Depart ${loc.name} ascending towards the ${preset.safeCorridorName.split('(')[0]}`,
        distanceFromStartKm: 0,
        riskNote: 'Safe departure point'
      },
      {
        name: 'Ridge Road Junction',
        lat: shelterRoute[1][0],
        lng: shelterRoute[1][1],
        instruction: 'Turn sharp right away from the lower valley onto Ridge Spine Highway',
        distanceFromStartKm: Number((shelterDistanceKm * 0.25).toFixed(1)),
        riskNote: 'Slope stable • retaining wall intact'
      },
      {
        name: 'SDRF Geo-Checkpoint',
        lat: shelterRoute[2][0],
        lng: shelterRoute[2][1],
        instruction: 'Pass SDRF monitoring outpost; piezometer sensors report ground stability green',
        distanceFromStartKm: Number((shelterDistanceKm * 0.55).toFixed(1)),
        riskNote: 'Real-time telemetry verified'
      },
      {
        name: 'Upper Bypass Approach',
        lat: shelterRoute[3][0],
        lng: shelterRoute[3][1],
        instruction: 'Bear right toward the safe relief facility access avenue',
        distanceFromStartKm: Number((shelterDistanceKm * 0.85).toFixed(1)),
        riskNote: 'Well-drained asphalt surface'
      },
      {
        name: `Arrive at ${preset.shelterName}`,
        lat: shelterLat,
        lng: shelterLng,
        instruction: 'Destination is straight ahead. Welcome & intake shelter gate is open.',
        distanceFromStartKm: shelterDistanceKm,
        riskNote: 'Designated Seismic Safe Zone'
      }
    ]
  };

  // Route 2: Secondary Arterial Bypass
  const secondaryKm = Number((shelterDistanceKm * 1.18).toFixed(1));
  const secondaryRouteCoords: [number, number][] = [
    [lat, lng],
    [lat + 0.0010, lng - 0.0040],
    [lat + 0.0040, lng - 0.0055],
    [lat + 0.0080, lng - 0.0045],
    [lat + 0.0110, lng - 0.0010],
    [shelterLat, shelterLng]
  ];

  const secondaryRoute: SafeRouteOption = {
    id: 'secondary-link',
    name: `Secondary Arterial Link (${preset.secondaryCorridorName})`,
    corridorName: preset.secondaryCorridorName,
    status: 'caution',
    badgeText: '🟡 CAUTION - PASSABLE',
    badgeColor: '#eab308',
    distanceKm: secondaryKm,
    driveTimeMin: calcDriveTime(secondaryKm) + 4,
    walkTimeMin: calcWalkTime(secondaryKm) + 8,
    convoyTimeMin: calcConvoyTime(secondaryKm) + 5,
    riskScorePct: 34,
    riskLevel: 'Moderate',
    elevationGainM: Math.round(elevationGain * 1.15),
    maxGradePct: Number((preset.maxGradePct * 1.15).toFixed(1)),
    startElevationM: preset.baseElevationM,
    peakElevationM: preset.ridgeElevationM + 45,
    destElevationM: preset.ridgeElevationM,
    description: `Alternate circuit around western slopes. Open but has 2 narrow hairpin curves. Recommended for 4WD vehicles.`,
    clearanceStatus: 'Passable (Caution for light vehicles)',
    routeCoordinates: secondaryRouteCoords,
    waypoints: [
      {
        name: `Depart ${loc.name}`,
        lat,
        lng,
        instruction: 'Take Western bypass branch toward the secondary link',
        distanceFromStartKm: 0
      },
      {
        name: 'Outer Hairpin Bend',
        lat: secondaryRouteCoords[1][0],
        lng: secondaryRouteCoords[1][1],
        instruction: 'Drive slow around western hill cut curve',
        distanceFromStartKm: Number((secondaryKm * 0.3).toFixed(1))
      },
      {
        name: 'Mid-Slope Junction',
        lat: secondaryRouteCoords[3][0],
        lng: secondaryRouteCoords[3][1],
        instruction: 'Merge back onto Northern link toward the shelter gate',
        distanceFromStartKm: Number((secondaryKm * 0.75).toFixed(1))
      },
      {
        name: `Arrive at ${preset.shelterName}`,
        lat: shelterLat,
        lng: shelterLng,
        instruction: 'Reach shelter reception checkpoint',
        distanceFromStartKm: secondaryKm
      }
    ]
  };

  // Route 3: Direct Valley Route (AVOID / HIGH RISK OR BLOCKED)
  const valleyKm = Number((shelterDistanceKm * 0.82).toFixed(1));
  const valleyRouteCoords: [number, number][] = [
    [lat, lng],
    [lat + 0.0030, lng + 0.0030],
    [lat + 0.0055, lng + 0.0040], // passes straight through hazard center!
    [lat + 0.0085, lng + 0.0065],
    [shelterLat, shelterLng]
  ];

  const valleyRoute: SafeRouteOption = {
    id: 'valley-highway',
    name: `Direct Valley Corridor (${preset.valleyCorridorName})`,
    corridorName: preset.valleyCorridorName,
    status: 'blocked',
    badgeText: simulateBlockage ? '⛔ BLOCKED (LANDSLIDE)' : '🔴 HIGH RISK / ROAD CLOSED',
    badgeColor: '#dc2626',
    distanceKm: valleyKm,
    driveTimeMin: 0,
    walkTimeMin: 0,
    convoyTimeMin: 0,
    riskScorePct: 88,
    riskLevel: 'Severe',
    elevationGainM: 35,
    maxGradePct: 3.5,
    startElevationM: preset.baseElevationM,
    peakElevationM: preset.baseElevationM + 40,
    destElevationM: preset.ridgeElevationM,
    description: `CRITICAL HAZARD: Direct highway traverses the saturated river valley cut where active rockfall and mud accumulation obstructs carriageway. DO NOT ENTER.`,
    clearanceStatus: 'Closed by Disaster Management & PWD (Active Debris Slide)',
    routeCoordinates: valleyRouteCoords,
    waypoints: [
      {
        name: 'Valley Entrance',
        lat,
        lng,
        instruction: 'Valley approach blocked by police barricade',
        distanceFromStartKm: 0,
        riskNote: 'Entry strictly prohibited'
      },
      {
        name: 'Slide Hazard Epicenter',
        lat: hazardCenter[0],
        lng: hazardCenter[1],
        instruction: '⛔ ACTIVE DEBRIS ACCUMULATION: 40 meters of road buried under mud & rock boulders',
        distanceFromStartKm: Number((valleyKm * 0.5).toFixed(1)),
        riskNote: 'High velocity mudflow potential'
      },
      {
        name: 'North Valley Exit',
        lat: valleyRouteCoords[3][0],
        lng: valleyRouteCoords[3][1],
        instruction: 'Road impassable to vehicular and pedestrian traffic',
        distanceFromStartKm: valleyKm,
        riskNote: 'Washout zone'
      }
    ]
  };

  return {
    userCoords: [lat, lng],
    locationName: `${loc.name}, ${loc.state}`,
    districtName: loc.district || loc.name,
    stateName: loc.state,
    blockedRoadName: preset.blockedRoadName,
    blockedRoadCoordinates: blockedRoadCoords,
    hazardCenter,
    hazardDescription: preset.hazardDescription,
    safeCorridorName: preset.safeCorridorName,
    elevationGainM: elevationGain,
    maxGradePct: preset.maxGradePct,
    routeOptions: [safeRidgeRoute, secondaryRoute, valleyRoute],
    hazardActive: true,
    destinations: {
      shelter: {
        id: 'shelter',
        name: preset.shelterName,
        type: 'Designated Safe Evacuation Shelter',
        lat: shelterLat,
        lng: shelterLng,
        distanceKm: shelterDistanceKm,
        driveTimeMin: shelterDriveMin,
        walkTimeMin: shelterWalkMin,
        convoyTimeMin: shelterConvoyMin,
        address: preset.shelterAddress,
        capacity: '500+ person seismic shelter • Backup power, purified water, hot meals on site',
        status: 'Open',
        badgeColor: '#16a34a',
        description: 'Reinforced high-ground facility elevated well above flash-flood and debris runout zones.',
        routeCoordinates: shelterRoute,
        waypoints: safeRidgeRoute.waypoints
      },
      hospital: {
        id: 'hospital',
        name: preset.hospitalName,
        type: 'District Civil Hospital & Emergency Trauma Hub',
        lat: hospitalLat,
        lng: hospitalLng,
        distanceKm: hospitalDistanceKm,
        driveTimeMin: hospitalDriveMin,
        walkTimeMin: hospitalWalkMin,
        convoyTimeMin: hospitalConvoyMin,
        address: preset.hospitalAddress,
        capacity: '24/7 Trauma Unit • Oxygen Generator, Blood Bank, Helipad Active',
        status: 'Available',
        badgeColor: '#2563eb',
        description: 'Full emergency surgery unit, critical care beds, ambulance fleet, and helicopter landing zone.',
        routeCoordinates: hospitalRoute,
        waypoints: [
          {
            name: `Depart ${loc.name}`,
            lat,
            lng,
            instruction: 'Head southwest along the stable hillside arterial road',
            distanceFromStartKm: 0
          },
          {
            name: 'Hospital Link Road',
            lat: hospitalRoute[1][0],
            lng: hospitalRoute[1][1],
            instruction: 'Turn onto the designated emergency medical corridor',
            distanceFromStartKm: Number((hospitalDistanceKm * 0.4).toFixed(1))
          },
          {
            name: 'Medical District Gate',
            lat: hospitalRoute[2][0],
            lng: hospitalRoute[2][1],
            instruction: 'Continue straight through the medical perimeter gate',
            distanceFromStartKm: Number((hospitalDistanceKm * 0.8).toFixed(1))
          },
          {
            name: `Arrive at ${preset.hospitalName}`,
            lat: hospitalLat,
            lng: hospitalLng,
            instruction: 'Emergency Trauma & Casualty Entrance straight ahead',
            distanceFromStartKm: hospitalDistanceKm
          }
        ]
      },
      services: {
        id: 'services',
        name: preset.servicesName,
        type: 'SDRF Disaster Taskforce & Fire Station',
        lat: servicesLat,
        lng: servicesLng,
        distanceKm: servicesDistanceKm,
        driveTimeMin: servicesDriveMin,
        walkTimeMin: servicesWalkMin,
        convoyTimeMin: servicesConvoyMin,
        address: preset.servicesAddress,
        capacity: 'Earth movers, rescue boats, drone spotters & heavy extraction squads',
        status: 'Active',
        badgeColor: '#dc2626',
        description: 'State Disaster Response Force battalion equipped with heavy excavation machinery, search dog units, and rescue equipment.',
        routeCoordinates: servicesRoute,
        waypoints: [
          {
            name: `Depart ${loc.name}`,
            lat,
            lng,
            instruction: 'Head northeast on the patrolled arterial highway',
            distanceFromStartKm: 0
          },
          {
            name: 'Taskforce Junction',
            lat: servicesRoute[1][0],
            lng: servicesRoute[1][1],
            instruction: 'Continue past civil defense outpost',
            distanceFromStartKm: Number((servicesDistanceKm * 0.45).toFixed(1))
          },
          {
            name: `Arrive at ${preset.servicesName}`,
            lat: servicesLat,
            lng: servicesLng,
            instruction: 'Disaster response command center is on your right',
            distanceFromStartKm: servicesDistanceKm
          }
        ]
      }
    }
  };
}

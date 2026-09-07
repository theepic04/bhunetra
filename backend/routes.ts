import { Router, Request, Response } from 'express';
import { dataStore, AlertRecord, IncidentReport, EMERGENCY_FACILITIES } from './dataStore';
import {
  calculateLandslideRisk,
  PredictionInput,
  queryMlPredict,
  queryMlEnrichLocation,
  queryMlPredictArea,
  ExternalZoneFeatures
} from '../ml_model';
import { getLiveWeather, getLiveSensorMeshTelemetry } from './weatherService';
import { analyzeTerrainImage } from './gemini';

const router = Router();

// 1. Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BhuNetra Landslide Early Warning Backend',
    mlService: 'https://bhunetr.onrender.com',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. ML External Service: Single Prediction (POST /api/ml/predict)
router.post('/ml/predict', async (req: Request, res: Response) => {
  try {
    const features: ExternalZoneFeatures = req.body || {};
    const result = await queryMlPredict(features);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'ML prediction failed' });
  }
});

// 3. ML External Service: Terrain Information Enrichment (POST /api/ml/enrich-location)
router.post('/ml/enrich-location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body || {};
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'latitude and longitude are required' });
    }
    const result = await queryMlEnrichLocation(Number(latitude), Number(longitude));
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Location enrichment failed' });
  }
});

// 4. ML External Service: Area / Grid Prediction for Heatmap (POST /api/ml/predict-area)
router.post('/ml/predict-area', async (req: Request, res: Response) => {
  try {
    const { zone_id, center_lat, center_lng, grid_radius, spacing_deg } = req.body || {};
    if (!center_lat || !center_lng) {
      return res.status(400).json({ success: false, error: 'center_lat and center_lng are required' });
    }
    const result = await queryMlPredictArea({
      zone_id: zone_id || 'zone-ner',
      center_lat: Number(center_lat),
      center_lng: Number(center_lng),
      grid_radius: grid_radius ? Number(grid_radius) : 1,
      spacing_deg: spacing_deg ? Number(spacing_deg) : 0.05
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Area prediction failed' });
  }
});

// 5. Live Doppler Radar & Piezometer IoT Sensor Mesh Feeds (GET /api/telemetry/live)
router.get('/telemetry/live', (req: Request, res: Response) => {
  try {
    const telemetry = getLiveSensorMeshTelemetry();
    res.json({
      success: true,
      data: telemetry
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch live telemetry' });
  }
});

// 6. Live Atmospheric / Doppler Weather Telemetry (POST /api/weather/live)
router.post('/weather/live', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body || {};
    const lat = Number(latitude ?? 27.3389);
    const lng = Number(longitude ?? 88.6065);
    const weather = await getLiveWeather(lat, lng);
    res.json({
      success: true,
      data: weather
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch live weather' });
  }
});

// 6a. Geolocation & Reverse Geocoding Lookup (GET /api/geolocation/lookup)
router.get('/geolocation/lookup', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;

    // 1. If explicit coordinates are provided, reverse-geocode them
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      try {
        const resp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (resp.ok) {
          const json: any = await resp.json();
          const city = json.city || json.locality || '';
          const district =
            json.localityInfo?.administrative?.find(
              (a: any) => a.adminLevel === 6 || a.adminLevel === 5 || a.adminLevel === 4
            )?.name ||
            json.locality ||
            city;
          const state = json.principalSubdivision || '';
          const country = json.countryName || 'India';

          return res.json({
            success: true,
            source: 'reverse_geocode',
            data: {
              latitude: lat,
              longitude: lng,
              city: city || district,
              district,
              state,
              country
            }
          });
        }
      } catch (revErr) {
        // Continue to fallback
      }
    }

    // 2. IP Geolocation detection fallback
    let ipData: any = null;

    try {
      const resp = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', {
        signal: AbortSignal.timeout(4000)
      });
      if (resp.ok) {
        const json: any = await resp.json();
        if (json.latitude && json.longitude) {
          ipData = {
            latitude: json.latitude,
            longitude: json.longitude,
            city: json.city || json.locality || '',
            district:
              json.localityInfo?.administrative?.find(
                (a: any) => a.adminLevel === 6 || a.adminLevel === 5 || a.adminLevel === 4
              )?.name ||
              json.locality ||
              json.city,
            state: json.principalSubdivision || '',
            country: json.countryName || 'India'
          };
        }
      }
    } catch (ipErr) {
      // Continue to secondary provider
    }

    if (!ipData) {
      try {
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        const ipUrl = clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1'
          ? `http://ip-api.com/json/${clientIp}`
          : 'http://ip-api.com/json/';
        const resp2 = await fetch(ipUrl, { signal: AbortSignal.timeout(3500) });
        if (resp2.ok) {
          const j2: any = await resp2.json();
          if (j2.status === 'success') {
            ipData = {
              latitude: j2.lat,
              longitude: j2.lon,
              city: j2.city || '',
              district: j2.city || '',
              state: j2.regionName || '',
              country: j2.country || 'India'
            };
          }
        }
      } catch (ipErr2) {
        // Fall through
      }
    }

    if (ipData) {
      return res.json({
        success: true,
        source: 'ip',
        data: ipData
      });
    }

    // Default regional reference: Gangtok, East Sikkim
    return res.json({
      success: true,
      source: 'default',
      data: {
        latitude: 27.3389,
        longitude: 88.6065,
        city: 'Gangtok',
        district: 'East Sikkim',
        state: 'Sikkim',
        country: 'India'
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Geolocation lookup failed'
    });
  }
});

// 6b. Live Map Locations Synchronized with IMD Weather (GET /api/map/live-locations)
const NER_BASE_LOCATIONS = [
  {
    id: 'zone-04',
    name: 'Gangtok',
    state: 'Sikkim',
    district: 'East Sikkim',
    subRegion: 'Gangtok & East Sikkim Corridor',
    defaultSlope: 14.02,
    elevation: 3021,
    coordinates: { lat: 27.3389, lng: 88.6065 },
    affectedInfrastructure: ['NH-10 Highway Corridor', 'Singtam Bailey Bridge', 'Dikchu Valley Route'],
    monitoringStation: 'GSI Automatic Inclinometer Node SK-04',
    responseTeamAssigned: 'NDRF 2nd Bn Team A',
    nearestDoppler: 'IMD Gangtok AWS / S-Band Radar Link'
  },
  {
    id: 'zone-12',
    name: 'Tawang',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    subRegion: 'Bhalukpong–Tawang Mountain Corridor',
    defaultSlope: 35,
    elevation: 2150,
    coordinates: { lat: 27.5861, lng: 91.8594 },
    affectedInfrastructure: ['Bhalukpong-Bomdila-Tawang Highway', 'Sela Tunnel Approach Road'],
    monitoringStation: 'BRO Seismogeotechnical Unit AR-12',
    responseTeamAssigned: 'BRO Earthmover Quick Response',
    nearestDoppler: 'IMD Guwahati S-Band Doppler Radar'
  },
  {
    id: 'zone-03',
    name: 'Kohima',
    state: 'Nagaland',
    district: 'Kohima',
    subRegion: 'Kohima–Zubza Bypass (NH-29)',
    defaultSlope: 34,
    elevation: 1440,
    coordinates: { lat: 25.6751, lng: 94.1086 },
    affectedInfrastructure: ['NH-29 Zubza Valley Section', 'Kohima Transit Bypass Bridge'],
    monitoringStation: 'NSDMA Piezometer Telemetry NL-03',
    responseTeamAssigned: 'State Disaster Response Force NL-1',
    nearestDoppler: 'IMD Guwahati S-Band Doppler Radar'
  },
  {
    id: 'zone-07',
    name: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    subRegion: 'Cherrapunji–Sohra Cliff Slopes',
    defaultSlope: 28,
    elevation: 1430,
    coordinates: { lat: 25.2986, lng: 91.7086 },
    affectedInfrastructure: ['Sohra-Shella Hill Route', 'Wah Kaba Viewing Culvert'],
    monitoringStation: 'Meghalaya SDMA Weather Doppler ML-07',
    responseTeamAssigned: 'Meghalaya SDRF Sohra Division',
    nearestDoppler: 'Meghalaya SDMA Cherrapunji Micro-Doppler'
  },
  {
    id: 'zone-01',
    name: 'Haflong',
    state: 'Assam',
    district: 'Dima Hasao',
    subRegion: 'Dima Hasao Hill Slopes (Haflong–Jatinga)',
    defaultSlope: 26,
    elevation: 680,
    coordinates: { lat: 25.1834, lng: 93.0248 },
    affectedInfrastructure: ['Lumding-Badarpur Hill Railway Line', 'Haflong Bypass KM 14'],
    monitoringStation: 'N.F. Railway Hill Sensor AS-01',
    responseTeamAssigned: 'Assam SDRF Silchar Bn',
    nearestDoppler: 'IMD Guwahati S-Band Doppler Radar'
  },
  {
    id: 'zone-05',
    name: 'Aizawl',
    state: 'Mizoram',
    district: 'Aizawl',
    subRegion: 'Aizawl West & Sairang Slopes',
    defaultSlope: 25,
    elevation: 1130,
    coordinates: { lat: 23.7271, lng: 92.7176 },
    affectedInfrastructure: ['Aizawl-Lengpui Airport Road', 'Sairang Railway Link'],
    monitoringStation: 'Mizoram Disaster Management Station MZ-05',
    responseTeamAssigned: 'Mizoram Fire & Emergency Quick Cell',
    nearestDoppler: 'IMD Agartala C-Band Doppler Radar'
  },
  {
    id: 'zone-08',
    name: 'Noney',
    state: 'Manipur',
    district: 'Noney',
    subRegion: 'Noney & Tupul Valley Corridor',
    defaultSlope: 29,
    elevation: 920,
    coordinates: { lat: 24.817, lng: 93.702 },
    affectedInfrastructure: ['Jiribam-Imphal Railway Project Site', 'NH-37 Tupul Cut-Slope'],
    monitoringStation: 'Manipur Geohazard Unit MN-08',
    responseTeamAssigned: 'Manipur SDRF Imphal Unit',
    nearestDoppler: 'IMD Agartala C-Band Doppler Radar'
  },
  {
    id: 'zone-06',
    name: 'Jampui Hills',
    state: 'Tripura',
    district: 'North Tripura',
    subRegion: 'Jampui Hills Foothills & Ridges',
    defaultSlope: 20,
    elevation: 640,
    coordinates: { lat: 23.8315, lng: 91.2868 },
    affectedInfrastructure: ['NH-8 Southern Link', 'Jampui Ridge Access Route'],
    monitoringStation: 'Tripura SDMA Ridge Sensor TR-06',
    responseTeamAssigned: 'Tripura Civil Defence Kanchanpur',
    nearestDoppler: 'IMD Agartala C-Band Doppler Radar'
  }
];

router.get('/map/live-locations', async (req: Request, res: Response) => {
  try {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const liveLocations = await Promise.all(
      NER_BASE_LOCATIONS.map(async (loc) => {
        try {
          const [weather, dem] = await Promise.all([
            getLiveWeather(loc.coordinates.lat, loc.coordinates.lng),
            queryMlEnrichLocation(loc.coordinates.lat, loc.coordinates.lng).catch(() => null)
          ]);

          const slope = dem?.slope_deg != null ? Number(dem.slope_deg.toFixed(1)) : loc.defaultSlope;
          const elevation = dem?.elevation_m != null ? Math.round(dem.elevation_m) : loc.elevation;

          const geo = calculateLandslideRisk({
            rainfall24h: weather.rainfall24hSumMm,
            rainfall72h: weather.rainfall72hEstMm,
            slopeAngle: slope,
            soilMoisture: weather.soilMoisturePct,
            elevation: elevation,
            locationName: loc.name,
            state: loc.state
          });

          let status = 'Nominal Stability';
          if (geo.riskLevel === 'Critical') status = 'Critical Alert Active';
          else if (geo.riskLevel === 'High') status = 'High Instability Warning';
          else if (geo.riskLevel === 'Watch') status = 'Active Field Monitoring';

          let activeWarning: string | undefined = undefined;
          if (geo.riskLevel === 'Critical' || geo.riskLevel === 'High') {
            activeWarning = geo.whyRiskHigh[0] || `${weather.weatherDescription}: Heavy precipitation exceeding regional stability threshold.`;
          } else if (geo.riskLevel === 'Watch') {
            activeWarning = `${weather.weatherDescription}: Moderate seepage observed along slope toes.`;
          }

          return {
            id: loc.id,
            name: loc.name,
            state: loc.state,
            district: loc.district,
            subRegion: loc.subRegion,
            riskLevel: geo.riskLevel === 'Warning' ? 'High' : geo.riskLevel,
            probability: geo.probability,
            rainfall24h: weather.rainfall24hSumMm,
            rainfallCurrentMm: weather.rainfallCurrentMm,
            soilMoisture: weather.soilMoisturePct,
            temperature: weather.temperatureC,
            humidityPct: weather.humidityPct,
            weatherDescription: weather.weatherDescription,
            slopeAngle: slope,
            elevation: elevation,
            factorOfSafety: geo.factorOfSafety,
            hazardScore: geo.hazardScore,
            predictionWindow: geo.predictionWindow,
            status,
            activeWarning,
            lastUpdated: `Just now • IMD Sync ${timestampStr}`,
            coordinates: loc.coordinates,
            isAuthorityAlert: geo.riskLevel === 'Critical' || geo.riskLevel === 'High',
            affectedInfrastructure: loc.affectedInfrastructure,
            monitoringStation: loc.monitoringStation,
            responseTeamAssigned: loc.responseTeamAssigned,
            nearestDoppler: loc.nearestDoppler,
            isLiveSynced: true
          };
        } catch {
          // Fallback to baseline
          return {
            ...loc,
            riskLevel: 'Watch' as const,
            probability: 50,
            rainfall24h: 45,
            rainfallCurrentMm: 1.5,
            soilMoisture: 60,
            temperature: 22,
            humidityPct: 80,
            weatherDescription: 'Monsoon Clouds',
            slopeAngle: loc.defaultSlope,
            factorOfSafety: 1.2,
            hazardScore: 50,
            predictionWindow: 'Next 24–48 Hours',
            status: 'Active Field Monitoring',
            lastUpdated: `Sync fallback • ${timestampStr}`,
            isAuthorityAlert: false,
            isLiveSynced: false
          };
        }
      })
    );

    res.json({
      success: true,
      data: liveLocations,
      syncedAt: new Date().toISOString(),
      source: 'IMD Automated Weather Stations & Doppler Radar Telemetry'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to sync map locations' });
  }
});

// 6c. Dynamic Point Enrichment (POST /api/map/enrich-point & /api/locations/enrich-point)
const handleEnrichPoint = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, name, district, state, slopeAngle, elevation } = req.body || {};
    const lat = Number(latitude ?? 27.3389);
    const lng = Number(longitude ?? 88.6065);

    // Fetch live weather
    const weather = await getLiveWeather(lat, lng);

    // Fetch DEM terrain enrichment if slope or elevation are missing
    let slope = slopeAngle !== undefined ? Number(slopeAngle) : 30;
    let elev = elevation !== undefined ? Number(elevation) : 1500;

    if (slopeAngle === undefined || elevation === undefined) {
      try {
        const dem = await queryMlEnrichLocation(lat, lng);
        if (dem) {
          if (slopeAngle === undefined) slope = Math.round(dem.slope_deg);
          if (elevation === undefined) elev = Math.round(dem.elevation_m);
        }
      } catch (err: any) {
        console.log('[Enrich Point] DEM lookup notice:', err.message);
      }
    }

    const geo = calculateLandslideRisk({
      rainfall24h: weather.rainfall24hSumMm,
      rainfall72h: weather.rainfall72hEstMm,
      slopeAngle: slope,
      soilMoisture: weather.soilMoisturePct,
      elevation: elev,
      locationName: name || 'Custom GPS Coordinate',
      state: state || 'North Eastern Region'
    });

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let status = 'Nominal Stability';
    if (geo.riskLevel === 'Critical') status = 'Critical Alert Active';
    else if (geo.riskLevel === 'High') status = 'High Instability Warning';
    else if (geo.riskLevel === 'Watch') status = 'Active Field Monitoring';

    const enrichedLocation = {
      id: `custom-gps-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: name || `Detected Coordinates (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
      state: state || 'NER',
      district: district || 'GPS Fix Sector',
      subRegion: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      riskLevel: geo.riskLevel === 'Warning' ? 'High' : geo.riskLevel,
      probability: geo.probability,
      rainfall24h: weather.rainfall24hSumMm,
      rainfallCurrentMm: weather.rainfallCurrentMm,
      soilMoisture: weather.soilMoisturePct,
      temperature: weather.temperatureC,
      humidityPct: weather.humidityPct,
      weatherDescription: weather.weatherDescription,
      slopeAngle: slope,
      elevation: elev,
      factorOfSafety: geo.factorOfSafety,
      hazardScore: geo.hazardScore,
      predictionWindow: geo.predictionWindow,
      status,
      activeWarning: geo.whyRiskHigh[0] || undefined,
      lastUpdated: `Live GPS • IMD Sync ${timestampStr}`,
      coordinates: { lat, lng },
      isAuthorityAlert: geo.riskLevel === 'Critical' || geo.riskLevel === 'High',
      affectedInfrastructure: ['Local Access Road / Footpath', 'Drainage Runoff Culvert'],
      monitoringStation: 'GPS Dynamic Sensor Virtual Node',
      responseTeamAssigned: 'Regional Disaster Response Unit',
      nearestDoppler: 'Regional IMD Doppler Radar Station',
      isLiveSynced: true
    };

    res.json({
      success: true,
      data: enrichedLocation
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Point enrichment failed' });
  }
};

router.post('/map/enrich-point', handleEnrichPoint);
router.post('/locations/enrich-point', handleEnrichPoint);

// 5. Combined Geotechnical + ML Landslide Hazard Prediction API
// Accepts: rainfall24h, rainfall72h, slopeAngle, soilMoisture, elevation, lithology, distanceToDrainage, latitude, longitude, zoneId
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const body: PredictionInput & { latitude?: number; longitude?: number; zoneId?: string } = req.body || {};
    const geotechnical = calculateLandslideRisk(body);

    // Call ML model asynchronously
    let mlPrediction: any = null;
    try {
      mlPrediction = await queryMlPredict({
        zone_id: body.zoneId || 'zone-ner',
        slope_deg: body.slopeAngle,
        elevation_m: body.elevation,
        latitude: body.latitude,
        longitude: body.longitude,
        historical_incidents_5yr: 2,
        rainfall_24h_mm: body.rainfall24h,
        rainfall_72h_mm: body.rainfall72h,
        soil_moisture_pct: body.soilMoisture,
        distance_to_stream_m: body.distanceToDrainage
      });
    } catch {
      // Handled gracefully inside queryMlPredict
    }

    res.json({
      success: true,
      data: {
        ...geotechnical,
        mlModel: mlPrediction,
        riskScoreMl: mlPrediction?.risk_score_0_100,
        mlFactors: mlPrediction?.top_contributing_factors
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Prediction failed' });
  }
});

// 3. AI Multimodal Terrain Slope Image Analysis
router.post('/analyze-terrain', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, locationName, slopeEstimated, rainfallCurrent } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required imageBase64 field'
      });
    }

    const analysis = await analyzeTerrainImage({
      imageBase64,
      mimeType,
      locationName,
      slopeEstimated: slopeEstimated ? Number(slopeEstimated) : undefined,
      rainfallCurrent: rainfallCurrent ? Number(rainfallCurrent) : undefined
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Image analysis failed' });
  }
});

// 4. Regional Risk Zones API (All NER States)
router.get('/zones', (req: Request, res: Response) => {
  const zones = dataStore.getZones();
  res.json({
    success: true,
    total: zones.length,
    data: zones
  });
});

// 5. Single Zone Detail with Live Telemetry
router.get('/zones/:id', (req: Request, res: Response) => {
  const zone = dataStore.getZoneById(req.params.id);
  if (!zone) {
    return res.status(404).json({ success: false, error: 'Zone not found' });
  }

  // Generate dynamic live sensor telemetry based on the zone
  const now = new Date();
  const telemetry = {
    zoneId: zone.id,
    zoneName: zone.name,
    timestamp: now.toISOString(),
    sensors: [
      {
        id: `PZ-${zone.id.toUpperCase()}-01`,
        type: 'Vibrating Wire Piezometer',
        reading: `${zone.porePressureKPa.toFixed(1)} kPa`,
        status: zone.porePressureKPa > 35 ? 'Critical High' : 'Normal',
        depth: '12.5 meters'
      },
      {
        id: `RG-${zone.id.toUpperCase()}-02`,
        type: 'Tipping Bucket Rain Gauge',
        reading: `${zone.rainfall24h} mm (24h)`,
        status: zone.rainfall24h > 60 ? 'Warning' : 'Normal',
        intensity: `${(zone.rainfall24h / 12).toFixed(1)} mm/hr`
      },
      {
        id: `TM-${zone.id.toUpperCase()}-03`,
        type: 'Biaxial Inclinometer',
        reading: `${zone.slopeAngle}° (${zone.probability > 70 ? '+1.4° tilt last 6h' : '0.1° stable'})`,
        status: zone.probability > 70 ? 'Active Creep' : 'Stable'
      },
      {
        id: `SM-${zone.id.toUpperCase()}-04`,
        type: 'TDR Soil Moisture Sensor',
        reading: `${zone.soilMoisture}% Saturation`,
        status: zone.soilMoisture > 75 ? 'Saturated' : 'Permeable'
      }
    ]
  };

  res.json({
    success: true,
    data: {
      ...zone,
      telemetry
    }
  });
});

// 6. Early Warning Alerts API with Live IMD & Topography Synchronization
let lastAlertsSyncTime = 0;
let cachedLiveAlerts: AlertRecord[] = [];

async function syncLiveAlertsFromTelemetry(forceRefresh = false): Promise<AlertRecord[]> {
  const now = Date.now();
  if (!forceRefresh && now - lastAlertsSyncTime < 45000 && cachedLiveAlerts.length > 0) {
    return cachedLiveAlerts;
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentAlerts = dataStore.getAlerts();
  const customOrResolved = currentAlerts.filter((a) => a.id.startsWith('LS-BROADCAST-') || a.isResolved);

  const syncedList: AlertRecord[] = [];

  for (const loc of NER_BASE_LOCATIONS) {
    try {
      const [weather, dem] = await Promise.all([
        getLiveWeather(loc.coordinates.lat, loc.coordinates.lng).catch(() => null),
        queryMlEnrichLocation(loc.coordinates.lat, loc.coordinates.lng).catch(() => null)
      ]);

      const rainfall = weather?.rainfall24hSumMm ?? (loc.id === 'zone-04' ? 14.5 : 35);
      const soilMoisture = weather?.soilMoisturePct ?? (loc.id === 'zone-04' ? 49 : 60);
      const slope = dem?.slope_deg != null ? Number(dem.slope_deg.toFixed(1)) : loc.defaultSlope;
      const elevation = dem?.elevation_m != null ? Math.round(dem.elevation_m) : loc.elevation;
      const temperature = weather?.temperatureC != null ? `${weather.temperatureC.toFixed(1)}°C` : '21°C';

      const risk = calculateLandslideRisk({
        rainfall24h: rainfall,
        rainfall72h: rainfall * 2.2,
        slopeAngle: slope,
        soilMoisture: soilMoisture,
        elevation: elevation,
        locationName: loc.name,
        state: loc.state
      });

      const existing = currentAlerts.find((a) => a.zoneId === loc.id && !a.isResolved);
      const isElevatedRisk = risk.probability >= 40 || risk.riskLevel === 'Critical' || risk.riskLevel === 'High' || risk.riskLevel === 'Watch';

      // Rule: Do NOT generate alerts for nominal / stable slopes (risk < 40%).
      // Only trigger alerts when conditions reach Watch (>=40%), Warning (>=60%), or Emergency (>=80%).
      if (!isElevatedRisk) {
        // If an active alert previously existed for this zone, auto-resolve it as conditions are now safe
        if (existing) {
          const resolvedRecord: AlertRecord = {
            ...existing,
            isResolved: true,
            currentStep: 'Resolved',
            fieldVerification: 'Verified',
            responseAction: 'No Action',
            recommendedAction: `Slope conditions returned to stable equilibrium (${risk.probability}% risk, FoS ${risk.factorOfSafety.toFixed(2)}). All clear.`,
            timeline: [
              ...existing.timeline,
              {
                step: 'Resolved',
                timestamp: timeStr,
                note: `Slope stabilized below 40% threshold. Threat successfully cleared.`
              }
            ]
          };
          syncedList.push(resolvedRecord);
        }
        continue;
      }

      let level: AlertRecord['level'] = 'Watch';
      let title = `Landslide Watch — Monitored Weather Disturbance`;
      let expectedTime = 'Next 24–48 Hours';
      let recommendedAction = `Monitor regional weather broadcasts. Check drainage clear paths around hillside residences.`;
      let cause = `Continuous rain spell (${rainfall} mm/24h) over ${loc.state} hill corridor with ${soilMoisture}% moisture.`;

      if (risk.probability >= 80 || risk.riskLevel === 'Critical') {
        level = 'Emergency';
        title = `CRITICAL Landslide Risk Active — Immediate Precaution Required`;
        expectedTime = 'Next 6–12 Hours';
        recommendedAction = `Immediate precautionary evacuation or road diversion recommended along ${loc.affectedInfrastructure[0]}. Avoid steep cut-slopes.`;
        cause = `Severe cumulative rainfall (${rainfall} mm/24h) and high soil saturation (${soilMoisture}%) on ${slope}° slope.`;
      } else if (risk.probability >= 60 || risk.riskLevel === 'High') {
        level = 'Warning';
        title = `Elevated Landslide Advisory — High Slope Risk`;
        expectedTime = 'Next 12–24 Hours';
        recommendedAction = `Limit non-essential night travel along ${loc.affectedInfrastructure[0]}. Watch for water seepage or rock shards.`;
        cause = `Substantial rainfall (${rainfall} mm/24h) on ${slope}° incline triggering elevated pore pressure.`;
      }

      const alertRecord: AlertRecord = {
        id: existing ? existing.id : `LS-2026-${loc.id.replace('zone-', '')}`,
        level,
        title,
        location: loc.name,
        state: loc.state,
        district: loc.district,
        zoneId: loc.id,
        probability: risk.probability,
        expectedTime,
        cause,
        message: `Automated IMD multi-hazard telemetry reports ${rainfall} mm 24h precipitation, ${soilMoisture}% soil saturation, and factor of safety ${risk.factorOfSafety.toFixed(2)}.`,
        rainfall: `${rainfall} mm / 24h`,
        soilMoisture: `${soilMoisture}%`,
        slope: `${slope}°`,
        temperature,
        timestamp: `Today, ${timeStr}`,
        recommendedAction,
        isCurrentArea: loc.id === 'zone-04',
        affectedRoad: loc.affectedInfrastructure[0] || 'Hill Highway',
        isRead: existing ? existing.isRead : false,
        currentStep: existing ? existing.currentStep : (level === 'Emergency' ? 'Authority Notified' : 'Alert Generated'),
        assignedTeam: existing?.assignedTeam || loc.responseTeamAssigned,
        fieldVerification: existing?.fieldVerification || 'Pending',
        responseAction: existing?.responseAction || (level === 'Emergency' ? 'Evacuation' : 'Monitoring'),
        isResolved: false,
        timeline: existing?.timeline || [
          {
            step: 'Alert Generated',
            timestamp: timeStr,
            note: `Elevated hazard detected: ${risk.probability}% probability, ${rainfall}mm rain, ${slope}° slope.`
          },
          {
            step: 'Authority Notified',
            timestamp: timeStr,
            note: `Telemetry advisory logged to ${loc.state} SDMA & Central Geohazard Network.`
          }
        ]
      };

      syncedList.push(alertRecord);
    } catch (e) {
      console.warn(`Error generating alert for ${loc.name}:`, e);
    }
  }

  // Re-attach custom and resolved alerts
  for (const extra of customOrResolved) {
    if (!syncedList.some((a) => a.id === extra.id)) {
      syncedList.push(extra);
    }
  }

  // Ensure historical resolved records exist for history logs
  const sampleResolved: AlertRecord[] = [
    {
      id: 'LS-2026-H01',
      level: 'Warning',
      title: 'Tensional Ground Crack Resolved',
      location: 'Zone 03, Nagaland',
      state: 'Nagaland',
      district: 'Kohima',
      zoneId: 'zone-03',
      probability: 65,
      expectedTime: 'Past Event',
      cause: 'Heavy rains induced surface tensile fractures along Zubza bypass',
      message: 'Tensional ground cracks stabilized with tarpaulin covering and drainage channels restored.',
      rainfall: '72 mm / 24h',
      soilMoisture: '71%',
      slope: '31°',
      temperature: '23°C',
      timestamp: '03 Sep 2026, 14:00',
      recommendedAction: 'Area inspected by geotechnical team. Traffic reopened with speed restriction.',
      isCurrentArea: false,
      affectedRoad: 'Dimapur-Kohima Highway (NH-29)',
      isRead: true,
      currentStep: 'Resolved',
      assignedTeam: 'Road & Infrastructure Team',
      fieldVerification: 'Verified',
      responseAction: 'Road Closure',
      isResolved: true,
      timeline: [
        { step: 'Alert Generated', timestamp: '03 Sep, 14:00', note: 'Displacement detected' },
        { step: 'Resolved', timestamp: '03 Sep, 17:30', note: 'Retaining work and drainage cleared' }
      ]
    },
    {
      id: 'LS-2026-H02',
      level: 'Watch',
      title: 'Saturated Sump Runoff Cleared',
      location: 'Zone 05, Mizoram',
      state: 'Mizoram',
      district: 'Aizawl',
      zoneId: 'zone-05',
      probability: 52,
      expectedTime: 'Past Event',
      cause: 'Drainage blockage during intense precipitation',
      message: 'Culvert cleared by emergency municipal squad. Slope stability nominal.',
      rainfall: '58 mm / 24h',
      soilMoisture: '64%',
      slope: '28°',
      temperature: '24°C',
      timestamp: '01 Sep 2026, 10:30',
      recommendedAction: 'All clear. Normal vehicular flow resumed.',
      isCurrentArea: false,
      affectedRoad: 'Aizawl West Hill Corridor',
      isRead: true,
      currentStep: 'Resolved',
      assignedTeam: 'District Emergency Team',
      fieldVerification: 'Verified',
      responseAction: 'No Action',
      isResolved: true,
      timeline: [
        { step: 'Alert Generated', timestamp: '01 Sep, 10:30', note: 'Runoff alert' },
        { step: 'Resolved', timestamp: '01 Sep, 16:00', note: 'Resolved by District Engineer' }
      ]
    }
  ];

  for (const hist of sampleResolved) {
    if (!syncedList.some((a) => a.id === hist.id)) {
      syncedList.push(hist);
    }
  }

  dataStore.setAlerts(syncedList);
  cachedLiveAlerts = syncedList;
  lastAlertsSyncTime = now;
  return syncedList;
}

router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const forceSync = req.query.sync === 'true';
    await syncLiveAlertsFromTelemetry(forceSync);

    const state = req.query.state as string;
    const level = req.query.level as string;
    const alerts = dataStore.getAlerts(state, level);

    res.json({
      success: true,
      count: alerts.length,
      lastSyncedAt: new Date(lastAlertsSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      data: alerts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, data: dataStore.getAlerts() });
  }
});

// Force refresh / sync with live IMD weather
router.post('/alerts/refresh', async (req: Request, res: Response) => {
  try {
    const synced = await syncLiveAlertsFromTelemetry(true);
    res.json({
      success: true,
      message: 'Early warning alerts refreshed with live IMD Doppler and DEM topography data.',
      count: synced.length,
      lastSyncedAt: new Date(lastAlertsSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      data: synced
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Acknowledge alert endpoint
router.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const { notes } = req.body || {};
  const updated = dataStore.acknowledgeAlert(req.params.id, notes);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  res.json({ success: true, data: updated });
});

// 7. Broadcast New Authority Alert
router.post('/alerts/broadcast', (req: Request, res: Response) => {
  try {
    const {
      title,
      level,
      location,
      state,
      district,
      zoneId,
      probability,
      expectedTime,
      cause,
      message,
      recommendedAction,
      affectedRoad,
      broadcastChannels
    } = req.body;

    const newAlert: AlertRecord = {
      id: `LS-BROADCAST-${Math.floor(100 + Math.random() * 900)}`,
      level: level || 'Warning',
      title: title || 'Landslide Advisory',
      location: location || 'North East Region',
      state: state || 'Sikkim',
      district: district || 'East Sikkim',
      zoneId: zoneId || 'zone-04',
      probability: probability || 75,
      expectedTime: expectedTime || 'Next 24 Hours',
      cause: cause || 'Heavy Rainfall and Unstable Slope',
      message: message || 'Precautionary advisory issued.',
      rainfall: '85 mm / 24h',
      soilMoisture: '78%',
      slope: '34°',
      temperature: '22°C',
      timestamp: 'Just now',
      recommendedAction: recommendedAction || 'Exercise caution on mountain roads.',
      isCurrentArea: true,
      affectedRoad: affectedRoad || 'State Highway',
      isRead: false,
      currentStep: 'Alert Generated',
      fieldVerification: 'Pending',
      responseAction: 'Monitoring',
      isResolved: false,
      timeline: [
        {
          step: 'Alert Generated',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Broadcasted to channels: ${(broadcastChannels || ['Public Portal', 'CAP SMS']).join(', ')}`
        }
      ]
    };

    dataStore.addAlert(newAlert);
    cachedLiveAlerts.unshift(newAlert);

    res.json({
      success: true,
      message: 'Alert successfully generated and broadcasted across NER emergency network.',
      data: newAlert
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7.2 Simulate Cloudburst Spike (Testing real-time dynamic trigger)
router.post('/alerts/simulate-spike', (req: Request, res: Response) => {
  try {
    const locations = [
      { loc: 'Mangan-Chungthang Highway, North Sikkim', state: 'Sikkim', zoneId: 'zone-04', slope: '44°', rain: '148 mm / 24h', soil: '92%' },
      { loc: 'Sela Pass Ridge, Tawang Sector', state: 'Arunachal Pradesh', zoneId: 'zone-01', slope: '48°', rain: '162 mm / 24h', soil: '94%' },
      { loc: 'Dzükou Valley Ascent, Kohima', state: 'Nagaland', zoneId: 'zone-06', slope: '39°', rain: '128 mm / 24h', soil: '87%' },
      { loc: 'Cherrapunji-Shella Escarpment', state: 'Meghalaya', zoneId: 'zone-02', slope: '42°', rain: '185 mm / 24h', soil: '96%' }
    ];
    const pick = locations[Math.floor(Math.random() * locations.length)];
    const id = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert: any = {
      id,
      level: 'Emergency',
      title: `Critical Landslide Trigger: Heavy Debris Flow at ${pick.loc.split(',')[0]}`,
      location: pick.loc,
      state: pick.state,
      zoneId: pick.zoneId,
      probability: Math.floor(88 + Math.random() * 10),
      expectedTime: 'Immediate (Next 1–3 Hours)',
      cause: `Cloudburst event detected by Doppler radar (${pick.rain}); pore-water pressure exceeds shear failure threshold.`,
      message: `Extreme slope instability detected at ${pick.loc}. Immediate vehicle stoppage and shelter-in-place advisory active.`,
      rainfall: pick.rain,
      soilMoisture: pick.soil,
      slope: pick.slope,
      temperature: '18°C',
      timestamp: 'Just now',
      recommendedAction: 'Immediate halt of all traffic. Do not attempt crossing mountain culverts. Evacuate roadside structures.',
      affectedRoad: pick.loc.includes('Highway') ? 'NH-10 Sector' : 'Strategic Border Highway',
      isRead: false,
      isCurrentArea: pick.state === 'Sikkim',
      currentStep: 'Alert Generated',
      assignedTeam: null,
      fieldVerification: 'Unverified',
      responseAction: 'No Action',
      isResolved: false,
      timeline: [
        {
          step: 'Alert Generated',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Dynamic telemetry spike: Doppler automated threshold breach triggered CAP Emergency.'
        }
      ]
    };
    dataStore.addAlert(newAlert);
    cachedLiveAlerts.unshift(newAlert);
    res.json({
      success: true,
      message: `Simulated cloudburst spike injected for ${pick.loc}. Real-time alert generated.`,
      data: newAlert,
      allAlerts: cachedLiveAlerts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Update Alert Workflow Step (Authority response workflow)
router.put('/alerts/:id/workflow', (req: Request, res: Response) => {
  const { step, assignedTeam, notes } = req.body;
  const updated = dataStore.updateAlertStep(req.params.id, step, assignedTeam, notes);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  // Also update cached live alerts if present
  const cachedIdx = cachedLiveAlerts.findIndex((a) => a.id === req.params.id);
  if (cachedIdx >= 0) {
    cachedLiveAlerts[cachedIdx] = updated;
  }
  res.json({
    success: true,
    data: updated
  });
});

// 9. Emergency SOS Dispatch API
router.post('/emergency/sos', (req: Request, res: Response) => {
  try {
    const { callerName, phoneNumber, peopleCount, needEvacuation, hasInjuries, notes, lat, lng, district, state } = req.body;

    const ticket = dataStore.addSosTicket({
      callerName: callerName || 'Anonymous Citizen',
      phoneNumber: phoneNumber || 'Emergency Direct Line',
      peopleCount: peopleCount || 1,
      needEvacuation: needEvacuation ?? true,
      hasInjuries: hasInjuries ?? false,
      notes: notes || 'Landslide distress signal received via mobile portal.',
      lat: lat || 27.3389,
      lng: lng || 88.6065,
      district: district || 'East Sikkim',
      state: state || 'Sikkim'
    });

    res.json({
      success: true,
      message: 'SOS distress signal received. SDRF / District Control Room notified.',
      ticketId: ticket.id,
      data: ticket,
      emergencyHotlines: [
        { label: 'Sikkim SDMA Control Room', number: '1070' },
        { label: 'NDRF Control Room', number: '011-24363260' },
        { label: 'National Disaster Helpline', number: '1078' }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Emergency Facilities Directory
router.get('/emergency/facilities', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: EMERGENCY_FACILITIES
  });
});

// 11. Citizen Incident Reporting API
router.get('/incidents', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dataStore.incidents
  });
});

router.post('/incidents', (req: Request, res: Response) => {
  try {
    const {
      reporterName,
      contactNumber,
      locationName,
      state,
      lat,
      lng,
      hazardType,
      severity,
      roadBlocked,
      blockedHighway,
      description
    } = req.body;

    const incident = dataStore.addIncident({
      reporterName: reporterName || 'Concerned Citizen',
      contactNumber,
      locationName: locationName || 'Hill Road Section',
      state: state || 'Sikkim',
      lat: lat || 27.3389,
      lng: lng || 88.6065,
      hazardType: hazardType || 'Debris Flow',
      severity: severity || 'Moderate',
      roadBlocked: Boolean(roadBlocked),
      blockedHighway,
      description: description || 'Visual landslide debris on roadway.'
    });

    res.json({
      success: true,
      message: 'Incident reported successfully. Local control room alerted for verification.',
      data: incident
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Safe Evacuation Route Engine
router.post('/routes/safe-path', (req: Request, res: Response) => {
  const { from, to, transportMode } = req.body;

  // Real-time hazard detours around blocked corridors (e.g. NH-10 near 29th Mile)
  const isNh10Route = (from && from.toLowerCase().includes('gangtok')) || (to && to.toLowerCase().includes('siliguri'));

  res.json({
    success: true,
    route: {
      origin: from || 'Gangtok, Sikkim',
      destination: to || 'Siliguri, West Bengal',
      transportMode: transportMode || 'SUV / 4WD Recommended',
      distanceKm: isNh10Route ? 138 : 95,
      estimatedTime: isNh10Route ? '4 hrs 45 mins (via Lava-Algarah detour)' : '3 hrs 15 mins',
      overallSafetyStatus: isNh10Route ? 'Caution - Active Detour' : 'Safe',
      hazardWarningsEnRoute: isNh10Route
        ? [
            {
              location: 'NH-10 Mile 29 to Singtam',
              hazard: 'Severe Debris Flow & Road Washout',
              action: 'Route Closed by BRO. Automated bypass redirected via Rorathang - Reshi - Lava.'
            }
          ]
        : [],
      steps: [
        {
          stepNumber: 1,
          instruction: 'Depart from starting point following East Sikkim bypass road.',
          status: 'safe',
          distance: '14.2 km'
        },
        {
          stepNumber: 2,
          instruction: isNh10Route
            ? 'Avoid NH-10 Singtam turnoff. Take alternate diversion towards Pakyong and Rorathang.'
            : 'Proceed along marked arterial corridor with standard caution.',
          status: isNh10Route ? 'caution' : 'safe',
          distance: '32.0 km'
        },
        {
          stepNumber: 3,
          instruction: 'Proceed downhill along stable ridge alignment with active SDRF safety checkpoint.',
          status: 'safe',
          distance: '48.5 km'
        },
        {
          stepNumber: 4,
          instruction: 'Arrive at destination emergency shelter / safe hub.',
          status: 'safe',
          distance: 'Destination'
        }
      ]
    }
  });
});

export default router;

export interface PredictionInput {
  rainfall24h: number; // mm
  rainfall72h?: number; // mm
  slopeAngle: number; // degrees (e.g. 15 to 60)
  soilMoisture: number; // percentage 0-100
  elevation?: number; // meters (e.g. 500 to 3500)
  lithology?: string; // e.g. 'Shale', 'Sandstone', 'Schist', 'Gneiss', 'Clay'
  distanceToDrainage?: number; // meters (e.g. 20 to 1000)
  locationName?: string;
  state?: string;
}

export interface FactorContribution {
  name: string;
  weightPercent: number;
  status: 'Critical' | 'Warning' | 'Moderate' | 'Safe';
  details: string;
}

export interface PredictionResult {
  probability: number;
  riskLevel: 'Low' | 'Watch' | 'Warning' | 'High' | 'Critical';
  predictionWindow: 'Next 12–24 Hours' | 'Next 24–48 Hours' | 'Next 48 Hours' | 'Stable';
  factorOfSafety: number; // geotechnical FoS: <1.0 imminent failure, 1.0-1.25 unstable, >1.3 stable
  hazardScore: number; // 0 - 100
  factors: FactorContribution[];
  whyRiskHigh: string[];
  recommendations: string[];
  geotechnicalSummary: string;
}

// Calibrated against North-Eastern Region (NER) Himalayan Geotechnical Survey parameters
export function calculateLandslideRisk(input: PredictionInput): PredictionResult {
  const rainfall24 = Math.max(0, input.rainfall24h || 0);
  const rainfall72 = Math.max(rainfall24, input.rainfall72h ?? rainfall24 * 2.2);
  const slope = Math.min(75, Math.max(5, input.slopeAngle || 25));
  const moisture = Math.min(100, Math.max(5, input.soilMoisture || 40));
  const drainageDist = Math.max(10, input.distanceToDrainage ?? 120);

  // Lithology friction modifier
  const lithoLower = (input.lithology || '').toLowerCase();
  let lithologyModifier = 1.0;
  if (lithoLower.includes('shale') || lithoLower.includes('clay') || lithoLower.includes('phyllite')) {
    lithologyModifier = 1.25; // Highly prone to slippage when saturated
  } else if (lithoLower.includes('schist') || lithoLower.includes('fractured')) {
    lithologyModifier = 1.15;
  } else if (lithoLower.includes('sandstone') || lithoLower.includes('alluvium')) {
    lithologyModifier = 1.05;
  } else if (lithoLower.includes('granite') || lithoLower.includes('gneiss')) {
    lithologyModifier = 0.85; // Harder bedrock
  }

  // 1. Rainfall Index (IMD Thresholds for NER: 64.5mm is Heavy, 115.5mm is Very Heavy)
  let rainScore = 0;
  if (rainfall24 >= 115 || rainfall72 >= 200) {
    rainScore = 95;
  } else if (rainfall24 >= 70 || rainfall72 >= 140) {
    rainScore = 80;
  } else if (rainfall24 >= 45 || rainfall72 >= 90) {
    rainScore = 55;
  } else if (rainfall24 >= 25) {
    rainScore = 35;
  } else {
    rainScore = Math.max(5, rainfall24 * 1.2);
  }

  // 2. Slope Index (Threshold: >35° is steep and prone to planar and wedge sliding)
  let slopeScore = 0;
  if (slope >= 42) {
    slopeScore = 96;
  } else if (slope >= 35) {
    slopeScore = 82;
  } else if (slope >= 28) {
    slopeScore = 60;
  } else if (slope >= 20) {
    slopeScore = 38;
  } else {
    slopeScore = Math.max(5, slope * 1.5);
  }

  // 3. Soil Moisture Index (Threshold: >75% reaches near-zero cohesion due to pore pressure)
  let moistureScore = 0;
  if (moisture >= 85) {
    moistureScore = 95;
  } else if (moisture >= 75) {
    moistureScore = 80;
  } else if (moisture >= 60) {
    moistureScore = 52;
  } else {
    moistureScore = Math.max(5, moisture * 0.7);
  }

  // 4. Proximity to Drainage / River Toe erosion (Teesta, Brahmaputra tributaries)
  let drainageScore = 30;
  if (drainageDist < 50) {
    drainageScore = 85; // Severe toe cutting risk
  } else if (drainageDist < 150) {
    drainageScore = 65;
  } else if (drainageDist < 300) {
    drainageScore = 45;
  } else {
    drainageScore = 20;
  }

  // Weighted Hazard Calculation (Rainfall: 35%, Slope: 30%, Moisture: 22%, Drainage: 13%)
  const rawHazard = (
    rainScore * 0.35 +
    slopeScore * 0.30 +
    moistureScore * 0.22 +
    drainageScore * 0.13
  ) * lithologyModifier;

  const hazardScore = Math.min(99, Math.max(8, Math.round(rawHazard)));
  const probability = hazardScore;

  // Factor of Safety (FoS) estimation
  // FoS = resisting shear strength / driving shear force
  const drivingForce = Math.sin((slope * Math.PI) / 180) * (1 + (moisture / 100) * 0.4);
  const resistingForce = Math.cos((slope * Math.PI) / 180) * (1 / lithologyModifier) * (1 - (moisture / 100) * 0.5);
  const rawFoS = Math.max(0.65, Number((resistingForce / (drivingForce || 0.1)).toFixed(2)));

  // Risk Classification
  let riskLevel: 'Low' | 'Watch' | 'Warning' | 'High' | 'Critical' = 'Low';
  let predictionWindow: 'Next 12–24 Hours' | 'Next 24–48 Hours' | 'Next 48 Hours' | 'Stable' = 'Stable';

  if (probability >= 85 || rawFoS < 0.95) {
    riskLevel = 'Critical';
    predictionWindow = 'Next 12–24 Hours';
  } else if (probability >= 70 || rawFoS < 1.1) {
    riskLevel = 'High';
    predictionWindow = 'Next 24–48 Hours';
  } else if (probability >= 50 || rawFoS < 1.3) {
    riskLevel = 'Warning';
    predictionWindow = 'Next 24–48 Hours';
  } else if (probability >= 35) {
    riskLevel = 'Watch';
    predictionWindow = 'Next 48 Hours';
  } else {
    riskLevel = 'Low';
    predictionWindow = 'Stable';
  }

  // Factors breakdown
  const factors: FactorContribution[] = [
    {
      name: 'Rainfall Saturation',
      weightPercent: 35,
      status: rainScore >= 75 ? 'Critical' : rainScore >= 50 ? 'Warning' : 'Moderate',
      details: `${rainfall24}mm in last 24h (${rainfall72}mm 72h accumulation)`
    },
    {
      name: 'Slope Incline',
      weightPercent: 30,
      status: slopeScore >= 75 ? 'Critical' : slopeScore >= 50 ? 'Warning' : 'Safe',
      details: `${slope}° gradient angle`
    },
    {
      name: 'Soil Pore Moisture',
      weightPercent: 22,
      status: moistureScore >= 75 ? 'Critical' : moistureScore >= 50 ? 'Warning' : 'Moderate',
      details: `${moisture}% saturation`
    },
    {
      name: 'Drainage & Valley Toe Cut',
      weightPercent: 13,
      status: drainageScore >= 70 ? 'Warning' : 'Safe',
      details: `${drainageDist}m to closest runoff channel`
    }
  ];

  // Why risk is high
  const whyRiskHigh: string[] = [];
  if (rainScore >= 55) whyRiskHigh.push('Heavy monsoonal precipitation exceeding regional infiltration threshold.');
  if (slopeScore >= 60) whyRiskHigh.push('Steep slope gradient causing increased gravitational shear stress.');
  if (moistureScore >= 55) whyRiskHigh.push('High soil water saturation drastically reducing soil shear cohesion.');
  if (lithologyModifier > 1.1) whyRiskHigh.push('Underlying weak lithology (weathered shale/schist) susceptible to planar slipping.');
  if (drainageScore >= 65) whyRiskHigh.push('Close proximity to active drainage channel inducing slope toe erosion.');
  if (whyRiskHigh.length === 0) {
    whyRiskHigh.push('Stable conditions observed across geotechnical and climatic indicators.');
  }

  // Actionable recommendations
  const recommendations: string[] = [];
  if (riskLevel === 'Critical') {
    recommendations.push('Immediate evacuation of downstream structures and road closures on adjacent arterial highway.');
    recommendations.push('Dispatch SDRF/BRO earthmoving units to standby locations.');
    recommendations.push('Avoid all vehicular transit along vulnerable cut-slopes.');
  } else if (riskLevel === 'High') {
    recommendations.push('Enact restricted one-way convoy traffic on vulnerable highway stretches.');
    recommendations.push('Residents in vulnerable low-lying valleys should prepare emergency kits.');
    recommendations.push('Activate 24/7 geotechnical sensor monitoring and alert local panchayats.');
  } else if (riskLevel === 'Warning') {
    recommendations.push('Monitor rainfall gauges hourly and avoid parking vehicles along steep mountain curves.');
    recommendations.push('Inspect drainage culverts to prevent debris clogging and water accumulation.');
  } else {
    recommendations.push('Normal vigilance recommended. Observe standard hillside transit safety precautions.');
  }

  return {
    probability,
    riskLevel,
    predictionWindow,
    factorOfSafety: rawFoS,
    hazardScore,
    factors,
    whyRiskHigh,
    recommendations,
    geotechnicalSummary: `Hazard score calculated at ${hazardScore}% with Factor of Safety ${rawFoS}. Calibrated for North Eastern Region Himalayan tectonic terrain.`
  };
}

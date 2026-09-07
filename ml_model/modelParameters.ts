/**
 * Machine Learning & Geotechnical Parameters for Landslide Susceptibility Modeling
 * Calibrated for North Eastern Region (NER) Himalayan tectonic belts (Assam, Sikkim, Meghalaya, Arunachal Pradesh, Mizoram, Nagaland, Manipur, Tripura)
 */

export const ML_FEATURE_WEIGHTS = {
  rainfallSaturation: 0.35,
  slopeGradient: 0.30,
  soilPoreMoisture: 0.22,
  drainageToeErosion: 0.13,
} as const;

export const IMD_RAINFALL_THRESHOLDS_MM = {
  LIGHT: 15,
  MODERATE: 35,
  HEAVY: 64.5,
  VERY_HEAVY: 115.5,
  EXTREME_72H: 200,
} as const;

export const SLOPE_CRITICAL_ANGLES_DEG = {
  GENTLE: 20,
  MODERATE: 28,
  STEEP: 35,
  VERY_STEEP: 42,
} as const;

export const LITHOLOGY_SUSCEPTIBILITY_FACTORS: Record<string, number> = {
  shale: 1.25,
  clay: 1.25,
  phyllite: 1.25,
  schist: 1.15,
  fractured: 1.15,
  sandstone: 1.05,
  alluvium: 1.05,
  granite: 0.85,
  gneiss: 0.85,
  default: 1.0,
};

export const FACTOR_OF_SAFETY_THRESHOLDS = {
  IMMINENT_FAILURE: 1.0, // FoS < 1.0 driving shear > resisting shear
  CRITICAL_MARGIN: 1.1,  // 1.0 <= FoS < 1.1
  WATCH_MARGIN: 1.3,     // 1.1 <= FoS < 1.3
  STABLE: 1.3,           // FoS >= 1.3
} as const;

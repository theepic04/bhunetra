export type RiskLevel = 'Low' | 'Watch' | 'Warning' | 'Emergency' | 'Critical' | 'High' | 'Normal';

export type ThemeMode = 'light' | 'dark';

export type UserRole = 'citizen' | 'authority';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'as'
  | 'bn'
  | 'mni'
  | 'mizo'
  | 'khasi'
  | 'garo'
  | 'nagamese';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  native: string;
}

export interface RiskZone {
  id: string;
  name: string;
  state: string;
  subRegion: string;
  riskLevel: 'Low' | 'Watch' | 'Warning' | 'Critical' | 'High';
  probability: number;
  predictionWindow: string;
  rainfall24h: number; // in mm
  soilMoisture: number; // percentage
  temperature: number; // in Celsius
  slopeAngle: number; // in degrees
  coordinates: { x: number; y: number; lat: number; lng: number }; // normalized x,y for custom map visual (0-100)
  activeWarning?: string;
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  level: 'Emergency' | 'Warning' | 'Watch' | 'Normal';
  title: string;
  description: string;
  location: string;
  zoneId?: string;
  probability: number;
  expectedTime: string;
  affectedRoad?: string;
  timestamp: string;
  actionRequired: string;
  status?: WorkflowStep;
}

export type WorkflowStep =
  | 'Alert Generated'
  | 'Authority Notified'
  | 'Acknowledged'
  | 'Response Team Assigned'
  | 'Field Verification'
  | 'Action Taken'
  | 'Resolved';

export interface WorkflowAlert {
  id: string;
  alertCode: string;
  zone: string;
  state: string;
  riskScore: number;
  hazardType: string;
  currentStep: WorkflowStep;
  assignedTeam?: string;
  lastActionTime: string;
  notes: string;
}

export interface MonthlyHistoryData {
  month: string;
  rainfallMm: number;
  landslideIncidents: number;
  highRainfallDays: number;
  criticalAlerts: number;
}

export interface EmergencyFacility {
  name: string;
  type: 'Hospital' | 'Shelter' | 'Emergency Services' | 'Relief Center';
  distanceKm: number;
  contact: string;
  address: string;
  capacity?: string;
  status: 'Operational' | 'Standby' | 'Full';
}

export interface SafeRouteStep {
  stepNumber: number;
  instruction: string;
  status: 'safe' | 'caution' | 'blocked';
  distance: string;
}

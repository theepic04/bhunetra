import React, { createContext, useContext, useState, useEffect } from 'react';

export type AlertLevel = 'Emergency' | 'Warning' | 'Watch' | 'Normal';

export type WorkflowStep =
  | 'Alert Generated'
  | 'Authority Notified'
  | 'Acknowledged'
  | 'Team Assigned'
  | 'Field Verification'
  | 'Action Taken'
  | 'Resolved';

export type FieldVerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Not Verified'
  | 'Needs Further Inspection';

export type ResponseActionType =
  | 'No Action'
  | 'Road Closure'
  | 'Evacuation'
  | 'Monitoring';

export type ResponseTeamType =
  | 'District Emergency Team'
  | 'Road & Infrastructure Team'
  | 'Local Rescue Team';

export interface AlertTimelineEvent {
  step: WorkflowStep;
  timestamp: string;
  note: string;
}

export interface UnifiedAlert {
  id: string; // e.g. LS-2026-004
  level: AlertLevel;
  title: string;
  location: string;
  state: string;
  district?: string;
  zoneId: string; // e.g. zone-04
  probability: number; // percentage (0-100)
  expectedTime: string; // e.g. "Next 12–24 Hours"
  cause: string;
  message: string;
  rainfall: string; // e.g. "92 mm / 24h"
  soilMoisture: string; // e.g. "81%"
  slope: string; // e.g. "37°"
  temperature?: string; // e.g. "24°C"
  timestamp: string; // generated time e.g. "Today, 18:30"
  recommendedAction: string;
  isCurrentArea?: boolean; // monitored area for citizen (e.g. Sikkim)
  affectedRoad?: string;

  // Notification status
  isRead: boolean;

  // Authority Workflow State
  currentStep: WorkflowStep;
  assignedTeam: ResponseTeamType | null;
  fieldVerification: FieldVerificationStatus;
  responseAction: ResponseActionType;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  timeline: AlertTimelineEvent[];
}

export interface AlertsContextType {
  alerts: UnifiedAlert[];
  activeAlerts: UnifiedAlert[];
  resolvedAlerts: UnifiedAlert[];
  unreadCount: number;
  selectedFilter: 'All' | 'Emergency' | 'Warning' | 'Watch';
  setSelectedFilter: (filter: 'All' | 'Emergency' | 'Warning' | 'Watch') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  acknowledgeAlert: (id: string) => void;
  assignResponseTeam: (id: string, team: ResponseTeamType) => void;
  updateFieldVerification: (id: string, status: FieldVerificationStatus) => void;
  setResponseAction: (id: string, action: ResponseActionType) => void;
  resolveAlert: (id: string, note?: string) => void;
  getAlertById: (id: string) => UnifiedAlert | undefined;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
  resetAlertsToDefault: () => void;

  // Dynamic Live Telemetry & Controls
  isSyncing: boolean;
  lastSyncedAt: string;
  syncLiveAlerts: (forceRefresh?: boolean) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  sortBy: 'urgency' | 'recent' | 'location';
  setSortBy: (sort: 'urgency' | 'recent' | 'location') => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  speakAlert: (alert: UnifiedAlert) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  broadcastNewAlert: (data: any) => Promise<boolean>;
  simulateWeatherSpike: () => Promise<void>;
}

const STORAGE_KEY = 'bhunetra_unified_alerts_v4';

export const INITIAL_UNIFIED_ALERTS: UnifiedAlert[] = [
  // 1. WARNING ALERT: Arunachal Pradesh Zone 12 (Tawang Route)
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
    cause: 'Heavy continuous rainfall & high pore pressure',
    message: 'Elevated slope instability detected. Heavy runoff across mountain passes. Exercise extreme caution.',
    rainfall: '68 mm / 24h',
    soilMoisture: '74%',
    slope: '32°',
    temperature: '21°C',
    timestamp: 'Today, 15:10',
    recommendedAction: 'Limit non-essential travel along hillside passes and keep emergency supplies ready.',
    isCurrentArea: false,
    affectedRoad: 'Bhalukpong-Bomdila-Tawang Highway',
    isRead: false,
    currentStep: 'Acknowledged',
    assignedTeam: null,
    fieldVerification: 'Pending',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 15:05', note: 'Rainfall threshold 65mm exceeded' },
      { step: 'Authority Notified', timestamp: 'Today, 15:10', note: 'Notice broadcast to district administration' },
      { step: 'Acknowledged', timestamp: 'Today, 15:30', note: 'Duty officer acknowledged advisory' }
    ]
  },
  // 2. WARNING ALERT: Assam Zone 15 (Dima Hasao)
  {
    id: 'LS-2026-005',
    level: 'Warning',
    title: 'Hill Cutting & Seepage Risk — Haflong Pass',
    location: 'Zone 15, Assam',
    state: 'Assam',
    district: 'Dima Hasao',
    zoneId: 'zone-15',
    probability: 69,
    expectedTime: 'Next 24–48 Hours',
    cause: 'Continuous precipitation creating rapid slope saturation',
    message: 'Rail cutting embankment seepage detected. Saturated strata prone to slumping along cut sections.',
    rainfall: '55 mm / 24h',
    soilMoisture: '68%',
    slope: '28°',
    temperature: '28°C',
    timestamp: 'Today, 13:20',
    recommendedAction: 'Engineering patrols deployed along railway corridor. Maintain distance from steep cuttings.',
    isCurrentArea: false,
    affectedRoad: 'Haflong - Jatinga Hill Corridor',
    isRead: false,
    currentStep: 'Authority Notified',
    assignedTeam: null,
    fieldVerification: 'Pending',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 13:15', note: 'Soil pore pressure sensor triggered alert' },
      { step: 'Authority Notified', timestamp: 'Today, 13:20', note: 'Forwarded to District Disaster Cell' }
    ]
  },
  // 3. WATCH ALERT: Meghalaya Zone 07 (East Khasi Hills)
  {
    id: 'LS-2026-002',
    level: 'Watch',
    title: 'Increased Landslide Risk Watch — Sohra Escarpment',
    location: 'Zone 07, Meghalaya',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    zoneId: 'zone-07',
    probability: 54,
    expectedTime: 'Next 48 Hours',
    cause: 'Precipitation accumulation leading to saturated topsoil',
    message: 'Surface fissures noted after localized heavy cloud spell near Cherrapunji escarpment.',
    rainfall: '42 mm / 24h',
    soilMoisture: '65%',
    slope: '28°',
    temperature: '26°C',
    timestamp: 'Today, 11:45',
    recommendedAction: 'Monitor regional weather broadcasts and check drainage clear paths around hillside residences.',
    isCurrentArea: false,
    affectedRoad: 'Sohra-Shella Road',
    isRead: false,
    currentStep: 'Authority Notified',
    assignedTeam: null,
    fieldVerification: 'Pending',
    responseAction: 'Monitoring',
    isResolved: false,
    timeline: [
      { step: 'Alert Generated', timestamp: 'Today, 11:40', note: 'Telemetry threshold warning' },
      { step: 'Authority Notified', timestamp: 'Today, 11:45', note: 'Sent to Meghalaya SDMA' }
    ]
  },
  // 4. HISTORICAL RESOLVED ALERT: Nagaland Zone 03 (Zubza Slope)
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
    cause: 'Heavy rains induced surface tensile fractures',
    message: 'Tensional ground cracks stabilized with tarpaulin covering and drainage channels restored.',
    rainfall: '72 mm / 24h',
    soilMoisture: '71%',
    slope: '31°',
    temperature: '23°C',
    timestamp: '03 Sep 2026, 14:00',
    recommendedAction: 'Area inspected by geotechnical team. Traffic reopened with 30 km/h speed restriction.',
    isCurrentArea: false,
    affectedRoad: 'Dimapur-Kohima Highway',
    isRead: true,
    currentStep: 'Resolved',
    assignedTeam: 'Road & Infrastructure Team',
    fieldVerification: 'Verified',
    responseAction: 'Road Closure',
    isResolved: true,
    resolvedAt: '03 Sep 2026, 17:30',
    resolutionNote: 'Stabilization complete. Drainage functional and sensors nominal.',
    timeline: [
      { step: 'Alert Generated', timestamp: '03 Sep 2026, 14:00', note: 'Displacement detected' },
      { step: 'Authority Notified', timestamp: '03 Sep 2026, 14:15', note: 'Alert transmitted' },
      { step: 'Acknowledged', timestamp: '03 Sep 2026, 14:20', note: 'Officer acknowledged' },
      { step: 'Team Assigned', timestamp: '03 Sep 2026, 14:30', note: 'Road & Infrastructure Team deployed' },
      { step: 'Field Verification', timestamp: '03 Sep 2026, 15:10', note: 'Ground survey verified fissure' },
      { step: 'Action Taken', timestamp: '03 Sep 2026, 15:45', note: 'Temporary road closure applied' },
      { step: 'Resolved', timestamp: '03 Sep 2026, 17:30', note: 'Retaining work and drainage cleared' }
    ]
  },
  // 5. HISTORICAL RESOLVED ALERT: Mizoram Zone 05 (Aizawl West)
  {
    id: 'LS-2026-H02',
    level: 'Watch',
    title: 'Saturated Sump Runoff Cleared',
    location: 'Zone 05, Mizoram',
    state: 'Mizoram',
    district: 'Aizawl',
    zoneId: 'zone-05',
    probability: 48,
    expectedTime: 'Past Event',
    cause: 'Blocked roadside masonry culverts',
    message: 'Localized ponding water drained through culvert flushing. Hill slope moisture returned to baseline.',
    rainfall: '38 mm / 24h',
    soilMoisture: '60%',
    slope: '22°',
    temperature: '26°C',
    timestamp: '01 Sep 2026, 10:30',
    recommendedAction: 'Culvert cleared by municipality. Normal vehicle movement restored.',
    isCurrentArea: false,
    affectedRoad: 'Aizawl-Sairang Road',
    isRead: true,
    currentStep: 'Resolved',
    assignedTeam: 'Local Rescue Team',
    fieldVerification: 'Verified',
    responseAction: 'Monitoring',
    isResolved: true,
    resolvedAt: '01 Sep 2026, 16:00',
    resolutionNote: 'Municipal drainage clearing completed. Water table normalized.',
    timeline: [
      { step: 'Alert Generated', timestamp: '01 Sep 2026, 10:30', note: 'Runoff sensor alert' },
      { step: 'Authority Notified', timestamp: '01 Sep 2026, 10:45', note: 'Dispatched to Aizawl Control' },
      { step: 'Acknowledged', timestamp: '01 Sep 2026, 11:00', note: 'Acknowledged' },
      { step: 'Team Assigned', timestamp: '01 Sep 2026, 11:30', note: 'Local Rescue Team assigned' },
      { step: 'Field Verification', timestamp: '01 Sep 2026, 12:15', note: 'Culvert blockage verified' },
      { step: 'Action Taken', timestamp: '01 Sep 2026, 13:00', note: 'Culvert cleared' },
      { step: 'Resolved', timestamp: '01 Sep 2026, 16:00', note: 'Resolved by District Engineer' }
    ]
  }
];

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<UnifiedAlert[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((a: any) => a.isResolved || (a.level !== 'Normal' && a.probability >= 30));
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_UNIFIED_ALERTS;
  });

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Emergency' | 'Warning' | 'Watch'>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Telemetry & Controls State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Just now');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'urgency' | 'recent' | 'location'>('urgency');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Play audio chime for alerts
  const playAlertChime = (level: AlertLevel) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (level === 'Emergency') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio playback non-blocking catch
    }
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playAlertChime('Watch');
      showToast('Audible alert warnings enabled.');
    } else {
      showToast('Audible alert warnings muted.');
    }
  };

  // Text-To-Speech alert readout
  const speakAlert = (alert: UnifiedAlert) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Attention. Landslide ${alert.level} Advisory for ${alert.location}, ${alert.state}. Risk probability is ${alert.probability} percent. ${alert.recommendedAction}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      showToast(`Reading alert audio broadcast for ${alert.location}...`);
    } else {
      showToast('Audio speech synthesis is not supported on this device.');
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Dynamic Live Alerts Synchronization
  const syncLiveAlerts = async (forceRefresh = false) => {
    setIsSyncing(true);
    try {
      const endpoint = forceRefresh ? '/api/alerts/refresh' : '/api/alerts?sync=true';
      const method = forceRefresh ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        const filtered = json.data.filter((a: any) => a.isResolved || (a.level !== 'Normal' && a.probability >= 30));
        setAlerts(filtered);
        if (json.lastSyncedAt) {
          setLastSyncedAt(json.lastSyncedAt);
        } else {
          setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        if (forceRefresh) {
          showToast('Synchronized with live IMD Doppler and DEM topography telemetry.');
        }
      }
    } catch (err) {
      console.warn('Live alerts sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Broadcast new alert from Authority
  const broadcastNewAlert = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setAlerts((prev) => [json.data, ...prev]);
        showToast(`New emergency alert ${json.data.id} broadcasted across NER network!`);
        if (soundEnabled) {
          playAlertChime(json.data.level);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
      showToast('Failed to broadcast alert. Check network.');
      return false;
    }
  };

  const simulateWeatherSpike = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/alerts/simulate-spike', { method: 'POST' });
      const json = await res.json();
      if (json?.success && json.data) {
        setAlerts((prev) => [json.data, ...prev]);
        setLastSyncedAt('Just now (Simulated Cloudburst)');
        showToast(json.message || 'Simulated rainfall spike injected.');
        playAlertChime('Emergency');
      }
    } catch (err) {
      console.warn('Failed to simulate spike:', err);
      showToast('Simulate spike failed. Check connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch on initial mount
  useEffect(() => {
    syncLiveAlerts(false);
  }, []);

  // Periodic polling every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      syncLiveAlerts(false);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // ignore in restricted mode
    }
  }, [alerts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  const clearToast = () => setToastMessage(null);

  const resetAlertsToDefault = () => {
    setAlerts(INITIAL_UNIFIED_ALERTS);
    showToast('Alert system reset to default mock state.');
  };

  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved);

  // Unread count: only unread active alerts
  const unreadCount = alerts.filter((a) => !a.isRead && !a.isResolved).length;

  const markAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, isRead: true } : alert))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
    showToast('All notifications marked as read.');
  };

  const syncAlertToBackend = (id: string, step: WorkflowStep, assignedTeam?: string, notes?: string) => {
    fetch(`/api/alerts/${id}/workflow`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, assignedTeam, notes })
    }).catch((err) => console.warn('Backend alert sync notice:', err));
  };

  const acknowledgeAlert = (id: string) => {
    syncAlertToBackend(id, 'Acknowledged');
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          const nowStr = 'Just now';
          const newTimeline = [...alert.timeline];
          if (!newTimeline.some((t) => t.step === 'Acknowledged')) {
            newTimeline.push({
              step: 'Acknowledged',
              timestamp: nowStr,
              note: 'Alert acknowledged by On-Duty Authority Officer.'
            });
          }
          return {
            ...alert,
            currentStep: 'Acknowledged' as WorkflowStep,
            isRead: true,
            timeline: newTimeline
          };
        }
        return alert;
      })
    );
    showToast(`Alert ${id} acknowledged. Status updated.`);
  };

  const assignResponseTeam = (id: string, team: ResponseTeamType) => {
    syncAlertToBackend(id, 'Team Assigned', team);
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          const nowStr = 'Just now';
          const newTimeline = [...alert.timeline];
          newTimeline.push({
            step: 'Team Assigned',
            timestamp: nowStr,
            note: `${team} assigned to ${alert.location}.`
          });
          return {
            ...alert,
            assignedTeam: team,
            currentStep: 'Team Assigned' as WorkflowStep,
            timeline: newTimeline
          };
        }
        return alert;
      })
    );
    showToast(`Assigned ${team} to alert ${id}.`);
  };

  const updateFieldVerification = (id: string, status: FieldVerificationStatus) => {
    syncAlertToBackend(id, 'Field Verification', undefined, `Field status: ${status}`);
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          const nowStr = 'Just now';
          const newTimeline = [...alert.timeline];
          newTimeline.push({
            step: 'Field Verification',
            timestamp: nowStr,
            note: `Field verification updated to: ${status}.`
          });
          return {
            ...alert,
            fieldVerification: status,
            currentStep: 'Field Verification' as WorkflowStep,
            timeline: newTimeline
          };
        }
        return alert;
      })
    );
    showToast(`Field verification for ${id} set to "${status}".`);
  };

  const setResponseAction = (id: string, action: ResponseActionType) => {
    syncAlertToBackend(id, 'Action Taken', undefined, `Action: ${action}`);
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          const nowStr = 'Just now';
          const newTimeline = [...alert.timeline];
          newTimeline.push({
            step: 'Action Taken',
            timestamp: nowStr,
            note: `Emergency action applied: ${action}.`
          });
          return {
            ...alert,
            responseAction: action,
            currentStep: 'Action Taken' as WorkflowStep,
            timeline: newTimeline
          };
        }
        return alert;
      })
    );
    showToast(`Emergency response action "${action}" initiated for ${id}.`);
  };

  const resolveAlert = (id: string, note?: string) => {
    syncAlertToBackend(id, 'Resolved', undefined, note);
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === id) {
          const nowStr = 'Just now';
          const finalNote = note || 'Hazard cleared and verified stable by incident commander.';
          const newTimeline = [...alert.timeline];
          newTimeline.push({
            step: 'Resolved',
            timestamp: nowStr,
            note: finalNote
          });
          return {
            ...alert,
            isResolved: true,
            isRead: true,
            currentStep: 'Resolved' as WorkflowStep,
            resolvedAt: nowStr,
            resolutionNote: finalNote,
            timeline: newTimeline
          };
        }
        return alert;
      })
    );
    showToast(`Alert ${id} resolved successfully and moved to Alert History.`);
  };

  const getAlertById = (id: string) => {
    return alerts.find((a) => a.id === id);
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        activeAlerts,
        resolvedAlerts,
        unreadCount,
        selectedFilter,
        setSelectedFilter,
        markAsRead,
        markAllAsRead,
        acknowledgeAlert,
        assignResponseTeam,
        updateFieldVerification,
        setResponseAction,
        resolveAlert,
        getAlertById,
        toastMessage,
        showToast,
        clearToast,
        resetAlertsToDefault,

        // Dynamic Telemetry & Controls
        isSyncing,
        lastSyncedAt,
        syncLiveAlerts,
        searchQuery,
        setSearchQuery,
        selectedState,
        setSelectedState,
        sortBy,
        setSortBy,
        soundEnabled,
        toggleSound,
        speakAlert,
        stopSpeaking,
        isSpeaking,
        broadcastNewAlert,
        simulateWeatherSpike
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = (): AlertsContextType => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

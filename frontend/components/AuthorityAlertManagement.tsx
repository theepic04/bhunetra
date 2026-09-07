import React, { useState, useEffect, useMemo } from 'react';
import {
  useAlerts,
  UnifiedAlert,
  AlertLevel,
  ResponseTeamType,
  FieldVerificationStatus,
  ResponseActionType
} from '../context/AlertsContext';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Search,
  Check,
  X,
  Radio,
  ArrowRight,
  RotateCcw,
  CloudRain,
  Droplets,
  Thermometer,
  Compass,
  History,
  AlertOctagon,
  LifeBuoy,
  FileCheck,
  Volume2,
  VolumeX,
  Megaphone,
  Filter,
  Zap
} from 'lucide-react';

interface AuthorityAlertManagementProps {
  onNavigate?: (page: string) => void;
  selectedAlertId?: string;
}

export interface ManagementAlert {
  id: string; // e.g. LS-2026-004
  level: 'Critical' | 'High' | 'Watch' | 'Resolved';
  levelLabel: string;
  title: string;
  location: string;
  state?: string;
  district?: string;
  zoneCode: string;
  probability: number;
  expected: string;
  status: 'Awaiting Action' | 'Acknowledged' | 'Under Observation' | 'Action In Progress' | 'Resolved';
  environmental: {
    rainfall: string;
    soilMoisture: string;
    temperature: string;
    slope: string;
    historicalLandslides: string;
  };
  timeline: {
    alertGenerated: boolean;
    authorityNotified: boolean;
    alertAcknowledged: boolean;
    responseTeamAssigned: boolean;
    fieldVerification: 'pending' | 'requested' | 'verified';
    actionTaken: 'pending' | 'road_closed' | 'evacuation_started' | 'both';
    resolved: boolean;
  };
  responseTeam: {
    team: string;
    officer: string;
    status: 'Available' | 'Assigned';
  };
  fieldVerificationStatus: 'Pending' | 'Verification Requested' | 'Verified';
  emergencyActions: {
    roadClosure: boolean;
    evacuation: boolean;
  };
  isResolved: boolean;
  resolvedMessage?: string;
  affectedRoad?: string;
  cause?: string;
  recommendedAction?: string;
  rawAlert?: UnifiedAlert;
}

const NER_STATES_LIST = [
  'All States',
  'Sikkim',
  'Arunachal Pradesh',
  'Assam',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Tripura'
];

/**
 * Transforms a live UnifiedAlert from AlertsContext into the rich ManagementAlert model
 */
function mapUnifiedToManagement(a: UnifiedAlert): ManagementAlert {
  const isEmergency = a.level === 'Emergency';
  const isWarning = a.level === 'Warning';
  const isResolved = Boolean(a.isResolved);

  let level: ManagementAlert['level'] = 'Watch';
  if (isResolved) level = 'Resolved';
  else if (isEmergency) level = 'Critical';
  else if (isWarning) level = 'High';

  let levelLabel = '🟡 WATCH';
  if (isResolved) levelLabel = '🟢 RESOLVED';
  else if (isEmergency) levelLabel = '🔴 CRITICAL';
  else if (isWarning) levelLabel = '🟠 HIGH';

  const hasAck =
    a.currentStep !== 'Alert Generated' &&
    a.currentStep !== 'Authority Notified';
  const hasTeam =
    Boolean(a.assignedTeam) ||
    a.timeline?.some((t) => t.step === 'Team Assigned');
  const isVerified = a.fieldVerification === 'Verified';
  const isRequested = a.fieldVerification === 'Needs Further Inspection' || a.fieldVerification === 'Not Verified';

  const isRoadClosed =
    a.responseAction === 'Road Closure' ||
    a.timeline?.some((t) => t.note?.toLowerCase().includes('road closure'));
  const isEvac =
    a.responseAction === 'Evacuation' ||
    a.timeline?.some((t) => t.note?.toLowerCase().includes('evacuation'));

  let actionTaken: 'pending' | 'road_closed' | 'evacuation_started' | 'both' = 'pending';
  if (isRoadClosed && isEvac) actionTaken = 'both';
  else if (isEvac) actionTaken = 'evacuation_started';
  else if (isRoadClosed) actionTaken = 'road_closed';

  let status: ManagementAlert['status'] = 'Awaiting Action';
  if (isResolved) status = 'Resolved';
  else if (isRoadClosed || isEvac) status = 'Action In Progress';
  else if (isVerified || hasTeam) status = 'Under Observation';
  else if (hasAck) status = 'Acknowledged';

  const prob = typeof a.probability === 'number' ? a.probability : 75;
  const histText =
    prob >= 80
      ? 'Very High (14 historical events recorded)'
      : prob >= 60
      ? 'High (8 historical events recorded)'
      : 'Moderate (3 historical events recorded)';

  const zoneCode = a.zoneId ? a.zoneId.toUpperCase().replace('-', ' ') : a.id;
  const locationDisplay = a.location
    ? a.location.includes(a.state)
      ? a.location
      : `${a.location}, ${a.state}`
    : a.state || 'NER Sector';

  return {
    id: a.id,
    level,
    levelLabel,
    title: a.title,
    location: locationDisplay,
    state: a.state,
    district: a.district,
    zoneCode,
    probability: prob,
    expected: a.expectedTime || 'Next 12–24 Hours',
    status,
    environmental: {
      rainfall: a.rainfall || '85 mm / 24h',
      soilMoisture: a.soilMoisture || '78%',
      temperature: a.temperature || '22°C',
      slope: a.slope || '35°',
      historicalLandslides: histText
    },
    timeline: {
      alertGenerated: true,
      authorityNotified: true,
      alertAcknowledged: hasAck,
      responseTeamAssigned: hasTeam,
      fieldVerification: isVerified ? 'verified' : isRequested ? 'requested' : 'pending',
      actionTaken,
      resolved: isResolved
    },
    responseTeam: {
      team: a.assignedTeam || 'District Disaster Response Team',
      officer: 'Duty Officer / Incident Commander',
      status: hasTeam ? 'Assigned' : 'Available'
    },
    fieldVerificationStatus: isVerified ? 'Verified' : isRequested ? 'Verification Requested' : 'Pending',
    emergencyActions: {
      roadClosure: Boolean(isRoadClosed),
      evacuation: Boolean(isEvac)
    },
    isResolved,
    resolvedMessage: a.resolutionNote || 'Alert resolved by Authority.',
    affectedRoad: a.affectedRoad,
    cause: a.cause,
    recommendedAction: a.recommendedAction,
    rawAlert: a
  };
}

export const AuthorityAlertManagement: React.FC<AuthorityAlertManagementProps> = ({
  onNavigate,
  selectedAlertId
}) => {
  const {
    alerts: contextAlerts,
    acknowledgeAlert: ctxAcknowledgeAlert,
    assignResponseTeam: ctxAssignTeam,
    updateFieldVerification: ctxUpdateFieldVerification,
    setResponseAction: ctxSetResponseAction,
    resolveAlert: ctxResolveAlert,
    syncLiveAlerts,
    isSyncing,
    lastSyncedAt,
    speakAlert,
    stopSpeaking,
    isSpeaking,
    broadcastNewAlert,
    simulateWeatherSpike,
    showToast
  } = useAlerts();

  // Dynamic alerts derived directly from live AlertsContext
  const dynamicAlerts: ManagementAlert[] = useMemo(() => {
    if (!contextAlerts || contextAlerts.length === 0) {
      return [];
    }
    return contextAlerts.map(mapUnifiedToManagement);
  }, [contextAlerts]);

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Critical' | 'High' | 'Watch' | 'Resolved'>('All');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [speakingAlertId, setSpeakingAlertId] = useState<string | null>(null);

  // Dialog State for Confirmation
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    actionType: 'road_closure' | 'evacuation';
    zone: string;
  } | null>(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    level: 'Warning' as AlertLevel,
    state: 'Sikkim',
    location: '',
    district: '',
    affectedRoad: '',
    probability: 78,
    rainfall: '95 mm / 24h',
    soilMoisture: '78%',
    slope: '36°',
    expectedTime: 'Next 12–24 Hours',
    cause: 'Heavy sustained precipitation causing critical slope saturation.',
    recommendedAction: 'Restrict vehicular transit. Emergency response teams on standby.'
  });

  // Assign Team Custom Select State
  const [selectedTeamType, setSelectedTeamType] = useState<ResponseTeamType>('District Emergency Team');

  // Sync selectedId with props or pick the first alert
  useEffect(() => {
    if (dynamicAlerts.length === 0) return;

    if (selectedAlertId) {
      const match = dynamicAlerts.find(
        (a) =>
          a.id.toLowerCase() === selectedAlertId.toLowerCase() ||
          a.zoneCode.toLowerCase().replace(/\s+/g, '-') === selectedAlertId.toLowerCase() ||
          a.id.replace('LS-2026-', 'zone-').toLowerCase() === selectedAlertId.toLowerCase()
      );
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }

    // If current selectedId is not in list or empty, select first active or first alert
    const exists = dynamicAlerts.some((a) => a.id === selectedId);
    if (!exists) {
      const firstActive = dynamicAlerts.find((a) => !a.isResolved);
      setSelectedId(firstActive ? firstActive.id : dynamicAlerts[0].id);
    }
  }, [selectedAlertId, dynamicAlerts, selectedId]);

  // Active Alert selected for management console
  const activeAlert = useMemo(() => {
    return dynamicAlerts.find((a) => a.id === selectedId) || dynamicAlerts[0];
  }, [dynamicAlerts, selectedId]);

  const showBanner = (msg: string) => {
    setFeedbackBanner(msg);
    showToast(msg);
    setTimeout(() => {
      setFeedbackBanner((current) => (current === msg ? null : current));
    }, 4500);
  };

  // Filter alerts by severity, state, and search term
  const filteredAlerts = useMemo(() => {
    return dynamicAlerts.filter((alert) => {
      // 1. Severity filter
      if (selectedFilter !== 'All') {
        if (selectedFilter === 'Critical' && alert.level !== 'Critical') return false;
        if (selectedFilter === 'High' && alert.level !== 'High') return false;
        if (selectedFilter === 'Watch' && alert.level !== 'Watch') return false;
        if (selectedFilter === 'Resolved' && (!alert.isResolved && alert.status !== 'Resolved')) return false;
      }

      // 2. State filter
      if (selectedState !== 'All States') {
        if (alert.state && alert.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLoc = alert.location.toLowerCase().includes(q);
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesId = alert.id.toLowerCase().includes(q);
        const matchesZone = alert.zoneCode.toLowerCase().includes(q);
        const matchesRoad = alert.affectedRoad?.toLowerCase().includes(q);
        if (!matchesLoc && !matchesTitle && !matchesId && !matchesZone && !matchesRoad) {
          return false;
        }
      }

      return true;
    });
  }, [dynamicAlerts, selectedFilter, selectedState, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const active = dynamicAlerts.filter((a) => !a.isResolved && a.status !== 'Resolved').length;
    const critical = dynamicAlerts.filter((a) => !a.isResolved && a.level === 'Critical').length;
    const high = dynamicAlerts.filter((a) => !a.isResolved && a.level === 'High').length;
    const watch = dynamicAlerts.filter((a) => !a.isResolved && a.level === 'Watch').length;
    const resolved = dynamicAlerts.filter((a) => a.isResolved || a.status === 'Resolved').length;
    return { active, critical, high, watch, resolved, total: dynamicAlerts.length };
  }, [dynamicAlerts]);

  // AUTHORITY ACTIONS (Synced with AlertsContext & Backend)
  const handleAcknowledgeAlert = () => {
    if (!activeAlert) return;
    ctxAcknowledgeAlert(activeAlert.id);
    showBanner(`Alert ${activeAlert.id} acknowledged by On-Duty Incident Commander.`);
  };

  const handleAssignTeam = () => {
    if (!activeAlert) return;
    ctxAssignTeam(activeAlert.id, selectedTeamType);
    showBanner(`${selectedTeamType} assigned to ${activeAlert.zoneCode}.`);
  };

  const handleRequestFieldVerification = () => {
    if (!activeAlert) return;
    ctxUpdateFieldVerification(activeAlert.id, 'Verified');
    showBanner(`Field verification verified by geotechnical team for ${activeAlert.id}.`);
  };

  const handleConfirmEmergencyAction = () => {
    if (!confirmationDialog || !activeAlert) return;
    const { actionType, zone } = confirmationDialog;

    const actionText: ResponseActionType =
      actionType === 'road_closure' ? 'Road Closure' : 'Evacuation';
    ctxSetResponseAction(activeAlert.id, actionText);

    if (actionType === 'road_closure') {
      showBanner(`Road closure initiated for ${zone}. Highway traffic redirection active.`);
    } else {
      showBanner(`Emergency evacuation initiated for ${zone}. SDRF units deployed.`);
    }

    setConfirmationDialog(null);
  };

  const handleMarkResolved = () => {
    if (!activeAlert) return;
    ctxResolveAlert(activeAlert.id, 'Alert resolved by Authority after slope stabilization.');
    showBanner(`Alert ${activeAlert.id} marked as resolved.`);
  };

  // Audio Speech synthesis preview
  const handleToggleSpeak = (alert: ManagementAlert) => {
    if (isSpeaking && speakingAlertId === alert.id) {
      stopSpeaking();
      setSpeakingAlertId(null);
    } else if (alert.rawAlert) {
      setSpeakingAlertId(alert.id);
      speakAlert(alert.rawAlert);
    }
  };

  // Broadcast modal submit
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.location) {
      showToast('Please provide an alert title and location.');
      return;
    }

    const success = await broadcastNewAlert({
      title: broadcastForm.title,
      level: broadcastForm.level,
      location: broadcastForm.location,
      state: broadcastForm.state,
      district: broadcastForm.district || `${broadcastForm.location} District`,
      affectedRoad: broadcastForm.affectedRoad || 'State Arterial Corridor',
      probability: Number(broadcastForm.probability) || 75,
      rainfall: broadcastForm.rainfall,
      soilMoisture: broadcastForm.soilMoisture,
      slope: broadcastForm.slope,
      expectedTime: broadcastForm.expectedTime,
      cause: broadcastForm.cause,
      recommendedAction: broadcastForm.recommendedAction,
      broadcastChannels: ['Public Portal', 'Authority Console', 'CAP Network', 'SDRF Radio']
    });

    if (success) {
      setShowBroadcastModal(false);
      showBanner(`Emergency Alert broadcasted across NER Command Network!`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ==================================================
            1. PAGE HEADER & TELEMETRY CONTROLS
            ================================================== */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Alert Management & Dispatch
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>{counts.active} Active Alerts</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
                <Radio className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span>Live IMD Synced</span>
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Real-time early warning coordination, response team dispatch, and emergency regulatory interventions.
            </p>
          </div>

          {/* Real-time telemetry & Authority Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Sync Telemetry Button */}
            <button
              id="btn-sync-alerts-telemetry"
              onClick={() => syncLiveAlerts(true)}
              disabled={isSyncing}
              title="Poll live IMD Doppler and DEM topography telemetry"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>

            {/* Simulate Spike Drill */}
            <button
              id="btn-simulate-weather-drill"
              onClick={simulateWeatherSpike}
              disabled={isSyncing}
              title="Inject simulated cloudburst rainfall spike for emergency drill"
              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Simulate Spike</span>
            </button>

            {/* Broadcast New Alert */}
            <button
              id="btn-broadcast-alert-modal-trigger"
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{feedbackBanner}</span>
            </div>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filters: All, Critical, High, Watch, Resolved */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Critical', 'High', 'Watch', 'Resolved'] as const).map((filter) => {
                const isSelected = selectedFilter === filter;
                const count =
                  filter === 'All'
                    ? counts.total
                    : filter === 'Critical'
                    ? counts.critical
                    : filter === 'High'
                    ? counts.high
                    : filter === 'Watch'
                    ? counts.watch
                    : counts.resolved;

                return (
                  <button
                    key={filter}
                    id={`filter-${filter.toLowerCase()}-btn`}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{filter}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected
                          ? 'bg-slate-800 dark:bg-slate-200 text-slate-100 dark:text-slate-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* State filter & Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                id="select-ner-state-filter"
                aria-label="Filter alerts by state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                {NER_STATES_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search alert, location, road..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden w-full sm:w-56"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Showing <strong>{filteredAlerts.length}</strong> of {dynamicAlerts.length} total alerts</span>
            <span>Last Telemetry Sync: <strong className="text-slate-800 dark:text-slate-200">{lastSyncedAt}</strong></span>
          </div>
        </div>

        {/* ==================================================
            2. DYNAMIC ACTIVE ALERT QUEUE
            ================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Regional Alert Queue ({filteredAlerts.length})
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Click &apos;Manage Alert&apos; on any record to open the operations console
            </span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No alerts match the selected criteria</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active landslide advisories found for this filter. You can broadcast a new alert or simulate a weather spike.
              </p>
              <button
                onClick={() => {
                  setSelectedFilter('All');
                  setSelectedState('All States');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAlerts.map((item) => {
                const isSelected = activeAlert && item.id === activeAlert.id;

                return (
                  <div
                    key={item.id}
                    id={`alert-card-${item.id.toLowerCase()}`}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 transition-all border ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950 shadow-md'
                        : item.level === 'Critical'
                        ? 'border-red-200 dark:border-red-900/60 hover:border-red-400 dark:hover:border-red-700'
                        : item.level === 'High'
                        ? 'border-orange-200 dark:border-orange-900/60 hover:border-orange-400 dark:hover:border-orange-700'
                        : item.level === 'Watch'
                        ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-700'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Risk Level badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide uppercase ${
                              item.level === 'Critical'
                                ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                                : item.level === 'High'
                                ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300'
                                : item.level === 'Watch'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {item.levelLabel}
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                            {item.id}
                          </span>

                          {/* Status badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.status === 'Awaiting Action'
                                ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                                : item.status === 'Acknowledged'
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                : item.status === 'Resolved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            Status: {item.status}
                          </span>

                          {item.affectedRoad && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Corridor: {item.affectedRoad}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>

                        {/* Summary Metrics */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Location: <strong className="text-slate-800 dark:text-slate-200">{item.location}</strong></span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <span>Probability: <strong className={item.level === 'Critical' ? 'text-red-600 dark:text-red-400 font-black' : item.level === 'High' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>{item.probability}%</strong></span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Expected: <strong className="text-slate-800 dark:text-slate-200">{item.expected}</strong></span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                            <span>{item.environmental.rainfall}</span>
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.environmental.soilMoisture}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          {/* Audio Speech Button */}
                          <button
                            title="Listen to audio advisory broadcast"
                            onClick={() => handleToggleSpeak(item)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isSpeaking && speakingAlertId === item.id
                                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 animate-pulse'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSpeaking && speakingAlertId === item.id ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Button: "Manage Alert" */}
                          <button
                            id={`manage-alert-btn-${item.id.toLowerCase()}`}
                            onClick={() => setSelectedId(item.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                            }`}
                          >
                            <span>Manage Alert</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================
            3. ALERT DETAILS (ACTIVE MANAGEMENT PANEL)
            ================================================== */}
        {activeAlert && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Active Alert Management Console
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {activeAlert.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Alert ID: {activeAlert.id}
                </span>

                <button
                  onClick={() => handleToggleSpeak(activeAlert)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeaking && speakingAlertId === activeAlert.id ? 'Stop Audio' : 'Play Audio'}</span>
                </button>

                {activeAlert.isResolved && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    ✓ Incident Resolved
                  </span>
                )}
              </div>
            </div>

            {/* Recommended Action & Trigger Summary */}
            {activeAlert.recommendedAction && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider text-[10px] block">
                  Mandated SOP & Operational Advisory:
                </span>
                <p className="text-blue-950 dark:text-blue-200 font-medium leading-relaxed">
                  {activeAlert.recommendedAction}
                </p>
                {activeAlert.cause && (
                  <p className="text-blue-700 dark:text-blue-400 text-[11px] pt-1">
                    Telemetry Cause: {activeAlert.cause}
                  </p>
                )}
              </div>
            )}

            {/* Core Specification Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Location
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {activeAlert.location}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Risk Level
                </span>
                <span
                  className={`text-sm font-black mt-0.5 block ${
                    activeAlert.level === 'Critical'
                      ? 'text-red-600 dark:text-red-400'
                      : activeAlert.level === 'High'
                      ? 'text-orange-600 dark:text-orange-400'
                      : activeAlert.level === 'Watch'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {activeAlert.level === 'Critical' ? 'CRITICAL' : (activeAlert.level || 'ALERT').toUpperCase()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Probability
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                  {activeAlert.probability}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Prediction Window
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {activeAlert.expected}
                </span>
              </div>
            </div>

            {/* ==================================================
                4. ENVIRONMENTAL DATA (Field Telemetry)
                ================================================== */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Environmental Data (Field Telemetry)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Rainfall
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{activeAlert.environmental.rainfall}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Soil Moisture
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{activeAlert.environmental.soilMoisture}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Temperature
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{activeAlert.environmental.temperature}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Slope
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{activeAlert.environmental.slope}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Historical Landslides
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{activeAlert.environmental.historicalLandslides}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                5. RESPONSE STATUS (RESPONSE TIMELINE)
                ================================================== */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Response Status & Workflow Timeline
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Current step: <strong className="text-slate-800 dark:text-slate-200">{activeAlert.status}</strong>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                  {/* 1. Alert Generated */}
                  <div className="flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        1. Alert Generated
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        Complete
                      </div>
                    </div>
                  </div>

                  {/* 2. Authority Notified */}
                  <div className="flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        2. Authority Notified
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        Complete
                      </div>
                    </div>
                  </div>

                  {/* 3. Alert Acknowledged */}
                  <div className={`flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg border shadow-2xs ${
                    activeAlert.timeline.alertAcknowledged
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      activeAlert.timeline.alertAcknowledged
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {activeAlert.timeline.alertAcknowledged ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        3. Alert Acknowledged
                      </div>
                      <div className={`text-[10px] font-bold ${
                        activeAlert.timeline.alertAcknowledged ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {activeAlert.timeline.alertAcknowledged ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* 4. Response Team Assigned */}
                  <div className={`flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg border shadow-2xs ${
                    activeAlert.timeline.responseTeamAssigned
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      activeAlert.timeline.responseTeamAssigned
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {activeAlert.timeline.responseTeamAssigned ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        4. Team Assigned
                      </div>
                      <div className={`text-[10px] font-bold ${
                        activeAlert.timeline.responseTeamAssigned ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {activeAlert.timeline.responseTeamAssigned ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* 5. Field Verification */}
                  <div className={`flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg border shadow-2xs ${
                    activeAlert.fieldVerificationStatus !== 'Pending'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      activeAlert.fieldVerificationStatus !== 'Pending'
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {activeAlert.fieldVerificationStatus !== 'Pending' ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        5. Field Verification
                      </div>
                      <div className={`text-[10px] font-bold ${
                        activeAlert.fieldVerificationStatus !== 'Pending' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {activeAlert.fieldVerificationStatus !== 'Pending' ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* 6. Action Taken */}
                  <div className={`flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg border shadow-2xs ${
                    activeAlert.emergencyActions.roadClosure || activeAlert.emergencyActions.evacuation
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      activeAlert.emergencyActions.roadClosure || activeAlert.emergencyActions.evacuation
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {activeAlert.emergencyActions.roadClosure || activeAlert.emergencyActions.evacuation ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        6. Action Taken
                      </div>
                      <div className={`text-[10px] font-bold ${
                        activeAlert.emergencyActions.roadClosure || activeAlert.emergencyActions.evacuation ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {activeAlert.emergencyActions.roadClosure || activeAlert.emergencyActions.evacuation ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* 7. Resolved */}
                  <div className={`flex sm:flex-col items-center sm:text-center justify-between sm:justify-start gap-2 p-2 rounded-lg border shadow-2xs ${
                    activeAlert.isResolved
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      activeAlert.isResolved
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {activeAlert.isResolved ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        7. Resolved
                      </div>
                      <div className={`text-[10px] font-bold ${
                        activeAlert.isResolved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {activeAlert.isResolved ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                6. AUTHORITY ACTIONS (Response Actions)
                ================================================== */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Response Actions
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any action to execute operational update
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* [Acknowledge Alert] */}
                <button
                  id="btn-acknowledge-alert"
                  onClick={handleAcknowledgeAlert}
                  disabled={activeAlert.timeline.alertAcknowledged}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeAlert.timeline.alertAcknowledged
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  {activeAlert.timeline.alertAcknowledged ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Alert Acknowledged</span>
                    </>
                  ) : (
                    <span>Acknowledge Alert</span>
                  )}
                </button>

                {/* [Assign Response Team] */}
                <button
                  id="btn-assign-response-team"
                  onClick={handleAssignTeam}
                  disabled={activeAlert.responseTeam.status === 'Assigned'}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeAlert.responseTeam.status === 'Assigned'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  {activeAlert.responseTeam.status === 'Assigned' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Response Team Assigned</span>
                    </>
                  ) : (
                    <span>Assign Response Team</span>
                  )}
                </button>

                {/* [Request Field Verification] */}
                <button
                  id="btn-request-field-verification"
                  onClick={handleRequestFieldVerification}
                  disabled={activeAlert.fieldVerificationStatus !== 'Pending'}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeAlert.fieldVerificationStatus !== 'Pending'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  {activeAlert.fieldVerificationStatus !== 'Pending' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Field Verification Completed</span>
                    </>
                  ) : (
                    <span>Request Field Verification</span>
                  )}
                </button>

                {/* [Initiate Road Closure] */}
                <button
                  id="btn-initiate-road-closure-quick"
                  onClick={() =>
                    setConfirmationDialog({
                      isOpen: true,
                      actionType: 'road_closure',
                      zone: activeAlert.zoneCode
                    })
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeAlert.emergencyActions.roadClosure
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-800'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  {activeAlert.emergencyActions.roadClosure
                    ? 'Road Closure Active'
                    : 'Initiate Road Closure'}
                </button>

                {/* [Start Evacuation] */}
                <button
                  id="btn-start-evacuation-quick"
                  onClick={() =>
                    setConfirmationDialog({
                      isOpen: true,
                      actionType: 'evacuation',
                      zone: activeAlert.zoneCode
                    })
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeAlert.emergencyActions.evacuation
                      ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-800'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  {activeAlert.emergencyActions.evacuation
                    ? 'Evacuation Active'
                    : 'Start Evacuation'}
                </button>

                {/* [Mark Resolved] */}
                <button
                  id="btn-mark-resolved-quick"
                  onClick={handleMarkResolved}
                  disabled={activeAlert.isResolved}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeAlert.isResolved
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                  }`}
                >
                  {activeAlert.isResolved ? '✓ Resolved' : 'Mark Resolved'}
                </button>
              </div>
            </div>

            {/* 7 & 8 Dual Column: RESPONSE TEAM & FIELD VERIFICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ==================================================
                  7. RESPONSE TEAM
                  ================================================== */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Response Team Assignment</span>
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeAlert.responseTeam.status === 'Assigned'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    Status: {activeAlert.responseTeam.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Team: </span>
                    <strong className="text-slate-900 dark:text-white">{activeAlert.responseTeam.team}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Duty Officer: </span>
                    <strong className="text-slate-900 dark:text-white">{activeAlert.responseTeam.officer}</strong>
                  </div>
                </div>

                {/* Team selection dropdown if not yet assigned */}
                {activeAlert.responseTeam.status !== 'Assigned' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block">Select Designated Unit:</label>
                    <select
                      value={selectedTeamType}
                      onChange={(e) => setSelectedTeamType(e.target.value as ResponseTeamType)}
                      className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      <option value="District Emergency Team">District Emergency Team</option>
                      <option value="Road & Infrastructure Team">Road & Infrastructure Team (BRO/PWD)</option>
                      <option value="Local Rescue Team">Local Rescue Team (SDRF/NDRF)</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    id="btn-assign-team-panel"
                    onClick={handleAssignTeam}
                    disabled={activeAlert.responseTeam.status === 'Assigned'}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeAlert.responseTeam.status === 'Assigned'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    {activeAlert.responseTeam.status === 'Assigned' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Team Assigned to {activeAlert.zoneCode}</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>Assign Selected Team</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ==================================================
                  8. FIELD VERIFICATION
                  ================================================== */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Geotechnical Field Verification</span>
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeAlert.fieldVerificationStatus === 'Verification Requested'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                        : activeAlert.fieldVerificationStatus === 'Verified'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                    }`}
                  >
                    Status: {activeAlert.fieldVerificationStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Status: </span>
                    <strong className="text-slate-900 dark:text-white">{activeAlert.fieldVerificationStatus}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeAlert.fieldVerificationStatus === 'Verified'
                      ? 'Geotechnical sub-divisional surveyor confirmed tension cracks & slope instability.'
                      : activeAlert.fieldVerificationStatus === 'Verification Requested'
                      ? 'Dispatched geotechnical surveyor to evaluate tension fissures and ground movement.'
                      : 'Awaiting formal geotechnical on-site verification dispatch.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    id="btn-request-verification-panel"
                    onClick={handleRequestFieldVerification}
                    disabled={activeAlert.fieldVerificationStatus !== 'Pending'}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeAlert.fieldVerificationStatus !== 'Pending'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-default'
                        : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-2xs'
                    }`}
                  >
                    {activeAlert.fieldVerificationStatus !== 'Pending' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Field Verification Completed</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Request Field Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ==================================================
                9. EMERGENCY ACTIONS (Regulatory Interventions)
                ================================================== */}
            <div className="p-5 rounded-xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-red-200 dark:border-red-900/60">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 uppercase tracking-wide">
                    Emergency Regulatory Actions
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-red-800 dark:text-red-300">
                  Disaster Management Act regulatory orders for {activeAlert.zoneCode}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Road Closure Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Road Closure Protocol</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        activeAlert.emergencyActions.roadClosure
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {activeAlert.emergencyActions.roadClosure ? 'Active' : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Directs traffic police and Border Roads Organisation (BRO) to place physical barricades and divert commercial uphill traffic along {activeAlert.affectedRoad || 'highways'}.
                  </p>
                  <button
                    id="btn-initiate-road-closure-dialog"
                    onClick={() =>
                      setConfirmationDialog({
                        isOpen: true,
                        actionType: 'road_closure',
                        zone: activeAlert.zoneCode
                      })
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAlert.emergencyActions.roadClosure
                        ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-800'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-2xs'
                    }`}
                  >
                    {activeAlert.emergencyActions.roadClosure
                      ? 'Road Closure Initiated'
                      : 'Initiate Road Closure'}
                  </button>
                </div>

                {/* Evacuation Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Evacuation Order</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        activeAlert.emergencyActions.evacuation
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {activeAlert.emergencyActions.evacuation ? 'Enforced' : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Coordinates community sirens, bus dispatch to designated transit relief shelters, and SDRF slope-side neighborhood sweeps.
                  </p>
                  <button
                    id="btn-start-evacuation-dialog"
                    onClick={() =>
                      setConfirmationDialog({
                        isOpen: true,
                        actionType: 'evacuation',
                        zone: activeAlert.zoneCode
                      })
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAlert.emergencyActions.evacuation
                        ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-800'
                        : 'bg-red-700 hover:bg-red-800 text-white shadow-2xs'
                    }`}
                  >
                    {activeAlert.emergencyActions.evacuation
                      ? 'Evacuation Active'
                      : 'Start Evacuation'}
                  </button>
                </div>
              </div>
            </div>

            {/* Operational Event History Log */}
            {activeAlert.rawAlert?.timeline && activeAlert.rawAlert.timeline.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Incident Action History & Activity Log
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeAlert.rawAlert.timeline.map((evt, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{evt.step}:</span>
                        <span className="text-slate-600 dark:text-slate-400">{evt.note}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">{evt.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================================================
                10. RESOLUTION
                ================================================== */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Resolve Incident Advisory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Execute once ground pore pressure dissipates, slope sensors stabilize, and field safety is certified.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeAlert.isResolved ? (
                  <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{activeAlert.resolvedMessage || 'Alert resolved by Authority.'}</span>
                  </div>
                ) : (
                  <button
                    id="btn-resolve-alert-bottom"
                    onClick={handleMarkResolved}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Alert as Resolved</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Quick Context & Cross-Navigation for Authority Officers */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Need full topographic contour layers, Doppler velocity vectors, or live bypass routes?
          </span>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('risk-map')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-2xs"
                >
                  View on Risk Map
                </button>
                <button
                  onClick={() => onNavigate('safe-routes')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Safe Routes
                </button>
                <button
                  onClick={() => onNavigate('authority-dashboard')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Authority Dashboard
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ==================================================
          CONFIRMATION DIALOG (Small Modal for Emergency Actions)
          ================================================== */}
      {confirmationDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {confirmationDialog.actionType === 'road_closure'
                    ? 'Confirm Road Closure Order'
                    : 'Confirm Emergency Evacuation Order'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to{' '}
                  {confirmationDialog.actionType === 'road_closure'
                    ? `initiate road closure for ${confirmationDialog.zone}`
                    : `start evacuation for ${confirmationDialog.zone}`}
                  ?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
              This action dispatches immediate regulatory notices to State Disaster Response Forces (SDRF), broadcasts urgent push alerts to the citizen mobile network, and flags the corridor as closed on Safe Routes.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-dialog-cancel"
                onClick={() => setConfirmationDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-dialog-confirm"
                onClick={handleConfirmEmergencyAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          BROADCAST NEW ALERT MODAL
          ================================================== */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Broadcast Emergency Alert
                  </h3>
                  <p className="text-xs text-slate-500">Issue an early warning bulletin across the North-East portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Advisory Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g. Critical Landslide Alert — NH-10 Teesta Gorge Corridor"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={broadcastForm.level}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, level: e.target.value as AlertLevel })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Emergency">Emergency (Critical)</option>
                    <option value="Warning">Warning (High)</option>
                    <option value="Watch">Watch (Moderate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    State *
                  </label>
                  <select
                    value={broadcastForm.state}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    {NER_STATES_LIST.filter((s) => s !== 'All States').map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Location / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.location}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, location: e.target.value })}
                    placeholder="e.g. Mangan / Chungthang"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Affected Road / Highway
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.affectedRoad}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, affectedRoad: e.target.value })}
                    placeholder="e.g. NH-10 Corridor"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Probability (%)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="99"
                    value={broadcastForm.probability}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, probability: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Rainfall (24h)
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.rainfall}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, rainfall: e.target.value })}
                    placeholder="95 mm / 24h"
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Soil Moisture
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.soilMoisture}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, soilMoisture: e.target.value })}
                    placeholder="78%"
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Recommended Public Action
                </label>
                <textarea
                  rows={2}
                  value={broadcastForm.recommendedAction}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, recommendedAction: e.target.value })}
                  placeholder="e.g. Restrict all night travel along highway. Heavy vehicles halt at Rangpo checkpost."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

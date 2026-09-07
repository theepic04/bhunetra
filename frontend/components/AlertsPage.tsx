import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Navigation,
  LifeBuoy,
  X,
  CheckCircle2,
  ShieldAlert,
  Droplets,
  CloudRain,
  Mountain,
  Eye,
  Check,
  Users,
  RefreshCw,
  Volume2,
  Search,
  Share2,
  CheckCheck,
  Filter,
  ArrowUpDown,
  Megaphone,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  History,
  Info
} from 'lucide-react';
import { useAlerts, UnifiedAlert, AlertLevel, ResponseTeamType, FieldVerificationStatus, ResponseActionType } from '../context/AlertsContext';

interface AlertsPageProps {
  onNavigate: (page: string) => void;
  onSelectZoneForMap?: (zoneId: string) => void;
  currentRole?: 'citizen' | 'authority' | 'superadmin';
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onNavigate,
  onSelectZoneForMap,
  currentRole = 'citizen'
}) => {
  const {
    alerts,
    activeAlerts,
    resolvedAlerts,
    markAsRead,
    markAllAsRead,
    unreadCount,
    acknowledgeAlert,
    assignResponseTeam,
    updateFieldVerification,
    setResponseAction,
    resolveAlert,
    showToast,
    // Dynamic Telemetry & Controls
    isSyncing,
    lastSyncedAt,
    syncLiveAlerts,
    speakAlert,
    stopSpeaking,
    isSpeaking,
    broadcastNewAlert
  } = useAlerts();

  // Local state for UI filtering & modal
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Emergency' | 'Warning' | 'Watch'>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'urgency' | 'recent' | 'location' | 'rainfall'>('urgency');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [activeModalAlert, setActiveModalAlert] = useState<UnifiedAlert | null>(null);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);
  const [speakingAlertId, setSpeakingAlertId] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);

  // Broadcast Modal form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    level: 'Warning' as AlertLevel,
    state: 'Sikkim',
    location: '',
    district: '',
    affectedRoad: '',
    probability: 72,
    rainfall: '95 mm / 24h',
    soilMoisture: '78%',
    slope: '38°',
    expectedTime: 'Next 6–12 Hours',
    cause: 'Intensive monsoon precipitation triggering surface pore saturation.',
    recommendedAction: 'Restrict vehicular movement. Heavy vehicle diversion in effect.'
  });

  // Available states in North-East Region
  const nerStates = [
    'All',
    'Sikkim',
    'Arunachal Pradesh',
    'Assam',
    'Meghalaya',
    'Manipur',
    'Mizoram',
    'Nagaland',
    'Tripura'
  ];

  // Dynamic filter & search logic
  const filteredActiveAlerts = useMemo(() => {
    let list = [...activeAlerts];

    // 1. Severity filter
    if (selectedFilter !== 'All') {
      list = list.filter((a) => a.level === selectedFilter);
    }

    // 2. State filter
    if (selectedState !== 'All') {
      list = list.filter((a) => a.state.toLowerCase() === selectedState.toLowerCase());
    }

    // 3. Search query (matches title, location, road, ID, cause, district)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          (a.affectedRoad && a.affectedRoad.toLowerCase().includes(q)) ||
          a.id.toLowerCase().includes(q) ||
          a.cause.toLowerCase().includes(q) ||
          (a.district && a.district.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === 'urgency') {
        const rank: Record<AlertLevel, number> = {
          Emergency: 4,
          Warning: 3,
          Watch: 2,
          Normal: 1
        };
        if (rank[b.level] !== rank[a.level]) {
          return rank[b.level] - rank[a.level];
        }
        return b.probability - a.probability;
      }
      if (sortBy === 'rainfall') {
        const rainA = parseFloat(a.rainfall) || 0;
        const rainB = parseFloat(b.rainfall) || 0;
        return rainB - rainA;
      }
      if (sortBy === 'location') {
        return a.location.localeCompare(b.location);
      }
      // 'recent'
      return (b.id || '').localeCompare(a.id || '');
    });

    return list;
  }, [activeAlerts, selectedFilter, selectedState, searchQuery, sortBy]);

  const handleOpenDetails = (alert: UnifiedAlert) => {
    setActiveModalAlert(alert);
    if (!alert.isRead) {
      markAsRead(alert.id);
    }
  };

  const handleViewLocation = (zoneId?: string) => {
    if (zoneId && onSelectZoneForMap) {
      onSelectZoneForMap(zoneId);
    }
    onNavigate('risk-map');
  };

  const handleCopyAlert = (alert: UnifiedAlert, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const alertLvl = (alert?.level || 'ALERT').toUpperCase();
    const text = `🚨 BHUNETRA EARLY WARNING [${alertLvl}]
Location: ${alert.location}, ${alert.state} ${alert.affectedRoad ? `(${alert.affectedRoad})` : ''}
Risk Probability: ${alert.probability}% | Timeframe: ${alert.expectedTime}
Trigger: ${alert.cause}
Action Required: ${alert.recommendedAction}
Official Telemetry Link: https://bhunetra.ner.gov.in`;

    navigator.clipboard?.writeText(text);
    setCopiedAlertId(alert.id);
    showToast(`Alert advisory ${alert.id} copied to clipboard for dispatch.`);
    setTimeout(() => {
      setCopiedAlertId((current) => (current === alert.id ? null : current));
    }, 2800);
  };

  const handleSpeakToggle = (alert: UnifiedAlert, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSpeaking && speakingAlertId === alert.id) {
      stopSpeaking();
      setSpeakingAlertId(null);
    } else {
      setSpeakingAlertId(alert.id);
      speakAlert(alert);
    }
  };

  const handleAcknowledge = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    acknowledgeAlert(id);
  };

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
      affectedRoad: broadcastForm.affectedRoad || 'State Arterial Highway',
      probability: Number(broadcastForm.probability) || 75,
      rainfall: broadcastForm.rainfall,
      soilMoisture: broadcastForm.soilMoisture,
      slope: broadcastForm.slope,
      expectedTime: broadcastForm.expectedTime,
      cause: broadcastForm.cause,
      recommendedAction: broadcastForm.recommendedAction,
      broadcastChannels: ['Public Portal', 'CAP SMS', 'WhatsApp Bot', 'NER Emergency Radio']
    });

    if (success) {
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: '',
        level: 'Warning',
        state: 'Sikkim',
        location: '',
        district: '',
        affectedRoad: '',
        probability: 72,
        rainfall: '95 mm / 24h',
        soilMoisture: '78%',
        slope: '38°',
        expectedTime: 'Next 6–12 Hours',
        cause: 'Intensive monsoon precipitation triggering surface pore saturation.',
        recommendedAction: 'Restrict vehicular movement. Heavy vehicle diversion in effect.'
      });
    }
  };

  const getLevelBadge = (level: AlertLevel) => {
    switch (level) {
      case 'Emergency':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wide uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>🔴 EMERGENCY</span>
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-black tracking-wide uppercase shadow-xs">
            <span>🟠 WARNING</span>
          </span>
        );
      case 'Watch':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black tracking-wide uppercase shadow-xs">
            <span>🟡 WATCH</span>
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black tracking-wide uppercase shadow-xs">
            <span>🟢 NORMAL</span>
          </span>
        );
    }
  };

  const getBorderClass = (level: AlertLevel) => {
    switch (level) {
      case 'Emergency':
        return 'border-2 border-red-500 hover:border-red-600 shadow-sm';
      case 'Warning':
        return 'border-2 border-orange-400 hover:border-orange-500 shadow-2xs';
      case 'Watch':
        return 'border border-amber-300 dark:border-amber-700/60 hover:border-amber-400 shadow-2xs';
      case 'Normal':
        return 'border border-emerald-300 dark:border-emerald-700/60 shadow-2xs';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ==================================================
            1. PAGE HEADER & LIVE TELEMETRY STATUS
            ================================================== */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Alerts & Warnings
              </h1>
              {/* Dynamic Active Count */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span>{activeAlerts.length} Active Warnings</span>
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Live multi-hazard early warning telemetry calculated from IMD Doppler radar, ISRO DEM, and slope pore sensors.
            </p>
          </div>

          {/* Quick Route / Emergency Jump */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="alerts-find-safe-route-header-btn"
              onClick={() => onNavigate('safe-routes')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Find Safe Route</span>
            </button>
            <button
              id="alerts-emergency-help-header-btn"
              onClick={() => onNavigate('emergency')}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            2. LIVE TELEMETRY CONTROL BAR (DYNAMIC SYNC & TOOLS)
            ================================================== */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Telemetry Status */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isSyncing ? 'bg-amber-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <div className="text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>IMD Doppler & DEM Feed:</span>
                <span className={isSyncing ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {isSyncing ? 'Synchronizing Sensors...' : 'Live Stream Active'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Last refreshed: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastSyncedAt}</span>
              </div>
            </div>
          </div>

          {/* Action Tools: Refresh, Authority Broadcast */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Live Telemetry */}
            <button
              id="alerts-refresh-telemetry-btn"
              onClick={() => syncLiveAlerts(true)}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Poll live precipitation and topography updates"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Refresh Feed'}</span>
            </button>

            {/* Broadcast New Advisory (Authority / Admin) */}
            {(currentRole === 'authority' || currentRole === 'superadmin') && (
              <button
                id="alerts-broadcast-btn"
                onClick={() => setShowBroadcastModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>+ Broadcast Advisory</span>
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            3. VIEW TABS & MONITORED LOCATION INDICATOR
            ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-1">
            <button
              id="alerts-tab-active-btn"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Active Warnings ({activeAlerts.length})</span>
            </button>
            <button
              id="alerts-tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-emerald-500" />
              <span>Archived Logs ({resolvedAlerts.length})</span>
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="px-3">
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            </div>
          )}
        </div>

        {/* ==================================================
            4. DYNAMIC SEARCH, REGION & SORTING BAR
            ================================================== */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="alerts-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by highway (e.g. NH-10), location, zone, or trigger..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* State & Sort Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* State selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    id="alerts-state-filter"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden cursor-pointer"
                  >
                    {nerStates.map((st) => (
                      <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {st === 'All' ? 'All NER States' : st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    id="alerts-sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden cursor-pointer"
                  >
                    <option value="urgency" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Sort: Urgency (Highest Risk)
                    </option>
                    <option value="rainfall" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Sort: Rainfall (Highest mm)
                    </option>
                    <option value="recent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Sort: Newest Telemetry
                    </option>
                    <option value="location" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Sort: Location (A–Z)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Filter by Severity:</span>
                {(['All', 'Emergency', 'Warning', 'Watch'] as const).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  const count =
                    filter === 'All'
                      ? activeAlerts.length
                      : activeAlerts.filter((a) => a.level === filter).length;

                  return (
                    <button
                      key={filter}
                      id={`filter-${filter.toLowerCase()}-btn`}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{filter}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Active hazard threshold: <span className="font-bold text-amber-600 dark:text-amber-400">≥30% (Watch / Warning / Emergency)</span>
              </div>
            </div>

            {/* ==================================================
                5. DYNAMIC ALERTS LIST
                ================================================== */}
            {filteredActiveAlerts.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Active Warnings Matching Filters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Sensors report normal stability for the selected region and search query.
                </p>
                <button
                  onClick={() => {
                    setSelectedFilter('All');
                    setSelectedState('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActiveAlerts.map((alert) => {
                  const isEmergency = alert.level === 'Emergency';
                  const isWarning = alert.level === 'Warning';
                  const isAcknowledged = alert.currentStep === 'Acknowledged' || alert.timeline.some((t) => t.step === 'Acknowledged');
                  const isItemSpeaking = isSpeaking && speakingAlertId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      id={`alert-card-${alert.id}`}
                      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 transition-all duration-200 ${getBorderClass(
                        alert.level
                      )}`}
                    >
                      {/* Top Bar: Level, ID, Badge, Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getLevelBadge(alert.level)}

                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold">
                            {alert.id}
                          </span>

                          {alert.isCurrentArea && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                              📍 Monitored Local Area
                            </span>
                          )}

                          {!alert.isRead && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              New
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{alert.timestamp}</span>
                          </span>

                          {/* Dynamic Workflow Step Pill */}
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] uppercase tracking-wide ${
                              alert.currentStep === 'Action Taken'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : alert.currentStep === 'Team Assigned'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : alert.currentStep === 'Acknowledged'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {alert.currentStep}
                          </span>
                        </div>
                      </div>

                      {/* Main Title & Affected Highway */}
                      <div className="mt-3">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {alert.title}
                        </h2>
                        {alert.affectedRoad && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            Strategic Corridor: <span className="font-bold text-slate-800 dark:text-slate-200">{alert.affectedRoad}</span>
                          </p>
                        )}
                      </div>

                      {/* Metrics Grid: Location, Probability, Expected, Slope/Rainfall */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {/* Location */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Location
                          </span>
                          <div className="text-sm font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </div>
                        </div>

                        {/* Landslide Probability */}
                        <div
                          className={`p-3 rounded-xl border ${
                            isEmergency
                              ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                              : isWarning
                              ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50'
                              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                            Risk Probability
                          </span>
                          <div
                            className={`text-2xl font-black mt-0.5 ${
                              isEmergency
                                ? 'text-red-600 dark:text-red-400'
                                : isWarning
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {alert.probability}%
                          </div>
                        </div>

                        {/* Expected Window */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Prediction Window
                          </span>
                          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{alert.expectedTime}</span>
                          </div>
                        </div>

                        {/* Cause / Slope / Rain */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Slope / Rainfall
                          </span>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 leading-snug">
                            {alert.slope} • {alert.rainfall}
                          </div>
                        </div>
                      </div>

                      {/* Recommended Safety Action Box */}
                      <div
                        className={`p-3.5 rounded-xl border mt-3 flex items-start gap-2.5 ${
                          isEmergency
                            ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-200'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm font-medium leading-relaxed">
                          <span className="font-bold">Recommended Safety Action: </span>
                          <span>{alert.recommendedAction}</span>
                        </div>
                      </div>

                      {/* Authority status badge if team is assigned */}
                      {alert.assignedTeam && (
                        <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs flex flex-wrap items-center justify-between gap-2 text-blue-900 dark:text-blue-200">
                          <span className="font-bold flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Assigned Response: {alert.assignedTeam}</span>
                          </span>
                          {alert.responseAction !== 'No Action' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[11px]">
                              Active Action: {alert.responseAction}
                            </span>
                          )}
                        </div>
                      )}

                      {/* ==================================================
                          CARD ACTIONS FOOTER (FULLY FUNCTIONAL CONTROLS)
                          ================================================== */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Left Group: Details & Interactive Audio Listen */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            id={`alert-details-btn-${alert.id}`}
                            onClick={() => handleOpenDetails(alert)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Full Details</span>
                          </button>

                          {/* Interactive TTS Audio Reader */}
                          <button
                            id={`alert-listen-btn-${alert.id}`}
                            onClick={(e) => handleSpeakToggle(alert, e)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isItemSpeaking
                                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 animate-pulse'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                            title="Listen to official audio broadcast readout"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isItemSpeaking ? 'text-amber-600' : 'text-slate-500'}`} />
                            <span>{isItemSpeaking ? 'Stop Reading' : 'Listen'}</span>
                          </button>

                          {/* Share / Copy Emergency Text */}
                          <button
                            id={`alert-share-btn-${alert.id}`}
                            onClick={(e) => handleCopyAlert(alert, e)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Copy alert dispatch text to clipboard"
                          >
                            {copiedAlertId === alert.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 dark:text-emerald-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Share</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Right Group: Acknowledge & Navigation */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Acknowledge Button */}
                          {isAcknowledged ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acknowledged</span>
                            </span>
                          ) : (
                            <button
                              id={`alert-acknowledge-btn-${alert.id}`}
                              onClick={(e) => handleAcknowledge(alert.id, e)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acknowledge Warning</span>
                            </button>
                          )}

                          {/* View Location on 2.5D Risk Map */}
                          <button
                            id={`alert-view-location-btn-${alert.id}`}
                            onClick={() => handleViewLocation(alert.zoneId)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>View on Map</span>
                          </button>

                          {/* Find Safe Route */}
                          <button
                            id={`alert-safe-route-btn-${alert.id}`}
                            onClick={() => onNavigate('safe-routes')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Safe Route</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            6. ARCHIVED ALERTS & RESOLVED LOGS VIEW
            ================================================== */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Alert History & Resolved Logs</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chronological log of verified, managed, and resolved landslide advisories across all monitored sectors.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                Total Logs: {resolvedAlerts.length}
              </span>
            </div>

            {resolvedAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
                No archived alerts in this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Alert ID</th>
                      <th className="py-2.5 px-3">Location & Corridor</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Resolution Note</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {resolvedAlerts.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.location}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.state}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.level} ({item.probability}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {item.resolutionNote || 'All clear verified.'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Resolved</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            id={`history-view-btn-${item.id}`}
                            onClick={() => handleOpenDetails(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quick Navigation Footer Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-600 dark:text-slate-400 text-center sm:text-left">
            <span className="font-bold text-slate-800 dark:text-slate-200">Need real-time safe navigation?</span> Safe routes dynamically calculate detours avoiding all active red/orange hazard zones.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('safe-routes')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Safe Routes
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Emergency SOS
            </button>
          </div>
        </div>

      </div>

      {/* ==================================================
          7. COMPLETE DETAILS MODAL (9 PARAMETERS + INTERACTIVE CONTROLS)
          ================================================== */}
      {activeModalAlert && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Telemetry Alert Dossier
                  </span>
                  {getLevelBadge(activeModalAlert.level)}
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {activeModalAlert.id}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {activeModalAlert.title}
                </h3>
              </div>
              <button
                id="alert-modal-close-btn"
                onClick={() => setActiveModalAlert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close details modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec Fields (9 mandatory parameters) */}
            <div className="space-y-3 text-xs">
              {/* Top Details Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Alert Level */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Alert Level
                  </span>
                  <span
                    className={`text-sm font-black mt-0.5 block ${
                      activeModalAlert.level === 'Emergency'
                        ? 'text-red-600 dark:text-red-400'
                        : activeModalAlert.level === 'Warning'
                        ? 'text-orange-600 dark:text-orange-400'
                        : activeModalAlert.level === 'Watch'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {(activeModalAlert.level || 'ALERT').toUpperCase()}
                  </span>
                </div>

                {/* 2. Location */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Location & State
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {activeModalAlert.location}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {activeModalAlert.state} • Zone: {activeModalAlert.zoneId}
                  </span>
                </div>

                {/* 3. Risk Probability */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Risk Probability
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {activeModalAlert.probability}%
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          activeModalAlert.probability >= 80
                            ? 'bg-red-600'
                            : activeModalAlert.probability >= 60
                            ? 'bg-orange-500'
                            : activeModalAlert.probability >= 30
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${activeModalAlert.probability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 4. Prediction Window */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Prediction Window
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{activeModalAlert.expectedTime}</span>
                  </span>
                </div>

                {/* 5. Rainfall Accumulation */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Rainfall Accumulation
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span>{activeModalAlert.rainfall}</span>
                  </span>
                </div>

                {/* 6. Soil Moisture */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Soil Saturation
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>{activeModalAlert.soilMoisture}</span>
                  </span>
                </div>

                {/* 7. Terrain Slope */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Terrain Slope Angle
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-amber-600" />
                    <span>{activeModalAlert.slope}</span>
                  </span>
                </div>

                {/* 8. Timestamp */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Telemetry Timestamp
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {activeModalAlert.timestamp}
                  </span>
                </div>
              </div>

              {/* Status & Cause */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Workflow Lifecycle:</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {activeModalAlert.isResolved ? 'Resolved' : activeModalAlert.currentStep}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Geological Trigger: </span>
                  <span>{activeModalAlert.cause}</span>
                </div>
              </div>

              {/* 9. Recommended Safety Action */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  Recommended Safety Action
                </span>
                <p className="leading-relaxed font-semibold">
                  {activeModalAlert.recommendedAction}
                </p>
              </div>

              {/* Audio Reader Inside Modal */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Voice Advisory:</span>
                </div>
                <button
                  onClick={() => handleSpeakToggle(activeModalAlert)}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isSpeaking && speakingAlertId === activeModalAlert.id ? 'Stop Voice' : 'Play Voice Broadcast'}
                </button>
              </div>

              {/* Resolution Note if resolved */}
              {activeModalAlert.isResolved && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                  <span className="font-bold block">Resolution Notice:</span>
                  <span>{activeModalAlert.resolutionNote || 'Hazard evaluated and cleared by Disaster Management cell.'}</span>
                </div>
              )}
            </div>

            {/* Modal Navigation & Quick Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                id="modal-copy-dispatch-btn"
                onClick={() => handleCopyAlert(activeModalAlert)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text Dispatch</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* View on Risk Map */}
                <button
                  id="modal-view-risk-map-btn"
                  onClick={() => {
                    setActiveModalAlert(null);
                    handleViewLocation(activeModalAlert.zoneId);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>View on Map</span>
                </button>

                {/* Find Safe Route */}
                <button
                  id="modal-find-safe-route-btn"
                  onClick={() => {
                    setActiveModalAlert(null);
                    onNavigate('safe-routes');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Safe Route</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          8. BROADCAST EMERGENCY ADVISORY MODAL (AUTHORITY)
          ================================================== */}
      {showBroadcastModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>Broadcast CAP Emergency Advisory</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dispatches an official multi-hazard alert to portal users, CAP SMS, and emergency responders.
                </p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Advisory Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  placeholder="e.g. Critical Debris Flow Warning on NH-10 Corridor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={broadcastForm.level}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, level: e.target.value as AlertLevel })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="Emergency">🔴 Emergency</option>
                    <option value="Warning">🟠 Warning</option>
                    <option value="Watch">🟡 Watch</option>
                    <option value="Normal">🟢 Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    State *
                  </label>
                  <select
                    value={broadcastForm.state}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    {nerStates.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.location}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, location: e.target.value })}
                    placeholder="e.g. Mangan, North Sikkim"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Affected Corridor / Highway
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.affectedRoad}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, affectedRoad: e.target.value })}
                    placeholder="e.g. NH-10 (Km 42–48)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Risk Probability ({broadcastForm.probability}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="99"
                    value={broadcastForm.probability}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, probability: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prediction Window
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.expectedTime}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, expectedTime: e.target.value })}
                    placeholder="e.g. Next 6–12 Hours"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trigger / Geological Cause
                </label>
                <input
                  type="text"
                  value={broadcastForm.cause}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, cause: e.target.value })}
                  placeholder="e.g. Cumulative rainfall exceeding 110mm on 42° slope."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Safety Advisory *
                </label>
                <textarea
                  rows={2}
                  required
                  value={broadcastForm.recommendedAction}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, recommendedAction: e.target.value })}
                  placeholder="e.g. Evacuate roadside structures immediately. Use alternative route via Namchi."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Transmit Advisory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

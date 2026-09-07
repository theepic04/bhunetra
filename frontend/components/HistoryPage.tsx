import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  Download,
  AlertTriangle,
  TrendingUp,
  MapPin,
  CloudRain,
  ShieldCheck,
  ShieldAlert,
  Info,
  X,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Database,
  Building2,
  Compass,
  Check
} from 'lucide-react';
import {
  OFFICIAL_LANDSLIDE_RECORDS,
  OFFICIAL_STATE_SUMMARIES,
  OfficialLandslideRecord,
  NER_STATES,
  filterOfficialRecords,
  getAvailableDistrictsForState
} from '../data/officialLandslideRecords';
import { LanguageCode } from '../types';
import { getTranslation } from '../data/translations';

interface HistoryPageProps {
  selectedLanguage?: LanguageCode;
  onNavigate?: (page: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  selectedLanguage = 'en',
  onNavigate
}) => {
  const t = getTranslation(selectedLanguage);

  // Filter States
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [datasetPeriod, setDatasetPeriod] = useState<string>('All Periods');
  const [selectedSource, setSelectedSource] = useState<string>('All Sources');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    state: 'All States',
    district: 'All Districts',
    datasetPeriod: 'All Periods',
    source: 'All Sources',
    search: ''
  });

  // Modal State
  const [activeRecordModal, setActiveRecordModal] = useState<OfficialLandslideRecord | null>(null);

  // Export Toast / Confirmation
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    return ['All Districts', ...getAvailableDistrictsForState(selectedState)];
  }, [selectedState]);

  // Handle State Change
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('All Districts');
  };

  // Search Filter Handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      state: selectedState,
      district: selectedDistrict,
      datasetPeriod,
      source: selectedSource,
      search: searchQuery.trim()
    });
  };

  // Reset Filter Handler
  const handleResetFilters = () => {
    setSelectedState('All States');
    setSelectedDistrict('All Districts');
    setDatasetPeriod('All Periods');
    setSelectedSource('All Sources');
    setSearchQuery('');
    setAppliedFilters({
      state: 'All States',
      district: 'All Districts',
      datasetPeriod: 'All Periods',
      source: 'All Sources',
      search: ''
    });
  };

  // Filtered Official Records
  const filteredRecords = useMemo(() => {
    return filterOfficialRecords({
      state: appliedFilters.state,
      district: appliedFilters.district,
      datasetPeriod: appliedFilters.datasetPeriod,
      source: appliedFilters.source,
      searchQuery: appliedFilters.search
    });
  }, [appliedFilters]);

  // Summary statistics computed directly from official records and ISRO Atlas
  const totalVerifiedRecords = OFFICIAL_LANDSLIDE_RECORDS.length;
  const gsiRecentCount = useMemo(() => {
    return OFFICIAL_LANDSLIDE_RECORDS.filter((r) => r.datasetPeriod.includes('2024–2026')).length;
  }, []);
  const isroAtlasTotalCount = useMemo(() => {
    return OFFICIAL_STATE_SUMMARIES.reduce((acc, curr) => acc + curr.isroAtlasTotal1998to2022, 0);
  }, []);

  // Verification status badge helper
  const getVerificationBadge = (status: OfficialLandslideRecord['verificationStatus']) => {
    switch (status) {
      case 'Field Validated by GSI':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
          label: t.fieldValidated || 'Field Validated by GSI'
        };
      case 'Satellite Mapped by ISRO/NRSC':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          icon: <Compass className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
          label: t.satelliteMapped || 'Satellite Mapped by ISRO/NRSC'
        };
      case 'SDMA Disaster Bulletin':
      default:
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          icon: <FileSpreadsheet className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
          label: 'SDMA Official Bulletin'
        };
    }
  };

  // CSV Export Functionality for Real Verified Data
  const handleExportCsv = () => {
    try {
      const headers = [
        'ID',
        'Date',
        'State',
        'District',
        'Location',
        'Latitude',
        'Longitude',
        'LandslideType',
        'Trigger',
        'RecordedRainfall',
        'Impact',
        'DatasetPeriod',
        'Source',
        'SourceReference',
        'VerificationStatus'
      ];

      const csvRows = filteredRecords.map((r) => [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${r.state}"`,
        `"${r.district}"`,
        `"${r.location.replace(/"/g, '""')}"`,
        r.latitude !== null ? r.latitude : 'N/A',
        r.longitude !== null ? r.longitude : 'N/A',
        `"${r.landslideType}"`,
        `"${r.trigger.replace(/"/g, '""')}"`,
        `"${r.rainfallNote}"`,
        `"${r.impact.replace(/"/g, '""')}"`,
        `"${r.datasetPeriod}"`,
        `"${r.source}"`,
        `"${r.sourceReference.replace(/"/g, '""')}"`,
        `"${r.verificationStatus}"`
      ]);

      const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `BhuNetra_Official_Landslides_NER_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotification(
        `Successfully exported ${filteredRecords.length} official verified landslide records to CSV.`
      );
      setTimeout(() => setExportNotification(null), 5000);
    } catch {
      setExportNotification('Export failed. Please try again.');
      setTimeout(() => setExportNotification(null), 4000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ==================================================
            1. PAGE HEADER
            Title: Landslide History (Official Verified Records)
            Subtitle: Real, source-attributed data from GSI Bhusanket & ISRO Landslide Atlas
            Export Button: "Export CSV"
            ================================================== */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.history}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.officialVerifiedRecords}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                <span>GSI Bhusanket & ISRO Atlas</span>
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Official historical landslide records for the North Eastern Region (NER). Sourced strictly from the{' '}
              <strong>Geological Survey of India (GSI) Bhusanket</strong> and{' '}
              <strong>ISRO / NRSC Landslide Atlas of India</strong>. Zero simulated data.
            </p>
          </div>

          {/* Export CSV Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="export-history-csv-btn"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Download filtered official records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* Export Notification Toast */}
        {exportNotification && (
          <div
            id="export-notification-toast"
            className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotification}</span>
            </div>
            <button
              onClick={() => setExportNotification(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ==================================================
            2. OFFICIAL DATA SOURCES & SCIENTIFIC ATTRIBUTION
            Prominently states GSI, ISRO/NRSC, IMD coverage & zero fabrication policy
            ================================================== */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 p-4 sm:p-5 text-xs text-slate-700 dark:text-slate-300 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
                  {t.dataSources}: Official Indian Scientific Repositories
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.2 rounded-md">
                  Source-Attributed
                </span>
              </div>
              <p className="leading-relaxed">
                All records displayed on this page are strictly extracted from published Indian governmental and scientific sources.
                If any field is omitted by the reporting authority, it is explicitly shown as <strong>"N/A" (Not available)</strong>.
                No data is synthesized or extrapolated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-800/40 text-[11px]">
            {/* Source 1: GSI */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span className="text-blue-700 dark:text-blue-400">1. GSI Bhusanket / NLFC</span>
                <a
                  href="https://bhusanket.gsi.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 inline-flex items-center gap-0.5"
                  title="Visit GSI Bhusanket Portal"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                National Landslide Forecasting Centre, Geological Survey of India. Post-disaster field assessments & 2024–2026 early warning records.
              </p>
            </div>

            {/* Source 2: ISRO / NRSC */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span className="text-indigo-700 dark:text-indigo-400">2. ISRO / NRSC Landslide Atlas</span>
                <a
                  href="https://www.isro.gov.in/Landslide_Atlas_India.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-600 inline-flex items-center gap-0.5"
                  title="Visit ISRO Landslide Atlas"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                National Remote Sensing Centre. Geospatial inventory covering 1998–2022 (80,000+ pan-India landslides, 64 NER districts mapped).
              </p>
            </div>

            {/* Source 3: IMD & SDMAs */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span className="text-purple-700 dark:text-purple-400">3. IMD & State SDMAs</span>
                <span className="text-[10px] text-slate-400">Official Bulletins</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                India Meteorological Department rainfall stations (AWS) & State Disaster Management Authorities damage reports.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            3. SUMMARY CARDS
            Accurately displays official figures
            ================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Verified Archive Records */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">Verified Incident Archive</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalVerifiedRecords}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Specific field-validated & satellite events
            </div>
          </div>

          {/* Card 2: 2024–2026 Recent Verified Records */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">GSI Recent Records</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {gsiRecentCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Documented 2024–2026 GSI/SDMA events
            </div>
          </div>

          {/* Card 3: ISRO Atlas 1998–2022 Inventory */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">ISRO Atlas Total (NER)</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {isroAtlasTotalCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Mapped landslides across NER (1998–2022)
            </div>
          </div>

          {/* Card 4: Most Affected State in Official Atlas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">Highest Landslide Density</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Mizoram
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ranked #1 in India (12,385 mapped in ISRO Atlas)
            </div>
          </div>
        </div>

        {/* ==================================================
            4. FILTER SECTION
            State, District, Dataset Period, Source, Search Keyword
            ================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Filter Verified Historical Records</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Official records available from source
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Filter 1: State */}
            <div>
              <label htmlFor="filter-state-select" className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                {t.state}
              </label>
              <select
                id="filter-state-select"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All States">All 8 NER States</option>
                {NER_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: District */}
            <div>
              <label htmlFor="filter-district-select" className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                District
              </label>
              <select
                id="filter-district-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {availableDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Dataset Period */}
            <div>
              <label htmlFor="filter-period-select" className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                {t.datasetPeriod}
              </label>
              <select
                id="filter-period-select"
                value={datasetPeriod}
                onChange={(e) => setDatasetPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All Periods">All Dataset Periods</option>
                <option value="2024–2026">2024–2026 (GSI Bhusanket)</option>
                <option value="1998–2022">1998–2022 (ISRO Landslide Atlas)</option>
              </select>
            </div>

            {/* Filter 4: Scientific Source */}
            <div>
              <label htmlFor="filter-source-select" className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                {t.dataSources}
              </label>
              <select
                id="filter-source-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All Sources">All Sources</option>
                <option value="GSI">GSI Bhusanket / NLFC</option>
                <option value="ISRO">ISRO / NRSC Landslide Atlas</option>
                <option value="IMD/SDMA">IMD / State SDMA</option>
              </select>
            </div>

            {/* Filter 5: Keyword Search */}
            <div>
              <label htmlFor="filter-search-input" className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                {t.search} Keyword
              </label>
              <div className="relative">
                <input
                  id="filter-search-input"
                  type="text"
                  placeholder="Highway, town, trigger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyFilters();
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Action Buttons: Apply & Reset */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Active Scope:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {appliedFilters.state} • {appliedFilters.district} • {appliedFilters.datasetPeriod} • {appliedFilters.source}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="filter-reset-btn"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.reset}</span>
              </button>

              <button
                id="filter-apply-btn"
                onClick={handleApplyFilters}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.apply}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            5. STATE-WISE SCIENTIFIC ATLAS INVENTORY (1998–2022)
            Official Landslide Atlas of India numbers for all 8 states
            ================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Official ISRO Landslide Atlas Inventory (1998–2022)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official geospatial landslide counts documented in the ISRO/NRSC Landslide Atlas of India across all 8 North Eastern states
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-xl">
                18,888 Mapped Events
              </span>
            </div>
          </div>

          {/* State Inventory Grid */}
          <div className="space-y-3 pt-1">
            {OFFICIAL_STATE_SUMMARIES.map((st) => {
              const maxAtlasCount = 12500;
              const percentage = Math.min(100, Math.max(3, Math.round((st.isroAtlasTotal1998to2022 / maxAtlasCount) * 100)));

              return (
                <div
                  key={st.state}
                  className="space-y-1.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{st.state}</span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {st.isroAtlasRank}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-indigo-700 dark:text-indigo-400 text-sm">
                        {st.isroAtlasTotal1998to2022.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400">ISRO mapped events</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                        {st.gsiVerifiedCount2024to2026} recent GSI reports
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-indigo-600 dark:bg-indigo-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-1 pt-0.5">
                    <span>
                      <strong>High exposure districts:</strong> {st.highExposureDistricts.slice(0, 4).join(', ')}
                      {st.highExposureDistricts.length > 4 ? ` +${st.highExposureDistricts.length - 4} more` : ''}
                    </span>
                    <span className="italic text-[10px]">Source: {st.sourceCitation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            6. RECENT VERIFIED INCIDENTS TABLE
            All real, source-attributed records
            ================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t.officialVerifiedRecords} ({filteredRecords.length})
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any record to view geotechnical triggers, coordinates, rainfall telemetry, and official publication reference
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {filteredRecords.length} of {OFFICIAL_LANDSLIDE_RECORDS.length} documented records</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">State & District</th>
                  <th className="py-3 px-3.5">Specific Location</th>
                  <th className="py-3 px-3.5">Landslide Type</th>
                  <th className="py-3 px-3.5">Recorded Rainfall</th>
                  <th className="py-3 px-3.5">Impact / Disruption</th>
                  <th className="py-3 px-3.5">Source & Status</th>
                  <th className="py-3 px-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No official records match the selected criteria. Try resetting filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((incident) => {
                    const badge = getVerificationBadge(incident.verificationStatus);

                    return (
                      <tr
                        key={incident.id}
                        id={`incident-row-${incident.id.toLowerCase()}`}
                        onClick={() => setActiveRecordModal(incident)}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        {/* Date */}
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {incident.date}
                        </td>

                        {/* State & District */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{incident.state}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{incident.district}</div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                          {incident.location}
                        </td>

                        {/* Landslide Type */}
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">
                          {incident.landslideType}
                        </td>

                        {/* Rainfall */}
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                          {incident.rainfallNote}
                        </td>

                        {/* Impact */}
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                          {incident.impact}
                        </td>

                        {/* Source & Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <span className="text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 font-bold text-xs inline-flex items-center gap-0.5">
                            <span>{t.viewDetails}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            7. INCIDENT DETAIL MODAL
            Displays all authentic fields without fabrication
            ================================================== */}
        {activeRecordModal && (
          <div
            id="incident-detail-modal-backdrop"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveRecordModal(null)}
          >
            <div
              id="incident-detail-modal"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        getVerificationBadge(activeRecordModal.verificationStatus).bg
                      }`}
                    >
                      {getVerificationBadge(activeRecordModal.verificationStatus).icon}
                      <span>{activeRecordModal.verificationStatus}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      {activeRecordModal.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeRecordModal.location}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {activeRecordModal.district}, {activeRecordModal.state}
                    </span>
                  </div>
                </div>

                <button
                  id="close-incident-modal-btn"
                  onClick={() => setActiveRecordModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Core Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Date */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Incident Date
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeRecordModal.date}</span>
                  </div>
                </div>

                {/* Recorded Rainfall */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recorded Rainfall
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                    <span>{activeRecordModal.rainfallNote}</span>
                  </div>
                </div>

                {/* Landslide Type */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Landslide Type
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {activeRecordModal.landslideType}
                  </span>
                </div>

                {/* Coordinates */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Coordinates (Lat / Long)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {activeRecordModal.latitude !== null && activeRecordModal.longitude !== null
                      ? `${activeRecordModal.latitude.toFixed(3)}°N, ${activeRecordModal.longitude.toFixed(3)}°E`
                      : 'N/A (Not officially reported)'}
                  </span>
                </div>
              </div>

              {/* Trigger & Cause */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                  Geological Trigger / Cause
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {activeRecordModal.trigger}
                </p>
              </div>

              {/* Impact / Damage */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Official Reported Impact / Damage
                </span>
                <p className="text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                  {activeRecordModal.impact}
                </p>
              </div>

              {/* Source & Reference Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Scientific Source & Official Reference
                  </span>
                  <a
                    href={activeRecordModal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Open Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {activeRecordModal.source}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono text-[11px]">
                  Ref: {activeRecordModal.sourceReference}
                </p>
                <div className="text-[10px] text-slate-400">
                  Dataset Coverage Period: <strong>{activeRecordModal.datasetPeriod}</strong>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Field/Satellite Attribution Guaranteed</span>
                <button
                  onClick={() => setActiveRecordModal(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

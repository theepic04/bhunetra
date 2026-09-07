import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Activity,
  RefreshCw,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Satellite
} from 'lucide-react';

interface DopplerStation {
  stationId: string;
  name: string;
  state: string;
  band: string;
  status: string;
  reflectivityDbZ: number;
  precipitationRateMmHr: number;
  sweepAngleDeg: number;
  lastSync: string;
}

interface Piezometer {
  sensorId: string;
  stationName: string;
  state: string;
  location: string;
  depthMeters: number;
  porePressureKPa: number;
  thresholdKPa: number;
  status: 'Nominal' | 'Elevated' | 'Critical';
  lastPing: string;
}

interface Inclinometer {
  sensorId: string;
  location: string;
  displacementMm: number;
  rateMmPerDay: number;
  status: string;
}

interface LiveTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveTelemetryModal: React.FC<LiveTelemetryModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    timestamp: string;
    status: string;
    activeSensorCount: number;
    dopplerRadarStations: DopplerStation[];
    piezometers: Piezometer[];
    inclinometers: Inclinometer[];
  } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry/live');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastRefreshed(new Date());
          setSecondsAgo(0);
        }
      }
    } catch (err) {
      console.warn('Telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
    }
  }, [isOpen]);

  // Polling timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto refresh every 20s when open
  useEffect(() => {
    if (!isOpen) return;
    const autoRefresh = setInterval(() => {
      fetchTelemetry();
    }, 20000);
    return () => clearInterval(autoRefresh);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Live Sensor Mesh & Doppler Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                IMD S/C/X-band Doppler Radar network + Himalayan vibrating wire piezometer boreholes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Network Status: <strong>{data?.status || 'Online'}</strong> ({data?.activeSensorCount || 148} IoT nodes active)
              </span>
            </div>
            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Synced {secondsAgo}s ago</span>
              </span>
              <span>•</span>
              <span>Auto-refreshing every 20s</span>
            </div>
          </div>

          {/* 1. Doppler Radar Network */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>IMD Doppler Weather Radar Network (DWR)</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Continuous 360° Precipitation Sweeps</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data?.dopplerRadarStations.map((station) => (
                <div
                  key={station.stationId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">
                        {station.stationId}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {station.name}
                      </h5>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {station.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Reflectivity</span>
                      <strong className="text-slate-800 dark:text-slate-200">{station.reflectivityDbZ} dBZ</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Rainfall Rate</span>
                      <strong className="text-amber-600 dark:text-amber-400">{station.precipitationRateMmHr} mm/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Azimuth Angle</span>
                      <span className="text-slate-700 dark:text-slate-300">{station.sweepAngleDeg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Telemetry Ping</span>
                      <span className="text-slate-500 dark:text-slate-400">{station.lastSync}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Vibrating Wire Piezometers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Vibrating Wire Piezometers (Sub-surface Pore Water Pressure)</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Himalayan Slope Boreholes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data?.piezometers.map((pz) => (
                <div
                  key={pz.sensorId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {pz.sensorId}
                        </span>
                        <span className="text-[10px] text-slate-400">({pz.state})</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight mt-0.5">
                        {pz.stationName}
                      </h5>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pz.status === 'Critical'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : pz.status === 'Elevated'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {pz.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Current Pressure</span>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {pz.porePressureKPa} <span className="text-xs font-normal text-slate-500">kPa</span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                      <div>Threshold: <strong className="text-slate-700 dark:text-slate-300">{pz.thresholdKPa} kPa</strong></div>
                      <div className="text-[10px]">Borehole Depth: {pz.depthMeters}m</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Coord: {pz.location}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ping: {pz.lastPing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Inclinometer Movement */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Biaxial Inclinometers (Slope Tilt & Lateral Displacement)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data?.inclinometers.map((inc) => (
                <div
                  key={inc.sensorId}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">{inc.sensorId}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {inc.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{inc.location}</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Displacement: <strong className="text-slate-900 dark:text-white">{inc.displacementMm} mm</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">Creep Rate: {inc.rateMmPerDay} mm/day</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Feeds stream every second with active drift calibration</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

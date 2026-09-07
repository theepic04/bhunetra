import React, { useState } from 'react';
import {
  Network,
  Truck,
  Train,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface InfrastructureItem {
  id: string;
  name: string;
  category: 'National Highway' | 'Hill Railway' | 'Energy Grid' | 'Bridge/Tunnel';
  region: string;
  status: 'Critical Risk' | 'Restricted' | 'Operational' | 'Caution';
  vulnerabilityScore: number;
  monitoredSensors: string;
  lastInspection: string;
  description: string;
}

const INFRASTRUCTURE_LIST: InfrastructureItem[] = [
  {
    id: 'infra-01',
    name: 'NH-10 (Sevoke – Singtam – Gangtok)',
    category: 'National Highway',
    region: 'Sikkim & Kalimpong Border',
    status: 'Critical Risk',
    vulnerabilityScore: 88,
    monitoredSensors: '14 Inclinometers, 4 Piezometers',
    lastInspection: 'Today, 06:00 AM by BRO Swastik',
    description: 'Multiple active debris slides at 29th Mile and Bhalu Khola. Heavy goods vehicle transit temporarily halted.'
  },
  {
    id: 'infra-02',
    name: 'NH-29 (Dimapur – Kohima Bypass)',
    category: 'National Highway',
    region: 'Nagaland',
    status: 'Restricted',
    vulnerabilityScore: 72,
    monitoredSensors: '8 Tilt Sensors, 2 Rainfall Gauges',
    lastInspection: 'Yesterday, 04:30 PM',
    description: 'Pagala Pahar cut-slope tension cracks widening. Single lane traffic regulated with police pilots.'
  },
  {
    id: 'infra-03',
    name: 'Lumding – Badarpur Hill Railway (NFR)',
    category: 'Hill Railway',
    region: 'Assam (Dima Hasao Hills)',
    status: 'Caution',
    vulnerabilityScore: 64,
    monitoredSensors: '22 Track Embankment Fiber Strain Nodes',
    lastInspection: 'Today, 04:00 AM by Railway Gang',
    description: 'Speed capped to 25 kmph between Daotuhaja and Phiding stations during heavy rain intervals.'
  },
  {
    id: 'infra-04',
    name: 'Sela Pass Corridor & Tunnel Approaches',
    category: 'Bridge/Tunnel',
    region: 'Arunachal Pradesh',
    status: 'Operational',
    vulnerabilityScore: 35,
    monitoredSensors: '12 Geo-geodetic Survey Stations',
    lastInspection: '2 days ago',
    description: 'Concrete avalanche galleries and rock-netting functioning nominally with no creep displacement.'
  },
  {
    id: 'infra-05',
    name: '400kV Siliguri – Melli Power Transmission Line',
    category: 'Energy Grid',
    region: 'Teesta River Basin',
    status: 'Caution',
    vulnerabilityScore: 58,
    monitoredSensors: '6 Pylon Foundation Pore Monitors',
    lastInspection: 'Yesterday by PowerGrid Cell',
    description: 'Tower #42 riverbank footing reinforced with gabion walls. Soil displacement currently below threshold.'
  }
];

export const InfrastructureRiskPage: React.FC = () => {
  const [items, setItems] = useState<InfrastructureItem[]>(INFRASTRUCTURE_LIST);
  const [filter, setFilter] = useState<string>('All');

  const filteredItems = items.filter((item) => {
    if (filter === 'All') return true;
    return item.category === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical Risk':
        return 'bg-red-600 text-white';
      case 'Restricted':
        return 'bg-orange-500 text-white';
      case 'Caution':
        return 'bg-amber-400 text-slate-900 font-bold';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Infrastructure Risk Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time vulnerability telemetry for national strategic corridors, mountain railways, and power transmission spans
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-2xs">
          <Network className="w-4 h-4 text-emerald-600" />
          <span>BRO & MoRTH Synchronized</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'National Highway', 'Hill Railway', 'Energy Grid', 'Bridge/Tunnel'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === cat
                ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{item.region}</span>
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Vulnerability Index</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{item.vulnerabilityScore} / 100</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getStatusBadge(item.status)}`}>
                  {(item.status || 'Active').toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Sensors:</strong> {item.monitoredSensors}
              </div>
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Audit:</strong> {item.lastInspection}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

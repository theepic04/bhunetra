import React from 'react';
import {
  Users,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  MapPin,
  FileText,
  Activity,
  PhoneCall
} from 'lucide-react';
import { UserRole } from '../types';
import { BhuNetraLogo } from './BhuNetraLogo';

interface LoginPageProps {
  onSelectRoleAndNavigate: (role: UserRole, targetPage: string) => void;
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSelectRoleAndNavigate, onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header Branding */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-4 inline-flex items-center justify-center bhunetra-logo-frame">
            <BhuNetraLogo className="w-52 sm:w-60 h-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to BhuNetra
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            Official Landslide Early Warning & Risk Management System for North Eastern Region (NER), India
          </p>
        </div>

        {/* Two Large Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Citizen Card */}
          <div className="bg-white rounded-2xl p-7 border-2 border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Citizen</h2>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Public Access
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Check local risk, receive warnings and report hazards.
              </p>

              {/* Citizen Highlights */}
              <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-time local rainfall & slope moisture</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>One-touch emergency shelters & safe routes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI terrain photo hazard scanner</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                id="login-citizen-action-btn"
                onClick={() => onSelectRoleAndNavigate('citizen', 'citizen-dashboard')}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Login as Citizen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Authority Card */}
          <div className="bg-white rounded-2xl p-7 border-2 border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Authority</h2>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Government & NDRF
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Monitor risk zones, alerts and emergency response.
              </p>

              {/* Authority Highlights */}
              <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Regional multi-zone telemetry dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>7-step alert verification & dispatch workflow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  <span>Highway & critical infrastructure risk matrix</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                id="login-authority-action-btn"
                onClick={() => onNavigate('authority-login')}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Login as Authority</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Note on Prototype & Back Link */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            * Prototype frontend simulation. No password required for test access.
          </p>
          <button
            onClick={() => onNavigate('landing')}
            className="mt-3 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            ← Back to Public Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Shield, UserCheck } from 'lucide-react';
import { getTranslation } from '../data/translations';
import { LanguageCode } from '../types';

interface AccessRestrictedProps {
  onNavigate: (page: string) => void;
  selectedLanguage?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  onNavigate,
  selectedLanguage
}) => {
  const t = getTranslation(selectedLanguage as LanguageCode);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 text-center space-y-6">
        
        {/* Shield Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Official Personnel Only</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.accessRestricted}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.accessRestrictedDesc}
          </p>
        </div>

        {/* Role Status Tag */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Session:</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Citizen Mode
          </span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            id="btn-return-citizen-dashboard"
            onClick={() => onNavigate('citizen-dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToCitizenDashboard}</span>
          </button>

          <button
            id="btn-switch-to-authority-login"
            onClick={() => onNavigate('authority-login')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t.authorityLoginPrompt}</span>
          </button>
        </div>

        {/* Prototype Transparency Notice */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          BhuNetra Public Safety System • Role-Based Access Control Prototype
        </p>
      </div>
    </div>
  );
};

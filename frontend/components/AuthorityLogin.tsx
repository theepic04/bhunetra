import React, { useState } from 'react';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { UserRole, LanguageCode } from '../types';
import { getTranslation } from '../data/translations';

interface AuthorityLoginProps {
  onLoginSuccess: (role: UserRole, targetPage: string) => void;
  onNavigate: (page: string) => void;
  selectedLanguage?: string;
}

export const AuthorityLogin: React.FC<AuthorityLoginProps> = ({
  onLoginSuccess,
  onNavigate,
  selectedLanguage
}) => {
  const t = getTranslation(selectedLanguage as LanguageCode);

  const [emailOrId, setEmailOrId] = useState('officer.sikkim@ndrf.gov.in');
  const [password, setPassword] = useState('GovSecure@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password flow state
  const [viewMode, setViewMode] = useState<'login' | 'forgot-password'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend mock authentication: proceed to Authority Dashboard
    onLoginSuccess('authority', 'authority-dashboard');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError(t.enterValidEmail);
      return;
    }
    setResetError('');
    setResetSubmitted(true);
  };

  const handleBackToLogin = () => {
    setViewMode('login');
    setResetSubmitted(false);
    setResetError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-10 sm:py-12 transition-colors">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          
          {/* VIEW MODE: FORGOT PASSWORD */}
          {viewMode === 'forgot-password' ? (
            <div>
              {!resetSubmitted ? (
                <div>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3 shadow-2xs">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {t.resetPasswordTitle}
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {t.resetPasswordDesc}
                    </p>
                  </div>

                  {resetError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  {/* Reset Form */}
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="reset-official-id-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        {t.officialEmailOrId}
                      </label>
                      <div className="relative">
                        <input
                          id="reset-official-id-input"
                          type="text"
                          required
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (resetError) setResetError('');
                          }}
                          placeholder={t.officialEmailPlaceholder}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        id="btn-send-reset-link"
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>{t.sendResetLink}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        id="btn-cancel-reset"
                        type="button"
                        onClick={handleBackToLogin}
                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{t.backToLogin}</span>
                      </button>
                    </div>
                  </form>

                  {/* Prototype Notice */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Frontend demonstration notice: Password recovery adheres to state administrative directory guidelines without invoking external mailing servers.
                    </p>
                  </div>
                </div>
              ) : (
                /* SUCCESS CONFIRMATION STATE */
                <div className="text-center space-y-4 py-2">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {t.resetLinkSent}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t.resetLinkSentDesc}
                    </p>
                  </div>

                  {/* Highlight Credential Provided */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono break-all text-center">
                    {resetEmail}
                  </div>

                  <div className="pt-3">
                    <button
                      id="btn-back-to-login-after-reset"
                      onClick={handleBackToLogin}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t.backToLogin}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE: STANDARD LOGIN */
            <div>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Authority Access
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Secure access for authorized disaster management personnel.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Official ID / Government Email */}
                <div>
                  <label
                    htmlFor="official-id-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Official ID / Government Email
                  </label>
                  <div className="relative">
                    <input
                      id="official-id-input"
                      type="text"
                      required
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      placeholder="e.g. officer.id@ndrf.gov.in"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="authority-password-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="authority-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-hidden cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkbox & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    id="btn-forgot-password"
                    type="button"
                    onClick={() => {
                      setResetEmail(emailOrId);
                      setViewMode('forgot-password');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                </div>

                {/* Button: Login to Authority Dashboard */}
                <div className="pt-2">
                  <button
                    id="authority-login-submit-btn"
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Login to Authority Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Security Note Below Form */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Authorized personnel only. Access and actions are recorded for accountability.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Navigation back helper */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-4 cursor-pointer"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};


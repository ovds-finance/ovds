import {
  Clock,
  MapPin,
  Fingerprint,
  Camera,
  Eye,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LogIn,
  Moon,
  Sun,
  Zap,
  ShieldCheck,
  User,
  Loader2,
  ArrowRight,
  Info,
  WifiOff,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';

import LanguageSwitcher from '../components/languageSwitcher';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { getLocale } from '../lib/locale';
import api from '../services/api';

// Target Location loaded from settings API
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLon = ((lon2 - lon1) * Math.PI) / 180;
const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c;}
const EntryPortal: React.FC = () => {
  const { t, i18n } = useTranslation();
const [time, setTime] = useState(new Date());
const [bioType, setBioType] = useState('FINGERPRINT');
const [employees, setEmployees] = useState<any[]>([]);
  // -- Kiosk Mode ------------------------------------------------------------
const [kioskMode, setKioskMode] = useState(
    () => localStorage.getItem('kiosk_mode') === 'true',
  );
const inactivityTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const KIOSK_RESET_MS = 30_000; // auto-reset form after 30s inactivity

  const resetKioskForm = React.useCallback(() => {
    setSelectedEmployee('');
    setTemplate('');
    setMessage(null);
  }, []);
const resetInactivityTimer = React.useCallback(() => {
    if (!kioskMode) return;
if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(resetKioskForm, KIOSK_RESET_MS);
  }, [kioskMode, resetKioskForm]);
const toggleKioskMode = React.useCallback(() => {
    const next = !kioskMode;
    setKioskMode(next);
    localStorage.setItem('kiosk_mode', String(next));
if (next) {
      // Request full-screen
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    }
  }, [kioskMode]);

  // Track user activity in kiosk mode
  React.useEffect(() => {
    if (!kioskMode) return;
const events = ['mousedown', 'touchstart', 'keydown'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer(); // start timer on mount
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [kioskMode, resetInactivityTimer]);
const [selectedEmployee, setSelectedEmployee] = useState('');
const [template, setTemplate] = useState('');
const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
const [inRange, setInRange] = useState<boolean | null>(null);
const [target, setTarget] = useState<{ lat: number; lng: number } | null>(
    null,
  );
const targetRef = React.useRef<{ lat: number; lng: number } | null>(null);
const [recentLogs, setRecentLogs] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'queued';
    text: string;
  } | null>(null);
const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
const socketRef = useRef<Socket | null>(null);
const { submitOfflineSafe, queueCount } = useOfflineQueue();
const fetchEmployees = React.useCallback(async () => {
    try {
      const [empRes, settingsRes] = await Promise.all([
        api.get('/hr/attendance/kiosk-employees'),
        api.get('/settings'),
      ]);
      setEmployees(empRes.data.data || []);
const s = settingsRes.data.data || {};
if (s.geofence_lat && s.geofence_lon) {
        const t = {
          lat: parseFloat(s.geofence_lat),
          lng: parseFloat(s.geofence_lon),
        };
        setTarget(t);
        targetRef.current = t;
      } else {
        const fallback = { lat: 13.4967, lng: 39.4753 };
        setTarget(fallback);
        targetRef.current = fallback;
      }
    }
catch {
      /* error swallowed — toast handles user feedback */
      const fallback = { lat: 13.4967, lng: 39.4753 };
      setTarget(fallback);
      targetRef.current = fallback;
    }
  }, []);
useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    fetchEmployees();

    // Geolocation with error handling
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(current);
if (targetRef.current) {
            const dist = getDistance(
              targetRef.current.lat,
              targetRef.current.lng,
              current.lat,
              current.lng,
            );
            setInRange(dist < 0.5);
          } else {
            // No geofence configured — allow check-in from any location
            setInRange(true);
          }
        },
        () => {
          /* warn swallowed */
          // On permission denied or unavailable, allow check-in (geofence disabled)
          setInRange(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    } else {
      // Geolocation not supported — allow check-in
      setInRange(true);
    }

    // Socket.io
    const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || sessionStorage.getItem('auth0_token') || '';
    socketRef.current = io('/realtime', { path: '/socket.io', transports: ['polling', 'websocket'], auth: { token } });

    socketRef.current.on('newCheckin', (log) => {
      setRecentLogs((prev) => [log, ...prev].slice(0, 5));
    });

    socketRef.current.on('newCheckout', (log) => {
      setRecentLogs((prev) => [log, ...prev].slice(0, 5));
    });
return () => {
      clearInterval(timer);
      socketRef.current?.disconnect();
    };
  }, [fetchEmployees, target]);
const getEmployeeTemplate = React.useCallback(async () => {
    if (selectedEmployee) {
      try {
        const res = await api.get(`/biometrics/employee/${selectedEmployee}`);
const biometrics = res.data.data?.data || [];
const matched = biometrics.find((b: any) => b.type === bioType);
if (matched) {
          setTemplate(matched.template);
        } else {
          setTemplate('');
          setMessage({ type: 'error', text: t('entry.no_biometric') });
        }
      }
catch {
        /* error swallowed — toast handles user feedback */
      }
    } else {
      setTemplate('');
    }
  }, [selectedEmployee, bioType, t]);
useEffect(() => {
    getEmployeeTemplate();
  }, [getEmployeeTemplate]);
const playAudio = (type: 'success' | 'error') => {
    if (type === 'error') return; // no error.mp3 available
    const audio = new Audio(`/assets/${type}.mp3`);
    audio.play().catch(() => {}); // silently ignore if file missing
  };
const handleAction = async (action: 'check-in' | 'check-out') => {
    setLoading(true);
    setMessage(null);

    const employeeName = employees.find(e => e.id === selectedEmployee)
      ? `${employees.find(e => e.id === selectedEmployee)?.firstName ?? ''} ${employees.find(e => e.id === selectedEmployee)?.lastName ?? ''}`.trim()
      : selectedEmployee;

    const payload = {
      type: bioType,
      template,
      latitude: location?.lat,
      longitude: location?.lng,
      deviceInfo: `${navigator.platform} | ${navigator.userAgent.substring(0, 80)}`,
    };

try {
      // Real Biometric Hardware Verification (WebAuthn / Windows Hello)
      if (template.startsWith('WEBAUTHN_')) {
        try {
          const rawIdBase64 = template.replace('WEBAUTHN_', '');
const rawId = Uint8Array.from(atob(rawIdBase64), (c) =>
            c.charCodeAt(0),
          );
const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
const getCredentialOptions: any = {
            challenge,
            allowCredentials: [
              {
                id: rawId,
                type: 'public-key',
                transports: ['internal', 'usb', 'nfc', 'ble'],
              },
            ],
            userVerification: 'required',
            timeout: 60000,
          };
const assertion = (await navigator.credentials.get({
            publicKey: getCredentialOptions,
          })) as PublicKeyCredential;
if (!assertion) {
            throw new Error('Hardware verification failed or was cancelled');
          }
        }
catch {
          throw new Error(
            'Biometric hardware verification failed. Please try again.',
          );
        }
      }

      // Use offline-safe submission — queues to IndexedDB when offline
      const actionType = action === 'check-in' ? 'ATTENDANCE_CHECK_IN' : 'ATTENDANCE_CHECK_OUT';
      const label = `${action === 'check-in' ? 'Check-in' : 'Check-out'} — ${employeeName}`;
      const isOnline = navigator.onLine;

      const success = await submitOfflineSafe(actionType, payload, label);

      if (success && !isOnline) {
        // Queued offline
        setMessage({
          type: 'queued',
          text: `${action === 'check-in' ? 'Check-in' : 'Check-out'} saved offline — will sync when reconnected`,
        });
      } else if (success) {
        const successMsg = action === 'check-in' ? t('entry.success_in') : t('entry.success_out');
        setMessage({ type: 'success', text: successMsg });
        playAudio('success');
      }
    }
catch (err: any) {
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message || err.message || t('entry.error_verify'),
      });
      playAudio('error');
    }
finally {
      setLoading(false);
    }
  };
const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
const _changeLanguage = (_lng: string) => {
    i18n.changeLanguage(_lng);
    localStorage.setItem('i18nextLng', _lng);
  };
return (
    <div
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} ${kioskMode ? 'select-none' : ''}`}
    >
      {/* Kiosk mode overlay indicator */}
      {kioskMode && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-1.5 bg-[var(--pro-azure)] text-white text-[10px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Kiosk Mode Active — Auto-reset in {KIOSK_RESET_MS / 1000}s of inactivity
          </span>
          <button
            onClick={toggleKioskMode}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] font-medium transition-colors"
          >
            Exit Kiosk
          </button>
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--pro-azure)] via-indigo-500 to-amber-500"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--pro-azure-50)]0/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className={`w-full max-w-xl relative z-10 ${kioskMode ? 'mt-6' : ''}`}>
        <div className="flex justify-between items-center mb-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--pro-azure)] text-white rounded-xl shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30">
              <Zap size={18} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                {t('entry.live_portal')}
              </span>
              <span className="text-xs font-bold opacity-60">
                {t('entry.node_version')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              {theme === 'light' ? (
                <Moon size={18} className="text-slate-600" />
              ) : (
                <Sun size={18} className="text-amber-600 dark:text-amber-400" />
              )}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
            <LanguageSwitcher variant="select" className="bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5" />
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
            <button
              onClick={toggleKioskMode}
              title={kioskMode ? 'Exit Kiosk Mode' : 'Enter Kiosk Mode (full-screen lock)'}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all border ${kioskMode ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)]' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'}`}
            >
              {kioskMode ? '⊠ Kiosk' : '⊡ Kiosk'}
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl shadow-2xl border transition-all overflow-hidden ${theme === 'dark' ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-100'}`}
        >
          <div className="p-10 text-center">
             <div className="mb-6 flex flex-col items-center">
               <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--pro-azure)] to-purple-500 shadow-2xl">
                 <span className="text-white font-bold text-2xl">OVDS</span>
               </div>
              <p className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] uppercase tracking-[0.4em] mb-2">
                {t('subtitle')}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight uppercase">
                {t('portal_title')}
              </h1>
            </div>

            <div className="py-6 mb-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center">
              <div className="flex items-center gap-3 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mb-2">
                <Clock size={20} className="animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                  {t('entry.network_time')}
                </span>
              </div>
              <div className="text-6xl font-semibold tracking-tighter tabular-nums drop-shadow-sm">
                {time.toLocaleTimeString(
                  getLocale(i18n.language),
                  {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  },
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
                {time.toLocaleDateString(
                  getLocale(i18n.language),
                  { weekday: 'long', month: 'long', day: 'numeric' },
                )}
              </p>
            </div>

            <div className="mb-8 space-y-2 text-left">
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t('enroll.select_employee')}
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"
                />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-400/10 transition-all appearance-none cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="">{t('enroll.select_employee')}</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ovds-grid-layout cols-3 mb-10">
              {[
                {
                  type: 'FINGERPRINT',
                  icon: <Fingerprint size={24} />,
                  label: t('fingerprint'),
                },
                {
                  type: 'FACE_RECOGNITION',
                  icon: <Camera size={24} />,
                  label: t('face_recognition'),
                },
                {
                  type: 'IRIS_SCAN',
                  icon: <Eye size={24} />,
                  label: t('iris_scan'),
                },
              ].map((method) => (
                <button
                  key={method.type}
                  onClick={() => setBioType(method.type)}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all relative ${
                    bioType === method.type
                      ? 'bg-[var(--pro-azure-50)]0 border-[var(--pro-azure)] text-white shadow-xl shadow-green-500/20 dark:shadow-green-500/10/30 scale-105'
                      : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 hover:border-slate-200 dark:hover:border-white/10'
                  }`}
                >
                  {bioType === method.type &&
                    template.startsWith('WEBAUTHN_') && (
                      <div className="absolute -top-2 -right-2 bg-[var(--pro-azure)] text-white p-1 rounded-full shadow-lg animate-bounce">
                        <ShieldCheck size={14} />
                      </div>
                    )}
                  {method.icon}
                  <span className="text-[10px] font-medium uppercase tracking-wider leading-none">
                    {method.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="ovds-grid-layout cols-2">
                <button
                  disabled={loading || inRange === false || !selectedEmployee}
                  onClick={() => handleAction('check-in')}
                  className="group relative h-20 bg-[var(--pro-azure)] text-white rounded-2xl font-semibold uppercase tracking-wider overflow-hidden transition-all hover:bg-[var(--pro-azure-dark)] hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  <div className="flex items-center justify-center gap-3">
                    {loading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <LogIn size={24} />
                    )}
                    <span>{t('check_in')}</span>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
                <button
                  disabled={loading || inRange === false || !selectedEmployee}
                  onClick={() => handleAction('check-out')}
                  className="group relative h-20 bg-amber-500 text-white rounded-2xl font-semibold uppercase tracking-wider overflow-hidden transition-all hover:bg-amber-600 hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  <div className="flex items-center justify-center gap-3">
                    {loading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <LogOut size={24} />
                    )}
                    <span>{t('check_out')}</span>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  inRange === null
                    ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                    : inRange
                      ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]0/10 border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin
                    size={18}
                    className={inRange ? 'animate-bounce' : ''}
                  />
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                      {t('entry.geofencing')}
                    </p>
                    <p className="text-xs font-bold mt-1">
                      {location
                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : t('detecting_location')}
                    </p>
                  </div>
                </div>
                {inRange !== null && (
                  <div
                    className={`px-3 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider border ${
                      inRange
                        ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)] shadow-lg shadow-green-500/20'
                        : 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                    }`}
                  >
                    {inRange ? t('in_range') : t('out_of_range')}
                  </div>
                )}
              </div>

              {message && (
                <div
                  className={`p-6 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
                    message.type === 'success'
                      ? 'bg-[var(--pro-azure-50)]0/10 border-[var(--pro-azure)]/20 text-[var(--pro-azure)]'
                      : message.type === 'queued'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-lg ${
                      message.type === 'success'
                        ? 'bg-[var(--pro-azure)] text-white'
                        : message.type === 'queued'
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle2 size={24} />
                    ) : message.type === 'queued' ? (
                      <WifiOff size={24} />
                    ) : (
                      <AlertCircle size={24} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
                      {message.type === 'queued' ? 'Offline Queue' : t('entry.auth_message')}
                    </p>
                    <p className="text-sm font-bold mt-0.5">{message.text}</p>
                    {message.type === 'queued' && (
                      <p className="text-[10px] mt-1 opacity-70">
                        Will sync automatically when internet is restored
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Offline queue count indicator */}
              {queueCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <WifiOff size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {queueCount} action{queueCount !== 1 ? 's' : ''} pending sync — will send when online
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider opacity-40">
                {t('recent_checkins')}
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--pro-azure-50)]0 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--pro-azure)]">
                  {t('entry.live_stream')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl flex flex-col items-center text-slate-300 dark:text-white/10">
                  <User size={32} strokeWidth={1} />
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-4">
                    {t('entry.waiting')}
                  </p>
                </div>
              ) : (
                recentLogs.map((log, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between shadow-sm animate-in slide-in-from-left-4 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded-xl flex items-center justify-center font-semibold">
                        {log.employee?.firstName[0]}
                        {log.employee?.lastName[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </p>
                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-wider">
                          {log.employee?.department?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-[var(--pro-azure)] tabular-nums">
                        {new Date(log.checkIn).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <ShieldCheck size={10} className="text-[var(--pro-azure)]" />
                        <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                          {t('entry.verified')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5">
              <div className="p-5 rounded-2xl bg-[var(--pro-azure-50)]/50 border border-[var(--pro-azure-100)] dark:border-green-900 text-left">
                <div className="flex items-center gap-2 mb-3 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                  <Info size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">About This Kiosk</span>
                </div>
                <p className="text-xs font-medium leading-relaxed opacity-70">
                  A <strong>kiosk</strong> is a small, open-fronted booth or structure used for retail, information, or self-service, 
                  often featuring touchscreen technology. This entry portal provides self-service check-in/out and biometric verification.
                </p>
                <div className="grid grid-cols-2 gap-y-2 mt-4 pt-4 border-t border-[var(--pro-azure-50)]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase tracking-wider opacity-40">Modern Types</span>
                    <span className="text-[10px] font-bold">Self-Service & Ordering</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase tracking-wider opacity-40">Financial</span>
                    <span className="text-[10px] font-bold">Payment & Banking</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase tracking-wider opacity-40">Navigation</span>
                    <span className="text-[10px] font-bold">Wayfinding & Info</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase tracking-wider opacity-40">Commerce</span>
                    <span className="text-[10px] font-bold">E-commerce & Mobile</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 text-center">
              <a
                href="/login"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure)] transition-colors flex items-center justify-center gap-2"
              >
                {t('backend_login')}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );}
export default EntryPortal;












import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { confirm } from '../utils/confirm';
import {
  useDebounce,
  usePageTitle,
} from '../hooks';
import {
  UserPlus,
  Camera,
  Fingerprint,
  Eye,
  CheckCircle2,
  AlertCircle,
  Hash,
  RefreshCw,
  Trash2,
  FileEdit,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { usePagination } from '@ovds/ui';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
const Enrollment: React.FC = () => {
  usePageTitle('Enrollment');
const { t } = useTranslation();
const { can } = useAuth();
const canWrite = can('enrollment:write');
const [employees, setEmployees] = useState<any[]>([]);
const [bioType, setBioType] = useState('FINGERPRINT');
const [formData, setFormData] = useState({
    employeeId: '',
    template: '',
  });
const [editingId, setEditingId] = useState<string | null>(null);
const [existingBio, setExistingBio] = useState<any[]>([]);
const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isScanning, setIsScanning] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);
const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
const [settings, setSettings] = useState<any>(null);
const [loading, setLoading] = useState(true);
const employeesPagination = usePagination({ initialTake: 10 });
const {
    page: empPage,
    take: empTake,
    setTotal: setEmpTotal,
    reset: resetEmp,
  } = employeesPagination;
const bioPagination = usePagination({ initialTake: 5 });
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const formRef = useRef<HTMLDivElement>(null);
const streamRef = useRef<MediaStream | null>(null);
const fetchExistingBio = React.useCallback(async (empId: string) => {
    if (!empId) {
      setExistingBio([]);
return;
    }
try {
      const res = await api.get(`/biometrics/employee/${empId}`);
      setExistingBio(res.data.data?.data || res.data.data || []);
    }
catch {
      /* silent */
    }
  }, []);
const filteredEmployees = employees.filter(
    (e: any) =>
      (`${e.firstName || ''} ${e.lastName || ''}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
      (!subsidiaryFilter || e.subsidiary === subsidiaryFilter),
  );
useEffect(() => {
    if (debouncedSearch || subsidiaryFilter) {
      resetEmp();
    }
  }, [debouncedSearch, subsidiaryFilter, resetEmp]);
const fetchEmployees = React.useCallback(async () => {
    setLoading(true);
try {
      const params = new URLSearchParams({
        page: empPage.toString(),
        take: empTake.toString(),
      });
if (subsidiaryFilter) params.set('subsidiary', subsidiaryFilter);
const res = await api.get(`/hr/employees?${params}`);
      setEmployees(res.data.data?.data || []);
      setEmpTotal(res.data.data?.pagination?.total || 0);
    }
catch (err: any) {
      toast.error(
        err.response?.data?.message || t('employees.loading') + ' failed',
      );
    }
finally {
      setLoading(false);
    }
  }, [empPage, empTake, setEmpTotal, subsidiaryFilter, t]);
const fetchSettings = React.useCallback(async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data || {});
    }
catch {
      /* silent */
    }
  }, []);
useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);
useEffect(() => {
    fetchExistingBio(formData.employeeId);
  }, [formData.employeeId, fetchExistingBio]);
const handleDeleteBio = async (id: string) => {
    if (!canWrite) {
      toast.error(t('msg.no_permission'));
return;
    }
if (
      !(await confirm({
        title: t('enroll.confirm_delete'),
        variant: 'danger',
        confirmLabel: t('common.delete'),
      }))
    )
      return;
try {
      await api.delete(`/biometrics/${id}`);
      fetchExistingBio(formData.employeeId);
      setMessage({ type: 'success', text: t('enroll.remove_success') });
    }
catch {
      setMessage({ type: 'error', text: t('enroll.delete_failed') });
    }
  };
const startCamera = React.useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      streamRef.current = newStream;
if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    }
catch {
      setMessage({ type: 'error', text: t('enroll.camera_denied') });
    }
  }, [t]);
const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);
useEffect(() => {
    if (bioType === 'FACE_RECOGNITION' || bioType === 'IRIS_SCAN') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [bioType, startCamera, stopCamera]);
const enrollHardware = async () => {
    setIsScanning(true);
    setMessage(null);

    // Check if WebAuthn is supported (standard for T460s built-in scanners/cameras via Windows Hello)
    if (window.PublicKeyCredential) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Generate a valid user ID (must be unique per user)
        const selectedEmp = employees.find((e) => e.id === formData.employeeId);
const userIDStr = selectedEmp?.employeeId || `TEMP_${Date.now()}`;
const userID = new TextEncoder().encode(userIDStr);
const createCredentialOptions: any = {
          challenge,
          rp: { name: 'Ovds Attendance', id: window.location.hostname },
          user: {
            id: userID,
            name:
              selectedEmp?.email ||
              `${selectedEmp?.employeeId || 'employee'}@Ovds`,
            displayName: `${selectedEmp?.firstName || 'Employee'} ${selectedEmp?.lastName || ''}`,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Force built-in scanner (T460s)
            userVerification: 'required',
            residentKey: 'preferred',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'direct',
        };
const credential = (await navigator.credentials.create({
          publicKey: createCredentialOptions,
        })) as PublicKeyCredential;
if (credential) {
          // Convert rawId to base64 for storage
          const id = btoa(
            String.fromCharCode(...new Uint8Array(credential.rawId)),
          );
          setFormData((prev) => ({ ...prev, template: `WEBAUTHN_${id}` }));
          setMessage({ type: 'success', text: t('enroll.hardware_success') });
        }
      }
catch {
        setMessage({ type: 'error', text: t('enroll.hardware_failed') });
      }
finally {
        setIsScanning(false);
      }
    } else {
      // No WebAuthn support — prompt manual entry
      setIsScanning(false);
      setMessage({ type: 'error', text: t('enroll.no_hardware') });
    }
  };
const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
const ctx = canvas.getContext('2d');
if (ctx) {
        ctx.drawImage(video, 0, 0);
const dataUrl = canvas.toDataURL('image/png');
const hash = btoa(dataUrl).slice(0, 32) + `_${bioType}_ENROLL`;
        setFormData((prev) => ({ ...prev, template: hash }));
      }
    }
  };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
if (!canWrite) {
      toast.error(t('msg.no_permission'));
return;
    }
if (!formData.employeeId) {
      setMessage({ type: 'error', text: 'Please select an employee first.' });
return;
    }
if (!formData.template.trim()) {
      setMessage({
        type: 'error',
        text: 'Biometric template is required. Use hardware scan or capture image.',
      });
return;
    }
    setIsSubmitting(true);
    setMessage(null);
try {
      if (editingId) {
        await api.patch(`/biometrics/${editingId}`, {
          template: formData.template,
        });
toast.success(t('enroll.update_btn') + ' successful');
        setMessage({
          type: 'success',
          text: t('enroll.update_btn') + ' successful',
        });
      } else {
        await api.post('/biometrics/register', {
          employeeId: formData.employeeId,
          type: bioType,
          template: formData.template,
        });
toast.success(t('enroll.success'));
        setMessage({ type: 'success', text: t('enroll.success') });
      }
      fetchExistingBio(formData.employeeId);
      setFormData({ ...formData, template: '' });
      setEditingId(null);
    }
catch (err: any) {
      const msg = err.response?.data?.message || t('common.operation_failed');
toast.error(msg);
      setMessage({ type: 'error', text: msg });
    }
finally {
      setIsSubmitting(false);
    }
  };
const bioTypes = [
    {
      value: 'FINGERPRINT',
      label: t('fingerprint'),
      icon: <Fingerprint size={18} />,
    },
    {
      value: 'FACE_RECOGNITION',
      label: t('face_id'),
      icon: <Camera size={18} />,
    },
    { value: 'IRIS_SCAN', label: t('iris'), icon: <Eye size={18} /> },
  ];
return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="ovds-grid-layout cols-2 gap-lg items-stretch">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full transition-colors">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {t('enroll.registration_title')}
              </h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                {t('enroll.auth_setup')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {t('enroll.select_employee')}
                </label>
                <div className="relative flex-1 min-w-[200px] max-w-md group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 dark:text-emerald-400 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder={
                      t('admin.search_placeholder') || 'Search employees...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-400/10 focus:bg-white focus:border-teal-400 transition-all"
                  />
                </div>
                {settings?.org_structure_type &&
                  settings.org_structure_type !== 'single' && (
                    <select
                      value={subsidiaryFilter}
                      onChange={(e) => setSubsidiaryFilter(e.target.value)}
                      className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 focus:ring-2 focus:ring-teal-400/20 min-w-[140px]"
                    >
                      <option value="">All Subsidiaries</option>
                      {(settings.subsidiaries || '')
                        .split(',')
                        .filter(Boolean)
                        .map((s: string) => (
                          <option key={s.trim()} value={s.trim()}>
                            {s.trim()}
                          </option>
                        ))}
                    </select>
                  )}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="ovds-empty text-sm italic border-2 border-dashed border-slate-200 rounded-2xl">
                  No employees found
                </div>
              ) : (
                <div className="max-h-48 overflow-auto space-y-2">
                  {filteredEmployees.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-4 p-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer group hover:shadow-md transition-all"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, employeeId: e.id }))
                      }
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg">
                          {e.firstName?.[0]}
                          {e.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {e.firstName} {e.lastName}
                          </p>
                          <p className="text-xs font-mono text-slate-500">
                            {e.employeeId}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setBioType('FINGERPRINT');
                          setFormData((prev) => ({
                            ...prev,
                            employeeId: e.id,
                            template: '',
                          }));
                          setEditingId(null);
                          formRef.current?.scrollIntoView({
                            behavior: 'smooth',
                          });
                        }}
                        className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                      >
                        Enroll Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {employeesPagination.pages > 1 && (
                <div className="flex items-center gap-3 pt-3 text-xs">
                  <button
                    onClick={employeesPagination.prev}
                    disabled={!employeesPagination.hasPrev}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-bold disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-slate-700">
                    Page {employeesPagination.page} of{' '}
                    {employeesPagination.pages}
                  </span>
                  <button
                    onClick={employeesPagination.next}
                    disabled={!employeesPagination.hasNext}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-bold disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                  <select
                    value={employeesPagination.take}
                    onChange={(e) => {
                      employeesPagination.setTake(Number(e.target.value));
                      employeesPagination.reset();
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-400/20 bg-white text-xs font-bold"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                  </select>
                </div>
              )}
            </div>

            <div ref={formRef} className="space-y-2">
              {/* Selected employee indicator */}
              {formData.employeeId &&
                (() => {
                  const sel = employees.find(
                    (e) => e.id === formData.employeeId,
                  );
return sel ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-2">
                      <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {sel.firstName?.[0]}
                        {sel.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {sel.firstName} {sel.lastName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {sel.employeeId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            employeeId: '',
                            template: '',
                          }))
                        }
                        className="text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })()}
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                {t('enroll.biometric_type')}
              </label>
              <div className="ovds-grid-layout cols-3 gap-sm">
                {bioTypes.map((type) => (
                  <button
                    key={type.value}
type="button"
                    onClick={() => setBioType(type.value)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      bioType === type.value
                        ? 'bg-emerald-50/50 border-emerald-600 text-emerald-600 dark:text-emerald-400 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                {t('enroll.template_label')}
              </label>
              <div className="relative group">
                <Hash
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 dark:text-emerald-400 transition-colors"
                />
                <input
                  type="text"
                  required
                  value={formData.template}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value })
                  }
                  placeholder={t('enroll.template_placeholder')}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-teal-400/10 focus:bg-white focus:border-teal-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.employeeId}
              className="w-full py-4 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium uppercase tracking-wider shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : editingId ? (
                <FileEdit size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              {editingId ? t('enroll.update_btn') : t('enroll.register_btn')}
            </button>

            {message && (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {message.text}
                </span>
              </div>
            )}
          </form>

          {existingBio.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                {t('enroll.registered_bio')}
              </h3>
              <div className="space-y-3 max-h-32 overflow-auto">
                {existingBio.map((bio) => (
                  <div
                    key={bio.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 shadow-sm">
                        {bio.type === 'FINGERPRINT' && <Fingerprint size={16} />}
                        {bio.type === 'FACE_RECOGNITION' && <Camera size={16} />}
                        {bio.type === 'IRIS_SCAN' && <Eye size={16} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {bio.type.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate w-32">
                          {bio.template.slice(0, 20)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBioType(bio.type);
                          setFormData({ ...formData, template: bio.template });
                          setEditingId(bio.id);
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-950/20 rounded-xl transition-all"
                      >
                        <FileEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBio(bio.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {formData.employeeId && bioPagination.pages > 1 && (
                <div className="flex items-center gap-2 pt-2 text-[10px]">
                  <button
                    onClick={bioPagination.prev}
                    disabled={!bioPagination.hasPrev}
                    className="px-2 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-bold transition-all"
                  >
                    Prev
                  </button>
                  <span className="font-bold text-slate-700 px-2">
                    {bioPagination.page} / {bioPagination.pages}
                  </span>
                  <button
                    onClick={bioPagination.next}
                    disabled={!bioPagination.hasNext}
                    className="px-2 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600 font-bold transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-2xl overflow-hidden relative group h-full flex flex-col border-[8px] border-slate-800">
          {bioType === 'FACE_RECOGNITION' || bioType === 'IRIS_SCAN' ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-rose-500 text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Live Stream
                  </span>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md text-white/60 text-[10px] font-bold">
                  720p HD • {bioType.replace('_', ' ')}
                </div>
              </div>

              <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                ></video>
                <div className="absolute inset-0 border-[2px] border-emerald-200 dark:border-emerald-800 rounded-2xl pointer-events-none"></div>

                {/* Visual effects overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-64 h-64 border-2 border-dashed border-white/20 rounded-full animate-spin-slow ${bioType === 'IRIS_SCAN' ? 'scale-50' : ''}`}
                  ></div>
                  <div
                    className={`absolute w-48 h-48 border border-emerald-300 dark:border-emerald-700 rounded-2xl ${bioType === 'FACE_RECOGNITION' ? 'opacity-100' : 'opacity-0'}`}
                  ></div>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-600/50 to-transparent animate-scan"></div>
                </div>
              </div>

              <div className="ovds-grid-layout cols-2 mt-6">
                <button
                  type="button"
                  onClick={captureImage}
                  className="flex-1 py-5 bg-white dark:bg-slate-200 text-slate-900 rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
                >
                  <Camera size={16} />
                  {t('enroll.capture_btn')}
                </button>
                <button
                  type="button"
                  onClick={enrollHardware}
                  disabled={isScanning || !formData.employeeId}
                  className="flex-1 py-5 bg-emerald-500 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {isScanning ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  {t('enroll.hardware_scan_btn')}
                </button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div
                className={`w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner transition-all ${isScanning ? 'animate-pulse bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400' : 'group-hover:bg-emerald-50 dark:bg-emerald-950/20'}`}
              >
                <Fingerprint
                  size={64}
                  className={`transition-all ${isScanning ? 'text-emerald-600 dark:text-emerald-400' : 'text-white/20 group-hover:text-emerald-300'}`}
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {isScanning ? t('enroll.scanning_device') : t('fingerprint')}
                </h3>
                <p className="text-white/40 text-xs font-medium max-w-[240px] mt-2">
                  {t('enroll.fingerprint_instruction')}
                </p>
              </div>

              <button
                type="button"
                onClick={enrollHardware}
                disabled={isScanning || !formData.employeeId}
                className="px-8 py-3 bg-white dark:bg-slate-200 text-slate-900 rounded-xl text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-xl"
              >
                {isScanning ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Fingerprint size={16} />
                )}
                {isScanning
                  ? t('enroll.initializing_hardware')
                  : t('enroll.start_scan_btn')}
              </button>

              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-white/60 text-[10px] font-bold flex items-center gap-3">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                {isScanning
                  ? t('enroll.waiting_hardware')
                  : t('enroll.system_ready')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Enrollment;













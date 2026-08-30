/**
 * useBusinessRegistration — wizard state and API integration for the
 * Ethiopian Business Registration / Harmonization flow.
 *
 * Manages 5-step wizard: NID → TIN → Business License → VAT → Cross-reference
 * Auto-saves draft to localStorage; validates each step before advancing.
 */
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  isValidTin,
  isValidFaydaId,
  deriveHarmonizationStatus,
  computeHarmonizationPct,
} from '@ovds/shared';
import type {
  BusinessHarmonization,
  HarmonizationStatus,
  VerificationStatus,
  VatRegistrationStatus,
  EcrStatus,
} from '@ovds/shared';
// Local stubs for DTOs not yet exported from @ovds/dto
type SaveNidDto = Record<string, unknown>;
type SaveTinDto = Record<string, unknown>;
type SaveBusinessLicenseDto = Record<string, unknown>;
type SaveVatDto = Record<string, unknown>;
type SaveCrossReferenceDto = Record<string, unknown>;

export type WizardStepId = 'nid' | 'tin' | 'license' | 'vat' | 'crossref';

const STEPS: WizardStepId[] = ['nid', 'tin', 'license', 'vat', 'crossref'];
const DRAFT_KEY = 'ovds_biz_reg_draft';
const RECORD_URL = '/business-registration';

export interface NidFormState {
  faydaId: string;
  fullName: string;
  dateOfBirth: string;
}

export interface TinFormState {
  tin: string;
  businessName: string;
  taxOffice: string;
  biometricComplete: boolean;
}

export interface LicenseFormState {
  licenseNumber: string;
  tradeName: string;
  activity: string;
  registeredAddress: string;
  annualTurnover: string;
  issuedAt: string;
  expiresAt: string;
}

export interface VatFormState {
  vatNumber: string;
  registrationStatus: VatRegistrationStatus;
  ecrStatus: EcrStatus;
  ecrSerial: string;
}

export interface CrossRefFormState {
  nidTinLinked: boolean;
  tinLicenseLinked: boolean;
  licenseVatLinked: boolean;
  morSystemActive: boolean;
  conflictNotes: string;
}

export interface WizardDraft {
  nid: NidFormState;
  tin: TinFormState;
  license: LicenseFormState;
  vat: VatFormState;
  crossref: CrossRefFormState;
}

const INITIAL_DRAFT: WizardDraft = {
  nid: { faydaId: '', fullName: '', dateOfBirth: '' },
  tin: { tin: '', businessName: '', taxOffice: '', biometricComplete: false },
  license: {
    licenseNumber: '', tradeName: '', activity: '',
    registeredAddress: '', annualTurnover: '', issuedAt: '', expiresAt: '',
  },
  vat: {
    vatNumber: '', registrationStatus: 'NOT_REGISTERED',
    ecrStatus: 'NOT_REQUIRED', ecrSerial: '',
  },
  crossref: {
    nidTinLinked: false, tinLicenseLinked: false,
    licenseVatLinked: false, morSystemActive: false, conflictNotes: '',
  },
};

function loadDraft(): WizardDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...INITIAL_DRAFT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return INITIAL_DRAFT;
}

export type StepErrors = Partial<Record<string, string>>;

const VALIDATORS_BASE: Record<WizardStepId, (form: WizardDraft) => StepErrors> = {
  nid:      (d) => {
    const e: StepErrors = {};
    const f = d.nid;
    if (!f.faydaId) e.faydaId = 'Fayda ID is required';
    else if (!isValidFaydaId(f.faydaId)) e.faydaId = 'Must be a 12-digit Fayda Identification Number';
    if (!f.fullName.trim()) e.fullName = 'Full legal name is required';
    return e;
  },
  tin:      (d) => {
    const e: StepErrors = {};
    const f = d.tin;
    if (!f.tin) e.tin = 'TIN is required';
    else if (!isValidTin(f.tin)) e.tin = 'Must be a 10-digit Ethiopian TIN';
    if (!f.businessName.trim()) e.businessName = 'Registered business name is required';
    return e;
  },
  license:  (d) => {
    const e: StepErrors = {};
    const f = d.license;
    if (!f.licenseNumber.trim()) e.licenseNumber = 'License number is required';
    if (!f.tradeName.trim()) e.tradeName = 'Trade name is required';
    if (!f.activity.trim()) e.activity = 'Business activity is required';
    if (!f.registeredAddress.trim()) e.registeredAddress = 'Registered address is required';
    return e;
  },
  vat:      (d) => {
    const e: StepErrors = {};
    const f = d.vat;
    if (f.registrationStatus === 'REGISTERED' && !f.vatNumber.trim()) {
      e.vatNumber = 'VAT number is required when registered';
    }
    if (f.ecrStatus === 'REGISTERED' && !f.ecrSerial.trim()) {
      e.ecrSerial = 'ECR serial number is required when registered';
    }
    return e;
  },
  crossref: () => ({}),
};

// Maps field names to their translation keys in the validation namespace
const FIELD_VALIDATION_KEYS: Record<string, string> = {
  faydaId:           'fayda_required',
  fullName:          'full_name_required',
  tin:               'tin_required',
  businessName:      'business_name_required',
  licenseNumber:     'license_number_required',
  tradeName:         'trade_name_required',
  activity:          'activity_required',
  registeredAddress: 'address_required',
  vatNumber:         'vat_number_required',
  ecrSerial:         'ecr_serial_required',
};

// Maps field names to their "invalid value" translation keys (subset)
const FIELD_INVALID_KEYS: Record<string, string> = {
  faydaId: 'fayda_invalid',
  tin:     'tin_invalid',
};

// -- Hook ----------------------------------------------------------------------

export function useBusinessRegistration() {
  const { t } = useTranslation();

  const translateErrors = (baseErrors: StepErrors): StepErrors =>
    Object.fromEntries(
      Object.entries(baseErrors).map(([field, msgKey]) => {
        // msgKey from VALIDATORS_BASE is a plain English fallback string
        // Derive the i18n key from the field name
        const invalidKey = FIELD_INVALID_KEYS[field];
        const requiredKey = FIELD_VALIDATION_KEYS[field];
        // Use invalid key when the base message doesn't say "required"
        const isInvalidMsg = msgKey && !msgKey.toLowerCase().includes('required');
        const resolvedKey = isInvalidMsg && invalidKey ? invalidKey : requiredKey;
        return [field, resolvedKey ? t(`validation.${resolvedKey}`) : (msgKey ?? '')];
      }),
    );

  const VALIDATORS: Record<WizardStepId, (form: WizardDraft) => StepErrors> = {
    nid:      (d) => translateErrors(VALIDATORS_BASE.nid(d)),
    tin:      (d) => translateErrors(VALIDATORS_BASE.tin(d)),
    license:  (d) => translateErrors(VALIDATORS_BASE.license(d)),
    vat:      (d) => translateErrors(VALIDATORS_BASE.vat(d)),
    crossref: () => ({}),
  };

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(loadDraft);
  const [errors, setErrors] = useState<StepErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [harmonization, setHarmonization] = useState<Partial<BusinessHarmonization>>({});
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const currentStep = STEPS[stepIndex];
  const totalSteps = STEPS.length;

  // Load existing record on mount (if available)
  useEffect(() => {
    let cancelled = false;
    const loadRecord = async () => {
      setLoadingRecord(true);
      try {
        const res = await api.get(RECORD_URL, { headers: { 'x-background': '1' } });
        const data = res.data?.data ?? res.data;
        if (data && !cancelled) {
          setHasExistingRecord(true);
          // Merge existing record into draft without overwriting newer local changes
          setDraft(prev => {
            const merged = { ...INITIAL_DRAFT };
            if (data.nid) {
              merged.nid = {
                faydaId: data.nid.faydaId ?? prev.nid.faydaId,
                fullName: data.nid.fullName ?? prev.nid.fullName,
                dateOfBirth: data.nid.dateOfBirth ?? prev.nid.dateOfBirth,
              };
            }
            if (data.tin) {
              merged.tin = {
                tin: data.tin.tin ?? prev.tin.tin,
                businessName: data.tin.businessName ?? prev.tin.businessName,
                taxOffice: data.tin.taxOffice ?? prev.tin.taxOffice,
                biometricComplete: data.tin.biometricComplete ?? prev.tin.biometricComplete,
              };
            }
            if (data.businessLicense) {
              merged.license = {
                licenseNumber: data.businessLicense.licenseNumber ?? prev.license.licenseNumber,
                tradeName: data.businessLicense.tradeName ?? prev.license.tradeName,
                activity: data.businessLicense.activity ?? prev.license.activity,
                registeredAddress: data.businessLicense.registeredAddress ?? prev.license.registeredAddress,
                annualTurnover: data.businessLicense.annualTurnover != null
                  ? String(data.businessLicense.annualTurnover)
                  : prev.license.annualTurnover,
                issuedAt: data.businessLicense.issuedAt ?? prev.license.issuedAt,
                expiresAt: data.businessLicense.expiresAt ?? prev.license.expiresAt,
              };
            }
            if (data.vat) {
              merged.vat = {
                vatNumber: data.vat.vatNumber ?? prev.vat.vatNumber,
                registrationStatus: data.vat.registrationStatus ?? prev.vat.registrationStatus,
                ecrStatus: data.vat.ecrStatus ?? prev.vat.ecrStatus,
                ecrSerial: data.vat.ecrSerial ?? prev.vat.ecrSerial,
              };
            }
            if (data.crossReference) {
              merged.crossref = {
                nidTinLinked: data.crossReference.nidTinLinked ?? prev.crossref.nidTinLinked,
                tinLicenseLinked: data.crossReference.tinLicenseLinked ?? prev.crossref.tinLicenseLinked,
                licenseVatLinked: data.crossReference.licenseVatLinked ?? prev.crossref.licenseVatLinked,
                morSystemActive: data.crossReference.morSystemActive ?? prev.crossref.morSystemActive,
                conflictNotes: data.crossReference.conflictNotes?.[0] ?? prev.crossref.conflictNotes,
              };
            }
            return merged;
          });
        }
      } catch {
        // No existing record or endpoint not wired yet — proceed with empty draft
      } finally {
        if (!cancelled) setLoadingRecord(false);
      }
    };
    loadRecord();
    return () => { cancelled = true; };
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  // Derive live harmonization snapshot from draft
  useEffect(() => {
    const record: Partial<BusinessHarmonization> = {
      nid: draft.nid.faydaId
        ? { faydaId: draft.nid.faydaId, fullName: draft.nid.fullName, status: 'PENDING' }
        : undefined,
      tin: draft.tin.tin
        ? { tin: draft.tin.tin, businessName: draft.tin.businessName, status: 'PENDING', biometricComplete: draft.tin.biometricComplete }
        : undefined,
      businessLicense: draft.license.licenseNumber
        ? { licenseNumber: draft.license.licenseNumber, tradeName: draft.license.tradeName, status: 'PENDING' }
        : undefined,
      vat: draft.vat.registrationStatus !== 'NOT_REGISTERED'
        ? { vatNumber: draft.vat.vatNumber, registrationStatus: draft.vat.registrationStatus, status: 'PENDING', filingDeadlineDay: 30, ecrStatus: draft.vat.ecrStatus }
        : undefined,
      crossReference: {
        nidTinLinked: draft.crossref.nidTinLinked,
        tinLicenseLinked: draft.crossref.tinLicenseLinked,
        licenseVatLinked: draft.crossref.licenseVatLinked,
        morSystemActive: draft.crossref.morSystemActive,
      },
    };
    record.completionPct = computeHarmonizationPct(record);
    record.overallStatus = deriveHarmonizationStatus(record);
    setHarmonization(record);
  }, [draft]);

  const updateNid = useCallback((patch: Partial<NidFormState>) => {
    setDraft(d => ({ ...d, nid: { ...d.nid, ...patch } }));
    setErrors({});
  }, []);

  const updateTin = useCallback((patch: Partial<TinFormState>) => {
    setDraft(d => ({ ...d, tin: { ...d.tin, ...patch } }));
    setErrors({});
  }, []);

  const updateLicense = useCallback((patch: Partial<LicenseFormState>) => {
    setDraft(d => ({ ...d, license: { ...d.license, ...patch } }));
    setErrors({});
  }, []);

  const updateVat = useCallback((patch: Partial<VatFormState>) => {
    setDraft(d => ({ ...d, vat: { ...d.vat, ...patch } }));
    setErrors({});
  }, []);

  const updateCrossRef = useCallback((patch: Partial<CrossRefFormState>) => {
    setDraft(d => ({ ...d, crossref: { ...d.crossref, ...patch } }));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setStepIndex(index);
      setErrors({});
    }
  }, [totalSteps]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1);
      setErrors({});
    }
  }, [stepIndex]);

  const goNext = useCallback(async () => {
    const errs = VALIDATORS[currentStep](draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Save current step to API
    setSaving(true);
    try {
      await saveCurrentStep();
      if (stepIndex < totalSteps - 1) {
        setStepIndex(i => i + 1);
      }
    } catch {
      // Error is toasted inside saveCurrentStep
    } finally {
      setSaving(false);
    }
  }, [currentStep, draft, stepIndex, totalSteps]);

  const saveCurrentStep = async () => {
    setSaveStatus('saving');
    try {
      switch (currentStep) {
        case 'nid': {
          const dto: SaveNidDto = {
            faydaId: draft.nid.faydaId.replace(/[\s-]/g, ''),
            fullName: draft.nid.fullName,
            dateOfBirth: draft.nid.dateOfBirth || undefined,
          };
          await api.post('/business-registration/nid', dto);
          break;
        }
        case 'tin': {
          const dto: SaveTinDto = {
            tin: draft.tin.tin.replace(/[-\s]/g, ''),
            businessName: draft.tin.businessName,
            taxOffice: draft.tin.taxOffice || undefined,
            biometricComplete: draft.tin.biometricComplete,
          };
          await api.post('/business-registration/tin', dto);
          break;
        }
        case 'license': {
          const dto: SaveBusinessLicenseDto = {
            licenseNumber: draft.license.licenseNumber,
            tradeName: draft.license.tradeName,
            activity: draft.license.activity,
            registeredAddress: draft.license.registeredAddress,
            annualTurnover: draft.license.annualTurnover
              ? parseFloat(draft.license.annualTurnover)
              : undefined,
            issuedAt: draft.license.issuedAt || undefined,
            expiresAt: draft.license.expiresAt || undefined,
          };
          await api.post('/business-registration/license', dto);
          break;
        }
        case 'vat': {
          const dto: SaveVatDto = {
            vatNumber: draft.vat.vatNumber,
            registrationStatus: draft.vat.registrationStatus,
            ecrStatus: draft.vat.ecrStatus,
            ecrSerial: draft.vat.ecrSerial || undefined,
          };
          await api.post('/business-registration/vat', dto);
          break;
        }
        case 'crossref': {
          const dto: SaveCrossReferenceDto = {
            nidTinLinked: draft.crossref.nidTinLinked,
            tinLicenseLinked: draft.crossref.tinLicenseLinked,
            licenseVatLinked: draft.crossref.licenseVatLinked,
            morSystemActive: draft.crossref.morSystemActive,
            conflictNotes: draft.crossref.conflictNotes
              ? [draft.crossref.conflictNotes]
              : undefined,
          };
          await api.post('/business-registration/cross-reference', dto);
          break;
        }
      }
      setSaveStatus('saved');
      setHasExistingRecord(true);
      toast.success(t('toasts.saved'));
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      // Non-404 backend errors are surfaced; 404 = endpoint not yet implemented (graceful)
      if (err?.response?.status !== 404) {
        const msg = err?.response?.data?.message ?? t('toasts.save_step_failed');
        toast.error(msg);
        throw err;
      }
      // Endpoint not yet wired — silently proceed (frontend-first mode)
      setSaveStatus('idle');
    }
  };

  const invalidateCache = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasExistingRecord(false);
  }, []);

  const refetchRecord = useCallback(async () => {
    setLoadingRecord(true);
    try {
      const res = await api.get(RECORD_URL, { headers: { 'x-background': '1' } });
      const data = res.data?.data ?? res.data;
      if (data) {
        setHasExistingRecord(true);
        toast.success(t('toasts.record_loaded'));
      }
    } catch {
      toast.error(t('toasts.record_load_failed'));
    } finally {
      setLoadingRecord(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const errs = VALIDATORS[currentStep](draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await saveCurrentStep();
      // Final submit — mark harmonization complete
      await api.post('/business-registration/complete', {}).catch((e: any) => {
        if (e?.response?.status !== 404) throw e;
      });
      invalidateCache();
      setSubmitted(true);
      toast.success(t('toasts.harmonized_success'));
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message ?? t('toasts.submission_failed'));
      } else {
        // Endpoint not wired — mark done anyway
        invalidateCache();
        setSubmitted(true);
        toast.success(t('toasts.saved_success'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [currentStep, draft, invalidateCache]);

  const resetWizard = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setStepIndex(0);
    setErrors({});
    setSubmitted(false);
    invalidateCache();
  }, [invalidateCache]);

  return {
    // State
    stepIndex,
    currentStep,
    totalSteps,
    steps: STEPS,
    draft,
    errors,
    saving,
    submitting,
    submitted,
    harmonization,
    loadingRecord,
    hasExistingRecord,
    saveStatus,

    // Field updaters
    updateNid,
    updateTin,
    updateLicense,
    updateVat,
    updateCrossRef,

    // Navigation
    goToStep,
    goBack,
    goNext,
    handleSubmit,
    resetWizard,

    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === totalSteps - 1,
    completionPct: harmonization.completionPct ?? 0,
    overallStatus: harmonization.overallStatus ?? 'INCOMPLETE',

    // Record management
    invalidateCache,
    refetchRecord,
  };
}


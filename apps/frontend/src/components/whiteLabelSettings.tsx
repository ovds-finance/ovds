import {
  Tag, Upload, RotateCcw, Save, Eye, Palette,
  Type, Layout, CheckCircle, Image,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

import { useLocalStorage } from '../hooks';


interface WhiteLabelConfig {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  logoDataUrl: string;
  hidePoweredBy: boolean;
  invoiceFooter: string;
  dashboardLayout: 'default' | 'compact' | 'wide';
  fontStyle: 'default' | 'serif' | 'mono';
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  brandName: 'Ovds',
  primaryColor: '#00E784',
  accentColor: '#00E784',
  logoDataUrl: '',
  hidePoweredBy: false,
  invoiceFooter: 'Thank you for your business.',
  dashboardLayout: 'default',
  fontStyle: 'default',
};

const PRESET_PALETTES = [
  { name: 'Ocean Blue',   primary: '#00E784', accent: '#0ea5e9' },
  { name: 'Forest',       primary: '#00C96E', accent: '#84cc16' },
  { name: 'Sunset',       primary: '#ea580c', accent: '#f59e0b' },
  { name: 'Violet',       primary: '#7c3aed', accent: '#a855f7' },
  { name: 'Rose',         primary: '#e11d48', accent: '#f43f5e' },
  { name: 'Slate',        primary: '#475569', accent: '#64748b' },
];

interface Props {
  canWrite: boolean;
}

const WhiteLabelSettings: React.FC<Props> = ({ canWrite }) => {
  const [config, setConfig] = useLocalStorage<WhiteLabelConfig>('white_label_config', DEFAULT_CONFIG);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<WhiteLabelConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { toast.error('Logo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => update({ logoDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success('White-label settings saved');
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    toast('Settings reset to defaults');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
            <Tag size={16} className="text-violet-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">White-Label Customization</p>
            <p className="ovds-caption">Remove Ovds branding and apply your own identity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${preview ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <Eye size={13} /> {preview ? 'Hide Preview' : 'Preview'}
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-all">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Live preview banner */}
      {preview && (
        <div
          className="rounded-xl p-4 border-2 flex items-center gap-4 transition-all"
          style={{ borderColor: config.primaryColor, background: `${config.primaryColor}10` }}
        >
          {config.logoDataUrl ? (
            <img src={config.logoDataUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm" style={{ background: config.primaryColor }}>
              {config.brandName?.[0] ?? 'O'}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white" style={{ color: config.primaryColor }}>{config.brandName || 'Your Brand'}</p>
            <p className="ovds-caption">FINCLOUD</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ background: config.primaryColor }} title="Primary" />
            <div className="w-6 h-6 rounded-full" style={{ background: config.accentColor }} title="Accent" />
          </div>
        </div>
      )}

      <div className="ovds-grid-layout cols-2">
        {/* Brand Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Type size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Brand Identity</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Brand Name</label>
            <input
              value={config.brandName}
              onChange={e => update({ brandName: e.target.value })}
              disabled={!canWrite}
              placeholder="Your Company Name"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60"
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logo</label>
            <div className="flex items-center gap-3">
              {config.logoDataUrl ? (
                <img src={config.logoDataUrl} alt="Logo" className="h-12 w-auto object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white" />
              ) : (
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
                  <Image size={18} className="text-slate-400" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={!canWrite}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-200)]/10 text-slate-800 rounded-lg text-xs font-bold hover:bg-[var(--pro-azure-200)]/20 transition-all disabled:opacity-50"
                >
                  <Upload size={12} /> Upload Logo
                </button>
                {config.logoDataUrl && (
                  <button onClick={() => update({ logoDataUrl: '' })} className="text-[10px] text-rose-600 hover:underline">Remove</button>
                )}
                <p className="ovds-caption">PNG, SVG · max 500KB</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Hide powered by */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Hide "Powered by Ovds"</p>
              <p className="ovds-caption">Remove Ovds branding from invoices and footer</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.hidePoweredBy}
              disabled={!canWrite}
              onClick={() => update({ hidePoweredBy: !config.hidePoweredBy })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${config.hidePoweredBy ? 'bg-[var(--pro-azure)]' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${config.hidePoweredBy ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Colors</p>
          </div>

          <div className="ovds-grid-layout cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.primaryColor} onChange={e => update({ primaryColor: e.target.value })} disabled={!canWrite}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50 p-0.5" />
                <input value={config.primaryColor} onChange={e => update({ primaryColor: e.target.value })} disabled={!canWrite}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.accentColor} onChange={e => update({ accentColor: e.target.value })} disabled={!canWrite}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50 p-0.5" />
                <input value={config.accentColor} onChange={e => update({ accentColor: e.target.value })} disabled={!canWrite}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* Preset palettes */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Preset Palettes</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_PALETTES.map(p => (
                <button
                  key={p.name}
                  onClick={() => update({ primaryColor: p.primary, accentColor: p.accent })}
                  disabled={!canWrite}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50"
                  title={p.name}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: p.accent }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layout & Typography */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Layout size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Layout & Typography</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dashboard Layout</label>
            <div className="flex gap-2">
              {(['default', 'compact', 'wide'] as const).map(l => (
                <button key={l} onClick={() => update({ dashboardLayout: l })} disabled={!canWrite}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold capitalize transition-all disabled:opacity-50 ${config.dashboardLayout === l ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Font Style</label>
            <div className="flex gap-2">
              {(['default', 'serif', 'mono'] as const).map(f => (
                <button key={f} onClick={() => update({ fontStyle: f })} disabled={!canWrite}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold capitalize transition-all disabled:opacity-50 ${config.fontStyle === f ? 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)]'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice footer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Invoice Customization</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Invoice Footer Text</label>
            <textarea
              value={config.invoiceFooter}
              onChange={e => update({ invoiceFooter: e.target.value })}
              disabled={!canWrite}
              rows={3}
              placeholder="Thank you for your business."
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400/20 resize-none disabled:opacity-60"
            />
            <p className="ovds-caption">Appears at the bottom of every invoice PDF</p>
          </div>

          {/* Preview invoice footer */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Invoice Footer Preview</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">{config.invoiceFooter || 'Thank you for your business.'}</p>
              {!config.hidePoweredBy && (
                <p className="ovds-caption">Powered by Ovds</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      {canWrite && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Changes apply to invoices, dashboard, and exported documents</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] transition-all shadow-sm shadow-green-500/20 dark:shadow-green-500/10/30 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save White-Label Settings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WhiteLabelSettings;









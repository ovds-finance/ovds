import { 
  Cpu, 
  Database, 
  FileCode, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Monitor,
  Smartphone,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';
import React from 'react';

export const IngestionWorkflowOverview: React.FC = () => {
  const steps = [
    {
      title: "Multi-Source Ingestion",
      icon: <Layers className="text-[var(--pro-azure)]" size={24} />,
      description: "Capture from any source including Screenshots, QR codes, Vouchers, PDFs, Excel/CSV, POS systems, and Camera capture.",
      details: ["Mobile Camera", "Voucher Codes", "QR Scanners", "API Integrations"]
    },
    {
      title: "Systematic Tracing",
      icon: <Cpu className="text-purple-500" size={24} />,
      description: "Intelligent extraction & tracing pipeline. Cross-references bank references (CBE, Awash) and Telebirr receipts with existing ledger records.",
      details: ["Bank Reconciliation", "Duplicate Detection", "Confidence Scoring", "Bilingual Support"]
    },
    {
      title: "Validation & Correction",
      icon: <ShieldCheck className="text-[var(--pro-azure)]" size={24} />,
      description: "Automated business rule validation against Ethiopian tax law (ERCA). Human-in-the-loop interface for low-confidence extractions.",
      details: ["TIN Validation", "VAT Calculation Check", "Duplicate Detection", "Audit Trail"]
    },
    {
      title: "Document-Capable Storage",
      icon: <Database className="text-amber-500" size={24} />,
      description: "Unified storage in a document-ready database (MariaDB JSON/Doc). Preserves raw blobs, OCR metadata, and structured records.",
      details: ["JSON Schema Storage", "Versioned Records", "Raw Blob Archival", "High Availability"]
    },
    {
      title: "Downstream Integration",
      icon: <Zap className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" size={24} />,
      description: "Automatic posting to General Ledger, VAT Ledgers, and Disaster Fund (DRRF) schedules. Real-time updates via WebSockets.",
      details: ["GL Auto-Posting", "VAT Filing Pre-fill", "Analytics Sync", "Instant Notifications"]
    }
  ];

  return (
    <div className="p-6 ovds-widget-card shadow-ovds-lg">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-900/30 rounded-2xl">
          <Zap className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" size={28} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">AI Ingestion Pipeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">High-level technical workflow</p>
        </div>
      </div>

      {/* Workflow Diagram (Visual Steps) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-12">
        {/* Connector Lines (Desktop) */}
        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-0" />
        
        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center text-center">
            <div className={`p-4 rounded-2xl border-2 mb-4 transition-all duration-300 hover:scale-110 shadow-sm
              ${idx === 0 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-900/20 dark:border-green-800' : 
                idx === 1 ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' :
                idx === 2 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-900/20 dark:border-green-800' :
                idx === 3 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              {step.icon}
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Step 0{idx + 1}</h3>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</h4>
          </div>
        ))}
      </div>

      {/* Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-[var(--pro-azure)]/40 dark:hover:border-green-900 transition-colors group">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:rotate-12 transition-transform">
                {step.icon}
              </div>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{step.title}</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed font-medium">
              {step.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {step.details.map((detail, dIdx) => (
                <span key={dIdx} className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {detail}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Source Capability Footer */}
      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-8 opacity-60">
        <div className="flex items-center gap-2 text-slate-500"><Smartphone size={16}/> <span className="text-xs font-bold">Mobile App</span></div>
        <div className="flex items-center gap-2 text-slate-500"><Monitor size={16}/> <span className="text-xs font-bold">Web Dashboard</span></div>
        <div className="flex items-center gap-2 text-slate-500"><QrCode size={16}/> <span className="text-xs font-bold">QR Point-of-Sale</span></div>
        <div className="flex items-center gap-2 text-slate-500"><FileSpreadsheet size={16}/> <span className="text-xs font-bold">Bulk Excel/CSV</span></div>
        <div className="flex items-center gap-2 text-slate-500"><FileCode size={16}/> <span className="text-xs font-bold">Legacy POS Integration</span></div>
      </div>
    </div>
  );
};








// InvoiceCaptureModal — Enhanced full-stack invoice capture hub v7
// Upload/Drop | Camera | QR Scan | Bank Transfer | Paste | History
// Features: multi-file, split-view, line-item editor, VAT selector, currency, duplicate check,
//           smart item mapping, CSV export, keyboard shortcuts, attachment preview, bilingual UI,
//           image rotate/flip, TIN validation, payment source badge, recurring toggle,
//           auto due-date, raw OCR text, progress stepper, zoom preview,
//           drag-to-reorder items, template save/load, customer autocomplete,
//           print preview, auto payment source detection, multi-currency display,
//           invoice discount, auto-save draft, undo/redo, QR generation, watermark print,
//           signature capture, confidence breakdown, accessibility (focus trap + ARIA),
//           watermark on print, email preview, item notes, paste-from-Excel, ERCA export,
//           batch save history, item auto-numbering, dark-mode print
import {
  X, Upload, Camera, QrCode, Building2, ClipboardPaste, Loader2, CheckCircle2,
  AlertTriangle, Printer, Send, Save, Edit3, Zap, Wifi, Sparkles, ScanLine,
  Copy, RotateCcw, Plus, Trash2, History, FileImage,
  RefreshCw, Eye, EyeOff, ArrowRight, Download, ShieldAlert, Languages,
  Table2, Percent, GripVertical, FlipHorizontal, ZoomIn, ChevronDown,
  Repeat2, Link2, ShieldCheck, ShieldX, CalendarClock, FileText,
  BookTemplate, Search, Monitor,
  Undo2, Redo2, PenLine, Stamp, BarChart3, Wifi as 
  Mail, StickyNote, FileCode2, Archive,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import api from "../../services/api";
import { prompt, normalizeOcrError } from "../../utils";
import { QR_CODE_SERVICE_URL } from '../../utils/constants';
import { ETH_TAX } from "../../utils/ethiopianTax";

import { IngestionWorkflowOverview } from "./ingestionWorkflowOverview";

export interface CapturedInvoiceData {
  invoiceNumber?: string; date?: string; dueDate?: string;
  customerName?: string; customerEmail?: string; customerPhone?: string;
  customerAddress?: string; customerTin?: string;
  subtotal?: number; vatAmount?: number; totalAmount?: number; discountAmount?: number;
  paymentMethod?: string; bankName?: string; bankAccountNo?: string;
  telecomRef?: string; notes?: string; receiptImageData?: string;
  bankSlipImageData?: string; bankQrRawData?: string; paymentSource?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number; discount: number; total: number; note?: string }>;
  confidence?: number; provider?: string; status?: string;
  isRecurring?: boolean; recurringInterval?: string;
  rawOcrText?: string; currency?: string;
  invoiceDiscount?: number; signatureData?: string; watermark?: string;
  ingestionSource?: string;
}

interface CaptureHistory { id: string; tab: string; data: CapturedInvoiceData; capturedAt: string; preview?: string; }

interface Props {
  onClose: () => void;
  onApply: (data: CapturedInvoiceData) => void;
  onSaveDraft?: (data: CapturedInvoiceData) => void;
  itemsList?: any[];
  settings?: any;
  invoice?: any;
}

type CaptureTab = "upload" | "camera" | "qr" | "bank" | "paste" | "history" | "workflow";
const HISTORY_KEY = "invoice_capture_history";
const MAX_HISTORY = 10;

// Bilingual field labels (EN / AM)
const FIELD_LABELS: Record<string, [string, string]> = {
  invoiceNumber:  ["Invoice #",    "ደረሰኝ ቁጥር"],
  date:           ["Date",         "ቀን"],
  dueDate:        ["Due Date",     "የክፍያ ቀን"],
  customerName:   ["Customer",     "ደንበኛ"],
  customerEmail:  ["Email",        "ኢሜይል"],
  customerPhone:  ["Phone",        "ስልክ"],
  customerAddress:["Address",      "አድራሻ"],
  customerTin:    ["TIN",          "TIN ቁጥር"],
  totalAmount:    ["Total",        "ጠቅላላ"],
  subtotal:       ["Subtotal",     "ንዑስ ድምር"],
  vatAmount:      ["VAT",          "ቫት"],
  bankName:       ["Bank",         "ባንክ"],
  bankAccountNo:  ["Account No",   "የሂሳብ ቁጥር"],
  telecomRef:     ["Telecom Ref",  "ቴሌኮም ማጣቀሻ"],
  paymentSource:  ["Source",       "ምንጭ"],
  notes:          ["Notes",        "ማስታወሻ"],
};

// -- Helpers --------------------------------------------------------------
const PAYMENT_TERMS_DAYS: Record<string,number> = { IMMEDIATE:0, NET7:7, NET15:15, NET30:30, NET60:60, NET90:90 };
const RECURRING_INTERVALS = ["WEEKLY","MONTHLY","QUARTERLY","YEARLY"];
const TEMPLATE_KEY = "invoice_capture_templates";

// Approximate ETB exchange rates (updated periodically)
const FX_TO_ETB: Record<string,number> = { USD:56, EUR:61, GBP:72, AED:15, SAR:15, CNY:8 };

function toEtb(amount: number, currency?: string): number | null {
  if (!currency || currency === "ETB") return null;
  const rate = FX_TO_ETB[currency.toUpperCase()];
  return rate ? Math.round(amount * rate * 100) / 100 : null;
}

// Auto-detect payment source from telecom ref pattern
function detectPaymentSource(ref?: string): string {
  if (!ref) return "MANUAL";
  const r = ref.trim().toUpperCase();
  if (/^[A-Z0-9]{7,12}$/.test(r) && !/^(CBE|AWB|DSH|BOA|NIB|OIB|ZMB|BRH|BNB|ENB|LIB|TSB|AMB|COOP|ADIB|HJB|SNB|GDB)/.test(r)) return "TELECOM";
  if (/^(CBE|CBEBIRR)/.test(r)) return "BANK_QR";
  if (/^(AWB|DSH|BOA|NIB|OIB|ZMB|BRH|BNB|ENB|LIB|TSB|AMB|COOP|ADIB|HJB|SNB|GDB|HBT|GBE|AHB|GOH|SDB|SHB|RAM|TSH|MP)/.test(r)) return "BANK_QR";
  return "MANUAL";
}

function loadTemplates(): Array<{name:string;data:Partial<CapturedInvoiceData>}> {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}
function saveTemplates(t: Array<{name:string;data:Partial<CapturedInvoiceData>}>) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t.slice(0, 20)));
}

const AUTOSAVE_KEY = "invoice_capture_autosave";

// Generate a simple payment QR string (NBE pipe-delimited format)
function generatePaymentQr(d: CapturedInvoiceData): string {
  const parts = [
    d.bankName ?? "OVDS",
    d.bankAccountNo ?? "",
    d.customerName ?? "",
    String(d.totalAmount ?? 0),
    d.invoiceNumber ?? "",
    d.currency ?? "ETB",
  ];
  return parts.join("|");
}

// Render QR as SVG path using a simple matrix approach (for display only)
function qrToSvgDataUrl(text: string): string {
  // Use a canvas + qrcode-generator approach via data URI
  // We encode the text as a URL for a QR API service
  return `${QR_CODE_SERVICE_URL}?size=120x120&data=${encodeURIComponent(text)}&format=svg`;
}

// ERCA-compliant JSON export
function buildErcaExport(d: CapturedInvoiceData): string {
  return JSON.stringify({
    ercaVersion: "1.0",
    invoiceNumber: d.invoiceNumber,
    issueDate: d.date,
    dueDate: d.dueDate,
    buyer: { name: d.customerName, tin: d.customerTin, email: d.customerEmail, phone: d.customerPhone, address: d.customerAddress },
    items: (d.items ?? []).map((it, i) => ({
      lineNumber: i + 1, description: it.description, quantity: it.quantity,
      unitPrice: it.unitPrice, discountRate: it.discount, lineTotal: it.total, note: it.note,
    })),
    subtotal: d.subtotal, vatRate: d.vatAmount ? (Math.round((d.vatAmount / (d.subtotal || 1)) * 100)) : 15, vatAmount: d.vatAmount,
    invoiceDiscount: d.invoiceDiscount, totalAmount: d.totalAmount,
    currency: d.currency ?? "ETB", paymentMethod: d.paymentMethod,
    bankName: d.bankName, bankAccountNo: d.bankAccountNo, telecomRef: d.telecomRef,
    paymentSource: d.paymentSource, isRecurring: d.isRecurring,
    generatedAt: new Date().toISOString(), generatedBy: "OVDS Invoice Capture",
  }, null, 2);
}

// Email preview HTML
function buildEmailHtml(d: CapturedInvoiceData, cur: string): string {
  return `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:32px;color:#1e293b}.card{background:white;border-radius:12px;padding:24px;max-width:560px;margin:auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}.header{background:#444444;color:white;border-radius:8px;padding:16px 20px;margin-bottom:20px}.title{font-size:20px;font-weight:900;margin:0}.sub{font-size:12px;opacity:.8;margin:4px 0 0}.field{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.label{color:#64748b;font-weight:600}.value{font-weight:700}.total{font-size:16px;font-weight:900;color:#444444}.footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:20px}</style></head><body><div class="card"><div class="header"><p class="title">Invoice ${d.invoiceNumber ?? "DRAFT"}</p><p class="sub">From OVDS ovds · ${d.date ?? ""}</p></div><div class="field"><span class="label">Customer</span><span class="value">${d.customerName ?? "-"}</span></div><div class="field"><span class="label">Due Date</span><span class="value">${d.dueDate ?? "-"}</span></div><div class="field"><span class="label">Subtotal</span><span class="value">${cur} ${(d.subtotal ?? 0).toFixed(2)}</span></div><div class="field"><span class="label">VAT</span><span class="value">${cur} ${(d.vatAmount ?? 0).toFixed(2)}</span></div><div class="field"><span class="label total">Total</span><span class="value total">${cur} ${(d.totalAmount ?? 0).toFixed(2)}</span></div>${d.bankName ? `<div class="field"><span class="label">Bank</span><span class="value">${d.bankName} · ${d.bankAccountNo ?? ""}</span></div>` : ""}<div class="footer">OVDS ovds · ERCA Compliant · Please pay by ${d.dueDate ?? "due date"}</div></div></body></html>`;
}

// Parse tab-separated Excel paste into line items
function parseExcelPaste(text: string): CapturedInvoiceData["items"] {
  return text.trim().split("\n").filter(l => l.trim()).map(line => {
    const cols = line.split("\t").map(c => c.trim());
    const description = cols[0] ?? "";
    const quantity = parseFloat(cols[1]) || 1;
    const unitPrice = parseFloat(cols[2]?.replace(/[^\d.]/g, "")) || 0;
    const discount = parseFloat(cols[3]) || 0;
    const total = Math.round(quantity * unitPrice * (1 - discount / 100) * 100) / 100;
    return { description, quantity, unitPrice, discount, total };
  }).filter(it => it.description);
}
const BANK_COLORS: Record<string,string> = {
  telebirr:"bg-amber-500", cbe:"bg-[var(--pro-azure-dark)]", awash:"bg-green-600",
  dashen:"bg-rose-600", abyssinia:"bg-purple-600", amhara:"bg-teal-600",
  wegagen:"bg-orange-600", nib:"bg-[var(--pro-azure)]", oromia:"bg-[var(--pro-azure-50)]0",
};
function detectBankColor(name?: string): string {
  if (!name) return "bg-slate-500";
  const n = name.toLowerCase();
  for (const [k,v] of Object.entries(BANK_COLORS)) { if (n.includes(k)) return v; }
  return "bg-slate-500";
}
function validateTin(tin?: string): "valid"|"invalid"|"empty" {
  if (!tin) return "empty";
  return /^\d{10}$/.test(tin.trim()) ? "valid" : "invalid";
}
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function rotateImage(dataUrl: string, degrees: number): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad)); const cos = Math.abs(Math.cos(rad));
      const w = Math.round(img.width * cos + img.height * sin);
      const h = Math.round(img.width * sin + img.height * cos);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.translate(w/2, h/2); ctx.rotate(rad); ctx.drawImage(img, -img.width/2, -img.height/2);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.src = dataUrl;
  });
}
function flipImage(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.translate(img.width, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.src = dataUrl;
  });
}
function parseQRData(raw: string): Partial<CapturedInvoiceData> {
  const s = raw.trim();
  const tags: Record<string,string> = {};
  let pos = 0;
  while (pos < s.length - 3) {
    const tag = s.slice(pos, pos+2);
    const len = parseInt(s.slice(pos+2, pos+4), 10);
    if (isNaN(len) || pos+4+len > s.length) break;
    tags[tag] = s.slice(pos+4, pos+4+len);
    pos += 4+len;
  }
  if (Object.keys(tags).length > 3) return {
    bankName: tags["59"] ? tags["59"]+" (EMV QR)" : "Ethiopian Bank",
    bankAccountNo: tags["26"]?.slice(4) || tags["38"],
    totalAmount: tags["54"] ? parseFloat(tags["54"]) : undefined,
    bankQrRawData: raw, paymentSource: "BANK_QR",
  };
  const parts = s.split("|");
  if (parts.length >= 2) return {
    bankName: parts[0]?.trim(), bankAccountNo: parts[1]?.trim(),
    customerName: parts[2]?.trim(),
    totalAmount: parts[3] ? parseFloat(parts[3].replace(/[^\d.]/g,""))||undefined : undefined,
    bankQrRawData: raw, paymentSource: "BANK_QR",
  };
  return { bankQrRawData: raw, paymentSource: "BANK_QR" };
}

function calcTotals(items: CapturedInvoiceData["items"], vatRate?: number): Pick<CapturedInvoiceData,"subtotal"|"vatAmount"|"totalAmount"> {
  if (!items?.length) return {};
  const rate = vatRate !== undefined ? vatRate : ETH_TAX.VAT_RATE;
  const subtotal = items.reduce((s,it) => s + it.total, 0);
  const vatAmount = Math.round(subtotal * rate * 100) / 100;
  return { subtotal: Math.round(subtotal*100)/100, vatAmount, totalAmount: Math.round((subtotal+vatAmount)*100)/100 };
}

// Fuzzy match OCR item description to existing itemsList
function fuzzyMatchItem(desc: string, itemsList: any[]): any | null {
  if (!desc || !itemsList.length) return null;
  const d = desc.toLowerCase().trim();
  // exact match first
  let match = itemsList.find(it => it.name?.toLowerCase() === d || it.description?.toLowerCase() === d);
  if (match) return match;
  // contains match
  match = itemsList.find(it => d.includes(it.name?.toLowerCase()) || it.name?.toLowerCase().includes(d));
  return match ?? null;
}

// Check if telecomRef or bankAccountNo already used in recent invoices
async function checkDuplicate(ref?: string, accountNo?: string): Promise<boolean> {
  if (!ref && !accountNo) return false;
  try {
    const search = ref || accountNo || "";
    const r = await api.get("/ovds/invoices", { params: { search, limit: 5 } });
    const invoices: any[] = r.data?.data?.invoices ?? [];
    return invoices.some(inv =>
      (ref && inv.telecomReceiptRef === ref) ||
      (accountNo && inv.bankAccountNo === accountNo)
    );
  } catch { return false; }
}

function loadHistory(): CaptureHistory[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h: CaptureHistory[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
function pushHistory(tab: string, data: CapturedInvoiceData, preview?: string) {
  const h = loadHistory();
  h.unshift({ id: Date.now().toString(), tab, data, capturedAt: new Date().toISOString(), preview });
  saveHistory(h);
}

function ConfBadge({ v }: { v: number }) {
  const p = Math.round(v * 100);
  const c = p>=80 ? "text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]"
    : p>=50 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-rose-600 bg-rose-50 border-rose-200";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${c}`}><Sparkles size={10}/>{p}% confidence</span>;
}

const TABS: { id: CaptureTab; label: string; icon: React.ReactNode }[] = [
  { id: "upload",   label: "Upload / Drop", icon: <Upload size={15}/> },
  { id: "camera",   label: "Camera",        icon: <Camera size={15}/> },
  { id: "qr",       label: "QR Scan",       icon: <QrCode size={15}/> },
  { id: "bank",     label: "Bank Transfer", icon: <Building2 size={15}/> },
  { id: "paste",    label: "Paste / Text",  icon: <ClipboardPaste size={15}/> },
  { id: "history",  label: "History",       icon: <History size={15}/> },
  { id: "workflow", label: "Pipeline",      icon: <Zap size={15}/> },
];

const InvoiceCaptureModal: React.FC<Props> = ({ onClose, onApply, onSaveDraft, itemsList=[], settings={} }) => {
  const [tab, setTab] = useState<CaptureTab>("upload");
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState<CapturedInvoiceData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<CapturedInvoiceData>({});
  const [showPreview, setShowPreview] = useState(true);
  // upload
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const [fileQueue, setFileQueue] = useState<{name:string;status:"pending"|"done"|"error"}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment"|"user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  // qr
  const [qrText, setQrText] = useState("");
  const [qrCameraActive, setQrCameraActive] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const qrVideoRef = useRef<HTMLVideoElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrStreamRef = useRef<MediaStream|null>(null);
  const qrScanRef = useRef<ReturnType<typeof setInterval>|null>(null);
  // bank
  const [bankRef, setBankRef] = useState("");
  const [bankUrl, setBankUrl] = useState("");
  const [bankFetching, setBankFetching] = useState(false);
  // paste
  const [pasteText, setPasteText] = useState("");
  // history
  const [history, setHistory] = useState<CaptureHistory[]>(loadHistory);
  // enhancements
  const defaultVatRate = useMemo(() => Number(settings?.ovds_default_vat_rate || 15), [settings]);
  const VAT_RATES = useMemo(() => [
    { label: "0% (Exempt)", value: 0 },
    { label: "5%", value: 0.05 },
    { label: `${defaultVatRate}% (Standard)`, value: defaultVatRate / 100 }
  ], [defaultVatRate]);

  const [vatRate, setVatRate] = useState(defaultVatRate / 100);
  const [amharic, setAmharic] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  // v4 additions
  const [zoomUrl, setZoomUrl] = useState<string|null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("MONTHLY");
  const [rotating, setRotating] = useState(false);
  const [shareLink, setShareLink] = useState<string|null>(null);
  const [step, setStep] = useState<1|2|3>(1); // 1=capture 2=review 3=done
  const cur = (settings?.ovds_base_currency as string) || "ETB";
  const lbl = (k: string) => amharic ? (FIELD_LABELS[k]?.[1] ?? k) : (FIELD_LABELS[k]?.[0] ?? k);
  // v5 additions
  const [dragItemIdx, setDragItemIdx] = useState<number|null>(null);
  const [templates, setTemplates] = useState<Array<{name:string;data:Partial<CapturedInvoiceData>}>>(loadTemplates);
  const [showTemplates, setShowTemplates] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  // v6 additions
  const [undoStack, setUndoStack] = useState<CapturedInvoiceData[]>([]);
  const [redoStack, setRedoStack] = useState<CapturedInvoiceData[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [showQrGen, setShowQrGen] = useState(false);
  const [showConfBreakdown, setShowConfBreakdown] = useState(false);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigDrawing = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  // v7 additions
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [watermark, setWatermark] = useState<string>("");
  const [expandedItemNotes, setExpandedItemNotes] = useState<Set<number>>(new Set());
  const [excelPasteMode, setExcelPasteMode] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState("");

  useEffect(() => { return () => { stopCamera(); stopQrCamera(); }; }, []);

  // auto-recalc totals when items or vatRate change in edit mode
  useEffect(() => {
    if (!editing || !editData.items?.length) return;
    const totals = calcTotals(editData.items, vatRate);
    setEditData(p => ({ ...p, ...totals }));
  }, [editData.items, editing, vatRate]);

  // auto-save draft to localStorage every 30s while editing
  useEffect(() => {
    if (!editing || !captured) return;
    const timer = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(editData));
    }, 30000);
    return () => clearInterval(timer);
  }, [editing, editData, captured]);

  // restore autosave on mount if available
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved) as CapturedInvoiceData;
        if (d.invoiceNumber || d.customerName) {
          toast("Auto-saved draft restored", { icon: "💾", duration: 3000 });
          setCaptured(d); setEditData(d); setStep(2);
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // focus trap
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    el.addEventListener("keydown", handler);
    first?.focus();
    return () => el.removeEventListener("keydown", handler);
  }, []);

  // -- Undo / Redo ---------------------------------------------------------
  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(s => [...s, editData]);
    setUndoStack(s => s.slice(0, -1));
    setEditData(prev);
  };
  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, editData]);
    setRedoStack(s => s.slice(0, -1));
    setEditData(next);
  };
  // -- OCR ----------------------------------------------------------------
  const applyResult = useCallback((result: CapturedInvoiceData, preview?: string) => {
    // Auto-detect payment source if not set
    const paymentSource = result.paymentSource || detectPaymentSource(result.telecomRef);
    const withTotals = result.items?.length
      ? { ...result, paymentSource, ingestionSource: tab, ...calcTotals(result.items, vatRate) }
      : { ...result, paymentSource, ingestionSource: tab };
    setCaptured(withTotals);
    setEditData(withTotals);
    setIsDuplicate(false);
    setStep(2);
    pushHistory(tab, withTotals, preview);
    setHistory(loadHistory());
    // auto due-date from payment terms
    if (withTotals.date && !withTotals.dueDate) {
      const days = PAYMENT_TERMS_DAYS[paymentTerms] ?? 30;
      setEditData(p => ({ ...p, dueDate: addDays(withTotals.date!, days) }));
    }
    // async duplicate check
    if (withTotals.telecomRef || withTotals.bankAccountNo) {
      setDuplicateChecking(true);
      checkDuplicate(withTotals.telecomRef, withTotals.bankAccountNo)
        .then(dup => { setIsDuplicate(dup); if (dup) toast.error("⚠️ Possible duplicate — this reference was already used"); })
        .finally(() => setDuplicateChecking(false));
    }
  }, [tab, vatRate, paymentTerms]);

  const runOcr = useCallback(async (base64: string, mimeType: string, isSlip=false) => {
    setLoading(true);
    try {
      const r = await api.post("/ovds/invoices/ocr-extract", { base64Image: base64, mimeType });
      const d = r.data?.data ?? r.data;
      const result: CapturedInvoiceData = {
        invoiceNumber: d.invoiceNumber, date: d.date, dueDate: d.dueDate,
        customerName: d.customerName, customerEmail: d.customerEmail,
        customerPhone: d.customerPhone, customerAddress: d.customerAddress,
        customerTin: d.customerTin, subtotal: d.subtotal, vatAmount: d.vatAmount,
        totalAmount: d.totalAmount, paymentMethod: d.paymentMethod,
        bankName: d.bankName, bankAccountNo: d.bankAccountNo,
        telecomRef: d.telecomRef, notes: d.notes,
        items: d.items ?? [],
        confidence: d.confidence, provider: d.provider,
        paymentSource: d.bankName ? "BANK_QR" : d.telecomRef ? "TELECOM" : "MANUAL",
        receiptImageData: isSlip ? undefined : `data:${mimeType};base64,${base64}`,
        bankSlipImageData: isSlip ? `data:${mimeType};base64,${base64}` : undefined,
        rawOcrText: d.rawText ?? undefined,
      };
      applyResult(result, `data:${mimeType};base64,${base64}`);
      toast.success(`OCR complete — ${Math.round((d.confidence??0)*100)}% confidence`);
    } catch (err: any) {
      const msg = normalizeOcrError(err?.response?.data?.message ?? "OCR failed");
      toast.error(msg);
      if (msg.includes("not configured") || msg.includes("API key")) toast("Set OPENAI_API_KEY or GEMINI_API_KEY in Settings", { icon: "ℹ️" });
    } finally { setLoading(false); }
  }, [applyResult]);

  const reRunOcr = () => {
    if (!previewUrl) { toast.error("No image to re-analyse"); return; }
    const base64 = previewUrl.split(",")[1];
    const mime = previewUrl.split(";")[0].split(":")[1];
    runOcr(base64, mime);
  };

  const handleRotate = async (): Promise<string | null> => {
    if (!previewUrl) return null;
    setRotating(true);
    try {
      const rotated = await rotateImage(previewUrl, 90);
      setPreviewUrl(rotated);
      return rotated;
    } finally { setRotating(false); }
  };

  const handleFlip = async (): Promise<string | null> => {
    if (!previewUrl) return null;
    setRotating(true);
    try {
      const flipped = await flipImage(previewUrl);
      setPreviewUrl(flipped);
      return flipped;
    } finally { setRotating(false); }
  };

  const handleRotateAndOcr = async () => {
    if (!previewUrl) return;
    setRotating(true);
    try {
      const rotated = await rotateImage(previewUrl, 90);
      setPreviewUrl(rotated);
      runOcr(rotated.split(",")[1], "image/jpeg");
    } finally { setRotating(false); }
  };

  const generateShareLink = async () => {
    if (!captured) return;
    try {
      const d = editing ? editData : captured;
      const r = await api.post("/ovds/invoices", {
        invoiceNumber: d.invoiceNumber ? `${d.invoiceNumber}-SHR-${Date.now().toString(36).toUpperCase()}` : `DRAFT-${Date.now()}`,
        customerName: d.customerName || "Unknown",
        status: "DRAFT",
        totalAmount: d.totalAmount ?? 0,
        vatAmount: d.vatAmount ?? 0,
        date: d.date || new Date().toISOString().split("T")[0],
      });
      const id = r.data?.data?.id;
      if (id) {
        const sr = await api.post(`/ovds/invoices/${id}/share`);
        const token = sr.data?.data?.shareToken;
        if (token) {
          const link = `${window.location.origin}/client-portal/${token}`;
          setShareLink(link);
          navigator.clipboard.writeText(link).catch(() => {});
          toast.success("Share link copied to clipboard");
        }
      }
    } catch { toast.error("Failed to generate share link"); }
  };

  // -- File handling ------------------------------------------------------
  const processFile = useCallback((file: File) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
    if (!allowed.includes(file.type)) { toast.error("Unsupported: use JPG, PNG, WebP, or PDF"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (file.type !== "application/pdf") setPreviewUrl(dataUrl);
      runOcr(dataUrl.split(",")[1], file.type);
    };
    reader.readAsDataURL(file);
  }, [runOcr]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 1) { processFile(arr[0]); return; }
    setFileQueue(arr.map(f => ({ name: f.name, status: "pending" as const })));
    // Process all files — first successful OCR result wins for the preview
    let firstApplied = false;
    arr.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = async e => {
        const dataUrl = e.target?.result as string;
        if (i === 0 && file.type !== "application/pdf") setPreviewUrl(dataUrl);
        try {
          const r = await api.post("/ovds/invoices/ocr-extract", { base64Image: dataUrl.split(",")[1], mimeType: file.type });
          setFileQueue(q => q.map((x,j) => j===i ? {...x,status:"done"} : x));
          // Apply the first successful result to the capture state
          if (!firstApplied) {
            firstApplied = true;
            const d = r.data?.data ?? r.data;
            applyResult({
              invoiceNumber: d.invoiceNumber, date: d.date, dueDate: d.dueDate,
              customerName: d.customerName, customerEmail: d.customerEmail,
              customerPhone: d.customerPhone, customerAddress: d.customerAddress,
              customerTin: d.customerTin, subtotal: d.subtotal, vatAmount: d.vatAmount,
              totalAmount: d.totalAmount, paymentMethod: d.paymentMethod,
              bankName: d.bankName, bankAccountNo: d.bankAccountNo,
              telecomRef: d.telecomRef, notes: d.notes,
              items: d.items ?? [],
              confidence: d.confidence, provider: d.provider,
              paymentSource: d.bankName ? "BANK_QR" : d.telecomRef ? "TELECOM" : "MANUAL",
              receiptImageData: `data:${file.type};base64,${dataUrl.split(",")[1]}`,
              rawOcrText: d.rawText ?? undefined,
            }, dataUrl);
          }
        } catch {
          setFileQueue(q => q.map((x,j) => j===i ? {...x,status:"error"} : x));
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`Processing ${arr.length} files — first result will appear below`);
  }, [processFile, applyResult]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleGlobalPaste = useCallback((e: React.ClipboardEvent) => {
    const imgItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (imgItem) { const f = imgItem.getAsFile(); if (f) { processFile(f); toast.success("Image pasted — running OCR"); } }
  }, [processFile]);

  // -- Camera -------------------------------------------------------------
  const startCamera = async (mode: "environment"|"user" = facingMode) => {
    setCameraError(""); setFacingMode(mode);
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true);
    } catch { setCameraError("Camera access denied. Please allow camera permission."); }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraActive(false);
  };
  const flipCamera = () => startCamera(facingMode === "environment" ? "user" : "environment");
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    stopCamera(); setPreviewUrl(dataUrl);
    runOcr(dataUrl.split(",")[1], "image/jpeg");
  };

  // -- QR Camera ----------------------------------------------------------
  const startQrCamera = async () => {
    setQrDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      qrStreamRef.current = stream;
      if (qrVideoRef.current) { qrVideoRef.current.srcObject = stream; qrVideoRef.current.play(); }
      setQrCameraActive(true);
      qrScanRef.current = setInterval(() => {
        if (!qrVideoRef.current || !qrCanvasRef.current) return;
        const v = qrVideoRef.current; const c = qrCanvasRef.current;
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext("2d"); if (!ctx) return;
        ctx.drawImage(v, 0, 0);
        // @ts-expect-error -- dynamic property access
        if (typeof BarcodeDetector !== "undefined") {
          // @ts-expect-error -- dynamic property access
          new BarcodeDetector({ formats: ["qr_code","aztec","data_matrix"] }).detect(c)
            .then((codes: any[]) => {
              if (codes.length > 0 && !qrDetected) {
                setQrDetected(true);
                stopQrCamera();
                handleQrResult(codes[0].rawValue);
              }
            }).catch(() => {});
        }
      }, 400);
    } catch { toast.error("Camera access denied"); }
  };
  const stopQrCamera = () => {
    if (qrScanRef.current) clearInterval(qrScanRef.current);
    qrStreamRef.current?.getTracks().forEach(t => t.stop());
    qrStreamRef.current = null; setQrCameraActive(false);
  };
  const handleQrResult = (raw: string) => {
    const parsed = parseQRData(raw);
    applyResult(parsed as CapturedInvoiceData);
    toast.success("QR decoded — " + (parsed.bankName ?? "data extracted"));
  };
  // QR from uploaded image
  const handleQrImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        c.getContext("2d")?.drawImage(img, 0, 0);
        // @ts-expect-error -- dynamic property access
        if (typeof BarcodeDetector !== "undefined") {
          // @ts-expect-error -- dynamic property access
          new BarcodeDetector({ formats: ["qr_code"] }).detect(c)
            .then((codes: any[]) => {
              if (codes.length > 0) handleQrResult(codes[0].rawValue);
              else toast.error("No QR code found in image");
            }).catch(() => toast.error("QR decode failed"));
        } else {
          toast.error("BarcodeDetector not supported in this browser");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // -- Bank Transfer -------------------------------------------------------
  const fetchBankTransfer = async () => {
    if (!bankRef.trim() && !bankUrl.trim()) { toast.error("Enter a reference number or bank portal link"); return; }
    setBankFetching(true);
    try {
      const isUrl = bankUrl.trim().startsWith("http");
      let d: any;

      if (isUrl) {
        // Full bank portal URL — use the dedicated proxy endpoint
        const r = await api.get(`/ovds/invoices/bank-portal-fetch`, {
          params: { url: bankUrl.trim() },
        });
        d = r.data?.data ?? r.data;
      } else {
        // Short reference number — use the Telebirr receipt endpoint
        const ref = bankRef.trim();
        const r = await api.get(`/ovds/invoices/telecom-receipt/${encodeURIComponent(ref)}`);
        d = r.data?.data ?? r.data;
      }

      const parsed = d?.parsed ?? {};
      const result: CapturedInvoiceData = {
        telecomRef: isUrl ? (parsed.txnId ?? undefined) : bankRef.trim(),
        totalAmount: parsed.amount ?? undefined,
        date: parsed.paidAt ? parsed.paidAt.split("T")[0] : undefined,
        customerName: parsed.payer ?? undefined,
        notes: parsed.service ?? undefined,
        bankName: parsed.bankName ?? undefined,
        bankAccountNo: parsed.accountNo ?? undefined,
        currency: parsed.currency ?? "ETB",
        paymentSource: isUrl ? "BANK_QR" : "TELECOM",
        confidence: 0.85,
      };
      applyResult(result);
      const fromCache = d?.fromCache ? " (cached)" : "";
      toast.success(`Transfer info fetched${fromCache}`);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? "Failed to fetch transfer info";
      // Show actionable guidance for IP-block / network errors
      if (
        msg.toLowerCase().includes("blocking") ||
        msg.toLowerCase().includes("ip restriction") ||
        msg.toLowerCase().includes("captcha") ||
        msg.toLowerCase().includes("cannot reach") ||
        msg.toLowerCase().includes("timed out")
      ) {
        toast.error(msg, { duration: 8000 });
      } else {
        toast.error(msg);
      }
    } finally { setBankFetching(false); }
  };

  // -- Paste parse ---------------------------------------------------------
  const parsePasteText = () => {
    if (!pasteText.trim()) { toast.error("Paste some text first"); return; }
    const t = pasteText;
    const getNum = (re: RegExp) => { const m = t.match(re); return m ? parseFloat(m[1].replace(/,/g,"")) : undefined; };
    const result: CapturedInvoiceData = {
      invoiceNumber: t.match(/(?:invoice|inv)[\s#:]+([A-Z0-9-]+)/i)?.[1],
      customerName: t.match(/(?:customer|client|bill\s*to)[:\s]+([^\n]+)/i)?.[1]?.trim(),
      customerEmail: t.match(/([\w.+-]+@[\w-]+\.[\w.]+)/)?.[1],
      customerPhone: t.match(/(?:phone|tel|mobile)[:\s]+(\+?[\d\s-]{7,})/i)?.[1]?.trim(),
      customerTin: t.match(/(?:tin|vat\s*no)[:\s]+([\d]{10})/i)?.[1],
      totalAmount: getNum(/(?:total|grand\s*total)[:\s]+(?:ETB|USD|Br)?[\s]?([\d,]+\.?\d*)/i),
      vatAmount: getNum(/(?:vat|tax)[:\s]+(?:ETB|USD|Br)?[\s]?([\d,]+\.?\d*)/i),
      subtotal: getNum(/(?:subtotal|sub\s*total)[:\s]+(?:ETB|USD|Br)?[\s]?([\d,]+\.?\d*)/i),
      bankName: t.match(/(?:bank)[:\s]+([^\n]+)/i)?.[1]?.trim(),
      bankAccountNo: t.match(/(?:account|acct)[\s#:]+([\d-]+)/i)?.[1],
      telecomRef: t.match(/(?:ref|reference|txn)[\s#:]+([A-Za-z0-9]+)/i)?.[1],
      date: t.match(/(\d{4}-\d{2}-\d{2})/)?.[1],
      notes: t.slice(0, 300),
      confidence: 0.5,
    };
    applyResult(result);
    toast.success("Text parsed — review and edit fields");
  };

  // -- Line item editor helpers --------------------------------------------
  const addItem = () => setEditData(p => ({
    ...p,
    items: [...(p.items??[]), { description:"", quantity:1, unitPrice:0, discount:0, total:0 }]
  }));
  const removeItem = (i: number) => setEditData(p => ({ ...p, items: (p.items??[]).filter((_,j)=>j!==i) }));
  const updateItem = (i: number, field: string, val: string) => {
    setEditData(p => {
      const items = [...(p.items??[])];
      const it = { ...items[i], [field]: field==="description" ? val : parseFloat(val)||0 };
      it.total = Math.round(it.quantity * it.unitPrice * (1 - it.discount/100) * 100) / 100;
      items[i] = it;
      return { ...p, items };
    });
  };

  // -- Drag-to-reorder items -----------------------------------------------
  const handleItemDragStart = (i: number) => setDragItemIdx(i);
  const handleItemDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragItemIdx === null || dragItemIdx === i) return;
    setEditData(p => {
      const items = [...(p.items??[])];
      const [moved] = items.splice(dragItemIdx, 1);
      items.splice(i, 0, moved);
      setDragItemIdx(i);
      return { ...p, items };
    });
  };
  const handleItemDragEnd = () => setDragItemIdx(null);

  // -- Templates -----------------------------------------------------------
  const saveTemplate = async () => {
    const name = await prompt({ title: 'Save template', placeholder: 'Template name' });
    if (!name?.trim()) return;
    const data: Partial<CapturedInvoiceData> = {
      items: editData.items, paymentSource: editData.paymentSource,
      vatAmount: editData.vatAmount, notes: editData.notes,
    };
    const updated = [...templates.filter(t => t.name !== name.trim()), { name: name.trim(), data }];
    setTemplates(updated); saveTemplates(updated);
    toast.success(`Template "${name.trim()}" saved`);
  };
  const loadTemplate = (t: {name:string;data:Partial<CapturedInvoiceData>}) => {
    setEditData(p => ({ ...p, ...t.data }));
    setShowTemplates(false);
    toast.success(`Template "${t.name}" loaded`);
  };
  const deleteTemplate = (name: string) => {
    const updated = templates.filter(t => t.name !== name);
    setTemplates(updated); saveTemplates(updated);
  };

  // -- Customer autocomplete -----------------------------------------------
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.length < 2) { setCustomerSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await api.get("/ovds/customers/registry");
        const raw: unknown[] = r.data?.data?.data ?? r.data?.data ?? r.data ?? [];
        const all: string[] = (Array.isArray(raw) ? raw : [])
          .map((c: any) => (typeof c === 'string' ? c : c?.customerName ?? c?.name ?? ''))
          .filter(Boolean) as string[];
        setCustomerSuggestions(all.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())).slice(0, 6));
      } catch { setCustomerSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // -- Print preview -------------------------------------------------------
  const buildPrintHtml = (d: CapturedInvoiceData): string => {
    const c = settings?.ovds_base_currency ?? "ETB";
    const wm = watermark || d.watermark || d.status || "";
    const wmHtml = wm ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(0,0,0,0.06);pointer-events:none;z-index:0;white-space:nowrap">${wm.toUpperCase()}</div>` : "";
    const sigHtml = d.signatureData ? `<div style="margin-top:16px"><p style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px">Authorized Signature</p><img src="${d.signatureData}" style="height:40px;border-bottom:1px solid #e2e8f0"/></div>` : "";
    const itemRows = (d.items ?? []).map((it, i) =>
      `<tr><td style="color:#94a3b8;font-size:10px">${i + 1}</td><td>${it.description}${it.note ? `<br/><span style="font-size:9px;color:#94a3b8;font-style:italic">${it.note}</span>` : ""}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${c} ${it.unitPrice.toFixed(2)}</td><td style="text-align:center">${it.discount > 0 ? `<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:9px">-${it.discount}%</span>` : "—"}</td><td style="text-align:right;font-weight:700">${c} ${it.total.toFixed(2)}</td></tr>`
    ).join("");
    const imgHtml = d.receiptImageData ? `<img src="${d.receiptImageData}" style="max-width:160px;float:right;border-radius:8px;margin-left:12px"/>` : "";
    const css = `*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:11px;position:relative}h1{font-size:24px;font-weight:900;color:#444444;margin:0}.badge{display:inline-block;padding:2px 8px;border-radius:16px;font-size:9px;font-weight:700;background:#99ffd4;color:#444444}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0;padding:12px;background:#f8fafc;border-radius:6px}.meta label{font-size:8px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block}.meta span{font-size:11px;font-weight:600}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#444444;color:white;padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase}td{padding:6px 10px;border-bottom:1px solid #f1f5f9}.totals{margin-left:auto;width:240px}.totals td{border:none;padding:3px 10px}.grand td{font-weight:900;font-size:13px;color:#444444;border-top:2px solid #444444;padding-top:6px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center}@media print{.no-print{display:none}}`;
    return `<!DOCTYPE html><html><head><title>Invoice ${d.invoiceNumber ?? ""}</title><style>${css}</style></head><body>${wmHtml}<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px"><div><h1>INVOICE</h1><span class="badge">${d.invoiceNumber ?? "DRAFT"}</span><p style="margin:3px 0;color:#64748b;font-size:10px">${d.date ?? ""}${d.dueDate ? " | Due: " + d.dueDate : ""}</p></div>${imgHtml}</div><div class="meta"><div><label>Customer</label><span>${d.customerName ?? "-"}</span></div><div><label>Email</label><span>${d.customerEmail ?? "-"}</span></div><div><label>TIN</label><span>${d.customerTin ?? "-"}</span></div><div><label>Payment</label><span>${d.paymentSource ?? "MANUAL"}</span></div></div>${itemRows ? `<table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Disc</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table>` : ""}<table class="totals"><tbody><tr><td>Subtotal</td><td style="text-align:right">${c} ${(d.subtotal ?? 0).toFixed(2)}</td></tr><tr><td>VAT</td><td style="text-align:right">${c} ${(d.vatAmount ?? 0).toFixed(2)}</td></tr>${d.invoiceDiscount ? `<tr><td>Discount (${d.invoiceDiscount}%)</td><td style="text-align:right;color:#00C96E">-${c} ${((d.totalAmount ?? 0) * d.invoiceDiscount / 100).toFixed(2)}</td></tr>` : ""}<tr class="grand"><td>TOTAL</td><td style="text-align:right">${c} ${(d.totalAmount ?? 0).toFixed(2)}</td></tr></tbody></table>${d.bankName ? `<p><b>Bank:</b> ${d.bankName} | <b>Account:</b> ${d.bankAccountNo ?? ""}</p>` : ""}${d.telecomRef ? `<p><b>Telecom Ref:</b> ${d.telecomRef}</p>` : ""}${sigHtml}<div class="footer">OVDS ovds · ERCA Compliant · Generated ${new Date().toLocaleString()}</div><button class="no-print" style="margin-top:12px;padding:6px 16px;background:#444444;color:white;border:none;border-radius:6px;cursor:default;font-weight:700">Print / Save PDF</button></body></html>`;
  };

  // -- Signature pad -------------------------------------------------------
  const sigStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    sigDrawing.current = true;
    const c = sigCanvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    const rect = c.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.moveTo(x, y);
  };
  const sigMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!sigDrawing.current) return;
    const c = sigCanvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    const rect = c.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y); ctx.strokeStyle = "#444444"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
  };
  const sigEnd = () => { sigDrawing.current = false; };
  const clearSig = () => {
    const c = sigCanvasRef.current; if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };
  const applySig = () => {
    const c = sigCanvasRef.current; if (!c) return;
    const sig = c.toDataURL("image/png");
    setEditData(p => ({ ...p, signatureData: sig }));
    setShowSignature(false);
    toast.success("Signature applied");
  };

  // -- Confidence breakdown -------------------------------------------------
  const confFields: Array<[keyof CapturedInvoiceData, string]> = [
    ["invoiceNumber","Invoice #"],["date","Date"],["customerName","Customer"],
    ["customerTin","TIN"],["totalAmount","Total"],["vatAmount","VAT"],
    ["bankName","Bank"],["telecomRef","Telecom Ref"],
  ];

  // -- Invoice discount calc ------------------------------------------------
  const discountedTotal = useMemo(() => {
    const base = (editing ? editData : captured)?.totalAmount ?? 0;
    return Math.round(base * (1 - invoiceDiscount / 100) * 100) / 100;
  }, [editing, editData, captured, invoiceDiscount]);

  // -- Actions -------------------------------------------------------------
  const activeData = editing ? editData : (captured ?? {});

  const handleApply = () => {
    const data = editing ? editData : (captured ?? {});
    localStorage.removeItem(AUTOSAVE_KEY);
    onApply({
      ...data,
      isRecurring, recurringInterval: isRecurring ? recurringInterval : undefined,
      invoiceDiscount: invoiceDiscount > 0 ? invoiceDiscount : undefined,
      signatureData: data.signatureData,
    });
    setStep(3);
    onClose();
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) { onSaveDraft(activeData); toast.success("Saved as draft"); onClose(); }
    else { onApply({ ...activeData, status: "DRAFT" }); onClose(); }
  };

  const handleCopy = () => {
    const text = Object.entries(activeData)
      .filter(([,v]) => v != null && v !== "" && typeof v !== "object")
      .map(([k,v]) => `${k}: ${v}`).join("\n");
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(activeData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `invoice-${activeData.invoiceNumber ?? Date.now()}.json`;
    a.click();
  };

  const handlePrint = () => {
    const d = activeData;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(buildPrintHtml(d as CapturedInvoiceData));
    w.document.close(); w.focus(); setTimeout(() => w.print(), 600);
  };

  const handleSend = () => {
    if (!activeData.customerEmail) { toast.error("Customer email required to send"); return; }
    onApply({ ...activeData, status: "PENDING" }); onClose();
    toast.success("Invoice will be sent after saving");
  };

  const deleteHistoryItem = (id: string) => {
    const h = history.filter(x => x.id !== id);
    saveHistory(h); setHistory(h);
  };
  const clearHistory = () => { saveHistory([]); setHistory([]); };

  // -- Keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if ((e.key === "Enter") && (e.ctrlKey || e.metaKey) && captured) { handleApply(); return; }
      if (e.key === "s" && (e.ctrlKey || e.metaKey) && captured) { e.preventDefault(); handleSaveDraft(); return; }
      if (e.key === "p" && (e.ctrlKey || e.metaKey) && captured) { e.preventDefault(); handlePrint(); return; }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey && editing) { e.preventDefault(); handleUndo(); return; }
      if ((e.key === "z" && e.ctrlKey && e.shiftKey) || (e.key === "y" && e.ctrlKey)) { if (editing) { e.preventDefault(); handleRedo(); } return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captured, editing, editData, undoStack, redoStack]);

  // -- CSV export ----------------------------------------------------------
  const handleExportCsv = () => {
    const d = editing ? editData : (captured ?? {});
    if (!d.items?.length) { toast.error("No line items to export"); return; }
    const header = "Description,Quantity,Unit Price,Discount %,Total";
    const rows = d.items.map(it => `"${it.description}",${it.quantity},${it.unitPrice},${it.discount},${it.total}`);
    const csv = [header, ...rows, `,,,,`, `Subtotal,,,, ${d.subtotal??0}`, `VAT (${Math.round(vatRate*100)}%),,,, ${d.vatAmount??0}`, `Total,,,, ${d.totalAmount??0}`].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `invoice-items-${d.invoiceNumber ?? Date.now()}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  // -- Smart item mapping --------------------------------------------------
  const applySmartMapping = () => {
    if (!editData.items?.length || !itemsList.length) { toast.error("No items to map"); return; }
    let mapped = 0;
    const newItems = editData.items.map(it => {
      const match = fuzzyMatchItem(it.description, itemsList);
      if (match) { mapped++; return { ...it, itemId: match.id, unitPrice: match.price ?? it.unitPrice }; }
      return it;
    });
    setEditData(p => ({ ...p, items: newItems }));
    toast.success(mapped > 0 ? `Mapped ${mapped} item(s) to catalogue` : "No catalogue matches found");
  };

  // -- v7 helpers -----------------------------------------------------------
  const toggleItemNote = (i: number) => setExpandedItemNotes(s => {
    const n = new Set(s); if (n.has(i)) { n.delete(i); } else { n.add(i); } return n;
  });

  const updateItemNote = (i: number, note: string) => {
    setEditData(p => {
      const items = [...(p.items ?? [])];
      items[i] = { ...items[i], note };
      return { ...p, items };
    });
  };

  const handleExcelPaste = () => {
    if (!excelPasteText.trim()) { toast.error("Paste Excel data first"); return; }
    const items = parseExcelPaste(excelPasteText);
    if (!items?.length) { toast.error("No valid rows found — use Tab-separated columns: Description, Qty, Price, Discount%"); return; }
    setEditData(p => ({ ...p, items: [...(p.items ?? []), ...items] }));
    setExcelPasteText(""); setExcelPasteMode(false);
    toast.success(`${items.length} row(s) imported from Excel`);
  };

  const handleBatchSaveHistory = async () => {
    if (!history.length) { toast.error("No history to save"); return; }
    let saved = 0;
    for (const h of history.slice(0, 5)) {
      try {
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await api.post("/ovds/invoices", {
          invoiceNumber: h.data.invoiceNumber || `DRAFT-${uniqueSuffix}`,
          customerName: h.data.customerName || "Unknown",
          status: "DRAFT",
          totalAmount: h.data.totalAmount ?? 0,
          date: h.data.date || new Date().toISOString().split("T")[0],
          notes: h.data.notes,
          paymentSource: h.data.paymentSource || "MANUAL",
        });
        saved++;
        // Small delay to avoid timestamp collisions
        await new Promise(r => setTimeout(r, 50));
      } catch { /* ignore */ }
    }
    toast.success(`${saved} history item(s) saved as drafts`);
  };

  const handleExportErca = () => {
    const d = editing ? editData as CapturedInvoiceData : (captured ?? {} as CapturedInvoiceData);
    const json = buildErcaExport(d);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `erca-invoice-${d.invoiceNumber ?? Date.now()}.json`;
    a.click();
    toast.success("ERCA export downloaded");
  };

  // -- Render --------------------------------------------------------------
  return createPortal(
    <>
    <div className="fixed inset-0 z-[310] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invoice Capture">
      <div ref={modalRef} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden" aria-live="polite">

        {/* -- Header -- */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center"><Zap size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"/></div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Invoice Capture</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">OCR · QR · Camera · Bank · Paste · History</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {captured && (
              <button onClick={() => setShowPreview(v=>!v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-colors">
                {showPreview ? <EyeOff size={12}/> : <Eye size={12}/>} {showPreview?"Hide":"Show"} Preview
              </button>
            )}
            <button onClick={() => setAmharic(v=>!v)} title="Toggle Amharic/English" className={`p-2 rounded-lg border text-xs font-bold transition-colors ${amharic ? "border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-[var(--pro-azure)]/40 dark:border-green-700"}`}>
              <Languages size={14}/>
            </button>
            <select value={vatRate} onChange={e=>setVatRate(parseFloat(e.target.value))} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20" title="VAT Rate">
              {VAT_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <span className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500">{cur}</span>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={18}/></button>
          </div>
        </div>

        {/* -- Tab bar -- */}
        <div className="flex gap-0.5 px-6 pt-2 pb-0 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setCaptured(null); setPreviewUrl(null); setFileQueue([]); stopCamera(); stopQrCamera(); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${tab===t.id ? "border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {t.icon} {t.label}
              {t.id==="history" && history.length>0 && <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px] font-medium">{history.length}</span>}
            </button>
          ))}
        </div>

        {/* -- Progress stepper -- */}
        <div className="flex items-center gap-0 px-6 py-2 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {[
            { n: 1, label: amharic ? "ያዙ" : "Capture" },
            { n: 2, label: amharic ? "ይገምግሙ" : "Review" },
            { n: 3, label: amharic ? "ተግብር" : "Apply" },
          ].map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${step >= n ? "bg-[var(--pro-azure)] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>{step > n ? "✓" : n}</div>
                <span className={`text-xs font-bold transition-colors ${step >= n ? "text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" : "text-slate-400"}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-3 transition-colors ${step > n ? "bg-[var(--pro-azure-50)]0" : "bg-slate-200 dark:bg-slate-700"}`}/>}
            </React.Fragment>
          ))}
        </div>

        {/* -- Body -- */}
        <div className={`flex-1 min-h-0 overflow-hidden flex ${showPreview && previewUrl && captured ? "flex-row" : "flex-col"}`}>

          {/* Left: capture panel */}
          <div className={`overflow-y-auto p-5 space-y-4 ${showPreview && previewUrl && captured ? "w-1/2 border-r border-slate-100 dark:border-slate-800" : captured ? "shrink-0" : "flex-1"}`}>

            {/* UPLOAD TAB */}
            {tab === "upload" && (
              <div className="space-y-3">
                <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                  onPaste={handleGlobalPaste} onClick={()=>fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver?"border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20":"border-slate-200 dark:border-slate-700 hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure-light)] hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e=>{if(e.target.files?.length) processFiles(e.target.files);}} />
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] animate-spin"/>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Running OCR analysis…</p>
                      <p className="text-xs text-slate-400">GPT-4o / Gemini Vision</p>
                    </div>
                  ) : previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative group">
                        <img src={previewUrl} alt="preview" className="max-h-40 rounded-xl object-contain border border-slate-200 cursor-zoom-in" onClick={e=>{e.stopPropagation();setZoomUrl(previewUrl);}}/>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e=>{e.stopPropagation();setZoomUrl(previewUrl);}} className="p-1 bg-black/50 rounded-lg text-white hover:bg-black/70" title="Zoom"><ZoomIn size={12}/></button>
                          <button onClick={e=>{e.stopPropagation();handleRotate();}} disabled={rotating} className="p-1 bg-black/50 rounded-lg text-white hover:bg-black/70 disabled:opacity-50" title="Rotate 90°"><RotateCcw size={12}/></button>
                          <button onClick={e=>{e.stopPropagation();handleFlip();}} disabled={rotating} className="p-1 bg-black/50 rounded-lg text-white hover:bg-black/70 disabled:opacity-50" title="Flip horizontal"><FlipHorizontal size={12}/></button>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-slate-400">Click to replace</span>
                        <button onClick={e=>{e.stopPropagation();reRunOcr();}} className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline flex items-center gap-1"><RefreshCw size={10}/>Re-analyse</button>
                        <button onClick={e=>{e.stopPropagation();handleRotateAndOcr();}} disabled={rotating} className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"><RotateCcw size={10}/>Rotate & Re-OCR</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Upload size={24} className="text-slate-400"/></div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Drop files, click to browse, or paste screenshot</p>
                        <p className="text-xs text-slate-400 mt-1">JPG · PNG · WebP · PDF · Multiple files supported</p>
                      </div>
                    </div>
                  )}
                </div>
                {fileQueue.length > 1 && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Progress</p>
                    {fileQueue.map((f,i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {f.status==="done" ? <CheckCircle2 size={12} className="text-[var(--pro-azure)]"/> : f.status==="error" ? <AlertTriangle size={12} className="text-rose-500"/> : <Loader2 size={12} className="animate-spin text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"/>}
                        <span className={`truncate ${f.status==="error"?"text-rose-500":f.status==="done"?"text-[var(--pro-azure)]":"text-slate-500"}`}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CAMERA TAB */}
            {tab === "camera" && (
              <div className="space-y-3">
                {cameraError && <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl text-sm text-rose-600"><AlertTriangle size={14}/>{cameraError}</div>}
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{minHeight:260}}>
                  <video ref={videoRef} className={`w-full rounded-2xl ${cameraActive?"":"hidden"}`} playsInline muted/>
                  <canvas ref={canvasRef} className="hidden"/>
                  {cameraActive && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={flipCamera} className="p-2 bg-black/40 rounded-xl text-white hover:bg-black/60 transition-colors" title="Flip camera"><RotateCcw size={14}/></button>
                    </div>
                  )}
                  {!cameraActive && !previewUrl && (
                    <div className="flex flex-col items-center justify-center gap-4 py-14">
                      <Camera size={32} className="text-slate-500"/>
                      <button onClick={()=>startCamera()} className="px-6 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">Start Camera</button>
                    </div>
                  )}
                  {previewUrl && <img src={previewUrl} alt="captured" className="w-full rounded-2xl object-contain"/>}
                </div>
                {cameraActive && (
                  <div className="flex gap-2 justify-center">
                    <button onClick={capturePhoto} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
                      {loading ? <Loader2 size={15} className="animate-spin"/> : <Camera size={15}/>} Capture & Analyse
                    </button>
                    <button onClick={stopCamera} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                  </div>
                )}
                {previewUrl && !cameraActive && (
                  <button onClick={reRunOcr} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 border border-[var(--pro-azure-100)] dark:border-green-800 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-950/20 disabled:opacity-50 transition-colors">
                    <RefreshCw size={12}/> Re-analyse
                  </button>
                )}
              </div>
            )}

            {/* QR TAB */}
            {tab === "qr" && (
              <div className="space-y-3">
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{minHeight:220}}>
                  <video ref={qrVideoRef} className={`w-full rounded-2xl ${qrCameraActive?"":"hidden"}`} playsInline muted/>
                  <canvas ref={qrCanvasRef} className="hidden"/>
                  {qrCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-44 h-44 border-4 rounded-xl transition-colors ${qrDetected?"border-[var(--pro-azure)]":"border-[var(--pro-azure)] opacity-70 animate-pulse"}`}/>
                    </div>
                  )}
                  {!qrCameraActive && (
                    <div className="flex flex-col items-center justify-center gap-4 py-10">
                      <QrCode size={36} className="text-slate-400"/>
                      <button onClick={startQrCamera} className="px-5 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
                        <ScanLine size={13} className="inline mr-1.5"/>Scan QR with Camera
                      </button>
                    </div>
                  )}
                </div>
                {qrCameraActive && <button onClick={stopQrCamera} className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Stop Camera</button>}
                {/* Upload QR image */}
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/><span className="text-xs text-slate-400 font-bold">OR UPLOAD QR IMAGE</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/></div>
                <label className="flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure-light)] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-xs font-bold text-slate-500">
                  <FileImage size={14}/> Upload QR Image
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleQrImageUpload(f);}}/>
                </label>
                {/* Manual paste */}
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/><span className="text-xs text-slate-400 font-bold">OR PASTE QR TEXT</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/></div>
                <div className="flex gap-2">
                  <input value={qrText} onChange={e=>setQrText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&qrText.trim()&&(handleQrResult(qrText.trim()),setQrText(""))}
                    placeholder="Paste QR content (EMV, pipe-delimited, Telebirr, CBE…)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"/>
                  <button onClick={()=>{if(qrText.trim()){handleQrResult(qrText.trim());setQrText("");}}} className="px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">Decode</button>
                </div>
                <p className="text-xs text-slate-400">NBE EMV QR · Telebirr · CBE · Awash · Dashen · any pipe-delimited bank QR</p>
              </div>
            )}

            {/* BANK TAB */}
            {tab === "bank" && (
              <div className="space-y-3">
                <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900 rounded-xl">
                  <p className="text-xs font-bold text-[var(--pro-azure-dark)] dark:text-green-300 flex items-center gap-2"><Wifi size={12}/>Fetch from Telebirr, CBE Birr, Awash, Dashen and 25+ Ethiopian banks</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reference Number</label>
                  <input value={bankRef} onChange={e=>{ setBankRef(e.target.value); if (e.target.value.trim()) setBankUrl(""); }}
                    onKeyDown={e=>e.key==="Enter"&&fetchBankTransfer()}
                    placeholder="e.g. dcu3e3yct1 · CBE-12345678 · AWB-TXN-001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"/>
                  <p className="text-[10px] text-slate-400 mt-1">Short reference from Telebirr, CBE Birr, or any bank SMS</p>
                </div>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/><span className="text-xs text-slate-400 font-bold">OR</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bank Portal Link</label>
                  <input value={bankUrl} onChange={e=>{ setBankUrl(e.target.value); if (e.target.value.trim()) setBankRef(""); }}
                    onKeyDown={e=>e.key==="Enter"&&fetchBankTransfer()}
                    placeholder="https://telebirr.com/receipt/… or any bank receipt URL"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"/>
                  <p className="text-[10px] text-slate-400 mt-1">Full receipt URL from CBE, Awash, Dashen, Abyssinia, etc.</p>
                </div>
                <button onClick={fetchBankTransfer} disabled={bankFetching} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
                  {bankFetching ? <Loader2 size={15} className="animate-spin"/> : <Wifi size={15}/>} Fetch Transfer Info
                </button>
                {/* Fallback tip for IP-blocked banks */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                    <span className="font-bold">Bank blocking automated access?</span> Open the receipt link in your browser, copy the page text, then use the <button onClick={()=>setTab("paste")} className="underline font-bold hover:text-amber-900 dark:hover:text-amber-100">Paste / Text tab</button> to extract the data.
                  </p>
                </div>
              </div>
            )}

            {/* PASTE TAB */}
            {tab === "paste" && (
              <div className="space-y-3">
                <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
                  placeholder={"Paste PDF text, invoice data, or payment details here…\n\nExtracts: invoice #, customer, email, phone, TIN, amounts, bank, dates, line items."}
                  rows={9} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400/20 resize-none"/>
                <button onClick={parsePasteText} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
                  <ClipboardPaste size={15}/> Parse Text
                </button>
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === "history" && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                    <History size={32}/>
                    <p className="text-sm font-bold">No capture history yet</p>
                    <p className="text-xs">Captured invoices will appear here</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{history.length} recent captures</p>
                      <button onClick={clearHistory} className="text-xs text-rose-500 font-bold hover:underline">Clear all</button>
                    </div>
                    <div className="space-y-2">
                      {history.map(h => (
                        <div key={h.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-[var(--pro-azure-100)] dark:border-green-800 transition-colors">
                          {h.preview && <img src={h.preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{h.data.customerName ?? h.data.invoiceNumber ?? "Unnamed"}</span>
                              {h.data.confidence != null && <ConfBadge v={h.data.confidence}/>}
                            </div>
                            <p className="ovds-caption">{new Date(h.capturedAt).toLocaleString()} · via {h.tab}</p>
                            {h.data.totalAmount != null && <p className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-0.5">ETB {h.data.totalAmount.toLocaleString()}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={()=>{applyResult(h.data,h.preview);setTab("upload");}} className="p-1.5 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-100)] dark:bg-green-900/30 transition-colors" title="Restore"><ArrowRight size={12}/></button>
                            <button onClick={()=>deleteHistoryItem(h.id)} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-400 hover:bg-rose-100 transition-colors" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* WORKFLOW TAB */}
            {tab === "workflow" && (
              <div className="h-full overflow-y-auto pr-1">
                <IngestionWorkflowOverview />
              </div>
            )}

          </div>{/* end left panel */}

          {/* Right: preview + results panel */}
          {(captured || (showPreview && previewUrl)) && (
            <div className={`overflow-y-auto p-5 space-y-4 ${showPreview && previewUrl && captured ? "w-1/2" : "flex-1 border-t border-slate-100 dark:border-slate-800"}`}>

              {/* Image preview (right side only when split) */}
              {showPreview && previewUrl && captured && (
                <div className="relative">
                  <img src={previewUrl} alt="source" className="w-full rounded-2xl object-contain border border-slate-200 dark:border-slate-700 max-h-64"/>
                  <button onClick={reRunOcr} disabled={loading} className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 bg-black/50 text-white rounded-lg text-xs font-bold hover:bg-black/70 disabled:opacity-50 transition-colors">
                    <RefreshCw size={11}/> Re-OCR
                  </button>
                </div>
              )}

              {/* Results panel */}
              {captured && (
                <div className="border border-[var(--pro-azure-100)] dark:border-green-800 rounded-2xl overflow-hidden">
                  {/* Duplicate warning */}
                  {(isDuplicate || duplicateChecking) && (
                    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-bold ${isDuplicate ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-b border-rose-200 dark:border-rose-800" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-b border-amber-200"}`}>
                      {duplicateChecking ? <Loader2 size={12} className="animate-spin"/> : <ShieldAlert size={12}/>}
                      {duplicateChecking ? "Checking for duplicates…" : "⚠️ Possible duplicate payment — this reference was already recorded"}
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[var(--pro-azure)]"/>
                      <span className="text-sm font-bold text-[var(--pro-azure-dark)] dark:text-green-300">Extracted Data</span>
                      {captured.confidence != null && <ConfBadge v={captured.confidence}/>}
                      {captured.provider && <span className="text-[10px] text-slate-400 font-bold">via {captured.provider}</span>}
                      {captured.ingestionSource && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          Source: {captured.ingestionSource.toUpperCase()}
                        </span>
                      )}
                      {/* Bank source badge */}
                      {captured.bankName && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${detectBankColor(captured.bankName)}`}>
                          {captured.bankName.split(" ")[0]}
                        </span>
                      )}
                      {/* TIN validation badge */}
                      {captured.customerTin && (
                        validateTin(captured.customerTin) === "valid"
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]"><ShieldCheck size={9}/>TIN ✓</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200"><ShieldX size={9}/>TIN invalid</span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {(captured.receiptImageData || captured.bankSlipImageData) && (
                        <button onClick={() => setShowAttachment(v=>!v)} className={`p-1.5 rounded-lg border text-xs transition-colors ${showAttachment ? "border-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[var(--pro-azure)]/40 dark:border-green-700"}`} title="Toggle attachment">
                          <Eye size={12}/>
                        </button>
                      )}
                      <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-colors" title="Copy to clipboard"><Copy size={12}/></button>
                      <button onClick={handleDownloadJson} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-colors" title="Download JSON"><Download size={12}/></button>
                      <button onClick={handleExportCsv} disabled={!captured.items?.length} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 disabled:opacity-40 transition-colors" title="Export CSV"><Table2 size={12}/></button>
                      {editing && (<>
                        <button onClick={handleUndo} disabled={!undoStack.length} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 disabled:opacity-40 transition-colors" title="Undo (Ctrl+Z)"><Undo2 size={12}/></button>
                        <button onClick={handleRedo} disabled={!redoStack.length} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:border-[var(--pro-azure)]/40 dark:border-green-700 disabled:opacity-40 transition-colors" title="Redo (Ctrl+Y)"><Redo2 size={12}/></button>
                      </>)}
                      <button onClick={()=>setEditing(v=>!v)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-colors">
                        <Edit3 size={11}/> {editing?"View":"Edit"}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Attachment preview */}
                    {showAttachment && (captured.receiptImageData || captured.bankSlipImageData) && (
                      <div className="grid grid-cols-2 gap-3">
                        {captured.receiptImageData && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Receipt Image</p>
                            <img src={captured.receiptImageData} alt="receipt" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 object-contain max-h-40"/>
                          </div>
                        )}
                        {captured.bankSlipImageData && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Bank Slip</p>
                            <img src={captured.bankSlipImageData} alt="bank slip" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 object-contain max-h-40"/>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Field grid */}
                    {editing ? (
                      <div className="space-y-2.5">
                        {/* Template controls */}
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                          <button onClick={saveTemplate} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                            <Save size={10}/>{amharic?"አብነት ያስቀምጡ":"Save as template"}
                          </button>
                          <div className="relative">
                            <button onClick={()=>setShowTemplates(v=>!v)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                              <BookTemplate size={10}/>{amharic?"አብነት ጫን":"Load template"} {templates.length > 0 && `(${templates.length})`}
                            </button>
                            {showTemplates && templates.length > 0 && (
                              <div className="absolute top-5 left-0 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-[180px]">
                                {templates.map(t => (
                                  <div key={t.name} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                    <button onClick={()=>loadTemplate(t)} className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1 text-left">{t.name}</button>
                                    <button onClick={()=>deleteTemplate(t.name)} className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-400 hover:text-rose-600 transition-all"><Trash2 size={10}/></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {([
                            ["invoiceNumber"],["date"],["dueDate"],
                            ["customerEmail"],["customerPhone"],
                            ["customerAddress"],["customerTin"],
                            ["totalAmount"],["subtotal"],["vatAmount"],
                            ["bankName"],["bankAccountNo"],["telecomRef"],
                            ["paymentSource"],["notes"],
                          ] as [keyof CapturedInvoiceData][]).map(([k]) => (
                            <div key={k} className={k==="notes"||k==="customerAddress" ? "col-span-2" : ""}>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{lbl(k)}</label>
                              <input value={(editData as any)[k]??""} onChange={e=>setEditData(p=>({...p,[k]:e.target.value}))}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"/>
                            </div>
                          ))}
                          {/* Customer name with autocomplete */}
                          <div className="col-span-2 relative">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{lbl("customerName")}</label>
                            <div className="relative">
                              <input value={editData.customerName??""} onChange={e=>{setEditData(p=>({...p,customerName:e.target.value}));setCustomerSearch(e.target.value);setShowCustomerSuggestions(true);}}
                                onBlur={()=>setTimeout(()=>setShowCustomerSuggestions(false),150)}
                                placeholder="Type to search existing customers…"
                                className="w-full px-3 py-1.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20"/>
                              <Search size={12} className="absolute right-2.5 top-2.5 text-slate-300"/>
                            </div>
                            {showCustomerSuggestions && customerSuggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl mt-1 overflow-hidden">
                                {customerSuggestions.map(c => (
                                  <button key={c} onMouseDown={()=>{setEditData(p=>({...p,customerName:c}));setShowCustomerSuggestions(false);}} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">{c}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        {([
                          ["invoiceNumber"],["date"],["dueDate"],
                          ["customerName"],["customerEmail"],["customerPhone"],
                          ["customerTin"],["totalAmount"],["subtotal"],
                          ["vatAmount"],["bankName"],["bankAccountNo"],
                          ["telecomRef"],["paymentSource"],
                        ] as [keyof CapturedInvoiceData][]).filter(([k])=>(captured as any)[k]).map(([k]) => (
                          <div key={k} className="flex gap-2 items-baseline">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[64px] shrink-0">{lbl(k)}</span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium text-xs truncate">{String((captured as any)[k])}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Line items editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {amharic ? "የዕቃ ዝርዝር" : "Line Items"} {(editing?editData:captured).items?.length ? `(${(editing?editData:captured).items!.length})` : ""}
                        </p>
                        <div className="flex gap-2">
                          {editing && itemsList.length > 0 && (
                            <button onClick={applySmartMapping} className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline" title="Match items to catalogue">
                              <Sparkles size={10}/>Smart Map
                            </button>
                          )}
                          {editing && <button onClick={()=>setExcelPasteMode(v=>!v)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors" title="Paste from Excel (Tab-separated)"><Table2 size={10}/>Excel</button>}
                          {editing && <button onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"><Plus size={11}/>{amharic?"ጨምር":"Add row"}</button>}
                        </div>
                      </div>
                      {(editing ? editData : captured).items?.length ? (
                        <div className="space-y-1.5">
                          {/* Excel paste panel */}
                          {excelPasteMode && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Paste Excel rows (Tab-separated: Description, Qty, Price, Discount%)</p>
                              <textarea value={excelPasteText} onChange={e=>setExcelPasteText(e.target.value)} rows={4} placeholder={"Product A\t2\t150.00\t5\nProduct B\t1\t300.00\t0"} className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"/>
                              <div className="flex gap-2">
                                <button onClick={handleExcelPaste} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors">Import</button>
                                <button onClick={()=>{setExcelPasteMode(false);setExcelPasteText("");}} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                              </div>
                            </div>
                          )}
                          {/* Column headers */}
                          {editing && (
                            <div className="grid grid-cols-12 gap-1.5 px-1">
                              <span className="col-span-1"/>
                              <span className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                              <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Qty</span>
                              <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price ({cur})</span>
                              <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5"><Percent size={8}/>Disc</span>
                              <span className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</span>
                            </div>
                          )}
                          {(editing ? editData : captured).items!.map((it, i) => (
                            editing ? (
                              <React.Fragment key={i}>
                              <div className={`grid grid-cols-12 gap-1.5 items-center group ${dragItemIdx===i?"opacity-50":""}`}
                                draggable onDragStart={()=>handleItemDragStart(i)} onDragOver={e=>handleItemDragOver(e,i)} onDragEnd={handleItemDragEnd}>
                                <div className="col-span-1 flex justify-center text-slate-300 cursor-grab active:cursor-grabbing"><GripVertical size={12}/></div>
                                <input value={it.description} onChange={e=>updateItem(i,"description",e.target.value)} placeholder="Description" className="col-span-4 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                                <input value={it.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)} type="number" min="0" placeholder="Qty" className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                                <input value={it.unitPrice} onChange={e=>updateItem(i,"unitPrice",e.target.value)} type="number" min="0" placeholder="Price" className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                                <input value={it.discount} onChange={e=>updateItem(i,"discount",e.target.value)} type="number" min="0" max="100" placeholder="%" className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                                <span className="col-span-1 text-xs font-bold text-slate-600 dark:text-slate-300 text-right">{it.total.toFixed(2)}</span>
                                <button onClick={()=>removeItem(i)} className="hidden group-hover:flex col-span-1 justify-center p-1 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors absolute right-0"><Trash2 size={11}/></button>
                              </div>
                              <div className="ml-6 flex items-center gap-1">
                                <button onClick={()=>toggleItemNote(i)} className="text-[10px] text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] flex items-center gap-0.5 transition-colors"><StickyNote size={9}/>{expandedItemNotes.has(i) ? "Hide note" : (it.note ? "Edit note" : "Add note")}</button>
                              </div>
                              {expandedItemNotes.has(i) && (
                                <input value={it.note ?? ""} onChange={e=>updateItemNote(i, e.target.value)} placeholder="Note for this line item..." className="ml-6 w-[calc(100%-1.5rem)] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-[10px] focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                              )}
                            </React.Fragment>) : (
                              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800/50 rounded-lg text-xs">
                                <span className="flex-1 font-medium text-slate-700 dark:text-slate-200 truncate">{it.description}</span>
                                <span className="text-slate-400 shrink-0">×{it.quantity}</span>
                                <span className="text-slate-400 shrink-0">{cur} {it.unitPrice}</span>
                                {it.discount > 0 && <span className="text-amber-500 shrink-0">-{it.discount}%</span>}
                                <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">{cur} {it.total.toFixed(2)}</span>
                                {/* ETB equivalent if foreign currency */}
                                {(() => { const etb = toEtb(it.total, captured.currency); return etb ? <span className="text-[10px] text-slate-400 shrink-0">≈ ETB {etb.toLocaleString()}</span> : null; })()}
                              </div>
                            )
                          ))}
                          {/* Totals row */}
                          <div className="flex justify-end gap-6 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs font-bold">
                            <span className="text-slate-500">{amharic?"ንዑስ":"Sub"}: {cur} {((editing?editData:captured).subtotal??0).toFixed(2)}</span>
                            <span className="text-slate-500">VAT {Math.round(vatRate*100)}%: {cur} {((editing?editData:captured).vatAmount??0).toFixed(2)}</span>
                            <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{amharic?"ጠቅላላ":"Total"}: {cur} {((editing?editData:captured).totalAmount??0).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : editing ? (
                        <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:border-[var(--pro-azure)]/40 dark:border-green-700 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors flex items-center justify-center gap-2">
                          <Plus size={13}/> {amharic?"ዕቃ ጨምር":"Add line item"}
                        </button>
                      ) : null}
                    </div>

                    {/* -- Payment Terms & Recurring -- */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><CalendarClock size={9}/>{amharic?"የክፍያ ሁኔታ":"Payment Terms"}</label>
                        <select value={paymentTerms} onChange={e=>setPaymentTerms(e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400/20">
                          {Object.keys(PAYMENT_TERMS_DAYS).map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Repeat2 size={9}/>{amharic?"ተደጋጋሚ":"Recurring"}</label>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setIsRecurring(v=>!v)} className={`relative w-9 h-5 rounded-full transition-colors ${isRecurring?"bg-[var(--pro-azure-50)]0":"bg-slate-200 dark:bg-slate-700"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isRecurring?"translate-x-4":"translate-x-0.5"}`}/>
                          </button>
                          {isRecurring && (
                            <select value={recurringInterval} onChange={e=>setRecurringInterval(e.target.value)} className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-400/20">
                              {RECURRING_INTERVALS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* -- Share link -- */}
                    <div className="pt-2">
                      {shareLink ? (
                        <div className="flex items-center gap-2 p-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
                          <Link2 size={12} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0"/>
                          <span className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-mono truncate flex-1">{shareLink}</span>
                          <button onClick={()=>navigator.clipboard.writeText(shareLink).then(()=>toast.success("Copied"))} className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0">Copy</button>
                        </div>
                      ) : (
                        <button onClick={generateShareLink} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                          <Link2 size={12}/>{amharic?"የማጋሪያ ሊንክ ፍጠር":"Generate share link"}
                        </button>
                      )}
                    </div>

                    {/* -- Raw OCR text -- */}
                    {captured.rawOcrText && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={()=>setShowRawOcr(v=>!v)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors w-full">
                          <FileText size={11}/>{amharic?"ጥሬ OCR ጽሑፍ":"Raw OCR text"}
                          <ChevronDown size={11} className={`ml-auto transition-transform ${showRawOcr?"rotate-180":""}`}/>
                        </button>
                        {showRawOcr && (
                          <pre className="mt-2 p-3 bg-white dark:bg-slate-800/50 rounded-xl text-[10px] font-mono text-slate-500 overflow-auto max-h-32 whitespace-pre-wrap">{captured.rawOcrText}</pre>
                        )}
                      </div>
                    )}

                    {/* -- Invoice discount -- */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1"><Percent size={9}/>{amharic?"የደረሰኝ ቅናሽ":"Invoice Discount"}</label>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" value={invoiceDiscount} onChange={e=>setInvoiceDiscount(parseFloat(e.target.value)||0)}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-teal-400/20"/>
                          <span className="text-xs text-slate-400">%</span>
                          {invoiceDiscount > 0 && (
                            <span className="text-xs font-bold text-[var(--pro-azure)]">
                              → {cur} {discountedTotal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* -- Watermark -- */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1"><Stamp size={9}/>{amharic?"ማህተም":"Watermark"}</label>
                        <select value={watermark} onChange={e=>setWatermark(e.target.value)} className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-400/20">
                          <option value="">None</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="PAID">PAID</option>
                          <option value="OVERDUE">OVERDUE</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        </select>
                      </div>
                    </div>

                    {/* -- Confidence breakdown -- */}
                    {captured.confidence != null && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={()=>setShowConfBreakdown(v=>!v)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors w-full">
                          <BarChart3 size={11}/>{amharic?"የእምነት ደረጃ":"Confidence breakdown"}
                          <ChevronDown size={11} className={`ml-auto transition-transform ${showConfBreakdown?"rotate-180":""}`}/>
                        </button>
                        {showConfBreakdown && (
                          <div className="mt-2 space-y-1">
                            {confFields.map(([k, label]) => {
                              const val = (captured as any)[k];
                              const filled = val != null && val !== "";
                              return (
                                <div key={k} className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 w-24 shrink-0">{label}</span>
                                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${filled ? "bg-[var(--pro-azure-light)]" : "bg-slate-200 dark:bg-slate-600"}`} style={{width: filled ? `${Math.round((captured.confidence??0.5)*100)}%` : "10%"}}/>
                                  </div>
                                  <span className={`text-[10px] font-bold ${filled ? "text-[var(--pro-azure)]" : "text-slate-300"}`}>{filled ? "✓" : "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* -- QR code generation -- */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={()=>setShowQrGen(v=>!v)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors w-full">
                        <QrCode size={11}/>{amharic?"የክፍያ QR ፍጠር":"Generate payment QR"}
                        <ChevronDown size={11} className={`ml-auto transition-transform ${showQrGen?"rotate-180":""}`}/>
                      </button>
                      {showQrGen && (
                        <div className="mt-2 flex items-start gap-3">
                          <img
                            src={qrToSvgDataUrl(generatePaymentQr(editing ? editData as CapturedInvoiceData : captured))}
                            alt="Payment QR"
                            className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                          />
                          <div className="flex-1 space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">NBE Pipe-delimited QR</p>
                            <p className="text-[10px] font-mono text-slate-400 break-all">{generatePaymentQr(editing ? editData as CapturedInvoiceData : captured)}</p>
                            <button onClick={()=>navigator.clipboard.writeText(generatePaymentQr(editing ? editData as CapturedInvoiceData : captured)).then(()=>toast.success("QR data copied"))} className="text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-1"><Copy size={9}/>Copy QR data</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -- Signature -- */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      {(editing ? editData : captured).signatureData ? (
                        <div className="flex items-center gap-3">
                          <img src={(editing ? editData : captured).signatureData} alt="signature" className="h-10 border border-slate-200 rounded-lg bg-white"/>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{amharic?"ፊርማ":"Signature"}</p>
                            {editing && <button onClick={()=>setEditData(p=>({...p,signatureData:undefined}))} className="text-[10px] text-rose-400 font-bold hover:underline">Remove</button>}
                          </div>
                        </div>
                      ) : (
                        <button onClick={()=>setShowSignature(true)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                          <PenLine size={11}/>{amharic?"ፊርማ ጨምር":"Add signature"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>{/* end body */}

        {/* -- Footer -- */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/50 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={handlePrint} disabled={!captured} title="Print ERCA-compliant document (Ctrl+P)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Printer size={12}/> {amharic?"አትም":"Print"}
            </button>
            <button onClick={()=>setShowPrintPreview(true)} disabled={!captured} title="Preview before printing"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Monitor size={12}/> {amharic?"ቅድመ-ዕይታ":"Preview"}
            </button>
            <button onClick={handleSend} disabled={!captured}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Send size={12}/> {amharic?"ላክ":"Send"}
            </button>
            <button onClick={handleExportCsv} disabled={!captured?.items?.length}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Table2 size={12}/> CSV
            </button>
            <button onClick={handleDownloadJson} disabled={!captured}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Download size={12}/> JSON
            </button>
            <button onClick={()=>setShowEmailPreview(true)} disabled={!captured}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <Mail size={12}/> {amharic?"ኢሜይል":"Email"}
            </button>
            <button onClick={handleExportErca} disabled={!captured}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors">
              <FileCode2 size={12}/> ERCA
            </button>
            <button onClick={handleBatchSaveHistory} disabled={!history.length}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-40 transition-colors" title="Save last 5 history items as drafts">
              <Archive size={12}/> Batch
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {amharic?"ዝጋ":"Cancel"}
            </button>
            <button onClick={handleSaveDraft} disabled={!captured} title="Save as draft (Ctrl+S)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
              <Save size={13}/> {amharic?"ረቂቅ ያስቀምጡ":"Save Draft"}
            </button>
            <button onClick={handleApply} disabled={!captured} title="Apply to invoice (Ctrl+Enter)"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-colors shadow-lg ${isDuplicate ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] shadow-green-500/20 dark:shadow-green-500/10/30"}`}>
              <CheckCircle2 size={13}/> {amharic?"ወደ ደረሰኝ ተግብር":"Apply to Invoice"}
              {isDuplicate && <ShieldAlert size={11} className="ml-1"/>}
            </button>
          </div>
        </div>

      </div>
    </div>

    {/* -- Email preview modal -- */}
    {showEmailPreview && captured && (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowEmailPreview(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Mail size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"/>{amharic?"ኢሜይል ቅድመ-ዕይታ":"Email Preview"}</p>
            <div className="flex gap-2">
              <button onClick={handleSend} disabled={!captured?.customerEmail} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors"><Send size={12}/>Send</button>
              <button onClick={()=>setShowEmailPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={15}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {!captured.customerEmail && <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2"><AlertTriangle size={12}/>No customer email — add one in Edit mode to enable sending</div>}
            <iframe
              srcDoc={buildEmailHtml(editing ? editData as CapturedInvoiceData : captured, cur)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
              style={{height:"480px"}}
              title="Email preview"
            />
          </div>
        </div>
      </div>
    )}

    {/* -- Signature modal -- */}
    {showSignature && (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowSignature(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-5 w-80" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><PenLine size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"/>{amharic?"ፊርማ":"Signature"}</p>
            <button onClick={()=>setShowSignature(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"><X size={14}/></button>
          </div>
          <canvas ref={sigCanvasRef} width={280} height={120}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white cursor-crosshair touch-none"
            onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd}
            onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd}
          />
          <p className="text-[10px] text-slate-400 text-center mt-1">{amharic?"ፊርማዎን ይሳሉ":"Draw your signature above"}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={clearSig} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{amharic?"አጽዳ":"Clear"}</button>
            <button onClick={applySig} className="flex-1 py-2 rounded-xl bg-[var(--pro-azure)] text-white text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">{amharic?"ተግብር":"Apply"}</button>
          </div>
        </div>
      </div>
    )}

    {/* -- Print preview modal -- */}
    {showPrintPreview && captured && (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={()=>setShowPrintPreview(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Monitor size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"/>{amharic?"የህትመት ቅድመ-ዕይታ":"Print Preview"}</p>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors"><Printer size={12}/>Print / Save PDF</button>
              <button onClick={()=>setShowPrintPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={15}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <iframe
              srcDoc={buildPrintHtml(editing ? editData as CapturedInvoiceData : captured)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
              style={{height:"600px"}}
              title="Print preview"
            />
          </div>
        </div>
      </div>
    )}

    {/* -- Zoom overlay -- */}
    {zoomUrl && (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={()=>setZoomUrl(null)}>
        <div className="relative max-w-5xl max-h-[90vh] p-4">
          <img src={zoomUrl} alt="zoom" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"/>
          <button onClick={()=>setZoomUrl(null)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"><X size={16}/></button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            <button onClick={e=>{e.stopPropagation();handleRotate().then(url=>setZoomUrl(url));}} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 text-white rounded-xl text-xs font-bold hover:bg-black/70 transition-colors"><RotateCcw size={12}/>Rotate</button>
            <button onClick={e=>{e.stopPropagation();handleFlip().then(url=>setZoomUrl(url));}} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 text-white rounded-xl text-xs font-bold hover:bg-black/70 transition-colors"><FlipHorizontal size={12}/>Flip</button>
            <button onClick={e=>{e.stopPropagation();handleRotateAndOcr();setZoomUrl(null);}} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors"><RefreshCw size={12}/>Rotate & Re-OCR</button>
          </div>
        </div>
      </div>
    )}
  </>,
  document.body,
  );
};

export default InvoiceCaptureModal;












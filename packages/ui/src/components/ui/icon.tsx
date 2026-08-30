import React from 'react';
import {
  // Entities
  Building2, Users, UserCircle, Truck, FileText, Briefcase, Target,
  FolderKanban, Package, Boxes, Landmark, User, Mail, Phone, Tag,
  Percent, Gift, Ticket, BadgeCheck,
  // Actions
  Plus, Edit2, Trash2, Save, Download, Upload, Filter, Search,
  RefreshCw, RotateCcw, Send, Printer, Copy, Columns, Pin, PinOff,
  PanelLeftOpen, PanelLeftClose,
  // Status / Indicators
  CheckCircle2, Check, AlertCircle, AlertTriangle, Info, TrendingUp,
  TrendingDown, Clock, Calendar, DollarSign, Banknote, Wallet, Receipt,
  CreditCard,
  // Security
  Lock, Unlock, Eye, EyeOff, Shield, ShieldCheck, ShieldAlert, Key,
  Keyboard,
  // Navigation / UI
  Bell, Settings, LayoutDashboard, LayoutGrid, List, BarChart3, History,
  Menu, X, XCircle, Minus, Sun, Moon, ChevronDown, ChevronUp, ChevronRight,
  ChevronLeft, ArrowRight, ArrowLeft, ArrowLeftRight, ArrowUpRight, ArrowDownRight,
  LogOut, UserPlus, Activity, Star, Sparkles, Lightbulb,
  BookOpen, ClipboardList, Calculator, Gauge, Monitor, Palette, Globe,
  MapPin, Cloud, Zap, HelpCircle, MessageSquare,
  // Infrastructure
  Server, ServerCrash, Database, Webhook, Wifi, WifiOff,
  // People / Collaboration
  HeartHandshake,
  // ovds / Pipeline
  Circle, Users2, GitCompare, GitMerge,
  ExternalLink, Link2,
  // Additional icons
  Hash, Fingerprint, Loader2,
} from 'lucide-react';
import { ICONS, IconType } from '@ovds/shared';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  name: IconType;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const ICON_MAP: Record<string, React.ForwardRefExoticComponent<any>> = {
  // Entities
  'building-2':       Building2,
  'users':            Users,
  'user-circle':      UserCircle,
  'truck':            Truck,
  'file-text':        FileText,
  'briefcase':        Briefcase,
  'target':           Target,
  'folder-kanban':    FolderKanban,
  'package':          Package,
  'boxes':            Boxes,
  'landmark':         Landmark,
  'user':             User,
  'user-2':           User,
  'mail':             Mail,
  'phone':            Phone,
  'tag':              Tag,
  'percent':          Percent,
  'gift':             Gift,
  'ticket':           Ticket,
  'badge-check':      BadgeCheck,
  // Actions
  'plus':             Plus,
  'edit-2':           Edit2,
  'trash-2':          Trash2,
  'save':             Save,
  'download':         Download,
  'upload':           Upload,
  'filter':           Filter,
  'search':           Search,
  'refresh-cw':       RefreshCw,
  'rotate-ccw':       RotateCcw,
  'send':             Send,
  'printer':          Printer,
  'copy':             Copy,
  'columns':          Columns,
  'pin':              Pin,
  'pin-off':          PinOff,
  'panel-left-open': PanelLeftOpen,
  'panel-left-close': PanelLeftClose,
  // Status / Indicators
  'check-circle-2':   CheckCircle2,
  'check':            Check,
  'alert-circle':     AlertCircle,
  'alert-triangle':   AlertTriangle,
  'info':             Info,
  'trending-up':      TrendingUp,
  'trending-down':    TrendingDown,
  'clock':            Clock,
  'calendar':         Calendar,
  'dollar-sign':      DollarSign,
  'banknote':         Banknote,
  'wallet':           Wallet,
  'receipt':          Receipt,
  'credit-card':      CreditCard,
  // Security
  'lock':             Lock,
  'unlock':           Unlock,
  'eye':              Eye,
  'eye-off':          EyeOff,
  'shield':           Shield,
  'shield-check':     ShieldCheck,
  'shield-alert':     ShieldAlert,
  'key':              Key,
  'keyboard':         Keyboard,
  // Navigation / UI
  'bell':             Bell,
  'settings':         Settings,
  'layout-dashboard': LayoutDashboard,
  'layout-grid':      LayoutGrid,
  'list':             List,
  'bar-chart-3':      BarChart3,
  'history':          History,
  'menu':             Menu,
  'x':                X,
  'x-circle':         XCircle,
  'minus':            Minus,
  'sun':              Sun,
  'moon':             Moon,
  'chevron-down':     ChevronDown,
  'chevron-up':       ChevronUp,
  'chevron-right':    ChevronRight,
  'chevron-left':     ChevronLeft,
  'arrow-right':      ArrowRight,
  'arrow-left':       ArrowLeft,
  'arrow-left-right': ArrowLeftRight,
  'arrow-up-right':   ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  'log-out':          LogOut,
  'user-plus':        UserPlus,
  'activity':         Activity,
  'star':             Star,
  'sparkles':         Sparkles,
  'lightbulb':        Lightbulb,
  'book-open':        BookOpen,
  'clipboard-list':   ClipboardList,
  'calculator':       Calculator,
  'gauge':            Gauge,
  'monitor':          Monitor,
  'palette':          Palette,
  'globe':            Globe,
  'map-pin':          MapPin,
  'cloud':            Cloud,
  'zap':              Zap,
  'message-square':   MessageSquare,
  'help-circle':      HelpCircle,
  // Infrastructure
  'server':           Server,
  'server-crash':     ServerCrash,
  'database':         Database,
  'webhook':          Webhook,
  'wifi':             Wifi,
  'wifi-off':         WifiOff,
  // People / Collaboration
  'heart-handshake':  HeartHandshake,
  'users-2':          Users2,
  // ovds / Pipeline
  'circle':           Circle,
  'git-compare':      GitCompare,
  'git-merge':        GitMerge,
  'external-link':    ExternalLink,
  'link-2':           Link2,
  // Additional icons
  'hash':             Hash,
  'fingerprint':      Fingerprint,
  'loader-2':         Loader2,
};

export const Icon: React.FC<IconProps> = ({ name, size = 16, className, strokeWidth, ...props }) => {
  const iconName = ICONS[name];
  if (!iconName) return <HelpCircle size={size} className={className} strokeWidth={strokeWidth} {...props} />;
  const LucideIcon = ICON_MAP[iconName];
  if (!LucideIcon) return <HelpCircle size={size} className={className} strokeWidth={strokeWidth} {...props} />;
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} {...props} />;
};

// Re-export icon components for direct use
export {
  Building2, ShieldCheck, Link2, ArrowLeft, ArrowRight, CheckCircle2, ExternalLink,
  AlertTriangle, Info, ChevronRight, RefreshCw, Eye, Loader2, BadgeCheck, XCircle,
  Clock, FileText, Banknote, CreditCard, Globe, Star, Hash, Fingerprint,
};

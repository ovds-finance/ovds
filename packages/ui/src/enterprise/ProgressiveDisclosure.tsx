/**
 * @ovds/ui — ProgressiveDisclosure
 *
 * Advanced settings panel system for enterprise applications.
 * Hides complexity behind predictable, consistent doors:
 *   - Collapsible sections
 *   - Tab-based advanced panels
 *   - Accordion groups
 *   - Tooltip-triggered expansion
 *   - Keyboard-accessible disclosure
 *
 * Enterprise UX rule: A regular user never sees the twenty fields an admin
 * uses once a quarter, but those fields are exactly one click away.
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, Settings, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip } from '../components/ui/tooltip';

// ============================================================================
// DisclosureSection
// ============================================================================

export interface DisclosureSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  variant?: 'default' | 'bordered' | 'filled';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function DisclosureSection({
  title,
  description,
  children,
  defaultOpen = false,
  icon,
  badge,
  badgeColor,
  variant = 'default',
  className,
  headerClassName,
  contentClassName,
}: DisclosureSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all',
        variant === 'bordered' && 'border border-slate-200 dark:border-slate-700',
        variant === 'filled' && 'bg-slate-50/50 dark:bg-slate-900/50',
        className,
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-all',
          variant === 'bordered' && 'border-b border-slate-200 dark:border-slate-700',
          headerClassName,
        )}
      >
        {icon && (
          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            {icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{title}</span>
            {badge && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
              )}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{description}</p>
          )}
        </div>

        <ChevronDown
          size={14}
          className={cn(
            'text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className={cn('px-4 py-3', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DisclosureTabs — tabbed advanced panels
// ============================================================================

export interface DisclosureTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  content: React.ReactNode;
}

export interface DisclosureTabsProps {
  tabs: DisclosureTab[];
  defaultTab?: string;
  className?: string;
}

export function DisclosureTabs({ tabs, defaultTab, className }: DisclosureTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden', className)}>
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2',
              activeTab === tab.id
                ? 'border-aki-blue text-aki-blue dark:text-blue-400 bg-white dark:bg-slate-950'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

// ============================================================================
// AdvancedFieldGroup — groups fields with progressive disclosure
// ============================================================================

export interface AdvancedFieldGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  required?: boolean;
  danger?: boolean;
  className?: string;
}

export function AdvancedFieldGroup({
  title,
  description,
  children,
  defaultExpanded = false,
  required,
  danger,
  className,
}: AdvancedFieldGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 group"
      >
        <ChevronDown
          size={12}
          className={cn(
            'text-slate-400 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
        <span className={cn(
          'text-[11px] font-bold uppercase tracking-wider',
          danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400',
        )}>
          {title}
        </span>
        {required && (
          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Required
          </span>
        )}
        {description && (
          <Tooltip content={<p className="text-[11px] max-w-[200px]">{description}</p>} placement="right">
            <span className="text-slate-300 dark:text-slate-600 cursor-help">
              <Info size={10} />
            </span>
          </Tooltip>
        )}
      </button>

      {isExpanded && (
        <div className="pl-5 space-y-3 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ExpandableCard
// ============================================================================

export interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'filled';
  className?: string;
}

export function ExpandableCard({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  actions,
  variant = 'default',
  className,
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all',
        variant === 'bordered' && 'border border-slate-200 dark:border-slate-700',
        variant === 'filled' && 'bg-slate-50/50 dark:bg-slate-900/50',
        className,
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {icon && (
          <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
        <ChevronDown
          size={14}
          className={cn(
            'text-slate-400 transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

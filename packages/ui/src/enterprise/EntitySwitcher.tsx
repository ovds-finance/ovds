/**
 * @ovds/ui — EntitySwitcher
 *
 * Multi-entity switcher for enterprise applications.
 * Displays entity hierarchy (parent/subsidiary/branch) with:
 *   - Quick entity switching
 *   - Entity type badges
 *   - Currency indicators
 *   - Active state
 *   - Role-based visibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Entity, EntityType } from './types';

export interface EntitySwitcherProps {
  entities: Entity[];
  currentEntity: Entity | null;
  onSwitch: (entity: Entity) => void;
  disabled?: boolean;
  className?: string;
  showHierarchy?: boolean;
  userRole?: string;
}

const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  SAAS: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800',
  PROFESSIONAL_SERVICES: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  RETAIL: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  MANUFACTURING: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
  WHOLESALE: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800',
  GOVERNMENT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  NGO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800',
  HOLDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  SUBSIDIARY: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800',
  BRANCH: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800',
};

export function EntitySwitcher({
  entities,
  currentEntity,
  onSwitch,
  disabled = false,
  className,
  showHierarchy = true,
}: EntitySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const parentEntities = entities.filter((e) => !e.parentId);
  const childEntities = currentEntity
    ? entities.filter((e) => e.parentId === currentEntity.id)
    : [];

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all',
          currentEntity
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-aki-blue dark:hover:border-aki-blue'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Building2 size={14} className={currentEntity ? 'text-aki-blue dark:text-blue-400' : 'text-slate-400'} />
        <span className="truncate max-w-[160px]">{currentEntity?.name ?? 'Select Entity'}</span>
        {currentEntity?.isDefault && (
          <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
        )}
        <ChevronDown size={12} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Entity</p>
          </div>

          <div className="p-2 max-h-[400px] overflow-y-auto">
            {/* Parent / Root entities */}
            {showHierarchy && parentEntities.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Organizations
                </p>
                {parentEntities.map((entity) => (
                  <EntityOption
                    key={entity.id}
                    entity={entity}
                    isSelected={currentEntity?.id === entity.id}
                    onClick={() => {
                      onSwitch(entity);
                      setIsOpen(false);
                    }}
                    showChildren={false}
                  />
                ))}
              </div>
            )}

            {/* Child entities */}
            {showHierarchy && childEntities.length > 0 && currentEntity && (
              <div className="ml-4 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentEntity.name} Branches
                </p>
                {childEntities.map((entity) => (
                  <EntityOption
                    key={entity.id}
                    entity={entity}
                    isSelected={currentEntity?.id === entity.id}
                    onClick={() => {
                      onSwitch(entity);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}

            {/* All entities (when no hierarchy) */}
            {!showHierarchy && entities.map((entity) => (
              <EntityOption
                key={entity.id}
                entity={entity}
                isSelected={currentEntity?.id === entity.id}
                onClick={() => {
                  onSwitch(entity);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntityOption({
  entity,
  isSelected,
  onClick,
  showChildren = true,
}: {
  entity: Entity;
  isSelected: boolean;
  onClick: () => void;
  showChildren?: boolean;
}) {
  const typeColor = ENTITY_TYPE_COLORS[entity.type] ?? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
        isSelected
          ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        isSelected
          ? 'bg-aki-blue-100 dark:bg-aki-blue-900/50 text-aki-blue dark:text-blue-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
      )}>
        <Building2 size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate">{entity.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-[9px] font-bold border',
            typeColor,
          )}>
            {entity.type.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{entity.currencyCode}</span>
        </div>
      </div>
      {entity.isDefault && (
        <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
      )}
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-aki-blue dark:bg-blue-400 shrink-0" />
      )}
    </button>
  );
}

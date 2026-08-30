/**
 * @ovds/ui — EntityCurrencyContext
 *
 * Provides multi-entity, multi-currency switching context for the entire
 * enterprise application. Wraps the app to enable:
 *   - Entity switching (parent/subsidiary/branch hierarchy)
 *   - Currency switching with live FX rates
 *   - Cross-entity consolidated reporting
 *   - Base currency conversion for all financial displays
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Entity, CurrencyRate, CurrencyDisplayOptions } from './types';

// ============================================================================
// Context shape
// ============================================================================

interface EntityCurrencyContextValue {
  // Current selection
  currentEntity: Entity | null;
  currentCurrency: string;
  displayCurrency: string;

  // Entity management
  entities: Entity[];
  setCurrentEntity: (entity: Entity) => void;
  switchEntity: (entity: Entity) => void;

  // Currency management
  rates: CurrencyRate[];
  setCurrentCurrency: (currency: string) => void;
  setDisplayCurrency: (currency: string) => void;
  convert: (amount: number, from: string, to: string, date?: string) => number;
  getRate: (from: string, to: string, date?: string) => number | null;
  formatCurrency: (amount: number, currency?: string) => string;

  // Display options
  displayOptions: CurrencyDisplayOptions;
  setDisplayOptions: (opts: Partial<CurrencyDisplayOptions>) => void;

  // Hierarchy
  childEntities: Entity[];
  parentEntity: Entity | null;
  allDescendants: Entity[];

  // Loading
  isLoading: boolean;
}

const EntityCurrencyContext = createContext<EntityCurrencyContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface EntityCurrencyProviderProps {
  children: React.ReactNode;
  initialEntityId?: string;
  initialCurrency?: string;
  entities: Entity[];
  rates: CurrencyRate[];
  displayOptions?: Partial<CurrencyDisplayOptions>;
}

export const EntityCurrencyProvider: React.FC<EntityCurrencyProviderProps> = ({
  children,
  initialEntityId,
  initialCurrency = 'ETB',
  entities,
  rates,
  displayOptions: userDisplayOptions,
}) => {
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(initialEntityId ?? entities[0]?.id ?? null);
  const [currentCurrency, setCurrentCurrency] = useState<string>(initialCurrency);
  const [displayCurrency, setDisplayCurrency] = useState<string>(initialCurrency);
  const [displayOptions, setDisplayOptions] = useState<CurrencyDisplayOptions>({
    showSymbol: true,
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    negativeFormat: 'MINUS',
    ...userDisplayOptions,
  });

  const currentEntity = useMemo(
    () => entities.find((e) => e.id === currentEntityId) ?? entities[0] ?? null,
    [entities, currentEntityId],
  );

  const childEntities = useMemo(
    () => entities.filter((e) => e.parentId === currentEntity?.id),
    [entities, currentEntity],
  );

  const parentEntity = useMemo(
    () => (currentEntity?.parentId ? entities.find((e) => e.id === currentEntity.parentId) ?? null : null),
    [entities, currentEntity],
  );

  const allDescendants = useMemo(() => {
    if (!currentEntity) return [];
    const descendants: Entity[] = [];
    const collect = (parentId: string) => {
      entities.filter((e) => e.parentId === parentId).forEach((child) => {
        descendants.push(child);
        collect(child.id);
      });
    };
    collect(currentEntity.id);
    return descendants;
  }, [entities, currentEntity]);

  const switchEntity = useCallback(
    (entity: Entity) => {
      setCurrentEntityId(entity.id);
      setCurrentCurrency(entity.currencyCode);
      setDisplayCurrency(entity.currencyCode);
    },
    [],
  );

  const getRate = useCallback(
    (from: string, to: string, date?: string): number | null => {
      if (from === to) return 1;
      const rate = rates.find((r) => r.fromCurrency === from && r.toCurrency === to);
      if (rate) return rate.rate;
      const inverseRate = rates.find((r) => r.fromCurrency === to && r.toCurrency === from);
      if (inverseRate) return inverseRate.rate !== 0 ? 1 / inverseRate.rate : null;
      return null;
    },
    [rates],
  );

  const convert = useCallback(
    (amount: number, from: string, to: string, date?: string): number => {
      const rate = getRate(from, to, date);
      if (rate === null) return amount;
      return amount * rate;
    },
    [getRate],
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: string): string => {
      const code = currency ?? displayCurrency;
      const symbols: Record<string, string> = {
        ETB: 'Br',
        USD: '$',
        EUR: '€',
        GBP: '£',
        SAR: '﷼',
        AED: 'د.إ',
        KES: 'KSh',
        UGX: 'USh',
        TZS: 'TSh',
        CNY: '¥',
        JPY: '¥',
        CHF: 'Fr',
        CAD: 'C$',
        AUD: 'A$',
      };
      const symbol = symbols[code] ?? code;
      const absAmount = Math.abs(amount);
      const formatted = absAmount.toLocaleString('en-US', {
        minimumFractionDigits: displayOptions.decimalPlaces,
        maximumFractionDigits: displayOptions.decimalPlaces,
      });
      const prefix = displayOptions.symbolPosition === 'BEFORE' ? `${symbol} ` : '';
      const suffix = displayOptions.symbolPosition === 'AFTER' ? ` ${symbol}` : '';
      const negative = displayOptions.negativeFormat === 'PARENS'
        ? amount < 0
          ? `(${prefix}${formatted}${suffix})`
          : `${prefix}${formatted}${suffix}`
        : `${prefix}${formatted}${suffix}`;
      return amount < 0 ? `−${negative}` : negative;
    },
    [displayCurrency, displayOptions],
  );

  const value = useMemo<EntityCurrencyContextValue>(
    () => ({
      currentEntity,
      currentCurrency,
      displayCurrency,
      entities,
      setCurrentEntity: switchEntity,
      switchEntity,
      rates,
      setCurrentCurrency,
      setDisplayCurrency,
      convert,
      getRate,
      formatCurrency,
      displayOptions,
      setDisplayOptions: (opts: Partial<CurrencyDisplayOptions>) =>
        setDisplayOptions((prev) => ({ ...prev, ...opts })),
      childEntities,
      parentEntity,
      allDescendants,
      isLoading: !currentEntity && entities.length > 0,
    }),
    [
      currentEntity,
      currentCurrency,
      displayCurrency,
      entities,
      switchEntity,
      rates,
      convert,
      getRate,
      formatCurrency,
      displayOptions,
      childEntities,
      parentEntity,
      allDescendants,
    ],
  );

  return (
    <EntityCurrencyContext.Provider value={value}>
      {children}
    </EntityCurrencyContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export function useEntityCurrency(): EntityCurrencyContextValue {
  const ctx = useContext(EntityCurrencyContext);
  if (!ctx) {
    throw new Error('useEntityCurrency must be used within an EntityCurrencyProvider');
  }
  return ctx;
}

export function useEntity(): Entity | null {
  const { currentEntity } = useEntityCurrency();
  return currentEntity;
}

export function useCurrencyConverter() {
  const { convert, getRate, formatCurrency, displayCurrency } = useEntityCurrency();
  return { convert, getRate, formatCurrency, displayCurrency };
}

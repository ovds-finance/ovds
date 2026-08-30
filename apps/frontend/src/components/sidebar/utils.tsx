import React from 'react';
import { Icon } from '../ui';
import type { IconType } from '@ovds/ui';

export function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';
}

export function renderIcon(icon: IconType | React.ReactNode, size = 14): React.ReactNode {
  return typeof icon === 'string'
    ? <Icon name={icon as IconType} size={size} />
    : (icon as React.ReactNode);
}

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200/80 text-slate-900 rounded-[2px] px-[1px]">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

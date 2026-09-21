import React from 'react';

/**
 * AppSkeleton — Ovds SaaS loading skeleton.
 *
 * Uses CSS token vars instead of hard-coded slate classes.
 * Matches the AppTable / AppCard / AppKpi surface styles.
 * shimmer animation: aki-shimmer (defined in globals.css)
 */

export interface AppSkeletonProps {
  rows?:      number;
  cols?:      number;
  type?:      'table' | 'card' | 'kpi' | 'list';
  className?: string;
}

/* ── Shared shimmer div ─────────────────────────────────────────── */
const Bone: React.FC<{ w?: string | number; h?: number; className?: string }> = ({
  w = '100%',
  h = 12,
  className = '',
}) => (
  <div
    className={`ovds-shimmer rounded ${className}`}
    style={{ width: w, height: h, borderRadius: 4 }}
  />
);

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  rows = 5,
  cols = 4,
  type = 'table',
  className,
}) => {

  /* ── KPI strip ──────────────────────────────────────────────────── */
  if (type === 'kpi') {
    return (
      <div
        className={`grid gap-3 mb-4 ${className ?? ''}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="p-4"
            style={{
              background:  'var(--surface)',
              border:      '1px solid var(--border)',
              borderLeft:  '4px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              boxShadow:   'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Bone w={80}  h={10} />
              <Bone w={28}  h={28} className="rounded-lg" />
            </div>
            <Bone w={110} h={22} className="mb-1.5" />
            <Bone w={64}  h={9} />
          </div>
        ))}
      </div>
    );
  }

  /* ── Card grid ──────────────────────────────────────────────────── */
  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ''}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-4"
            style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              boxShadow:    'var(--card-shadow)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Bone w={40} h={40} className="rounded-lg shrink-0" />
              <div className="flex-1">
                <Bone w="75%" h={12} className="mb-1.5" />
                <Bone w="50%" h={10} />
              </div>
            </div>
            <Bone h={10} className="mb-1.5" />
            <Bone w="80%" h={10} />
          </div>
        ))}
      </div>
    );
  }

  /* ── List ───────────────────────────────────────────────────────── */
  if (type === 'list') {
    return (
      <div
        className={`overflow-hidden ${className ?? ''}`}
        style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--card-radius)',
          boxShadow:    'var(--card-shadow)',
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < rows - 1 ? '1px solid var(--border-alt)' : undefined }}
          >
            <Bone w={32} h={32} className="rounded-lg shrink-0" />
            <div className="flex-1">
              <Bone w="35%" h={12} className="mb-1.5" />
              <Bone w="55%" h={10} />
            </div>
            <Bone w={60} h={18} className="rounded-full shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Table ──────────────────────────────────────────────────────── */
  return (
    <div
      className={`overflow-hidden ${className ?? ''}`}
      style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        boxShadow:    'var(--card-shadow)',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          background:    'var(--sys-bg-subtle)',
          borderBottom:  '1px solid var(--border)',
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} w={60 + (i % 3) * 20} h={10} />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: i < rows - 1 ? '1px solid var(--border-alt)' : undefined }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Bone key={j} w={`${Math.min(96, 50 + (j % 4) * 15)}px`} h={12} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

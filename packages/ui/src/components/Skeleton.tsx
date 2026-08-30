/**
 * Skeleton — animated placeholder for loading states.
 *
 * Usage:
 *   <Skeleton.Table rows={5} cols={4} />
 *   <Skeleton.Card />
 *   <Skeleton.Text lines={3} />
 *   <Skeleton.Stat />
 *   <Skeleton.Form fields={4} />
 */
import React from 'react';

// Wave shimmer via CSS class defined in index.css
const pulse = 'ovds-shimmer rounded-lg';

// -- Primitives ----------------------------------------------------------------

const Line: React.FC<{ w?: string; h?: string; className?: string }> = ({
  w = 'w-full',
  h = 'h-4',
  className = '',
}) => <div className={`${pulse} ${w} ${h} ${className}`} />;

// -- Composites ----------------------------------------------------------------

const Text: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Line key={i} w={i === lines - 1 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
);

const Stat: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
    <div className="flex items-center justify-between">
      <Line w="w-8" h="h-8" className="rounded-lg" />
      <Line w="w-14" h="h-4" className="rounded-full" />
    </div>
    <Line w="w-20" h="h-6" />
    <Line w="w-28" h="h-2.5" />
  </div>
);

const Card: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 ${className}`}>
    <div className="flex items-center gap-2.5">
      <Line w="w-8" h="h-8" className="rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Line w="w-1/2" h="h-3.5" />
        <Line w="w-1/3" h="h-2.5" />
      </div>
    </div>
    <Text lines={2} />
  </div>
);

const TableRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Line w={i === 0 ? 'w-32' : 'w-full'} h="h-4" />
      </td>
    ))}
  </tr>
);

/** Skeleton rows for use directly inside a <tbody> */
const TableRows: React.FC<{ rows?: number; cols: number }> = ({ rows = 5, cols }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i} cols={cols} />
    ))}
  </>
);

const Table: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5, cols = 4, className = '',
}) => (
  <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Line key={i} w="w-20" h="h-2.5" />
      ))}
    </div>
    <table className="w-full">
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

const StatsRow: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const gridCls =
    count === 2 ? 'grid-cols-2'
    : count === 3 ? 'grid-cols-3'
    : count === 5 ? 'grid-cols-5'
    : 'grid-cols-4';
  return (
    <div className={`grid grid-cols-2 lg:${gridCls} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Stat key={i} />
      ))}
    </div>
  );
};

const Cards: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} />
    ))}
  </>
);

/** Form skeleton — label + input field pairs */
const Form: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-5">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <Line w="w-24" h="h-3" />
        <Line w="w-full" h="h-10" className="rounded-xl" />
      </div>
    ))}
    <div className="flex gap-3 pt-2">
      <Line w="w-28" h="h-10" className="rounded-xl" />
      <Line w="w-20" h="h-10" className="rounded-xl" />
    </div>
  </div>
);

/** Avatar skeleton — circular placeholder */
const Avatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  return <div className={`${pulse} ${dim} rounded-full shrink-0`} />;
};

/** List skeleton — rows with avatar + text */
const List: React.FC<{ rows?: number; showAvatar?: boolean }> = ({ rows = 4, showAvatar = true }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        {showAvatar && <Avatar />}
        <div className="flex-1 space-y-1.5">
          <Line w="w-1/2" h="h-3.5" />
          <Line w="w-1/3" h="h-2.5" />
        </div>
        <Line w="w-16" h="h-3" />
      </div>
    ))}
  </div>
);

/** Page header skeleton — title + subtitle + action button */
const PageHeader: React.FC = () => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <div className="space-y-2">
      <Line w="w-48" h="h-7" />
      <Line w="w-64" h="h-3.5" />
    </div>
    <Line w="w-28" h="h-9" className="rounded-xl" />
  </div>
);

/** InfiniteList skeleton — first-page loading state for infinite-scroll lists */
const InfiniteList: React.FC<{ rows?: number; showAvatar?: boolean }> = ({
  rows = 8,
  showAvatar = true,
}) => (
  <div className="space-y-3">
    <List rows={rows} showAvatar={showAvatar} />
    <div className="flex flex-col items-center gap-2 py-3">
      <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full ovds-shimmer" />
      </div>
      <Line w="w-24" h="h-3" />
    </div>
  </div>
);

/** KPI skeleton — compact metric card strip placeholder */
const KPI: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-2.5">
        <Line w="w-8" h="h-8" className="rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Line w="w-14" h="h-2.5" />
          <Line w="w-20" h="h-5" />
          <Line w="w-10" h="h-2" />
        </div>
      </div>
    ))}
  </div>
);

export const Skeleton = {
  Line,
  Text,
  Stat,
  Card,
  Cards,
  Table,
  TableRows,
  StatsRow,
  Form,
  Avatar,
  List,
  PageHeader,
  InfiniteList,
  KPI,
};

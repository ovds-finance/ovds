/**
 * ModuleDiscoveryGallery — v5.0 High-Density Module Discovery Gallery Grid
 *
 * A fully responsive multi-column catalog interface incorporating multi-tier
 * states, live installation hooks, and functional action triggers.
 *
 * Exports:
 *   ModuleDiscoveryGallery  — responsive grid container
 *   ModuleCard              — individual module card (re-exported from GridHero)
 */

import React from 'react';
import { GridModuleCard } from './GridHero';

export interface ModuleGalleryItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  active?: boolean;
  rating?: number;
  price?: string;
  priceLabel?: string;
  licenseTerm?: string;
  licenseTermLabel?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export interface ModuleDiscoveryGalleryProps {
  modules: ModuleGalleryItem[];
  className?: string;
}

export const ModuleDiscoveryGallery: React.FC<ModuleDiscoveryGalleryProps> = ({
  modules,
  className = '',
}) => (
  <div
    className={[
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200',
      className,
    ].filter(Boolean).join(' ')}
  >
    {modules.map((mod) => (
      <GridModuleCard
        key={mod.id}
        title={mod.title}
        description={mod.description}
        category={mod.category}
        icon={mod.icon}
        iconBg={mod.iconBg}
        active={mod.active}
        rating={mod.rating}
        price={mod.price}
        priceLabel={mod.priceLabel}
        licenseTerm={mod.licenseTerm}
        licenseTermLabel={mod.licenseTermLabel}
        onAction={mod.onAction}
        actionLabel={mod.actionLabel}
      />
    ))}
  </div>
);

export default ModuleDiscoveryGallery;

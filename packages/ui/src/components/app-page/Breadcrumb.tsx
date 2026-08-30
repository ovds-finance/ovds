import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => (
  <nav
    className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mb-2.5"
    aria-label="Breadcrumb"
  >
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <ChevronRight
            size={9}
            className="text-slate-300 dark:text-slate-600 shrink-0"
          />
        )}
        {item.to ? (
          <Link
            to={item.to}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium truncate max-w-[120px]"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={`truncate max-w-[160px] ${i === items.length - 1 ? 'text-slate-600 dark:text-slate-300 font-semibold' : ''}`}
          >
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

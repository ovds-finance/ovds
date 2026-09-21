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

/**
 * Breadcrumb — Ovds SaaS style: small, muted grey text, green hover on links.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => (
  <nav
    className="flex items-center gap-1 mb-2.5"
    style={{ fontSize: 10, color: 'var(--text-4)' }}
    aria-label="Breadcrumb"
  >
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <ChevronRight
            size={9}
            style={{ color: 'var(--text-5)', flexShrink: 0 }}
          />
        )}
        {item.to ? (
          <Link
            to={item.to}
            className="font-medium truncate max-w-[120px] transition-colors"
            style={{ color: 'var(--text-4)', textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--pro-azure)')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-4)')}
          >
            {item.label}
          </Link>
        ) : (
          <span
            className="truncate max-w-[160px]"
            style={{
              color: i === items.length - 1 ? 'var(--text-2)' : 'var(--text-4)',
              fontWeight: i === items.length - 1 ? 600 : 500,
            }}
          >
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

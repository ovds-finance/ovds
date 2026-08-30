/**
 * DashboardSlider — seamless pill-based dashboard switcher.
 *
 * Enables gliding between multiple customizable dashboards for comparing
 * business insights. Renders a scrollable pill track with prev/next arrows
 * and dot position indicators.
 *
 * Usage:
 *   <DashboardSlider
 *     dashboards={dashboards}
 *     activeIdx={activeIdx}
 *     onSelect={setActiveIdx}
 *   />
 */

import React, { useRef, useEffect, useCallback } from 'react';

// -- Types ----------------------------------------------------------------------

export interface DashboardItem {
  id: string;
  name: string;
}

export interface DashboardSliderProps {
  /** List of dashboard items to display */
  dashboards: DashboardItem[];
  /** Index of the currently active dashboard */
  activeIdx: number;
  /** Called when user selects a dashboard */
  onSelect: (idx: number) => void;
  /** Show dot indicators below the track (default: true when > 1 dashboard) */
  showDots?: boolean;
  /** Extra wrapper class */
  className?: string;
  /** Accessible label for the slider region */
  ariaLabel?: string;
}

// -- ChevronLeft / ChevronRight inline SVG (no lucide dep in packages/ui) ------

const ChevronLeftIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// -- Component ------------------------------------------------------------------

export const DashboardSlider: React.FC<DashboardSliderProps> = ({
  dashboards,
  activeIdx,
  onSelect,
  showDots,
  className = '',
  ariaLabel = 'Dashboard switcher',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const shouldShowDots = showDots ?? (dashboards.length > 1);

  const goPrev = useCallback(() => onSelect(Math.max(0, activeIdx - 1)), [activeIdx, onSelect]);
  const goNext = useCallback(() => onSelect(Math.min(dashboards.length - 1, activeIdx + 1)), [activeIdx, dashboards.length, onSelect]);

  // Scroll active pill into view when activeIdx changes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pill = track.children[activeIdx] as HTMLElement | undefined;
    pill?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeIdx]);

  // Keyboard navigation on the slider wrapper
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
  }, [goPrev, goNext]);

  // Render a default single dashboard pill when list is empty
  const items = dashboards.length > 0 ? dashboards : [{ id: 'default', name: 'Overview' }];

  return (
    <div
      className={['ovds-slider-wrap', className].filter(Boolean).join(' ')}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {/* Previous arrow */}
      <button
        type="button"
        onClick={goPrev}
        disabled={activeIdx === 0 || items.length <= 1}
        className="ovds-slider-arrow"
        aria-label="Previous dashboard"
      >
        <ChevronLeftIcon size={14} />
      </button>

      {/* Scrollable pill track */}
      <div
        ref={trackRef}
        className="ovds-slider-track"
        role="tablist"
        aria-label="Dashboard tabs"
      >
        {items.map((d, i) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={i === activeIdx}
            onClick={() => onSelect(i)}
            className={['ovds-slider-pill', i === activeIdx ? 'active' : ''].filter(Boolean).join(' ')}
          >
            {i === activeIdx && <span className="pill-dot" aria-hidden="true" />}
            {d.name}
          </button>
        ))}
      </div>

      {/* Next arrow */}
      <button
        type="button"
        onClick={goNext}
        disabled={activeIdx >= items.length - 1 || items.length <= 1}
        className="ovds-slider-arrow"
        aria-label="Next dashboard"
      >
        <ChevronRightIcon size={14} />
      </button>

      {/* Dot indicators */}
      {shouldShowDots && items.length > 1 && (
        <div className="ovds-slider-dots" aria-hidden="true">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={['ovds-slider-dot', i === activeIdx ? 'active' : ''].filter(Boolean).join(' ')}
              aria-label={`Go to dashboard ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardSlider;

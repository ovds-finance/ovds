/**
 * WizardShell
 *
 * Layout shell for routes with handle.layout === 'wizard'.
 *
 * Renders a two-column layout on md+ screens:
 *   Left  — WizardStepper showing all steps, current step highlighted.
 *   Right — Page content (the route's component output via children).
 *
 * On mobile the stepper collapses to a horizontal progress bar at the top.
 *
 * Step navigation is driven entirely by the URL search-param defined in
 * handle.wizard.stepParam (defaults to "step"). Pages push to that param
 * themselves; the shell just reads it to sync the stepper display.
 *
 * Usage — attach to a route:
 * ```ts
 * handle: {
 *   layout: 'wizard',
 *   wizard: {
 *     title: 'Company Enrollment',
 *     steps: [
 *       { id: 'details',  label: 'Company Details' },
 *       { id: 'finance',  label: 'Financial Setup' },
 *       { id: 'users',    label: 'Invite Users' },
 *       { id: 'confirm',  label: 'Review & Confirm' },
 *     ],
 *     completionRoute: '/dashboard',
 *   },
 * }
 * ```
 */
import { WizardStepper } from '@ovds/ui';
import type { WizardStep } from '@ovds/ui';
import { X, ArrowLeft } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useRouteUI } from '../RouteUIContext';

interface WizardShellProps {
  children: React.ReactNode;
}

export const WizardShell: React.FC<WizardShellProps> = ({ children }) => {
  const { handle } = useRouteUI();
  const config = handle.wizard!;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const stepParam = config.stepParam ?? 'step';
  const steps = config.steps;

  // Resolve current step index from URL search param.
  const currentStepId = searchParams.get(stepParam) ?? steps[0]?.id;
  const currentIndex = Math.max(
    steps.findIndex((s) => s.id === currentStepId),
    0,
  );

  // Map WizardStepConfig → WizardStep (the @ovds/ui prop shape).
  const wizardSteps: WizardStep[] = steps.map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
  }));

  // Jump back to a previously completed step.
  const handleStepClick = useCallback(
    (index: number) => {
      const target = steps[index];
      if (!target) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(stepParam, target.id);
        return next;
      });
    },
    [steps, stepParam, setSearchParams],
  );

  // Back button — go to previous step or exit the wizard.
  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      handleStepClick(currentIndex - 1);
    } else if (config.exitOnFirstBack !== false) {
      if (config.completionRoute) {
        navigate(config.completionRoute, { replace: true });
      } else {
        navigate(-1);
      }
    }
  }, [currentIndex, handleStepClick, config, navigate]);

  // Close / exit the wizard entirely.
  const handleClose = useCallback(() => {
    if (config.completionRoute) {
      navigate(config.completionRoute, { replace: true });
    } else {
      navigate(-1);
    }
  }, [config.completionRoute, navigate]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* ── Wizard chrome header ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--text-3)' }}
            aria-label="Go to previous step"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Divider */}
          <span
            className="hidden sm:block w-px h-4 rounded-full"
            style={{ background: 'var(--border)' }}
          />

          {/* Title */}
          {config.title && (
            <div>
              <p
                className="text-[13px] font-bold leading-tight"
                style={{ color: 'var(--text)' }}
              >
                {config.title}
              </p>
              {config.description && (
                <p
                  className="text-[10px] leading-tight mt-0.5"
                  style={{ color: 'var(--text-3)' }}
                >
                  {config.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step counter + close */}
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: 'var(--text-3)' }}
            aria-live="polite"
          >
            Step {currentIndex + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{
              color: 'var(--text-3)',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
            }}
            aria-label="Exit wizard"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Mobile horizontal stepper ────────────────────────────────── */}
      <div
        className="md:hidden px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <WizardStepper
          steps={wizardSteps}
          currentIndex={currentIndex}
          variant="horizontal"
          onStepClick={handleStepClick}
        />
      </div>

      {/* ── Body: side-by-side stepper + content ─────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left rail — vertical stepper (desktop only) */}
        <aside
          className="hidden md:flex flex-col shrink-0 w-56 border-r px-5 py-8 gap-6"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
          }}
        >
          <WizardStepper
            steps={wizardSteps}
            currentIndex={currentIndex}
            variant="vertical"
            onStepClick={handleStepClick}
          />
        </aside>

        {/* Right panel — the routed page content */}
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ background: 'var(--bg-main)' }}
        >
          <div className="max-w-2xl mx-auto px-5 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

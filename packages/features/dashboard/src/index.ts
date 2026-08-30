/**
 * @ovds/features/dashboard
 *
 * Dashboard domain feature library — hooks, API clients.
 * Covers: KPI stats, revenue trend, activity feed, widgets, setup progress.
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── API clients ────────────────────────────────────────────────────────────────
export { dashboardApi } from './services/dashboardApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useDashboardStats,
  useRevenueTrend,
  useActivityFeed,
} from './hooks/useDashboard';

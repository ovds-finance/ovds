/**
 * @ovds/features/projects — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  projectsApi, projectTasksApi
} from './services/projectsApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useProjects
} from './hooks/useProjects';

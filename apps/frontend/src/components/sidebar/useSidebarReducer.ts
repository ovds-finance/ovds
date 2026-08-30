import { useReducer, useCallback, useEffect, useMemo } from 'react';

export interface SidebarState {
  collapsed: boolean;
  openGroups: Record<string, boolean>;
  pinnedRoutes: string[];
  navSearch: string;
  showProfile: boolean;
  showQuickCreate: boolean;
  showNotifications: boolean;
  showSupport: boolean;
  showCompanySwitcher: boolean;
  unreadCount: number;
}

export type SidebarAction =
  | { type: 'TOGGLE_COLLAPSE' }
  | { type: 'SET_COLLAPSED'; collapsed: boolean }
  | { type: 'TOGGLE_GROUP'; key: string }
  | { type: 'SET_GROUP'; key: string; open: boolean }
  | { type: 'TOGGLE_PIN'; route: string }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'OPEN_PANEL'; panel: keyof Pick<SidebarState, 'showProfile' | 'showQuickCreate' | 'showNotifications' | 'showSupport' | 'showCompanySwitcher'> }
  | { type: 'CLOSE_ALL_PANELS' }
  | { type: 'SET_UNREAD_COUNT'; count: number }
  | { type: 'LOAD_STATE'; state: Partial<SidebarState> };

const COLLAPSED_KEY = 'sidebar_collapsed_v2';
const GROUPS_KEY = 'sidebar_groups_v8';
const FAVORITES_KEY = 'sidebar_favorites_v3';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* corrupt — use fallback */ }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

export function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'TOGGLE_COLLAPSE':
      return { ...state, collapsed: !state.collapsed };
    case 'SET_COLLAPSED':
      return { ...state, collapsed: action.collapsed };
    case 'TOGGLE_GROUP': {
      const next = { ...state.openGroups };
      next[action.key] = !next[action.key];
      return { ...state, openGroups: next };
    }
    case 'SET_GROUP':
      return { ...state, openGroups: { ...state.openGroups, [action.key]: action.open } };
    case 'TOGGLE_PIN': {
      const exists = state.pinnedRoutes.includes(action.route);
      return {
        ...state,
        pinnedRoutes: exists
          ? state.pinnedRoutes.filter(r => r !== action.route)
          : [...state.pinnedRoutes, action.route],
      };
    }
    case 'SET_SEARCH':
      return { ...state, navSearch: action.query };
    case 'CLEAR_SEARCH':
      return { ...state, navSearch: '' };
    case 'OPEN_PANEL':
      return {
        ...state,
        showProfile: action.panel === 'showProfile',
        showQuickCreate: action.panel === 'showQuickCreate',
        showNotifications: action.panel === 'showNotifications',
        showSupport: action.panel === 'showSupport',
        showCompanySwitcher: action.panel === 'showCompanySwitcher',
      };
    case 'CLOSE_ALL_PANELS':
      return {
        ...state,
        showProfile: false,
        showQuickCreate: false,
        showNotifications: false,
        showSupport: false,
        showCompanySwitcher: false,
      };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.count };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

const initialState: SidebarState = {
  collapsed: loadFromStorage<boolean>(COLLAPSED_KEY, false),
  openGroups: loadFromStorage<Record<string, boolean>>(GROUPS_KEY, {}),
  pinnedRoutes: loadFromStorage<string[]>(FAVORITES_KEY, []),
  navSearch: '',
  showProfile: false,
  showQuickCreate: false,
  showNotifications: false,
  showSupport: false,
  showCompanySwitcher: false,
  unreadCount: 0,
};

export function useSidebarReducer() {
  const [state, dispatch] = useReducer(sidebarReducer, initialState);

  useEffect(() => { saveToStorage(COLLAPSED_KEY, state.collapsed); }, [state.collapsed]);
  useEffect(() => { saveToStorage(GROUPS_KEY, state.openGroups); }, [state.openGroups]);
  useEffect(() => { saveToStorage(FAVORITES_KEY, state.pinnedRoutes); }, [state.pinnedRoutes]);

  const toggleCollapse = useCallback(() => dispatch({ type: 'TOGGLE_COLLAPSE' }), []);
  const setCollapsed = useCallback((c: boolean) => dispatch({ type: 'SET_COLLAPSED', collapsed: c }), []);
  const toggleGroup = useCallback((key: string) => dispatch({ type: 'TOGGLE_GROUP', key }), []);
  const setGroup = useCallback((key: string, open: boolean) => dispatch({ type: 'SET_GROUP', key, open }), []);
  const togglePin = useCallback((route: string) => dispatch({ type: 'TOGGLE_PIN', route }), []);
  const setSearch = useCallback((query: string) => dispatch({ type: 'SET_SEARCH', query }), []);
  const clearSearch = useCallback(() => dispatch({ type: 'CLEAR_SEARCH' }), []);
  const expandAll = useCallback((keys: string[]) => {
    dispatch({ type: 'LOAD_STATE', state: { openGroups: Object.fromEntries(keys.map(k => [k, true])) } });
  }, []);
  const collapseAll = useCallback(() => dispatch({ type: 'LOAD_STATE', state: { openGroups: {} } }), []);
  const openPanel = useCallback((panel: 'showProfile' | 'showQuickCreate' | 'showNotifications' | 'showSupport' | 'showCompanySwitcher') => {
    dispatch({ type: 'OPEN_PANEL', panel });
  }, []);
  const closeAllPanels = useCallback(() => dispatch({ type: 'CLOSE_ALL_PANELS' }), []);
  const setUnreadCount = useCallback((count: number) => dispatch({ type: 'SET_UNREAD_COUNT', count }), []);
  const loadState = useCallback((patch: Partial<SidebarState>) => dispatch({ type: 'LOAD_STATE', state: patch }), []);

  const isGroupOpen = useCallback((key: string) => {
    if (state.navSearch.trim()) return true;
    return state.openGroups[key] ?? false;
  }, [state.navSearch, state.openGroups]);

  const pinnedSet = useMemo(() => new Set(state.pinnedRoutes), [state.pinnedRoutes]);
  const anyPanelOpen = state.showProfile || state.showQuickCreate || state.showNotifications || state.showSupport || state.showCompanySwitcher;

  return {
    state,
    dispatch,
    toggleCollapse,
    setCollapsed,
    toggleGroup,
    setGroup,
    togglePin,
    setSearch,
    clearSearch,
    expandAll,
    collapseAll,
    openPanel,
    closeAllPanels,
    setUnreadCount,
    loadState,
    isGroupOpen,
    pinnedSet,
    anyPanelOpen,
  };
}

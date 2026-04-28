/* ============================================================
   ExamEdge Pro — js/state.js
   Centralized reactive state store (pub/sub pattern).
   Scalable to Redux-style or Firebase real-time later.
   ============================================================ */

import { STORAGE_KEYS } from './config.js';

/* ── Initial State Shape ─────────────────────────────────────── */
const INITIAL_STATE = {
  // Auth
  user: null,           // { uid, name, email, avatar, role }
  isAuthenticated: false,

  // Navigation
  currentRoute: '/',
  previousRoute: null,

  // Theme
  theme: 'dark',

  // XP & Gamification
  xp:    { total: 0, level: 1, progress: 0 },
  streak: { current: 0, best: 0, lastDate: null },
  achievements: [],

  // Practice
  practice: {
    activeSession: null,
    history: [],
  },

  // Mock Exam
  mock: {
    activeSession: null,
    results: [],
  },

  // Exam
  exam: {
    activeSession: null,
    results: [],
  },

  // Leaderboard
  leaderboard: {
    data: [],
    lastFetched: null,
  },

  // Analytics
  analytics: {
    weakTopics: [],
    accuracy:   0,
    avgTime:    0,
    heatmap:    [],
  },

  // UI
  ui: {
    sidebarOpen:    true,
    modalOpen:      false,
    modalComponent: null,
    loading:        {},  // { [key]: boolean }
    notifications:  [],
  },
};

/* ── Store Factory ───────────────────────────────────────────── */
function createStore(initialState) {
  let state = structuredClone(initialState);
  const subscribers = new Map(); // eventName → Set<fn>

  /** Deep-read a slice of state via dot-path */
  function get(path = '') {
    if (!path) return structuredClone(state);
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  }

  /** Shallow-merge update into a state slice (dot-path) */
  function set(path, value) {
    const keys = path.split('.');
    const last  = keys.pop();
    const target = keys.reduce((obj, k) => obj[k], state);

    if (target && typeof target === 'object' && !Array.isArray(target) && typeof value === 'object') {
      target[last] = { ...target[last], ...value };
    } else {
      target[last] = value;
    }

    emit(path, get(path));
    emit('*', { path, value: get(path) });
  }

  /** Replace full state slice */
  function replace(path, value) {
    const keys = path.split('.');
    const last  = keys.pop();
    const target = keys.reduce((obj, k) => obj[k], state);
    target[last] = value;
    emit(path, value);
    emit('*', { path, value });
  }

  /** Subscribe to state changes on a path */
  function subscribe(event, fn) {
    if (!subscribers.has(event)) subscribers.set(event, new Set());
    subscribers.get(event).add(fn);
    return () => subscribers.get(event).delete(fn); // returns unsubscribe fn
  }

  /** Emit change events */
  function emit(event, data) {
    subscribers.get(event)?.forEach(fn => fn(data));
  }

  /** Persist a slice to localStorage */
  function persist(path, storageKey) {
    const value = get(path);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.warn('[State] Could not persist:', path, e);
    }
  }

  /** Hydrate a slice from localStorage */
  function hydrate(path, storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(path, parsed);
      }
    } catch (e) {
      console.warn('[State] Could not hydrate:', path, e);
    }
  }

  /** Reset a slice to its initial value */
  function reset(path) {
    const keys = path.split('.');
    const initial = keys.reduce((obj, k) => obj?.[k], initialState);
    replace(path, structuredClone(initial));
  }

  /** Computed: returns true if any loading key is active */
  function isLoading(key) {
    return !!get(`ui.loading.${key}`);
  }

  function setLoading(key, bool) {
    set('ui.loading', { [key]: bool });
  }

  return { get, set, replace, subscribe, emit, persist, hydrate, reset, isLoading, setLoading };
}

/* ── Singleton Store ─────────────────────────────────────────── */
export const store = createStore(INITIAL_STATE);

/* ── Hydrate persisted slices on init ───────────────────────── */
export function hydrateStore() {
  store.hydrate('user',         STORAGE_KEYS.USER);
  store.hydrate('xp',           STORAGE_KEYS.XP);
  store.hydrate('achievements', STORAGE_KEYS.ACHIEVEMENTS);
  store.hydrate('theme',        STORAGE_KEYS.THEME);

  const user = store.get('user');
  store.set('isAuthenticated', !!user?.uid);
}

/* ── Auto-persist key slices on change ───────────────────────── */
store.subscribe('xp',           () => store.persist('xp',           STORAGE_KEYS.XP));
store.subscribe('user',         () => store.persist('user',         STORAGE_KEYS.USER));
store.subscribe('achievements', () => store.persist('achievements', STORAGE_KEYS.ACHIEVEMENTS));
store.subscribe('theme',        () => store.persist('theme',        STORAGE_KEYS.THEME));

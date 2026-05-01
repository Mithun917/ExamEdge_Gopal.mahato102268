/**
 * ================================================================
 *  ExamEdge Pro — js/state.js
 *  Central State Manager
 * ================================================================
 *
 *  Architecture:  Pub/Sub reactive store (like a mini-Redux)
 *  Pattern:       Observer pattern + dot-path access
 *
 *  Core API:
 *    setState(key, value)   — Set any state slice
 *    getState(key)          — Read any state slice
 *    updateUser(data)       — Merge user profile data
 *    subscribe(key, fn)     — Listen for state changes
 *    resetState(key)        — Reset a slice to default
 *
 *  Advanced API:
 *    dispatch(action)       — Redux-style action dispatch
 *    getSnapshot()          — Full state read-only copy
 *    clearAll()             — Clear all state (logout)
 *
 *  Persistence:
 *    - Auto-persists user, xp, theme, achievements to localStorage
 *    - hydrateStore() restores persisted data on app boot
 *
 *  Firebase Ready:
 *    - All Firebase sync hooks are pre-wired as stubs
 *    - Enable by setting FEATURES.FIREBASE_ENABLED = true
 *
 *  Rules:
 *    - NO DOM manipulation in this file (ever)
 *    - NO side effects outside of persistence layer
 *    - NO circular imports — state.js imports only config.js
 *
 * ================================================================
 */

'use strict';

import { STORAGE_KEYS, FEATURES, APP_CONFIG } from './config.js';

/* ================================================================
   INITIAL STATE SHAPE
   This is the single source of truth for your entire app.
   Every piece of data lives here — nothing scattered in modules.
   ================================================================ */
const INITIAL_STATE = {

  /* ── Auth ──────────────────────────────────────────────────── */
  user: null,
  /*
    user shape: {
      uid:       string,
      name:      string,
      email:     string,
      avatar:    string | null,
      role:      'student' | 'admin',
      phone:     string | null,
      bio:       string | null,
      joinedAt:  string (ISO date),
      lastSeen:  string (ISO date),
    }
  */
  isAuthenticated: false,

  /* ── Navigation ────────────────────────────────────────────── */
  currentRoute:  '/',
  previousRoute: null,

  /* ── Theme ─────────────────────────────────────────────────── */
  theme: 'dark',   // 'dark' | 'light'

  /* ── User Preferences ──────────────────────────────────────── */
  preferences: {
    language:        'en',
    notifications:   true,
    soundEnabled:    false,
    autoSubmit:      false,     // Auto-submit mock on timer end
    showExplanation: true,      // Show explanation after each answer
    questionFontSize:'md',      // 'sm' | 'md' | 'lg'
  },

  /* ── XP & Gamification ─────────────────────────────────────── */
  xp: {
    total:    0,
    level:    1,
    progress: 0,    // 0 to 1 (fraction within current level)
    history:  [],   // [{ amount, reason, date }]
  },

  streak: {
    current:  0,
    best:     0,
    lastDate: null,   // ISO date string of last activity
  },

  achievements: [],
  /*
    achievement shape: {
      id:          string,
      name:        string,
      desc:        string,
      icon:        string,
      unlockedAt:  string (ISO date),
    }
  */

  milestones: [],
  /*
    milestone shape: {
      id:     string,
      label:  string,
      target: number,
      metric: string,
    }
  */

  /* ── Practice Sessions ─────────────────────────────────────── */
  practice: {
    activeSession: null,
    /*
      activeSession shape: {
        id:         string,
        questions:  array,
        index:      number,
        startTime:  number (timestamp),
        submitted:  boolean,
      }
    */
    history: [],
    /*
      history item shape: {
        sessionId: string,
        total:     number,
        correct:   number,
        score:     number,
        elapsed:   number,
        date:      string (ISO),
        topic:     string,
      }
    */
    filters: {
      topic:      'all',
      difficulty: 'all',
    },
  },

  /* ── Mock Exam ─────────────────────────────────────────────── */
  mock: {
    activeSession: null,
    /*
      activeSession shape: {
        id:          string,
        questions:   array,
        index:       number,
        duration:    number (seconds),
        startTime:   number (timestamp),
        submitted:   boolean,
      }
    */
    results: [],
    settings: {
      duration: 60,   // minutes
      count:    50,   // question count
    },
  },

  /* ── Scheduled Exams ───────────────────────────────────────── */
  exam: {
    activeSession: null,
    results:       [],
    library:       [],   // Available exams list
  },

  /* ── Leaderboard ───────────────────────────────────────────── */
  leaderboard: {
    data:        [],
    filter:      'xp',        // 'xp' | 'streak'
    lastFetched: null,
    myRank:      null,
  },

  /* ── Analytics ─────────────────────────────────────────────── */
  analytics: {
    weakTopics:     [],   // [{ topic, accuracy }]
    strongTopics:   [],
    accuracy:       0,
    avgTime:        0,    // seconds per question
    totalQuestions: 0,
    totalCorrect:   0,
    heatmap:        [],   // [{ date, count }] — last 30 days
    topicBreakdown: [],   // [{ topic, total, correct, accuracy }]
  },

  /* ── Notifications ─────────────────────────────────────────── */
  notifications: [],
  /*
    notification shape: {
      id:      string,
      type:    'info' | 'success' | 'warn' | 'error',
      message: string,
      read:    boolean,
      date:    string (ISO),
    }
  */

  /* ── UI ────────────────────────────────────────────────────── */
  ui: {
    sidebarOpen:    true,
    modalOpen:      false,
    loading:        {},    // { [key: string]: boolean }
    error:          {},    // { [key: string]: string | null }
    toasts:         [],    // active toast queue
  },

};

/* ================================================================
   STATE VALIDATION RULES
   Validate values before they enter the store
   ================================================================ */
const VALIDATORS = {
  'theme': (v) => ['dark', 'light'].includes(v),
  'user':  (v) => v === null || (typeof v === 'object' && typeof v.uid === 'string'),
  'isAuthenticated': (v) => typeof v === 'boolean',
  'xp.total':   (v) => typeof v === 'number' && v >= 0,
  'xp.level':   (v) => typeof v === 'number' && v >= 1,
  'xp.progress':(v) => typeof v === 'number' && v >= 0 && v <= 1,
  'streak.current': (v) => typeof v === 'number' && v >= 0,
};

/* ================================================================
   PERSISTENCE MAP
   Which state slices get saved to localStorage automatically
   ================================================================ */
const PERSIST_MAP = {
  'user':          STORAGE_KEYS.USER,
  'theme':         STORAGE_KEYS.THEME,
  'xp':            STORAGE_KEYS.XP,
  'streak':        STORAGE_KEYS.STREAK || 'ee_streak',
  'achievements':  STORAGE_KEYS.ACHIEVEMENTS,
  'milestones':    STORAGE_KEYS.MILESTONES || 'ee_milestones',
  'preferences':   STORAGE_KEYS.PREFERENCES || 'ee_prefs',
};

/* ================================================================
   MIDDLEWARE  (runs on every setState call)
   Add cross-cutting concerns here — logging, validation, etc.
   ================================================================ */
const MIDDLEWARE = [

  /* ── Logger (dev only) ──────────────────────────────────────── */
  function loggerMiddleware(key, value, next) {
    if (APP_CONFIG.env === 'development') {
      console.log(
        '%c[State]%c SET ' + key,
        'color:#4f8cff;font-weight:600',
        'color:#7b82a0',
        '→', value
      );
    }
    next(key, value);
  },

  /* ── Validator ──────────────────────────────────────────────── */
  function validatorMiddleware(key, value, next) {
    const validator = VALIDATORS[key];
    if (validator && !validator(value)) {
      console.warn(
        '%c[State] Validation failed for key:',
        'color:#fb923c;font-weight:600',
        key, '| Value:', value, '| Skipping.'
      );
      return; // Don't call next → reject the update
    }
    next(key, value);
  },

];

/* ================================================================
   STORE FACTORY
   Creates the reactive store. Called once — singleton pattern.
   ================================================================ */
function createStore(initialState) {

  /* ── Private state (not accessible directly from outside) ──── */
  let _state      = _deepClone(initialState);
  let _prevState  = _deepClone(initialState);
  const _listeners = new Map(); // key → Set<callback>
  let _batchQueue  = null;      // For batch updates

  /* ──────────────────────────────────────────────────────────────
     getState(key)
     Read any slice of state using dot-path notation.

     @param {string} [key]  — Dot-path e.g. 'user.name', 'xp.total'
     @returns {*}           — A deep clone of the value (safe)

     Examples:
       getState()             → full state copy
       getState('user')       → user object
       getState('xp.total')   → 1240
       getState('ui.loading') → { page: false, ... }
     ────────────────────────────────────────────────────────────── */
  function getState(key) {
    if (!key) return _deepClone(_state);

    const value = _resolvePath(_state, key);

    // Return deep clone for objects/arrays to prevent external mutation
    if (value !== null && typeof value === 'object') {
      return _deepClone(value);
    }

    return value;
  }

  /* ──────────────────────────────────────────────────────────────
     setState(key, value)
     Set any slice of state. Runs through middleware first.
     Triggers all subscribers for that key and parent keys.

     @param {string} key    — Dot-path e.g. 'xp.total', 'user'
     @param {*}     value   — New value. Objects are shallow-merged.

     Examples:
       setState('theme', 'light')
       setState('user',  { name: 'Aryan' })        → merged
       setState('xp',    { total: 1240, level: 3}) → merged
       setState('ui.loading', { page: true })       → merged
     ────────────────────────────────────────────────────────────── */
  function setState(key, value) {
    if (!key) {
      console.warn('[State] setState called without a key');
      return;
    }

    // Run through middleware chain
    _runMiddleware(key, value, function (k, v) {
      _applyUpdate(k, v);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     updateUser(data)
     Convenience method — merge partial data into user object.
     Automatically sets isAuthenticated = true if uid is present.

     @param {object|null} data  — Partial user data to merge, or
                                  null to clear the user (logout)

     Examples:
       updateUser({ name: 'Aryan', email: 'a@ex.com', uid: 'u1' })
       updateUser({ name: 'New Name' })   → only name changes
       updateUser(null)                    → clears user, logs out
     ────────────────────────────────────────────────────────────── */
  function updateUser(data) {
    if (data === null) {
      // Logout — clear user and auth state
      _applyUpdate('user', null);
      _applyUpdate('isAuthenticated', false);
      _persistToStorage('user', STORAGE_KEYS.USER, null);

      // Optionally clear Firebase listener
      if (FEATURES.FIREBASE_ENABLED) {
        _firebaseSync.detachUserListener();
      }

      return;
    }

    if (typeof data !== 'object') {
      console.warn('[State] updateUser expects an object or null');
      return;
    }

    // Merge with existing user data
    const existing = _resolvePath(_state, 'user') || {};
    const merged   = { ...existing, ...data };

    _applyUpdate('user', merged);

    // Set authenticated flag based on uid presence
    const isAuth = !!merged.uid;
    _applyUpdate('isAuthenticated', isAuth);

    // Persist immediately
    _persistToStorage('user', STORAGE_KEYS.USER, merged);

    // Sync to Firebase if enabled
    if (FEATURES.FIREBASE_ENABLED && isAuth) {
      _firebaseSync.pushUser(merged);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     subscribe(key, callback)
     Listen for changes to a specific state key.
     Returns an unsubscribe function — always call it on cleanup!

     @param {string}   key       — Dot-path to watch, or '*' for all
     @param {function} callback  — Called with (newValue, prevValue)
     @returns {function}         — Unsubscribe function

     Examples:
       const unsub = subscribe('xp', (newXP) => updateXPBar(newXP))
       const unsub = subscribe('user', (user) => renderAvatar(user))
       const unsub = subscribe('*', ({ key, value }) => console.log(key, value))

       // When component unmounts:
       unsub()
     ────────────────────────────────────────────────────────────── */
  function subscribe(key, callback) {
    if (typeof callback !== 'function') {
      console.warn('[State] subscribe: callback must be a function');
      return () => {};
    }

    if (!_listeners.has(key)) {
      _listeners.set(key, new Set());
    }

    _listeners.get(key).add(callback);

    // Return unsubscribe function
    return function unsubscribe() {
      _listeners.get(key)?.delete(callback);
    };
  }

  /* ──────────────────────────────────────────────────────────────
     dispatch(action)
     Redux-style action dispatch for complex state transitions.
     Each action is a plain object: { type, payload }

     @param {{ type: string, payload?: any }} action

     Examples:
       dispatch({ type: 'XP_AWARD', payload: { amount: 50, reason: 'Correct!' }})
       dispatch({ type: 'STREAK_UPDATE' })
       dispatch({ type: 'SESSION_START', payload: { questions: [...] }})
       dispatch({ type: 'LOGOUT' })
     ────────────────────────────────────────────────────────────── */
  function dispatch(action) {
    if (!action || !action.type) {
      console.warn('[State] dispatch: action must have a type');
      return;
    }

    const { type, payload } = action;

    switch (type) {

      // ── Auth Actions ──────────────────────────────────────── //
      case 'LOGIN':
        updateUser(payload);
        break;

      case 'LOGOUT':
        updateUser(null);
        _applyUpdate('xp',           _deepClone(INITIAL_STATE.xp));
        _applyUpdate('streak',       _deepClone(INITIAL_STATE.streak));
        _applyUpdate('achievements', []);
        _applyUpdate('currentRoute', '/');
        break;

      // ── XP Actions ────────────────────────────────────────── //
      case 'XP_AWARD': {
        const current = getState('xp');
        const newTotal = current.total + (payload.amount || 0);
        const newLevel = _calcLevel(newTotal);
        const newProg  = _calcProgress(newTotal);

        const entry = {
          amount: payload.amount,
          reason: payload.reason || '',
          date:   new Date().toISOString(),
        };

        _applyUpdate('xp', {
          total:    newTotal,
          level:    newLevel,
          progress: newProg,
          history:  [entry, ...(current.history || [])].slice(0, 100),
        });

        if (newLevel > current.level) {
          emit('xp:levelup', { level: newLevel });
        }
        break;
      }

      // ── Streak Actions ────────────────────────────────────── //
      case 'STREAK_UPDATE': {
        const streak  = getState('streak');
        const today   = new Date().toDateString();
        const lastDay = streak.lastDate
          ? new Date(streak.lastDate).toDateString()
          : null;

        if (lastDay === today) break; // Already updated today

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newCurrent = lastDay === yesterday
          ? streak.current + 1
          : 1;

        _applyUpdate('streak', {
          current:  newCurrent,
          best:     Math.max(newCurrent, streak.best),
          lastDate: new Date().toISOString(),
        });
        break;
      }

      // ── Session Actions ───────────────────────────────────── //
      case 'SESSION_START':
        _applyUpdate(payload.type + '.activeSession', payload.session);
        break;

      case 'SESSION_END':
        _applyUpdate(payload.type + '.activeSession', null);
        break;

      case 'SESSION_RESULT': {
        const results = getState(payload.type + '.results') || [];
        _applyUpdate(payload.type + '.results',
          [payload.result, ...results].slice(0, 50)
        );
        break;
      }

      // ── Achievement Actions ───────────────────────────────── //
      case 'ACHIEVEMENT_UNLOCK': {
        const existing = getState('achievements') || [];
        const alreadyHas = existing.find(a => a.id === payload.id);
        if (alreadyHas) break;

        _applyUpdate('achievements', [
          ...existing,
          { ...payload, unlockedAt: new Date().toISOString() },
        ]);
        emit('achievement:unlocked', payload);
        break;
      }

      // ── UI Actions ────────────────────────────────────────── //
      case 'SET_LOADING':
        _applyUpdate('ui.loading', { [payload.key]: payload.value });
        break;

      case 'SET_ERROR':
        _applyUpdate('ui.error', { [payload.key]: payload.message });
        break;

      case 'CLEAR_ERROR':
        _applyUpdate('ui.error', { [payload.key]: null });
        break;

      case 'ADD_NOTIFICATION': {
        const notes = getState('notifications') || [];
        _applyUpdate('notifications', [
          {
            id:      _uid(),
            type:    payload.type || 'info',
            message: payload.message,
            read:    false,
            date:    new Date().toISOString(),
          },
          ...notes,
        ].slice(0, 50));
        break;
      }

      case 'MARK_NOTIFICATIONS_READ':
        _applyUpdate('notifications',
          (getState('notifications') || []).map(n => ({ ...n, read: true }))
        );
        break;

      default:
        console.warn('[State] Unknown action type:', type);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     resetState(key)
     Reset a slice back to its INITIAL_STATE value.

     @param {string} key  — Dot-path to reset

     Examples:
       resetState('practice')   → clears activeSession + history
       resetState('analytics')  → clears all analytics
       resetState('ui')         → resets all UI flags
     ────────────────────────────────────────────────────────────── */
  function resetState(key) {
    const initial = _resolvePath(INITIAL_STATE, key);
    if (initial === undefined) {
      console.warn('[State] resetState: key not found in initial state:', key);
      return;
    }
    _applyUpdate(key, _deepClone(initial));
  }

  /* ──────────────────────────────────────────────────────────────
     clearAll()
     Nuclear option — clears ALL state and localStorage.
     Use only on full logout or factory reset.
     ────────────────────────────────────────────────────────────── */
  function clearAll() {
    _state     = _deepClone(INITIAL_STATE);
    _prevState = _deepClone(INITIAL_STATE);

    // Clear all persisted localStorage keys
    Object.values(PERSIST_MAP).forEach(storageKey => {
      try { localStorage.removeItem(storageKey); } catch (e) {}
    });

    // Notify all subscribers that state was wiped
    emit('*', { key: '__clearAll__', value: _state });
    console.log('%c[State] All state cleared', 'color:#f87171;font-weight:600');
  }

  /* ──────────────────────────────────────────────────────────────
     getSnapshot()
     Returns a complete read-only deep clone of current state.
     Useful for debugging, serialization, or Firebase sync.
     ────────────────────────────────────────────────────────────── */
  function getSnapshot() {
    return Object.freeze(_deepClone(_state));
  }

  /* ──────────────────────────────────────────────────────────────
     batch(fn)
     Group multiple setState calls. Subscribers only notified once
     at the end. Prevents multiple re-renders.

     @param {function} fn  — Function containing multiple setState calls

     Example:
       batch(() => {
         setState('xp.total', 1500)
         setState('xp.level', 3)
         setState('xp.progress', 0.5)
       })
       // Subscribers notified once, not 3 times
     ────────────────────────────────────────────────────────────── */
  function batch(fn) {
    _batchQueue = new Map();
    try {
      fn();
    } finally {
      const queued = _batchQueue;
      _batchQueue  = null;
      queued.forEach((value, key) => {
        _applyUpdate(key, value);
      });
    }
  }

  /* ──────────────────────────────────────────────────────────────
     persist(key, storageKey)
     Manually persist a state slice to localStorage.
     Auto-persist handles known keys automatically.
     ────────────────────────────────────────────────────────────── */
  function persist(key, storageKey) {
    const value = getState(key);
    _persistToStorage(key, storageKey, value);
  }

  /* ──────────────────────────────────────────────────────────────
     hydrate(key, storageKey)
     Manually restore a state slice from localStorage.
     hydrateStore() calls this for all known keys at boot.
     ────────────────────────────────────────────────────────────── */
  function hydrate(key, storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return;

      const parsed = JSON.parse(raw);
      _applyUpdate(key, parsed);
    } catch (e) {
      console.warn('[State] hydrate failed for:', key, e.message);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     emit(event, data)
     Manually emit a custom event to all subscribers of that event.
     Used for non-state events like 'xp:levelup', 'achievement:unlocked'
     ────────────────────────────────────────────────────────────── */
  function emit(event, data) {
    _listeners.get(event)?.forEach(fn => {
      try { fn(data); }
      catch (e) { console.error('[State] Subscriber error:', e); }
    });
  }

  /* ──────────────────────────────────────────────────────────────
     isLoading(key) / setLoading(key, bool)
     Shorthand for loading state management.
     ────────────────────────────────────────────────────────────── */
  function isLoading(key) {
    return !!_resolvePath(_state, 'ui.loading.' + key);
  }

  function setLoading(key, bool) {
    _applyUpdate('ui.loading', { [key]: !!bool });
  }

  /* ──────────────────────────────────────────────────────────────
     PRIVATE METHODS
     ────────────────────────────────────────────────────────────── */

  /** Apply a state update. Core internal setter. */
  function _applyUpdate(key, value) {
    // If batch mode, queue it
    if (_batchQueue !== null) {
      _batchQueue.set(key, value);
      return;
    }

    // Save previous state snapshot
    _prevState = _deepClone(_state);

    // Write to state via dot-path
    _writePath(_state, key, value);

    // Notify subscribers for this exact key
    const newValue = _resolvePath(_state, key);
    const oldValue = _resolvePath(_prevState, key);

    _notifySubscribers(key, newValue, oldValue);

    // Auto-persist if this key is in the persist map
    const storageKey = PERSIST_MAP[key];
    if (storageKey) {
      _persistToStorage(key, storageKey, newValue);
    }

    // Firebase sync stub
    if (FEATURES.FIREBASE_ENABLED) {
      _firebaseSync.onStateChange(key, newValue);
    }
  }

  /** Notify all subscribers of a key change, including parent keys */
  function _notifySubscribers(key, newValue, oldValue) {
    // Notify exact key subscribers
    _listeners.get(key)?.forEach(fn => {
      try { fn(newValue, oldValue); }
      catch (e) { console.error('[State] Subscriber threw:', key, e); }
    });

    // Notify wildcard '*' subscribers
    _listeners.get('*')?.forEach(fn => {
      try { fn({ key, value: newValue, prev: oldValue }); }
      catch (e) { console.error('[State] Wildcard subscriber threw:', e); }
    });

    // Notify parent key subscribers (e.g. 'xp.total' also notifies 'xp')
    const parts = key.split('.');
    if (parts.length > 1) {
      parts.pop();
      const parentKey = parts.join('.');
      _listeners.get(parentKey)?.forEach(fn => {
        try {
          fn(_resolvePath(_state, parentKey), _resolvePath(_prevState, parentKey));
        } catch (e) {}
      });
    }
  }

  /** Run value through middleware chain before applying */
  function _runMiddleware(key, value, finalHandler) {
    let index = 0;

    function next(k, v) {
      if (index < MIDDLEWARE.length) {
        const mw = MIDDLEWARE[index++];
        mw(k, v, next);
      } else {
        finalHandler(k, v);
      }
    }

    next(key, value);
  }

  /** Persist a value to localStorage safely */
  function _persistToStorage(key, storageKey, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('[State] localStorage persist failed:', key, e.message);
    }
  }

  /* ── Return public API ─────────────────────────────────────── */
  return {
    getState,
    setState,
    updateUser,
    subscribe,
    dispatch,
    resetState,
    clearAll,
    getSnapshot,
    batch,
    persist,
    hydrate,
    emit,
    isLoading,
    setLoading,

    // Legacy aliases (backward compatibility with older modules)
    get:     getState,
    set:     setState,
    replace: (key, value) => { _writePath(_state, key, value); _notifySubscribers(key, value, null); },
  };
}

/* ================================================================
   UTILITY FUNCTIONS  (module-private)
   ================================================================ */

/** Read a nested value using dot-path */
function _resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/** Write a value at a dot-path (creates intermediate objects) */
function _writePath(obj, path, value) {
  const keys = path.split('.');
  const last  = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (acc[key] === null || typeof acc[key] !== 'object') {
      acc[key] = {};
    }
    return acc[key];
  }, obj);

  // For plain objects: shallow merge. For everything else: replace.
  if (
    target[last] !== null &&
    typeof target[last] === 'object' &&
    !Array.isArray(target[last]) &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    target[last] = { ...target[last], ...value };
  } else {
    target[last] = value;
  }
}

/** Deep clone using structuredClone if available, else JSON fallback */
function _deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/** Calculate level from total XP */
function _calcLevel(totalXP, threshold = 500) {
  return Math.floor(totalXP / threshold) + 1;
}

/** Calculate progress fraction (0 to 1) within current level */
function _calcProgress(totalXP, threshold = 500) {
  return (totalXP % threshold) / threshold;
}

/** Generate a short unique ID */
function _uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ================================================================
   FIREBASE SYNC STUBS
   Pre-wired hooks — uncomment and fill when Firebase is enabled.
   Set FEATURES.FIREBASE_ENABLED = true in config.js to activate.
   ================================================================ */
const _firebaseSync = {

  /**
   * Called on every setState — push changed key to Firestore
   * Only syncs keys that are flagged for remote sync
   */
  onStateChange(key, value) {
    const SYNCED_KEYS = ['xp', 'streak', 'achievements', 'analytics'];
    if (!SYNCED_KEYS.includes(key.split('.')[0])) return;

    const uid = store.getState('user.uid');
    if (!uid) return;

    // Uncomment when Firebase is set up:
    // import { updateDocument } from './firebase.js';
    // updateDocument('users', uid, { [key]: value });
  },

  /**
   * Push full user profile to Firestore
   */
  pushUser(userData) {
    const uid = userData?.uid;
    if (!uid) return;

    // Uncomment when Firebase is set up:
    // import { setDocument } from './firebase.js';
    // setDocument('users', uid, userData);
  },

  /**
   * Attach real-time Firestore listener for user data
   */
  attachUserListener(uid) {
    // Uncomment when Firebase is set up:
    // const { onSnapshot, doc, getFirestore } = await import('firebase/firestore');
    // const db = getFirestore();
    // return onSnapshot(doc(db, 'users', uid), (snap) => {
    //   if (snap.exists()) store.updateUser(snap.data());
    // });
  },

  /**
   * Detach Firestore listener on logout
   */
  detachUserListener() {
    // Store the unsubscribe ref returned by attachUserListener
    // and call it here on logout
  },

};

/* ================================================================
   SINGLETON STORE INSTANCE
   ================================================================ */
export const store = createStore(INITIAL_STATE);

/* ================================================================
   hydrateStore()
   Called ONCE at app boot in initApp().
   Restores all persisted state from localStorage.
   ================================================================ */
export function hydrateStore() {
  // Restore each persisted slice
  Object.entries(PERSIST_MAP).forEach(([stateKey, storageKey]) => {
    store.hydrate(stateKey, storageKey);
  });

  // Derive isAuthenticated from restored user
  const user = store.getState('user');
  store.setState('isAuthenticated', !!(user && user.uid));

  if (APP_CONFIG.env === 'development') {
    console.log(
      '%c[State] Hydrated from localStorage',
      'color:#34d399;font-weight:600',
      store.getSnapshot()
    );
  }
}

/* ================================================================
   AUTO-PERSIST SUBSCRIPTIONS
   These run silently whenever a key changes in the store.
   Mirrors in-memory state → localStorage automatically.
   ================================================================ */
Object.entries(PERSIST_MAP).forEach(([stateKey, storageKey]) => {
  store.subscribe(stateKey, (value) => {
    try {
      if (value === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('[State] Auto-persist failed:', stateKey, e.message);
    }
  });
});

/* ================================================================
   NAMED CONVENIENCE EXPORTS
   Import these in modules for cleaner, shorter code.

   Instead of:   store.setState('xp.total', 1240)
   You can use:  setState('xp.total', 1240)
   ================================================================ */
export const {
  getState,
  setState,
  updateUser,
  subscribe,
  dispatch,
  resetState,
  clearAll,
  getSnapshot,
  batch,
  emit,
  isLoading,
  setLoading,
} = store;

/* ================================================================
   DEV TOOLS
   Expose store on window in development mode ONLY.
   Never available in production.
   ================================================================ */
if (APP_CONFIG.env === 'development') {
  window.__EE_STATE__ = {
    get:      () => store.getSnapshot(),
    set:      (k, v) => store.setState(k, v),
    dispatch: (a) => store.dispatch(a),
    reset:    (k) => store.resetState(k),
    clear:    () => store.clearAll(),
  };

  console.log(
    '%c[ExamEdge Pro] State DevTools available at window.__EE_STATE__',
    'color:#4f8cff; font-weight: 600'
  );
}

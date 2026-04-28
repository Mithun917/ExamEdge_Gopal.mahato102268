/* ============================================================
   ExamEdge Pro — js/config.js
   App-wide configuration, constants, and environment settings
   ============================================================ */

export const APP_CONFIG = Object.freeze({
  name:    'ExamEdge Pro',
  version: '1.0.0',
  env:     'development', // 'development' | 'production'
});

/* ── Route Definitions ──────────────────────────────────────── */
export const ROUTES = Object.freeze({
  DASHBOARD:   '/',
  PRACTICE:    '/practice',
  MOCK:        '/mock',
  EXAM:        '/exam',
  LEADERBOARD: '/leaderboard',
  PROFILE:     '/profile',
  LOGIN:       '/login',
});

/* ── Local Storage Keys ─────────────────────────────────────── */
export const STORAGE_KEYS = Object.freeze({
  USER:         'ee_user',
  SESSION:      'ee_session',
  THEME:        'ee_theme',
  PREFERENCES:  'ee_prefs',
  XP:           'ee_xp',
  ACHIEVEMENTS: 'ee_achievements',
});

/* ── XP System ──────────────────────────────────────────────── */
export const XP_CONFIG = Object.freeze({
  CORRECT_ANSWER:    10,
  PERFECT_MOCK:     100,
  DAILY_STREAK:      20,
  FIRST_PRACTICE:    50,
  LEVEL_THRESHOLD:  500, // XP needed per level
});

/* ── Exam / Practice Defaults ────────────────────────────────── */
export const EXAM_CONFIG = Object.freeze({
  DEFAULT_DURATION_MINS: 60,
  DEFAULT_QUESTION_COUNT: 30,
  MOCK_QUESTION_COUNT:    50,
  PRACTICE_BATCH_SIZE:    10,
  PASS_PERCENTAGE:        60,
});

/* ── Difficulty Levels ───────────────────────────────────────── */
export const DIFFICULTY = Object.freeze({
  EASY:   'easy',
  MEDIUM: 'medium',
  HARD:   'hard',
});

/* ── Firebase Config (placeholder — fill before deploy) ─────── */
export const FIREBASE_CONFIG = Object.freeze({
  apiKey:            '',
  authDomain:        '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             '',
});

/* ── Feature Flags ───────────────────────────────────────────── */
export const FEATURES = Object.freeze({
  FIREBASE_ENABLED:     false,
  ANALYTICS_ENABLED:    false,
  LEADERBOARD_ENABLED:  true,
  ACHIEVEMENTS_ENABLED: true,
  DARK_MODE_ENABLED:    true,
});

/* ── API Endpoints (for future REST integration) ─────────────── */
export const API = Object.freeze({
  BASE_URL:   '/api/v1',
  QUESTIONS:  '/api/v1/questions',
  USERS:      '/api/v1/users',
  SCORES:     '/api/v1/scores',
  ANALYTICS:  '/api/v1/analytics',
});

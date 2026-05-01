/**
 * ================================================================
 *  ExamEdge Pro — js/config.js
 *  Central Configuration File
 * ================================================================
 *
 *  This is the ONLY file you need to edit for:
 *    - Changing app name / version
 *    - Switching environments (dev → production)
 *    - Adding Firebase credentials
 *    - Toggling features ON/OFF
 *    - Changing exam/XP rules
 *
 *  Rules:
 *    - NO logic in this file — only plain data
 *    - NO imports from other project files
 *    - All objects are frozen (Object.freeze) — read-only at runtime
 *    - Everything is a named export — import only what you need
 *
 *  Usage:
 *    import { APP_CONFIG, ROUTES, XP_CONFIG } from './config.js';
 *    import { CONFIG } from './config.js';  // single import
 *
 * ================================================================
 */

'use strict';

/* ================================================================
   APP INFO
   ================================================================ */
export const APP_INFO = Object.freeze({
  name:        'ExamEdge Pro',
  tagline:     'Master Every Exam with Precision',
  version:     '1.0.0',
  buildDate:   '2026-04-29',
  author:      'ExamEdge Team',
  website:     'https://examedgepro.in',
  supportEmail:'support@examedgepro.in',
  description: 'Adaptive exam preparation platform with mock tests, XP gamification, and AI-powered analytics.',
});

/* ================================================================
   ENVIRONMENT
   Change 'development' to 'production' before deploying
   ================================================================ */
export const ENV = Object.freeze({
  current:    'development',    // 'development' | 'production' | 'staging'
  isDev:      true,             // Set false in production
  isProd:     false,            // Set true in production
  debug:      true,             // Enables console logs, devtools
  version:    '1.0.0',
});

/* ================================================================
   ROUTES
   All page routes defined in one place.
   Used by router in app.js and sidebar links.
   ================================================================ */
export const ROUTES = Object.freeze({
  DASHBOARD:   '/',
  PRACTICE:    '/practice',
  MOCK:        '/mock',
  EXAM:        '/exam',
  LEADERBOARD: '/leaderboard',
  ANALYTICS:   '/analytics',
  PROFILE:     '/profile',
  LOGIN:       '/login',
  REGISTER:    '/register',
  NOT_FOUND:   '/404',
});

/* ================================================================
   LOCAL STORAGE KEYS
   All localStorage keys in one place — no magic strings anywhere
   ================================================================ */
export const STORAGE_KEYS = Object.freeze({
  USER:         'ee_user',
  SESSION:      'ee_session',
  THEME:        'ee_theme',
  XP:           'ee_xp',
  STREAK:       'ee_streak',
  ACHIEVEMENTS: 'ee_achievements',
  MILESTONES:   'ee_milestones',
  PREFERENCES:  'ee_prefs',
  LAST_ROUTE:   'ee_last_route',
  CACHE_BUST:   'ee_cache_v',
});

/* ================================================================
   XP & GAMIFICATION CONFIG
   Controls how XP is earned and levels are calculated
   ================================================================ */
export const XP_CONFIG = Object.freeze({
  // XP rewards per action
  CORRECT_ANSWER:     10,
  WRONG_ANSWER:        0,
  PERFECT_PRACTICE:   50,     // All correct in a practice session
  PERFECT_MOCK:      100,     // 100% in a mock exam
  DAILY_LOGIN:        15,
  DAILY_STREAK:       20,     // Awarded per streak day
  FIRST_PRACTICE:     50,     // One-time bonus
  FIRST_MOCK:         75,     // One-time bonus
  SHARE_RESULT:       10,

  // Level system
  XP_PER_LEVEL:      500,     // XP needed to level up each time
  MAX_LEVEL:          50,

  // Streak
  STREAK_RESET_HOURS: 36,     // Hours before streak resets (gives buffer)
});

/* ================================================================
   EXAM & PRACTICE CONFIG
   Default settings for all exam modes
   ================================================================ */
export const EXAM_CONFIG = Object.freeze({
  // Practice
  PRACTICE_BATCH_SIZE:     10,    // Questions per practice session
  PRACTICE_MAX_QUESTIONS:  50,
  PRACTICE_TIME_PER_Q:     60,    // Seconds per question (optional timer)

  // Mock Exam
  MOCK_QUESTION_COUNT:     50,
  MOCK_DURATION_MINS:      60,
  MOCK_MIN_DURATION:       15,    // Minimum allowed duration
  MOCK_MAX_DURATION:       180,

  // Scheduled Exam
  EXAM_MAX_ATTEMPTS:        3,    // How many times a user can retake

  // Scoring
  PASS_PERCENTAGE:          60,   // % needed to pass
  GOOD_PERCENTAGE:          75,
  EXCELLENT_PERCENTAGE:     90,

  // Questions
  OPTIONS_COUNT:             4,   // Always 4 options per question
  SHOW_EXPLANATION:       true,
  SHUFFLE_OPTIONS:        true,
  SHUFFLE_QUESTIONS:      true,
});

/* ================================================================
   DIFFICULTY LEVELS
   ================================================================ */
export const DIFFICULTY = Object.freeze({
  EASY:   'easy',
  MEDIUM: 'medium',
  HARD:   'hard',
  ALL:    'all',

  // Labels for display
  LABELS: {
    easy:   'Easy',
    medium: 'Medium',
    hard:   'Hard',
    all:    'All Levels',
  },

  // XP multipliers per difficulty
  XP_MULTIPLIER: {
    easy:   1.0,
    medium: 1.5,
    hard:   2.0,
  },
});

/* ================================================================
   EXAM TOPICS
   All available subjects in the question bank
   ================================================================ */
export const TOPICS = Object.freeze([
  { id: 'mathematics', label: 'Mathematics',       icon: '🔢', color: '#4f8cff' },
  { id: 'english',     label: 'English',           icon: '📖', color: '#a78bfa' },
  { id: 'reasoning',   label: 'Reasoning',         icon: '🧩', color: '#34d399' },
  { id: 'gk',          label: 'General Knowledge', icon: '🌏', color: '#fb923c' },
  { id: 'science',     label: 'Science',           icon: '🔬', color: '#38bdf8' },
  { id: 'current',     label: 'Current Affairs',   icon: '📰', color: '#f87171' },
  { id: 'computers',   label: 'Computers',         icon: '💻', color: '#fbbf24' },
  { id: 'history',     label: 'History',           icon: '🏛️', color: '#e879f9' },
]);

/* ================================================================
   AVAILABLE EXAMS
   Master list of all exam types on the platform
   ================================================================ */
export const EXAM_LIST = Object.freeze([
  {
    id:        'ssc_cgl',
    name:      'SSC CGL Tier I',
    questions: 100,
    duration:  60,
    topics:    ['mathematics', 'english', 'reasoning', 'gk'],
    status:    'available',
    minLevel:  1,
  },
  {
    id:        'ibps_po',
    name:      'IBPS PO Prelim',
    questions: 100,
    duration:  60,
    topics:    ['english', 'mathematics', 'reasoning'],
    status:    'available',
    minLevel:  1,
  },
  {
    id:        'upsc_csat',
    name:      'UPSC CSAT',
    questions: 80,
    duration:  120,
    topics:    ['reasoning', 'mathematics', 'english'],
    status:    'locked',
    minLevel:  3,
  },
  {
    id:        'rrb_ntpc',
    name:      'RRB NTPC CBT-1',
    questions: 100,
    duration:  90,
    topics:    ['mathematics', 'gk', 'reasoning'],
    status:    'available',
    minLevel:  1,
  },
  {
    id:        'cat_varc',
    name:      'CAT — VARC Section',
    questions: 40,
    duration:  40,
    topics:    ['english'],
    status:    'available',
    minLevel:  2,
  },
  {
    id:        'gate_cs',
    name:      'GATE CS — Full Mock',
    questions: 65,
    duration:  180,
    topics:    ['computers', 'mathematics', 'reasoning'],
    status:    'locked',
    minLevel:  5,
  },
]);

/* ================================================================
   THEME CONFIG
   ================================================================ */
export const THEME_CONFIG = Object.freeze({
  DEFAULT:   'dark',
  OPTIONS:   ['dark', 'light'],
  STORAGE:    STORAGE_KEYS.THEME,

  // CSS variable mappings (for reference)
  DARK: {
    bg:      '#0b0d14',
    surface: '#12151f',
    accent:  '#4f8cff',
    text:    '#e8eaf2',
  },
  LIGHT: {
    bg:      '#f0f2fa',
    surface: '#ffffff',
    accent:  '#4f8cff',
    text:    '#0f1117',
  },
});

/* ================================================================
   DEFAULT USER PREFERENCES
   Applied when a new user signs up
   ================================================================ */
export const DEFAULT_PREFERENCES = Object.freeze({
  language:         'en',
  theme:            'dark',
  notifications:    true,
  emailUpdates:     false,
  soundEnabled:     false,
  autoSubmit:       false,      // Auto-submit mock when timer ends
  showExplanation:  true,       // Show answer explanation immediately
  shuffleOptions:   true,
  questionFontSize: 'md',       // 'sm' | 'md' | 'lg'
  dailyGoal:        20,         // Questions per day target
});

/* ================================================================
   API ENDPOINTS
   For future REST API integration
   ================================================================ */
export const API = Object.freeze({
  BASE_URL:       'https://api.examedgepro.in/v1',
  TIMEOUT_MS:     10000,        // 10 second request timeout

  ENDPOINTS: {
    LOGIN:         '/auth/login',
    REGISTER:      '/auth/register',
    LOGOUT:        '/auth/logout',
    REFRESH:       '/auth/refresh',
    USER:          '/users/me',
    QUESTIONS:     '/questions',
    SUBMIT:        '/sessions/submit',
    LEADERBOARD:   '/leaderboard',
    ANALYTICS:     '/analytics',
    ACHIEVEMENTS:  '/achievements',
  },
});

/* ================================================================
   FIREBASE CONFIG
   Fill these values from your Firebase console.
   Go to: Firebase Console → Project Settings → Your Apps → Config

   Steps:
     1. Go to https://console.firebase.google.com
     2. Create a project named "examedge-pro"
     3. Add a Web App
     4. Copy the config object below
     5. Set FEATURES.FIREBASE_ENABLED = true
   ================================================================ */
export const FIREBASE_CONFIG = Object.freeze({
  apiKey:            '',        // From Firebase Console
  authDomain:        '',        // yourproject.firebaseapp.com
  projectId:         '',        // yourproject
  storageBucket:     '',        // yourproject.appspot.com
  messagingSenderId: '',        // Numbers only
  appId:             '',        // 1:xxx:web:xxx
  measurementId:     '',        // G-XXXXXXXXXX (optional, for Analytics)
});

/* ================================================================
   FEATURE FLAGS
   Toggle features ON/OFF without deleting code.
   Set to true when the feature is ready to use.
   ================================================================ */
export const FEATURES = Object.freeze({
  FIREBASE_ENABLED:      false,   // true = real backend, false = localStorage only
  ANALYTICS_ENABLED:     false,   // Google Analytics / Firebase Analytics
  LEADERBOARD_ENABLED:   true,
  ACHIEVEMENTS_ENABLED:  true,
  STREAKS_ENABLED:       true,
  DARK_MODE_ENABLED:     true,
  SOUND_ENABLED:         false,
  NOTIFICATIONS_ENABLED: true,
  SEARCH_ENABLED:        true,
  AI_HINTS_ENABLED:      false,   // Future: AI-powered hints
  OFFLINE_MODE:          false,   // Future: PWA offline support
  SOCIAL_SHARE:          false,   // Future: Share results to social
  REFERRAL_SYSTEM:       false,   // Future: Refer a friend
});

/* ================================================================
   LEADERBOARD CONFIG
   ================================================================ */
export const LEADERBOARD_CONFIG = Object.freeze({
  PAGE_SIZE:        50,           // Users shown per page
  REFRESH_MINS:     5,            // Refresh leaderboard every 5 mins
  FILTERS:          ['xp', 'streak', 'accuracy'],
  DEFAULT_FILTER:   'xp',
});

/* ================================================================
   ACHIEVEMENT DEFINITIONS
   ================================================================ */
export const ACHIEVEMENT_DEFS = Object.freeze([
  {
    id:         'first_question',
    name:       'First Step',
    desc:       'Answer your first question',
    icon:       '🎯',
    xpReward:   25,
    condition:  'questions_answered >= 1',
  },
  {
    id:         'streak_3',
    name:       'On a Roll',
    desc:       'Maintain a 3-day streak',
    icon:       '🔥',
    xpReward:   50,
    condition:  'streak.current >= 3',
  },
  {
    id:         'streak_7',
    name:       'Week Warrior',
    desc:       'Maintain a 7-day streak',
    icon:       '⚡',
    xpReward:   100,
    condition:  'streak.current >= 7',
  },
  {
    id:         'streak_30',
    name:       'Iron Scholar',
    desc:       'Maintain a 30-day streak',
    icon:       '💎',
    xpReward:   500,
    condition:  'streak.current >= 30',
  },
  {
    id:         'xp_500',
    name:       'XP Collector',
    desc:       'Earn 500 total XP',
    icon:       '✨',
    xpReward:   0,
    condition:  'xp.total >= 500',
  },
  {
    id:         'xp_2000',
    name:       'Knowledge Seeker',
    desc:       'Earn 2,000 total XP',
    icon:       '🌟',
    xpReward:   0,
    condition:  'xp.total >= 2000',
  },
  {
    id:         'mock_perfect',
    name:       'Perfectionist',
    desc:       'Score 100% on a mock exam',
    icon:       '🏆',
    xpReward:   200,
    condition:  'mock.results[].score == 100',
  },
  {
    id:         'level_5',
    name:       'Rising Scholar',
    desc:       'Reach Level 5',
    icon:       '📚',
    xpReward:   100,
    condition:  'xp.level >= 5',
  },
  {
    id:         'level_10',
    name:       'Expert Learner',
    desc:       'Reach Level 10',
    icon:       '🎓',
    xpReward:   250,
    condition:  'xp.level >= 10',
  },
  {
    id:         'accuracy_90',
    name:       'Sharp Mind',
    desc:       'Achieve 90% overall accuracy',
    icon:       '🎯',
    xpReward:   150,
    condition:  'analytics.accuracy >= 90',
  },
]);

/* ================================================================
   MILESTONE DEFINITIONS
   ================================================================ */
export const MILESTONE_DEFS = Object.freeze([
  { id: 'm1', label: 'Answer 50 Questions',   target: 50,   metric: 'questions_answered', icon: '📝' },
  { id: 'm2', label: 'Answer 200 Questions',  target: 200,  metric: 'questions_answered', icon: '📚' },
  { id: 'm3', label: 'Answer 500 Questions',  target: 500,  metric: 'questions_answered', icon: '🎯' },
  { id: 'm4', label: 'Answer 1000 Questions', target: 1000, metric: 'questions_answered', icon: '🔥' },
  { id: 'm5', label: 'Complete 5 Mock Exams', target: 5,    metric: 'mocks_completed',    icon: '📋' },
  { id: 'm6', label: 'Complete 20 Mock Exams',target: 20,   metric: 'mocks_completed',    icon: '🏅' },
  { id: 'm7', label: 'Earn 1,000 XP',         target: 1000, metric: 'xp',                 icon: '⭐' },
  { id: 'm8', label: 'Earn 5,000 XP',         target: 5000, metric: 'xp',                 icon: '🌟' },
  { id: 'm9', label: '7-Day Streak',           target: 7,    metric: 'streak',             icon: '🔥' },
  { id: 'm10',label: '30-Day Streak',          target: 30,   metric: 'streak',             icon: '💎' },
]);

/* ================================================================
   UI CONFIG
   Default UI behaviour settings
   ================================================================ */
export const UI_CONFIG = Object.freeze({
  TOAST_DURATION_MS:   3500,       // How long toasts stay visible
  TOAST_MAX:           4,          // Max toasts on screen at once
  PAGE_TRANSITION_MS:  350,        // Page switch animation duration
  SIDEBAR_WIDTH:       240,        // px
  SIDEBAR_COLLAPSED:   64,         // px (tablet)
  NAVBAR_HEIGHT:       60,         // px
  DEBOUNCE_SEARCH_MS:  500,        // Search input debounce
  SKELETON_MIN_MS:     400,        // Min time to show skeleton loader

  BREAKPOINTS: {
    XS:  480,
    SM:  640,
    MD:  768,
    LG:  1024,
    XL:  1280,
    XXL: 1536,
  },
});

/* ================================================================
   APP_CONFIG  (backward-compatible alias)
   Used by app.js, state.js, and older modules
   ================================================================ */
export const APP_CONFIG = Object.freeze({
  name:    APP_INFO.name,
  version: APP_INFO.version,
  env:     ENV.current,
});

/* ================================================================
   CONFIG  — Single unified export
   Import everything from one place if you prefer.

   Usage:
     import { CONFIG } from './config.js';
     CONFIG.APP.name          → 'ExamEdge Pro'
     CONFIG.ROUTES.DASHBOARD  → '/'
     CONFIG.XP.CORRECT_ANSWER → 10
     CONFIG.FEATURES.FIREBASE_ENABLED → false
     CONFIG.FIREBASE.apiKey   → ''
   ================================================================ */
export const CONFIG = Object.freeze({
  APP:         APP_INFO,
  ENV:         ENV,
  ROUTES:      ROUTES,
  STORAGE:     STORAGE_KEYS,
  XP:          XP_CONFIG,
  EXAM:        EXAM_CONFIG,
  DIFFICULTY:  DIFFICULTY,
  TOPICS:      TOPICS,
  EXAM_LIST:   EXAM_LIST,
  THEME:       THEME_CONFIG,
  PREFS:       DEFAULT_PREFERENCES,
  API:         API,
  FIREBASE:    FIREBASE_CONFIG,
  FEATURES:    FEATURES,
  LEADERBOARD: LEADERBOARD_CONFIG,
  ACHIEVEMENTS:ACHIEVEMENT_DEFS,
  MILESTONES:  MILESTONE_DEFS,
  UI:          UI_CONFIG,
});

/* ================================================================
   DEFAULT EXPORT  (for convenience)
   ================================================================ */
export default CONFIG;

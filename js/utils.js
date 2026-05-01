/**
 * ================================================================
 *  ExamEdge Pro — js/utils.js
 *  Reusable Utility Functions Library
 * ================================================================
 *
 *  Rules:
 *    - NO DOM manipulation in this file (ever)
 *    - NO imports from other project files
 *    - NO side effects — pure functions only
 *    - Every function is independently testable
 *    - All functions are named exports
 *
 *  Categories:
 *    1.  Date & Time
 *    2.  ID Generation
 *    3.  Async Helpers  (debounce, throttle, sleep, retry)
 *    4.  Object Helpers (deepClone, deepMerge, pick, omit)
 *    5.  Array Helpers  (shuffle, pickRandom, groupBy, unique)
 *    6.  String Helpers (truncate, capitalize, slugify, escapeHTML)
 *    7.  Number Helpers (formatNumber, clamp, formatPercent)
 *    8.  Validation     (isEmail, isPassword, isEmpty, isURL)
 *    9.  Storage        (lsGet, lsSet, lsRemove, lsClear)
 *    10. Math / XP      (calcLevel, calcProgress, calcAccuracy)
 *    11. DOM Utilities  ($ query helpers — NO manipulation)
 *    12. Toast / Notify (showToast — only UI util allowed)
 *    13. Misc           (uid, noop, pipe, memoize)
 *
 *  Usage:
 *    import { formatDate, debounce, deepClone } from './utils.js';
 *    import * as Utils from './utils.js';
 *
 * ================================================================
 */

'use strict';

/* ================================================================
   1. DATE & TIME
   ================================================================ */

/**
 * formatDate(dateInput, options?)
 * Format any date into a readable string.
 *
 * @param {string|Date|number} dateInput  — ISO string, Date object, or timestamp
 * @param {object}             [options]  — Intl.DateTimeFormat options
 * @returns {string}
 *
 * Examples:
 *   formatDate('2026-04-29')                    → 'Apr 29, 2026'
 *   formatDate(new Date(), { dateStyle:'full' }) → 'Wednesday, April 29, 2026'
 *   formatDate(1714300000000)                   → 'Apr 28, 2026'
 */
export function formatDate(dateInput, options = { dateStyle: 'medium' }) {
  if (!dateInput) return '';
  try {
    const date = dateInput instanceof Date
      ? dateInput
      : new Date(dateInput);

    if (isNaN(date.getTime())) return 'Invalid date';

    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * formatTime(seconds)
 * Convert seconds to MM:SS display string.
 *
 * @param {number} seconds
 * @returns {string}
 *
 * Examples:
 *   formatTime(90)    → '01:30'
 *   formatTime(3600)  → '60:00'
 *   formatTime(0)     → '00:00'
 */
export function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

/**
 * formatDuration(seconds)
 * Convert seconds into a human-readable duration string.
 *
 * @param {number} seconds
 * @returns {string}
 *
 * Examples:
 *   formatDuration(65)   → '1m 5s'
 *   formatDuration(3700) → '1h 1m'
 *   formatDuration(30)   → '30s'
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return h + 'h ' + (m > 0 ? m + 'm' : '');
  if (m > 0) return m + 'm ' + (s > 0 ? s + 's' : '');
  return s + 's';
}

/**
 * timeAgo(dateInput)
 * Returns relative time string.
 *
 * @param {string|Date|number} dateInput
 * @returns {string}
 *
 * Examples:
 *   timeAgo(Date.now() - 60000)       → '1 minute ago'
 *   timeAgo(Date.now() - 3600000)     → '1 hour ago'
 *   timeAgo(Date.now() - 86400000)    → '1 day ago'
 */
export function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date  = new Date(dateInput);
  const diff  = Math.floor((Date.now() - date.getTime()) / 1000);

  const units = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000  },
    { label: 'week',   secs: 604800   },
    { label: 'day',    secs: 86400    },
    { label: 'hour',   secs: 3600     },
    { label: 'minute', secs: 60       },
    { label: 'second', secs: 1        },
  ];

  for (const unit of units) {
    const count = Math.floor(diff / unit.secs);
    if (count >= 1) {
      return count + ' ' + unit.label + (count > 1 ? 's' : '') + ' ago';
    }
  }

  return 'just now';
}

/**
 * isToday(dateInput)
 * Check if a date is today.
 *
 * @param {string|Date|number} dateInput
 * @returns {boolean}
 */
export function isToday(dateInput) {
  if (!dateInput) return false;
  return new Date(dateInput).toDateString() === new Date().toDateString();
}

/**
 * isYesterday(dateInput)
 * Check if a date was yesterday.
 *
 * @param {string|Date|number} dateInput
 * @returns {boolean}
 */
export function isYesterday(dateInput) {
  if (!dateInput) return false;
  const yesterday = new Date(Date.now() - 86400000);
  return new Date(dateInput).toDateString() === yesterday.toDateString();
}

/**
 * nowISO()
 * Returns current datetime as ISO string.
 *
 * @returns {string}
 *
 * Example: '2026-04-29T10:30:00.000Z'
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * getGreeting()
 * Returns a time-based greeting.
 *
 * @returns {string}  'Good Morning' | 'Good Afternoon' | 'Good Evening'
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ================================================================
   2. ID GENERATION
   ================================================================ */

/**
 * generateId(prefix?)
 * Generate a unique ID string.
 *
 * @param {string} [prefix]  — Optional prefix
 * @returns {string}
 *
 * Examples:
 *   generateId()          → 'x7k2m9p'
 *   generateId('session') → 'session_x7k2m9p'
 *   generateId('q')       → 'q_x7k2m9p'
 */
export function generateId(prefix = '') {
  const random = Math.random().toString(36).slice(2, 9);
  const time   = Date.now().toString(36).slice(-4);
  const id     = random + time;
  return prefix ? prefix + '_' + id : id;
}

/**
 * uid()
 * Short alias for generateId — 7 char random ID.
 *
 * @returns {string}
 */
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * generateSessionId()
 * Generate a unique exam session ID with timestamp.
 *
 * @returns {string}  e.g. 'sess_lk3p9x_1714300000'
 */
export function generateSessionId() {
  return 'sess_' + uid() + '_' + Math.floor(Date.now() / 1000);
}

/* ================================================================
   3. ASYNC HELPERS
   ================================================================ */

/**
 * debounce(fn, delay?)
 * Returns a debounced version of fn.
 * Only calls fn after it hasn't been called for `delay` ms.
 *
 * @param {function} fn      — Function to debounce
 * @param {number}   [delay] — Milliseconds (default 300)
 * @returns {function}
 *
 * Example:
 *   const search = debounce((q) => fetchResults(q), 500);
 *   input.addEventListener('input', (e) => search(e.target.value));
 */
export function debounce(fn, delay = 300) {
  if (typeof fn !== 'function') throw new TypeError('debounce: fn must be a function');
  let timer = null;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  }

  // Cancel pending call
  debounced.cancel = function () {
    clearTimeout(timer);
    timer = null;
  };

  // Flush immediately
  debounced.flush = function (...args) {
    clearTimeout(timer);
    timer = null;
    fn.apply(this, args);
  };

  return debounced;
}

/**
 * throttle(fn, limit?)
 * Returns a throttled version of fn.
 * Calls fn at most once per `limit` ms.
 *
 * @param {function} fn      — Function to throttle
 * @param {number}   [limit] — Milliseconds (default 300)
 * @returns {function}
 *
 * Example:
 *   const onScroll = throttle(() => updateNavbar(), 100);
 *   window.addEventListener('scroll', onScroll);
 */
export function throttle(fn, limit = 300) {
  if (typeof fn !== 'function') throw new TypeError('throttle: fn must be a function');
  let lastRun  = 0;
  let timer    = null;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastRun);

    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      lastRun = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer   = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * sleep(ms)
 * Promise-based delay / pause.
 *
 * @param {number} ms  — Milliseconds to wait
 * @returns {Promise<void>}
 *
 * Example:
 *   await sleep(1000); // wait 1 second
 */
export function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, Math.max(0, ms));
  });
}

/**
 * retry(fn, times?, delay?)
 * Retry an async function up to N times before throwing.
 *
 * @param {function} fn      — Async function to retry
 * @param {number}   [times] — Max attempts (default 3)
 * @param {number}   [delay] — Wait between attempts in ms (default 500)
 * @returns {Promise<*>}
 *
 * Example:
 *   const data = await retry(() => fetchQuestions(), 3, 1000);
 */
export async function retry(fn, times = 3, delay = 500) {
  if (typeof fn !== 'function') throw new TypeError('retry: fn must be a function');

  for (var i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === times - 1) throw err;
      await sleep(delay);
    }
  }
}

/**
 * timeout(promise, ms, message?)
 * Race a promise against a timeout.
 *
 * @param {Promise}  promise
 * @param {number}   ms       — Timeout in milliseconds
 * @param {string}   [message]
 * @returns {Promise<*>}
 *
 * Example:
 *   const data = await timeout(fetch('/api/q'), 5000, 'Request timed out');
 */
export function timeout(promise, ms, message = 'Request timed out') {
  var timeoutPromise = new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(message));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
}

/* ================================================================
   4. OBJECT HELPERS
   ================================================================ */

/**
 * deepClone(obj)
 * Create a completely independent deep copy of any value.
 * Uses structuredClone if available, falls back to JSON.
 *
 * @param {*} obj  — Any value to clone
 * @returns {*}    — Deep cloned copy
 *
 * Examples:
 *   const copy = deepClone({ a: { b: [1, 2, 3] } });
 *   const arr  = deepClone([1, [2, 3], { x: 4 }]);
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }

  // Fallback for older environments
  return JSON.parse(JSON.stringify(obj));
}

/**
 * deepMerge(target, ...sources)
 * Recursively merge source objects into target.
 * Does NOT mutate the original — returns a new object.
 *
 * @param {object} target
 * @param {...object} sources
 * @returns {object}
 *
 * Example:
 *   deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } })
 *   → { a: 1, b: { c: 2, d: 3 } }
 */
export function deepMerge(target) {
  var sources = Array.prototype.slice.call(arguments, 1);
  var result  = deepClone(target);

  sources.forEach(function (source) {
    if (!source || typeof source !== 'object') return;

    Object.keys(source).forEach(function (key) {
      var srcVal = source[key];
      var tgtVal = result[key];

      if (
        srcVal !== null &&
        typeof srcVal === 'object' &&
        !Array.isArray(srcVal) &&
        tgtVal !== null &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        result[key] = deepMerge(tgtVal, srcVal);
      } else {
        result[key] = deepClone(srcVal);
      }
    });
  });

  return result;
}

/**
 * pick(obj, keys)
 * Create a new object with only the specified keys.
 *
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 *
 * Example:
 *   pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }
 */
export function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return {};
  var result = {};
  keys.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * omit(obj, keys)
 * Create a new object without the specified keys.
 *
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 *
 * Example:
 *   omit({ a: 1, b: 2, c: 3 }, ['b']) → { a: 1, c: 3 }
 */
export function omit(obj, keys) {
  if (!obj || typeof obj !== 'object') return {};
  var keySet = new Set(keys);
  var result  = {};
  Object.keys(obj).forEach(function (key) {
    if (!keySet.has(key)) result[key] = obj[key];
  });
  return result;
}

/**
 * flattenObject(obj, prefix?)
 * Flatten a nested object to dot-path keys.
 *
 * @param {object} obj
 * @param {string} [prefix]
 * @returns {object}
 *
 * Example:
 *   flattenObject({ a: { b: { c: 1 } } }) → { 'a.b.c': 1 }
 */
export function flattenObject(obj, prefix) {
  prefix = prefix || '';
  var result = {};

  Object.keys(obj).forEach(function (key) {
    var fullKey = prefix ? prefix + '.' + key : key;
    var val     = obj[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  });

  return result;
}

/* ================================================================
   5. ARRAY HELPERS
   ================================================================ */

/**
 * shuffle(array)
 * Return a new shuffled copy of the array (Fisher-Yates).
 * Does NOT mutate the original array.
 *
 * @param {Array} array
 * @returns {Array}
 *
 * Example:
 *   shuffle([1, 2, 3, 4, 5]) → [3, 1, 5, 2, 4]  (random)
 */
export function shuffle(array) {
  if (!Array.isArray(array)) return [];
  var arr = array.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j       = Math.floor(Math.random() * (i + 1));
    var temp    = arr[i];
    arr[i]      = arr[j];
    arr[j]      = temp;
  }
  return arr;
}

/**
 * pickRandom(array, n)
 * Pick N random items from an array (no repeats).
 *
 * @param {Array}  array
 * @param {number} n      — How many to pick
 * @returns {Array}
 *
 * Example:
 *   pickRandom([1, 2, 3, 4, 5], 3) → [4, 1, 5]  (random)
 */
export function pickRandom(array, n) {
  if (!Array.isArray(array) || n <= 0) return [];
  return shuffle(array).slice(0, Math.min(n, array.length));
}

/**
 * groupBy(array, key)
 * Group an array of objects by a specific key.
 *
 * @param {Array}           array
 * @param {string|function} key    — Property name or getter function
 * @returns {object}               — { [keyValue]: items[] }
 *
 * Examples:
 *   groupBy([{ topic: 'Math', q: 'Q1' }, { topic: 'English', q: 'Q2' }], 'topic')
 *   → { Math: [...], English: [...] }
 *
 *   groupBy(questions, q => q.difficulty)
 *   → { easy: [...], medium: [...], hard: [...] }
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};
  return array.reduce(function (acc, item) {
    var groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

/**
 * unique(array, key?)
 * Remove duplicate values from an array.
 *
 * @param {Array}   array
 * @param {string}  [key]  — For arrays of objects: deduplicate by this property
 * @returns {Array}
 *
 * Examples:
 *   unique([1, 2, 2, 3])               → [1, 2, 3]
 *   unique([{id: 1}, {id: 1}], 'id')   → [{id: 1}]
 */
export function unique(array, key) {
  if (!Array.isArray(array)) return [];
  if (!key) return Array.from(new Set(array));

  var seen = new Set();
  return array.filter(function (item) {
    var val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * chunk(array, size)
 * Split an array into chunks of given size.
 *
 * @param {Array}  array
 * @param {number} size
 * @returns {Array[]}
 *
 * Example:
 *   chunk([1,2,3,4,5], 2) → [[1,2], [3,4], [5]]
 */
export function chunk(array, size) {
  if (!Array.isArray(array) || size < 1) return [];
  var chunks = [];
  for (var i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * sortBy(array, key, direction?)
 * Sort an array of objects by a key.
 *
 * @param {Array}   array
 * @param {string}  key
 * @param {'asc'|'desc'} [direction] — Default 'asc'
 * @returns {Array}
 *
 * Example:
 *   sortBy(users, 'xp', 'desc')  → users sorted by xp descending
 */
export function sortBy(array, key, direction) {
  if (!Array.isArray(array)) return [];
  direction = direction || 'asc';
  var dir   = direction === 'desc' ? -1 : 1;

  return array.slice().sort(function (a, b) {
    if (a[key] < b[key]) return -1 * dir;
    if (a[key] > b[key]) return  1 * dir;
    return 0;
  });
}

/* ================================================================
   6. STRING HELPERS
   ================================================================ */

/**
 * truncate(str, max?, suffix?)
 * Truncate a string to max characters.
 *
 * @param {string} str
 * @param {number} [max]    — Max characters (default 60)
 * @param {string} [suffix] — Appended when truncated (default '…')
 * @returns {string}
 *
 * Example:
 *   truncate('Hello World this is long', 10) → 'Hello Worl…'
 */
export function truncate(str, max, suffix) {
  max    = max    === undefined ? 60 : max;
  suffix = suffix === undefined ? '\u2026' : suffix;
  if (typeof str !== 'string') return '';
  if (str.length <= max) return str;
  return str.slice(0, max) + suffix;
}

/**
 * capitalize(str)
 * Capitalize the first letter of a string.
 *
 * @param {string} str
 * @returns {string}
 *
 * Example:
 *   capitalize('hello world') → 'Hello world'
 */
export function capitalize(str) {
  if (typeof str !== 'string' || !str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * titleCase(str)
 * Convert a string to Title Case.
 *
 * @param {string} str
 * @returns {string}
 *
 * Example:
 *   titleCase('hello world') → 'Hello World'
 */
export function titleCase(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * slugify(str)
 * Convert a string to a URL-friendly slug.
 *
 * @param {string} str
 * @returns {string}
 *
 * Example:
 *   slugify('SSC CGL 2026 Practice!') → 'ssc-cgl-2026-practice'
 */
export function slugify(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * escapeHTML(str)
 * Escape special HTML characters to prevent XSS.
 *
 * @param {string} str
 * @returns {string}
 *
 * Example:
 *   escapeHTML('<script>alert("xss")</script>')
 *   → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  var map = {
    '&':  '&amp;',
    '<':  '&lt;',
    '>':  '&gt;',
    '"':  '&quot;',
    "'":  '&#039;',
    '/':  '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, function (ch) {
    return map[ch];
  });
}

/**
 * initials(name, max?)
 * Extract initials from a full name.
 *
 * @param {string} name
 * @param {number} [max]  — Max initials (default 2)
 * @returns {string}
 *
 * Examples:
 *   initials('Aryan Sharma')        → 'AS'
 *   initials('Priya Mehta Kumar')   → 'PM'
 *   initials('Rahul')               → 'R'
 */
export function initials(name, max) {
  max = max === undefined ? 2 : max;
  if (typeof name !== 'string' || !name.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map(function (w) { return w[0].toUpperCase(); })
    .join('');
}

/* ================================================================
   7. NUMBER HELPERS
   ================================================================ */

/**
 * formatNumber(n)
 * Format a number with locale-aware commas.
 *
 * @param {number} n
 * @returns {string}
 *
 * Examples:
 *   formatNumber(1240)    → '1,240'
 *   formatNumber(1500000) → '15,00,000'  (Indian locale)
 */
export function formatNumber(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString('en-IN');
}

/**
 * formatPercent(value, total, decimals?)
 * Calculate and format a percentage string.
 *
 * @param {number} value
 * @param {number} total
 * @param {number} [decimals]  — Decimal places (default 0)
 * @returns {string}
 *
 * Examples:
 *   formatPercent(7, 10)       → '70%'
 *   formatPercent(1, 3, 1)     → '33.3%'
 *   formatPercent(0, 0)        → '0%'
 */
export function formatPercent(value, total, decimals) {
  decimals = decimals === undefined ? 0 : decimals;
  if (!total || total === 0) return '0%';
  var pct = (value / total) * 100;
  return pct.toFixed(decimals) + '%';
}

/**
 * clamp(value, min, max)
 * Clamp a number between min and max.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 *
 * Example:
 *   clamp(150, 0, 100) → 100
 *   clamp(-5,  0, 100) → 0
 *   clamp(50,  0, 100) → 50
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * round(value, decimals?)
 * Round a number to N decimal places.
 *
 * @param {number} value
 * @param {number} [decimals]  — Default 0
 * @returns {number}
 *
 * Example:
 *   round(3.14159, 2) → 3.14
 */
export function round(value, decimals) {
  decimals = decimals === undefined ? 0 : decimals;
  var factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/* ================================================================
   8. VALIDATION
   ================================================================ */

/**
 * isEmail(str)
 * Validate an email address format.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isEmail(str) {
  if (typeof str !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str.trim());
}

/**
 * isValidPassword(str)
 * Validate password meets minimum requirements.
 * Rule: At least 8 characters.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isValidPassword(str) {
  return typeof str === 'string' && str.length >= 8;
}

/**
 * isValidEmail(str)
 * Alias for isEmail — backward compatibility.
 */
export var isValidEmail = isEmail;

/**
 * isEmpty(value)
 * Check if a value is empty (null, undefined, '', [], {}).
 *
 * @param {*} value
 * @returns {boolean}
 *
 * Examples:
 *   isEmpty(null)   → true
 *   isEmpty('')     → true
 *   isEmpty([])     → true
 *   isEmpty({})     → true
 *   isEmpty('hello')→ false
 *   isEmpty([1])    → false
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string')  return value.trim().length === 0;
  if (Array.isArray(value))       return value.length === 0;
  if (typeof value === 'object')  return Object.keys(value).length === 0;
  return false;
}

/**
 * isURL(str)
 * Check if a string is a valid URL.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isURL(str) {
  if (typeof str !== 'string') return false;
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * isPositiveNumber(val)
 * Check if value is a finite positive number.
 *
 * @param {*} val
 * @returns {boolean}
 */
export function isPositiveNumber(val) {
  return typeof val === 'number' && isFinite(val) && val > 0;
}

/* ================================================================
   9. LOCAL STORAGE HELPERS
   ================================================================ */

/**
 * lsGet(key, fallback?)
 * Safely get and parse a value from localStorage.
 *
 * @param {string} key
 * @param {*}      [fallback]  — Returned if key missing or parse fails
 * @returns {*}
 *
 * Example:
 *   lsGet('ee_theme', 'dark')  → 'dark'
 *   lsGet('ee_xp')             → { total: 1240, level: 3 }
 */
export function lsGet(key, fallback) {
  fallback = fallback === undefined ? null : fallback;
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * lsSet(key, value)
 * Safely stringify and store a value in localStorage.
 *
 * @param {string} key
 * @param {*}      value
 * @returns {boolean}  — true if successful
 *
 * Example:
 *   lsSet('ee_theme', 'light')
 *   lsSet('ee_xp', { total: 1240, level: 3 })
 */
export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[Utils] lsSet failed:', key, e.message);
    return false;
  }
}

/**
 * lsRemove(key)
 * Remove a key from localStorage.
 *
 * @param {string} key
 */
export function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[Utils] lsRemove failed:', key);
  }
}

/**
 * lsClear(prefix?)
 * Clear all localStorage keys, or only those matching a prefix.
 *
 * @param {string} [prefix]  — If given, only removes keys starting with this
 *
 * Examples:
 *   lsClear()      → clears ALL localStorage
 *   lsClear('ee_') → clears only ExamEdge keys
 */
export function lsClear(prefix) {
  try {
    if (!prefix) {
      localStorage.clear();
      return;
    }
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) {
    console.warn('[Utils] lsClear failed:', e.message);
  }
}

/* ================================================================
   10. MATH / XP HELPERS
   ================================================================ */

/**
 * calcLevel(totalXP, xpPerLevel?)
 * Calculate the level from total XP.
 *
 * @param {number} totalXP
 * @param {number} [xpPerLevel]  — XP needed per level (default 500)
 * @returns {number}             — Current level (minimum 1)
 *
 * Example:
 *   calcLevel(0)    → 1
 *   calcLevel(499)  → 1
 *   calcLevel(500)  → 2
 *   calcLevel(1240) → 3
 */
export function calcLevel(totalXP, xpPerLevel) {
  xpPerLevel = xpPerLevel || 500;
  return Math.max(1, Math.floor(totalXP / xpPerLevel) + 1);
}

/**
 * calcProgress(totalXP, xpPerLevel?)
 * Calculate progress fraction (0 to 1) within the current level.
 *
 * @param {number} totalXP
 * @param {number} [xpPerLevel]  — Default 500
 * @returns {number}             — Between 0 and 1
 *
 * Examples:
 *   calcProgress(0)    → 0
 *   calcProgress(250)  → 0.5
 *   calcProgress(500)  → 0   (just leveled up — fresh start)
 *   calcProgress(750)  → 0.5
 */
export function calcProgress(totalXP, xpPerLevel) {
  xpPerLevel = xpPerLevel || 500;
  return (totalXP % xpPerLevel) / xpPerLevel;
}

/**
 * calcXPToNextLevel(totalXP, xpPerLevel?)
 * How much XP is needed to reach the next level.
 *
 * @param {number} totalXP
 * @param {number} [xpPerLevel]  — Default 500
 * @returns {number}
 *
 * Example:
 *   calcXPToNextLevel(1240) → 260
 */
export function calcXPToNextLevel(totalXP, xpPerLevel) {
  xpPerLevel = xpPerLevel || 500;
  return xpPerLevel - (totalXP % xpPerLevel);
}

/**
 * calcAccuracy(correct, total)
 * Calculate accuracy as a percentage (0–100).
 *
 * @param {number} correct
 * @param {number} total
 * @returns {number}  — Rounded to nearest integer
 *
 * Examples:
 *   calcAccuracy(7, 10) → 70
 *   calcAccuracy(0, 0)  → 0
 */
export function calcAccuracy(correct, total) {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * calcScore(correct, total)
 * Alias for calcAccuracy — same logic, clearer name in exam context.
 */
export var calcScore = calcAccuracy;

/* ================================================================
   11. DOM QUERY HELPERS  (read-only — no manipulation)
   ================================================================ */

/**
 * $(selector, root?)
 * Shorthand for querySelector.
 *
 * @param {string}  selector
 * @param {Element} [root]    — Default document
 * @returns {Element|null}
 */
export function $(selector, root) {
  return (root || document).querySelector(selector);
}

/**
 * $$(selector, root?)
 * Shorthand for querySelectorAll — returns array (not NodeList).
 *
 * @param {string}  selector
 * @param {Element} [root]
 * @returns {Element[]}
 */
export function $$(selector, root) {
  return Array.from((root || document).querySelectorAll(selector));
}

/* ================================================================
   12. TOAST NOTIFICATION  (the only UI util allowed here)
   ================================================================ */

/**
 * showToast(message, type?, duration?)
 * Display a toast notification.
 * Requires #toast-container in the DOM.
 *
 * @param {string} message
 * @param {'info'|'success'|'warn'|'error'} [type]     — Default 'info'
 * @param {number}                           [duration] — ms (default 3500)
 *
 * Example:
 *   showToast('Practice complete!', 'success')
 *   showToast('Connection failed', 'error', 5000)
 */
export function showToast(message, type, duration) {
  type     = type     || 'info';
  duration = duration || 3500;

  var container = document.getElementById('toast-container');
  if (!container) return;

  var icons = { success: '\u2713', error: '\u2715', warn: '\u26A0', info: '\u2139' };

  // Create elements safely (no innerHTML)
  var toast    = document.createElement('div');
  var iconSpan = document.createElement('span');
  var msgSpan  = document.createElement('span');

  toast.className    = 'toast toast--' + type;
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = icons[type] || icons.info;
  msgSpan.className    = 'toast-msg';
  msgSpan.textContent  = message;

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  // Limit max toasts on screen
  var allToasts = container.querySelectorAll('.toast');
  if (allToasts.length > 4) {
    var oldest = allToasts[0];
    if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
  }

  // Auto-remove after duration
  setTimeout(function () {
    toast.classList.add('toast--out');
    toast.addEventListener('animationend', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  }, duration);
}

/* ================================================================
   13. MISC UTILITIES
   ================================================================ */

/**
 * noop()
 * A function that does nothing. Useful as a default callback.
 */
export function noop() {}

/**
 * pipe(...fns)
 * Left-to-right function composition.
 * Output of each function is passed as input to the next.
 *
 * @param {...function} fns
 * @returns {function}
 *
 * Example:
 *   const process = pipe(trim, capitalize, slugify);
 *   process('  hello world  ') → 'hello-world'
 */
export function pipe() {
  var fns = Array.prototype.slice.call(arguments);
  return function piped(value) {
    return fns.reduce(function (acc, fn) { return fn(acc); }, value);
  };
}

/**
 * memoize(fn)
 * Cache the results of a function based on its arguments.
 * Only use for pure functions (same input → same output).
 *
 * @param {function} fn
 * @returns {function}
 *
 * Example:
 *   const expensiveCalc = memoize((n) => n * n * n);
 *   expensiveCalc(10) // computed
 *   expensiveCalc(10) // returned from cache
 */
export function memoize(fn) {
  var cache = new Map();
  return function memoized() {
    var key = JSON.stringify(Array.prototype.slice.call(arguments));
    if (cache.has(key)) return cache.get(key);
    var result = fn.apply(this, arguments);
    cache.set(key, result);
    return result;
  };
}

/**
 * once(fn)
 * Returns a function that can only be called once.
 * All subsequent calls return the first result.
 *
 * @param {function} fn
 * @returns {function}
 *
 * Example:
 *   const initOnce = once(() => setupDatabase());
 *   initOnce(); // runs
 *   initOnce(); // returns cached result, does NOT run again
 */
export function once(fn) {
  var called = false;
  var result;
  return function () {
    if (!called) {
      called = true;
      result = fn.apply(this, arguments);
    }
    return result;
  };
}

/**
 * isMobile()
 * Check if current device is mobile (viewport width < 768px).
 *
 * @returns {boolean}
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * isTablet()
 * Check if current device is tablet (768px - 1024px).
 *
 * @returns {boolean}
 */
export function isTablet() {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * copyToClipboard(text)
 * Copy text to clipboard. Returns a promise.
 *
 * @param {string} text
 * @returns {Promise<boolean>}
 *
 * Example:
 *   const ok = await copyToClipboard('Share this result!');
 *   if (ok) showToast('Copied!', 'success');
 */
export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }
  // Fallback for older browsers
  try {
    var el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity  = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return Promise.resolve(true);
  } catch (e) {
    return Promise.resolve(false);
  }
}

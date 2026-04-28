/* ============================================================
   ExamEdge Pro — js/utils.js
   Shared utility functions — DOM, formatting, validation, etc.
   ============================================================ */

/* ── DOM Helpers ─────────────────────────────────────────────── */

/** Query selector shorthand */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Create an element with attributes + children */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') el.className = val;
    else if (key === 'html') el.innerHTML = val;
    else if (key.startsWith('data-')) el.setAttribute(key, val);
    else el[key] = val;
  }
  for (const child of children.flat()) {
    if (typeof child === 'string') el.append(document.createTextNode(child));
    else if (child) el.append(child);
  }
  return el;
}

/** Mount HTML string into a container */
export function mountHTML(container, html) {
  if (typeof container === 'string') container = $(container);
  if (!container) return;
  container.innerHTML = html;
}

/** Safe inner text (prevent XSS) */
export function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

/** Toggle a CSS class based on a condition */
export function toggleClass(el, className, condition) {
  if (typeof el === 'string') el = $(el);
  el?.classList.toggle(className, condition);
}

/* ── Toast Notifications ─────────────────────────────────────── */
export function showToast(message, type = 'info', duration = 3500) {
  const container = $('#toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };
  const toast = createElement('div', { class: `toast toast--${type}` },
    createElement('span', {}, icons[type] || icons.info),
    createElement('span', {}, message)
  );

  container.append(toast);

  setTimeout(() => {
    toast.classList.add('toast--out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ── Formatting ──────────────────────────────────────────────── */

/** Format seconds → MM:SS */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Format a number with commas */
export function formatNumber(n) {
  return Number(n).toLocaleString();
}

/** Format percentage */
export function formatPercent(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/** Truncate string to max length */
export function truncate(str, max = 60) {
  return str?.length > max ? str.slice(0, max) + '…' : str;
}

/** Capitalize first letter */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/** Format date → readable string */
export function formatDate(dateStr, opts = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat('en-IN', opts).format(new Date(dateStr));
}

/* ── Validation ──────────────────────────────────────────────── */

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  return password?.length >= 8;
}

/* ── Array / Object Helpers ──────────────────────────────────── */

/** Shuffle array (Fisher-Yates) */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick N random items from array */
export function pickRandom(array, n) {
  return shuffle(array).slice(0, n);
}

/** Group array of objects by a key */
export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const k = item[key];
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

/** Deep clone an object */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ── Async Helpers ───────────────────────────────────────────── */

/** Debounce a function */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Throttle a function */
export function throttle(fn, limit = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
}

/** Sleep / delay */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Retry an async function N times */
export async function retry(fn, times = 3, delay = 500) {
  for (let i = 0; i < times; i++) {
    try { return await fn(); }
    catch (e) { if (i === times - 1) throw e; await sleep(delay); }
  }
}

/* ── Local Storage Helpers ───────────────────────────────────── */

export function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn('[utils] lsSet failed:', e); }
}

export function lsRemove(key) {
  try { localStorage.removeItem(key); }
  catch { /* noop */ }
}

/* ── Progress / XP Helpers ───────────────────────────────────── */

/** Calculate level from total XP (500 XP per level) */
export function calcLevel(xp, threshold = 500) {
  return Math.floor(xp / threshold) + 1;
}

/** XP progress within current level (0–1) */
export function calcProgress(xp, threshold = 500) {
  return (xp % threshold) / threshold;
}

/* ── SVG Ring Progress ───────────────────────────────────────── */
export function buildRingSVG({ size = 80, stroke = 6, pct = 0, color = 'var(--clr-accent)' } = {}) {
  const r = (size / 2) - stroke;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 1));

  return `
    <svg class="ring-progress" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="ring-progress__bg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" />
      <circle class="ring-progress__fill" cx="${size/2}" cy="${size/2}" r="${r}"
        stroke="${color}" stroke-width="${stroke}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        style="transform-origin:center; transform:rotate(-90deg);"
      />
    </svg>
  `;
}

/* ── Misc ────────────────────────────────────────────────────── */

/** Generate a unique ID */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Check if today matches a stored date string */
export function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

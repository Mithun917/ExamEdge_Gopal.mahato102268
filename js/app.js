/* ============================================================
   ExamEdge Pro — js/app.js
   Main entry point: bootstrap, router, component loader
   ============================================================ */

import { store, hydrateStore } from './state.js';
import { ROUTES, FEATURES }    from './config.js';
import { initFirebase }         from './firebase.js';
import { $, showToast }         from './utils.js';

/* ── Lazy-load page modules ──────────────────────────────────── */
const PAGE_MODULES = {
  [ROUTES.DASHBOARD]:   () => import('./modules/analytics.js'),
  [ROUTES.PRACTICE]:    () => import('./modules/practice.js'),
  [ROUTES.MOCK]:        () => import('./modules/mock.js'),
  [ROUTES.EXAM]:        () => import('./modules/exam.js'),
  [ROUTES.LEADERBOARD]: () => import('./modules/leaderboard.js'),
  [ROUTES.PROFILE]:     () => import('./modules/user.js'),
};

/* ── Page HTML Map ───────────────────────────────────────────── */
const PAGE_HTML = {
  [ROUTES.DASHBOARD]:   'pages/dashboard.html',
  [ROUTES.PRACTICE]:    'pages/practice.html',
  [ROUTES.MOCK]:        'pages/mock.html',
  [ROUTES.EXAM]:        'pages/exam.html',
  [ROUTES.LEADERBOARD]: 'pages/leaderboard.html',
  [ROUTES.PROFILE]:     'pages/profile.html',
};

/* ── Router ──────────────────────────────────────────────────── */
async function navigate(path = '/') {
  const prevRoute = store.get('currentRoute');
  store.set('previousRoute', prevRoute);
  store.set('currentRoute', path);

  // Update sidebar active link
  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('data-route');
    link.classList.toggle('active', href === path);
  });

  await renderPage(path);
}

async function renderPage(path) {
  const outlet   = $('#page-outlet');
  const htmlPath = PAGE_HTML[path] || PAGE_HTML[ROUTES.DASHBOARD];

  store.setLoading('page', true);
  outlet.innerHTML = '';

  try {
    // Fetch page HTML
    const res  = await fetch(htmlPath);
    if (!res.ok) throw new Error(`Page not found: ${htmlPath}`);
    const html = await res.text();
    outlet.innerHTML = html;
    outlet.querySelector('.page-root')?.classList.add('page-enter');

    // Activate page JS module
    const moduleLoader = PAGE_MODULES[path];
    if (moduleLoader) {
      const mod = await moduleLoader();
      mod.init?.();
    }
  } catch (err) {
    console.error('[Router] Page load failed:', err);
    outlet.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__title">Page Not Found</div>
        <div class="empty-state__desc">The page you're looking for doesn't exist or failed to load.</div>
        <button class="btn btn--primary" onclick="window.navigate('/')">Go Home</button>
      </div>`;
  } finally {
    store.setLoading('page', false);
  }
}

/* ── Component Loader ────────────────────────────────────────── */
async function loadComponent(mountId, componentPath) {
  const mount = $(`#${mountId}`);
  if (!mount) return;
  try {
    const res  = await fetch(componentPath);
    const html = await res.text();
    mount.innerHTML = html;
  } catch (err) {
    console.warn(`[Components] Failed to load ${componentPath}:`, err);
  }
}

/* ── Theme ───────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  store.set('theme', theme);
}

function initTheme() {
  const saved = store.get('theme') || 'dark';
  applyTheme(saved);
}

export function toggleTheme() {
  const current = store.get('theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── Global Click Delegation ─────────────────────────────────── */
function initNavigation() {
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-route]');
    if (link) {
      e.preventDefault();
      navigate(link.dataset.route);
    }
  });

  // Browser back/forward
  window.addEventListener('popstate', () => {
    navigate(location.pathname || '/');
  });
}

/* ── Bootstrap ───────────────────────────────────────────────── */
async function boot() {
  console.info('[ExamEdge Pro] Booting…');

  // 1. Hydrate persisted state
  hydrateStore();

  // 2. Apply saved theme
  initTheme();

  // 3. Initialize Firebase (if enabled)
  if (FEATURES.FIREBASE_ENABLED) await initFirebase();

  // 4. Load shared components
  await Promise.all([
    loadComponent('navbar-mount',  'components/navbar.html'),
    loadComponent('sidebar-mount', 'components/sidebar.html'),
    loadComponent('modal-mount',   'components/modal.html'),
  ]);

  // 5. Bind navigation
  initNavigation();

  // 6. Render initial route
  const initRoute = location.pathname || ROUTES.DASHBOARD;
  await navigate(initRoute);

  // 7. Remove loading state
  document.body.classList.remove('app-loading');

  console.info('[ExamEdge Pro] Ready ✓');
}

/* ── Expose globals (for inline HTML usage) ──────────────────── */
window.navigate    = navigate;
window.toggleTheme = toggleTheme;
window.showToast   = showToast;

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', boot);

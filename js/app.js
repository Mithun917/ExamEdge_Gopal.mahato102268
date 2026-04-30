/**
 * ================================================================
 *  ExamEdge Pro — js/app.js
 *  Main Entry Point
 * ================================================================
 *
 *  Responsibilities:
 *    1. Initialize the entire application (initApp)
 *    2. Load HTML components (navbar, sidebar, modal)
 *    3. Handle client-side routing (loadPage)
 *    4. Attach all global event listeners (attachEvents)
 *    5. Manage theme (dark / light)
 *    6. Sync UI with global state
 *    7. Guard protected routes (auth check)
 *
 *  Architecture:
 *    - Pure ES Modules (type="module") — no global pollution
 *    - All state via store (state.js) — no window.* data
 *    - Only 4 controlled window.* exposed for HTML onclick use
 *    - Lazy-loads page JS modules on demand
 *    - Scalable: add a new page in 3 lines
 *
 *  Usage in index.html:
 *    <script type="module" src="js/app.js"></script>
 *
 * ================================================================
 */

'use strict';

/* ──────────────────────────────────────────────────────────────
   IMPORTS
   ──────────────────────────────────────────────────────────── */
import { store, hydrateStore }     from './state.js';
import { ROUTES, FEATURES,
         APP_CONFIG, STORAGE_KEYS } from './config.js';
import { initFirebase }             from './firebase.js';
import { $, showToast, lsGet,
         lsSet, calcLevel,
         calcProgress }             from './utils.js';

/* ──────────────────────────────────────────────────────────────
   ROUTE → PAGE HTML MAP
   Add new pages here — that's all you need to do
   ──────────────────────────────────────────────────────────── */
const PAGE_HTML = Object.freeze({
  [ROUTES.DASHBOARD]:   'pages/dashboard.html',
  [ROUTES.PRACTICE]:    'pages/practice.html',
  [ROUTES.MOCK]:        'pages/mock.html',
  [ROUTES.EXAM]:        'pages/exam.html',
  [ROUTES.LEADERBOARD]: 'pages/leaderboard.html',
  [ROUTES.ANALYTICS]:   'pages/analytics.html',
  [ROUTES.PROFILE]:     'pages/profile.html',
  [ROUTES.LOGIN]:       'pages/login.html',
});

/* ──────────────────────────────────────────────────────────────
   ROUTE → JS MODULE MAP  (lazy loaded)
   Each module must export an init() function
   ──────────────────────────────────────────────────────────── */
const PAGE_MODULES = Object.freeze({
  [ROUTES.DASHBOARD]:   () => import('./modules/analytics.js'),
  [ROUTES.PRACTICE]:    () => import('./modules/practice.js'),
  [ROUTES.MOCK]:        () => import('./modules/mock.js'),
  [ROUTES.EXAM]:        () => import('./modules/exam.js'),
  [ROUTES.LEADERBOARD]: () => import('./modules/leaderboard.js'),
  [ROUTES.ANALYTICS]:   () => import('./modules/analytics.js'),
  [ROUTES.PROFILE]:     () => import('./modules/user.js'),
});

/* ──────────────────────────────────────────────────────────────
   PROTECTED ROUTES  (require login)
   ──────────────────────────────────────────────────────────── */
const PROTECTED_ROUTES = new Set([
  ROUTES.DASHBOARD,
  ROUTES.PRACTICE,
  ROUTES.MOCK,
  ROUTES.EXAM,
  ROUTES.LEADERBOARD,
  ROUTES.ANALYTICS,
  ROUTES.PROFILE,
]);

/* ──────────────────────────────────────────────────────────────
   SHARED COMPONENTS  (loaded once at boot)
   ──────────────────────────────────────────────────────────── */
const COMPONENTS = [
  { mountId: 'navbar-mount',  file: 'components/navbar.html'  },
  { mountId: 'sidebar-mount', file: 'components/sidebar.html' },
  { mountId: 'modal-mount',   file: 'components/modal.html'   },
];

/* ──────────────────────────────────────────────────────────────
   INTERNAL STATE  (module-scoped, never on window)
   ──────────────────────────────────────────────────────────── */
const _internal = {
  currentModule:  null,   // Reference to active page module
  isNavigating:   false,  // Prevent concurrent navigations
  componentCache: {},     // Cache fetched HTML components
  pageCache:      {},     // Cache fetched page HTML
};

/* ================================================================
   1.  initApp()
       Called once on DOMContentLoaded.
       Boots the entire application in sequence.
   ================================================================ */
async function initApp() {
  _log('Booting ExamEdge Pro v' + APP_CONFIG.version + '...');

  try {
    // Step 1 — Restore persisted state (XP, user, theme, etc.)
    hydrateStore();
    _log('State hydrated');

    // Step 2 — Apply saved theme before anything renders
    _applyTheme(store.get('theme') || 'dark');

    // Step 3 — Firebase (only if feature flag is on)
    if (FEATURES.FIREBASE_ENABLED) {
      await initFirebase();
      _log('Firebase initialized');
    }

    // Step 4 — Load shared HTML components into their mount points
    await _loadAllComponents();
    _log('Components mounted');

    // Step 5 — Attach all global event listeners
    attachEvents();
    _log('Events attached');

    // Step 6 — Sync navbar / sidebar with current state
    _syncUI();

    // Step 7 — Navigate to the correct initial route
    const startRoute = _resolveInitialRoute();
    await loadPage(startRoute, { pushState: false });

    // Step 8 — Remove loading screen
    document.body.classList.remove('app-loading');

    _log('Ready ✓');

  } catch (err) {
    _error('Boot failed:', err);
    _renderCrashScreen(err);
  }
}

/* ================================================================
   2.  loadPage(route, options)
       Loads an HTML page + its JS module into #page-outlet.
       Called by the router on every navigation.

       @param {string} route   — One of ROUTES constants
       @param {object} options
         .pushState {boolean}  — Push to browser history (default true)
         .replace   {boolean}  — Replace instead of push
   ================================================================ */
async function loadPage(route, options = {}) {
  const { pushState = true, replace = false } = options;

  // Prevent double navigation
  if (_internal.isNavigating) return;
  _internal.isNavigating = true;

  const prevRoute = store.get('currentRoute');

  try {
    // ── Auth Guard ─────────────────────────────────────────────
    if (PROTECTED_ROUTES.has(route) && !store.get('isAuthenticated')) {
      _log('Auth required → redirecting to login');
      _internal.isNavigating = false;
      await loadPage(ROUTES.LOGIN, { pushState: true });
      return;
    }

    // ── Update Store ───────────────────────────────────────────
    store.set('previousRoute', prevRoute);
    store.set('currentRoute', route);

    // ── Browser History ────────────────────────────────────────
    if (pushState) {
      const historyFn = replace ? 'replaceState' : 'pushState';
      window.history[historyFn]({ route }, '', route);
    }

    // ── Update Sidebar Active Link ─────────────────────────────
    _updateActiveLink(route);

    // ── Show Page Loading Indicator ────────────────────────────
    store.setLoading('page', true);
    _showPageLoader();

    // ── Destroy Previous Module ────────────────────────────────
    if (_internal.currentModule?.destroy) {
      _internal.currentModule.destroy();
    }
    _internal.currentModule = null;

    // ── Fetch Page HTML (with cache) ───────────────────────────
    const html = await _fetchPage(route);

    // ── Inject Into Outlet ─────────────────────────────────────
    const outlet = $('#page-outlet');
    if (!outlet) throw new Error('#page-outlet not found in DOM');

    outlet.innerHTML = html;

    // Trigger enter animation on the page root element
    const pageRoot = outlet.querySelector('[data-page-root]') ||
                     outlet.firstElementChild;
    if (pageRoot) {
      pageRoot.classList.add('page-enter');
    }

    // ── Scroll to Top ──────────────────────────────────────────
    window.scrollTo({ top: 0, behavior: 'instant' });

    // ── Load & Init Page JS Module ─────────────────────────────
    const moduleLoader = PAGE_MODULES[route];
    if (moduleLoader) {
      const mod = await moduleLoader();
      _internal.currentModule = mod;
      if (typeof mod.init === 'function') {
        await mod.init();
      }
    }

    // ── Update Page Title ──────────────────────────────────────
    _updateDocTitle(route);

    _log('Page loaded:', route);

  } catch (err) {
    _error('loadPage failed:', err);
    _renderPageError(route, err);
  } finally {
    store.setLoading('page', false);
    _hidePageLoader();
    _internal.isNavigating = false;
  }
}

/* ================================================================
   3.  attachEvents()
       Registers all global event listeners.
       Called once during initApp(). Never called again.
   ================================================================ */
function attachEvents() {

  // ── Global Click Delegation ──────────────────────────────────
  // Handles all [data-route] link clicks anywhere in the DOM
  document.addEventListener('click', _handleGlobalClick);

  // ── Browser Back / Forward ───────────────────────────────────
  window.addEventListener('popstate', _handlePopState);

  // ── Keyboard Shortcuts ───────────────────────────────────────
  document.addEventListener('keydown', _handleKeydown);

  // ── Theme Toggle ─────────────────────────────────────────────
  // Uses event delegation — theme button may not exist yet
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#theme-toggle, [data-action="toggle-theme"]');
    if (btn) toggleTheme();
  });

  // ── Mobile Sidebar Toggle ────────────────────────────────────
  document.addEventListener('click', function (e) {
    const hamburger = e.target.closest('#hamburger, [data-action="toggle-sidebar"]');
    if (hamburger) _toggleMobileSidebar();
  });

  // ── Sidebar Overlay Click → Close Sidebar ────────────────────
  document.addEventListener('click', function (e) {
    if (e.target.matches('#sidebar-overlay, .sidebar-overlay')) {
      _closeMobileSidebar();
    }
  });

  // ── Sign Out ──────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#btn-signout, [data-action="signout"]');
    if (btn) _handleSignOut();
  });

  // ── Avatar Click → Profile ────────────────────────────────────
  document.addEventListener('click', function (e) {
    const avatar = e.target.closest('#nav-avatar, [data-action="open-profile"]');
    if (avatar) loadPage(ROUTES.PROFILE);
  });

  // ── Modal Close ───────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    if (e.target.matches('.modal-overlay') ||
        e.target.closest('[data-action="close-modal"]')) {
      closeModal();
    }
  });

  // ── Global Search ─────────────────────────────────────────────
  document.addEventListener('input', _handleSearch);

  // ── Online / Offline Detection ───────────────────────────────
  window.addEventListener('online',  () => showToast('Back online!', 'success'));
  window.addEventListener('offline', () => showToast('You are offline. Some features may not work.', 'warn'));

  // ── Store Subscriptions (react to state changes) ─────────────
  store.subscribe('theme', (theme) => _applyTheme(theme));
  store.subscribe('xp',    ()      => _syncXPUI());
  store.subscribe('user',  (user)  => _syncUserUI(user));
  store.subscribe('ui.loading', () => {});
}

/* ================================================================
   ROUTER — INTERNAL HELPERS
   ================================================================ */

/**
 * Handle all clicks on [data-route] elements
 */
function _handleGlobalClick(e) {
  const link = e.target.closest('[data-route]');
  if (!link) return;

  e.preventDefault();

  const route = link.dataset.route;
  if (!route) return;

  // Don't re-navigate to current page
  if (route === store.get('currentRoute')) return;

  loadPage(route);
}

/**
 * Handle browser back/forward buttons
 */
function _handlePopState(e) {
  const route = e.state?.route || _pathToRoute(location.pathname);
  loadPage(route, { pushState: false });
}

/**
 * Global keyboard shortcuts
 */
function _handleKeydown(e) {
  // ESC → close modal
  if (e.key === 'Escape') {
    closeModal();
    _closeMobileSidebar();
  }

  // Alt + D → Dashboard
  if (e.altKey && e.key === 'd') {
    e.preventDefault();
    loadPage(ROUTES.DASHBOARD);
  }

  // Alt + P → Practice
  if (e.altKey && e.key === 'p') {
    e.preventDefault();
    loadPage(ROUTES.PRACTICE);
  }

  // Alt + M → Mock
  if (e.altKey && e.key === 'm') {
    e.preventDefault();
    loadPage(ROUTES.MOCK);
  }
}

/**
 * Resolve which route to start on
 */
function _resolveInitialRoute() {
  const path     = location.pathname;
  const route    = _pathToRoute(path);
  const isAuth   = store.get('isAuthenticated');

  // If not authenticated and route is protected → login
  if (PROTECTED_ROUTES.has(route) && !isAuth) {
    return ROUTES.LOGIN;
  }

  // If already authenticated and trying to open login → dashboard
  if (route === ROUTES.LOGIN && isAuth) {
    return ROUTES.DASHBOARD;
  }

  return route;
}

/**
 * Convert URL pathname to a ROUTE constant
 */
function _pathToRoute(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/';
  const match = Object.values(ROUTES).find(r => r === clean);
  return match || ROUTES.DASHBOARD;
}

/**
 * Update sidebar active link highlighting
 */
function _updateActiveLink(route) {
  document.querySelectorAll('[data-route]').forEach(link => {
    const isActive = link.dataset.route === route;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Update browser tab title
 */
function _updateDocTitle(route) {
  const titles = {
    [ROUTES.DASHBOARD]:   'Dashboard',
    [ROUTES.PRACTICE]:    'Practice',
    [ROUTES.MOCK]:        'Mock Exam',
    [ROUTES.EXAM]:        'Exams',
    [ROUTES.LEADERBOARD]: 'Leaderboard',
    [ROUTES.ANALYTICS]:   'Analytics',
    [ROUTES.PROFILE]:     'Profile',
    [ROUTES.LOGIN]:       'Sign In',
  };
  const pageName = titles[route] || 'ExamEdge Pro';
  document.title = pageName + ' — ExamEdge Pro';
}

/* ================================================================
   COMPONENT LOADER
   ================================================================ */

/**
 * Load all shared HTML components at boot
 */
async function _loadAllComponents() {
  const promises = COMPONENTS.map(({ mountId, file }) =>
    _loadComponent(mountId, file)
  );
  await Promise.allSettled(promises);
}

/**
 * Fetch and inject a single HTML component into its mount point
 * Uses in-memory cache to avoid re-fetching
 *
 * @param {string} mountId    — DOM element id to inject into
 * @param {string} filePath   — Path to the .html component file
 */
async function _loadComponent(mountId, filePath) {
  const mount = document.getElementById(mountId);
  if (!mount) {
    _warn('Mount point not found:', mountId);
    return;
  }

  try {
    // Return cached version if available
    if (_internal.componentCache[filePath]) {
      mount.innerHTML = _internal.componentCache[filePath];
      return;
    }

    const res = await fetch(filePath);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + filePath);

    const html = await res.text();
    _internal.componentCache[filePath] = html; // Cache it
    mount.innerHTML = html;

  } catch (err) {
    _warn('Component load failed:', filePath, err.message);
  }
}

/**
 * Fetch page HTML (with cache)
 * Returns the HTML string for a given route
 */
async function _fetchPage(route) {
  const filePath = PAGE_HTML[route] || PAGE_HTML[ROUTES.DASHBOARD];

  // Return cached HTML if available
  if (_internal.pageCache[filePath]) {
    return _internal.pageCache[filePath];
  }

  const res = await fetch(filePath);

  if (!res.ok) {
    throw new Error('Page fetch failed: ' + res.status + ' ' + filePath);
  }

  const html = await res.text();
  _internal.pageCache[filePath] = html; // Cache it
  return html;
}

/* ================================================================
   THEME
   ================================================================ */

/**
 * Apply a theme to the document root
 * @param {'dark'|'light'} theme
 */
function _applyTheme(theme) {
  const validTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', validTheme);

  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = validTheme === 'dark' ? '#0b0d14' : '#f0f2fa';
  }

  // Update any theme icon in navbar
  const themeEmoji = document.getElementById('theme-emoji');
  if (themeEmoji) {
    themeEmoji.textContent = validTheme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
}

/**
 * Toggle between dark and light theme
 * Exported for use in HTML and other modules
 */
function toggleTheme() {
  const current = store.get('theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  store.set('theme', next); // store subscription calls _applyTheme
  showToast(next === 'light' ? 'Light mode on' : 'Dark mode on', 'info');
}

/* ================================================================
   SIDEBAR
   ================================================================ */

function _toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('mobile-open');
  isOpen ? _closeMobileSidebar() : _openMobileSidebar();
}

function _openMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger');
  sidebar?.classList.add('mobile-open');
  overlay?.classList.add('active');
  hamburger?.setAttribute('aria-expanded', 'true');
  store.set('ui.sidebarOpen', true);
}

function _closeMobileSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger');
  sidebar?.classList.remove('mobile-open');
  overlay?.classList.remove('active');
  hamburger?.setAttribute('aria-expanded', 'false');
  store.set('ui.sidebarOpen', false);
}

/* ================================================================
   MODAL
   ================================================================ */

/**
 * Open the global modal with custom content
 *
 * @param {object} options
 *   .title   {string}   — Modal heading
 *   .body    {string}   — HTML content for modal body
 *   .footer  {string}   — HTML content for modal footer buttons
 *   .size    {string}   — 'sm' | 'md' | 'lg' | 'xl'
 */
function openModal({ title = '', body = '', footer = '', size = 'md' } = {}) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');

  if (!overlay || !box) {
    _warn('Modal mount not found. Was modal.html loaded?');
    return;
  }

  // Set size class
  box.className = 'modal modal--' + size;

  // Inject content safely
  const titleEl  = document.getElementById('modal-title');
  const bodyEl   = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  if (titleEl)  titleEl.innerHTML  = title;
  if (bodyEl)   bodyEl.innerHTML   = body;
  if (footerEl) footerEl.innerHTML = footer;

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  store.set('ui.modalOpen', true);

  // Focus first focusable element for accessibility
  setTimeout(() => {
    const focusable = overlay.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, 50);
}

/**
 * Close the global modal
 */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.style.display = 'none';
  document.body.style.overflow = '';
  store.set('ui.modalOpen', false);
}

/* ================================================================
   AUTH
   ================================================================ */

async function _handleSignOut() {
  openModal({
    title: 'Sign Out',
    body:  '<p class="clr-muted text-sm">Are you sure you want to sign out?</p>',
    footer: `
      <button class="btn btn--ghost" data-action="close-modal">Cancel</button>
      <button class="btn btn--danger" id="confirm-signout">Sign Out</button>
    `,
    size: 'sm',
  });

  // Wait for confirm button to appear then attach listener
  setTimeout(() => {
    document.getElementById('confirm-signout')?.addEventListener('click', async () => {
      closeModal();
      try {
        const { signOut } = await import('./modules/auth.js');
        await signOut();
      } catch (e) {
        // Fallback: clear state manually
        store.replace('user', null);
        store.set('isAuthenticated', false);
        showToast('Signed out', 'info');
        await loadPage(ROUTES.LOGIN);
      }
    });
  }, 60);
}

/* ================================================================
   UI SYNC  — Keeps navbar/sidebar in sync with store
   ================================================================ */

/**
 * Full UI sync — called once after components are mounted
 */
function _syncUI() {
  _syncUserUI(store.get('user'));
  _syncXPUI();
}

/**
 * Sync user avatar and name across navbar/sidebar
 */
function _syncUserUI(user) {
  if (!user) return;

  // Initials for avatar
  const initials = (user.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  document.querySelectorAll('[data-user-avatar]').forEach(el => {
    el.textContent = initials;
  });

  document.querySelectorAll('[data-user-name]').forEach(el => {
    el.textContent = user.name || '';
  });

  document.querySelectorAll('[data-user-email]').forEach(el => {
    el.textContent = user.email || '';
  });
}

/**
 * Sync XP bar, level, and XP count across sidebar/navbar
 */
function _syncXPUI() {
  const xp = store.get('xp');
  if (!xp) return;

  const pct = Math.round(calcProgress(xp.total) * 100);

  // Sidebar XP fill bar
  const fill = document.querySelector('.sidebar__xp-fill, #xp-fill');
  if (fill) fill.style.width = pct + '%';

  // XP text values
  document.querySelectorAll('[data-xp]').forEach(el => {
    el.textContent = xp.total.toLocaleString();
  });

  // Level text values
  document.querySelectorAll('[data-level]').forEach(el => {
    el.textContent = xp.level;
  });
}

/* ================================================================
   SEARCH
   ================================================================ */
let _searchTimer = null;

function _handleSearch(e) {
  const input = e.target.closest('#global-search');
  if (!input) return;

  clearTimeout(_searchTimer);
  const query = input.value.trim();

  if (query.length < 2) return;

  _searchTimer = setTimeout(() => {
    // Future: dispatch to search module
    store.emit('search:query', { query });
    _log('Search query:', query);
  }, 500);
}

/* ================================================================
   PAGE LOADER  (inline spinner, not a full-screen block)
   ================================================================ */
function _showPageLoader() {
  const outlet = $('#page-outlet');
  if (!outlet) return;
  outlet.innerHTML = `
    <div style="
      display:flex; align-items:center; justify-content:center;
      min-height:320px; flex-direction:column; gap:16px;
      color:var(--clr-text-faint); font-size:0.85rem;
    ">
      <div style="
        width:32px; height:32px; border-radius:50%;
        border:2px solid var(--clr-surface-3);
        border-top-color:var(--clr-primary);
        animation:spin 0.7s linear infinite;
      "></div>
      Loading...
    </div>
  `;
}

function _hidePageLoader() {
  // Loader is replaced by page content automatically
  // This is a hook for any overlay loaders if added later
}

/* ================================================================
   ERROR SCREENS
   ================================================================ */

/**
 * Show a full-page error screen when boot fails catastrophically
 */
function _renderCrashScreen(err) {
  document.body.innerHTML = `
    <div style="
      min-height:100vh; display:flex; align-items:center;
      justify-content:center; background:#0b0d14; color:#e8eaf2;
      font-family:sans-serif; text-align:center; padding:24px;
    ">
      <div>
        <div style="font-size:3rem;margin-bottom:16px">&#x26A0;&#xFE0F;</div>
        <h1 style="font-size:1.5rem;margin-bottom:8px">App failed to start</h1>
        <p style="color:#7b82a0;font-size:0.85rem;margin-bottom:24px">
          ${APP_CONFIG.env === 'development' ? err.message : 'Please refresh the page.'}
        </p>
        <button
          onclick="window.location.reload()"
          style="
            background:#4f8cff;color:#fff;border:none;
            padding:10px 24px;border-radius:10px;
            font-size:0.9rem;cursor:pointer;
          "
        >Refresh Page</button>
      </div>
    </div>
  `;
}

/**
 * Show an error inside the page outlet when a page fails to load
 */
function _renderPageError(route, err) {
  const outlet = $('#page-outlet');
  if (!outlet) return;

  outlet.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">&#x1F4C4;</div>
      <div class="empty-state__title">Page Could Not Load</div>
      <div class="empty-state__desc">
        ${APP_CONFIG.env === 'development'
          ? '<code style="font-size:0.75rem;color:var(--clr-danger)">' + err.message + '</code>'
          : 'Something went wrong. Please try again.'}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn--primary" onclick="window.EE.loadPage('${route}')">
          Retry
        </button>
        <button class="btn btn--secondary" onclick="window.EE.loadPage('/')">
          Go to Dashboard
        </button>
      </div>
    </div>
  `;
}

/* ================================================================
   LOGGING  (only in development)
   ================================================================ */
function _log(...args) {
  if (APP_CONFIG.env === 'development') {
    console.log('%c[ExamEdge]', 'color:#4f8cff;font-weight:600', ...args);
  }
}

function _warn(...args) {
  if (APP_CONFIG.env === 'development') {
    console.warn('%c[ExamEdge]', 'color:#fb923c;font-weight:600', ...args);
  }
}

function _error(...args) {
  console.error('%c[ExamEdge]', 'color:#f87171;font-weight:600', ...args);
}

/* ================================================================
   PUBLIC API
   Expose minimal surface on window.EE — used only for
   HTML onclick attributes. All other code imports directly.
   ================================================================ */
window.EE = Object.freeze({
  loadPage,
  toggleTheme,
  openModal,
  closeModal,
});

// Legacy aliases (backward compatibility with existing HTML files)
window.navigate    = (route) => loadPage(route);
window.toggleTheme = toggleTheme;
window.openModal   = openModal;
window.closeModal  = closeModal;

/* ================================================================
   BOOT — Entry Point
   ================================================================ */
document.addEventListener('DOMContentLoaded', initApp);

/* ================================================================
   EXPORTS  (for other modules that import app.js directly)
   ================================================================ */
export {
  initApp,
  loadPage,
  attachEvents,
  toggleTheme,
  openModal,
  closeModal,
};

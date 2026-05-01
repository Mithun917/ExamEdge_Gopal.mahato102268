/**
 * ================================================================
 *  ExamEdge Pro — js/componentLoader.js
 *  Component Loader System
 * ================================================================
 *
 *  Responsibilities:
 *    - Dynamically fetch HTML components (navbar, sidebar, modal)
 *    - Inject them into mount points in the DOM
 *    - Cache fetched HTML to avoid redundant network requests
 *    - Run init scripts after a component is injected
 *    - Handle errors gracefully with fallback UI
 *
 *  Core API:
 *    loadComponent(id, filePath, options?)  → load one component
 *    loadAll(componentMap)                  → load many at once
 *    unloadComponent(id)                    → clear a mount point
 *    reloadComponent(id, filePath)          → force re-fetch
 *    isLoaded(id)                           → check if loaded
 *    clearCache()                           → clear HTML cache
 *
 *  Rules:
 *    - NO global state — internal cache is module-scoped
 *    - NO framework dependency — pure Vanilla JS
 *    - NO DOM manipulation beyond mount point injection
 *    - Clean separation: this file only handles loading
 *
 *  Usage:
 *    import { loadComponent, loadAll } from './componentLoader.js';
 *
 *    // Load one component
 *    await loadComponent('navbar-mount', 'components/navbar.html');
 *
 *    // Load all at boot
 *    await loadAll({
 *      'navbar-mount':  'components/navbar.html',
 *      'sidebar-mount': 'components/sidebar.html',
 *      'modal-mount':   'components/modal.html',
 *    });
 *
 * ================================================================
 */

'use strict';

/* ================================================================
   INTERNAL CACHE
   Module-scoped — never on window. Survives page navigations
   within the SPA but cleared on full page reload.
   ================================================================ */

/** @type {Map<string, string>} filePath → HTML string */
var _htmlCache = new Map();

/** @type {Set<string>} mount IDs that are currently loaded */
var _loadedComponents = new Set();

/** @type {Map<string, Function[]>} mountId → array of callbacks */
var _onLoadCallbacks = new Map();

/** @type {boolean} — suppress non-critical warnings */
var _silent = false;

/* ================================================================
   DEFAULT COMPONENTS MAP
   Change paths here if your folder structure changes.
   ================================================================ */
export var DEFAULT_COMPONENTS = Object.freeze({
  'navbar-mount':  'components/navbar.html',
  'sidebar-mount': 'components/sidebar.html',
  'modal-mount':   'components/modal.html',
});

/* ================================================================
   loadComponent(id, filePath, options?)
   ================================================================
   Load a single HTML component and inject it into a mount point.

   @param {string} id          — The DOM element id to inject into
                                 e.g. 'navbar-mount'
   @param {string} filePath    — Path to the .html file
                                 e.g. 'components/navbar.html'
   @param {object} [options]
     .cache     {boolean}  — Use cache (default true)
     .append    {boolean}  — Append instead of replace (default false)
     .onLoad    {function} — Callback after injection
     .fallback  {string}   — HTML to show if fetch fails
     .timeout   {number}   — Fetch timeout in ms (default 8000)

   @returns {Promise<boolean>}  — true if successful

   Examples:
     await loadComponent('navbar-mount', 'components/navbar.html');

     await loadComponent('sidebar-mount', 'components/sidebar.html', {
       onLoad: () => highlightActiveLink(),
     });

     await loadComponent('ad-banner', 'components/banner.html', {
       append:   true,
       cache:    false,
       fallback: '<p>Could not load banner.</p>',
     });
   ================================================================ */
export async function loadComponent(id, filePath, options) {
  options = options || {};

  var useCache   = options.cache    !== false;   // default true
  var doAppend   = options.append   === true;    // default false
  var onLoad     = options.onLoad   || null;
  var fallbackHTML = options.fallback || null;
  var fetchTimeout = options.timeout || 8000;

  /* ── Step 1: Find the mount point ───────────────────────────── */
  var mount = document.getElementById(id);

  if (!mount) {
    _warn('loadComponent: mount point not found → #' + id);
    return false;
  }

  /* ── Step 2: Show loading placeholder ───────────────────────── */
  if (!doAppend) {
    mount.innerHTML = _buildLoadingPlaceholder(id);
  }

  /* ── Step 3: Fetch HTML (use cache if available) ─────────────── */
  var html;

  try {
    html = await _fetchHTML(filePath, useCache, fetchTimeout);
  } catch (err) {
    _warn('loadComponent: fetch failed for', filePath, '—', err.message);

    // Show fallback or error state
    mount.innerHTML = fallbackHTML || _buildErrorPlaceholder(id, filePath, err.message);
    return false;
  }

  /* ── Step 4: Inject HTML into mount point ────────────────────── */
  if (doAppend) {
    mount.insertAdjacentHTML('beforeend', html);
  } else {
    mount.innerHTML = html;
  }

  /* ── Step 5: Mark as loaded ──────────────────────────────────── */
  _loadedComponents.add(id);
  mount.setAttribute('data-component-loaded', filePath);
  mount.setAttribute('data-component-id', id);

  /* ── Step 6: Run any registered onLoad callbacks ─────────────── */
  _runCallbacks(id);

  /* ── Step 7: Run user-provided onLoad ────────────────────────── */
  if (typeof onLoad === 'function') {
    try {
      onLoad(mount, html);
    } catch (e) {
      _warn('loadComponent: onLoad callback threw for #' + id, e);
    }
  }

  /* ── Step 8: Dispatch custom DOM event ───────────────────────── */
  _dispatchEvent(mount, 'component:loaded', { id: id, filePath: filePath });

  _log('Loaded:', filePath, '→ #' + id);
  return true;
}

/* ================================================================
   loadAll(componentMap, options?)
   ================================================================
   Load multiple components simultaneously.
   Continues loading other components even if one fails.

   @param {object} componentMap  — { mountId: filePath, ... }
   @param {object} [options]     — Same as loadComponent options
                                   (applied to all components)
   @returns {Promise<object>}    — { success: string[], failed: string[] }

   Example:
     const result = await loadAll({
       'navbar-mount':  'components/navbar.html',
       'sidebar-mount': 'components/sidebar.html',
       'modal-mount':   'components/modal.html',
     });
     console.log(result.success); // ['navbar-mount', 'sidebar-mount', ...]
     console.log(result.failed);  // [] (hopefully)
   ================================================================ */
export async function loadAll(componentMap, options) {
  options = options || {};

  if (!componentMap || typeof componentMap !== 'object') {
    _warn('loadAll: componentMap must be an object');
    return { success: [], failed: [] };
  }

  var entries  = Object.entries(componentMap);
  var success  = [];
  var failed   = [];

  /* Load all in parallel */
  var results = await Promise.allSettled(
    entries.map(function (entry) {
      var mountId  = entry[0];
      var filePath = entry[1];
      return loadComponent(mountId, filePath, options)
        .then(function (ok) {
          return { mountId: mountId, ok: ok };
        });
    })
  );

  results.forEach(function (result, i) {
    var mountId = entries[i][0];
    if (result.status === 'fulfilled' && result.value.ok) {
      success.push(mountId);
    } else {
      failed.push(mountId);
    }
  });

  _log(
    'loadAll complete —',
    success.length + ' loaded,',
    failed.length  + ' failed'
  );

  return { success: success, failed: failed };
}

/* ================================================================
   loadDefaults()
   ================================================================
   Load the standard app components (navbar, sidebar, modal).
   Shorthand for calling loadAll with DEFAULT_COMPONENTS.

   @param {object} [options]  — Same as loadComponent options
   @returns {Promise<object>} — { success, failed }

   Example:
     await loadDefaults();
     // Loads navbar, sidebar, modal automatically
   ================================================================ */
export async function loadDefaults(options) {
  return loadAll(DEFAULT_COMPONENTS, options);
}

/* ================================================================
   unloadComponent(id)
   ================================================================
   Clear a mount point and mark it as unloaded.

   @param {string} id  — Mount point element id
   @returns {boolean}

   Example:
     unloadComponent('ad-banner');
   ================================================================ */
export function unloadComponent(id) {
  var mount = document.getElementById(id);
  if (!mount) {
    _warn('unloadComponent: #' + id + ' not found');
    return false;
  }

  mount.innerHTML = '';
  mount.removeAttribute('data-component-loaded');
  mount.removeAttribute('data-component-id');
  _loadedComponents.delete(id);

  _dispatchEvent(mount, 'component:unloaded', { id: id });
  _log('Unloaded: #' + id);
  return true;
}

/* ================================================================
   reloadComponent(id, filePath, options?)
   ================================================================
   Force re-fetch a component, bypassing cache.
   Useful for hot-reload or language switching.

   @param {string} id
   @param {string} filePath
   @param {object} [options]
   @returns {Promise<boolean>}

   Example:
     await reloadComponent('navbar-mount', 'components/navbar.html');
   ================================================================ */
export async function reloadComponent(id, filePath, options) {
  options = options || {};

  // Delete from cache so it fetches fresh
  _htmlCache.delete(filePath);

  // Force cache: false for this call
  options.cache = false;

  return loadComponent(id, filePath, options);
}

/* ================================================================
   isLoaded(id)
   ================================================================
   Check if a component has been successfully loaded.

   @param {string} id
   @returns {boolean}

   Example:
     if (!isLoaded('sidebar-mount')) {
       await loadComponent('sidebar-mount', 'components/sidebar.html');
     }
   ================================================================ */
export function isLoaded(id) {
  return _loadedComponents.has(id);
}

/* ================================================================
   onComponentLoad(id, callback)
   ================================================================
   Register a callback to run when a specific component loads.
   If already loaded, callback fires immediately.

   @param {string}   id
   @param {function} callback

   Example:
     onComponentLoad('sidebar-mount', () => {
       highlightActiveLink('/dashboard');
     });
   ================================================================ */
export function onComponentLoad(id, callback) {
  if (typeof callback !== 'function') return;

  // Already loaded — fire immediately
  if (_loadedComponents.has(id)) {
    try { callback(); } catch (e) {}
    return;
  }

  // Queue for when it loads
  if (!_onLoadCallbacks.has(id)) {
    _onLoadCallbacks.set(id, []);
  }
  _onLoadCallbacks.get(id).push(callback);
}

/* ================================================================
   getLoadedComponents()
   ================================================================
   Get a list of all currently loaded component mount IDs.

   @returns {string[]}

   Example:
     getLoadedComponents() → ['navbar-mount', 'sidebar-mount']
   ================================================================ */
export function getLoadedComponents() {
  return Array.from(_loadedComponents);
}

/* ================================================================
   clearCache(filePath?)
   ================================================================
   Clear the HTML cache. Pass a filePath to clear one entry,
   or call with no argument to clear everything.

   @param {string} [filePath]

   Examples:
     clearCache();                          // clear all
     clearCache('components/navbar.html'); // clear one
   ================================================================ */
export function clearCache(filePath) {
  if (filePath) {
    _htmlCache.delete(filePath);
    _log('Cache cleared for:', filePath);
  } else {
    _htmlCache.clear();
    _log('Full cache cleared');
  }
}

/* ================================================================
   getCacheStats()
   ================================================================
   Returns debug info about the current cache state.

   @returns {object}

   Example:
     getCacheStats()
     → { size: 3, entries: ['components/navbar.html', ...] }
   ================================================================ */
export function getCacheStats() {
  return {
    size:    _htmlCache.size,
    entries: Array.from(_htmlCache.keys()),
    loaded:  Array.from(_loadedComponents),
  };
}

/* ================================================================
   setSilent(bool)
   ================================================================
   Suppress non-critical warning logs (useful in production).

   @param {boolean} bool
   ================================================================ */
export function setSilent(bool) {
  _silent = !!bool;
}

/* ================================================================
   PRIVATE HELPERS
   ================================================================ */

/**
 * _fetchHTML(filePath, useCache, timeoutMs)
 * Fetch an HTML file as text. Caches the result.
 *
 * @param {string}  filePath
 * @param {boolean} useCache
 * @param {number}  timeoutMs
 * @returns {Promise<string>}
 */
async function _fetchHTML(filePath, useCache, timeoutMs) {

  /* Return cached version if available */
  if (useCache && _htmlCache.has(filePath)) {
    _log('Cache hit:', filePath);
    return _htmlCache.get(filePath);
  }

  /* Race the fetch against a timeout */
  var controller = new AbortController();
  var timer      = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  var res;
  try {
    res = await fetch(filePath, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error('HTTP ' + res.status + ' — ' + filePath);
  }

  var html = await res.text();

  /* Store in cache */
  if (useCache) {
    _htmlCache.set(filePath, html);
  }

  return html;
}

/**
 * _runCallbacks(id)
 * Fire all registered onLoad callbacks for a given mount id.
 */
function _runCallbacks(id) {
  var callbacks = _onLoadCallbacks.get(id);
  if (!callbacks || callbacks.length === 0) return;

  callbacks.forEach(function (fn) {
    try { fn(); } catch (e) {
      _warn('onComponentLoad callback threw for #' + id, e);
    }
  });

  _onLoadCallbacks.delete(id); // Run once then clear
}

/**
 * _dispatchEvent(el, eventName, detail)
 * Dispatch a CustomEvent on a DOM element.
 */
function _dispatchEvent(el, eventName, detail) {
  try {
    el.dispatchEvent(new CustomEvent(eventName, {
      bubbles:  true,
      detail:   detail,
    }));
  } catch (e) {}
}

/**
 * _buildLoadingPlaceholder(id)
 * Returns a skeleton/spinner HTML string shown while fetching.
 */
function _buildLoadingPlaceholder(id) {
  var isNavbar  = id === 'navbar-mount';
  var isSidebar = id === 'sidebar-mount';

  if (isNavbar) {
    return '<div style="height:60px;background:var(--clr-surface,#12151f);border-bottom:1px solid var(--clr-border,rgba(255,255,255,0.07))"></div>';
  }

  if (isSidebar) {
    return '<div style="width:240px;height:100%;background:var(--clr-surface,#12151f);border-right:1px solid var(--clr-border,rgba(255,255,255,0.07))"></div>';
  }

  return ''; // No placeholder for unknown mounts
}

/**
 * _buildErrorPlaceholder(id, filePath, errMsg)
 * Returns a minimal error UI string when a component fails to load.
 */
function _buildErrorPlaceholder(id, filePath, errMsg) {
  return [
    '<div style="padding:12px 16px;background:rgba(248,113,113,0.08);',
    'border:1px solid rgba(248,113,113,0.25);border-radius:8px;',
    'font-size:0.78rem;color:#f87171;font-family:monospace">',
    '<strong>Component failed to load</strong><br>',
    'Mount: #' + _escapeStr(id) + '<br>',
    'File: ' + _escapeStr(filePath) + '<br>',
    '<span style="opacity:0.7">' + _escapeStr(errMsg) + '</span>',
    '</div>',
  ].join('');
}

/**
 * _escapeStr(str)
 * Safely escape a string for use in HTML error messages.
 */
function _escapeStr(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

/**
 * _log / _warn — Internal logger
 */
function _log() {
  if (typeof console !== 'undefined') {
    var args = ['%c[Loader]', 'color:#4f8cff;font-weight:600'];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }
}

function _warn() {
  if (_silent) return;
  if (typeof console !== 'undefined') {
    var args = ['%c[Loader]', 'color:#fb923c;font-weight:600'];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.warn.apply(console, args);
  }
}

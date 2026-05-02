/**
 * ================================================================
 *  ExamEdge Pro — js/firebase.js
 *  Firebase Initialization — Modular v9+ Syntax
 * ================================================================
 *
 *  What this file does:
 *    1. Reads Firebase config from window.__ENV__ (set by env.js)
 *    2. Initializes the Firebase app (only once — singleton)
 *    3. Connects Firestore database  → exports: db
 *    4. Connects Authentication      → exports: auth
 *    5. Exports all helper functions
 *
 *  Exported instances:
 *    db    — Firestore database instance
 *    auth  — Firebase Auth instance
 *
 *  Firebase version: 10.12.2 (modular v9+ syntax)
 *  SDK loaded from:  https://www.gstatic.com/firebasejs/
 *  Keys loaded from: js/env.js → window.__ENV__
 *
 *  Example config placeholder (real keys are in env.js):
 *
 *    const firebaseConfig = {
 *      apiKey:            "AIzaSy...",
 *      authDomain:        "your-project.firebaseapp.com",
 *      projectId:         "your-project",
 *      storageBucket:     "your-project.firebasestorage.app",
 *      messagingSenderId: "123456789",
 *      appId:             "1:123:web:abc"
 *    };
 *
 * ================================================================
 */

'use strict';

/* ================================================================
   CDN URLs  —  Firebase v10.12.2 modular/esm builds
   ================================================================ */
var FB_CDN = 'https://www.gstatic.com/firebasejs/10.12.2';

var SDK = {
  APP:       FB_CDN + '/firebase-app.js',
  AUTH:      FB_CDN + '/firebase-auth.js',
  FIRESTORE: FB_CDN + '/firebase-firestore.js',
};

/* ================================================================
   SINGLETON INSTANCES
   Module-scoped — initialized once, reused everywhere.
   No duplicate initialization possible.
   ================================================================ */
var _app         = null;
var _db          = null;
var _auth        = null;
var _initialized = false;

/* ================================================================
   EXPORTED INSTANCES
   These are the main exports — use in any module after init.

   Usage:
     import { db, auth } from './firebase.js';
   ================================================================ */
export var db   = null;
export var auth = null;

/* ================================================================
   initFirebase()
   ================================================================
   Boot function. Call ONCE in app.js → initApp().
   Loads Firebase SDK from CDN, initializes app, db, auth.
   Safe to call multiple times — runs only once (singleton guard).

   @returns {Promise<{ app, db, auth }>}

   Usage in app.js:
     import { initFirebase } from './firebase.js';
     await initFirebase();
   ================================================================ */
export async function initFirebase() {

  /* Guard: already done */
  if (_initialized) {
    console.info('%c[Firebase] Already initialized — skipping',
      'color:#7b82a0');
    return { app: _app, db: _db, auth: _auth };
  }

  /* Read config from env.js */
  var config = _readConfig();

  /* Guard: config missing */
  if (!config.apiKey || !config.projectId) {
    console.warn(
      '%c[Firebase] Config missing!%c\n' +
      'Make sure js/env.js is loaded before app.js in index.html.',
      'color:#fb923c;font-weight:600', 'color:#7b82a0'
    );
    return { app: null, db: null, auth: null };
  }

  try {

    /* ── Step 1: Firebase App ──────────────────────────────────── */
    var appMod = await import(SDK.APP);

    /*
     * getApps() check prevents:
     * "Firebase App named '[DEFAULT]' already exists" error
     * on hot-reload or accidental double init.
     */
    _app = appMod.getApps().length > 0
      ? appMod.getApps()[0]
      : appMod.initializeApp(config);

    console.log('%c[Firebase] App ready — Project: ' + config.projectId,
      'color:#4f8cff;font-weight:600');

    /* ── Step 2: Firestore Database ───────────────────────────── */
    var dbMod = await import(SDK.FIRESTORE);
    _db = dbMod.getFirestore(_app);

    /* Update the exported variable */
    db = _db;

    console.log('%c[Firebase] Firestore connected',
      'color:#4f8cff;font-weight:600');

    /* ── Step 3: Authentication ───────────────────────────────── */
    var authMod = await import(SDK.AUTH);
    _auth = authMod.getAuth(_app);

    /* Update the exported variable */
    auth = _auth;

    console.log('%c[Firebase] Auth connected',
      'color:#4f8cff;font-weight:600');

    /* ── Step 4: Done ─────────────────────────────────────────── */
    _initialized = true;

    console.log(
      '%c[Firebase] All services ready',
      'color:#34d399;font-weight:600'
    );

    return { app: _app, db: _db, auth: _auth };

  } catch (err) {
    console.error('%c[Firebase] Init failed:',
      'color:#f87171;font-weight:600', err.message);
    throw new Error('[Firebase] ' + err.message);
  }
}

/* ================================================================
   GETTERS
   Use when you need the instance directly in a module.
   Always call after initFirebase() has resolved.
   ================================================================ */

/** Returns Firestore instance. Throws if not initialized. */
export function getDB() {
  if (!_db) throw new Error('[Firebase] Firestore not ready. Call initFirebase() first.');
  return _db;
}

/** Returns Auth instance. Throws if not initialized. */
export function getAuthInstance() {
  if (!_auth) throw new Error('[Firebase] Auth not ready. Call initFirebase() first.');
  return _auth;
}

/** Returns true if Firebase is initialized and ready. */
export function isReady() {
  return _initialized;
}

/* ================================================================
   AUTH FUNCTIONS
   Modular v9+ wrappers — clean one-line calls in other modules
   ================================================================ */

/**
 * loginWithEmail(email, password)
 * Sign in existing user with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 *
 * Example:
 *   const { user } = await loginWithEmail('aryan@ex.com', 'pass123');
 *   console.log(user.uid);
 */
export async function loginWithEmail(email, password) {
  var { signInWithEmailAndPassword } = await import(SDK.AUTH);
  return signInWithEmailAndPassword(_auth, email, password);
}

/**
 * registerWithEmail(email, password)
 * Create a new user account.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 *
 * Example:
 *   const { user } = await registerWithEmail('aryan@ex.com', 'pass123');
 *   console.log(user.uid);
 */
export async function registerWithEmail(email, password) {
  var { createUserWithEmailAndPassword } = await import(SDK.AUTH);
  return createUserWithEmailAndPassword(_auth, email, password);
}

/**
 * loginWithGoogle()
 * Sign in with Google popup.
 *
 * @returns {Promise<UserCredential>}
 *
 * Example:
 *   const { user } = await loginWithGoogle();
 *   console.log(user.displayName);
 */
export async function loginWithGoogle() {
  var { GoogleAuthProvider, signInWithPopup } = await import(SDK.AUTH);
  var provider = new GoogleAuthProvider();
  return signInWithPopup(_auth, provider);
}

/**
 * logoutUser()
 * Sign out current user.
 *
 * @returns {Promise<void>}
 *
 * Example:
 *   await logoutUser();
 */
export async function logoutUser() {
  var { signOut } = await import(SDK.AUTH);
  return signOut(_auth);
}

/**
 * onAuthChange(callback)
 * Listen for login / logout events.
 * Returns unsubscribe function — call it on cleanup.
 *
 * @param {function} callback  (user | null) => void
 * @returns {function}         unsubscribe
 *
 * Example:
 *   const unsub = onAuthChange((user) => {
 *     if (user) store.updateUser({ uid: user.uid, email: user.email });
 *     else      store.updateUser(null);
 *   });
 *   unsub(); // when done
 */
export function onAuthChange(callback) {
  if (!_auth) {
    console.warn('[Firebase] onAuthChange: auth not ready');
    return function() {};
  }
  var _unsub = function() {};
  import(SDK.AUTH).then(function(mod) {
    _unsub = mod.onAuthStateChanged(_auth, callback);
  });
  return function() { _unsub(); };
}

/**
 * getCurrentUser()
 * Get the currently signed-in user synchronously.
 *
 * @returns {User | null}
 *
 * Example:
 *   const user = getCurrentUser();
 *   if (user) console.log(user.email);
 */
export function getCurrentUser() {
  return _auth ? _auth.currentUser : null;
}

/**
 * updateUserProfile(displayName, photoURL?)
 * Update current user's display name and photo.
 *
 * @param {string} displayName
 * @param {string} [photoURL]
 * @returns {Promise<void>}
 *
 * Example:
 *   await updateUserProfile('Aryan Sharma');
 */
export async function updateUserProfile(displayName, photoURL) {
  var { updateProfile } = await import(SDK.AUTH);
  return updateProfile(_auth.currentUser, {
    displayName: displayName,
    photoURL: photoURL || null,
  });
}

/**
 * sendResetEmail(email)
 * Send password reset email to user.
 *
 * @param {string} email
 * @returns {Promise<void>}
 *
 * Example:
 *   await sendResetEmail('aryan@ex.com');
 */
export async function sendResetEmail(email) {
  var { sendPasswordResetEmail } = await import(SDK.AUTH);
  return sendPasswordResetEmail(_auth, email);
}

/* ================================================================
   FIRESTORE FUNCTIONS
   Short named (fs + action) for clean usage across modules
   ================================================================ */

/**
 * fsGet(collection, docId)
 * Read a single document.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<object | null>}
 *
 * Example:
 *   const user = await fsGet('users', uid);
 *   console.log(user.name, user.xp);
 */
export async function fsGet(collectionName, docId) {
  var mod  = await import(SDK.FIRESTORE);
  var ref  = mod.doc(_db, collectionName, docId);
  var snap = await mod.getDoc(ref);
  if (!snap.exists()) return null;
  return Object.assign({ id: snap.id }, snap.data());
}

/**
 * fsSet(collection, docId, data)
 * Create or merge a document.
 * If document exists: merges new fields.
 * If document missing: creates it.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<void>}
 *
 * Example:
 *   await fsSet('users', uid, { name: 'Aryan', xp: 0 });
 */
export async function fsSet(collectionName, docId, data) {
  var mod = await import(SDK.FIRESTORE);
  var ref = mod.doc(_db, collectionName, docId);
  return mod.setDoc(ref,
    Object.assign({}, data, { updatedAt: mod.serverTimestamp() }),
    { merge: true }
  );
}

/**
 * fsUpdate(collection, docId, data)
 * Update specific fields in existing document.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data   Only the fields to change
 * @returns {Promise<void>}
 *
 * Example:
 *   await fsUpdate('users', uid, { xp: 1500, level: 3 });
 */
export async function fsUpdate(collectionName, docId, data) {
  var mod = await import(SDK.FIRESTORE);
  var ref = mod.doc(_db, collectionName, docId);
  return mod.updateDoc(ref,
    Object.assign({}, data, { updatedAt: mod.serverTimestamp() })
  );
}

/**
 * fsDelete(collection, docId)
 * Permanently delete a document.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 *
 * Example:
 *   await fsDelete('sessions', sessionId);
 */
export async function fsDelete(collectionName, docId) {
  var mod = await import(SDK.FIRESTORE);
  var ref = mod.doc(_db, collectionName, docId);
  return mod.deleteDoc(ref);
}

/**
 * fsAdd(collection, data)
 * Add new document with auto-generated ID.
 *
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<string>}  The new document's auto ID
 *
 * Example:
 *   const id = await fsAdd('sessions', {
 *     userId: uid, score: 80, topic: 'Maths'
 *   });
 */
export async function fsAdd(collectionName, data) {
  var mod = await import(SDK.FIRESTORE);
  var col = mod.collection(_db, collectionName);
  var ref = await mod.addDoc(col,
    Object.assign({}, data, { createdAt: mod.serverTimestamp() })
  );
  return ref.id;
}

/**
 * fsQuery(collection, ...constraints)
 * Query a collection with filters, ordering, limits.
 *
 * @param {string}    collectionName
 * @param {...object} constraints     Firestore query constraints
 * @returns {Promise<object[]>}
 *
 * Example:
 *   const helpers = await getQueryHelpers();
 *   const leaders = await fsQuery(
 *     'leaderboard',
 *     helpers.orderBy('xp', 'desc'),
 *     helpers.limit(50)
 *   );
 */
export async function fsQuery(collectionName) {
  var constraints = Array.prototype.slice.call(arguments, 1);
  var mod  = await import(SDK.FIRESTORE);
  var col  = mod.collection(_db, collectionName);
  var q    = mod.query.apply(null, [col].concat(constraints));
  var snap = await mod.getDocs(q);
  return snap.docs.map(function(d) {
    return Object.assign({ id: d.id }, d.data());
  });
}

/**
 * fsListen(collection, docId, callback)
 * Real-time listener on one document.
 * Fires callback every time the document changes.
 *
 * @param {string}   collectionName
 * @param {string}   docId
 * @param {function} callback   (data | null) => void
 * @returns {function}          unsubscribe
 *
 * Example:
 *   const unsub = fsListen('users', uid, (data) => {
 *     if (data) store.setState('xp', data.xp);
 *   });
 *   unsub(); // stop when done
 */
export function fsListen(collectionName, docId, callback) {
  if (!_db) { console.warn('[Firebase] fsListen: db not ready'); return function(){}; }
  var _unsub = function(){};
  import(SDK.FIRESTORE).then(function(mod) {
    var ref = mod.doc(_db, collectionName, docId);
    _unsub = mod.onSnapshot(ref,
      function(snap) {
        callback(snap.exists()
          ? Object.assign({ id: snap.id }, snap.data())
          : null);
      },
      function(err) { console.error('[Firebase] fsListen error:', err.message); }
    );
  });
  return function() { _unsub(); };
}

/**
 * fsListenQuery(collection, constraints, callback)
 * Real-time listener on a collection query.
 *
 * @param {string}   collectionName
 * @param {object[]} constraints
 * @param {function} callback   (docs[]) => void
 * @returns {function}          unsubscribe
 *
 * Example:
 *   const helpers = await getQueryHelpers();
 *   const unsub = fsListenQuery(
 *     'leaderboard',
 *     [helpers.orderBy('xp', 'desc'), helpers.limit(10)],
 *     (docs) => renderLeaderboard(docs)
 *   );
 */
export function fsListenQuery(collectionName, constraints, callback) {
  if (!_db) { console.warn('[Firebase] fsListenQuery: db not ready'); return function(){}; }
  var _unsub = function(){};
  import(SDK.FIRESTORE).then(function(mod) {
    var col = mod.collection(_db, collectionName);
    var q   = mod.query.apply(null, [col].concat(constraints || []));
    _unsub  = mod.onSnapshot(q,
      function(snap) {
        callback(snap.docs.map(function(d) {
          return Object.assign({ id: d.id }, d.data());
        }));
      },
      function(err) { console.error('[Firebase] fsListenQuery error:', err.message); }
    );
  });
  return function() { _unsub(); };
}

/* ================================================================
   QUERY HELPERS
   Get Firestore constraint builders for use with fsQuery
   ================================================================ */

/**
 * getQueryHelpers()
 * Returns where, orderBy, limit, increment etc.
 *
 * @returns {Promise<object>}
 *
 * Example:
 *   const { where, orderBy, limit } = await getQueryHelpers();
 *   const docs = await fsQuery('users',
 *     where('level', '>=', 3),
 *     orderBy('xp', 'desc'),
 *     limit(20)
 *   );
 */
export async function getQueryHelpers() {
  var mod = await import(SDK.FIRESTORE);
  return {
    where:           mod.where,
    orderBy:         mod.orderBy,
    limit:           mod.limit,
    startAfter:      mod.startAfter,
    endBefore:       mod.endBefore,
    serverTimestamp: mod.serverTimestamp,
    increment:       mod.increment,
    arrayUnion:      mod.arrayUnion,
    arrayRemove:     mod.arrayRemove,
    Timestamp:       mod.Timestamp,
  };
}

/* ================================================================
   PRIVATE HELPERS
   ================================================================ */

/**
 * _readConfig()
 * Read Firebase config from window.__ENV__ (loaded by env.js).
 */
function _readConfig() {
  var env = (typeof window !== 'undefined' && window.__ENV__)
    ? window.__ENV__
    : {};
  return {
    apiKey:            env.FIREBASE_API_KEY             || '',
    authDomain:        env.FIREBASE_AUTH_DOMAIN         || '',
    projectId:         env.FIREBASE_PROJECT_ID          || '',
    storageBucket:     env.FIREBASE_STORAGE_BUCKET      || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             env.FIREBASE_APP_ID              || '',
    measurementId:     env.FIREBASE_MEASUREMENT_ID      || '',
  };
}

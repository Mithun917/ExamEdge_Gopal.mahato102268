/**
 * ================================================================
 *  ExamEdge Pro — js/firebase.js
 *  Firebase SDK Integration
 * ================================================================
 *
 *  Project:  ExamEdge Pro
 *  Firebase: examedge-pro
 *
 *  Services used:
 *    - Firebase Auth   (Email/Password + Google)
 *    - Firestore DB    (User data, scores, leaderboard)
 *
 *  Keys load from: js/env.js → window.__ENV__
 *  Config reads from: js/config.js → FIREBASE_CONFIG
 *
 *  How to enable:
 *    config.js → FEATURES.FIREBASE_ENABLED = true  ✅ (done)
 *
 * ================================================================
 */

'use strict';

import { FIREBASE_CONFIG, FEATURES } from './config.js';

/* ================================================================
   FIREBASE INSTANCES
   Module-scoped — never on window
   ================================================================ */
var _app  = null;   // FirebaseApp instance
var _auth = null;   // Auth instance
var _db   = null;   // Firestore instance

/* ================================================================
   initFirebase()
   ================================================================
   Initialize Firebase SDK. Called once in app.js → initApp().
   Loads SDK from Google CDN using dynamic import.

   @returns {Promise<void>}
   ================================================================ */
export async function initFirebase() {
  if (!FEATURES.FIREBASE_ENABLED) {
    console.info('%c[Firebase] Disabled via feature flag', 'color:#7b82a0');
    return;
  }

  // Already initialized — skip
  if (_app) {
    console.info('%c[Firebase] Already initialized', 'color:#7b82a0');
    return;
  }

  try {
    // Load Firebase SDK from CDN
    var appModule  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    var authModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    var dbModule   = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    // Initialize app
    _app  = appModule.initializeApp(FIREBASE_CONFIG);
    _auth = authModule.getAuth(_app);
    _db   = dbModule.getFirestore(_app);

    console.info(
      '%c[Firebase] Connected ✓%c Project: examedge-pro',
      'color:#34d399;font-weight:600',
      'color:#7b82a0'
    );

  } catch (err) {
    console.error('%c[Firebase] Init failed:', 'color:#f87171;font-weight:600', err);
    throw err;
  }
}

/* ================================================================
   GETTERS
   Use these in other modules to access Firebase instances
   ================================================================ */

/** @returns {import('firebase/app').FirebaseApp|null} */
export function getApp()  { return _app; }

/** @returns {import('firebase/auth').Auth|null} */
export function getAuth() { return _auth; }

/** @returns {import('firebase/firestore').Firestore|null} */
export function getDB()   { return _db; }

/* ================================================================
   AUTH FUNCTIONS
   ================================================================ */

/**
 * signInWithEmail(email, password)
 * Sign in with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Firebase UserCredential
 *
 * Example:
 *   const result = await signInWithEmail('aryan@ex.com', 'pass1234');
 *   console.log(result.user.uid);
 */
export async function signInWithEmail(email, password) {
  _checkAuth();
  var { signInWithEmailAndPassword } = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  return signInWithEmailAndPassword(_auth, email, password);
}

/**
 * signUpWithEmail(email, password)
 * Create a new account with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Firebase UserCredential
 */
export async function signUpWithEmail(email, password) {
  _checkAuth();
  var { createUserWithEmailAndPassword } = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  return createUserWithEmailAndPassword(_auth, email, password);
}

/**
 * signInWithGoogle()
 * Sign in using Google popup.
 *
 * @returns {Promise<object>} Firebase UserCredential
 */
export async function signInWithGoogle() {
  _checkAuth();
  var authMod = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  var provider = new authMod.GoogleAuthProvider();
  return authMod.signInWithPopup(_auth, provider);
}

/**
 * signOut()
 * Sign out the current user.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  _checkAuth();
  var { signOut: fbSignOut } = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  return fbSignOut(_auth);
}

/**
 * updateUserProfile(displayName, photoURL?)
 * Update the current user's display name / photo.
 *
 * @param {string} displayName
 * @param {string} [photoURL]
 * @returns {Promise<void>}
 */
export async function updateUserProfile(displayName, photoURL) {
  _checkAuth();
  var { updateProfile } = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  return updateProfile(_auth.currentUser, {
    displayName: displayName,
    photoURL:    photoURL || null,
  });
}

/**
 * sendPasswordReset(email)
 * Send a password reset email.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
  _checkAuth();
  var { sendPasswordResetEmail } = await import(
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
  );
  return sendPasswordResetEmail(_auth, email);
}

/**
 * onAuthStateChange(callback)
 * Listen for auth state changes (login/logout).
 * Returns an unsubscribe function.
 *
 * @param {function} callback  — Called with (user | null)
 * @returns {function}         — Unsubscribe
 *
 * Example:
 *   const unsub = onAuthStateChange((user) => {
 *     if (user) console.log('Logged in:', user.uid);
 *     else      console.log('Logged out');
 *   });
 */
export function onAuthStateChange(callback) {
  if (!_auth) {
    console.warn('[Firebase] Auth not initialized');
    return function () {};
  }
  // Dynamically get the function and set up listener
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
    .then(function (mod) {
      mod.onAuthStateChanged(_auth, callback);
    });
  return function () {}; // placeholder unsubscribe
}

/**
 * getCurrentUser()
 * Get the currently signed-in Firebase user.
 *
 * @returns {object|null}
 */
export function getCurrentUser() {
  return _auth ? _auth.currentUser : null;
}

/* ================================================================
   FIRESTORE FUNCTIONS
   Collection: users, leaderboard, questions, sessions
   ================================================================ */

/**
 * getDocument(collectionName, docId)
 * Fetch a single document from Firestore.
 *
 * @param {string} collectionName  — e.g. 'users'
 * @param {string} docId           — e.g. user's UID
 * @returns {Promise<object|null>} — Document data or null if not found
 *
 * Example:
 *   const user = await getDocument('users', 'uid123');
 *   console.log(user.name, user.xp);
 */
export async function getDocument(collectionName, docId) {
  _checkDB();
  var mod  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var ref  = mod.doc(_db, collectionName, docId);
  var snap = await mod.getDoc(ref);

  if (!snap.exists()) return null;
  return Object.assign({ id: snap.id }, snap.data());
}

/**
 * setDocument(collectionName, docId, data)
 * Create or overwrite a document (with merge).
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<void>}
 *
 * Example:
 *   await setDocument('users', uid, {
 *     name:  'Aryan',
 *     email: 'aryan@ex.com',
 *     xp:    1240,
 *   });
 */
export async function setDocument(collectionName, docId, data) {
  _checkDB();
  var mod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var ref = mod.doc(_db, collectionName, docId);
  return mod.setDoc(ref, Object.assign({}, data, {
    updatedAt: mod.serverTimestamp(),
  }), { merge: true });
}

/**
 * updateDocument(collectionName, docId, data)
 * Partially update specific fields in a document.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data           — Only the fields to update
 * @returns {Promise<void>}
 *
 * Example:
 *   await updateDocument('users', uid, { xp: 1500, level: 3 });
 */
export async function updateDocument(collectionName, docId, data) {
  _checkDB();
  var mod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var ref = mod.doc(_db, collectionName, docId);
  return mod.updateDoc(ref, Object.assign({}, data, {
    updatedAt: mod.serverTimestamp(),
  }));
}

/**
 * deleteDocument(collectionName, docId)
 * Delete a document permanently.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  _checkDB();
  var mod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var ref = mod.doc(_db, collectionName, docId);
  return mod.deleteDoc(ref);
}

/**
 * queryCollection(collectionName, ...constraints)
 * Query a Firestore collection with filters/ordering/limits.
 *
 * @param {string}    collectionName
 * @param {...object} constraints     — Firestore query constraints
 * @returns {Promise<object[]>}       — Array of documents with id field
 *
 * Examples:
 *   // Top 50 users by XP
 *   const leaders = await queryCollection(
 *     'leaderboard',
 *     orderBy('xp', 'desc'),
 *     limit(50)
 *   );
 *
 *   // User's practice history
 *   const history = await queryCollection(
 *     'sessions',
 *     where('userId', '==', uid),
 *     orderBy('date', 'desc'),
 *     limit(20)
 *   );
 */
export async function queryCollection(collectionName) {
  _checkDB();
  var constraints = Array.prototype.slice.call(arguments, 1);
  var mod  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var col  = mod.collection(_db, collectionName);
  var q    = mod.query.apply(null, [col].concat(constraints));
  var snap = await mod.getDocs(q);

  return snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  });
}

/**
 * addDocument(collectionName, data)
 * Add a new document with auto-generated ID.
 *
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<string>}  — New document ID
 *
 * Example:
 *   const id = await addDocument('sessions', {
 *     userId: uid,
 *     score:  80,
 *     date:   new Date().toISOString(),
 *   });
 */
export async function addDocument(collectionName, data) {
  _checkDB();
  var mod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  var col = mod.collection(_db, collectionName);
  var ref = await mod.addDoc(col, Object.assign({}, data, {
    createdAt: mod.serverTimestamp(),
  }));
  return ref.id;
}

/**
 * listenDocument(collectionName, docId, callback)
 * Real-time listener for a single document.
 * Fires callback every time the document changes.
 *
 * @param {string}   collectionName
 * @param {string}   docId
 * @param {function} callback  — Called with (data | null)
 * @returns {function}         — Unsubscribe function
 *
 * Example:
 *   const unsub = listenDocument('users', uid, (data) => {
 *     updateXPBar(data.xp);
 *   });
 *
 *   // When done listening:
 *   unsub();
 */
export function listenDocument(collectionName, docId, callback) {
  if (!_db) {
    console.warn('[Firebase] DB not initialized');
    return function () {};
  }

  var unsubscribe = function () {};

  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    .then(function (mod) {
      var ref = mod.doc(_db, collectionName, docId);
      unsubscribe = mod.onSnapshot(ref, function (snap) {
        if (snap.exists()) {
          callback(Object.assign({ id: snap.id }, snap.data()));
        } else {
          callback(null);
        }
      }, function (err) {
        console.error('[Firebase] listenDocument error:', err);
      });
    });

  return function () { unsubscribe(); };
}

/**
 * listenCollection(collectionName, constraints, callback)
 * Real-time listener for a collection query.
 *
 * @param {string}    collectionName
 * @param {object[]}  constraints     — Array of Firestore constraints
 * @param {function}  callback        — Called with (docs[])
 * @returns {function}                — Unsubscribe
 *
 * Example:
 *   const unsub = listenCollection(
 *     'leaderboard',
 *     [orderBy('xp', 'desc'), limit(10)],
 *     (docs) => renderLeaderboard(docs)
 *   );
 */
export function listenCollection(collectionName, constraints, callback) {
  if (!_db) {
    console.warn('[Firebase] DB not initialized');
    return function () {};
  }

  var unsubscribe = function () {};

  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    .then(function (mod) {
      var col = mod.collection(_db, collectionName);
      var q   = mod.query.apply(null, [col].concat(constraints || []));

      unsubscribe = mod.onSnapshot(q, function (snap) {
        var docs = snap.docs.map(function (d) {
          return Object.assign({ id: d.id }, d.data());
        });
        callback(docs);
      }, function (err) {
        console.error('[Firebase] listenCollection error:', err);
      });
    });

  return function () { unsubscribe(); };
}

/* ================================================================
   FIRESTORE QUERY HELPERS
   Export these so modules can build queries cleanly
   ================================================================ */

/**
 * firestoreHelpers()
 * Returns Firestore query builder functions.
 * Use these to build queryCollection() constraints.
 *
 * @returns {Promise<object>}
 *
 * Example:
 *   const { where, orderBy, limit } = await firestoreHelpers();
 *   const docs = await queryCollection('users',
 *     where('level', '>=', 3),
 *     orderBy('xp', 'desc'),
 *     limit(20)
 *   );
 */
export async function firestoreHelpers() {
  var mod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
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
  };
}

/* ================================================================
   PRIVATE HELPERS
   ================================================================ */

/** Throw if Auth not initialized */
function _checkAuth() {
  if (!_auth) {
    throw new Error('[Firebase] Auth not initialized. Call initFirebase() first.');
  }
}

/** Throw if Firestore not initialized */
function _checkDB() {
  if (!_db) {
    throw new Error('[Firebase] Firestore not initialized. Call initFirebase() first.');
  }
}

/* ================================================================
   EXPORTS SUMMARY
   ================================================================
   initFirebase()                     — Boot Firebase SDK
   getApp() / getAuth() / getDB()     — Get instances

   AUTH:
   signInWithEmail(email, password)   — Login
   signUpWithEmail(email, password)   — Register
   signInWithGoogle()                 — Google Login
   signOut()                          — Logout
   updateUserProfile(name, photo)     — Update profile
   sendPasswordReset(email)           — Reset password
   onAuthStateChange(callback)        — Auth listener
   getCurrentUser()                   — Get current user

   FIRESTORE:
   getDocument(col, id)               — Read one doc
   setDocument(col, id, data)         — Write/merge doc
   updateDocument(col, id, data)      — Update fields
   deleteDocument(col, id)            — Delete doc
   queryCollection(col, ...filters)   — Query docs
   addDocument(col, data)             — Add doc (auto ID)
   listenDocument(col, id, fn)        — Real-time doc
   listenCollection(col, filters, fn) — Real-time query
   firestoreHelpers()                 — where/orderBy/limit
   ================================================================ */

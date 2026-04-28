/* ============================================================
   ExamEdge Pro — js/firebase.js
   Firebase Integration Placeholder
   Replace stub functions with real Firebase SDK calls.
   ============================================================ */

import { FIREBASE_CONFIG, FEATURES } from './config.js';

/* ── Firebase App Instance ───────────────────────────────────── */
let app  = null;
let auth = null;
let db   = null;

/**
 * Initialize Firebase. Called once in app.js if FEATURES.FIREBASE_ENABLED.
 * Import Firebase SDK via CDN or npm and uncomment below.
 */
export async function initFirebase() {
  if (!FEATURES.FIREBASE_ENABLED) {
    console.info('[Firebase] Disabled via feature flag.');
    return;
  }

  try {
    // -- Uncomment after adding Firebase SDK --
    // const { initializeApp }     = await import('https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js');
    // const { getAuth }           = await import('https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js');
    // const { getFirestore }      = await import('https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js');
    //
    // app  = initializeApp(FIREBASE_CONFIG);
    // auth = getAuth(app);
    // db   = getFirestore(app);

    console.info('[Firebase] Initialized.');
  } catch (err) {
    console.error('[Firebase] Init failed:', err);
  }
}

/* ── Auth ────────────────────────────────────────────────────── */

export async function signInWithEmail(email, password) {
  // const { signInWithEmailAndPassword } = await import('firebase/auth');
  // return signInWithEmailAndPassword(auth, email, password);
  console.warn('[Firebase] signInWithEmail — stub');
  return null;
}

export async function signUpWithEmail(email, password) {
  // const { createUserWithEmailAndPassword } = await import('firebase/auth');
  // return createUserWithEmailAndPassword(auth, email, password);
  console.warn('[Firebase] signUpWithEmail — stub');
  return null;
}

export async function signInWithGoogle() {
  // const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  // const provider = new GoogleAuthProvider();
  // return signInWithPopup(auth, provider);
  console.warn('[Firebase] signInWithGoogle — stub');
  return null;
}

export async function signOut() {
  // const { signOut: fbSignOut } = await import('firebase/auth');
  // return fbSignOut(auth);
  console.warn('[Firebase] signOut — stub');
}

export function onAuthStateChange(callback) {
  // const { onAuthStateChanged } = await import('firebase/auth');
  // return onAuthStateChanged(auth, callback);
  console.warn('[Firebase] onAuthStateChange — stub');
  return () => {}; // unsubscribe noop
}

/* ── Firestore ───────────────────────────────────────────────── */

export async function getDocument(collection, docId) {
  // const { doc, getDoc } = await import('firebase/firestore');
  // const ref  = doc(db, collection, docId);
  // const snap = await getDoc(ref);
  // return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  console.warn('[Firebase] getDocument — stub');
  return null;
}

export async function setDocument(collection, docId, data) {
  // const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  // const ref = doc(db, collection, docId);
  // return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  console.warn('[Firebase] setDocument — stub');
}

export async function queryCollection(collection, ...constraints) {
  // const { collection: col, query, getDocs } = await import('firebase/firestore');
  // const q    = query(col(db, collection), ...constraints);
  // const snap = await getDocs(q);
  // return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.warn('[Firebase] queryCollection — stub');
  return [];
}

export async function updateDocument(collection, docId, data) {
  // const { doc, updateDoc } = await import('firebase/firestore');
  // const ref = doc(db, collection, docId);
  // return updateDoc(ref, data);
  console.warn('[Firebase] updateDocument — stub');
}

export async function deleteDocument(collection, docId) {
  // const { doc, deleteDoc } = await import('firebase/firestore');
  // const ref = doc(db, collection, docId);
  // return deleteDoc(ref);
  console.warn('[Firebase] deleteDocument — stub');
}

/* ── Exports ─────────────────────────────────────────────────── */
export { auth, db };

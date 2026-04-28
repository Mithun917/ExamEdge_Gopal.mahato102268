/* ============================================================
   ExamEdge Pro — js/modules/auth.js
   Authentication logic (local + Firebase-ready)
   ============================================================ */

import { store }                      from '../state.js';
import { STORAGE_KEYS, ROUTES }       from '../config.js';
import { isValidEmail, isValidPassword, showToast, lsSet, lsRemove } from '../utils.js';
import { signInWithEmail, signUpWithEmail, signOut as fbSignOut, signInWithGoogle } from '../firebase.js';

/* ── Mock local auth (used when Firebase is off) ────────────── */
const MOCK_USER = {
  uid:    'local_user_001',
  name:   'Aryan Sharma',
  email:  'aryan@examedgepro.com',
  avatar: null,
  role:   'student',
};

/* ── Sign In ─────────────────────────────────────────────────── */
export async function signIn({ email, password }) {
  if (!isValidEmail(email))        throw new Error('Invalid email address.');
  if (!isValidPassword(password))  throw new Error('Password must be at least 8 characters.');

  store.setLoading('auth', true);

  try {
    // TODO: swap with Firebase when enabled
    // const result = await signInWithEmail(email, password);
    const user = { ...MOCK_USER, email };
    _setUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
    window.navigate(ROUTES.DASHBOARD);
    return user;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  } finally {
    store.setLoading('auth', false);
  }
}

/* ── Sign Up ─────────────────────────────────────────────────── */
export async function signUp({ name, email, password }) {
  if (!name?.trim())               throw new Error('Name is required.');
  if (!isValidEmail(email))        throw new Error('Invalid email address.');
  if (!isValidPassword(password))  throw new Error('Password must be at least 8 characters.');

  store.setLoading('auth', true);

  try {
    // const result = await signUpWithEmail(email, password);
    const user = { ...MOCK_USER, name, email };
    _setUser(user);
    showToast('Account created! Welcome to ExamEdge Pro.', 'success');
    window.navigate(ROUTES.DASHBOARD);
    return user;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  } finally {
    store.setLoading('auth', false);
  }
}

/* ── Google Sign In ──────────────────────────────────────────── */
export async function googleSignIn() {
  store.setLoading('auth', true);
  try {
    // const result = await signInWithGoogle();
    const user = MOCK_USER;
    _setUser(user);
    showToast('Signed in with Google!', 'success');
    window.navigate(ROUTES.DASHBOARD);
    return user;
  } catch (err) {
    showToast('Google sign-in failed.', 'error');
    throw err;
  } finally {
    store.setLoading('auth', false);
  }
}

/* ── Sign Out ────────────────────────────────────────────────── */
export async function signOut() {
  try {
    // await fbSignOut();
    store.replace('user', null);
    store.set('isAuthenticated', false);
    lsRemove(STORAGE_KEYS.USER);
    lsRemove(STORAGE_KEYS.SESSION);
    showToast('Signed out successfully.', 'info');
    window.navigate(ROUTES.LOGIN);
  } catch (err) {
    showToast('Sign-out failed.', 'error');
  }
}

/* ── Guard: require auth before page render ──────────────────── */
export function requireAuth(callback) {
  const isAuth = store.get('isAuthenticated');
  if (!isAuth) {
    window.navigate(ROUTES.LOGIN);
    return false;
  }
  callback?.();
  return true;
}

/* ── Internal ────────────────────────────────────────────────── */
function _setUser(user) {
  store.set('user', user);
  store.set('isAuthenticated', true);
  lsSet(STORAGE_KEYS.USER, user);
}

/* ============================================================
   ExamEdge Pro — js/modules/user.js
   User profile management and page renderer
   ============================================================ */

import { store }            from '../state.js';
import { $, $$, showToast, formatDate, formatNumber, buildRingSVG, calcProgress } from '../utils.js';
import { requireAuth }      from './auth.js';

/* ── Page Init ───────────────────────────────────────────────── */
export function init() {
  if (!requireAuth()) return;
  renderProfile();
  bindEvents();
}

/* ── Render ──────────────────────────────────────────────────── */
function renderProfile() {
  const user = store.get('user');
  const xp   = store.get('xp');
  if (!user) return;

  // Avatar initials
  $$('[data-user-avatar]').forEach(el => {
    el.textContent = _initials(user.name);
  });

  // Name / email
  $$('[data-user-name]').forEach(el => el.textContent = user.name);
  $$('[data-user-email]').forEach(el => el.textContent = user.email);

  // XP ring
  const ring = $('[data-xp-ring]');
  if (ring) {
    ring.innerHTML = buildRingSVG({ size: 100, stroke: 8, pct: calcProgress(xp.total), color: 'var(--clr-accent)' });
  }

  // XP stats
  const xpEl    = $('[data-xp-total]');
  const levelEl = $('[data-xp-level]');
  if (xpEl)    xpEl.textContent    = formatNumber(xp.total) + ' XP';
  if (levelEl) levelEl.textContent = `Level ${xp.level}`;

  // Fill form fields
  const nameInput  = $('#profile-name');
  const emailInput = $('#profile-email');
  if (nameInput)  nameInput.value  = user.name  || '';
  if (emailInput) emailInput.value = user.email || '';
}

/* ── Bind Events ─────────────────────────────────────────────── */
function bindEvents() {
  const form = $('#profile-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    await saveProfile();
  });
}

/* ── Save Profile ────────────────────────────────────────────── */
async function saveProfile() {
  const name  = $('#profile-name')?.value?.trim();
  const email = $('#profile-email')?.value?.trim();

  if (!name)  return showToast('Name cannot be empty.', 'error');
  if (!email) return showToast('Email cannot be empty.', 'error');

  store.setLoading('profile', true);
  try {
    store.set('user', { name, email });
    // await updateDocument('users', store.get('user').uid, { name, email });
    showToast('Profile updated!', 'success');
    renderProfile();
  } catch (err) {
    showToast('Failed to save profile.', 'error');
  } finally {
    store.setLoading('profile', false);
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export { saveProfile };

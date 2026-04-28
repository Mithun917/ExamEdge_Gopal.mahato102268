/* ============================================================
   ExamEdge Pro — js/modules/analytics.js
   Dashboard page init and analytics charts/stats
   ============================================================ */

import { store }              from '../state.js';
import { $, formatNumber, formatPercent, buildRingSVG, calcProgress } from '../utils.js';
import { updateXPUI }         from './xp.js';
import { requireAuth }        from './auth.js';

/* ── Page Init ───────────────────────────────────────────────── */
export function init() {
  if (!requireAuth()) return;
  renderDashboard();
  updateXPUI();
}

/* ── Render Dashboard ────────────────────────────────────────── */
function renderDashboard() {
  const state     = store.get();
  const user      = state.user;
  const xp        = state.xp;
  const streak    = state.streak;
  const history   = state.practice?.history || [];
  const mocks     = state.mock?.results     || [];
  const achievements = state.achievements  || [];

  /* ── Greeting ─────────────────────────────────────────────── */
  const greetEl = $('[data-greeting]');
  if (greetEl) {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    greetEl.textContent = `Good ${part}, ${user?.name?.split(' ')[0] ?? 'Scholar'} 👋`;
  }

  /* ── Stat Cards ────────────────────────────────────────────── */
  _setText('[data-stat-xp]',          formatNumber(xp.total) + ' XP');
  _setText('[data-stat-level]',       `Level ${xp.level}`);
  _setText('[data-stat-streak]',      `${streak?.current ?? 0} days`);
  _setText('[data-stat-mocks]',       mocks.length);
  _setText('[data-stat-achievements]', achievements.length);

  const totalQ  = history.reduce((s, r) => s + (r.total   || 0), 0);
  const totalC  = history.reduce((s, r) => s + (r.correct || 0), 0);
  const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
  _setText('[data-stat-accuracy]', `${accuracy}%`);
  _setText('[data-stat-questions]', formatNumber(totalQ));

  /* ── XP Progress Ring ─────────────────────────────────────── */
  const ringEl = $('[data-xp-ring]');
  if (ringEl) {
    ringEl.innerHTML = buildRingSVG({ size: 120, stroke: 10, pct: calcProgress(xp.total), color: 'var(--clr-accent)' });
    const label = document.createElement('div');
    label.className   = 'ring-progress__label';
    label.style.cssText = 'font-size:var(--text-lg);';
    label.innerHTML   = `<div style="font-size:var(--text-xl);font-weight:800">${xp.level}</div><div style="font-size:var(--text-xs);color:var(--clr-text-muted)">Level</div>`;
    ringEl.style.position = 'relative';
    ringEl.style.display  = 'inline-flex';
    ringEl.style.alignItems = 'center';
    ringEl.style.justifyContent = 'center';
    const svg = ringEl.querySelector('svg');
    if (svg) { svg.style.position = 'absolute'; }
    ringEl.appendChild(label);
  }

  /* ── Accuracy Bar ─────────────────────────────────────────── */
  const accBar = $('[data-accuracy-bar]');
  if (accBar) accBar.style.width = `${accuracy}%`;

  /* ── Recent Activity ──────────────────────────────────────── */
  const actEl = $('[data-recent-activity]');
  if (actEl) {
    if (history.length === 0) {
      actEl.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8)">
          <div class="empty-state__icon">📖</div>
          <div class="empty-state__title">No sessions yet</div>
          <div class="empty-state__desc">Start a practice session to see your activity here.</div>
          <button class="btn btn--primary" onclick="window.navigate('/practice')">Start Practicing</button>
        </div>`;
    } else {
      actEl.innerHTML = history.slice(0, 5).map(r => `
        <div class="lb-row">
          <div class="lb-avatar" style="background:var(--clr-accent-dim);color:var(--clr-accent)">📝</div>
          <div class="lb-name">Practice Session</div>
          <div style="text-align:right">
            <div class="lb-score">${r.score}%</div>
            <div class="text-xs text-muted">${r.correct}/${r.total} correct</div>
          </div>
        </div>
      `).join('');
    }
  }

  /* ── Weak Topics ──────────────────────────────────────────── */
  const weakEl = $('[data-weak-topics]');
  if (weakEl) {
    const topics = _computeWeakTopics(history);
    if (topics.length === 0) {
      weakEl.innerHTML = '<p class="text-muted text-sm">Complete more practice to see weak topics.</p>';
    } else {
      weakEl.innerHTML = topics.map(t => `
        <div style="margin-bottom:var(--space-3)">
          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px">
            <span>${t.topic}</span>
            <span class="text-muted">${t.accuracy}%</span>
          </div>
          <div class="progress">
            <div class="progress__fill ${t.accuracy < 50 ? 'progress--danger' : 'progress--warn'}"
              style="width:${t.accuracy}%"></div>
          </div>
        </div>
      `).join('');
    }
  }
}

/* ── Compute Weak Topics ─────────────────────────────────────── */
function _computeWeakTopics(history) {
  // Placeholder — real impl groups results by topic
  return [
    { topic: 'Mathematics', accuracy: 42 },
    { topic: 'Reasoning',   accuracy: 58 },
    { topic: 'English',     accuracy: 71 },
  ];
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _setText(selector, value) {
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = value;
  });
}

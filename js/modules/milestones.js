/* ============================================================
   ExamEdge Pro — js/modules/milestones.js
   Study milestones, goal tracking, progress visualization
   ============================================================ */

import { store }       from '../state.js';
import { $, showToast, formatNumber } from '../utils.js';

/* ── Milestone Definitions ───────────────────────────────────── */
export const MILESTONES = [
  { id: 'm1', label: 'Answer 50 Questions',   target: 50,   metric: 'questions_answered', icon: '📝' },
  { id: 'm2', label: 'Answer 200 Questions',  target: 200,  metric: 'questions_answered', icon: '📚' },
  { id: 'm3', label: 'Answer 500 Questions',  target: 500,  metric: 'questions_answered', icon: '🎯' },
  { id: 'm4', label: 'Complete 5 Mock Exams', target: 5,    metric: 'mocks_completed',    icon: '📋' },
  { id: 'm5', label: 'Earn 1000 XP',          target: 1000, metric: 'xp',                 icon: '⭐' },
  { id: 'm6', label: 'Earn 5000 XP',          target: 5000, metric: 'xp',                 icon: '🌟' },
  { id: 'm7', label: '7-Day Streak',           target: 7,    metric: 'streak',             icon: '🔥' },
  { id: 'm8', label: '30-Day Streak',          target: 30,   metric: 'streak',             icon: '💎' },
];

/* ── Get Current Metric Values ───────────────────────────────── */
function getMetrics() {
  const state  = store.get();
  const hx     = state.practice?.history || [];
  const mocks  = state.mock?.results     || [];

  const questionsAnswered = hx.reduce((sum, r) => sum + (r.total || 0), 0);

  return {
    questions_answered: questionsAnswered,
    mocks_completed:    mocks.length,
    xp:                 state.xp?.total    || 0,
    streak:             state.streak?.current || 0,
  };
}

/* ── Check & Update Milestones ───────────────────────────────── */
export function checkMilestones() {
  const metrics = getMetrics();
  const reached = new Set(store.get('milestones') || []);
  let updated   = false;

  MILESTONES.forEach(m => {
    if (!reached.has(m.id) && (metrics[m.metric] || 0) >= m.target) {
      reached.add(m.id);
      updated = true;
      showToast(`${m.icon} Milestone reached: ${m.label}!`, 'success');
    }
  });

  if (updated) store.replace('milestones', [...reached]);
}

/* ── Render ──────────────────────────────────────────────────── */
export function renderMilestones(containerId = 'milestones-list') {
  const container = $(`#${containerId}`);
  if (!container) return;

  const metrics = getMetrics();
  const reached = new Set(store.get('milestones') || []);

  container.innerHTML = MILESTONES.map(m => {
    const current  = Math.min(metrics[m.metric] || 0, m.target);
    const pct      = Math.round((current / m.target) * 100);
    const done     = reached.has(m.id);

    return `
      <div class="achievement ${done ? '' : ''}">
        <div class="achievement__icon">${m.icon}</div>
        <div style="flex:1">
          <div class="achievement__name">${m.label}</div>
          <div style="margin-top:var(--space-2)">
            <div class="progress progress--sm">
              <div class="progress__fill ${done ? 'progress--success' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="achievement__desc" style="margin-top:var(--space-1)">
              ${formatNumber(current)} / ${formatNumber(m.target)}
            </div>
          </div>
        </div>
        ${done ? `<span class="badge badge--green">✓ Done</span>` : `<span class="badge badge--neutral">${pct}%</span>`}
      </div>
    `;
  }).join('');
}

export function init() {
  checkMilestones();
  renderMilestones();
}

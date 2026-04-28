/* ============================================================
   ExamEdge Pro — js/modules/achievements.js
   Achievement definitions, unlock logic, UI
   ============================================================ */

import { store }     from '../state.js';
import { showToast } from '../utils.js';

/* ── Achievement Definitions ─────────────────────────────────── */
export const ACHIEVEMENT_DEFS = [
  {
    id: 'first_question',
    name: 'First Step',
    desc: 'Answer your first question.',
    icon: '🎯',
    condition: s => (s.practice.history?.length ?? 0) >= 1,
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    desc: 'Maintain a 3-day streak.',
    icon: '🔥',
    condition: s => (s.streak?.current ?? 0) >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    desc: 'Maintain a 7-day streak.',
    icon: '⚡',
    condition: s => (s.streak?.current ?? 0) >= 7,
  },
  {
    id: 'xp_500',
    name: 'XP Collector',
    desc: 'Earn 500 total XP.',
    icon: '✨',
    condition: s => (s.xp?.total ?? 0) >= 500,
  },
  {
    id: 'xp_2000',
    name: 'Knowledge Seeker',
    desc: 'Earn 2000 total XP.',
    icon: '🌟',
    condition: s => (s.xp?.total ?? 0) >= 2000,
  },
  {
    id: 'mock_perfect',
    name: 'Perfectionist',
    desc: 'Score 100% on a mock exam.',
    icon: '🏆',
    condition: s => s.mock?.results?.some(r => r.score === 100),
  },
  {
    id: 'level_5',
    name: 'Rising Scholar',
    desc: 'Reach Level 5.',
    icon: '📚',
    condition: s => (s.xp?.level ?? 1) >= 5,
  },
  {
    id: 'level_10',
    name: 'Expert Learner',
    desc: 'Reach Level 10.',
    icon: '🎓',
    condition: s => (s.xp?.level ?? 1) >= 10,
  },
];

/* ── Check & Unlock ──────────────────────────────────────────── */
export function checkAchievements() {
  const state    = store.get();
  const unlocked = new Set(store.get('achievements').map(a => a.id));

  const newlyUnlocked = ACHIEVEMENT_DEFS.filter(def => {
    if (unlocked.has(def.id)) return false;
    try { return def.condition(state); }
    catch { return false; }
  });

  if (newlyUnlocked.length === 0) return;

  const updated = [
    ...store.get('achievements'),
    ...newlyUnlocked.map(def => ({ ...def, unlockedAt: new Date().toISOString() })),
  ];

  store.replace('achievements', updated);
  newlyUnlocked.forEach(a => {
    showToast(`${a.icon} Achievement Unlocked: ${a.name}`, 'success');
  });
}

/* ── Page Init ───────────────────────────────────────────────── */
export function init() {
  renderAchievements();
}

/* ── Render ──────────────────────────────────────────────────── */
function renderAchievements() {
  const container = document.querySelector('[data-achievements-grid]');
  if (!container) return;

  const unlocked = new Set(store.get('achievements').map(a => a.id));

  container.innerHTML = ACHIEVEMENT_DEFS.map(def => `
    <div class="achievement ${unlocked.has(def.id) ? '' : 'achievement--locked'}" title="${def.desc}">
      <div class="achievement__icon">${def.icon}</div>
      <div>
        <div class="achievement__name">${def.name}</div>
        <div class="achievement__desc">${def.desc}</div>
      </div>
      ${unlocked.has(def.id)
        ? `<span class="badge badge--green" style="margin-left:auto">Unlocked</span>`
        : `<span class="badge badge--neutral" style="margin-left:auto">Locked</span>`}
    </div>
  `).join('');
}

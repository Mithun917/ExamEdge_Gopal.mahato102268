/* ============================================================
   ExamEdge Pro — js/modules/xp.js
   XP award, leveling, streak tracking
   ============================================================ */

import { store }                      from '../state.js';
import { XP_CONFIG }                  from '../config.js';
import { calcLevel, calcProgress, showToast, isToday, formatNumber } from '../utils.js';
import { checkAchievements }          from './achievements.js';

/* ── Award XP ────────────────────────────────────────────────── */
export function awardXP(amount, reason = '') {
  const current   = store.get('xp');
  const newTotal  = current.total + amount;
  const newLevel  = calcLevel(newTotal, XP_CONFIG.LEVEL_THRESHOLD);
  const newProg   = calcProgress(newTotal, XP_CONFIG.LEVEL_THRESHOLD);
  const leveledUp = newLevel > current.level;

  store.set('xp', { total: newTotal, level: newLevel, progress: newProg });

  if (reason) showToast(`+${formatNumber(amount)} XP  ${reason}`, 'success');
  if (leveledUp) _onLevelUp(newLevel);

  checkAchievements();
  updateXPUI();
}

/* ── Streak ──────────────────────────────────────────────────── */
export function updateStreak() {
  const streak = store.get('streak');
  const today  = new Date().toDateString();

  if (isToday(streak.lastDate)) return; // Already updated today

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newCurrent = streak.lastDate === yesterday
    ? streak.current + 1
    : 1; // reset streak

  const newBest = Math.max(newCurrent, streak.best);
  store.set('streak', { current: newCurrent, best: newBest, lastDate: today });

  if (newCurrent > 1) {
    awardXP(XP_CONFIG.DAILY_STREAK, `🔥 ${newCurrent}-day streak!`);
  }
}

/* ── UI Sync ─────────────────────────────────────────────────── */
export function updateXPUI() {
  const xp = store.get('xp');

  // Sidebar XP bar
  const fill  = document.querySelector('.sidebar__xp-fill');
  const label = document.querySelector('.sidebar__xp-label span:last-child');
  if (fill)  fill.style.width  = `${xp.progress * 100}%`;
  if (label) label.textContent = `${formatNumber(xp.total)} XP`;

  // Any [data-xp] elements on the page
  document.querySelectorAll('[data-xp]').forEach(el => {
    el.textContent = formatNumber(xp.total);
  });

  document.querySelectorAll('[data-level]').forEach(el => {
    el.textContent = xp.level;
  });
}

/* ── Level Up ────────────────────────────────────────────────── */
function _onLevelUp(newLevel) {
  showToast(`🎉 Level Up! You reached Level ${newLevel}`, 'success');
  // Could trigger modal, animation, etc.
  store.emit('xp:levelup', { level: newLevel });
}

/* ── XP for common actions ───────────────────────────────────── */
export const XP_ACTIONS = {
  correctAnswer:  () => awardXP(XP_CONFIG.CORRECT_ANSWER, ''),
  perfectMock:    () => awardXP(XP_CONFIG.PERFECT_MOCK,   '🏆 Perfect Mock!'),
  firstPractice:  () => awardXP(XP_CONFIG.FIRST_PRACTICE, '🎯 First Practice!'),
  dailyStreak:    () => updateStreak(),
};

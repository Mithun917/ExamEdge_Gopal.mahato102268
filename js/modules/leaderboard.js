/* ============================================================
   ExamEdge Pro — js/modules/leaderboard.js
   Leaderboard fetch, render, and filtering
   ============================================================ */

import { store }              from '../state.js';
import { $, formatNumber, showToast } from '../utils.js';
import { requireAuth }        from './auth.js';

/* ── Seed Data (replace with Firestore query) ─────────────────── */
const MOCK_LEADERBOARD = [
  { uid: 'u1', name: 'Priya Mehta',    xp: 8420, rank: 1, avatar: 'PM', streak: 21 },
  { uid: 'u2', name: 'Rahul Verma',    xp: 7310, rank: 2, avatar: 'RV', streak: 14 },
  { uid: 'u3', name: 'Sneha Gupta',    xp: 6800, rank: 3, avatar: 'SG', streak: 9  },
  { uid: 'u4', name: 'Arjun Patel',    xp: 5950, rank: 4, avatar: 'AP', streak: 7  },
  { uid: 'u5', name: 'Kavya Nair',     xp: 5200, rank: 5, avatar: 'KN', streak: 5  },
  { uid: 'u6', name: 'Rohan Singh',    xp: 4700, rank: 6, avatar: 'RS', streak: 4  },
  { uid: 'u7', name: 'Ananya Sharma',  xp: 4100, rank: 7, avatar: 'AS', streak: 3  },
  { uid: 'u8', name: 'Vikram Joshi',   xp: 3500, rank: 8, avatar: 'VJ', streak: 2  },
  { uid: 'u9', name: 'Meera Pillai',   xp: 2900, rank: 9, avatar: 'MP', streak: 1  },
  { uid: 'u10', name: 'Deepak Kumar', xp: 2100, rank: 10, avatar: 'DK', streak: 1  },
];

let currentFilter = 'xp'; // 'xp' | 'streak'

/* ── Page Init ───────────────────────────────────────────────── */
export function init() {
  if (!requireAuth()) return;
  fetchLeaderboard();
  bindEvents();
}

/* ── Fetch ───────────────────────────────────────────────────── */
export async function fetchLeaderboard() {
  store.setLoading('leaderboard', true);
  try {
    // const data = await queryCollection('users', orderBy('xp', 'desc'), limit(50));
    const data = MOCK_LEADERBOARD;
    store.replace('leaderboard.data', data);
    store.set('leaderboard.lastFetched', new Date().toISOString());
    renderLeaderboard(data);
  } catch (err) {
    showToast('Failed to load leaderboard.', 'error');
  } finally {
    store.setLoading('leaderboard', false);
  }
}

/* ── Render ──────────────────────────────────────────────────── */
function renderLeaderboard(data) {
  const myUid = store.get('user')?.uid;
  const sorted = [...data].sort((a, b) => b[currentFilter] - a[currentFilter])
    .map((u, i) => ({ ...u, displayRank: i + 1 }));

  // Top 3 podium
  const podiumEl = $('#lb-podium');
  if (podiumEl && sorted.length >= 3) {
    const order = [sorted[1], sorted[0], sorted[2]]; // 2nd, 1st, 3rd
    podiumEl.innerHTML = order.map((u, i) => {
      const heights = ['80px', '110px', '60px'];
      const medals  = ['🥈', '🥇', '🥉'];
      return `
        <div class="podium-slot" style="align-items:center;display:flex;flex-direction:column;gap:var(--space-2)">
          <div class="lb-avatar" style="width:44px;height:44px;font-size:var(--text-sm)">${u.avatar}</div>
          <span class="text-sm weight-semi">${u.name.split(' ')[0]}</span>
          <span class="text-xs text-muted font-mono">${formatNumber(u[currentFilter])}</span>
          <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);
            border-radius:var(--radius-md) var(--radius-md) 0 0;width:80px;height:${heights[i]};
            display:flex;align-items:center;justify-content:center;font-size:1.5rem">
            ${medals[i]}
          </div>
        </div>
      `;
    }).join('');
  }

  // Main list
  const listEl = $('#lb-list');
  if (!listEl) return;

  listEl.innerHTML = sorted.map(u => `
    <div class="lb-row ${u.uid === myUid ? 'lb-row--me' : ''}">
      <span class="lb-rank lb-rank--${u.displayRank}">${u.displayRank}</span>
      <div class="lb-avatar">${u.avatar}</div>
      <div class="lb-name">
        ${u.name}
        ${u.uid === myUid ? '<span class="badge badge--blue" style="margin-left:var(--space-2)">You</span>' : ''}
      </div>
      <div style="text-align:right">
        <div class="lb-score">${formatNumber(u[currentFilter])} ${currentFilter === 'xp' ? 'XP' : 'days'}</div>
        <div class="text-xs text-muted">🔥 ${u.streak}-day streak</div>
      </div>
    </div>
  `).join('');
}

/* ── Filter ──────────────────────────────────────────────────── */
export function setFilter(filter) {
  currentFilter = filter;
  $$('[data-lb-filter]').forEach(btn => {
    btn.classList.toggle('btn--primary', btn.dataset.lbFilter === filter);
    btn.classList.toggle('btn--secondary', btn.dataset.lbFilter !== filter);
  });
  renderLeaderboard(store.get('leaderboard.data'));
}

/* ── Bind Events ─────────────────────────────────────────────── */
function bindEvents() {
  document.querySelectorAll('[data-lb-filter]').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.lbFilter));
  });

  $('#btn-refresh-lb')?.addEventListener('click', fetchLeaderboard);
}

function $$(...args) { return [...document.querySelectorAll(...args)]; }

window.leaderboardModule = { init, setFilter, fetchLeaderboard };

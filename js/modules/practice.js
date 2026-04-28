/* ============================================================
   ExamEdge Pro — js/modules/practice.js
   Practice session: question flow, answer handling, review
   ============================================================ */

import { store }               from '../state.js';
import { EXAM_CONFIG }         from '../config.js';
import { $, shuffle, pickRandom, formatTime, showToast } from '../utils.js';
import { XP_ACTIONS }          from './xp.js';
import { requireAuth }         from './auth.js';

/* ── Seed Questions (replace with API/Firestore call) ─────────── */
const SEED_QUESTIONS = [
  {
    id: 'q1', topic: 'Mathematics', difficulty: 'easy',
    question: 'If x + 5 = 12, what is the value of x?',
    options: ['5', '6', '7', '8'], answer: 2,
    explanation: 'x = 12 - 5 = 7.',
  },
  {
    id: 'q2', topic: 'English', difficulty: 'medium',
    question: 'Choose the correct synonym for "Ephemeral":',
    options: ['Eternal', 'Transient', 'Robust', 'Ancient'], answer: 1,
    explanation: '"Ephemeral" means short-lived; "transient" is its closest synonym.',
  },
  {
    id: 'q3', topic: 'Reasoning', difficulty: 'hard',
    question: 'If all Bloops are Razzies, and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
    options: ['Yes', 'No', 'Cannot determine', 'Only some'], answer: 0,
    explanation: 'By transitive relation: Bloops → Razzies → Lazzies.',
  },
];

/* ── Session State ───────────────────────────────────────────── */
let session = null;

/* ── Init Page ───────────────────────────────────────────────── */
export function init() {
  if (!requireAuth()) return;
  renderSetupUI();
  bindEvents();
}

/* ── Start Session ───────────────────────────────────────────── */
export function startSession(options = {}) {
  const {
    topic      = 'all',
    difficulty = 'all',
    count      = EXAM_CONFIG.PRACTICE_BATCH_SIZE,
  } = options;

  let pool = [...SEED_QUESTIONS];
  if (topic !== 'all')      pool = pool.filter(q => q.topic === topic);
  if (difficulty !== 'all') pool = pool.filter(q => q.difficulty === difficulty);

  const questions = pickRandom(pool, Math.min(count, pool.length))
    .map(q => ({ ...q, options: shuffle([...q.options]), userAnswer: null, flagged: false }));

  session = {
    id:         Date.now(),
    questions,
    index:      0,
    startTime:  Date.now(),
    submitted:  false,
  };

  store.set('practice.activeSession', session);
  renderQuestion();
}

/* ── Answer Question ─────────────────────────────────────────── */
export function answerQuestion(optionIndex) {
  if (!session || session.submitted) return;
  const q = session.questions[session.index];
  if (q.userAnswer !== null) return; // Already answered

  q.userAnswer = optionIndex;
  const correct = optionIndex === q.answer;

  // Highlight options
  const options = document.querySelectorAll('.option');
  options.forEach((el, i) => {
    if (i === q.answer)      el.classList.add('correct');
    if (i === optionIndex && !correct) el.classList.add('wrong');
    if (i === optionIndex)   el.classList.add('selected');
  });

  // Show explanation
  const expEl = $('#explanation');
  if (expEl) {
    expEl.style.display = 'block';
    expEl.innerHTML = `<strong>${correct ? '✓ Correct!' : '✗ Incorrect'}</strong> ${q.explanation}`;
    expEl.className = `explanation ${correct ? 'explanation--correct' : 'explanation--wrong'}`;
  }

  if (correct) XP_ACTIONS.correctAnswer();

  // Show next button
  const nextBtn = $('#btn-next');
  if (nextBtn) nextBtn.style.display = 'inline-flex';
}

/* ── Next Question ───────────────────────────────────────────── */
export function nextQuestion() {
  if (!session) return;

  if (session.index < session.questions.length - 1) {
    session.index++;
    renderQuestion();
  } else {
    submitSession();
  }
}

/* ── Submit / Finish ─────────────────────────────────────────── */
export function submitSession() {
  if (!session) return;
  session.submitted = true;
  session.endTime   = Date.now();

  const total   = session.questions.length;
  const correct = session.questions.filter(q => q.userAnswer === q.answer).length;
  const score   = Math.round((correct / total) * 100);
  const elapsed = Math.round((session.endTime - session.startTime) / 1000);

  const result = { sessionId: session.id, total, correct, score, elapsed, date: new Date().toISOString() };

  // Persist to history
  const history = store.get('practice.history') || [];
  store.replace('practice.history', [result, ...history].slice(0, 50));
  store.replace('practice.activeSession', null);

  renderResults(result);
}

/* ── Render: Setup UI ─────────────────────────────────────────── */
function renderSetupUI() {
  const setupEl = $('#practice-setup');
  if (setupEl) setupEl.style.display = 'flex';
  const questionEl = $('#practice-question');
  if (questionEl) questionEl.style.display = 'none';
}

/* ── Render: Question ────────────────────────────────────────── */
function renderQuestion() {
  if (!session) return;
  const q   = session.questions[session.index];
  const idx = session.index;
  const tot = session.questions.length;

  const setupEl    = $('#practice-setup');
  const questionEl = $('#practice-question');
  if (setupEl)    setupEl.style.display    = 'none';
  if (questionEl) questionEl.style.display = 'block';

  const progressEl = $('#q-progress');
  if (progressEl) {
    progressEl.textContent = `Question ${idx + 1} of ${tot}`;
    const bar = progressEl.closest('.question-card')?.querySelector('.progress__fill');
    if (bar) bar.style.width = `${((idx + 1) / tot) * 100}%`;
  }

  const bodyEl = $('#q-body');
  if (bodyEl) bodyEl.textContent = q.question;

  const optList = $('#q-options');
  if (optList) {
    optList.innerHTML = q.options.map((opt, i) => `
      <button class="option" onclick="window.practiceModule.answerQuestion(${i})">
        <span class="option__key">${String.fromCharCode(65 + i)}</span>
        <span>${opt}</span>
      </button>
    `).join('');
  }

  const expEl = $('#explanation');
  if (expEl) expEl.style.display = 'none';
  const nextBtn = $('#btn-next');
  if (nextBtn) nextBtn.style.display = 'none';
}

/* ── Render: Results ─────────────────────────────────────────── */
function renderResults(result) {
  const questionEl = $('#practice-question');
  const resultsEl  = $('#practice-results');
  if (questionEl) questionEl.style.display = 'none';
  if (resultsEl)  {
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `
      <div class="card" style="text-align:center;max-width:480px;margin:0 auto;">
        <div class="card__title" style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">
          ${result.score >= 60 ? '🎉' : '📖'} ${result.score}%
        </div>
        <p class="text-muted">You got <strong>${result.correct}</strong> of <strong>${result.total}</strong> correct.</p>
        <div class="divider"></div>
        <div class="grid-stats" style="grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="stat-card"><div class="stat-card__value">${result.correct}</div><div class="stat-card__label">Correct</div></div>
          <div class="stat-card"><div class="stat-card__value">${result.total - result.correct}</div><div class="stat-card__label">Incorrect</div></div>
        </div>
        <div class="page-header__actions" style="justify-content:center;margin-top:var(--space-6)">
          <button class="btn btn--primary" onclick="window.practiceModule.init()">Try Again</button>
          <button class="btn btn--secondary" onclick="window.navigate('/')">Dashboard</button>
        </div>
      </div>
    `;
  }
}

/* ── Bind Events ─────────────────────────────────────────────── */
function bindEvents() {
  const startBtn = $('#btn-start-practice');
  startBtn?.addEventListener('click', () => {
    const topic = $('#select-topic')?.value || 'all';
    const diff  = $('#select-difficulty')?.value || 'all';
    startSession({ topic, difficulty: diff });
  });
}

/* ── Expose for inline HTML ──────────────────────────────────── */
window.practiceModule = { answerQuestion, nextQuestion, submitSession, init };

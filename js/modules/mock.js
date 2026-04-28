/* ============================================================
   ExamEdge Pro — js/modules/mock.js
   Full mock exam with countdown timer, auto-submit
   ============================================================ */

import { store }                    from '../state.js';
import { EXAM_CONFIG }              from '../config.js';
import { $, shuffle, pickRandom, formatTime, showToast } from '../utils.js';
import { XP_ACTIONS }               from './xp.js';
import { requireAuth }              from './auth.js';

/* ── Timer State ─────────────────────────────────────────────── */
let timerInterval = null;
let timeRemaining = 0;
let session       = null;

/* ── Page Init ───────────────────────────────────────────────── */
export function init() {
  if (!requireAuth()) return;
  renderSetup();
  bindEvents();
}

/* ── Start Mock ──────────────────────────────────────────────── */
export function startMock(durationMins = EXAM_CONFIG.DEFAULT_DURATION_MINS) {
  // Placeholder question pool — replace with API fetch
  const questions = pickRandom(_generateQuestions(60), EXAM_CONFIG.MOCK_QUESTION_COUNT)
    .map(q => ({ ...q, userAnswer: null, flagged: false }));

  session = {
    id:        Date.now(),
    questions,
    index:     0,
    duration:  durationMins * 60,
    startTime: Date.now(),
    submitted: false,
  };

  timeRemaining = session.duration;
  store.set('mock.activeSession', session);

  _hideEl('#mock-setup');
  _showEl('#mock-exam');

  renderQuestion();
  startTimer();
}

/* ── Timer ───────────────────────────────────────────────────── */
function startTimer() {
  const timerEl = $('#mock-timer');
  updateTimerDisplay(timerEl);

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timerEl);

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      showToast('⏰ Time is up! Auto-submitting…', 'warn');
      submitMock();
    }
  }, 1000);
}

function updateTimerDisplay(el) {
  if (!el) return;
  el.textContent = formatTime(timeRemaining);
  el.className   = 'timer';
  if (timeRemaining <= 300)  el.classList.add('timer--warning');
  if (timeRemaining <= 60)   el.classList.add('timer--danger');
}

/* ── Navigate Questions ──────────────────────────────────────── */
export function goToQuestion(index) {
  if (!session) return;
  session.index = Math.max(0, Math.min(index, session.questions.length - 1));
  renderQuestion();
  renderQuestionNav();
}

export function nextQuestion() { goToQuestion(session.index + 1); }
export function prevQuestion() { goToQuestion(session.index - 1); }

/* ── Answer ──────────────────────────────────────────────────── */
export function selectAnswer(optionIndex) {
  if (!session || session.submitted) return;
  const q = session.questions[session.index];
  q.userAnswer = optionIndex;
  renderQuestion();
  renderQuestionNav();
}

/* ── Flag / Unflag ───────────────────────────────────────────── */
export function toggleFlag() {
  if (!session) return;
  const q = session.questions[session.index];
  q.flagged = !q.flagged;
  renderQuestion();
  renderQuestionNav();
}

/* ── Submit ──────────────────────────────────────────────────── */
export function submitMock() {
  clearInterval(timerInterval);
  if (!session) return;

  session.submitted = true;
  session.endTime   = Date.now();

  const total   = session.questions.length;
  const correct = session.questions.filter(q => q.userAnswer === q.answer).length;
  const score   = Math.round((correct / total) * 100);
  const elapsed = Math.round((session.endTime - session.startTime) / 1000);

  const result = { sessionId: session.id, total, correct, score, elapsed, date: new Date().toISOString() };

  const results = store.get('mock.results') || [];
  store.replace('mock.results', [result, ...results].slice(0, 20));
  store.replace('mock.activeSession', null);

  if (score === 100) XP_ACTIONS.perfectMock();

  _hideEl('#mock-exam');
  renderResults(result);
}

/* ── Render: Setup ───────────────────────────────────────────── */
function renderSetup() {
  _showEl('#mock-setup');
  _hideEl('#mock-exam');
  _hideEl('#mock-results');
}

/* ── Render: Question ────────────────────────────────────────── */
function renderQuestion() {
  if (!session) return;
  const q   = session.questions[session.index];
  const idx = session.index;

  const bodyEl = $('#mock-q-body');
  if (bodyEl) bodyEl.textContent = q.question;

  const meta = $('#mock-q-meta');
  if (meta) meta.innerHTML = `
    <span class="badge badge--blue">${q.topic}</span>
    <span class="badge badge--neutral">${q.difficulty}</span>
    <span class="text-muted text-sm">#${idx + 1} of ${session.questions.length}</span>
  `;

  const optList = $('#mock-options');
  if (optList) {
    optList.innerHTML = q.options.map((opt, i) => `
      <button class="option ${q.userAnswer === i ? 'selected' : ''}"
        onclick="window.mockModule.selectAnswer(${i})">
        <span class="option__key">${String.fromCharCode(65 + i)}</span>
        <span>${opt}</span>
      </button>
    `).join('');
  }

  const flagBtn = $('#btn-flag');
  if (flagBtn) flagBtn.textContent = q.flagged ? '🚩 Flagged' : '🏳 Flag';
}

/* ── Render: Question Navigator ──────────────────────────────── */
function renderQuestionNav() {
  const nav = $('#mock-nav');
  if (!nav || !session) return;

  nav.innerHTML = session.questions.map((q, i) => {
    let cls = 'nav-dot';
    if (q.userAnswer !== null) cls += ' nav-dot--answered';
    if (q.flagged)             cls += ' nav-dot--flagged';
    if (i === session.index)   cls += ' nav-dot--active';
    return `<button class="${cls}" onclick="window.mockModule.goToQuestion(${i})" title="Q${i+1}">${i+1}</button>`;
  }).join('');
}

/* ── Render: Results ─────────────────────────────────────────── */
function renderResults(result) {
  const el = $('#mock-results');
  if (!el) return;
  _showEl('#mock-results');

  const passed = result.score >= EXAM_CONFIG.PASS_PERCENTAGE;
  el.innerHTML = `
    <div class="card" style="max-width:560px;margin:0 auto;text-align:center;">
      <div style="font-size:3rem;margin-bottom:var(--space-4)">${passed ? '🏆' : '📖'}</div>
      <h2 class="card__title" style="font-size:var(--text-2xl)">${result.score}% — ${passed ? 'Passed!' : 'Keep Practicing'}</h2>
      <p class="text-muted">${result.correct} / ${result.total} correct answers</p>
      <div class="progress" style="margin:var(--space-5) 0">
        <div class="progress__fill ${passed ? 'progress--success' : 'progress--danger'}" style="width:${result.score}%"></div>
      </div>
      <div class="page-header__actions" style="justify-content:center">
        <button class="btn btn--primary" onclick="window.mockModule.init()">Retake</button>
        <button class="btn btn--secondary" onclick="window.navigate('/')">Dashboard</button>
      </div>
    </div>
  `;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _showEl(sel) { const el = $(sel); if (el) el.style.display = 'block'; }
function _hideEl(sel) { const el = $(sel); if (el) el.style.display = 'none'; }

function _generateQuestions(n) {
  const topics = ['Mathematics', 'English', 'Reasoning', 'GK', 'Science'];
  const diffs  = ['easy', 'medium', 'hard'];
  return Array.from({ length: n }, (_, i) => ({
    id:          `mock_q${i}`,
    topic:       topics[i % topics.length],
    difficulty:  diffs[i % diffs.length],
    question:    `Sample mock question #${i + 1}: What is the answer to this question?`,
    options:     ['Option A', 'Option B', 'Option C', 'Option D'],
    answer:      Math.floor(Math.random() * 4),
    explanation: 'This is a placeholder explanation.',
  }));
}

/* ── Events ──────────────────────────────────────────────────── */
function bindEvents() {
  $('#btn-start-mock')?.addEventListener('click', () => {
    const mins = parseInt($('#select-duration')?.value || '60');
    startMock(mins);
  });

  $('#btn-submit-mock')?.addEventListener('click', () => {
    const unanswered = session?.questions.filter(q => q.userAnswer === null).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) return;
    }
    submitMock();
  });
}

/* ── Expose ──────────────────────────────────────────────────── */
window.mockModule = { init, selectAnswer, goToQuestion, nextQuestion, prevQuestion, toggleFlag, submitMock };

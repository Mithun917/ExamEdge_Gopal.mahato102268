/* ============================================================
   ExamEdge Pro — js/modules/exam.js
   Scheduled / proctored exam module
   ============================================================ */

import { store }        from '../state.js';
import { EXAM_CONFIG }  from '../config.js';
import { $, formatTime, showToast } from '../utils.js';
import { requireAuth }  from './auth.js';

export function init() {
  if (!requireAuth()) return;
  renderExamList();
  bindEvents();
}

/* ── Render Exam List ─────────────────────────────────────────── */
function renderExamList() {
  const container = $('#exam-list');
  if (!container) return;

  const exams = _getExams();
  container.innerHTML = exams.map(ex => `
    <div class="card card--hover" style="cursor:pointer" onclick="window.examModule.startExam('${ex.id}')">
      <div class="card__header">
        <div>
          <div class="card__title">${ex.name}</div>
          <div class="card__subtitle">${ex.questions} questions · ${ex.duration} mins</div>
        </div>
        <span class="badge badge--${ex.status === 'available' ? 'green' : 'neutral'}">${ex.status}</span>
      </div>
      <div class="progress" style="margin-top:var(--space-3)">
        <div class="progress__fill" style="width:${ex.progress}%"></div>
      </div>
    </div>
  `).join('');
}

/* ── Start Exam ──────────────────────────────────────────────── */
export function startExam(examId) {
  showToast(`Starting exam: ${examId}`, 'info');
  // Full exam session logic mirrors mock.js — extend as needed
}

function bindEvents() {
  // Future: exam schedule, countdown, etc.
}

function _getExams() {
  return [
    { id: 'ssc_cgl', name: 'SSC CGL Tier I', questions: 100, duration: 60, status: 'available', progress: 0 },
    { id: 'ibps_po', name: 'IBPS PO Prelim',  questions: 100, duration: 60, status: 'available', progress: 30 },
    { id: 'upsc_csat', name: 'UPSC CSAT',     questions: 80,  duration: 120, status: 'locked',   progress: 0 },
  ];
}

window.examModule = { init, startExam };

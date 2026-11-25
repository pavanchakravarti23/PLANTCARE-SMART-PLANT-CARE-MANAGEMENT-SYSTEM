/**
 * Module 3: Smart Care Scheduler & Calendar (Monthly, Weekly & Daily Task Views)
 */

import { deriveTaskComputedStatus } from '../services/engine.js';
import { store } from '../services/store.js';
import {
  addDaysLocal,
  formatDisplayDate,
  formatDisplayTime,
  formatRepeatInterval,
  getMonthGridDates,
  getTodayLocal,
  getWeekDates,
  parseLocalDate
} from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import { confirmDialog, iconSpan, mountIcons, showToast, statusBadgeHtml } from '../utils/ui.js';
import { openTaskFormModal } from './modals.js';

const calendarUiState = {
  viewMode: 'month', // 'month' | 'week'
  selectedDate: getTodayLocal(),
  cursorYear: new Date().getFullYear(),
  cursorMonth: new Date().getMonth()
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function renderCalendarView(container) {
  const state = store.getState();
  const todayStr = getTodayLocal();
  const plantMap = new Map(state.plants.map((p) => [p.id, p]));
  const { dateFormat, timeFormat } = state.settings.preferences;

  const tasksByDate = new Map();
  for (const task of state.tasks) {
    if (!plantMap.has(task.plantId)) continue;
    const computedStatus = deriveTaskComputedStatus(task, todayStr);
    const enriched = { ...task, plant: plantMap.get(task.plantId), computedStatus };
    if (!tasksByDate.has(task.dueDate)) tasksByDate.set(task.dueDate, []);
    tasksByDate.get(task.dueDate).push(enriched);
  }

  const selectedDayTasks = (tasksByDate.get(calendarUiState.selectedDate) || []).sort((a, b) =>
    (a.dueTime || '').localeCompare(b.dueTime || '')
  );

  const activeSchedules = state.tasks
    .filter((t) => t.status === 'pending' && plantMap.has(t.plantId))
    .map((t) => ({ ...t, plant: plantMap.get(t.plantId), computedStatus: deriveTaskComputedStatus(t, todayStr) }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const headingLabel =
    calendarUiState.viewMode === 'month'
      ? `${MONTH_NAMES[calendarUiState.cursorMonth]} ${calendarUiState.cursorYear}`
      : `Week of ${formatDisplayDate(getWeekDates(calendarUiState.selectedDate)[0], dateFormat)}`;

  container.innerHTML = `
    <div class="card" style="margin-bottom:20px;">
      <div class="calendar-header">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <button class="icon-btn" type="button" id="cal-prev-btn" aria-label="Previous period">
            ${iconSpan('chevron-left')}
          </button>
          <h2 style="font-size:1.15rem; min-width:170px; text-align:center;">${escapeHtml(headingLabel)}</h2>
          <button class="icon-btn" type="button" id="cal-next-btn" aria-label="Next period">
            ${iconSpan('chevron-right')}
          </button>
          <button class="btn btn-secondary btn-sm" type="button" id="cal-today-btn">Today</button>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div class="segmented-control" role="tablist" aria-label="Calendar view mode">
            <button class="segmented-btn ${calendarUiState.viewMode === 'month' ? 'is-active' : ''}"
              type="button" data-cal-mode="month">Monthly</button>
            <button class="segmented-btn ${calendarUiState.viewMode === 'week' ? 'is-active' : ''}"
              type="button" data-cal-mode="week">Weekly</button>
          </div>
          <button class="btn btn-primary btn-sm" type="button" id="cal-add-task-btn">
            ${iconSpan('plus')} Schedule Care
          </button>
        </div>
      </div>

      ${
        calendarUiState.viewMode === 'month'
          ? renderMonthGridHtml(tasksByDate, todayStr)
          : renderWeekGridHtml(tasksByDate, todayStr, dateFormat, timeFormat)
      }
    </div>

    <div class="grid-2">
      <section class="card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Daily Task List</h3>
            <p class="muted-text" style="margin:2px 0 0;">
              ${escapeHtml(formatDisplayDate(calendarUiState.selectedDate, dateFormat))}
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" id="cal-add-selected-date">
            ${iconSpan('plus')} Add on Day
          </button>
        </div>

        ${
          selectedDayTasks.length === 0
            ? `<p class="muted-text">No care tasks scheduled for ${escapeHtml(
                formatDisplayDate(calendarUiState.selectedDate, dateFormat)
              )}.</p>`
            : `<div class="task-list">
                ${selectedDayTasks
                  .map(
                    (t) => `
                    <div class="task-row">
                      <div class="task-row-main">
                        <div class="task-row-title">
                          <span>${escapeHtml(t.title)}</span>
                          ${statusBadgeHtml(t.computedStatus)}
                          ${t.paused ? `<span class="badge badge-skipped">Paused</span>` : ''}
                        </div>
                        <div class="task-row-sub">
                          <span>${escapeHtml(t.plant.name)}</span>
                          <span>${escapeHtml(formatDisplayTime(t.dueTime, timeFormat))}</span>
                          <span>${escapeHtml(formatRepeatInterval(t.repeatInterval, t.customIntervalDays))}</span>
                        </div>
                      </div>
                      <div class="task-row-actions">
                        ${
                          t.status === 'pending'
                            ? `<button class="btn btn-primary btn-sm" type="button" data-cal-complete="${escapeHtml(
                                t.id
                              )}">${iconSpan('check')} Done</button>`
                            : ''
                        }
                        <button class="icon-btn" type="button" title="Edit schedule" data-cal-edit="${escapeHtml(
                          t.id
                        )}">${iconSpan('pencil')}</button>
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>`
        }
      </section>

      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Active Schedules (${activeSchedules.length})</h3>
        </div>
        ${
          activeSchedules.length === 0
            ? `<p class="muted-text">No pending care schedules. Click "Schedule Care" to create a recurring routine.</p>`
            : `<div class="task-list">
                ${activeSchedules
                  .map(
                    (t) => `
                    <div class="task-row">
                      <div class="task-row-main">
                        <div class="task-row-title">
                          <span>${escapeHtml(t.title)}</span>
                          ${statusBadgeHtml(t.computedStatus)}
                          ${t.paused ? `<span class="badge badge-skipped">Paused</span>` : ''}
                        </div>
                        <div class="task-row-sub">
                          <span>${escapeHtml(t.plant.name)}</span>
                          <span>Due ${escapeHtml(formatDisplayDate(t.dueDate, dateFmtFallback(dateFormat)))}</span>
                          <span>${escapeHtml(formatRepeatInterval(t.repeatInterval, t.customIntervalDays))}</span>
                        </div>
                      </div>
                      <div class="task-row-actions">
                        ${
                          t.repeatInterval !== 'none'
                            ? `<button class="icon-btn" type="button" title="${
                                t.paused ? 'Resume recurring schedule' : 'Pause recurring schedule'
                              }" data-cal-pause="${escapeHtml(t.id)}">
                                ${iconSpan(t.paused ? 'play' : 'pause')}
                              </button>`
                            : ''
                        }
                        <button class="icon-btn" type="button" title="Edit schedule" data-cal-edit="${escapeHtml(
                          t.id
                        )}">${iconSpan('pencil')}</button>
                        <button class="icon-btn" type="button" title="Delete schedule" data-cal-delete="${escapeHtml(
                          t.id
                        )}">${iconSpan('trash-2')}</button>
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>`
        }
      </section>
    </div>
  `;

  mountIcons(container);

  container.querySelectorAll('[data-cal-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      calendarUiState.viewMode = btn.getAttribute('data-cal-mode');
      renderCalendarView(container);
    });
  });

  container.querySelector('#cal-prev-btn')?.addEventListener('click', () => {
    if (calendarUiState.viewMode === 'month') {
      calendarUiState.cursorMonth -= 1;
      if (calendarUiState.cursorMonth < 0) {
        calendarUiState.cursorMonth = 11;
        calendarUiState.cursorYear -= 1;
      }
    } else {
      calendarUiState.selectedDate = addDaysLocal(calendarUiState.selectedDate, -7);
      const parsed = parseLocalDate(calendarUiState.selectedDate);
      calendarUiState.cursorYear = parsed.getFullYear();
      calendarUiState.cursorMonth = parsed.getMonth();
    }
    renderCalendarView(container);
  });

  container.querySelector('#cal-next-btn')?.addEventListener('click', () => {
    if (calendarUiState.viewMode === 'month') {
      calendarUiState.cursorMonth += 1;
      if (calendarUiState.cursorMonth > 11) {
        calendarUiState.cursorMonth = 0;
        calendarUiState.cursorYear += 1;
      }
    } else {
      calendarUiState.selectedDate = addDaysLocal(calendarUiState.selectedDate, 7);
      const parsed = parseLocalDate(calendarUiState.selectedDate);
      calendarUiState.cursorYear = parsed.getFullYear();
      calendarUiState.cursorMonth = parsed.getMonth();
    }
    renderCalendarView(container);
  });

  container.querySelector('#cal-today-btn')?.addEventListener('click', () => {
    const now = new Date();
    calendarUiState.selectedDate = getTodayLocal(now);
    calendarUiState.cursorYear = now.getFullYear();
    calendarUiState.cursorMonth = now.getMonth();
    renderCalendarView(container);
  });

  container.querySelector('#cal-add-task-btn')?.addEventListener('click', () =>
    openTaskFormModal({ presetDueDate: calendarUiState.selectedDate })
  );
  container.querySelector('#cal-add-selected-date')?.addEventListener('click', () =>
    openTaskFormModal({ presetDueDate: calendarUiState.selectedDate })
  );

  container.querySelectorAll('[data-select-date]').forEach((cell) => {
    cell.addEventListener('click', () => {
      calendarUiState.selectedDate = cell.getAttribute('data-select-date');
      renderCalendarView(container);
    });
  });

  container.querySelectorAll('[data-cal-complete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = store.completeTask(btn.getAttribute('data-cal-complete'));
      if (res.changed) {
        showToast(`Completed (+${res.pointsAwarded} pts)`, 'success');
      }
    });
  });

  container.querySelectorAll('[data-cal-pause]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = store.togglePauseTask(btn.getAttribute('data-cal-pause'));
      showToast(updated.paused ? 'Recurring schedule paused.' : 'Recurring schedule resumed.', 'info');
    });
  });

  container.querySelectorAll('[data-cal-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openTaskFormModal({ taskId: btn.getAttribute('data-cal-edit') });
    });
  });

  container.querySelectorAll('[data-cal-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-cal-delete');
      const confirmed = await confirmDialog({
        title: 'Delete care schedule?',
        message: 'This scheduled care task will be permanently deleted.',
        confirmLabel: 'Delete',
        danger: true
      });
      if (confirmed) {
        store.deleteTask(id);
        showToast('Care schedule deleted.', 'info');
      }
    });
  });
}

function dateFmtFallback(fmt) {
  return fmt || 'DD MMM YYYY';
}

function renderMonthGridHtml(tasksByDate, todayStr) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cells = getMonthGridDates(calendarUiState.cursorYear, calendarUiState.cursorMonth);

  return `
    <div class="calendar-grid">
      ${weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join('')}
      ${cells
        .map((cell) => {
          const dayTasks = tasksByDate.get(cell.date) || [];
          const classes = [
            'calendar-cell',
            cell.inCurrentMonth ? '' : 'is-outside',
            cell.date === todayStr ? 'is-today' : '',
            cell.date === calendarUiState.selectedDate ? 'is-selected' : ''
          ]
            .filter(Boolean)
            .join(' ');

          return `
            <div class="${classes}" data-select-date="${escapeHtml(cell.date)}">
              <span class="calendar-day-num">${cell.day}</span>
              ${dayTasks
                .slice(0, 3)
                .map(
                  (t) =>
                    `<div class="calendar-chip ${escapeHtml(t.computedStatus)}" title="${escapeHtml(
                      t.title
                    )}">${escapeHtml(t.plant.name)}: ${escapeHtml(t.activityType)}</div>`
                )
                .join('')}
              ${
                dayTasks.length > 3
                  ? `<div class="muted-text" style="font-size:0.68rem;">+${dayTasks.length - 3} more</div>`
                  : ''
              }
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderWeekGridHtml(tasksByDate, todayStr, dateFormat, timeFormat) {
  const weekDates = getWeekDates(calendarUiState.selectedDate);
  return `
    <div class="week-grid">
      ${weekDates
        .map((dateStr) => {
          const dayTasks = (tasksByDate.get(dateStr) || []).sort((a, b) =>
            (a.dueTime || '').localeCompare(b.dueTime || '')
          );
          const parsed = parseLocalDate(dateStr);
          const dayLabel = parsed.toLocaleDateString('en-US', { weekday: 'short' });
          return `
            <div class="week-col ${dateStr === todayStr ? 'is-today' : ''}" data-select-date="${escapeHtml(
              dateStr
            )}">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${escapeHtml(dayLabel)}</strong>
                <span class="muted-text" style="font-size:0.75rem;">${escapeHtml(
                  formatDisplayDate(dateStr, dateFormat).slice(0, 6)
                )}</span>
              </div>
              ${
                dayTasks.length === 0
                  ? `<span class="muted-text" style="font-size:0.76rem;">No tasks</span>`
                  : dayTasks
                      .map(
                        (t) => `
                        <div class="calendar-chip ${escapeHtml(t.computedStatus)}" title="${escapeHtml(
                          t.title
                        )}">
                          ${escapeHtml(formatDisplayTime(t.dueTime, timeFormat))} · ${escapeHtml(t.plant.name)}
                        </div>
                      `
                      )
                      .join('')
              }
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

/**
 * Module 4: Priority-Based Reminder Engine UI
 * Displays tasks sorted by Priority (High = Overdue, Medium = Due Today, Normal = Upcoming),
 * Due Date, and Scheduled Time. Supports Complete, Snooze, Reschedule, Skip, and Web Notifications.
 */

import { getPrioritizedReminders } from '../services/engine.js';
import { NotificationService } from '../services/notification.js';
import { store } from '../services/store.js';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatRelativeDate,
  formatRepeatInterval,
  getTodayLocal
} from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import { iconSpan, mountIcons, showToast, statusBadgeHtml } from '../utils/ui.js';
import { openRescheduleModal, openTaskFormModal } from './modals.js';

const reminderUiState = {
  filter: 'active' // 'active' | 'overdue' | 'due_today' | 'upcoming' | 'resolved'
};

export function renderRemindersView(container) {
  const state = store.getState();
  const todayStr = getTodayLocal();
  const allPrioritized = getPrioritizedReminders(state, todayStr);
  const { dateFormat, timeFormat } = state.settings.preferences;

  const counts = {
    overdue: allPrioritized.filter((t) => t.computedStatus === 'overdue').length,
    due_today: allPrioritized.filter((t) => t.computedStatus === 'due_today').length,
    upcoming: allPrioritized.filter((t) => t.computedStatus === 'upcoming').length,
    resolved: allPrioritized.filter(
      (t) => t.computedStatus === 'completed' || t.computedStatus === 'skipped'
    ).length
  };

  const visibleTasks = allPrioritized.filter((t) => {
    if (reminderUiState.filter === 'active') {
      return t.computedStatus !== 'completed' && t.computedStatus !== 'skipped';
    }
    if (reminderUiState.filter === 'resolved') {
      return t.computedStatus === 'completed' || t.computedStatus === 'skipped';
    }
    return t.computedStatus === reminderUiState.filter;
  });

  const notifSupported = NotificationService.isSupported();
  const notifPerm = NotificationService.getPermission();

  container.innerHTML = `
    <div class="notice-banner ${counts.overdue > 0 ? 'is-warning' : ''}" style="margin-bottom:18px; justify-content:space-between; flex-wrap:wrap;">
      <div style="display:flex; gap:10px; align-items:flex-start;">
        ${iconSpan('bell-ring')}
        <div>
          <strong>Priority Reminder Engine</strong>
          <div class="muted-text">
            Sorted automatically by priority (High: Overdue, Medium: Due Today, Normal: Upcoming), then due date and time.
            ${
              notifSupported
                ? notifPerm === 'granted'
                  ? 'Browser notifications are permitted while PlantCare is open.'
                  : notifPerm === 'denied'
                    ? 'Browser notifications are blocked in browser settings; in-app reminders remain active.'
                    : 'Enable browser notifications for desktop alerts while PlantCare is open.'
                : 'This browser does not support Web Notifications; in-app reminders remain active.'
            }
          </div>
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        ${
          notifSupported && notifPerm === 'default'
            ? `<button class="btn btn-secondary btn-sm" type="button" id="rem-enable-notif">
                ${iconSpan('bell')} Enable Alerts
              </button>`
            : ''
        }
        <button class="btn btn-primary btn-sm" type="button" id="rem-add-schedule">
          ${iconSpan('plus')} New Reminder
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="segmented-control" role="tablist" aria-label="Filter reminders">
        <button class="segmented-btn ${reminderUiState.filter === 'active' ? 'is-active' : ''}"
          type="button" data-rem-filter="active">
          All Active (${counts.overdue + counts.due_today + counts.upcoming})
        </button>
        <button class="segmented-btn ${reminderUiState.filter === 'overdue' ? 'is-active' : ''}"
          type="button" data-rem-filter="overdue">
          High · Overdue (${counts.overdue})
        </button>
        <button class="segmented-btn ${reminderUiState.filter === 'due_today' ? 'is-active' : ''}"
          type="button" data-rem-filter="due_today">
          Medium · Today (${counts.due_today})
        </button>
        <button class="segmented-btn ${reminderUiState.filter === 'upcoming' ? 'is-active' : ''}"
          type="button" data-rem-filter="upcoming">
          Normal · Upcoming (${counts.upcoming})
        </button>
        <button class="segmented-btn ${reminderUiState.filter === 'resolved' ? 'is-active' : ''}"
          type="button" data-rem-filter="resolved">
          Completed / Skipped (${counts.resolved})
        </button>
      </div>
    </div>

    ${
      visibleTasks.length === 0
        ? `
          <div class="empty-state">
            <div class="empty-state-icon">${iconSpan('check-circle-2')}</div>
            <h3>No Reminders in This Queue</h3>
            <p>${
              reminderUiState.filter === 'active'
                ? 'You have no pending care reminders right now.'
                : 'Try switching tabs or scheduling a new care routine.'
            }</p>
            <button class="btn btn-primary" type="button" id="rem-empty-add">
              ${iconSpan('calendar-plus')} Schedule Care Activity
            </button>
          </div>
        `
        : `<div class="task-list">
            ${visibleTasks
              .map((task) => {
                const rowClass =
                  task.computedStatus === 'overdue'
                    ? 'is-overdue'
                    : task.computedStatus === 'due_today'
                      ? 'is-due-today'
                      : task.computedStatus === 'upcoming'
                        ? 'is-upcoming'
                        : '';
                const isPending = task.status === 'pending';

                return `
                  <article class="task-row ${rowClass}">
                    <div class="task-row-main">
                      <div class="task-row-title">
                        <span>${escapeHtml(task.title)}</span>
                        ${statusBadgeHtml(task.computedStatus)}
                        ${
                          isPending
                            ? `<span class="badge badge-neutral">${escapeHtml(task.priorityLabel)}</span>`
                            : ''
                        }
                      </div>
                      <div class="task-row-sub">
                        <span><strong>${escapeHtml(task.plant.name)}</strong> (${escapeHtml(
                          task.plant.location
                        )})</span>
                        <span>${escapeHtml(formatDisplayDate(task.dueDate, dateFormat))} (${escapeHtml(
                          formatRelativeDate(task.dueDate, todayStr)
                        )})</span>
                        <span>${escapeHtml(formatDisplayTime(task.dueTime, timeFormat))}</span>
                        <span>${escapeHtml(
                          formatRepeatInterval(task.repeatInterval, task.customIntervalDays)
                        )}</span>
                      </div>
                      ${
                        task.notes
                          ? `<p class="muted-text" style="margin:4px 0 0; font-size:0.82rem;">${escapeHtml(
                              task.notes
                            )}</p>`
                          : ''
                      }
                    </div>

                    <div class="task-row-actions">
                      ${
                        isPending
                          ? `
                            <button class="btn btn-primary btn-sm" type="button" data-rem-complete="${escapeHtml(
                              task.id
                            )}">
                              ${iconSpan('check')} Complete
                            </button>
                            <button class="btn btn-secondary btn-sm" type="button" data-rem-snooze="${escapeHtml(
                              task.id
                            )}" title="Snooze 1 day">
                              ${iconSpan('alarm-clock')} +1d
                            </button>
                            <button class="btn btn-secondary btn-sm" type="button" data-rem-reschedule="${escapeHtml(
                              task.id
                            )}">
                              Reschedule
                            </button>
                            <button class="btn btn-ghost btn-sm" type="button" data-rem-skip="${escapeHtml(
                              task.id
                            )}" title="Skip this cycle">
                              ${iconSpan('skip-forward')} Skip
                            </button>
                          `
                          : `
                            <span class="muted-text" style="font-size:0.78rem;">
                              ${
                                task.completedAt
                                  ? `Completed ${escapeHtml(
                                      formatDisplayDate(String(task.completedAt).slice(0, 10), dateFormat)
                                    )}`
                                  : 'Skipped'
                              }
                            </span>
                          `
                      }
                    </div>
                  </article>
                `;
              })
              .join('')}
          </div>`
    }
  `;

  mountIcons(container);

  container.querySelector('#rem-add-schedule')?.addEventListener('click', () => openTaskFormModal());
  container.querySelector('#rem-empty-add')?.addEventListener('click', () => openTaskFormModal());

  container.querySelector('#rem-enable-notif')?.addEventListener('click', async () => {
    const res = await NotificationService.requestPermission();
    if (res.granted) {
      store.updateSettings({ notificationsEnabled: true });
      showToast('Browser notifications enabled!', 'success');
    } else {
      showToast('Notification permission was not granted.', 'info');
    }
    renderRemindersView(container);
  });

  container.querySelectorAll('[data-rem-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      reminderUiState.filter = btn.getAttribute('data-rem-filter');
      renderRemindersView(container);
    });
  });

  container.querySelectorAll('[data-rem-complete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = store.completeTask(btn.getAttribute('data-rem-complete'));
      if (res.changed) {
        const nextMsg = res.nextDueDate ? ` Next due: ${res.nextDueDate}.` : '';
        const bonusMsg = res.bonusAwarded ? ` +${res.bonusAwarded} daily bonus!` : '';
        showToast(`Task completed (+${res.pointsAwarded} pts${bonusMsg}).${nextMsg}`, 'success');
      }
    });
  });

  container.querySelectorAll('[data-rem-snooze]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = store.snoozeTask(btn.getAttribute('data-rem-snooze'), 1);
      showToast(`Snoozed to ${updated.dueDate}.`, 'info');
    });
  });

  container.querySelectorAll('[data-rem-reschedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openRescheduleModal(btn.getAttribute('data-rem-reschedule'));
    });
  });

  container.querySelectorAll('[data-rem-skip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = store.skipTask(btn.getAttribute('data-rem-skip'));
      const nextMsg = res.nextDueDate ? ` Next cycle set for ${res.nextDueDate}.` : '';
      showToast(`Activity skipped (0 points awarded).${nextMsg}`, 'info');
    });
  });
}

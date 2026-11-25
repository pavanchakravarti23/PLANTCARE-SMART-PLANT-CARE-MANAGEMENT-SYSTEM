/**
 * Module 1: Dashboard
 * Displays welcome greeting, live metrics, weekly Chart.js progress,
 * upcoming & overdue tasks with one-click completion, recent activity,
 * and a helpful empty state for fresh installations.
 */

import Chart from 'chart.js/auto';
import { store } from '../services/store.js';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatLongHeaderDate,
  formatRelativeDate,
  getTodayLocal
} from '../utils/dateUtils.js';
import { escapeHtml, getGreeting } from '../utils/helpers.js';
import { iconSpan, mountIcons, showToast, statusBadgeHtml } from '../utils/ui.js';
import { openPlantFormModal, openTaskFormModal } from './modals.js';

let weeklyChartInstance = null;

export function destroyDashboardCharts() {
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
    weeklyChartInstance = null;
  }
}

export function renderDashboard(container, { navigate }) {
  destroyDashboardCharts();

  const state = store.getState();
  const todayStr = getTodayLocal();
  const metrics = store.getMetrics(todayStr);
  const { settings } = state;

  if (state.plants.length === 0) {
    container.innerHTML = `
      <section class="welcome-banner">
        <div>
          <h2>${escapeHtml(getGreeting())}, ${escapeHtml(settings.displayName)}</h2>
          <p>${escapeHtml(formatLongHeaderDate())} — Your botanical care workspace is ready.</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-primary" type="button" id="dash-empty-add">
            ${iconSpan('plus')} Add Your First Plant
          </button>
          <button class="btn btn-secondary" type="button" id="dash-empty-demo">
            ${iconSpan('sparkles')} Load Sample Garden
          </button>
        </div>
      </section>

      <div class="empty-state">
        <div class="empty-state-icon">${iconSpan('sprout')}</div>
        <h3>Start Your Smart Plant Care Routine</h3>
        <p>
          Add your first indoor or garden plant to track watering schedules, get priority reminders,
          log growth photos, and build consistent care streaks.
        </p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" id="dash-card-add">
            ${iconSpan('plus')} Add First Plant
          </button>
          <button class="btn btn-secondary" type="button" id="dash-card-demo">
            ${iconSpan('sparkles')} Load Demo Data (5 Plants)
          </button>
        </div>
      </div>
    `;

    mountIcons(container);

    const handleAdd = () => openPlantFormModal();
    const handleDemo = async () => {
      await store.loadDemoData();
      showToast('Loaded 5 sample plants and care tasks for demonstration.', 'success');
    };

    container.querySelector('#dash-empty-add')?.addEventListener('click', handleAdd);
    container.querySelector('#dash-card-add')?.addEventListener('click', handleAdd);
    container.querySelector('#dash-empty-demo')?.addEventListener('click', handleDemo);
    container.querySelector('#dash-card-demo')?.addEventListener('click', handleDemo);
    return;
  }

  const actionableTasks = metrics.prioritized
    .filter((t) => t.computedStatus !== 'completed' && t.computedStatus !== 'skipped')
    .slice(0, 6);

  const recentCompleted = [...state.tasks]
    .filter((t) => t.status === 'completed' && t.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
    .slice(0, 5);

  const plantMap = new Map(state.plants.map((p) => [p.id, p]));

  container.innerHTML = `
    <section class="welcome-banner">
      <div>
        <h2>${escapeHtml(getGreeting())}, ${escapeHtml(settings.displayName)}</h2>
        <p>${escapeHtml(formatLongHeaderDate())} — ${
          metrics.overdueCount > 0
            ? `${metrics.overdueCount} overdue and ${metrics.dueTodayCount} due today need attention.`
            : metrics.dueTodayCount > 0
              ? `You have ${metrics.dueTodayCount} care ${
                  metrics.dueTodayCount === 1 ? 'activity' : 'activities'
                } due today.`
              : 'All caught up for today. Your garden is on schedule.'
        }</p>
      </div>
      <div class="banner-actions">
        <button class="btn btn-secondary" type="button" id="dash-quick-schedule">
          ${iconSpan('calendar-plus')} Quick Schedule Task
        </button>
        <button class="btn btn-primary" type="button" id="dash-quick-add">
          ${iconSpan('plus')} Quick Add Plant
        </button>
      </div>
    </section>

    <section class="kpi-grid" aria-label="Dashboard Summary Metrics">
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Total Plants</span>
          <div class="kpi-value">${metrics.totalPlants}</div>
          <div class="kpi-meta">${metrics.rewardsSummary.currentStreak}-day current streak</div>
        </div>
        <div class="kpi-icon">${iconSpan('sprout')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Tasks Due Today</span>
          <div class="kpi-value">${metrics.dueTodayCount}</div>
          <div class="kpi-meta">Medium priority queue</div>
        </div>
        <div class="kpi-icon is-warning">${iconSpan('clock')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Overdue Tasks</span>
          <div class="kpi-value">${metrics.overdueCount}</div>
          <div class="kpi-meta">${metrics.overdueCount > 0 ? 'High priority attention' : 'Zero overdue'}</div>
        </div>
        <div class="kpi-icon is-danger">${iconSpan('alert-triangle')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Completed Tasks</span>
          <div class="kpi-value">${metrics.completedCount}</div>
          <div class="kpi-meta">${metrics.rewardsSummary.totalPoints} reward points</div>
        </div>
        <div class="kpi-icon is-success">${iconSpan('check-circle-2')}</div>
      </div>
    </section>

    <section class="dashboard-split">
      <div class="card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Weekly Care Progress</h3>
            <p class="muted-text" style="margin:2px 0 0;">
              ${metrics.weeklyCompleted} completed vs ${metrics.weeklyDue} scheduled in the last 7 days (${metrics.weeklyCompletionRate}%)
            </p>
          </div>
          <span class="badge badge-upcoming">${metrics.weeklyCompletionRate}% rate</span>
        </div>
        <div class="progress-track" style="margin-bottom: 16px;">
          <div class="progress-fill" style="width: ${metrics.weeklyCompletionRate}%;"></div>
        </div>
        <div class="chart-wrap">
          <canvas id="dashboard-weekly-chart" aria-label="Weekly care completion chart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <h3 class="section-title">Upcoming Care Activities</h3>
          <button class="btn btn-ghost btn-sm" type="button" id="dash-view-reminders">
            View all
          </button>
        </div>
        ${
          actionableTasks.length === 0
            ? `<p class="muted-text">No pending care activities right now. Schedule a watering or fertilising routine.</p>`
            : `<div class="task-list">
                ${actionableTasks
                  .map(
                    (task) => `
                    <div class="task-row is-${
                      task.computedStatus === 'overdue'
                        ? 'overdue'
                        : task.computedStatus === 'due_today'
                          ? 'due-today'
                          : 'upcoming'
                    }">
                      <div class="task-row-main">
                        <div class="task-row-title">
                          <span>${escapeHtml(task.title)}</span>
                          ${statusBadgeHtml(task.computedStatus)}
                        </div>
                        <div class="task-row-sub">
                          <span>${escapeHtml(task.plant?.name || 'Plant')}</span>
                          <span>${escapeHtml(formatRelativeDate(task.dueDate, todayStr))}</span>
                          <span>${escapeHtml(formatDisplayTime(task.dueTime, settings.preferences.timeFormat))}</span>
                        </div>
                      </div>
                      <div class="task-row-actions">
                        <button class="btn btn-primary btn-sm" type="button" data-complete-task="${escapeHtml(task.id)}">
                          ${iconSpan('check')} Done
                        </button>
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>`
        }
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h3 class="section-title">Recent Plant Activity</h3>
        <button class="btn btn-ghost btn-sm" type="button" id="dash-view-insights">Care Insights</button>
      </div>
      ${
        recentCompleted.length === 0
          ? `<p class="muted-text">No completed activities recorded yet. Complete a task above to earn +10 reward points.</p>`
          : `<div class="task-list">
              ${recentCompleted
                .map((task) => {
                  const plant = plantMap.get(task.plantId);
                  const completedDate = String(task.completedAt).slice(0, 10);
                  return `
                    <div class="task-row">
                      <div class="task-row-main">
                        <div class="task-row-title">
                          <span>${escapeHtml(task.title)}</span>
                          <span class="badge badge-completed">Completed</span>
                        </div>
                        <div class="task-row-sub">
                          <span>${escapeHtml(plant?.name || 'Plant')} (${escapeHtml(task.activityType)})</span>
                          <span>Logged ${escapeHtml(formatDisplayDate(completedDate, settings.preferences.dateFormat))}</span>
                        </div>
                      </div>
                      ${
                        task.nextDueDate
                          ? `<span class="badge badge-neutral">Next: ${escapeHtml(
                              formatDisplayDate(task.nextDueDate, settings.preferences.dateFormat)
                            )}</span>`
                          : ''
                      }
                    </div>
                  `;
                })
                .join('')}
            </div>`
      }
    </section>
  `;

  mountIcons(container);

  container.querySelector('#dash-quick-add')?.addEventListener('click', () => openPlantFormModal());
  container.querySelector('#dash-quick-schedule')?.addEventListener('click', () => openTaskFormModal());
  container.querySelector('#dash-view-reminders')?.addEventListener('click', () => navigate('reminders'));
  container.querySelector('#dash-view-insights')?.addEventListener('click', () => navigate('insights'));

  container.querySelectorAll('[data-complete-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const taskId = btn.getAttribute('data-complete-task');
      const res = store.completeTask(taskId);
      if (res.changed) {
        const bonusNote = res.bonusAwarded ? ` +${res.bonusAwarded} daily bonus!` : '';
        showToast(`Task completed (+${res.pointsAwarded} pts${bonusNote})`, 'success');
      }
    });
  });

  // Render Chart.js weekly bar chart
  const canvas = container.querySelector('#dashboard-weekly-chart');
  const chartCtx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (chartCtx) {
    const labels = metrics.weeklySeries.map((d) =>
      formatDisplayDate(d.date, settings.preferences.dateFormat).slice(0, 6)
    );
    weeklyChartInstance = new Chart(chartCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completed',
            data: metrics.weeklySeries.map((d) => d.completed),
            backgroundColor: '#244C3A',
            borderRadius: 6
          },
          {
            label: 'Scheduled Due',
            data: metrics.weeklySeries.map((d) => d.due),
            backgroundColor: '#C8DAC9',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, color: '#242A26' } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#6C746D' },
            grid: { color: '#EEF1EA' }
          },
          x: {
            ticks: { color: '#6C746D' },
            grid: { display: false }
          }
        }
      }
    });
  }
}

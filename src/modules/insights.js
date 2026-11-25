/**
 * Module 8: Care Insights
 * Real-data analytics powered by Chart.js showing weekly completion rates,
 * monthly activity trends, plant-wise care summaries, and useful empty states.
 */

import Chart from 'chart.js/auto';
import { store } from '../services/store.js';
import { formatDisplayDate, getLastNDates, getTodayLocal } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import { iconSpan, mountIcons } from '../utils/ui.js';

let insightsCharts = [];

export function destroyInsightsCharts() {
  for (const ch of insightsCharts) {
    ch.destroy();
  }
  insightsCharts = [];
}

export function renderInsightsView(container, { navigate }) {
  destroyInsightsCharts();

  const state = store.getState();
  const todayStr = getTodayLocal();
  const metrics = store.getMetrics(todayStr);
  const dateFormat = state.settings.preferences.dateFormat;

  if (state.plants.length === 0 && state.tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${iconSpan('bar-chart-3')}</div>
        <h3>Not Enough Care Data Yet</h3>
        <p>Add plants and complete care tasks to see your weekly completion rate, monthly activity trends, and plant-wise summaries.</p>
        <button class="btn btn-primary" type="button" id="insights-go-plants">Go to My Plants</button>
      </div>
    `;
    mountIcons(container);
    container.querySelector('#insights-go-plants')?.addEventListener('click', () => navigate('plants'));
    return;
  }

  // Last 30 days activity trend
  const last30 = getLastNDates(30, todayStr);
  const monthlySeries = last30.map((d) => ({
    date: d,
    completed: state.tasks.filter(
      (t) => t.status === 'completed' && String(t.completedAt || '').slice(0, 10) === d
    ).length
  }));

  container.innerHTML = `
    <section class="kpi-grid">
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Registered Plants</span>
          <div class="kpi-value">${metrics.totalPlants}</div>
          <div class="kpi-meta">${state.growthEntries.length} growth diary logs</div>
        </div>
        <div class="kpi-icon">${iconSpan('sprout')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Completed Activities</span>
          <div class="kpi-value">${metrics.completedCount}</div>
          <div class="kpi-meta">${metrics.weeklyCompletionRate}% weekly rate</div>
        </div>
        <div class="kpi-icon is-success">${iconSpan('check-circle-2')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Pending Activities</span>
          <div class="kpi-value">${metrics.pendingCount}</div>
          <div class="kpi-meta">${metrics.overdueCount} overdue</div>
        </div>
        <div class="kpi-icon is-warning">${iconSpan('clock')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Reward Points</span>
          <div class="kpi-value">${metrics.rewardsSummary.totalPoints}</div>
          <div class="kpi-meta">${metrics.rewardsSummary.currentStreak}-day streak</div>
        </div>
        <div class="kpi-icon">${iconSpan('award')}</div>
      </div>
    </section>

    <div class="grid-2" style="margin-bottom:20px;">
      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Weekly Completion Rate</h3>
          <span class="badge badge-upcoming">${metrics.weeklyCompletionRate}%</span>
        </div>
        <div class="chart-wrap">
          <canvas id="insights-weekly-chart"></canvas>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <h3 class="section-title">30-Day Care Activity</h3>
          <span class="muted-text" style="font-size:0.8rem;">Daily completed tasks</span>
        </div>
        <div class="chart-wrap">
          <canvas id="insights-monthly-chart"></canvas>
        </div>
      </section>
    </div>

    <div class="grid-2">
      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Plant-Wise Activity Chart</h3>
        </div>
        ${
          metrics.plantSummary.length === 0
            ? `<p class="muted-text">Add plants to compare care activity across your collection.</p>`
            : `<div class="chart-wrap"><canvas id="insights-plant-chart"></canvas></div>`
        }
      </section>

      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Plant-Wise Summary</h3>
        </div>
        ${
          metrics.plantSummary.length === 0
            ? `<p class="muted-text">No registered plants yet.</p>`
            : `<div class="task-list">
                ${metrics.plantSummary
                  .map(
                    (row) => `
                    <div class="task-row">
                      <div class="task-row-main">
                        <div class="task-row-title">${escapeHtml(row.plantName)}</div>
                        <div class="task-row-sub">
                          <span>${row.completed} completed</span>
                          <span>${row.pending} pending</span>
                          <span>${row.growthCount} diary logs</span>
                        </div>
                      </div>
                      <span class="badge badge-neutral">${row.completed + row.pending} total</span>
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

  const weeklyCanvas = container.querySelector('#insights-weekly-chart');
  const weeklyCtx =
    weeklyCanvas && typeof weeklyCanvas.getContext === 'function' ? weeklyCanvas.getContext('2d') : null;
  if (weeklyCtx) {
    insightsCharts.push(
      new Chart(weeklyCtx, {
        type: 'bar',
        data: {
          labels: metrics.weeklySeries.map((d) => formatDisplayDate(d.date, dateFormat).slice(0, 6)),
          datasets: [
            {
              label: 'Completed',
              data: metrics.weeklySeries.map((d) => d.completed),
              backgroundColor: '#244C3A',
              borderRadius: 6
            },
            {
              label: 'Due',
              data: metrics.weeklySeries.map((d) => d.due),
              backgroundColor: '#D6E2D5',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );
  }

  const monthlyCanvas = container.querySelector('#insights-monthly-chart');
  const monthlyCtx =
    monthlyCanvas && typeof monthlyCanvas.getContext === 'function' ? monthlyCanvas.getContext('2d') : null;
  if (monthlyCtx) {
    insightsCharts.push(
      new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: monthlySeries.map((d, i) => (i % 5 === 0 || i === 29 ? d.date.slice(5) : '')),
          datasets: [
            {
              label: 'Completed Tasks',
              data: monthlySeries.map((d) => d.completed),
              borderColor: '#244C3A',
              backgroundColor: 'rgba(143, 175, 145, 0.25)',
              fill: true,
              tension: 0.3,
              pointRadius: 2.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );
  }

  const plantCanvas = container.querySelector('#insights-plant-chart');
  const plantCtx =
    plantCanvas && typeof plantCanvas.getContext === 'function' ? plantCanvas.getContext('2d') : null;
  if (plantCtx && metrics.plantSummary.length > 0) {
    insightsCharts.push(
      new Chart(plantCtx, {
        type: 'bar',
        data: {
          labels: metrics.plantSummary.map((p) => p.plantName),
          datasets: [
            {
              label: 'Completed',
              data: metrics.plantSummary.map((p) => p.completed),
              backgroundColor: '#244C3A',
              borderRadius: 5
            },
            {
              label: 'Pending',
              data: metrics.plantSummary.map((p) => p.pending),
              backgroundColor: '#8FAF91',
              borderRadius: 5
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      })
    );
  }
}

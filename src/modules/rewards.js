/**
 * Module 7: Rewards and Streaks
 * Displays total points, real completion-based daily streaks,
 * monthly consistency progress, achievement badges, and reward history.
 */

import { calculateRewardsSummary } from '../services/engine.js';
import { store } from '../services/store.js';
import { formatDisplayDate, getTodayLocal } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import { iconSpan, mountIcons } from '../utils/ui.js';

export function renderRewardsView(container) {
  const state = store.getState();
  const summary = calculateRewardsSummary(state, getTodayLocal());
  const dateFormat = state.settings.preferences.dateFormat;

  const monthlyPct =
    summary.monthlyScheduledCount > 0
      ? Math.min(100, Math.round((summary.monthlyCompletedCount / summary.monthlyScheduledCount) * 100))
      : summary.monthlyCompletedCount > 0
        ? 100
        : 0;

  container.innerHTML = `
    <section class="kpi-grid">
      <div class="kpi-card">
        <div>
          <span class="kpi-label">Total Reward Points</span>
          <div class="kpi-value">${summary.totalPoints}</div>
          <div class="kpi-meta">+10 per completed care task</div>
        </div>
        <div class="kpi-icon">${iconSpan('award')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Current Care Streak</span>
          <div class="kpi-value">${summary.currentStreak}d</div>
          <div class="kpi-meta">Best streak: ${summary.longestStreak} days</div>
        </div>
        <div class="kpi-icon is-warning">${iconSpan('flame')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Weekly Consistency</span>
          <div class="kpi-value">${summary.weeklyActiveDays}/7</div>
          <div class="kpi-meta">Active days in last 7 days</div>
        </div>
        <div class="kpi-icon is-success">${iconSpan('sun')}</div>
      </div>

      <div class="kpi-card">
        <div>
          <span class="kpi-label">Badges Unlocked</span>
          <div class="kpi-value">${summary.badges.filter((b) => b.unlocked).length}/${
            summary.badges.length
          }</div>
          <div class="kpi-meta">Milestone achievements</div>
        </div>
        <div class="kpi-icon">${iconSpan('trophy')}</div>
      </div>
    </section>

    <section class="card" style="margin-bottom:20px;">
      <div class="section-header">
        <div>
          <h3 class="section-title">Monthly Care Progress</h3>
          <p class="muted-text" style="margin:2px 0 0;">
            ${summary.monthlyCompletedCount} completed out of ${summary.monthlyScheduledCount} scheduled tasks this month.
          </p>
        </div>
        <span class="badge badge-upcoming">${monthlyPct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${monthlyPct}%;"></div>
      </div>
      <p class="muted-text" style="margin:10px 0 0; font-size:0.8rem;">
        Points are awarded strictly upon real task completion (+10 pts) and finishing all tasks due on a day (+20 bonus pts).
        Skipped or overdue tasks earn zero points unless completed.
      </p>
    </section>

    <section class="card" style="margin-bottom:20px;">
      <div class="section-header">
        <h3 class="section-title">Achievement Badges</h3>
      </div>
      <div class="badges-grid">
        ${summary.badges
          .map(
            (badge) => `
            <article class="badge-card ${badge.unlocked ? '' : 'is-locked'}">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div class="badge-card-icon">${iconSpan(badge.icon)}</div>
                <span class="badge ${badge.unlocked ? 'badge-completed' : 'badge-neutral'}">
                  ${badge.unlocked ? 'Unlocked' : `${badge.progress}/${badge.target}`}
                </span>
              </div>
              <strong style="font-size:0.96rem;">${escapeHtml(badge.title)}</strong>
              <span class="muted-text" style="font-size:0.82rem;">${escapeHtml(badge.description)}</span>
            </article>
          `
          )
          .join('')}
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h3 class="section-title">Reward Points History (${summary.history.length})</h3>
      </div>
      ${
        summary.history.length === 0
          ? `<p class="muted-text">No reward points earned yet. Complete your first scheduled task to earn +10 points.</p>`
          : `<div class="task-list">
              ${summary.history
                .map(
                  (item) => `
                  <div class="task-row">
                    <div class="task-row-main">
                      <div class="task-row-title">${escapeHtml(item.reason)}</div>
                      <div class="task-row-sub">
                        <span>Awarded ${escapeHtml(
                          formatDisplayDate(String(item.awardedAt).slice(0, 10), dateFormat)
                        )}</span>
                      </div>
                    </div>
                    <span class="badge badge-completed">+${escapeHtml(item.points)} pts</span>
                  </div>
                `
                )
                .join('')}
            </div>`
      }
    </section>
  `;

  mountIcons(container);
}

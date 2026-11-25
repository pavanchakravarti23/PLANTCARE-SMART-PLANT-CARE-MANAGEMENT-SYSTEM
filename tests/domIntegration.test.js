import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderDashboard } from '../src/modules/dashboard.js';
import { renderGrowthDiaryView } from '../src/modules/growth.js';
import { renderInsightsView } from '../src/modules/insights.js';
import { renderPlantsView } from '../src/modules/plants.js';
import { renderRecommendationsView } from '../src/modules/recommendations.js';
import { renderRemindersView } from '../src/modules/reminders.js';
import { renderRewardsView } from '../src/modules/rewards.js';
import { renderCalendarView } from '../src/modules/scheduler.js';
import { renderSettingsView } from '../src/modules/settings.js';
import { store } from '../src/services/store.js';

function loadAppShellDom() {
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  document.documentElement.innerHTML = html;
}

describe('DOM Integration — All 9 Modules & User Flows', () => {
  beforeEach(async () => {
    localStorage.clear();
    loadAppShellDom();
    await store.resetAllData();
  });

  it('renders empty state on fresh installation and loads demo data cleanly', async () => {
    const main = document.getElementById('main-content');
    const navigate = () => {};

    renderDashboard(main, { navigate });
    expect(main.textContent).toContain('Start Your Smart Plant Care Routine');

    await store.loadDemoData();
    renderDashboard(main, { navigate });
    expect(main.textContent).toContain('Total Plants');
    expect(main.textContent).toContain('5');
    expect(main.textContent).toContain('Weekly Care Progress');
  });

  it('renders all 9 modules with demo data without runtime errors and reflects live updates', async () => {
    await store.loadDemoData();
    const main = document.getElementById('main-content');
    const navigate = () => {};

    // Plants view + search filter
    renderPlantsView(main, { navigate });
    expect(main.textContent).toContain('Tulsi');
    expect(main.textContent).toContain('Snake Plant');

    // Care Calendar (Monthly & Weekly)
    renderCalendarView(main, { navigate });
    expect(main.textContent).toContain('Daily Task List');
    main.querySelector('[data-cal-mode="week"]')?.click();
    expect(main.querySelector('.week-grid')).not.toBeNull();

    // Reminders + task completion updates rewards
    renderRemindersView(main, { navigate });
    expect(main.textContent).toContain('Priority Reminder Engine');
    const beforePoints = store.getMetrics().rewardsSummary.totalPoints;
    const completeBtn = main.querySelector('[data-rem-complete]');
    expect(completeBtn).not.toBeNull();
    completeBtn.click();
    const afterPoints = store.getMetrics().rewardsSummary.totalPoints;
    expect(afterPoints).toBeGreaterThan(beforePoints);

    // Growth Diary + Before/After comparison
    renderGrowthDiaryView(main, { navigate });
    expect(main.textContent).toContain('Before & After Comparison');
    expect(main.querySelectorAll('.compare-card')).toHaveLength(2);

    // Recommendations
    renderRecommendationsView(main, { navigate });
    expect(main.textContent).toContain('Rule-Based General Guidance');
    expect(main.textContent).toContain('Ocimum tenuiflorum');

    // Rewards
    renderRewardsView(main, { navigate });
    expect(main.textContent).toContain('Achievement Badges');
    expect(main.textContent).toContain('7-Day Care Streak');

    // Insights
    renderInsightsView(main, { navigate });
    expect(main.textContent).toContain('Weekly Completion Rate');
    expect(main.textContent).toContain('Plant-Wise Summary');

    // Settings + JSON export bundle
    renderSettingsView(main, { navigate });
    expect(main.textContent).toContain('Local Browser Storage Notice');
    const bundle = await store.exportBundle();
    expect(bundle.app).toBe('PlantCare');
    expect(bundle.data.plants).toHaveLength(5);

    // Import bundle back into clean store
    await store.resetAllData();
    expect(store.getState().plants).toHaveLength(0);
    await store.importBundle(bundle);
    expect(store.getState().plants).toHaveLength(5);
  });
});

/**
 * PlantCare Application Entry Point & Router
 */

import './styles/main.css';
import './styles/components.css';
import './styles/responsive.css';

import { destroyDashboardCharts, renderDashboard } from './modules/dashboard.js';
import { renderGrowthDiaryView } from './modules/growth.js';
import { destroyInsightsCharts, renderInsightsView } from './modules/insights.js';
import { openPlantFormModal, openTaskFormModal } from './modules/modals.js';
import { renderPlantsView } from './modules/plants.js';
import { renderRecommendationsView } from './modules/recommendations.js';
import { renderRemindersView } from './modules/reminders.js';
import { renderRewardsView } from './modules/rewards.js';
import { renderCalendarView } from './modules/scheduler.js';
import { renderSettingsView } from './modules/settings.js';
import { store } from './services/store.js';
import { formatLongHeaderDate } from './utils/dateUtils.js';
import { closeModal, mountIcons, showToast } from './utils/ui.js';

const ROUTE_TITLES = {
  dashboard: 'Dashboard',
  plants: 'My Plants',
  calendar: 'Care Calendar',
  reminders: 'Reminders',
  growth: 'Growth Diary',
  recommendations: 'Recommendations',
  rewards: 'Rewards & Streaks',
  insights: 'Care Insights',
  settings: 'Settings'
};

function navigate(route) {
  const target = ROUTE_TITLES[route] ? route : 'dashboard';
  store.activeRoute = target;
  if (target !== 'plants') {
    store.selectedPlantId = null;
  }
  if (window.location.hash !== `#${target}`) {
    history.replaceState(null, '', `#${target}`);
  }
  closeMobileSidebar();
  renderCurrentView();
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.remove('is-open');
  if (backdrop) backdrop.hidden = true;
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.add('is-open');
  if (backdrop) backdrop.hidden = false;
}

function syncChrome() {
  const state = store.getState();
  const metrics = store.getMetrics();
  const route = store.activeRoute;

  document.body.classList.toggle('theme-soft-sage', state.settings.theme === 'soft-sage');

  const titleEl = document.getElementById('topbar-title');
  const dateEl = document.getElementById('topbar-date');
  if (titleEl) titleEl.textContent = ROUTE_TITLES[route] || 'Dashboard';
  if (dateEl) dateEl.textContent = formatLongHeaderDate();

  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('data-nav') === route);
  });

  const plantsBadge = document.getElementById('nav-badge-plants');
  if (plantsBadge) {
    plantsBadge.textContent = String(metrics.totalPlants);
    plantsBadge.hidden = metrics.totalPlants === 0;
  }

  const urgentCount = metrics.overdueCount + metrics.dueTodayCount;
  const remBadge = document.getElementById('nav-badge-reminders');
  const topRemBadge = document.getElementById('topbar-reminder-badge');
  if (remBadge) {
    remBadge.textContent = String(urgentCount);
    remBadge.hidden = urgentCount === 0;
  }
  if (topRemBadge) {
    topRemBadge.textContent = String(urgentCount);
    topRemBadge.hidden = urgentCount === 0;
  }

  const demoStatus = document.getElementById('sidebar-demo-status');
  if (demoStatus) {
    demoStatus.textContent = state.meta?.demoLoaded ? 'Demo garden active' : 'Private to this device';
  }
}

function renderCurrentView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  destroyDashboardCharts();
  destroyInsightsCharts();
  syncChrome();

  const ctx = { navigate };
  switch (store.activeRoute) {
    case 'plants':
      renderPlantsView(container, ctx);
      break;
    case 'calendar':
      renderCalendarView(container, ctx);
      break;
    case 'reminders':
      renderRemindersView(container, ctx);
      break;
    case 'growth':
      renderGrowthDiaryView(container, ctx);
      break;
    case 'recommendations':
      renderRecommendationsView(container, ctx);
      break;
    case 'rewards':
      renderRewardsView(container, ctx);
      break;
    case 'insights':
      renderInsightsView(container, ctx);
      break;
    case 'settings':
      renderSettingsView(container, ctx);
      break;
    case 'dashboard':
    default:
      renderDashboard(container, ctx);
      break;
  }
}

function initApp() {
  mountIcons(document);

  if (store.recoveredFromCorruption) {
    showToast('Corrupted local storage data was safely reset to a clean state.', 'error');
  }

  const hashRoute = window.location.hash.replace(/^#/, '');
  if (ROUTE_TITLES[hashRoute]) {
    store.activeRoute = hashRoute;
  }

  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-nav'));
    });
  });

  document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-close-btn')?.addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeMobileSidebar);

  document.getElementById('topbar-add-plant-btn')?.addEventListener('click', () => openPlantFormModal());
  document.getElementById('topbar-schedule-btn')?.addEventListener('click', () => openTaskFormModal());
  document.getElementById('topbar-reminder-btn')?.addEventListener('click', () => navigate('reminders'));

  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  window.addEventListener('hashchange', () => {
    const next = window.location.hash.replace(/^#/, '');
    if (ROUTE_TITLES[next] && next !== store.activeRoute) {
      store.activeRoute = next;
      renderCurrentView();
    }
  });

  store.subscribe(() => {
    renderCurrentView();
  });

  renderCurrentView();
  store.triggerStartupNotificationCheck();
}

document.addEventListener('DOMContentLoaded', initApp);

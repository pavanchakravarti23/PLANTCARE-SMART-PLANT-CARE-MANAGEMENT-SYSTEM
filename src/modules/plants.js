/**
 * Module 2: Plant Management (CRUD, Search, Filters, Location Grouping & Plant Detail View)
 */

import { PLANT_CATEGORIES, PLANT_LOCATIONS } from '../data/plantDatabase.js';
import { getNextTaskForPlant } from '../services/engine.js';
import { store } from '../services/store.js';
import { formatDisplayDate, formatRelativeDate, getTodayLocal } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import {
  confirmDialog,
  hydrateAsyncImages,
  iconSpan,
  mountIcons,
  showToast,
  statusBadgeHtml
} from '../utils/ui.js';
import { openGrowthEntryModal, openPlantFormModal, openTaskFormModal } from './modals.js';

const filterState = {
  search: '',
  category: 'all',
  location: 'all'
};

export function renderPlantsView(container, { navigate }) {
  const state = store.getState();

  if (store.selectedPlantId) {
    const selectedPlant = state.plants.find((p) => p.id === store.selectedPlantId);
    if (selectedPlant) {
      renderPlantDetails(container, selectedPlant, { navigate });
      return;
    }
    store.selectedPlantId = null;
  }

  const todayStr = getTodayLocal();
  const filteredPlants = state.plants.filter((plant) => {
    const q = filterState.search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      plant.name.toLowerCase().includes(q) ||
      (plant.type && plant.type.toLowerCase().includes(q)) ||
      plant.location.toLowerCase().includes(q) ||
      plant.category.toLowerCase().includes(q);
    const matchesCat = filterState.category === 'all' || plant.category === filterState.category;
    const matchesLoc = filterState.location === 'all' || plant.location === filterState.location;
    return matchesSearch && matchesCat && matchesLoc;
  });

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <div class="search-box">
          <span class="search-icon">${iconSpan('search')}</span>
          <input class="form-control" id="plants-search" type="search"
            placeholder="Search plants by name, variety, or room..."
            value="${escapeHtml(filterState.search)}" aria-label="Search plants" />
        </div>

        <select class="form-control" id="plants-filter-category" style="width:auto;" aria-label="Filter by category">
          <option value="all">All Categories</option>
          ${PLANT_CATEGORIES.map(
            (cat) =>
              `<option value="${escapeHtml(cat)}" ${
                filterState.category === cat ? 'selected' : ''
              }>${escapeHtml(cat)}</option>`
          ).join('')}
        </select>

        <select class="form-control" id="plants-filter-location" style="width:auto;" aria-label="Filter by location">
          <option value="all">All Locations</option>
          ${PLANT_LOCATIONS.map(
            (loc) =>
              `<option value="${escapeHtml(loc)}" ${
                filterState.location === loc ? 'selected' : ''
              }>${escapeHtml(loc)}</option>`
          ).join('')}
        </select>
      </div>

      <button class="btn btn-primary" type="button" id="plants-add-btn">
        ${iconSpan('plus')} Add Plant
      </button>
    </div>

    ${
      state.plants.length === 0
        ? `
          <div class="empty-state">
            <div class="empty-state-icon">${iconSpan('sprout')}</div>
            <h3>No Plants Registered Yet</h3>
            <p>Add your first plant with its watering interval, sunlight preference, and photo.</p>
            <button class="btn btn-primary" type="button" id="plants-empty-add">
              ${iconSpan('plus')} Add Your First Plant
            </button>
          </div>
        `
        : filteredPlants.length === 0
          ? `
            <div class="empty-state">
              <div class="empty-state-icon">${iconSpan('search')}</div>
              <h3>No Matching Plants</h3>
              <p>Try clearing your search query or switching category/location filters.</p>
              <button class="btn btn-secondary" type="button" id="plants-clear-filters">Reset Filters</button>
            </div>
          `
          : `
            <div class="plant-grid">
              ${filteredPlants
                .map((plant) => {
                  const nextTask = getNextTaskForPlant(state, plant.id, todayStr);
                  return `
                    <article class="plant-card card-interactive">
                      <div class="plant-card-media">
                        <img
                          src="${escapeHtml(plant.fallbackImage || './images/default-plant.svg')}"
                          ${plant.imageId ? `data-image-id="${escapeHtml(plant.imageId)}"` : ''}
                          data-fallback="${escapeHtml(plant.fallbackImage || './images/default-plant.svg')}"
                          alt="${escapeHtml(plant.name)}"
                        />
                        <span class="plant-card-location">
                          ${iconSpan('map-pin')} ${escapeHtml(plant.location)}
                        </span>
                      </div>
                      <div class="plant-card-body">
                        <div>
                          <h3 class="plant-card-title">${escapeHtml(plant.name)}</h3>
                          <div class="plant-card-meta">
                            <span class="badge badge-neutral">${escapeHtml(plant.category)}</span>
                            ${plant.type ? `<span>${escapeHtml(plant.type)}</span>` : ''}
                          </div>
                        </div>

                        <div class="plant-card-next">
                          ${
                            nextTask
                              ? `
                                <div>
                                  <strong>${escapeHtml(nextTask.activityType)}</strong>
                                  <div class="muted-text" style="font-size:0.75rem;">
                                    ${escapeHtml(formatRelativeDate(nextTask.dueDate, todayStr))}
                                  </div>
                                </div>
                                ${statusBadgeHtml(nextTask.computedStatus)}
                              `
                              : `<span class="muted-text">No upcoming care scheduled</span>`
                          }
                        </div>
                      </div>
                      <div class="plant-card-footer">
                        <button class="btn btn-secondary btn-sm" type="button" data-view-plant="${escapeHtml(
                          plant.id
                        )}">
                          ${iconSpan('eye')} View Details
                        </button>
                        <div style="display:flex; gap:6px;">
                          <button class="icon-btn" type="button" title="Edit plant" aria-label="Edit ${escapeHtml(
                            plant.name
                          )}" data-edit-plant="${escapeHtml(plant.id)}">
                            ${iconSpan('pencil')}
                          </button>
                          <button class="icon-btn" type="button" title="Delete plant" aria-label="Delete ${escapeHtml(
                            plant.name
                          )}" data-delete-plant="${escapeHtml(plant.id)}">
                            ${iconSpan('trash-2')}
                          </button>
                        </div>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>
          `
    }
  `;

  mountIcons(container);
  hydrateAsyncImages(container);

  container.querySelector('#plants-add-btn')?.addEventListener('click', () => openPlantFormModal());
  container.querySelector('#plants-empty-add')?.addEventListener('click', () => openPlantFormModal());
  container.querySelector('#plants-clear-filters')?.addEventListener('click', () => {
    filterState.search = '';
    filterState.category = 'all';
    filterState.location = 'all';
    renderPlantsView(container, { navigate });
  });

  const searchInput = container.querySelector('#plants-search');
  searchInput?.addEventListener('input', (e) => {
    filterState.search = e.target.value;
    renderPlantsView(container, { navigate });
    const nextInput = container.querySelector('#plants-search');
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    }
  });

  container.querySelector('#plants-filter-category')?.addEventListener('change', (e) => {
    filterState.category = e.target.value;
    renderPlantsView(container, { navigate });
  });

  container.querySelector('#plants-filter-location')?.addEventListener('change', (e) => {
    filterState.location = e.target.value;
    renderPlantsView(container, { navigate });
  });

  container.querySelectorAll('[data-view-plant]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.selectedPlantId = btn.getAttribute('data-view-plant');
      renderPlantsView(container, { navigate });
    });
  });

  container.querySelectorAll('[data-edit-plant]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPlantFormModal(btn.getAttribute('data-edit-plant'));
    });
  });

  container.querySelectorAll('[data-delete-plant]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-plant');
      const plant = store.getState().plants.find((p) => p.id === id);
      if (!plant) return;

      const confirmed = await confirmDialog({
        title: `Delete ${plant.name}?`,
        message: `Deleting "${plant.name}" will also remove all of its scheduled care tasks and growth diary entries.`,
        confirmLabel: 'Delete Plant',
        danger: true
      });
      if (confirmed) {
        await store.deletePlant(id);
        showToast(`${plant.name} and related records removed.`, 'info');
      }
    });
  });
}

function renderPlantDetails(container, plant, { navigate }) {
  const state = store.getState();
  const todayStr = getTodayLocal();
  const dateFmt = state.settings.preferences.dateFormat;

  const plantTasks = state.tasks
    .filter((t) => t.plantId === plant.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const plantGrowth = state.growthEntries
    .filter((g) => g.plantId === plant.id)
    .sort((a, b) => b.observationDate.localeCompare(a.observationDate));

  container.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-secondary" type="button" id="detail-back-btn">
        ${iconSpan('arrow-left')} Back to My Plants
      </button>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary" type="button" id="detail-schedule-btn">
          ${iconSpan('calendar-plus')} Schedule Care
        </button>
        <button class="btn btn-secondary" type="button" id="detail-growth-btn">
          ${iconSpan('camera')} Log Growth
        </button>
        <button class="btn btn-primary" type="button" id="detail-edit-btn">
          ${iconSpan('pencil')} Edit Plant
        </button>
        <button class="btn btn-soft-danger" type="button" id="detail-delete-btn">
          ${iconSpan('trash-2')} Delete
        </button>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="detail-hero">
        <img
          class="detail-photo"
          src="${escapeHtml(plant.fallbackImage || './images/default-plant.svg')}"
          ${plant.imageId ? `data-image-id="${escapeHtml(plant.imageId)}"` : ''}
          data-fallback="${escapeHtml(plant.fallbackImage || './images/default-plant.svg')}"
          alt="${escapeHtml(plant.name)}"
        />
        <div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:1.5rem;">${escapeHtml(plant.name)}</h2>
            <span class="badge badge-upcoming">${escapeHtml(plant.category)}</span>
          </div>
          ${plant.type ? `<p class="muted-text" style="margin:4px 0 0;">${escapeHtml(plant.type)}</p>` : ''}
          <p style="margin:12px 0 0;">${
            plant.notes ? escapeHtml(plant.notes) : '<span class="muted-text">No care notes added yet.</span>'
          }</p>

          <div class="meta-list">
            <div class="meta-item">
              <span class="meta-item-label">Location</span>
              <span class="meta-item-value">${escapeHtml(plant.location)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Sunlight Preference</span>
              <span class="meta-item-value">${escapeHtml(plant.sunlightPreference)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Watering Interval</span>
              <span class="meta-item-value">Every ${escapeHtml(plant.wateringInterval)} days</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Fertilising Interval</span>
              <span class="meta-item-value">Every ${escapeHtml(plant.fertilisingInterval)} days</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Date Added</span>
              <span class="meta-item-value">${escapeHtml(formatDisplayDate(plant.dateAdded, dateFmt))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Care Schedules & History (${plantTasks.length})</h3>
          <button class="btn btn-ghost btn-sm" type="button" id="detail-add-task-inline">Add</button>
        </div>
        ${
          plantTasks.length === 0
            ? `<p class="muted-text">No schedules created for ${escapeHtml(plant.name)} yet.</p>`
            : `<div class="task-list">
                ${plantTasks
                  .map((t) => {
                    const status =
                      t.status === 'completed'
                        ? 'completed'
                        : t.status === 'skipped'
                          ? 'skipped'
                          : t.dueDate < todayStr
                            ? 'overdue'
                            : t.dueDate === todayStr
                              ? 'due_today'
                              : 'upcoming';
                    return `
                      <div class="task-row">
                        <div class="task-row-main">
                          <div class="task-row-title">
                            <span>${escapeHtml(t.title)}</span>
                            ${statusBadgeHtml(status)}
                          </div>
                          <div class="task-row-sub">
                            <span>${escapeHtml(t.activityType)}</span>
                            <span>${escapeHtml(formatDisplayDate(t.dueDate, dateFmt))}</span>
                          </div>
                        </div>
                        ${
                          t.status === 'pending'
                            ? `<button class="btn btn-primary btn-sm" type="button" data-detail-complete="${escapeHtml(
                                t.id
                              )}">Complete</button>`
                            : ''
                        }
                      </div>
                    `;
                  })
                  .join('')}
              </div>`
        }
      </section>

      <section class="card">
        <div class="section-header">
          <h3 class="section-title">Growth Diary Logs (${plantGrowth.length})</h3>
          <button class="btn btn-ghost btn-sm" type="button" id="detail-view-diary">Open Diary</button>
        </div>
        ${
          plantGrowth.length === 0
            ? `<p class="muted-text">No growth observations recorded yet for ${escapeHtml(plant.name)}.</p>`
            : `<div class="task-list">
                ${plantGrowth
                  .map(
                    (g) => `
                    <div class="task-row">
                      <div class="task-row-main">
                        <div class="task-row-title">${escapeHtml(
                          formatDisplayDate(g.observationDate, dateFmt)
                        )}</div>
                        <div class="task-row-sub">${escapeHtml(g.description)}</div>
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
  hydrateAsyncImages(container);

  container.querySelector('#detail-back-btn')?.addEventListener('click', () => {
    store.selectedPlantId = null;
    renderPlantsView(container, { navigate });
  });
  container.querySelector('#detail-edit-btn')?.addEventListener('click', () => openPlantFormModal(plant.id));
  container.querySelector('#detail-schedule-btn')?.addEventListener('click', () =>
    openTaskFormModal({ presetPlantId: plant.id })
  );
  container.querySelector('#detail-add-task-inline')?.addEventListener('click', () =>
    openTaskFormModal({ presetPlantId: plant.id })
  );
  container.querySelector('#detail-growth-btn')?.addEventListener('click', () =>
    openGrowthEntryModal(plant.id)
  );
  container.querySelector('#detail-view-diary')?.addEventListener('click', () => navigate('growth'));

  container.querySelector('#detail-delete-btn')?.addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: `Delete ${plant.name}?`,
      message: `This will permanently remove ${plant.name}, its care tasks, and its growth diary entries.`,
      confirmLabel: 'Delete Plant',
      danger: true
    });
    if (confirmed) {
      await store.deletePlant(plant.id);
      showToast(`${plant.name} deleted.`, 'info');
    }
  });

  container.querySelectorAll('[data-detail-complete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = store.completeTask(btn.getAttribute('data-detail-complete'));
      if (res.changed) showToast(`Completed (+${res.pointsAwarded} pts)`, 'success');
    });
  });
}

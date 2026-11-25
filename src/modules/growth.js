/**
 * Module 5: Plant Growth Diary
 * Chronological visual log with IndexedDB photo storage and side-by-side
 * Before-and-After comparison view.
 */

import { store } from '../services/store.js';
import { formatDisplayDate } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/helpers.js';
import {
  confirmDialog,
  hydrateAsyncImages,
  iconSpan,
  mountIcons,
  showToast
} from '../utils/ui.js';
import { openGrowthEntryModal } from './modals.js';

const growthUiState = {
  selectedPlantId: 'all',
  comparePlantId: null,
  beforeEntryId: null,
  afterEntryId: null
};

export function renderGrowthDiaryView(container) {
  const state = store.getState();
  const dateFormat = state.settings.preferences.dateFormat;
  const plantMap = new Map(state.plants.map((p) => [p.id, p]));

  if (state.plants.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${iconSpan('camera')}</div>
        <h3>Plant Growth Diary</h3>
        <p>Add a plant first so you can upload photographs, write observations, and compare growth over time.</p>
      </div>
    `;
    mountIcons(container);
    return;
  }

  const filteredEntries = state.growthEntries
    .filter((g) => plantMap.has(g.plantId))
    .filter((g) => growthUiState.selectedPlantId === 'all' || g.plantId === growthUiState.selectedPlantId)
    .sort((a, b) => a.observationDate.localeCompare(b.observationDate));

  // Determine comparison plant (either active filter or first plant with >=2 entries, or first plant)
  const plantsWithMultiple = state.plants.filter(
    (p) => state.growthEntries.filter((g) => g.plantId === p.id).length >= 2
  );
  const comparePlantId =
    (growthUiState.selectedPlantId !== 'all' ? growthUiState.selectedPlantId : null) ||
    growthUiState.comparePlantId ||
    plantsWithMultiple[0]?.id ||
    state.plants[0].id;

  const compareEntries = state.growthEntries
    .filter((g) => g.plantId === comparePlantId)
    .sort((a, b) => a.observationDate.localeCompare(b.observationDate));

  const beforeEntry =
    compareEntries.find((e) => e.id === growthUiState.beforeEntryId) || compareEntries[0] || null;
  const afterEntry =
    compareEntries.find((e) => e.id === growthUiState.afterEntryId) ||
    compareEntries[compareEntries.length - 1] ||
    null;

  container.innerHTML = `
    <div class="notice-banner" style="margin-bottom:18px;">
      ${iconSpan('info')}
      <div>
        <strong>Visual Growth Tracking:</strong> Growth logs store your uploaded photographs in browser IndexedDB
        for chronological review and side-by-side visual comparison (PlantCare does not perform automated physical measurements).
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-filters">
        <label class="form-label" for="growth-plant-filter" style="margin:0;">Filter by Plant:</label>
        <select class="form-control" id="growth-plant-filter" style="width:auto; min-width:200px;">
          <option value="all" ${growthUiState.selectedPlantId === 'all' ? 'selected' : ''}>All Plants</option>
          ${state.plants
            .map(
              (p) =>
                `<option value="${escapeHtml(p.id)}" ${
                  growthUiState.selectedPlantId === p.id ? 'selected' : ''
                }>${escapeHtml(p.name)} (${escapeHtml(p.location)})</option>`
            )
            .join('')}
        </select>
      </div>
      <button class="btn btn-primary" type="button" id="growth-add-btn">
        ${iconSpan('plus')} Add Growth Entry
      </button>
    </div>

    <section class="card" style="margin-bottom:22px;">
      <div class="section-header">
        <div>
          <h3 class="section-title">Before & After Comparison</h3>
          <p class="muted-text" style="margin:2px 0 0;">Compare any two chronological entries for a plant.</p>
        </div>
        <select class="form-control" id="growth-compare-plant" style="width:auto;" aria-label="Comparison plant">
          ${state.plants
            .map(
              (p) =>
                `<option value="${escapeHtml(p.id)}" ${p.id === comparePlantId ? 'selected' : ''}>${escapeHtml(
                  p.name
                )}</option>`
            )
            .join('')}
        </select>
      </div>

      ${
        compareEntries.length < 2
          ? `<p class="muted-text">Log at least 2 growth entries for <strong>${escapeHtml(
              plantMap.get(comparePlantId)?.name || 'this plant'
            )}</strong> to unlock side-by-side comparison.</p>`
          : `
            <div class="form-grid" style="margin-bottom:14px;">
              <div class="form-group">
                <label class="form-label" for="compare-before-select">Before Entry</label>
                <select class="form-control" id="compare-before-select">
                  ${compareEntries
                    .map(
                      (e) =>
                        `<option value="${escapeHtml(e.id)}" ${
                          e.id === beforeEntry?.id ? 'selected' : ''
                        }>${escapeHtml(formatDisplayDate(e.observationDate, dateFormat))} — ${escapeHtml(
                          e.description.slice(0, 40)
                        )}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="compare-after-select">After Entry</label>
                <select class="form-control" id="compare-after-select">
                  ${compareEntries
                    .map(
                      (e) =>
                        `<option value="${escapeHtml(e.id)}" ${
                          e.id === afterEntry?.id ? 'selected' : ''
                        }>${escapeHtml(formatDisplayDate(e.observationDate, dateFormat))} — ${escapeHtml(
                          e.description.slice(0, 40)
                        )}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>

            <div class="compare-grid">
              ${[
                { label: 'Before', entry: beforeEntry },
                { label: 'After', entry: afterEntry }
              ]
                .map(
                  ({ label, entry }) => `
                  <div class="compare-card">
                    <img
                      src="${escapeHtml(entry.fallbackImage || './images/default-plant.svg')}"
                      ${entry.imageId ? `data-image-id="${escapeHtml(entry.imageId)}"` : ''}
                      data-fallback="${escapeHtml(entry.fallbackImage || './images/default-plant.svg')}"
                      alt="${escapeHtml(label)} photo"
                    />
                    <div class="compare-card-body">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="badge badge-upcoming">${escapeHtml(label)}</span>
                        <span class="muted-text" style="font-size:0.78rem;">${escapeHtml(
                          formatDisplayDate(entry.observationDate, dateFormat)
                        )}</span>
                      </div>
                      <p style="margin:0; font-size:0.88rem;">${escapeHtml(entry.description)}</p>
                    </div>
                  </div>
                `
                )
                .join('')}
            </div>
          `
      }
    </section>

    <section class="card">
      <div class="section-header">
        <h3 class="section-title">Chronological Growth Timeline (${filteredEntries.length})</h3>
      </div>
      ${
        filteredEntries.length === 0
          ? `
            <div class="empty-state" style="margin:10px auto;">
              <div class="empty-state-icon">${iconSpan('camera')}</div>
              <h3>No Growth Entries Yet</h3>
              <p>Capture your first photograph and observation note to start tracking progress.</p>
              <button class="btn btn-primary" type="button" id="growth-empty-add">
                ${iconSpan('plus')} Log First Observation
              </button>
            </div>
          `
          : `<div class="timeline">
              ${filteredEntries
                .map((entry) => {
                  const plant = plantMap.get(entry.plantId);
                  return `
                    <article class="timeline-item">
                      <img
                        class="timeline-thumb"
                        src="${escapeHtml(entry.fallbackImage || './images/default-plant.svg')}"
                        ${entry.imageId ? `data-image-id="${escapeHtml(entry.imageId)}"` : ''}
                        data-fallback="${escapeHtml(entry.fallbackImage || './images/default-plant.svg')}"
                        alt="${escapeHtml(plant?.name || 'Plant')} growth entry"
                      />
                      <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <strong>${escapeHtml(plant?.name || 'Plant')}</strong>
                            <span class="badge badge-neutral">${escapeHtml(
                              formatDisplayDate(entry.observationDate, dateFormat)
                            )}</span>
                          </div>
                          <button class="icon-btn" type="button" title="Delete growth entry"
                            data-delete-growth="${escapeHtml(entry.id)}">
                            ${iconSpan('trash-2')}
                          </button>
                        </div>
                        <p style="margin:0; font-size:0.92rem;">${escapeHtml(entry.description)}</p>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>`
      }
    </section>
  `;

  mountIcons(container);
  hydrateAsyncImages(container);

  const openAdd = () =>
    openGrowthEntryModal(growthUiState.selectedPlantId !== 'all' ? growthUiState.selectedPlantId : null);

  container.querySelector('#growth-add-btn')?.addEventListener('click', openAdd);
  container.querySelector('#growth-empty-add')?.addEventListener('click', openAdd);

  container.querySelector('#growth-plant-filter')?.addEventListener('change', (e) => {
    growthUiState.selectedPlantId = e.target.value;
    growthUiState.beforeEntryId = null;
    growthUiState.afterEntryId = null;
    renderGrowthDiaryView(container);
  });

  container.querySelector('#growth-compare-plant')?.addEventListener('change', (e) => {
    growthUiState.comparePlantId = e.target.value;
    growthUiState.beforeEntryId = null;
    growthUiState.afterEntryId = null;
    renderGrowthDiaryView(container);
  });

  container.querySelector('#compare-before-select')?.addEventListener('change', (e) => {
    growthUiState.beforeEntryId = e.target.value;
    renderGrowthDiaryView(container);
  });

  container.querySelector('#compare-after-select')?.addEventListener('change', (e) => {
    growthUiState.afterEntryId = e.target.value;
    renderGrowthDiaryView(container);
  });

  container.querySelectorAll('[data-delete-growth]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-growth');
      const ok = await confirmDialog({
        title: 'Delete growth entry?',
        message: 'This observation and its saved photograph will be removed from your diary.',
        confirmLabel: 'Delete Entry',
        danger: true
      });
      if (ok) {
        await store.deleteGrowthEntry(id);
        showToast('Growth entry deleted.', 'info');
      }
    });
  });
}

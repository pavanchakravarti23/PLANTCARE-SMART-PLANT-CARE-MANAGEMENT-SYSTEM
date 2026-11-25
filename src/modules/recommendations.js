/**
 * Module 6: Rule-Based Plant Care Recommendation Engine
 * Uses structured botanical profiles (not an AI model) to suggest starting
 * care schedules, sunlight placement, and maintenance tips with clear disclaimers.
 */

import {
  CARE_DISCLAIMER,
  PLANT_CARE_PROFILES,
  PLANT_CATEGORIES,
  recommendCareForPlant
} from '../data/plantDatabase.js';
import { store } from '../services/store.js';
import { escapeHtml } from '../utils/helpers.js';
import { iconSpan, mountIcons, showToast } from '../utils/ui.js';
import { openPlantFormModal, openTaskFormModal } from './modals.js';

const recUiState = {
  queryName: 'Tulsi',
  category: 'Herbs',
  selectedUserPlantId: ''
};

export function renderRecommendationsView(container) {
  const state = store.getState();
  const { matched, profile } = recommendCareForPlant(recUiState.queryName, recUiState.category);

  container.innerHTML = `
    <div class="notice-banner is-warning" style="margin-bottom:18px;">
      ${iconSpan('info')}
      <div>
        <strong>Rule-Based General Guidance (Non-AI):</strong> ${escapeHtml(CARE_DISCLAIMER)}
      </div>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="section-header">
        <div>
          <h3 class="section-title">Look Up Plant Care Guidance</h3>
          <p class="muted-text" style="margin:2px 0 0;">
            Select one of your registered plants or search a plant species / category below.
          </p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label" for="rec-user-plant">Match From My Plants</label>
          <select class="form-control" id="rec-user-plant">
            <option value="">-- Choose from your collection --</option>
            ${state.plants
              .map(
                (p) =>
                  `<option value="${escapeHtml(p.id)}" ${
                    p.id === recUiState.selectedUserPlantId ? 'selected' : ''
                  }>${escapeHtml(p.name)} (${escapeHtml(p.category)})</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="rec-profile-preset">Or Pick from Built-in Knowledge Base (10 Plants)</label>
          <select class="form-control" id="rec-profile-preset">
            ${PLANT_CARE_PROFILES.map(
              (p) =>
                `<option value="${escapeHtml(p.name)}" ${
                  p.id === profile.id ? 'selected' : ''
                }>${escapeHtml(p.name)} — ${escapeHtml(p.category)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="rec-query-name">Plant Name / Type</label>
          <input class="form-control" id="rec-query-name" type="text"
            placeholder="e.g., Tulsi, Rose, Aloe Vera, Peace Lily..."
            value="${escapeHtml(recUiState.queryName)}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="rec-category">Fallback Category</label>
          <select class="form-control" id="rec-category">
            ${PLANT_CATEGORIES.map(
              (cat) =>
                `<option value="${escapeHtml(cat)}" ${
                  cat === recUiState.category ? 'selected' : ''
                }>${escapeHtml(cat)}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    </div>

    <section class="card" style="margin-bottom:20px;">
      <div class="detail-hero" style="margin-bottom:0;">
        <img class="detail-photo" src="${escapeHtml(profile.imageUrl)}" alt="${escapeHtml(profile.name)}" />
        <div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:1.45rem;">${escapeHtml(profile.name)}</h2>
            <span class="badge ${matched ? 'badge-completed' : 'badge-upcoming'}">
              ${matched ? 'Exact Species Match' : 'Category General Guidance'}
            </span>
          </div>
          <p class="muted-text" style="margin:4px 0 12px;">${escapeHtml(profile.scientificName)}</p>

          <div class="meta-list" style="margin-bottom:16px;">
            <div class="meta-item">
              <span class="meta-item-label">Starting Watering Interval</span>
              <span class="meta-item-value">Every ${escapeHtml(profile.wateringIntervalDays)} days (general)</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Sunlight Preference</span>
              <span class="meta-item-value">${escapeHtml(profile.sunlightPreference)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Starting Fertilising Cadence</span>
              <span class="meta-item-value">Every ${escapeHtml(profile.fertilisingIntervalDays)} days</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Recommended Soil</span>
              <span class="meta-item-value">${escapeHtml(profile.soilGuidance)}</span>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            ${
              state.plants.length > 0
                ? `<button class="btn btn-primary" type="button" id="rec-apply-schedule">
                    ${iconSpan('calendar-plus')} Customise & Schedule Watering
                  </button>`
                : ''
            }
            <button class="btn btn-secondary" type="button" id="rec-add-plant-preset">
              ${iconSpan('plus')} Add ${escapeHtml(profile.name)} to My Plants
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="grid-2">
      <section class="card">
        <h3 class="section-title" style="margin-bottom:12px;">Care Guidance Breakdown</h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <strong>${iconSpan('droplets')} General Watering Guidance</strong>
            <p class="muted-text" style="margin:4px 0 0;">${escapeHtml(profile.wateringGuidance)}</p>
          </div>
          <div>
            <strong>${iconSpan('sun')} Sunlight Guidance</strong>
            <p class="muted-text" style="margin:4px 0 0;">${escapeHtml(profile.sunlightGuidance)}</p>
          </div>
          <div>
            <strong>${iconSpan('sprout')} Fertilising Guidance</strong>
            <p class="muted-text" style="margin:4px 0 0;">${escapeHtml(profile.fertilisingGuidance)}</p>
          </div>
        </div>
      </section>

      <section class="card">
        <h3 class="section-title" style="margin-bottom:12px;">Suggested Starting Care Activities</h3>
        <div class="task-list" style="margin-bottom:16px;">
          ${profile.suggestedActivities
            .map(
              (act) => `
              <div class="task-row">
                <div class="task-row-main">
                  <div class="task-row-title">${escapeHtml(act.activityType)}</div>
                  <div class="task-row-sub">${escapeHtml(act.notes)}</div>
                </div>
                ${
                  state.plants.length > 0
                    ? `<button class="btn btn-secondary btn-sm" type="button"
                        data-rec-act="${escapeHtml(act.activityType)}"
                        data-rec-repeat="${escapeHtml(act.repeatInterval)}"
                        data-rec-days="${escapeHtml(act.customIntervalDays || 1)}"
                        data-rec-notes="${escapeHtml(act.notes)}">
                        Customise
                      </button>`
                    : ''
                }
              </div>
            `
            )
            .join('')}
        </div>

        <h4 style="font-size:0.92rem; margin-bottom:8px;">Practical Care Tips</h4>
        <ul style="margin:0; padding-left:18px; color:var(--muted); font-size:0.86rem;">
          ${profile.careTips.map((tip) => `<li style="margin-bottom:4px;">${escapeHtml(tip)}</li>`).join('')}
        </ul>
      </section>
    </div>
  `;

  mountIcons(container);

  container.querySelector('#rec-user-plant')?.addEventListener('change', (e) => {
    const id = e.target.value;
    recUiState.selectedUserPlantId = id;
    const plant = state.plants.find((p) => p.id === id);
    if (plant) {
      recUiState.queryName = plant.name;
      recUiState.category = plant.category;
      renderRecommendationsView(container);
    }
  });

  container.querySelector('#rec-profile-preset')?.addEventListener('change', (e) => {
    recUiState.queryName = e.target.value;
    const found = PLANT_CARE_PROFILES.find((p) => p.name === e.target.value);
    if (found) recUiState.category = found.category;
    recUiState.selectedUserPlantId = '';
    renderRecommendationsView(container);
  });

  container.querySelector('#rec-query-name')?.addEventListener('input', (e) => {
    recUiState.queryName = e.target.value;
    renderRecommendationsView(container);
    const input = container.querySelector('#rec-query-name');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  container.querySelector('#rec-category')?.addEventListener('change', (e) => {
    recUiState.category = e.target.value;
    renderRecommendationsView(container);
  });

  container.querySelector('#rec-apply-schedule')?.addEventListener('click', () => {
    openTaskFormModal({
      presetPlantId: recUiState.selectedUserPlantId || state.plants[0]?.id,
      presetActivity: 'Watering',
      presetRepeat: 'custom',
      presetCustomDays: profile.wateringIntervalDays,
      presetNotes: profile.wateringGuidance
    });
  });

  container.querySelector('#rec-add-plant-preset')?.addEventListener('click', () => {
    store.addPlant({
      name: profile.name,
      type: profile.scientificName,
      category: profile.category,
      location: profile.defaultLocation,
      sunlightPreference: profile.sunlightPreference,
      wateringInterval: profile.wateringIntervalDays,
      fertilisingInterval: profile.fertilisingIntervalDays,
      fallbackImage: profile.imageUrl,
      notes: profile.careTips[0] || ''
    });
    showToast(`Added ${profile.name} using recommended starting intervals.`, 'success');
  });

  container.querySelectorAll('[data-rec-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openTaskFormModal({
        presetPlantId: recUiState.selectedUserPlantId || state.plants[0]?.id,
        presetActivity: btn.getAttribute('data-rec-act'),
        presetRepeat: btn.getAttribute('data-rec-repeat'),
        presetCustomDays: Number(btn.getAttribute('data-rec-days')) || 1,
        presetNotes: btn.getAttribute('data-rec-notes')
      });
    });
  });

  // Suppress unused import warning while keeping quick add option ready
  void openPlantFormModal;
}

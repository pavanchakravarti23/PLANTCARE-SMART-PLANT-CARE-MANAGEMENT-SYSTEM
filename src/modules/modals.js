/**
 * Shared form modals for Plant CRUD, Care Scheduling, Rescheduling, and Growth Entries.
 */

import {
  PLANT_CATEGORIES,
  PLANT_LOCATIONS,
  SUNLIGHT_PREFERENCES
} from '../data/plantDatabase.js';
import { MediaDatabase } from '../services/database.js';
import { ACTIVITY_TYPES, REPEAT_OPTIONS } from '../services/engine.js';
import { store } from '../services/store.js';
import { getTodayLocal } from '../utils/dateUtils.js';
import {
  escapeHtml,
  generateId,
  optimizeImageForStorage,
  validateImageFile
} from '../utils/helpers.js';
import { closeModal, openModal, showToast } from '../utils/ui.js';

function optionsHtml(items, selected) {
  return items
    .map(
      (item) =>
        `<option value="${escapeHtml(item)}" ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`
    )
    .join('');
}

/**
 * Opens Add or Edit Plant Modal.
 */
export function openPlantFormModal(plantId = null, onSaved = null) {
  const state = store.getState();
  const existing = plantId ? state.plants.find((p) => p.id === plantId) : null;
  const isEdit = Boolean(existing);
  const today = getTodayLocal();

  const initial = existing || {
    name: '',
    type: '',
    category: 'Indoor plants',
    dateAdded: today,
    location: 'Balcony',
    sunlightPreference: 'Bright indirect light',
    wateringInterval: 3,
    fertilisingInterval: 30,
    notes: '',
    imageId: null,
    fallbackImage: './images/default-plant.svg'
  };

  openModal(
    isEdit ? `Edit ${existing.name}` : 'Add New Plant',
    `
      <form id="plant-form" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="plant-name">Plant Name *</label>
            <input class="form-control" id="plant-name" name="name" type="text" required maxlength="120"
              placeholder="e.g., Tulsi, Monstera, Rose" value="${escapeHtml(initial.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-type">Plant Type / Variety</label>
            <input class="form-control" id="plant-type" name="type" type="text" maxlength="120"
              placeholder="e.g., Holy Basil, Hybrid Tea" value="${escapeHtml(initial.type)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-category">Category *</label>
            <select class="form-control" id="plant-category" name="category">
              ${optionsHtml(PLANT_CATEGORIES, initial.category)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-location">Location *</label>
            <select class="form-control" id="plant-location" name="location">
              ${optionsHtml(PLANT_LOCATIONS, initial.location)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-sunlight">Sunlight Preference</label>
            <select class="form-control" id="plant-sunlight" name="sunlightPreference">
              ${optionsHtml(SUNLIGHT_PREFERENCES, initial.sunlightPreference)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-date-added">Date Added *</label>
            <input class="form-control" id="plant-date-added" name="dateAdded" type="date" required
              value="${escapeHtml(initial.dateAdded)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-watering">Watering Interval (days) *</label>
            <input class="form-control" id="plant-watering" name="wateringInterval" type="number" min="1" max="365" required
              value="${escapeHtml(initial.wateringInterval)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="plant-fertilising">Fertilising Interval (days) *</label>
            <input class="form-control" id="plant-fertilising" name="fertilisingInterval" type="number" min="1" max="365" required
              value="${escapeHtml(initial.fertilisingInterval)}" />
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="plant-photo">Plant Photograph (JPG, PNG, WEBP up to 5 MB)</label>
            <input class="form-control" id="plant-photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <div class="image-preview-box" id="plant-photo-preview-wrap">
              <img id="plant-photo-preview" src="${escapeHtml(initial.fallbackImage || './images/default-plant.svg')}"
                alt="Plant preview" />
            </div>
            <span class="form-hint">Stored locally in browser IndexedDB for fast offline access.</span>
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="plant-notes">General Notes</label>
            <textarea class="form-control" id="plant-notes" name="notes" maxlength="1000"
              placeholder="Pot size, soil mix, placement tips...">${escapeHtml(initial.notes)}</textarea>
          </div>
        </div>
        <p class="form-error" id="plant-form-error" hidden></p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="plant-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="plant-submit-btn">
            ${isEdit ? 'Save Changes' : 'Add Plant'}
          </button>
        </div>
      </form>
    `,
    async (bodyEl) => {
      const form = bodyEl.querySelector('#plant-form');
      const fileInput = bodyEl.querySelector('#plant-photo');
      const previewImg = bodyEl.querySelector('#plant-photo-preview');
      const errorEl = bodyEl.querySelector('#plant-form-error');
      let selectedFile = null;

      if (existing?.imageId) {
        const stored = await store.resolveImageSrc(existing.imageId, existing.fallbackImage);
        if (stored && previewImg) previewImg.src = stored;
      }

      bodyEl.querySelector('#plant-cancel-btn')?.addEventListener('click', closeModal);

      fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) {
          selectedFile = null;
          return;
        }
        const check = validateImageFile(file);
        if (!check.valid) {
          errorEl.textContent = check.error;
          errorEl.hidden = false;
          fileInput.value = '';
          selectedFile = null;
          return;
        }
        errorEl.hidden = true;
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') previewImg.src = reader.result;
        };
        reader.readAsDataURL(file);
      });

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const name = form.name.value.trim();
        const type = form.type.value.trim();
        const category = form.category.value;
        const location = form.location.value;
        const sunlightPreference = form.sunlightPreference.value;
        const dateAdded = form.dateAdded.value;
        const wateringInterval = Number(form.wateringInterval.value);
        const fertilisingInterval = Number(form.fertilisingInterval.value);
        const notes = form.notes.value.trim();

        if (!name) {
          errorEl.textContent = 'Please enter a plant name.';
          errorEl.hidden = false;
          return;
        }
        if (!dateAdded) {
          errorEl.textContent = 'Please choose a valid date added.';
          errorEl.hidden = false;
          return;
        }
        if (!Number.isFinite(wateringInterval) || wateringInterval < 1 || wateringInterval > 365) {
          errorEl.textContent = 'Watering interval must be between 1 and 365 days.';
          errorEl.hidden = false;
          return;
        }
        if (!Number.isFinite(fertilisingInterval) || fertilisingInterval < 1 || fertilisingInterval > 365) {
          errorEl.textContent = 'Fertilising interval must be between 1 and 365 days.';
          errorEl.hidden = false;
          return;
        }

        const submitBtn = bodyEl.querySelector('#plant-submit-btn');
        submitBtn.disabled = true;

        try {
          let imageId = existing?.imageId || null;
          if (selectedFile) {
            const optimized = await optimizeImageForStorage(selectedFile);
            imageId = generateId('img-plant');
            await MediaDatabase.saveImage(imageId, optimized, {
              mimeType: optimized.type || selectedFile.type,
              size: optimized.size
            });
          }

          const payload = {
            name,
            type,
            category,
            location,
            sunlightPreference,
            dateAdded,
            wateringInterval,
            fertilisingInterval,
            notes,
            imageId
          };

          if (isEdit) {
            await store.updatePlant(existing.id, payload);
            showToast(`Updated ${name}.`, 'success');
          } else {
            store.addPlant(payload);
            showToast(`Added ${name} to your garden!`, 'success');
          }

          closeModal();
          if (typeof onSaved === 'function') onSaved();
        } catch (err) {
          errorEl.textContent = err?.message || 'Unable to save plant.';
          errorEl.hidden = false;
          submitBtn.disabled = false;
        }
      });
    }
  );
}

/**
 * Opens Create or Edit Care Task Schedule Modal.
 */
export function openTaskFormModal(options = {}, onSaved = null) {
  const state = store.getState();
  if (state.plants.length === 0) {
    showToast('Add a plant first before scheduling care.', 'error');
    openPlantFormModal();
    return;
  }

  const existing = options.taskId ? state.tasks.find((t) => t.id === options.taskId) : null;
  const isEdit = Boolean(existing);
  const today = getTodayLocal();

  const initial = existing || {
    plantId: options.presetPlantId || state.plants[0].id,
    activityType: options.presetActivity || 'Watering',
    title: options.presetTitle || '',
    dueDate: options.presetDueDate || today,
    dueTime: '08:00',
    repeatInterval: options.presetRepeat || 'every_2_days',
    customIntervalDays: options.presetCustomDays || 5,
    notes: options.presetNotes || ''
  };

  const plantOptions = state.plants
    .map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === initial.plantId ? 'selected' : ''}>${escapeHtml(
          p.name
        )} (${escapeHtml(p.location)})</option>`
    )
    .join('');

  const repeatOptions = REPEAT_OPTIONS.map(
    (opt) =>
      `<option value="${escapeHtml(opt.value)}" ${
        opt.value === initial.repeatInterval ? 'selected' : ''
      }>${escapeHtml(opt.label)}</option>`
  ).join('');

  openModal(
    isEdit ? 'Edit Care Schedule' : 'Schedule Care Activity',
    `
      <form id="task-form" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="task-plant">Plant *</label>
            <select class="form-control" id="task-plant" name="plantId" required>
              ${plantOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="task-activity">Activity Type *</label>
            <select class="form-control" id="task-activity" name="activityType" required>
              ${optionsHtml(ACTIVITY_TYPES, initial.activityType)}
            </select>
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="task-title">Task Title (optional custom label)</label>
            <input class="form-control" id="task-title" name="title" type="text" maxlength="140"
              placeholder="e.g., Morning watering for Tulsi" value="${escapeHtml(initial.title)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="task-date">Start / Due Date *</label>
            <input class="form-control" id="task-date" name="dueDate" type="date" required
              value="${escapeHtml(initial.dueDate)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="task-time">Preferred Time *</label>
            <input class="form-control" id="task-time" name="dueTime" type="time" required
              value="${escapeHtml(initial.dueTime)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="task-repeat">Repeat Interval</label>
            <select class="form-control" id="task-repeat" name="repeatInterval">
              ${repeatOptions}
            </select>
          </div>
          <div class="form-group" id="task-custom-days-wrap" ${
            initial.repeatInterval === 'custom' ? '' : 'hidden'
          }>
            <label class="form-label" for="task-custom-days">Every N Days *</label>
            <input class="form-control" id="task-custom-days" name="customIntervalDays" type="number"
              min="1" max="365" value="${escapeHtml(initial.customIntervalDays || 5)}" />
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="task-notes">Notes</label>
            <textarea class="form-control" id="task-notes" name="notes" maxlength="1000"
              placeholder="Watering amount, fertiliser dilution, pruning cue...">${escapeHtml(initial.notes)}</textarea>
          </div>
        </div>
        <p class="form-error" id="task-form-error" hidden></p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="task-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Schedule' : 'Create Schedule'}</button>
        </div>
      </form>
    `,
    (bodyEl) => {
      const form = bodyEl.querySelector('#task-form');
      const repeatSelect = bodyEl.querySelector('#task-repeat');
      const customWrap = bodyEl.querySelector('#task-custom-days-wrap');
      const errorEl = bodyEl.querySelector('#task-form-error');

      bodyEl.querySelector('#task-cancel-btn')?.addEventListener('click', closeModal);

      repeatSelect?.addEventListener('change', () => {
        customWrap.hidden = repeatSelect.value !== 'custom';
      });

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const plantId = form.plantId.value;
        const activityType = form.activityType.value;
        const plant = store.getState().plants.find((p) => p.id === plantId);
        const rawTitle = form.title.value.trim();
        const title = rawTitle || `${activityType} — ${plant?.name || 'Plant'}`;
        const dueDate = form.dueDate.value;
        const dueTime = form.dueTime.value || '08:00';
        const repeatInterval = form.repeatInterval.value;
        const customIntervalDays = Number(form.customIntervalDays.value) || 1;
        const notes = form.notes.value.trim();

        if (!dueDate) {
          errorEl.textContent = 'Please select a due date.';
          errorEl.hidden = false;
          return;
        }
        if (repeatInterval === 'custom' && (customIntervalDays < 1 || customIntervalDays > 365)) {
          errorEl.textContent = 'Custom interval must be between 1 and 365 days.';
          errorEl.hidden = false;
          return;
        }

        try {
          if (isEdit) {
            store.updateTask(existing.id, {
              plantId,
              activityType,
              title,
              dueDate,
              dueTime,
              repeatInterval,
              customIntervalDays,
              notes
            });
            showToast('Care schedule updated.', 'success');
          } else {
            store.addTask({
              plantId,
              activityType,
              title,
              dueDate,
              dueTime,
              repeatInterval,
              customIntervalDays,
              notes
            });
            showToast(`Scheduled ${activityType} for ${plant?.name || 'plant'}.`, 'success');
          }
          closeModal();
          if (typeof onSaved === 'function') onSaved();
        } catch (err) {
          errorEl.textContent = err?.message || 'Unable to save schedule.';
          errorEl.hidden = false;
        }
      });
    }
  );
}

/**
 * Opens Quick Reschedule modal for an existing task.
 */
export function openRescheduleModal(taskId, onSaved = null) {
  const task = store.getState().tasks.find((t) => t.id === taskId);
  if (!task) return;

  openModal(
    'Reschedule Task',
    `
      <form id="reschedule-form" novalidate>
        <p class="muted-text" style="margin:0 0 14px;">Choose a new due date and time for <strong>${escapeHtml(
          task.title
        )}</strong>.</p>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="reschedule-date">New Due Date *</label>
            <input class="form-control" id="reschedule-date" name="dueDate" type="date" required
              value="${escapeHtml(task.dueDate)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reschedule-time">Time</label>
            <input class="form-control" id="reschedule-time" name="dueTime" type="time" required
              value="${escapeHtml(task.dueTime || '08:00')}" />
          </div>
        </div>
        <p class="form-error" id="reschedule-error" hidden></p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="reschedule-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Save New Date</button>
        </div>
      </form>
    `,
    (bodyEl) => {
      bodyEl.querySelector('#reschedule-cancel')?.addEventListener('click', closeModal);
      const form = bodyEl.querySelector('#reschedule-form');
      const errEl = bodyEl.querySelector('#reschedule-error');

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          store.updateTask(task.id, {
            dueDate: form.dueDate.value,
            dueTime: form.dueTime.value || '08:00'
          });
          showToast('Task rescheduled.', 'success');
          closeModal();
          if (typeof onSaved === 'function') onSaved();
        } catch (err) {
          errEl.textContent = err?.message || 'Unable to reschedule.';
          errEl.hidden = false;
        }
      });
    }
  );
}

/**
 * Opens Growth Diary Entry Modal.
 */
export function openGrowthEntryModal(presetPlantId = null, onSaved = null) {
  const plants = store.getState().plants;
  if (plants.length === 0) {
    showToast('Add a plant first before logging growth entries.', 'error');
    openPlantFormModal();
    return;
  }

  const today = getTodayLocal();
  const plantOptions = plants
    .map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${
          p.id === (presetPlantId || plants[0].id) ? 'selected' : ''
        }>${escapeHtml(p.name)} (${escapeHtml(p.location)})</option>`
    )
    .join('');

  openModal(
    'Log Growth Observation',
    `
      <form id="growth-form" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="growth-plant">Plant *</label>
            <select class="form-control" id="growth-plant" name="plantId" required>
              ${plantOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="growth-date">Observation Date *</label>
            <input class="form-control" id="growth-date" name="observationDate" type="date" required
              value="${escapeHtml(today)}" />
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="growth-photo">Photograph (JPG, PNG, WEBP up to 5 MB)</label>
            <input class="form-control" id="growth-photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <div class="image-preview-box" id="growth-preview-box" hidden>
              <img id="growth-preview-img" alt="Growth photo preview" />
            </div>
            <span class="form-hint">Photos are saved in browser IndexedDB for chronological visual comparison.</span>
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="growth-desc">Growth Observations *</label>
            <textarea class="form-control" id="growth-desc" name="description" required maxlength="1500"
              placeholder="Note new shoots, leaves, flowering buds, height changes, or repotting notes..."></textarea>
          </div>
        </div>
        <p class="form-error" id="growth-error" hidden></p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="growth-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="growth-submit">Save Entry</button>
        </div>
      </form>
    `,
    (bodyEl) => {
      const form = bodyEl.querySelector('#growth-form');
      const fileInput = bodyEl.querySelector('#growth-photo');
      const previewBox = bodyEl.querySelector('#growth-preview-box');
      const previewImg = bodyEl.querySelector('#growth-preview-img');
      const errEl = bodyEl.querySelector('#growth-error');
      let selectedFile = null;

      bodyEl.querySelector('#growth-cancel')?.addEventListener('click', closeModal);

      fileInput?.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) {
          selectedFile = null;
          previewBox.hidden = true;
          return;
        }
        const check = validateImageFile(file);
        if (!check.valid) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          fileInput.value = '';
          selectedFile = null;
          previewBox.hidden = true;
          return;
        }
        errEl.hidden = true;
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            previewImg.src = reader.result;
            previewBox.hidden = false;
          }
        };
        reader.readAsDataURL(file);
      });

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.hidden = true;

        const plantId = form.plantId.value;
        const observationDate = form.observationDate.value;
        const description = form.description.value.trim();

        if (!observationDate) {
          errEl.textContent = 'Please select an observation date.';
          errEl.hidden = false;
          return;
        }
        if (!description) {
          errEl.textContent = 'Please enter your growth observation notes.';
          errEl.hidden = false;
          return;
        }

        const submitBtn = bodyEl.querySelector('#growth-submit');
        submitBtn.disabled = true;

        try {
          let imageId = null;
          if (selectedFile) {
            const optimized = await optimizeImageForStorage(selectedFile);
            imageId = generateId('img-growth');
            await MediaDatabase.saveImage(imageId, optimized, {
              mimeType: optimized.type || selectedFile.type,
              size: optimized.size
            });
          }

          store.addGrowthEntry({
            plantId,
            observationDate,
            description,
            imageId
          });
          showToast('Growth diary entry saved!', 'success');
          closeModal();
          if (typeof onSaved === 'function') onSaved();
        } catch (err) {
          errEl.textContent = err?.message || 'Could not save growth entry.';
          errEl.hidden = false;
          submitBtn.disabled = false;
        }
      });
    }
  );
}

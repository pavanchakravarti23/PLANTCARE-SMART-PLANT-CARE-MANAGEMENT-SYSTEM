/**
 * Module 9: Settings, Demo Data Management, JSON Export/Import & Local Storage Transparency
 */

import { NotificationService } from '../services/notification.js';
import { store } from '../services/store.js';
import { getTodayLocal } from '../utils/dateUtils.js';
import { downloadJsonFile, escapeHtml } from '../utils/helpers.js';
import { confirmDialog, iconSpan, mountIcons, showToast } from '../utils/ui.js';

export function renderSettingsView(container) {
  const state = store.getState();
  const { settings, meta } = state;
  const notifSupported = NotificationService.isSupported();
  const notifPermission = NotificationService.getPermission();

  container.innerHTML = `
    <div class="notice-banner" style="margin-bottom:20px;">
      ${iconSpan('shield-check')}
      <div>
        <strong>Local Browser Storage Notice:</strong> All plants, care schedules, growth photos, and reward history
        are stored locally in this browser (LocalStorage & IndexedDB). Data belongs exclusively to this browser/device
        and is not automatically synchronised across devices or cloud accounts. Use JSON Export below to create portable backups.
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px;">
      <section class="card">
        <h3 class="section-title" style="margin-bottom:14px;">Profile & Preferences</h3>
        <form id="settings-form">
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label" for="set-display-name">Display Name</label>
              <input class="form-control" id="set-display-name" name="displayName" type="text" maxlength="60"
                value="${escapeHtml(settings.displayName)}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="set-theme">Theme Surface</label>
              <select class="form-control" id="set-theme" name="theme">
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Botanical Cream (Default)</option>
                <option value="soft-sage" ${settings.theme === 'soft-sage' ? 'selected' : ''}>Soft Sage Wash</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-date-format">Date Format</label>
              <select class="form-control" id="set-date-format" name="dateFormat">
                <option value="DD MMM YYYY" ${
                  settings.preferences.dateFormat === 'DD MMM YYYY' ? 'selected' : ''
                }>25 Nov 2026</option>
                <option value="YYYY-MM-DD" ${
                  settings.preferences.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''
                }>2026-11-25</option>
                <option value="MM/DD/YYYY" ${
                  settings.preferences.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''
                }>11/25/2026</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-time-format">Time Format</label>
              <select class="form-control" id="set-time-format" name="timeFormat">
                <option value="12h" ${settings.preferences.timeFormat === '12h' ? 'selected' : ''}>12-hour (8:00 AM)</option>
                <option value="24h" ${settings.preferences.timeFormat === '24h' ? 'selected' : ''}>24-hour (08:00)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-notif-enabled">Browser Notifications</label>
              <select class="form-control" id="set-notif-enabled" name="notificationsEnabled">
                <option value="false" ${!settings.notificationsEnabled ? 'selected' : ''}>In-app reminders only</option>
                <option value="true" ${settings.notificationsEnabled ? 'selected' : ''}>Browser + In-app alerts</option>
              </select>
              <span class="form-hint">
                Permission status: <strong>${escapeHtml(notifPermission)}</strong>
              </span>
            </div>
          </div>

          <div class="form-actions">
            ${
              notifSupported
                ? `<button class="btn btn-secondary" type="button" id="set-test-notif">
                    ${iconSpan('bell')} Test Notification
                  </button>`
                : ''
            }
            <button class="btn btn-primary" type="submit">Save Preferences</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h3 class="section-title" style="margin-bottom:14px;">Data Backup, Demo & Reset</h3>
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="padding:12px; background:var(--bg-subtle); border-radius:var(--radius-sm);">
            <strong>Export Application Data (JSON)</strong>
            <p class="muted-text" style="margin:4px 0 10px;">
              Downloads all plants, care tasks, growth entries, rewards, settings, and stored photographs.
            </p>
            <button class="btn btn-secondary btn-sm" type="button" id="set-export-btn">
              ${iconSpan('download')} Export JSON Backup
            </button>
          </div>

          <div style="padding:12px; background:var(--bg-subtle); border-radius:var(--radius-sm);">
            <strong>Import Backup Data (JSON)</strong>
            <p class="muted-text" style="margin:4px 0 10px;">
              Validates backup schema before replacing current browser data.
            </p>
            <input type="file" id="set-import-file" accept="application/json,.json" hidden />
            <button class="btn btn-secondary btn-sm" type="button" id="set-import-btn">
              ${iconSpan('upload')} Import JSON Backup
            </button>
          </div>

          <div style="padding:12px; background:var(--bg-subtle); border-radius:var(--radius-sm);">
            <strong>Sample Demonstration Data</strong>
            <p class="muted-text" style="margin:4px 0 10px;">
              ${
                meta?.demoLoaded
                  ? 'Sample garden (Tulsi, Rose, Aloe Vera, Money Plant, Snake Plant) is currently loaded.'
                  : 'Optionally load 5 sample plants with overdue, today, upcoming, and completed tasks for demonstration.'
              }
            </p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" type="button" id="set-load-demo">
                ${iconSpan('sparkles')} ${meta?.demoLoaded ? 'Reset Demo Data' : 'Load Demo Data'}
              </button>
            </div>
          </div>

          <div style="padding:12px; background:var(--danger-bg); border:1px solid #EBC3BB; border-radius:var(--radius-sm);">
            <strong style="color:var(--danger);">Danger Zone — Reset Application Data</strong>
            <p class="muted-text" style="margin:4px 0 10px;">
              Permanently deletes all plants, schedules, growth photos, and reward history on this browser.
            </p>
            <button class="btn btn-danger btn-sm" type="button" id="set-reset-all">
              ${iconSpan('rotate-ccw')} Reset All Data
            </button>
          </div>
        </div>
      </section>
    </div>
  `;

  mountIcons(container);

  const form = container.querySelector('#settings-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = form.displayName.value.trim() || 'Gardener';
    const theme = form.theme.value;
    const dateFormat = form.dateFormat.value;
    const timeFormat = form.timeFormat.value;
    let notificationsEnabled = form.notificationsEnabled.value === 'true';

    if (notificationsEnabled && NotificationService.isSupported() && NotificationService.getPermission() === 'default') {
      const perm = await NotificationService.requestPermission();
      notificationsEnabled = perm.granted;
    }

    store.updateSettings({
      displayName,
      theme,
      notificationsEnabled,
      preferences: { dateFormat, timeFormat }
    });

    document.body.classList.toggle('theme-soft-sage', theme === 'soft-sage');
    showToast('Preferences saved.', 'success');
  });

  container.querySelector('#set-test-notif')?.addEventListener('click', async () => {
    const perm = await NotificationService.requestPermission();
    if (!perm.granted) {
      showToast('Notification permission denied or dismissed.', 'error');
      return;
    }
    NotificationService.notify(
      'PlantCare Test Alert',
      'Browser notifications are working while PlantCare is open.',
      null,
      true
    );
    showToast('Sent test browser notification.', 'success');
  });

  container.querySelector('#set-export-btn')?.addEventListener('click', async () => {
    try {
      const bundle = await store.exportBundle();
      downloadJsonFile(`plantcare-backup-${getTodayLocal()}.json`, bundle);
      showToast('Backup JSON exported.', 'success');
    } catch {
      showToast('Failed to export data.', 'error');
    }
  });

  const importInput = container.querySelector('#set-import-file');
  container.querySelector('#set-import-btn')?.addEventListener('click', () => importInput?.click());
  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const countPlants = parsed?.data?.plants?.length ?? parsed?.plants?.length ?? 0;

      const confirmed = await confirmDialog({
        title: 'Import Backup Data?',
        message: `Validated JSON backup (${countPlants} plants). Importing will replace your current browser data.`,
        confirmLabel: 'Import & Replace'
      });

      if (confirmed) {
        await store.importBundle(parsed);
        showToast('Backup imported successfully!', 'success');
      }
    } catch (err) {
      showToast(err?.message || 'Invalid JSON backup file.', 'error');
    } finally {
      importInput.value = '';
    }
  });

  container.querySelector('#set-load-demo')?.addEventListener('click', async () => {
    const hasExisting = state.plants.length > 0;
    if (hasExisting) {
      const ok = await confirmDialog({
        title: meta?.demoLoaded ? 'Reset Demo Data?' : 'Replace Current Data with Demo Data?',
        message:
          'Loading demo data replaces current plants and tasks with the 5 sample plants (Tulsi, Rose, Aloe Vera, Money Plant, Snake Plant). Export a backup first if you want to keep your current plants.',
        confirmLabel: meta?.demoLoaded ? 'Reset Demo Data' : 'Load Demo Data'
      });
      if (!ok) return;
    }
    await store.resetDemoData();
    showToast('Sample garden data loaded.', 'success');
  });

  container.querySelector('#set-reset-all')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset All Application Data?',
      message:
        'This action cannot be undone. All plants, scheduled tasks, growth diary photos, and reward points will be permanently erased from this browser.',
      confirmLabel: 'Erase Everything',
      danger: true
    });
    if (ok) {
      await store.resetAllData();
      document.body.classList.remove('theme-soft-sage');
      showToast('All local PlantCare data cleared.', 'info');
    }
  });
}

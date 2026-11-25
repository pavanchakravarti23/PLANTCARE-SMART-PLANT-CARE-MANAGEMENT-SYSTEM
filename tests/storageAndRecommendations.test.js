import { beforeEach, describe, expect, it } from 'vitest';
import { PLANT_CARE_PROFILES, recommendCareForPlant } from '../src/data/plantDatabase.js';
import {
  STORAGE_KEY,
  StorageService,
  createDemoState,
  validateAndNormalizeState
} from '../src/services/storage.js';
import { validateImageFile } from '../src/utils/helpers.js';

describe('Storage, Import/Export Validation, Image Validation & Rule-Based Recommendations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads state cleanly from LocalStorage', () => {
    const demo = createDemoState('2026-11-25');
    expect(demo.plants).toHaveLength(5);
    const saved = StorageService.saveState(demo);
    expect(saved.ok).toBe(true);

    const loaded = StorageService.loadState();
    expect(loaded.recoveredFromCorruption).toBe(false);
    expect(loaded.state.plants).toHaveLength(5);
    expect(loaded.state.tasks.length).toBeGreaterThanOrEqual(8);
  });

  it('recovers gracefully from corrupted LocalStorage data', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupted-json');
    const loaded = StorageService.loadState();
    expect(loaded.recoveredFromCorruption).toBe(true);
    expect(loaded.state.plants).toEqual([]);
  });

  it('validates imported data and rejects malformed schemas', () => {
    const bad = validateAndNormalizeState({ foo: 'bar' });
    expect(bad.valid).toBe(false);

    const good = validateAndNormalizeState({
      plants: [{ id: 'p1', name: '<script>Tulsi</script>' }],
      tasks: [{ id: 't1', plantId: 'p1', dueDate: '2026-11-25' }]
    });
    expect(good.valid).toBe(true);
    expect(good.data.plants).toHaveLength(1);
    expect(good.data.tasks).toHaveLength(1);
  });

  it('validates supported image formats and file size limits', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1024 }).valid).toBe(true);
    expect(validateImageFile({ type: 'image/png', size: 1024 }).valid).toBe(true);
    expect(validateImageFile({ type: 'image/webp', size: 1024 }).valid).toBe(true);
    expect(validateImageFile({ type: 'image/gif', size: 1024 }).valid).toBe(false);
    expect(validateImageFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 }).valid).toBe(false);
  });

  it('includes all 10 required plants and returns rule-based general care guidance', () => {
    expect(PLANT_CARE_PROFILES.length).toBeGreaterThanOrEqual(10);
    const tulsi = recommendCareForPlant('Tulsi', 'Herbs');
    expect(tulsi.matched).toBe(true);
    expect(tulsi.profile.sunlightPreference).toContain('Full sun');

    const unknown = recommendCareForPlant('Rare Orchid', 'Flowering plants');
    expect(unknown.matched).toBe(false);
    expect(unknown.profile.wateringIntervalDays).toBeGreaterThan(0);
  });
});

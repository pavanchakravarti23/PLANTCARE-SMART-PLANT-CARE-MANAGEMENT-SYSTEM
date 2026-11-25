/**
 * Central Reactive Store for PlantCare.
 * Coordinates StorageService (LocalStorage), MediaDatabase (IndexedDB),
 * NotificationService, and pure business logic in engine.js.
 */

import { MediaDatabase } from './database.js';
import {
  addGrowthEntryInState,
  addPlantInState,
  addTaskInState,
  completeTaskInState,
  computeMetrics,
  deleteGrowthEntryInState,
  deletePlantInState,
  deleteTaskInState,
  skipTaskInState,
  snoozeTaskInState,
  togglePauseTaskInState,
  updatePlantInState,
  updateTaskInState
} from './engine.js';
import { NotificationService } from './notification.js';
import {
  createDemoState,
  createEmptyState,
  StorageService,
  validateAndNormalizeState
} from './storage.js';
import { getTodayLocal } from '../utils/dateUtils.js';

class PlantCareStore {
  constructor() {
    const loaded = StorageService.loadState();
    this.state = loaded.state;
    this.recoveredFromCorruption = loaded.recoveredFromCorruption;
    this.listeners = new Set();
    this.activeRoute = 'dashboard';
    this.selectedPlantId = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  commit(nextState) {
    this.state = nextState;
    const saved = StorageService.saveState(nextState);
    this.notify();
    return saved;
  }

  getState() {
    return this.state;
  }

  getMetrics(todayStr = getTodayLocal()) {
    return computeMetrics(this.state, todayStr);
  }

  async resolveImageSrc(imageId, fallbackImage = './images/default-plant.svg') {
    if (imageId) {
      const storedUrl = await MediaDatabase.getImageUrl(imageId);
      if (storedUrl) return storedUrl;
    }
    return fallbackImage || './images/default-plant.svg';
  }

  addPlant(plantInput) {
    const { state: next, plant } = addPlantInState(this.state, plantInput);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return plant;
  }

  async updatePlant(plantId, updates) {
    const { state: next, plant, removedImageId } = updatePlantInState(this.state, plantId, updates);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    if (removedImageId) {
      await MediaDatabase.deleteImage(removedImageId);
    }
    return plant;
  }

  async deletePlant(plantId) {
    const { state: next, deleted, imageIdsToDelete } = deletePlantInState(this.state, plantId);
    if (!deleted) return false;
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    await MediaDatabase.deleteImages(imageIdsToDelete);
    if (this.selectedPlantId === plantId) {
      this.selectedPlantId = null;
    }
    return true;
  }

  addTask(taskInput) {
    const { state: next, task } = addTaskInState(this.state, taskInput);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return task;
  }

  updateTask(taskId, updates) {
    const { state: next, task } = updateTaskInState(this.state, taskId, updates);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return task;
  }

  deleteTask(taskId) {
    const { state: next } = deleteTaskInState(this.state, taskId);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
  }

  togglePauseTask(taskId) {
    const { state: next, task } = togglePauseTaskInState(this.state, taskId);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return task;
  }

  completeTask(taskId, now = new Date()) {
    const result = completeTaskInState(this.state, taskId, now);
    if (!result.changed) return result;
    const saveRes = this.commit(result.state);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return result;
  }

  snoozeTask(taskId, days = 1) {
    const { state: next, task } = snoozeTaskInState(this.state, taskId, days, getTodayLocal());
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return task;
  }

  skipTask(taskId) {
    const result = skipTaskInState(this.state, taskId, getTodayLocal());
    const saveRes = this.commit(result.state);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return result;
  }

  addGrowthEntry(entryInput) {
    const { state: next, entry } = addGrowthEntryInState(this.state, entryInput);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return entry;
  }

  async deleteGrowthEntry(entryId) {
    const { state: next, removedImageId } = deleteGrowthEntryInState(this.state, entryId);
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
    if (removedImageId) {
      await MediaDatabase.deleteImage(removedImageId);
    }
  }

  updateSettings(partialSettings) {
    const current = this.state.settings;
    const nextSettings = {
      ...current,
      ...partialSettings,
      preferences: {
        ...current.preferences,
        ...(partialSettings.preferences || {})
      }
    };
    const saveRes = this.commit({
      ...this.state,
      settings: nextSettings
    });
    if (!saveRes.ok) throw new Error(saveRes.error);
    return nextSettings;
  }

  async loadDemoData() {
    const demo = createDemoState(getTodayLocal());
    // Preserve user settings while loading demo plants/tasks/growth/rewards
    const next = {
      ...demo,
      settings: { ...this.state.settings }
    };
    const saveRes = this.commit(next);
    if (!saveRes.ok) throw new Error(saveRes.error);
  }

  async resetDemoData() {
    await MediaDatabase.clearAllImages();
    await this.loadDemoData();
  }

  async resetAllData() {
    await MediaDatabase.clearAllImages();
    const empty = createEmptyState();
    const saveRes = this.commit(empty);
    if (!saveRes.ok) throw new Error(saveRes.error);
  }

  async exportBundle() {
    const images = await MediaDatabase.exportAllImages();
    return {
      app: 'PlantCare',
      exportedAt: new Date().toISOString(),
      data: this.state,
      images
    };
  }

  async importBundle(rawPayload) {
    const dataCandidate = rawPayload?.data && rawPayload?.app === 'PlantCare' ? rawPayload.data : rawPayload;
    const validation = validateAndNormalizeState(dataCandidate);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    await MediaDatabase.clearAllImages();
    if (rawPayload?.images && typeof rawPayload.images === 'object') {
      await MediaDatabase.importAllImages(rawPayload.images);
    }

    const saveRes = this.commit(validation.data);
    if (!saveRes.ok) throw new Error(saveRes.error);
    return validation.data;
  }

  triggerStartupNotificationCheck() {
    const metrics = this.getMetrics();
    NotificationService.notifyDueSummary(
      metrics.overdueCount,
      metrics.dueTodayCount,
      this.state.settings.notificationsEnabled
    );
  }
}

export const store = new PlantCareStore();

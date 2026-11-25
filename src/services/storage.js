import { addDaysLocal, getTodayLocal, isValidLocalDate } from '../utils/dateUtils.js';

export const STORAGE_KEY = 'plantcare_app_data_v1';
export const SCHEMA_VERSION = 1;

export function getDefaultSettings() {
  return {
    displayName: 'Gardener',
    notificationsEnabled: false,
    theme: 'light',
    preferences: {
      dateFormat: 'DD MMM YYYY',
      timeFormat: '12h'
    }
  };
}

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    plants: [],
    tasks: [],
    growthEntries: [],
    rewards: [],
    settings: getDefaultSettings(),
    meta: {
      demoLoaded: false,
      lastUpdatedAt: new Date().toISOString()
    }
  };
}

/**
 * Generates deterministic demo data anchored to the user's current local date
 * so overdue, due today, upcoming, and completed tasks are immediately demonstrable.
 * @param {string} [todayStr]
 * @returns {object}
 */
export function createDemoState(todayStr = getTodayLocal()) {
  const yesterday = addDaysLocal(todayStr, -1);
  const twoDaysAgo = addDaysLocal(todayStr, -2);
  const threeDaysAgo = addDaysLocal(todayStr, -3);
  const fiveDaysAgo = addDaysLocal(todayStr, -5);
  const tomorrow = addDaysLocal(todayStr, 1);
  const inThreeDays = addDaysLocal(todayStr, 3);
  const inFiveDays = addDaysLocal(todayStr, 5);

  const plants = [
    {
      id: 'demo-plant-tulsi',
      name: 'Tulsi',
      type: 'Holy Basil',
      category: 'Herbs',
      imageId: null,
      fallbackImage: './images/tulsi.svg',
      dateAdded: addDaysLocal(todayStr, -30),
      location: 'Balcony',
      sunlightPreference: 'Full sun (6+ hrs)',
      wateringInterval: 2,
      fertilisingInterval: 21,
      notes: 'Morning sun balcony pot. Pinching flower spikes every two weeks.'
    },
    {
      id: 'demo-plant-rose',
      name: 'Rose',
      type: 'Hybrid Tea Rose',
      category: 'Flowering plants',
      imageId: null,
      fallbackImage: './images/rose.svg',
      dateAdded: addDaysLocal(todayStr, -45),
      location: 'Garden',
      sunlightPreference: 'Full sun (6+ hrs)',
      wateringInterval: 2,
      fertilisingInterval: 14,
      notes: 'Red garden rose near east fence; feed every 2 weeks during bloom.'
    },
    {
      id: 'demo-plant-aloe',
      name: 'Aloe Vera',
      type: 'Aloe barbadensis',
      category: 'Succulents',
      imageId: null,
      fallbackImage: './images/aloe-vera.svg',
      dateAdded: addDaysLocal(todayStr, -60),
      location: 'Bedroom',
      sunlightPreference: 'Bright indirect light',
      wateringInterval: 14,
      fertilisingInterval: 30,
      notes: 'Terracotta pot on bright windowsill. Wait until soil dries completely.'
    },
    {
      id: 'demo-plant-money',
      name: 'Money Plant',
      type: 'Golden Pothos',
      category: 'Indoor plants',
      imageId: null,
      fallbackImage: './images/money-plant.svg',
      dateAdded: addDaysLocal(todayStr, -25),
      location: 'Living room',
      sunlightPreference: 'Bright indirect light',
      wateringInterval: 7,
      fertilisingInterval: 30,
      notes: 'Trailing shelf plant; wipe dust off leaves every two weeks.'
    },
    {
      id: 'demo-plant-snake',
      name: 'Snake Plant',
      type: 'Dracaena trifasciata',
      category: 'Indoor plants',
      imageId: null,
      fallbackImage: './images/snake-plant.svg',
      dateAdded: addDaysLocal(todayStr, -40),
      location: 'Bedroom',
      sunlightPreference: 'Low to medium light',
      wateringInterval: 14,
      fertilisingInterval: 30,
      notes: 'Low-maintenance corner purifier; avoid overwatering.'
    }
  ];

  const tasks = [
    {
      id: 'demo-task-overdue-1',
      plantId: 'demo-plant-rose',
      activityType: 'Watering',
      title: 'Deep water Rose at base',
      dueDate: yesterday,
      dueTime: '07:30',
      repeatInterval: 'every_2_days',
      customIntervalDays: 2,
      status: 'pending',
      paused: false,
      notes: 'Water soil slowly without wetting leaves.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-overdue-2',
      plantId: 'demo-plant-tulsi',
      activityType: 'Fertilising',
      title: 'Feed Tulsi organic compost tea',
      dueDate: twoDaysAgo,
      dueTime: '08:30',
      repeatInterval: 'custom',
      customIntervalDays: 21,
      status: 'pending',
      paused: false,
      notes: 'Diluted liquid feed after light watering.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-today-1',
      plantId: 'demo-plant-tulsi',
      activityType: 'Watering',
      title: 'Water Tulsi',
      dueDate: todayStr,
      dueTime: '08:00',
      repeatInterval: 'every_2_days',
      customIntervalDays: 2,
      status: 'pending',
      paused: false,
      notes: 'Check top inch of soil before watering.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-today-2',
      plantId: 'demo-plant-money',
      activityType: 'General maintenance',
      title: 'Wipe Money Plant leaves',
      dueDate: todayStr,
      dueTime: '17:30',
      repeatInterval: 'biweekly',
      customIntervalDays: 14,
      status: 'pending',
      paused: false,
      notes: 'Remove dust gently with a damp soft cloth.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-upcoming-1',
      plantId: 'demo-plant-aloe',
      activityType: 'Watering',
      title: 'Check & water Aloe Vera',
      dueDate: tomorrow,
      dueTime: '09:00',
      repeatInterval: 'biweekly',
      customIntervalDays: 14,
      status: 'pending',
      paused: false,
      notes: 'Confirm potting mix is dry all the way down.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-upcoming-2',
      plantId: 'demo-plant-snake',
      activityType: 'Sunlight check',
      title: 'Rotate Snake Plant pot',
      dueDate: inThreeDays,
      dueTime: '10:00',
      repeatInterval: 'weekly',
      customIntervalDays: 7,
      status: 'pending',
      paused: false,
      notes: 'Quarter-turn rotation for upright leaf growth.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-upcoming-3',
      plantId: 'demo-plant-rose',
      activityType: 'Pruning',
      title: 'Deadhead faded Rose blooms',
      dueDate: inFiveDays,
      dueTime: '07:45',
      repeatInterval: 'weekly',
      customIntervalDays: 7,
      status: 'pending',
      paused: false,
      notes: 'Cut above outward-facing 5-leaflet node.',
      completedAt: null,
      nextDueDate: null
    },
    {
      id: 'demo-task-completed-1',
      plantId: 'demo-plant-tulsi',
      activityType: 'Watering',
      title: 'Morning watering for Tulsi',
      dueDate: twoDaysAgo,
      dueTime: '08:00',
      repeatInterval: 'every_2_days',
      customIntervalDays: 2,
      status: 'completed',
      paused: false,
      notes: 'Soil moisture checked and watered evenly.',
      completedAt: `${twoDaysAgo}T08:15:00`,
      nextDueDate: todayStr
    },
    {
      id: 'demo-task-completed-2',
      plantId: 'demo-plant-money',
      activityType: 'Watering',
      title: 'Weekly watering for Money Plant',
      dueDate: threeDaysAgo,
      dueTime: '09:00',
      repeatInterval: 'weekly',
      customIntervalDays: 7,
      status: 'completed',
      paused: false,
      notes: 'Drained excess water from saucer.',
      completedAt: `${threeDaysAgo}T09:10:00`,
      nextDueDate: addDaysLocal(threeDaysAgo, 7)
    },
    {
      id: 'demo-task-completed-3',
      plantId: 'demo-plant-aloe',
      activityType: 'Sunlight check',
      title: 'Rotate Aloe Vera on sill',
      dueDate: fiveDaysAgo,
      dueTime: '10:00',
      repeatInterval: 'weekly',
      customIntervalDays: 7,
      status: 'completed',
      paused: false,
      notes: 'Healthy firm leaves with no sunburn.',
      completedAt: `${fiveDaysAgo}T10:05:00`,
      nextDueDate: addDaysLocal(fiveDaysAgo, 7)
    }
  ];

  const growthEntries = [
    {
      id: 'demo-growth-1',
      plantId: 'demo-plant-tulsi',
      imageId: null,
      fallbackImage: './images/tulsi.svg',
      observationDate: addDaysLocal(todayStr, -21),
      description: 'Repotted young Tulsi seedling into a 10-inch terracotta pot with compost-rich mix.'
    },
    {
      id: 'demo-growth-2',
      plantId: 'demo-plant-tulsi',
      imageId: null,
      fallbackImage: './images/tulsi.svg',
      observationDate: addDaysLocal(todayStr, -7),
      description: 'New lateral shoots emerged after pinching initial flower buds. Foliage looks dense and aromatic.'
    },
    {
      id: 'demo-growth-3',
      plantId: 'demo-plant-rose',
      imageId: null,
      fallbackImage: './images/rose.svg',
      observationDate: addDaysLocal(todayStr, -14),
      description: 'Two healthy flower buds spotted on the main stem after organic feeding.'
    }
  ];

  const rewards = [
    {
      id: 'demo-reward-1',
      taskId: 'demo-task-completed-3',
      points: 10,
      awardedAt: `${fiveDaysAgo}T10:05:00`,
      reason: 'Completed: Rotate Aloe Vera on sill'
    },
    {
      id: 'demo-reward-2',
      taskId: 'demo-task-completed-2',
      points: 10,
      awardedAt: `${threeDaysAgo}T09:10:00`,
      reason: 'Completed: Weekly watering for Money Plant'
    },
    {
      id: 'demo-reward-3',
      taskId: 'demo-task-completed-1',
      points: 10,
      awardedAt: `${twoDaysAgo}T08:15:00`,
      reason: 'Completed: Morning watering for Tulsi'
    }
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    plants,
    tasks,
    growthEntries,
    rewards,
    settings: getDefaultSettings(),
    meta: {
      demoLoaded: true,
      lastUpdatedAt: new Date().toISOString()
    }
  };
}

/**
 * Validates and normalizes parsed JSON state, protecting against corrupted or missing fields.
 * @param {unknown} raw
 * @returns {{ valid: boolean, data: object, errors: string[] }}
 */
export function validateAndNormalizeState(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, data: createEmptyState(), errors: ['Root payload must be a JSON object.'] };
  }

  const base = createEmptyState();

  if (!Array.isArray(raw.plants)) errors.push('Missing or invalid "plants" array.');
  if (!Array.isArray(raw.tasks)) errors.push('Missing or invalid "tasks" array.');
  if (raw.growthEntries !== undefined && !Array.isArray(raw.growthEntries)) {
    errors.push('Invalid "growthEntries" array.');
  }
  if (raw.rewards !== undefined && !Array.isArray(raw.rewards)) {
    errors.push('Invalid "rewards" array.');
  }

  if (errors.length > 0) {
    return { valid: false, data: base, errors };
  }

  const plants = raw.plants
    .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string')
    .map((p) => ({
      id: p.id.trim(),
      name: p.name.trim().slice(0, 120),
      type: typeof p.type === 'string' ? p.type.trim().slice(0, 120) : '',
      category: typeof p.category === 'string' ? p.category : 'Indoor plants',
      imageId: typeof p.imageId === 'string' ? p.imageId : null,
      fallbackImage: typeof p.fallbackImage === 'string' ? p.fallbackImage : './images/default-plant.svg',
      dateAdded: isValidLocalDate(p.dateAdded) ? p.dateAdded : getTodayLocal(),
      location: typeof p.location === 'string' ? p.location : 'Balcony',
      sunlightPreference: typeof p.sunlightPreference === 'string' ? p.sunlightPreference : 'Bright indirect light',
      wateringInterval: Math.max(1, Math.min(365, Number(p.wateringInterval) || 3)),
      fertilisingInterval: Math.max(1, Math.min(365, Number(p.fertilisingInterval) || 30)),
      notes: typeof p.notes === 'string' ? p.notes.slice(0, 1000) : ''
    }));

  const validPlantIds = new Set(plants.map((p) => p.id));

  const tasks = raw.tasks
    .filter(
      (t) =>
        t &&
        typeof t === 'object' &&
        typeof t.id === 'string' &&
        typeof t.plantId === 'string' &&
        validPlantIds.has(t.plantId) &&
        isValidLocalDate(t.dueDate)
    )
    .map((t) => ({
      id: t.id.trim(),
      plantId: t.plantId,
      activityType: typeof t.activityType === 'string' ? t.activityType : 'Watering',
      title: typeof t.title === 'string' && t.title.trim() ? t.title.trim().slice(0, 140) : t.activityType || 'Care task',
      dueDate: t.dueDate,
      dueTime: typeof t.dueTime === 'string' && /^\d{2}:\d{2}$/.test(t.dueTime) ? t.dueTime : '08:00',
      repeatInterval: typeof t.repeatInterval === 'string' ? t.repeatInterval : 'none',
      customIntervalDays: Math.max(1, Math.min(365, Number(t.customIntervalDays) || 1)),
      status: ['pending', 'completed', 'skipped'].includes(t.status) ? t.status : 'pending',
      paused: Boolean(t.paused),
      notes: typeof t.notes === 'string' ? t.notes.slice(0, 1000) : '',
      completedAt: typeof t.completedAt === 'string' ? t.completedAt : null,
      nextDueDate: isValidLocalDate(t.nextDueDate) ? t.nextDueDate : null
    }));

  const growthEntries = (raw.growthEntries || [])
    .filter(
      (g) =>
        g &&
        typeof g === 'object' &&
        typeof g.id === 'string' &&
        typeof g.plantId === 'string' &&
        validPlantIds.has(g.plantId)
    )
    .map((g) => ({
      id: g.id.trim(),
      plantId: g.plantId,
      imageId: typeof g.imageId === 'string' ? g.imageId : null,
      fallbackImage: typeof g.fallbackImage === 'string' ? g.fallbackImage : './images/default-plant.svg',
      observationDate: isValidLocalDate(g.observationDate) ? g.observationDate : getTodayLocal(),
      description: typeof g.description === 'string' ? g.description.slice(0, 1500) : ''
    }));

  const rewards = (raw.rewards || [])
    .filter((r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.taskId === 'string')
    .map((r) => ({
      id: r.id.trim(),
      taskId: r.taskId,
      points: Math.max(0, Number(r.points) || 0),
      awardedAt: typeof r.awardedAt === 'string' ? r.awardedAt : new Date().toISOString(),
      reason: typeof r.reason === 'string' ? r.reason.slice(0, 200) : 'Care reward'
    }));

  const defaultSettings = getDefaultSettings();
  const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const settings = {
    displayName:
      typeof rawSettings.displayName === 'string' && rawSettings.displayName.trim()
        ? rawSettings.displayName.trim().slice(0, 60)
        : defaultSettings.displayName,
    notificationsEnabled: Boolean(rawSettings.notificationsEnabled),
    theme: rawSettings.theme === 'soft-sage' ? 'soft-sage' : 'light',
    preferences: {
      dateFormat: ['DD MMM YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'].includes(rawSettings.preferences?.dateFormat)
        ? rawSettings.preferences.dateFormat
        : defaultSettings.preferences.dateFormat,
      timeFormat: ['12h', '24h'].includes(rawSettings.preferences?.timeFormat)
        ? rawSettings.preferences.timeFormat
        : defaultSettings.preferences.timeFormat
    }
  };

  return {
    valid: true,
    data: {
      schemaVersion: SCHEMA_VERSION,
      plants,
      tasks,
      growthEntries,
      rewards,
      settings,
      meta: {
        demoLoaded: Boolean(raw.meta?.demoLoaded),
        lastUpdatedAt: new Date().toISOString()
      }
    },
    errors: []
  };
}

export const StorageService = {
  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { state: createEmptyState(), recoveredFromCorruption: false };
      }
      const parsed = JSON.parse(raw);
      const result = validateAndNormalizeState(parsed);
      if (!result.valid) {
        return { state: createEmptyState(), recoveredFromCorruption: true };
      }
      return { state: result.data, recoveredFromCorruption: false };
    } catch {
      return { state: createEmptyState(), recoveredFromCorruption: true };
    }
  },

  saveState(state) {
    try {
      const toSave = {
        ...state,
        schemaVersion: SCHEMA_VERSION,
        meta: {
          ...(state.meta || {}),
          lastUpdatedAt: new Date().toISOString()
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Unable to save to browser LocalStorage.'
      };
    }
  },

  clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || 'Failed to clear LocalStorage.' };
    }
  }
};

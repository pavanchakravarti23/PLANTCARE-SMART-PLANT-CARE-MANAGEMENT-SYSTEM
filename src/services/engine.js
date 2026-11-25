/**
 * Core Business Logic Engine for PlantCare:
 * - Priority-based Reminder Engine (Overdue = High, Due Today = Medium, Upcoming = Normal)
 * - Smart Care Scheduler (idempotent completion, non-duplicating recurring occurrences)
 * - Gamification & Streak Engine (duplicate-proof rewards, real date-based streaks)
 * - Plant CRUD & Safe Cascade Deletion
 */

import {
  addDaysLocal,
  calculateNextDueDate,
  diffDaysLocal,
  formatLocalDate,
  getLastNDates,
  getTodayLocal,
  isValidLocalDate,
  pad2
} from '../utils/dateUtils.js';
import { generateId } from '../utils/helpers.js';

export const ACTIVITY_TYPES = [
  'Watering',
  'Fertilising',
  'Pruning',
  'Repotting',
  'Sunlight check',
  'General maintenance',
  'Custom activity'
];

export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'every_2_days', label: 'Every 2 days' },
  { value: 'every_3_days', label: 'Every 3 days' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
  { value: 'custom', label: 'Custom interval' }
];

export const POINTS_PER_TASK = 10;
export const DAILY_ALL_DONE_BONUS = 20;

/**
 * Computes live status for a care task relative to todayStr.
 * Pending tasks past due are Overdue; never auto-completed.
 */
export function deriveTaskComputedStatus(task, todayStr = getTodayLocal()) {
  if (!task) return 'upcoming';
  if (task.status === 'completed') return 'completed';
  if (task.status === 'skipped') return 'skipped';

  const diff = diffDaysLocal(todayStr, task.dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due_today';
  return 'upcoming';
}

/**
 * Assigns priority rank and label based on due date relative to todayStr.
 */
export function deriveTaskPriority(task, todayStr = getTodayLocal()) {
  const computed = deriveTaskComputedStatus(task, todayStr);
  switch (computed) {
    case 'overdue':
      return { level: 'HIGH', rank: 1, label: 'High Priority', computedStatus: computed };
    case 'due_today':
      return { level: 'MEDIUM', rank: 2, label: 'Medium Priority', computedStatus: computed };
    case 'upcoming':
      return { level: 'NORMAL', rank: 3, label: 'Normal Priority', computedStatus: computed };
    default:
      return { level: 'NONE', rank: 4, label: 'Resolved', computedStatus: computed };
  }
}

/**
 * Sorts tasks by:
 * 1. Priority (High / Overdue -> Medium / Due Today -> Normal / Upcoming -> Resolved)
 * 2. Due date ascending
 * 3. Scheduled time ascending
 */
export function sortTasksByPriority(tasks, todayStr = getTodayLocal()) {
  return [...tasks].sort((a, b) => {
    const pA = deriveTaskPriority(a, todayStr).rank;
    const pB = deriveTaskPriority(b, todayStr).rank;
    if (pA !== pB) return pA - pB;

    if (a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    const timeA = a.dueTime || '08:00';
    const timeB = b.dueTime || '08:00';
    return timeA.localeCompare(timeB);
  });
}

/**
 * Enriches tasks with plant metadata, computed status, and priority info.
 */
export function getPrioritizedReminders(state, todayStr = getTodayLocal()) {
  const plantMap = new Map(state.plants.map((p) => [p.id, p]));
  const enriched = state.tasks
    .filter((t) => plantMap.has(t.plantId))
    .map((task) => {
      const priority = deriveTaskPriority(task, todayStr);
      return {
        ...task,
        plant: plantMap.get(task.plantId),
        computedStatus: priority.computedStatus,
        priorityLevel: priority.level,
        priorityRank: priority.rank,
        priorityLabel: priority.label
      };
    });

  return sortTasksByPriority(enriched, todayStr);
}

/**
 * Returns the next active pending task for a given plant.
 */
export function getNextTaskForPlant(state, plantId, todayStr = getTodayLocal()) {
  const pending = state.tasks.filter((t) => t.plantId === plantId && t.status === 'pending');
  if (pending.length === 0) return null;
  const sorted = sortTasksByPriority(pending, todayStr);
  return {
    ...sorted[0],
    computedStatus: deriveTaskComputedStatus(sorted[0], todayStr)
  };
}

/**
 * Adds a new plant and returns the updated state + created plant.
 */
export function addPlantInState(state, plantInput) {
  const name = String(plantInput.name || '').trim();
  if (!name) throw new Error('Plant name is required.');

  const plant = {
    id: plantInput.id || generateId('plant'),
    name: name.slice(0, 120),
    type: String(plantInput.type || '').trim().slice(0, 120),
    category: plantInput.category || 'Indoor plants',
    imageId: plantInput.imageId || null,
    fallbackImage: plantInput.fallbackImage || './images/default-plant.svg',
    dateAdded: isValidLocalDate(plantInput.dateAdded) ? plantInput.dateAdded : getTodayLocal(),
    location: plantInput.location || 'Balcony',
    sunlightPreference: plantInput.sunlightPreference || 'Bright indirect light',
    wateringInterval: Math.max(1, Math.min(365, Number(plantInput.wateringInterval) || 3)),
    fertilisingInterval: Math.max(1, Math.min(365, Number(plantInput.fertilisingInterval) || 30)),
    notes: String(plantInput.notes || '').trim().slice(0, 1000)
  };

  return {
    state: {
      ...state,
      plants: [plant, ...state.plants]
    },
    plant
  };
}

/**
 * Updates an existing plant by ID.
 */
export function updatePlantInState(state, plantId, updates) {
  const existing = state.plants.find((p) => p.id === plantId);
  if (!existing) throw new Error('Plant not found.');

  const name = updates.name !== undefined ? String(updates.name).trim() : existing.name;
  if (!name) throw new Error('Plant name cannot be empty.');

  const updatedPlant = {
    ...existing,
    ...updates,
    id: existing.id,
    name: name.slice(0, 120),
    type: updates.type !== undefined ? String(updates.type).trim().slice(0, 120) : existing.type,
    wateringInterval:
      updates.wateringInterval !== undefined
        ? Math.max(1, Math.min(365, Number(updates.wateringInterval) || 3))
        : existing.wateringInterval,
    fertilisingInterval:
      updates.fertilisingInterval !== undefined
        ? Math.max(1, Math.min(365, Number(updates.fertilisingInterval) || 30))
        : existing.fertilisingInterval,
    notes: updates.notes !== undefined ? String(updates.notes).trim().slice(0, 1000) : existing.notes
  };

  return {
    state: {
      ...state,
      plants: state.plants.map((p) => (p.id === plantId ? updatedPlant : p))
    },
    plant: updatedPlant,
    removedImageId:
      existing.imageId && updates.imageId !== undefined && updates.imageId !== existing.imageId
        ? existing.imageId
        : null
  };
}

/**
 * Deletes a plant and safely cascades removal to its tasks and growth diary entries.
 * Returns image IDs to clean up from IndexedDB.
 */
export function deletePlantInState(state, plantId) {
  const target = state.plants.find((p) => p.id === plantId);
  if (!target) {
    return { state, deleted: false, imageIdsToDelete: [] };
  }

  const imageIdsToDelete = [];
  if (target.imageId) imageIdsToDelete.push(target.imageId);

  const growthEntriesToDelete = state.growthEntries.filter((g) => g.plantId === plantId);
  for (const entry of growthEntriesToDelete) {
    if (entry.imageId) imageIdsToDelete.push(entry.imageId);
  }

  return {
    state: {
      ...state,
      plants: state.plants.filter((p) => p.id !== plantId),
      tasks: state.tasks.filter((t) => t.plantId !== plantId),
      growthEntries: state.growthEntries.filter((g) => g.plantId !== plantId)
    },
    deleted: true,
    imageIdsToDelete
  };
}

/**
 * Creates a scheduled care task while preventing exact duplicate pending tasks
 * on the same plant, activityType, and dueDate.
 */
export function addTaskInState(state, taskInput) {
  const plant = state.plants.find((p) => p.id === taskInput.plantId);
  if (!plant) throw new Error('Please select a valid plant.');
  if (!isValidLocalDate(taskInput.dueDate)) throw new Error('Please choose a valid start date.');

  const activityType = taskInput.activityType || 'Watering';
  const title = String(taskInput.title || `${activityType} — ${plant.name}`).trim().slice(0, 140);

  const duplicatePending = state.tasks.find(
    (t) =>
      t.status === 'pending' &&
      t.plantId === plant.id &&
      t.activityType === activityType &&
      t.dueDate === taskInput.dueDate
  );

  if (duplicatePending) {
    throw new Error(`A pending ${activityType} task for ${plant.name} already exists on ${taskInput.dueDate}.`);
  }

  const task = {
    id: taskInput.id || generateId('task'),
    plantId: plant.id,
    activityType,
    title,
    dueDate: taskInput.dueDate,
    dueTime: /^\d{2}:\d{2}$/.test(taskInput.dueTime || '') ? taskInput.dueTime : '08:00',
    repeatInterval: taskInput.repeatInterval || 'none',
    customIntervalDays: Math.max(1, Math.min(365, Number(taskInput.customIntervalDays) || 1)),
    status: 'pending',
    paused: Boolean(taskInput.paused),
    notes: String(taskInput.notes || '').trim().slice(0, 1000),
    completedAt: null,
    nextDueDate: null
  };

  return {
    state: {
      ...state,
      tasks: [...state.tasks, task]
    },
    task
  };
}

/**
 * Updates an existing schedule/task.
 */
export function updateTaskInState(state, taskId, updates) {
  const existing = state.tasks.find((t) => t.id === taskId);
  if (!existing) throw new Error('Scheduled task not found.');

  if (updates.dueDate !== undefined && !isValidLocalDate(updates.dueDate)) {
    throw new Error('Invalid due date.');
  }

  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    customIntervalDays:
      updates.customIntervalDays !== undefined
        ? Math.max(1, Math.min(365, Number(updates.customIntervalDays) || 1))
        : existing.customIntervalDays
  };

  return {
    state: {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t))
    },
    task: updated
  };
}

/**
 * Deletes a scheduled task.
 */
export function deleteTaskInState(state, taskId) {
  return {
    state: {
      ...state,
      tasks: state.tasks.filter((t) => t.id !== taskId)
    }
  };
}

/**
 * Toggles pause/resume on a recurring schedule.
 */
export function togglePauseTaskInState(state, taskId) {
  const existing = state.tasks.find((t) => t.id === taskId);
  if (!existing) throw new Error('Task not found.');
  return updateTaskInState(state, taskId, { paused: !existing.paused });
}

/**
 * Completes a task safely:
 * 1. Prevents duplicate completion.
 * 2. Saves local ISO completion timestamp.
 * 3. Generates next recurring task if recurring & not paused (preventing duplicates).
 * 4. Awards +10 points (preventing duplicate reward for taskId).
 * 5. Awards +20 daily bonus if all tasks due today are now completed (preventing duplicate daily bonus).
 */
export function completeTaskInState(state, taskId, now = new Date()) {
  const target = state.tasks.find((t) => t.id === taskId);
  if (!target) {
    return { state, changed: false, error: 'Task not found.' };
  }
  if (target.status === 'completed') {
    return { state, changed: false, error: 'Task is already completed.' };
  }

  const todayStr = formatLocalDate(now);
  const completedAt = `${todayStr}T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  let nextDueDate = null;
  let nextTask = null;

  if (target.repeatInterval && target.repeatInterval !== 'none' && !target.paused) {
    nextDueDate = calculateNextDueDate(
      target.dueDate,
      target.repeatInterval,
      target.customIntervalDays,
      todayStr
    );

    if (nextDueDate) {
      const alreadyExists = state.tasks.some(
        (t) =>
          t.id !== target.id &&
          t.status === 'pending' &&
          t.plantId === target.plantId &&
          t.activityType === target.activityType &&
          t.dueDate === nextDueDate
      );

      if (!alreadyExists) {
        nextTask = {
          id: generateId('task'),
          plantId: target.plantId,
          activityType: target.activityType,
          title: target.title,
          dueDate: nextDueDate,
          dueTime: target.dueTime || '08:00',
          repeatInterval: target.repeatInterval,
          customIntervalDays: target.customIntervalDays || 1,
          status: 'pending',
          paused: false,
          notes: target.notes || '',
          completedAt: null,
          nextDueDate: null
        };
      }
    }
  }

  const updatedTasks = state.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          status: 'completed',
          completedAt,
          nextDueDate
        }
      : t
  );
  if (nextTask) {
    updatedTasks.push(nextTask);
  }

  const updatedRewards = [...state.rewards];
  let pointsAwarded = 0;
  let bonusAwarded = 0;

  const hasTaskReward = updatedRewards.some((r) => r.taskId === taskId);
  if (!hasTaskReward) {
    updatedRewards.push({
      id: generateId('reward'),
      taskId,
      points: POINTS_PER_TASK,
      awardedAt: completedAt,
      reason: `Completed: ${target.title}`
    });
    pointsAwarded += POINTS_PER_TASK;
  }

  // Daily bonus check: all tasks due on todayStr are now completed (and at least 1 task was due today)
  const tasksDueToday = updatedTasks.filter((t) => t.dueDate === todayStr && t.status !== 'skipped');
  const allDueTodayDone =
    tasksDueToday.length > 0 && tasksDueToday.every((t) => t.status === 'completed');
  const dailyBonusKey = `daily_bonus:${todayStr}`;
  const hasDailyBonus = updatedRewards.some((r) => r.taskId === dailyBonusKey);

  if (allDueTodayDone && !hasDailyBonus) {
    updatedRewards.push({
      id: generateId('reward'),
      taskId: dailyBonusKey,
      points: DAILY_ALL_DONE_BONUS,
      awardedAt: completedAt,
      reason: `Daily Care Sweep (${todayStr})`
    });
    bonusAwarded += DAILY_ALL_DONE_BONUS;
  }

  return {
    state: {
      ...state,
      tasks: updatedTasks,
      rewards: updatedRewards
    },
    changed: true,
    pointsAwarded,
    bonusAwarded,
    nextDueDate,
    nextTask
  };
}

/**
 * Snoozes a pending task by N days (defaults to 1 day from today or due date, whichever is later).
 */
export function snoozeTaskInState(state, taskId, days = 1, todayStr = getTodayLocal()) {
  const target = state.tasks.find((t) => t.id === taskId);
  if (!target) throw new Error('Task not found.');
  if (target.status !== 'pending') throw new Error('Only pending tasks can be snoozed.');

  const baseDate = diffDaysLocal(todayStr, target.dueDate) < 0 ? todayStr : target.dueDate;
  const newDueDate = addDaysLocal(baseDate, Math.max(1, Number(days) || 1));
  return updateTaskInState(state, taskId, { dueDate: newDueDate });
}

/**
 * Skips a task without awarding reward points.
 * If recurring and not paused, schedules the next cycle cleanly.
 */
export function skipTaskInState(state, taskId, todayStr = getTodayLocal()) {
  const target = state.tasks.find((t) => t.id === taskId);
  if (!target) throw new Error('Task not found.');
  if (target.status !== 'pending') throw new Error('Task is already resolved.');

  let nextDueDate = null;
  let nextTask = null;

  if (target.repeatInterval && target.repeatInterval !== 'none' && !target.paused) {
    nextDueDate = calculateNextDueDate(
      target.dueDate,
      target.repeatInterval,
      target.customIntervalDays,
      todayStr
    );
    if (nextDueDate) {
      const exists = state.tasks.some(
        (t) =>
          t.id !== target.id &&
          t.status === 'pending' &&
          t.plantId === target.plantId &&
          t.activityType === target.activityType &&
          t.dueDate === nextDueDate
      );
      if (!exists) {
        nextTask = {
          id: generateId('task'),
          plantId: target.plantId,
          activityType: target.activityType,
          title: target.title,
          dueDate: nextDueDate,
          dueTime: target.dueTime || '08:00',
          repeatInterval: target.repeatInterval,
          customIntervalDays: target.customIntervalDays || 1,
          status: 'pending',
          paused: false,
          notes: target.notes || '',
          completedAt: null,
          nextDueDate: null
        };
      }
    }
  }

  const updatedTasks = state.tasks.map((t) =>
    t.id === taskId ? { ...t, status: 'skipped', nextDueDate } : t
  );
  if (nextTask) updatedTasks.push(nextTask);

  return {
    state: {
      ...state,
      tasks: updatedTasks
    },
    nextDueDate
  };
}

/**
 * Adds a growth diary entry.
 */
export function addGrowthEntryInState(state, entryInput) {
  const plant = state.plants.find((p) => p.id === entryInput.plantId);
  if (!plant) throw new Error('Select a valid plant for this growth entry.');
  if (!isValidLocalDate(entryInput.observationDate)) {
    throw new Error('Select a valid observation date.');
  }
  const description = String(entryInput.description || '').trim();
  if (!description) throw new Error('Please write an observation note.');

  const entry = {
    id: entryInput.id || generateId('growth'),
    plantId: plant.id,
    imageId: entryInput.imageId || null,
    fallbackImage: entryInput.fallbackImage || plant.fallbackImage || './images/default-plant.svg',
    observationDate: entryInput.observationDate,
    description: description.slice(0, 1500)
  };

  return {
    state: {
      ...state,
      growthEntries: [...state.growthEntries, entry]
    },
    entry
  };
}

/**
 * Deletes a growth diary entry and returns any associated imageId for IndexedDB cleanup.
 */
export function deleteGrowthEntryInState(state, entryId) {
  const target = state.growthEntries.find((g) => g.id === entryId);
  return {
    state: {
      ...state,
      growthEntries: state.growthEntries.filter((g) => g.id !== entryId)
    },
    removedImageId: target?.imageId || null
  };
}

/**
 * Calculates real points, daily/weekly streaks, monthly progress, and achievement badges.
 */
export function calculateRewardsSummary(state, todayStr = getTodayLocal()) {
  const totalPoints = state.rewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  const completedTasks = state.tasks.filter((t) => t.status === 'completed' && t.completedAt);

  const completedDates = Array.from(
    new Set(
      completedTasks
        .map((t) => String(t.completedAt).slice(0, 10))
        .filter((d) => isValidLocalDate(d))
    )
  ).sort();

  const dateSet = new Set(completedDates);

  // Current streak: consecutive days ending today or yesterday
  let currentStreak = 0;
  let cursor = dateSet.has(todayStr) ? todayStr : addDaysLocal(todayStr, -1);
  if (dateSet.has(cursor)) {
    while (dateSet.has(cursor)) {
      currentStreak += 1;
      cursor = addDaysLocal(cursor, -1);
    }
  }

  // Longest streak across all completion records
  let longestStreak = 0;
  let running = 0;
  let prev = null;
  for (const d of completedDates) {
    if (prev && diffDaysLocal(prev, d) === 1) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestStreak) longestStreak = running;
    prev = d;
  }

  // Weekly active days (last 7 days)
  const last7 = getLastNDates(7, todayStr);
  const weeklyActiveDays = last7.filter((d) => dateSet.has(d)).length;

  // Monthly completion count (current calendar month)
  const currentMonthPrefix = todayStr.slice(0, 7);
  const monthlyCompletedCount = completedTasks.filter(
    (t) => String(t.completedAt).slice(0, 7) === currentMonthPrefix
  ).length;
  const monthlyScheduledCount = state.tasks.filter(
    (t) => t.dueDate.startsWith(currentMonthPrefix) && t.status !== 'skipped'
  ).length;

  const hasDailyBonus = state.rewards.some((r) => String(r.taskId).startsWith('daily_bonus:'));

  const badges = [
    {
      id: 'first-sprout',
      title: 'First Sprout',
      description: 'Complete your first scheduled care activity.',
      icon: 'sprout',
      unlocked: completedTasks.length >= 1,
      progress: Math.min(completedTasks.length, 1),
      target: 1
    },
    {
      id: 'consistent-carer',
      title: 'Steady Gardener',
      description: 'Complete 5 scheduled plant care activities.',
      icon: 'award',
      unlocked: completedTasks.length >= 5,
      progress: Math.min(completedTasks.length, 5),
      target: 5
    },
    {
      id: 'perfect-day',
      title: 'Daily Care Sweep',
      description: 'Complete every care task due on a single day.',
      icon: 'sun',
      unlocked: hasDailyBonus,
      progress: hasDailyBonus ? 1 : 0,
      target: 1
    },
    {
      id: 'streak-7',
      title: '7-Day Care Streak',
      description: 'Maintain a 7-day consecutive care completion streak.',
      icon: 'flame',
      unlocked: longestStreak >= 7,
      progress: Math.min(longestStreak, 7),
      target: 7
    },
    {
      id: 'streak-30',
      title: '30-Day Care Streak',
      description: 'Maintain a 30-day consecutive care completion streak.',
      icon: 'trophy',
      unlocked: longestStreak >= 30,
      progress: Math.min(longestStreak, 30),
      target: 30
    },
    {
      id: 'collector-5',
      title: 'Home Conservatory',
      description: 'Register 5 or more plants in your collection.',
      icon: 'flower-2',
      unlocked: state.plants.length >= 5,
      progress: Math.min(state.plants.length, 5),
      target: 5
    },
    {
      id: 'chronicler-3',
      title: 'Growth Chronicler',
      description: 'Log 3 or more growth diary observations.',
      icon: 'camera',
      unlocked: state.growthEntries.length >= 3,
      progress: Math.min(state.growthEntries.length, 3),
      target: 3
    }
  ];

  return {
    totalPoints,
    currentStreak,
    longestStreak,
    weeklyActiveDays,
    monthlyCompletedCount,
    monthlyScheduledCount,
    completedCount: completedTasks.length,
    badges,
    history: [...state.rewards].sort((a, b) => String(b.awardedAt).localeCompare(String(a.awardedAt)))
  };
}

/**
 * Computes real-time dashboard and insights metrics from current state.
 */
export function computeMetrics(state, todayStr = getTodayLocal()) {
  const prioritized = getPrioritizedReminders(state, todayStr);
  const overdueTasks = prioritized.filter((t) => t.computedStatus === 'overdue');
  const dueTodayTasks = prioritized.filter((t) => t.computedStatus === 'due_today');
  const upcomingTasks = prioritized.filter((t) => t.computedStatus === 'upcoming');
  const completedTasks = prioritized.filter((t) => t.computedStatus === 'completed');

  const last7Dates = getLastNDates(7, todayStr);
  const weeklySeries = last7Dates.map((dateStr) => {
    const completedOnDay = state.tasks.filter(
      (t) => t.status === 'completed' && String(t.completedAt || '').slice(0, 10) === dateStr
    ).length;
    const dueOnDay = state.tasks.filter((t) => t.dueDate === dateStr && t.status !== 'skipped').length;
    return { date: dateStr, completed: completedOnDay, due: dueOnDay };
  });

  const weeklyCompleted = weeklySeries.reduce((acc, d) => acc + d.completed, 0);
  const weeklyDue = weeklySeries.reduce((acc, d) => acc + d.due, 0);
  const weeklyCompletionRate =
    weeklyDue > 0 ? Math.min(100, Math.round((weeklyCompleted / weeklyDue) * 100)) : completedTasks.length > 0 ? 100 : 0;

  const rewardsSummary = calculateRewardsSummary(state, todayStr);

  // Plant-wise activity summary
  const plantSummary = state.plants.map((plant) => {
    const plantTasks = state.tasks.filter((t) => t.plantId === plant.id);
    const completed = plantTasks.filter((t) => t.status === 'completed').length;
    const pending = plantTasks.filter((t) => t.status === 'pending').length;
    return {
      plantId: plant.id,
      plantName: plant.name,
      completed,
      pending,
      growthCount: state.growthEntries.filter((g) => g.plantId === plant.id).length
    };
  });

  return {
    totalPlants: state.plants.length,
    dueTodayCount: dueTodayTasks.length,
    overdueCount: overdueTasks.length,
    upcomingCount: upcomingTasks.length,
    completedCount: completedTasks.length,
    pendingCount: overdueTasks.length + dueTodayTasks.length + upcomingTasks.length,
    weeklySeries,
    weeklyCompleted,
    weeklyDue,
    weeklyCompletionRate,
    rewardsSummary,
    plantSummary,
    prioritized
  };
}

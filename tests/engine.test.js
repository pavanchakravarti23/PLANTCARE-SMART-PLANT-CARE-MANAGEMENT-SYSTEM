import { describe, expect, it } from 'vitest';
import {
  addGrowthEntryInState,
  addPlantInState,
  addTaskInState,
  calculateRewardsSummary,
  completeTaskInState,
  computeMetrics,
  deletePlantInState,
  deriveTaskComputedStatus,
  getPrioritizedReminders,
  skipTaskInState,
  snoozeTaskInState,
  togglePauseTaskInState,
  updatePlantInState
} from '../src/services/engine.js';
import { createDemoState, createEmptyState } from '../src/services/storage.js';

describe('engine — Plant CRUD, Scheduler, Priority Reminders, Growth & Rewards', () => {
  it('supports adding, updating, and safely deleting a plant with cascade cleanup', () => {
    let state = createEmptyState();
    const added = addPlantInState(state, {
      id: 'p1',
      name: 'Tulsi',
      category: 'Herbs',
      location: 'Balcony',
      imageId: 'img-p1',
      wateringInterval: 2,
      fertilisingInterval: 21
    });
    state = added.state;
    expect(state.plants).toHaveLength(1);

    const updated = updatePlantInState(state, 'p1', { location: 'Terrace', wateringInterval: 3 });
    state = updated.state;
    expect(state.plants[0].location).toBe('Terrace');
    expect(state.plants[0].wateringInterval).toBe(3);

    state = addTaskInState(state, {
      id: 't1',
      plantId: 'p1',
      activityType: 'Watering',
      dueDate: '2026-11-25',
      dueTime: '08:00',
      repeatInterval: 'every_2_days'
    }).state;

    state = addGrowthEntryInState(state, {
      id: 'g1',
      plantId: 'p1',
      imageId: 'img-g1',
      observationDate: '2026-11-25',
      description: 'First leaves sprouted'
    }).state;

    const del = deletePlantInState(state, 'p1');
    expect(del.deleted).toBe(true);
    expect(del.state.plants).toHaveLength(0);
    expect(del.state.tasks).toHaveLength(0);
    expect(del.state.growthEntries).toHaveLength(0);
    expect(del.imageIdsToDelete).toEqual(['img-p1', 'img-g1']);
  });

  it('prioritizes Overdue (HIGH) > Due Today (MEDIUM) > Upcoming (NORMAL) and sorts by date & time', () => {
    const state = createDemoState('2026-11-25');
    const prioritized = getPrioritizedReminders(state, '2026-11-25');
    const active = prioritized.filter((t) => t.status === 'pending');

    expect(active[0].priorityLevel).toBe('HIGH');
    expect(active[0].computedStatus).toBe('overdue');
    expect(active[0].dueDate).toBe('2026-11-23'); // older overdue first

    const dueTodayIdx = active.findIndex((t) => t.computedStatus === 'due_today');
    const upcomingIdx = active.findIndex((t) => t.computedStatus === 'upcoming');
    expect(dueTodayIdx).toBeGreaterThan(0);
    expect(upcomingIdx).toBeGreaterThan(dueTodayIdx);
  });

  it('does not auto-complete overdue tasks when date passes', () => {
    const state = createDemoState('2026-11-25');
    const overdueTask = state.tasks.find((t) => t.id === 'demo-task-overdue-1');
    expect(overdueTask.status).toBe('pending');
    expect(deriveTaskComputedStatus(overdueTask, '2026-11-25')).toBe('overdue');
  });

  it('completes a recurring task, generates next due date, prevents duplicate completion & duplicate rewards, and awards daily bonus', () => {
    let state = createEmptyState();
    state = addPlantInState(state, { id: 'p1', name: 'Rose', category: 'Flowering plants' }).state;
    state = addTaskInState(state, {
      id: 't-today-1',
      plantId: 'p1',
      activityType: 'Watering',
      title: 'Water Rose',
      dueDate: '2026-11-25',
      dueTime: '08:00',
      repeatInterval: 'every_2_days'
    }).state;

    const now = new Date(2026, 10, 25, 9, 30, 0);
    const res1 = completeTaskInState(state, 't-today-1', now);
    expect(res1.changed).toBe(true);
    expect(res1.pointsAwarded).toBe(10);
    expect(res1.bonusAwarded).toBe(20); // Only 1 task due today, so daily sweep achieved
    expect(res1.nextDueDate).toBe('2026-11-27');
    expect(res1.state.tasks.filter((t) => t.status === 'pending')).toHaveLength(1);
    expect(res1.state.tasks.find((t) => t.status === 'pending').dueDate).toBe('2026-11-27');

    // Duplicate completion attempt must fail safely without adding points or tasks
    const resDup = completeTaskInState(res1.state, 't-today-1', now);
    expect(resDup.changed).toBe(false);
    expect(resDup.state.rewards.reduce((s, r) => s + r.points, 0)).toBe(30);
  });

  it('supports pausing, resuming, snoozing, and skipping without awarding points for skipped tasks', () => {
    let state = createEmptyState();
    state = addPlantInState(state, { id: 'p1', name: 'Aloe Vera', category: 'Succulents' }).state;
    state = addTaskInState(state, {
      id: 't1',
      plantId: 'p1',
      activityType: 'Watering',
      dueDate: '2026-11-25',
      repeatInterval: 'weekly'
    }).state;

    const paused = togglePauseTaskInState(state, 't1');
    expect(paused.task.paused).toBe(true);

    const snoozed = snoozeTaskInState(paused.state, 't1', 2, '2026-11-25');
    expect(snoozed.task.dueDate).toBe('2026-11-27');

    const skipped = skipTaskInState(snoozed.state, 't1', '2026-11-25');
    expect(skipped.state.tasks.find((t) => t.id === 't1').status).toBe('skipped');
    expect(skipped.state.rewards).toHaveLength(0);
    // Because it was paused, no next recurring task was generated on skip
    expect(skipped.nextDueDate).toBeNull();
  });

  it('calculates real 7-day streaks and achievement badges from completion history', () => {
    let state = createEmptyState();
    state = addPlantInState(state, { id: 'p1', name: 'Basil', category: 'Herbs' }).state;

    for (let i = 0; i < 7; i += 1) {
      const day = 19 + i; // Nov 19..Nov 25
      const dateStr = `2026-11-${day}`;
      state = addTaskInState(state, {
        id: `t-${i}`,
        plantId: 'p1',
        activityType: 'Watering',
        dueDate: dateStr,
        repeatInterval: 'none'
      }).state;
      state = completeTaskInState(state, `t-${i}`, new Date(2026, 10, day, 8, 0, 0)).state;
    }

    const summary = calculateRewardsSummary(state, '2026-11-25');
    expect(summary.currentStreak).toBe(7);
    expect(summary.longestStreak).toBe(7);
    expect(summary.badges.find((b) => b.id === 'streak-7').unlocked).toBe(true);
    expect(summary.badges.find((b) => b.id === 'streak-30').unlocked).toBe(false);

    const metrics = computeMetrics(state, '2026-11-25');
    expect(metrics.completedCount).toBe(7);
    expect(metrics.weeklyCompletionRate).toBe(100);
  });
});

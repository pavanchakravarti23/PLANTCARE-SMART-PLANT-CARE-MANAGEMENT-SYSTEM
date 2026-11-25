import { describe, expect, it } from 'vitest';
import {
  addDaysLocal,
  addMonthsClampedLocal,
  calculateNextDueDate,
  diffDaysLocal,
  getMonthGridDates,
  isLeapYear,
  isValidLocalDate,
  parseLocalDate
} from '../src/utils/dateUtils.js';

describe('dateUtils — Local Calendar & Recurring Calculations', () => {
  it('validates leap years and invalid dates accurately', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);

    expect(isValidLocalDate('2024-02-29')).toBe(true);
    expect(isValidLocalDate('2025-02-29')).toBe(false);
    expect(isValidLocalDate('2026-04-31')).toBe(false);
    expect(parseLocalDate('2026-11-25').getDate()).toBe(25);
  });

  it('handles month boundaries and leap years without shifting', () => {
    expect(addMonthsClampedLocal('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonthsClampedLocal('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonthsClampedLocal('2026-03-31', 1)).toBe('2026-04-30');
    expect(addDaysLocal('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('calculates signed calendar day differences accurately', () => {
    expect(diffDaysLocal('2026-11-25', '2026-11-25')).toBe(0);
    expect(diffDaysLocal('2026-11-25', '2026-11-23')).toBe(-2);
    expect(diffDaysLocal('2026-11-25', '2026-11-28')).toBe(3);
  });

  it('calculates next recurring due dates and anchors overdue tasks from completion date', () => {
    expect(calculateNextDueDate('2026-11-25', 'daily', 1, '2026-11-25')).toBe('2026-11-26');
    expect(calculateNextDueDate('2026-11-25', 'every_2_days', 1, '2026-11-25')).toBe('2026-11-27');
    expect(calculateNextDueDate('2026-11-25', 'weekly', 1, '2026-11-25')).toBe('2026-12-02');
    expect(calculateNextDueDate('2024-01-31', 'monthly', 1, '2024-01-31')).toBe('2024-02-29');
    expect(calculateNextDueDate('2026-11-25', 'custom', 5, '2026-11-25')).toBe('2026-11-30');
    expect(calculateNextDueDate('2026-11-25', 'none', 1, '2026-11-25')).toBeNull();

    // Overdue task from Nov 20 completed on Nov 25 advances from Nov 25
    expect(calculateNextDueDate('2026-11-20', 'every_3_days', 1, '2026-11-25')).toBe('2026-11-28');
  });

  it('generates a complete 42-day monthly calendar grid', () => {
    const grid = getMonthGridDates(2026, 10); // November 2026
    expect(grid).toHaveLength(42);
    expect(grid.filter((c) => c.inCurrentMonth)).toHaveLength(30);
  });
});

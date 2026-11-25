/**
 * Local-date utilities for PlantCare.
 * All date strings use canonical YYYY-MM-DD in the user's local timezone
 * to prevent UTC offset shifts across timezones and DST transitions.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Pads a number to two digits.
 * @param {number} num
 * @returns {string}
 */
export function pad2(num) {
  return String(num).padStart(2, '0');
}

/**
 * Checks whether a year is a leap year in the Gregorian calendar.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the number of calendar days in a given month (0-indexed month).
 * @param {number} year
 * @param {number} monthIndex0
 * @returns {number}
 */
export function daysInMonth(year, monthIndex0) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const normalized = ((monthIndex0 % 12) + 12) % 12;
  return days[normalized];
}

/**
 * Formats a Date object into a local YYYY-MM-DD string.
 * @param {Date} date
 * @returns {string}
 */
export function formatLocalDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid Date instance');
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Returns today's date in local YYYY-MM-DD format.
 * @param {Date} [referenceDate]
 * @returns {string}
 */
export function getTodayLocal(referenceDate = new Date()) {
  return formatLocalDate(referenceDate);
}

/**
 * Parses a YYYY-MM-DD string into a local Date set at 12:00 PM
 * to avoid DST midnight edge cases. Returns null if invalid.
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseLocalDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const match = ISO_DATE_RE.exec(dateStr.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month - 1)) return null;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Validates whether a string is a valid YYYY-MM-DD calendar date.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidLocalDate(dateStr) {
  return parseLocalDate(dateStr) !== null;
}

/**
 * Adds a signed integer number of calendar days to a YYYY-MM-DD string.
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDaysLocal(dateStr, days) {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) throw new Error(`Invalid local date string: ${dateStr}`);
  const result = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + Number(days), 12, 0, 0, 0);
  return formatLocalDate(result);
}

/**
 * Adds calendar months while clamping to the last valid day of the target month
 * (e.g., Jan 31 + 1 month -> Feb 28, or Feb 29 in a leap year).
 * @param {string} dateStr
 * @param {number} months
 * @returns {string}
 */
export function addMonthsClampedLocal(dateStr, months) {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) throw new Error(`Invalid local date string: ${dateStr}`);

  const startYear = parsed.getFullYear();
  const startMonth = parsed.getMonth();
  const startDay = parsed.getDate();

  const totalMonths = startYear * 12 + startMonth + Number(months);
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const maxDay = daysInMonth(targetYear, targetMonth);
  const clampedDay = Math.min(startDay, maxDay);

  return `${targetYear}-${pad2(targetMonth + 1)}-${pad2(clampedDay)}`;
}

/**
 * Returns the signed number of calendar days from fromDateStr to toDateStr.
 * Positive means toDateStr is in the future relative to fromDateStr.
 * @param {string} fromDateStr
 * @param {string} toDateStr
 * @returns {number}
 */
export function diffDaysLocal(fromDateStr, toDateStr) {
  const a = parseLocalDate(fromDateStr);
  const b = parseLocalDate(toDateStr);
  if (!a || !b) throw new Error('Invalid date comparison inputs');

  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

/**
 * Calculates the next due date for a recurring care schedule.
 * If the task was completed late (completionDateStr > currentDueDateStr),
 * anchors the next interval from completionDateStr so future occurrences
 * do not immediately fall in the past.
 *
 * @param {string} currentDueDateStr
 * @param {string} repeatInterval
 * @param {number} [customIntervalDays]
 * @param {string} [completionDateStr]
 * @returns {string|null}
 */
export function calculateNextDueDate(
  currentDueDateStr,
  repeatInterval,
  customIntervalDays = 1,
  completionDateStr = null
) {
  if (!repeatInterval || repeatInterval === 'none') return null;

  const anchorDate =
    completionDateStr &&
    isValidLocalDate(completionDateStr) &&
    diffDaysLocal(currentDueDateStr, completionDateStr) > 0
      ? completionDateStr
      : currentDueDateStr;

  switch (repeatInterval) {
    case 'daily':
      return addDaysLocal(anchorDate, 1);
    case 'every_2_days':
      return addDaysLocal(anchorDate, 2);
    case 'every_3_days':
      return addDaysLocal(anchorDate, 3);
    case 'weekly':
      return addDaysLocal(anchorDate, 7);
    case 'biweekly':
      return addDaysLocal(anchorDate, 14);
    case 'monthly':
      return addMonthsClampedLocal(anchorDate, 1);
    case 'custom': {
      const interval = Math.max(1, Math.min(365, Math.floor(Number(customIntervalDays) || 1)));
      return addDaysLocal(anchorDate, interval);
    }
    default:
      return null;
  }
}

/**
 * Returns a human-readable label for a repeat interval.
 * @param {string} repeatInterval
 * @param {number} [customDays]
 * @returns {string}
 */
export function formatRepeatInterval(repeatInterval, customDays = 1) {
  switch (repeatInterval) {
    case 'daily':
      return 'Every day';
    case 'every_2_days':
      return 'Every 2 days';
    case 'every_3_days':
      return 'Every 3 days';
    case 'weekly':
      return 'Every week';
    case 'biweekly':
      return 'Every 2 weeks';
    case 'monthly':
      return 'Every month';
    case 'custom':
      return `Every ${Math.max(1, Number(customDays) || 1)} day${Number(customDays) === 1 ? '' : 's'}`;
    case 'none':
    default:
      return 'One-time';
  }
}

/**
 * Formats a YYYY-MM-DD date string for display according to user preference.
 * @param {string} dateStr
 * @param {'DD MMM YYYY'|'YYYY-MM-DD'|'MM/DD/YYYY'} [format]
 * @returns {string}
 */
export function formatDisplayDate(dateStr, format = 'DD MMM YYYY') {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr || '—';

  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (format === 'YYYY-MM-DD') {
    return dateStr;
  }
  if (format === 'MM/DD/YYYY') {
    return `${pad2(month + 1)}/${pad2(day)}/${year}`;
  }
  return `${pad2(day)} ${shortMonths[month]} ${year}`;
}

/**
 * Formats a relative human label for a due date compared to today.
 * @param {string} dateStr
 * @param {string} [todayStr]
 * @returns {string}
 */
export function formatRelativeDate(dateStr, todayStr = getTodayLocal()) {
  if (!isValidLocalDate(dateStr)) return 'Unscheduled';
  const diff = diffDaysLocal(todayStr, dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff <= 7) return `In ${diff} days`;
  return formatDisplayDate(dateStr);
}

/**
 * Formats HH:MM time string to 12h or 24h display.
 * @param {string} timeStr
 * @param {'12h'|'24h'} [mode]
 * @returns {string}
 */
export function formatDisplayTime(timeStr, mode = '12h') {
  if (!timeStr || typeof timeStr !== 'string') return '08:00 AM';
  const [hStr, mStr] = timeStr.split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;

  if (mode === '24h') {
    return `${pad2(hours)}:${pad2(minutes)}`;
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${pad2(minutes)} ${suffix}`;
}

/**
 * Returns the 7 local YYYY-MM-DD dates for the week containing anchorDateStr (Sunday to Saturday).
 * @param {string} anchorDateStr
 * @returns {string[]}
 */
export function getWeekDates(anchorDateStr = getTodayLocal()) {
  const parsed = parseLocalDate(anchorDateStr) || parseLocalDate(getTodayLocal());
  const dayOfWeek = parsed.getDay(); // 0 = Sun
  const sundayStr = addDaysLocal(formatLocalDate(parsed), -dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDaysLocal(sundayStr, i));
}

/**
 * Returns 42 cell objects representing a 6-row calendar grid for (year, monthIndex0).
 * @param {number} year
 * @param {number} monthIndex0
 * @returns {Array<{date: string, day: number, inCurrentMonth: boolean}>}
 */
export function getMonthGridDates(year, monthIndex0) {
  const firstOfMonth = new Date(year, monthIndex0, 1, 12, 0, 0, 0);
  const startOffset = firstOfMonth.getDay();
  const firstStr = formatLocalDate(firstOfMonth);
  const gridStartStr = addDaysLocal(firstStr, -startOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const dateStr = addDaysLocal(gridStartStr, idx);
    const parsed = parseLocalDate(dateStr);
    return {
      date: dateStr,
      day: parsed.getDate(),
      inCurrentMonth: parsed.getMonth() === monthIndex0 && parsed.getFullYear() === year
    };
  });
}

/**
 * Returns last N local dates ending at endDateStr (chronological order).
 * @param {number} count
 * @param {string} [endDateStr]
 * @returns {string[]}
 */
export function getLastNDates(count, endDateStr = getTodayLocal()) {
  const start = addDaysLocal(endDateStr, -(count - 1));
  return Array.from({ length: count }, (_, idx) => addDaysLocal(start, idx));
}

/**
 * Formats a long header date like "Wednesday, 25 November 2026".
 * @param {Date} [date]
 * @returns {string}
 */
export function formatLongHeaderDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

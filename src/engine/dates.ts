import { addDays, format, parseISO, differenceInDays } from 'date-fns';

/**
 * Converts a project start date string and a day offset to a formatted calendar date.
 */
export function offsetToDate(startDateStr: string, dayOffset: number, formatPattern = 'MMM d, yyyy'): string {
  const baseDate = parseISO(startDateStr);
  const targetDate = addDays(baseDate, Math.max(0, Math.round(dayOffset)));
  return format(targetDate, formatPattern);
}

/**
 * Calculates day offset from project start date.
 */
export function dateToOffset(startDateStr: string, dateStr: string): number {
  const baseDate = parseISO(startDateStr);
  const targetDate = parseISO(dateStr);
  return differenceInDays(targetDate, baseDate);
}

/**
 * Formats a short day tag e.g. "Day 12"
 */
export function formatDayTag(dayOffset: number): string {
  return `Day ${Math.round(dayOffset)}`;
}

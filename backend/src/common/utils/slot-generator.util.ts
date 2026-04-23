/**
 * Slot time helpers — shared between SlotEngine and BookingsService.
 */

/** "HH:MM" → total minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Total minutes since midnight → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * How many 1-hour slots does a booking of `durationMinutes` occupy?
 * e.g. 60 → 1, 120 → 2, 180 → 3
 */
export function slotsNeeded(durationMinutes: number, slotSizeMinutes = 60): number {
  return Math.ceil(durationMinutes / slotSizeMinutes);
}

/** Compute the end time string given start + duration */
export function computeEndTime(startTime: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

/** Default operating hours */
export const SLOT_START = '10:00'; // 10 AM
export const SLOT_END = '22:00';   // 10 PM
export const SLOT_SIZE_MINUTES = 60;

/**
 * Generate the list of hourly slot start-times for a day.
 * ["10:00", "11:00", "12:00", … "21:00"]  (12 slots)
 */
export function allSlotStartTimes(
  openTime = SLOT_START,
  closeTime = SLOT_END,
  slotSize = SLOT_SIZE_MINUTES,
): string[] {
  const times: string[] = [];
  let cursor = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);
  while (cursor + slotSize <= end) {
    times.push(minutesToTime(cursor));
    cursor += slotSize;
  }
  return times;
}

import { NormalizedBooking, ScheduleMetrics } from '../types/booking';

export const OPERATING_START_MINUTES = 450; // 07:30
export const OPERATING_END_MINUTES = 1020;  // 17:00 (5:00 PM)
export const OPERATING_TOTAL_MINUTES = 570; // 9 hours 30 mins

export interface TimeSlotHeader {
  index: number;
  time24: string;
  label12: string;
  startMinutes: number;
  endMinutes: number;
}

/**
 * Generates the 19 standard 30-minute intervals from 7:30 AM to 5:00 PM
 */
export function generateTimeSlots(): TimeSlotHeader[] {
  const slots: TimeSlotHeader[] = [];
  let currentMin = OPERATING_START_MINUTES;
  let idx = 0;

  while (currentMin < OPERATING_END_MINUTES) {
    const nextMin = currentMin + 30;
    const startH = Math.floor(currentMin / 60);
    const startM = currentMin % 60;
    const endH = Math.floor(nextMin / 60);
    const endM = nextMin % 60;

    const startPeriod = startH >= 12 ? 'PM' : 'AM';
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    const displayStartH = startH % 12 === 0 ? 12 : startH % 12;
    const displayEndH = endH % 12 === 0 ? 12 : endH % 12;

    const label12 = `${displayStartH}:${startM.toString().padStart(2, '0')} ${startPeriod} – ${displayEndH}:${endM.toString().padStart(2, '0')} ${endPeriod}`;
    const time24 = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

    slots.push({
      index: idx++,
      time24,
      label12,
      startMinutes: currentMin,
      endMinutes: nextMin,
    });

    currentMin = nextMin;
  }

  return slots;
}

/**
 * Calculates proportional horizontal position and width on the timeline
 */
export function calculateBlockGeometry(booking: NormalizedBooking): {
  leftPercent: number;
  widthPercent: number;
  isOutOfBounds: boolean;
} {
  const isOutOfBounds = booking.startMinutes >= OPERATING_END_MINUTES || booking.endMinutes <= OPERATING_START_MINUTES;

  const clampedStart = Math.max(OPERATING_START_MINUTES, Math.min(OPERATING_END_MINUTES, booking.startMinutes));
  const clampedEnd = Math.max(OPERATING_START_MINUTES, Math.min(OPERATING_END_MINUTES, booking.endMinutes));

  const leftPercent = ((clampedStart - OPERATING_START_MINUTES) / OPERATING_TOTAL_MINUTES) * 100;
  // Ensure minimum visual width of 2% (~12 mins) so tiny blocks are still clickable and legible
  const calculatedWidth = ((clampedEnd - clampedStart) / OPERATING_TOTAL_MINUTES) * 100;
  const widthPercent = Math.max(2.5, Math.min(100 - leftPercent, calculatedWidth));

  return {
    leftPercent,
    widthPercent,
    isOutOfBounds,
  };
}

/**
 * Gets Malaysia Today YYYY-MM-DD
 */
export function getMalaysiaTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }
}

/**
 * Formats date into formal Malay format: "Khamis, 15 Oktober 2026"
 */
export function formatMalayDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month - 1, day);
  const dayNames = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const dayOfWeek = dayNames[dateObj.getDay()];
  const monthName = monthNames[month - 1] || '';

  return `${dayOfWeek}, ${day} ${monthName} ${year}`;
}

/**
 * Calculates current time line position in Malaysia
 */
export function getCurrentTimeLinePercent(): number | null {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.format(now).split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const currentMin = h * 60 + m;

    if (currentMin < OPERATING_START_MINUTES || currentMin > OPERATING_END_MINUTES) {
      return null;
    }

    return ((currentMin - OPERATING_START_MINUTES) / OPERATING_TOTAL_MINUTES) * 100;
  } catch {
    return null;
  }
}

/**
 * Calculates KPI metrics for selected date
 */
export function calculateScheduleMetrics(
  dateBookings: NormalizedBooking[],
  allVenuesCount: number
): ScheduleMetrics {
  const distinctVenues = new Set(dateBookings.map(b => b.normalizedVenue));
  const distinctTeachers = new Set(dateBookings.map(b => b.cleanName.toLowerCase()));

  // Count overlaps
  let overlapPairsCount = 0;
  const countedPairs = new Set<string>();

  for (const b of dateBookings) {
    if (b.isOverlapping && b.overlapIds.length > 0) {
      for (const otherId of b.overlapIds) {
        const key = [b.id, otherId].sort().join('___');
        if (!countedPairs.has(key)) {
          countedPairs.add(key);
          overlapPairsCount++;
        }
      }
    }
  }

  const distinctVenuesBooked = distinctVenues.size;
  const availableVenuesCount = Math.max(0, allVenuesCount - distinctVenuesBooked);

  return {
    totalBookings: dateBookings.length,
    distinctVenuesBooked,
    availableVenuesCount,
    overlapCount: overlapPairsCount,
    activeTeachersCount: distinctTeachers.size,
  };
}

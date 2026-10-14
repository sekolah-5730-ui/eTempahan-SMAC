import { NormalizedBooking, VenueCategory } from '../types/booking';

/**
 * Parses raw CSV line respecting quotes.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes time string to 24-hour HH:mm and total minutes from midnight.
 * Gracefully fixes afternoon school hours written as 1:00 (13:00), 2:30 (14:30), etc.
 */
export function normalizeTime(rawTime: string, referenceStartHour?: number): { time24: string; minutes: number } {
  if (!rawTime) return { time24: '07:30', minutes: 450 };

  const cleaned = rawTime.trim().replace(/[a-zA-Z]/g, '').trim();
  const parts = cleaned.split(':');
  if (parts.length < 2) return { time24: '07:30', minutes: 450 };

  let hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) {
    return { time24: '07:30', minutes: 450 };
  }

  // School context adjustments:
  // 1. In preschool / school timetables (7:30 AM to 5:00 PM):
  // 1:00, 2:00, 3:00, 4:00, 5:00, 6:00 almost universally refer to 13:00 - 18:00
  if (hour >= 1 && hour <= 6) {
    hour += 12;
  }
  // 2. Handle typo 0:30 when paired with 13:00 (meaning 12:30)
  if (hour === 0 && minute === 30) {
    hour = 12;
  }
  // 3. If reference start hour exists and end hour is lower, adjust
  if (referenceStartHour !== undefined && hour < referenceStartHour && hour < 12) {
    hour += 12;
  }

  const clampedHour = Math.min(23, Math.max(0, hour));
  const clampedMinute = Math.min(59, Math.max(0, minute));
  const formattedHH = clampedHour.toString().padStart(2, '0');
  const formattedMM = clampedMinute.toString().padStart(2, '0');

  return {
    time24: `${formattedHH}:${formattedMM}`,
    minutes: clampedHour * 60 + clampedMinute,
  };
}

/**
 * Formats 24h HH:mm to friendly 12-hour AM/PM label (e.g. "9:00 AM", "12:30 PM", "4:30 PM")
 */
export function format12Hour(time24: string): string {
  const [hh, mm] = time24.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const displayHour = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayHour}:${mm.toString().padStart(2, '0')} ${period}`;
}

/**
 * Identifies venue category and normalized venue name.
 */
export function categorizeVenue(facilityRaw: string): {
  normalizedVenue: string;
  venueCategory: VenueCategory;
  hasLaptopEquipment: boolean;
  laptopNote?: string;
} {
  const fLower = facilityRaw.toLowerCase();

  const hasLaptops = fLower.includes('laptop') || fLower.includes('komputer riba') || fLower.includes('notebook') || fLower.includes('smart board') || fLower.includes('smart tv') || fLower.includes('lcd');
  
  let note: string | undefined;
  if (hasLaptops) {
    if (fLower.includes('laptop') || fLower.includes('komputer riba')) {
      const match = facilityRaw.match(/(\d+)\s*(?:laptop|komputer|unit|x)/i) || facilityRaw.match(/(?:laptop|komputer riba)\s*(?:sekolah\s*)?(?:no|n0|nombor)?\s*(\d+)/i);
      note = match ? `Termasuk Komputer Riba (${match[1]} unit)` : 'Termasuk Peralatan Laptop';
    }
  }

  if (fLower.includes('mesyuarat') || fLower.includes('mesyuaray')) {
    return {
      normalizedVenue: 'Bilik Mesyuarat',
      venueCategory: 'Bilik Mesyuarat',
      hasLaptopEquipment: hasLaptops,
      laptopNote: note,
    };
  }

  if (fLower.includes('pss') || fLower.includes('pusat sumber')) {
    return {
      normalizedVenue: 'PSS (Pusat Sumber)',
      venueCategory: 'PSS',
      hasLaptopEquipment: hasLaptops,
      laptopNote: note,
    };
  }

  if (fLower.includes('dewan')) {
    return {
      normalizedVenue: 'Dewan Sekolah',
      venueCategory: 'Dewan',
      hasLaptopEquipment: hasLaptops,
      laptopNote: note,
    };
  }

  if (fLower.includes('surau')) {
    return {
      normalizedVenue: 'Surau',
      venueCategory: 'Surau',
      hasLaptopEquipment: hasLaptops,
      laptopNote: note,
    };
  }

  if (hasLaptops) {
    return {
      normalizedVenue: 'Troli Komputer Riba / Laptop',
      venueCategory: 'Laptop / Komputer Riba',
      hasLaptopEquipment: true,
      laptopNote: note || 'Tempahan Laptop / Komputer Riba',
    };
  }

  // Fallback for special rooms like "2IS" or other
  const cleanName = facilityRaw.trim() || 'Ruang / Kemudahan Lain';
  return {
    normalizedVenue: cleanName,
    venueCategory: 'Bilik Khas / Lain-lain',
    hasLaptopEquipment: false,
  };
}

/**
 * Extracts class identifier from purpose or context.
 */
export function extractClassCode(purpose: string, facility: string): string {
  const combined = `${purpose} ${facility}`.toUpperCase();

  // Explicit form & class matches: 1IS, 1IK, 2IS, 2IK, 3IS, 3IK, 4IS, 5IS, T1IK, etc.
  const classMatch = combined.match(/\b([1-5]\s*(?:IS|IK|IBN\s*SINA|IBNU\s*SINA|IBN\s*KHALDUN|IBNU\s*KHALDUN))\b/);
  if (classMatch) {
    return classMatch[1].replace(/\s+/g, ' ');
  }

  const shortClassMatch = combined.match(/\b([1-5][I][S|K])\b/);
  if (shortClassMatch) return shortClassMatch[1];

  const tingkatanMatch = combined.match(/\b(?:TINGKATAN|TING\.?|T)\s*([1-5])\b/);
  if (tingkatanMatch) {
    return `Tingkatan ${tingkatanMatch[1]}`;
  }

  // Subject/class codes
  if (combined.includes('LAM')) return 'LAM';
  if (combined.includes('PRASEKOLAH') || combined.includes('PRA')) return 'Prasekolah';

  return '-';
}

/**
 * Standard list of preschool/school venues for comprehensive timetable grid
 */
export const STANDARD_VENUES: { name: string; category: VenueCategory; colorClass: string; borderClass: string; bgClass: string; badgeClass: string }[] = [
  {
    name: 'Bilik Mesyuarat',
    category: 'Bilik Mesyuarat',
    colorClass: 'text-blue-700',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    name: 'PSS (Pusat Sumber)',
    category: 'PSS',
    colorClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Troli Komputer Riba / Laptop',
    category: 'Laptop / Komputer Riba',
    colorClass: 'text-violet-700',
    borderClass: 'border-violet-500',
    bgClass: 'bg-violet-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    name: 'Dewan Sekolah',
    category: 'Dewan',
    colorClass: 'text-rose-700',
    borderClass: 'border-rose-500',
    bgClass: 'bg-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    name: 'Surau',
    category: 'Surau',
    colorClass: 'text-teal-700',
    borderClass: 'border-teal-500',
    bgClass: 'bg-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    name: 'Bilik Khas / Lain-lain',
    category: 'Bilik Khas / Lain-lain',
    colorClass: 'text-amber-700',
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

/**
 * Parses full CSV text into normalized bookings with overlap detection.
 */
export function parseGoogleSheetsCSV(csvText: string): NormalizedBooking[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rawList: NormalizedBooking[] = [];

  let isHeader = true;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const columns = parseCSVLine(line);

    // Skip empty lines or headers
    if (columns.length < 5) continue;

    const firstCol = columns[0].toUpperCase();
    if (firstCol === 'NAMA' || firstCol === 'NAME') {
      isHeader = false;
      continue;
    }

    if (isHeader) {
      isHeader = false;
      continue;
    }

    const name = columns[0] || '';
    const facility = columns[1] || '';
    let date = (columns[2] || '').trim();
    const startTimeRaw = columns[3] || '';
    const endTimeRaw = columns[4] || '';
    const purpose = columns[5] || '';

    // Ignore placeholder lines
    if (!name || !date || date.includes('TARIKH') || date.includes('Tarikh')) continue;

    // Normalize date format if needed (YYYY-MM-DD)
    const dateMatch = date.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      date = `${year}-${month}-${day}`;
    }

    const startParsed = normalizeTime(startTimeRaw);
    const startHourNum = parseInt(startParsed.time24.split(':')[0], 10);
    const endParsed = normalizeTime(endTimeRaw, startHourNum);

    // Ensure end time is strictly >= start time
    let endMinutes = endParsed.minutes;
    let endTime24 = endParsed.time24;
    if (endMinutes < startParsed.minutes) {
      if (endMinutes + 720 >= startParsed.minutes) {
        endMinutes += 720; // 12-hour flip
        const h = Math.floor(endMinutes / 60);
        const m = endMinutes % 60;
        endTime24 = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else {
        // Fallback default duration 30 mins
        endMinutes = startParsed.minutes + 30;
        const h = Math.floor(endMinutes / 60);
        const m = endMinutes % 60;
        endTime24 = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }

    // Minimum visual duration 15 minutes if identical
    const durationMinutes = Math.max(15, endMinutes - startParsed.minutes);

    const venueMeta = categorizeVenue(facility);
    const cleanName = name.replace(/\s+/g, ' ').trim();
    const extractedClass = extractClassCode(purpose, facility);

    // Check outside operating hours (7:30 to 17:00 => 450 to 1020 mins)
    const isOutside = startParsed.minutes < 450 || endMinutes > 1020;

    const id = `booking-${idx}-${date}-${cleanName.replace(/[^a-zA-Z0-9]/g, '')}-${startParsed.time24}`;

    rawList.push({
      id,
      name,
      cleanName,
      facility,
      normalizedVenue: venueMeta.normalizedVenue,
      venueCategory: venueMeta.venueCategory,
      date,
      startTime: startParsed.time24,
      endTime: endTime24,
      formattedTimeRange: `${format12Hour(startParsed.time24)} – ${format12Hour(endTime24)}`,
      startMinutes: startParsed.minutes,
      endMinutes,
      durationMinutes,
      purpose: purpose.trim(),
      extractedClass,
      hasLaptopEquipment: venueMeta.hasLaptopEquipment,
      laptopNote: venueMeta.laptopNote,
      isOutsideOperatingHours: isOutside,
      isOverlapping: false,
      overlapIds: [],
      laneIndex: 0,
      totalLanes: 1,
    });
  }

  // Detect and resolve overlaps by Date & Normalized Venue
  const groupedByDateVenue = new Map<string, NormalizedBooking[]>();
  for (const b of rawList) {
    const key = `${b.date}__${b.normalizedVenue}`;
    const list = groupedByDateVenue.get(key) || [];
    list.push(b);
    groupedByDateVenue.set(key, list);
  }

  groupedByDateVenue.forEach((venueBookings) => {
    // Sort chronologically by start time, then duration
    venueBookings.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes);

    for (let i = 0; i < venueBookings.length; i++) {
      const a = venueBookings[i];
      for (let j = i + 1; j < venueBookings.length; j++) {
        const b = venueBookings[j];

        // Check if times overlap (startA < endB && endA > startB)
        const overlaps = a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;
        if (overlaps) {
          a.isOverlapping = true;
          b.isOverlapping = true;
          if (!a.overlapIds.includes(b.id)) a.overlapIds.push(b.id);
          if (!b.overlapIds.includes(a.id)) b.overlapIds.push(a.id);
        }
      }
    }

    // Assign sub-lanes for overlapping sets so they render stacked without clipping
    const activeIntervals: { endMin: number; lane: number }[] = [];
    let maxLaneInGroup = 0;

    for (const b of venueBookings) {
      // Free up expired intervals
      for (let k = activeIntervals.length - 1; k >= 0; k--) {
        if (activeIntervals[k].endMin <= b.startMinutes) {
          activeIntervals.splice(k, 1);
        }
      }

      // Find lowest available lane index
      const usedLanes = new Set(activeIntervals.map(item => item.lane));
      let assignedLane = 0;
      while (usedLanes.has(assignedLane)) {
        assignedLane++;
      }

      b.laneIndex = assignedLane;
      activeIntervals.push({ endMin: b.endMinutes, lane: assignedLane });
      maxLaneInGroup = Math.max(maxLaneInGroup, assignedLane);
    }

    // Normalize totalLanes for this venue if overlaps exist
    for (const b of venueBookings) {
      if (b.isOverlapping) {
        b.totalLanes = Math.max(2, b.overlapIds.length + 1, maxLaneInGroup + 1);
      } else {
        b.totalLanes = 1;
      }
    }
  });

  return rawList;
}

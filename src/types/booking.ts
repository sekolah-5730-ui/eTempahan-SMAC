export type VenueCategory = 
  | 'Bilik Mesyuarat'
  | 'PSS'
  | 'Laptop / Komputer Riba'
  | 'Dewan'
  | 'Surau'
  | 'Bilik Khas / Lain-lain';

export interface RawBooking {
  name: string;
  facility: string;
  date: string; // YYYY-MM-DD
  startTime: string; // original
  endTime: string; // original
  purpose: string;
}

export interface NormalizedBooking {
  id: string;
  name: string;
  cleanName: string;
  facility: string;
  normalizedVenue: string;
  venueCategory: VenueCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string; // HH:mm (24-hour)
  formattedTimeRange: string; // e.g. "9:00 AM – 10:30 AM"
  startMinutes: number; // minutes from midnight (00:00)
  endMinutes: number; // minutes from midnight (00:00)
  durationMinutes: number;
  purpose: string;
  extractedClass: string;
  hasLaptopEquipment: boolean;
  laptopNote?: string;
  isOutsideOperatingHours: boolean; // outside 7:30 - 17:00
  isOverlapping: boolean;
  overlapIds: string[];
  laneIndex: number; // 0, 1, 2 for sub-lane display when overlapping
  totalLanes: number;
}

export interface ScheduleMetrics {
  totalBookings: number;
  distinctVenuesBooked: number;
  availableVenuesCount: number;
  overlapCount: number;
  activeTeachersCount: number;
}

export interface SearchFilters {
  nameQuery: string;
  classQuery: string;
  generalQuery: string;
  allDates: boolean;
}

export interface SearchResult {
  booking: NormalizedBooking;
  score: number;
  matchType: 'exact' | 'phrase' | 'words' | 'partial';
  matchedFields: string[];
}

export interface DataSourceStatus {
  sourceType: 'default-sheet' | 'custom-url' | 'cached';
  sheetUrl?: string;
  lastUpdated: string;
  totalRecords: number;
  isLoading: boolean;
  error?: string;
}

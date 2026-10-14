import { RAW_GOOGLE_SHEETS_CSV } from '../data/rawSheetData';
import { DataSourceStatus, NormalizedBooking } from '../types/booking';
import { parseGoogleSheetsCSV } from '../utils/csvParser';

const STORAGE_CUSTOM_URL_KEY = 'e_tempahan_custom_sheet_url';
const STORAGE_CACHED_CSV_KEY = 'e_tempahan_cached_csv';
const STORAGE_LAST_SYNC_KEY = 'e_tempahan_last_sync_time';

/**
 * Converts standard Google Sheets browser URL to public CSV export URL
 */
export function convertToExportUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already a published CSV export link
  if (trimmed.includes('pub?output=csv') || trimmed.includes('export?format=csv') || trimmed.includes('gviz/tq?tqx=out:csv')) {
    return trimmed;
  }

  // Extract Sheet ID from standard sharing URL: https://docs.google.com/spreadsheets/d/{ID}/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // gviz/tq endpoint supports CORS in browser
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  }

  return trimmed;
}

/**
 * Loads current bookings and data source status
 */
export async function loadInitialData(): Promise<{
  bookings: NormalizedBooking[];
  status: DataSourceStatus;
}> {
  const customUrl = localStorage.getItem(STORAGE_CUSTOM_URL_KEY);
  const cachedCsv = localStorage.getItem(STORAGE_CACHED_CSV_KEY);
  const lastSync = localStorage.getItem(STORAGE_LAST_SYNC_KEY) || new Date().toLocaleString('ms-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  });

  if (customUrl) {
    try {
      const exportUrl = convertToExportUrl(customUrl);
      const res = await fetch(exportUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 50 && (text.includes(',') || text.includes('\n'))) {
          localStorage.setItem(STORAGE_CACHED_CSV_KEY, text);
          const nowStr = new Date().toLocaleString('ms-MY', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kuala_Lumpur',
          });
          localStorage.setItem(STORAGE_LAST_SYNC_KEY, nowStr);
          const bookings = parseGoogleSheetsCSV(text);
          return {
            bookings,
            status: {
              sourceType: 'custom-url',
              sheetUrl: customUrl,
              lastUpdated: nowStr,
              totalRecords: bookings.length,
              isLoading: false,
            },
          };
        }
      }
    } catch {
      // Fallback to cache if network failed
      if (cachedCsv) {
        const bookings = parseGoogleSheetsCSV(cachedCsv);
        return {
          bookings,
          status: {
            sourceType: 'cached',
            sheetUrl: customUrl,
            lastUpdated: lastSync,
            totalRecords: bookings.length,
            isLoading: false,
            error: 'Tidak dapat menyambung ke pautan luar; menggunakan data cache.',
          },
        };
      }
    }
  }

  // Load official built-in dataset
  const bookings = parseGoogleSheetsCSV(RAW_GOOGLE_SHEETS_CSV);
  return {
    bookings,
    status: {
      sourceType: 'default-sheet',
      lastUpdated: lastSync,
      totalRecords: bookings.length,
      isLoading: false,
    },
  };
}

/**
 * Fetches fresh data from either custom URL or official spreadsheet
 */
export async function refreshSheetData(customUrl?: string): Promise<{
  bookings: NormalizedBooking[];
  status: DataSourceStatus;
}> {
  const urlToUse = customUrl !== undefined ? customUrl : localStorage.getItem(STORAGE_CUSTOM_URL_KEY);
  const nowStr = new Date().toLocaleString('ms-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  });

  if (urlToUse && urlToUse.trim()) {
    try {
      const exportUrl = convertToExportUrl(urlToUse);
      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error(`Ralat HTTP ${res.status}: Spreadsheet tidak membenarkan akses terbuka.`);
      }
      const text = await res.text();
      if (!text || text.length < 50) {
        throw new Error('Data spreadsheet kosong atau tidak lengkap.');
      }

      localStorage.setItem(STORAGE_CUSTOM_URL_KEY, urlToUse);
      localStorage.setItem(STORAGE_CACHED_CSV_KEY, text);
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, nowStr);

      const bookings = parseGoogleSheetsCSV(text);
      return {
        bookings,
        status: {
          sourceType: 'custom-url',
          sheetUrl: urlToUse,
          lastUpdated: nowStr,
          totalRecords: bookings.length,
          isLoading: false,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menyambung ke Google Sheets.';
      const fallbackBookings = parseGoogleSheetsCSV(RAW_GOOGLE_SHEETS_CSV);
      return {
        bookings: fallbackBookings,
        status: {
          sourceType: 'default-sheet',
          lastUpdated: nowStr,
          totalRecords: fallbackBookings.length,
          isLoading: false,
          error: `${errorMsg} Menggunakan pangkalan data rujukan rasmi.`,
        },
      };
    }
  }

  // Reset to default
  localStorage.removeItem(STORAGE_CUSTOM_URL_KEY);
  localStorage.removeItem(STORAGE_CACHED_CSV_KEY);
  localStorage.setItem(STORAGE_LAST_SYNC_KEY, nowStr);

  const bookings = parseGoogleSheetsCSV(RAW_GOOGLE_SHEETS_CSV);
  return {
    bookings,
    status: {
      sourceType: 'default-sheet',
      lastUpdated: nowStr,
      totalRecords: bookings.length,
      isLoading: false,
    },
  };
}

/**
 * Saves custom raw CSV directly (e.g. pasted by school admin)
 */
export function importCustomCSV(csvText: string): {
  bookings: NormalizedBooking[];
  status: DataSourceStatus;
} {
  const nowStr = new Date().toLocaleString('ms-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  });
  localStorage.setItem(STORAGE_CACHED_CSV_KEY, csvText);
  localStorage.setItem(STORAGE_LAST_SYNC_KEY, nowStr);
  const bookings = parseGoogleSheetsCSV(csvText);

  return {
    bookings,
    status: {
      sourceType: 'cached',
      lastUpdated: nowStr,
      totalRecords: bookings.length,
      isLoading: false,
    },
  };
}

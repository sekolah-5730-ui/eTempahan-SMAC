import { NormalizedBooking, SearchFilters, SearchResult } from '../types/booking';

/**
 * Normalizes text for robust Malay name and school terms matching:
 * - Lowercase
 * - Normalizes "bin", "binti", "bt", "b." spacing
 * - Strips extra punctuation
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits query into meaningful keywords (excluding trivial single-letter tokens except class numbers)
 */
export function extractKeywords(str: string): string[] {
  return normalizeSearchTerm(str)
    .split(' ')
    .filter(token => token.length > 0 && (token.length > 1 || /\d/.test(token)));
}

/**
 * Calculates a relevance score for a booking against a query
 */
export function scoreBooking(
  booking: NormalizedBooking,
  query: string,
  fieldFilter?: 'name' | 'class' | 'general'
): { score: number; matchType: 'exact' | 'phrase' | 'words' | 'partial'; matchedFields: string[] } | null {
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) return null;

  const nameNorm = normalizeSearchTerm(booking.name);
  const purposeNorm = normalizeSearchTerm(booking.purpose);
  const venueNorm = normalizeSearchTerm(`${booking.facility} ${booking.normalizedVenue}`);
  const classNorm = normalizeSearchTerm(booking.extractedClass);

  let targetTexts: { field: string; text: string }[] = [];

  if (fieldFilter === 'name') {
    targetTexts = [{ field: 'nama', text: nameNorm }];
  } else if (fieldFilter === 'class') {
    targetTexts = [
      { field: 'kelas', text: classNorm },
      { field: 'tujuan', text: purposeNorm },
    ];
  } else {
    targetTexts = [
      { field: 'nama', text: nameNorm },
      { field: 'tempat', text: venueNorm },
      { field: 'kelas', text: classNorm },
      { field: 'tujuan', text: purposeNorm },
    ];
  }

  const queryKeywords = extractKeywords(normQuery);
  if (queryKeywords.length === 0) return null;

  let bestScore = 0;
  let bestMatchType: 'exact' | 'phrase' | 'words' | 'partial' = 'partial';
  const matchedFields = new Set<string>();

  for (const { field, text } of targetTexts) {
    if (!text) continue;

    // 1. Exact match on target field
    if (text === normQuery) {
      bestScore = Math.max(bestScore, 100);
      bestMatchType = 'exact';
      matchedFields.add(field);
      continue;
    }

    // 2. Exact phrase contained in text
    if (text.includes(normQuery)) {
      bestScore = Math.max(bestScore, 85);
      if (bestScore < 100) bestMatchType = 'phrase';
      matchedFields.add(field);
      continue;
    }

    // 3. All query keywords present in text (regardless of order, e.g. "MOHD HANIS" in "HANIS NASRUDDIN")
    const wordsInText = text.split(' ');
    const allTokensPresent = queryKeywords.every(kw => 
      wordsInText.some(w => w.includes(kw) || kw.includes(w))
    );

    if (allTokensPresent) {
      bestScore = Math.max(bestScore, 70);
      if (bestScore < 85) bestMatchType = 'words';
      matchedFields.add(field);
      continue;
    }

    // 4. Any keyword matches as whole word or strong prefix (at least 3 characters)
    let matchedKeywordsCount = 0;
    for (const kw of queryKeywords) {
      if (kw.length >= 3 && wordsInText.some(w => w.startsWith(kw) || w === kw)) {
        matchedKeywordsCount++;
      } else if (kw.length === 2 && wordsInText.some(w => w === kw)) {
        matchedKeywordsCount++;
      }
    }

    if (matchedKeywordsCount > 0) {
      const partialRatio = matchedKeywordsCount / queryKeywords.length;
      const calculatedScore = Math.round(35 + partialRatio * 25);
      if (calculatedScore > bestScore) {
        bestScore = calculatedScore;
        bestMatchType = 'partial';
        matchedFields.add(field);
      }
    }
  }

  // Cross-token name reordering bonus:
  // e.g. User searches "MOHD HANIS", candidate is "HANIS NASRUDDIN" -> "HANIS" matches, high score!
  if (fieldFilter === 'name' || !fieldFilter) {
    const candidateNameWords = nameNorm.split(' ').filter(w => w !== 'bin' && w !== 'binti' && w !== 'bt' && w.length > 2);
    const queryNameWords = queryKeywords.filter(w => w !== 'bin' && w !== 'binti' && w !== 'bt' && w.length > 2);
    
    let sharedSignificantNames = 0;
    for (const qWord of queryNameWords) {
      if (candidateNameWords.some(cWord => cWord.includes(qWord) || qWord.includes(cWord))) {
        sharedSignificantNames++;
      }
    }

    if (sharedSignificantNames > 0) {
      const bonusScore = Math.min(90, 50 + sharedSignificantNames * 20);
      if (bonusScore > bestScore) {
        bestScore = bonusScore;
        bestMatchType = sharedSignificantNames === queryNameWords.length ? 'words' : 'partial';
        matchedFields.add('nama');
      }
    }
  }

  if (bestScore < 30) return null;

  return {
    score: bestScore,
    matchType: bestMatchType,
    matchedFields: Array.from(matchedFields),
  };
}

/**
 * Executes multi-field search according to user filters
 */
export function executeSmartSearch(
  bookings: NormalizedBooking[],
  filters: SearchFilters,
  currentSelectedDate: string
): SearchResult[] {
  const hasName = filters.nameQuery.trim().length > 0;
  const hasClass = filters.classQuery.trim().length > 0;
  const hasGeneral = filters.generalQuery.trim().length > 0;

  // Filter by date unless allDates is enabled
  const baseBookings = filters.allDates 
    ? bookings 
    : bookings.filter(b => b.date === currentSelectedDate);

  if (!hasName && !hasClass && !hasGeneral) {
    return baseBookings.map(b => ({
      booking: b,
      score: 100,
      matchType: 'exact',
      matchedFields: [],
    }));
  }

  const results: SearchResult[] = [];

  for (const booking of baseBookings) {
    let finalScore = 0;
    let matchType: 'exact' | 'phrase' | 'words' | 'partial' = 'partial';
    const allMatchedFields = new Set<string>();
    let matchedCount = 0;
    let activeFiltersCount = 0;

    if (hasName) {
      activeFiltersCount++;
      const res = scoreBooking(booking, filters.nameQuery, 'name');
      if (res) {
        matchedCount++;
        finalScore += res.score;
        matchType = res.score > finalScore ? res.matchType : matchType;
        res.matchedFields.forEach(f => allMatchedFields.add(f));
      }
    }

    if (hasClass) {
      activeFiltersCount++;
      const res = scoreBooking(booking, filters.classQuery, 'class');
      if (res) {
        matchedCount++;
        finalScore += res.score;
        res.matchedFields.forEach(f => allMatchedFields.add(f));
      }
    }

    if (hasGeneral) {
      activeFiltersCount++;
      const res = scoreBooking(booking, filters.generalQuery, 'general');
      if (res) {
        matchedCount++;
        finalScore += res.score;
        res.matchedFields.forEach(f => allMatchedFields.add(f));
      }
    }

    // Require all active search boxes to match if multiple are used
    if (activeFiltersCount > 0 && matchedCount === activeFiltersCount) {
      const avgScore = Math.round(finalScore / activeFiltersCount);
      results.push({
        booking,
        score: avgScore,
        matchType,
        matchedFields: Array.from(allMatchedFields),
      });
    }
  }

  // Sort descending by score, then date, then start time
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.booking.date !== b.booking.date) return b.booking.date.localeCompare(a.booking.date);
    return a.booking.startMinutes - b.booking.startMinutes;
  });
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { DateNavigation } from './components/DateNavigation';
import { SummaryCards } from './components/SummaryCards';
import { SearchBar } from './components/SearchBar';
import { ScheduleGrid } from './components/ScheduleGrid';
import { BookingQuickList } from './components/BookingQuickList';
import { BookingDetailModal } from './components/BookingDetailModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { NormalizedBooking, SearchFilters, DataSourceStatus } from './types/booking';
import {
  loadInitialData,
  refreshSheetData,
  importCustomCSV,
} from './services/sheetsService';
import {
  getMalaysiaTodayDateString,
  calculateScheduleMetrics,
  formatMalayDate,
} from './utils/scheduleMath';
import { executeSmartSearch } from './utils/searchEngine';
import { STANDARD_VENUES } from './utils/csvParser';
import { AlertCircle, RefreshCw, Calendar, Sparkles } from 'lucide-react';

export default function App() {
  const [allBookings, setAllBookings] = useState<NormalizedBooking[]>([]);
  const [status, setStatus] = useState<DataSourceStatus>({
    sourceType: 'default-sheet',
    lastUpdated: 'Sedang memuatkan...',
    totalRecords: 0,
    isLoading: true,
  });

  // Default to today in Malaysia timezone
  const todayMalaysia = useMemo(() => getMalaysiaTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayMalaysia);

  // Search & filter state
  const [filters, setFilters] = useState<SearchFilters>({
    nameQuery: '',
    classQuery: '',
    generalQuery: '',
    allDates: false,
  });

  // Modal & Selection state
  const [selectedBooking, setSelectedBooking] = useState<NormalizedBooking | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOverlapsOnly, setFilterOverlapsOnly] = useState(false);

  // Initialize data from verified source / local cache
  useEffect(() => {
    let isMounted = true;
    loadInitialData().then(({ bookings, status: initialStatus }) => {
      if (isMounted) {
        setAllBookings(bookings);
        setStatus(initialStatus);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute list of distinct dates that have bookings, sorted descending
  const activeDatesWithBookings = useMemo(() => {
    const countsMap = new Map<string, number>();
    for (const b of allBookings) {
      countsMap.set(b.date, (countsMap.get(b.date) || 0) + 1);
    }
    const datesArr = Array.from(countsMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
    return datesArr.sort((a, b) => b.date.localeCompare(a.date));
  }, [allBookings]);

  // Bookings for currently selected date
  const dateBookings = useMemo(() => {
    const list = allBookings.filter(b => b.date === selectedDate);
    if (filterOverlapsOnly) {
      return list.filter(b => b.isOverlapping);
    }
    return list;
  }, [allBookings, selectedDate, filterOverlapsOnly]);

  // Dynamic Metrics for selected date
  const metrics = useMemo(() => {
    const rawForDate = allBookings.filter(b => b.date === selectedDate);
    return calculateScheduleMetrics(rawForDate, STANDARD_VENUES.length);
  }, [allBookings, selectedDate]);

  // Smart Search Results
  const isSearchActive = Boolean(
    filters.nameQuery.trim() ||
    filters.classQuery.trim() ||
    filters.generalQuery.trim() ||
    filters.allDates
  );

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    return executeSmartSearch(allBookings, filters, selectedDate);
  }, [allBookings, filters, selectedDate, isSearchActive]);

  // Date Navigation Handlers
  const handleJumpToday = useCallback(() => {
    setSelectedDate(todayMalaysia);
    setFilterOverlapsOnly(false);
  }, [todayMalaysia]);

  const handlePrevDate = useCallback(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const newY = dateObj.getFullYear();
    const newM = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const newD = dateObj.getDate().toString().padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  }, [selectedDate]);

  const handleNextDate = useCallback(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const newY = dateObj.getFullYear();
    const newM = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const newD = dateObj.getDate().toString().padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  }, [selectedDate]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { bookings, status: newStatus } = await refreshSheetData();
      setAllBookings(bookings);
      setStatus(newStatus);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Connect Custom URL handler
  const handleConnectCustomUrl = useCallback(async (url: string) => {
    setIsRefreshing(true);
    try {
      const { bookings, status: newStatus } = await refreshSheetData(url);
      setAllBookings(bookings);
      setStatus(newStatus);
      setIsSheetsModalOpen(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Reset to default official data
  const handleResetDefault = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { bookings, status: newStatus } = await refreshSheetData('');
      setAllBookings(bookings);
      setStatus(newStatus);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Import raw CSV
  const handleImportCSV = useCallback((csvText: string) => {
    const { bookings, status: newStatus } = importCustomCSV(csvText);
    setAllBookings(bookings);
    setStatus(newStatus);
  }, []);

  // Print schedule
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isToday = selectedDate === todayMalaysia;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Institutional Top Navigation Header */}
      <Header
        status={status}
        onRefresh={handleRefresh}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onPrint={handlePrint}
        isRefreshing={isRefreshing}
        onJumpToday={handleJumpToday}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Connection Notice / Warning if any */}
        {status.error && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{status.error}</span>
            </div>
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-amber-800 font-semibold underline hover:text-amber-950 cursor-pointer"
            >
              Semak Konfigurasi
            </button>
          </div>
        )}

        {/* 1. Date Navigation Bar */}
        <DateNavigation
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onJumpToday={handleJumpToday}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          activeDatesWithBookings={activeDatesWithBookings}
          isToday={isToday}
        />

        {/* 2. Top Summary KPI Cards */}
        <SummaryCards
          metrics={metrics}
          onFilterOverlapsOnly={() => setFilterOverlapsOnly(!filterOverlapsOnly)}
          isOverlapsFiltered={filterOverlapsOnly}
        />

        {/* 3. Smart Search Component */}
        <SearchBar
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => {
            setFilters({
              nameQuery: '',
              classQuery: '',
              generalQuery: '',
              allDates: false,
            });
            setFilterOverlapsOnly(false);
          }}
          totalMatches={searchResults.length}
          currentDateLabel={selectedDate}
        />

        {/* 4. Main Timetable Schedule Grid (Calendar View) */}
        <section aria-label="Jadual Grid Waktu Tempahan">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Paparan Grid Kalendar Waktu</span>
              <span className="text-xs text-slate-500 font-normal">
                (7:30 AM – 5:00 PM)
              </span>
            </h3>
            {filterOverlapsOnly && (
              <button
                onClick={() => setFilterOverlapsOnly(false)}
                className="text-xs text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors"
              >
                Menapis Tempahan Bertindih (Klik untuk papar semua)
              </button>
            )}
          </div>

          <ScheduleGrid
            bookings={dateBookings}
            onSelectBooking={setSelectedBooking}
            selectedBookingId={selectedBooking?.id}
            isToday={isToday}
          />
        </section>

        {/* 5. Booking Quick List or Search Results */}
        <section aria-label="Senarai Tempahan">
          <BookingQuickList
            bookings={dateBookings}
            searchResults={searchResults}
            isSearching={isSearchActive}
            isAllDatesSearch={filters.allDates}
            selectedBookingId={selectedBooking?.id}
            onSelectBooking={(b) => setSelectedBooking(b)}
            onJumpToDate={(date) => {
              setSelectedDate(date);
              setFilters(prev => ({ ...prev, allDates: false }));
            }}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span>e-Tempahan Prasekolah</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">Kementerian Pendidikan Malaysia (KPM)</span>
          </div>
          <div className="text-slate-400">
            Sumber Data: Google Sheets Terkawal · Zon Masa: Asia/Kuala_Lumpur (MYT)
          </div>
        </div>
      </footer>

      {/* Detail Modal Popup */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        allBookings={allBookings}
        onSelectOtherBooking={(other) => setSelectedBooking(other)}
      />

      {/* Google Sheets Configuration Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        status={status}
        onConnectCustomUrl={handleConnectCustomUrl}
        onResetDefault={handleResetDefault}
        onImportCSV={handleImportCSV}
        isProcessing={isRefreshing}
      />

    </div>
  );
}

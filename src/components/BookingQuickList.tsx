import React from 'react';
import { Clock, MapPin, User, BookOpen, AlertTriangle, ArrowRight, Laptop } from 'lucide-react';
import { NormalizedBooking, SearchResult } from '../types/booking';
import { formatMalayDate } from '../utils/scheduleMath';

interface BookingQuickListProps {
  bookings: NormalizedBooking[];
  searchResults?: SearchResult[];
  isSearching: boolean;
  isAllDatesSearch: boolean;
  selectedBookingId?: string | null;
  onSelectBooking: (booking: NormalizedBooking) => void;
  onJumpToDate?: (date: string) => void;
}

export const BookingQuickList: React.FC<BookingQuickListProps> = ({
  bookings,
  searchResults,
  isSearching,
  isAllDatesSearch,
  selectedBookingId,
  onSelectBooking,
  onJumpToDate,
}) => {
  // If searching, render search results list
  if (isSearching && searchResults) {
    if (searchResults.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            Tiada tempahan yang sepadan dengan carian anda
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cuba cari menggunakan nama lain, kod kelas seperti &quot;LAM&quot; atau &quot;3IK&quot;, atau tandakan pilihan &quot;Cari Semua Tarikh&quot;.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              Hasil Carian ({searchResults.length} rekod dijumpai)
            </h3>
            {isAllDatesSearch && (
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Merentasi Semua Tarikh
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            Disusun mengikut skor ketepatan carian
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
          {searchResults.map(({ booking, score, matchType }) => {
            const isSelected = selectedBookingId === booking.id;

            return (
              <div
                key={booking.id}
                onClick={() => onSelectBooking(booking)}
                className={`p-3.5 sm:px-4 hover:bg-teal-50/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected ? 'bg-teal-50 ring-2 ring-teal-500 ring-inset' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {booking.name}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {booking.facility}
                    </span>
                    {booking.extractedClass !== '-' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {booking.extractedClass}
                      </span>
                    )}
                    {booking.hasLaptopEquipment && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
                        <Laptop className="w-3 h-3" />
                        Laptop
                      </span>
                    )}
                    {booking.isOverlapping && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        Bertindih
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-teal-800">
                      {formatMalayDate(booking.date)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="tabular-nums font-medium text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {booking.formattedTimeRange} ({booking.durationMinutes} minit)
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 truncate max-w-xs">
                      Tujuan: {booking.purpose || '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAllDatesSearch && onJumpToDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToDate(booking.date);
                        onSelectBooking(booking);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-white border border-teal-300 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                    >
                      Buka Tarikh Ini
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    Skor: {score}% ({matchType})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Quick List for selected date
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Senarai Ringkas Tempahan ({bookings.length} rekod hari ini)
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Klik baris untuk menyerlahkan pada jadual grid
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">
            Tiada sebarang tempahan ruang didaftarkan untuk tarikh ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Masa</th>
                <th className="py-2.5 px-3">Tempat / Kemudahan</th>
                <th className="py-2.5 px-3">Nama Pemohon</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Tujuan Tempahan</th>
                <th className="py-2.5 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const isSelected = selectedBookingId === booking.id;

                return (
                  <tr
                    key={booking.id}
                    onClick={() => onSelectBooking(booking)}
                    className={`hover:bg-teal-50/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50 font-medium' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap tabular-nums">
                      {booking.formattedTimeRange}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900">{booking.facility}</span>
                        {booking.hasLaptopEquipment && (
                          <span title="Termasuk Laptop">
                            <Laptop className="w-3.5 h-3.5 text-violet-600" />
                          </span>
                        )}
                        {booking.isOverlapping && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Bertindih
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {booking.name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {booking.extractedClass !== '-' ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {booking.extractedClass}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {booking.purpose || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(booking);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        Lihat Blok
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

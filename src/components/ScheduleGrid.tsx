import React, { useRef, useEffect } from 'react';
import { Clock, AlertTriangle, Laptop, BookOpen, MapPin, ZoomIn } from 'lucide-react';
import { NormalizedBooking, VenueCategory } from '../types/booking';
import {
  generateTimeSlots,
  calculateBlockGeometry,
  getCurrentTimeLinePercent,
  OPERATING_START_MINUTES,
  OPERATING_END_MINUTES,
} from '../utils/scheduleMath';
import { STANDARD_VENUES } from '../utils/csvParser';

interface ScheduleGridProps {
  bookings: NormalizedBooking[];
  onSelectBooking: (booking: NormalizedBooking) => void;
  selectedBookingId?: string | null;
  isToday: boolean;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  bookings,
  onSelectBooking,
  selectedBookingId,
  isToday,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeSlots = generateTimeSlots();
  const currentTimePercent = isToday ? getCurrentTimeLinePercent() : null;

  // Determine which venues to show as rows:
  // Show standard venues, plus any additional unique venues found on this day
  const activeVenuesSet = new Set(bookings.map(b => b.normalizedVenue));
  
  const venueRows = [...STANDARD_VENUES];
  for (const vName of activeVenuesSet) {
    if (!venueRows.some(v => v.name === vName)) {
      venueRows.push({
        name: vName,
        category: 'Bilik Khas / Lain-lain',
        colorClass: 'text-slate-700',
        borderClass: 'border-slate-500',
        bgClass: 'bg-slate-700',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      });
    }
  }

  // Group bookings by row venue
  const bookingsByVenue = new Map<string, NormalizedBooking[]>();
  for (const row of venueRows) {
    bookingsByVenue.set(row.name, []);
  }

  for (const b of bookings) {
    const list = bookingsByVenue.get(b.normalizedVenue);
    if (list) {
      list.push(b);
    } else {
      // Put in last row or create
      const otherList = bookingsByVenue.get('Bilik Khas / Lain-lain') || [];
      otherList.push(b);
      bookingsByVenue.set('Bilik Khas / Lain-lain', otherList);
    }
  }

  // Scroll to selected booking or current time on mount/update
  useEffect(() => {
    if (selectedBookingId && containerRef.current) {
      const el = document.getElementById(selectedBookingId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [selectedBookingId]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top bar with operational hours banner & Color Legend */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-4 h-4 text-teal-600" />
          <span className="font-semibold">Waktu Operasi Prasekolah:</span>
          <span className="tabular-nums font-medium text-slate-900">7:30 AM – 5:00 PM</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Sela 30 Minit (9 Jam 30 Minit)</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-medium">Kategori:</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Bilik Mesyuarat
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            PSS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
            <span className="w-2 h-2 rounded-full bg-violet-600" />
            Laptop / Komputer
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Dewan
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            Surau
          </span>
        </div>
      </div>

      {/* Main Timetable Matrix Scrollable Container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-auto max-h-[640px] custom-scrollbar border-b border-slate-200"
      >
        <div className="min-w-[1280px]">
          
          {/* Header Row: Venue Column + 19 Time Slot Columns */}
          <div className="sticky top-0 z-30 flex bg-slate-100/95 backdrop-blur-xs border-b border-slate-300">
            
            {/* Corner Sticky Header: TEMPAT / RUANG */}
            <div className="sticky left-0 z-40 w-56 shrink-0 bg-slate-100 px-3 py-2.5 font-bold text-xs text-slate-800 border-r border-slate-300 flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                TEMPAT / KEMUDAHAN
              </span>
              <span className="text-[10px] text-slate-500 font-normal">MASA ➔</span>
            </div>

            {/* Time Slot Columns */}
            <div className="flex-1 flex">
              {timeSlots.map((slot) => {
                const [startH] = slot.time24.split(':');
                const isFullHour = slot.startMinutes % 60 === 0;

                return (
                  <div
                    key={slot.index}
                    className={`flex-1 min-w-[70px] px-1 py-2 text-center border-r border-slate-200 select-none ${
                      isFullHour ? 'bg-slate-100 font-bold' : 'bg-slate-50/70 font-medium'
                    }`}
                  >
                    <div className="text-[11px] text-slate-800 tabular-nums font-semibold">
                      {slot.time24}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">
                      {slot.label12.split('–')[0].trim()}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Table Body: Rows for each Venue */}
          <div className="relative divide-y divide-slate-200">
            
            {/* Real-time Indicator Line (if current date is today) */}
            {currentTimePercent !== null && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-1000"
                style={{
                  left: `calc(14rem + (100% - 14rem) * ${currentTimePercent / 100})`,
                }}
              >
                <div className="w-0.5 h-full bg-rose-500 relative shadow-sm">
                  <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-xs flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <div className="absolute top-2 left-1 bg-rose-600 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-xs whitespace-nowrap">
                    WAKTU KINI
                  </div>
                </div>
              </div>
            )}

            {venueRows.map((venue) => {
              const venueBookings = bookingsByVenue.get(venue.name) || [];
              const hasBookings = venueBookings.length > 0;
              const hasOverlaps = venueBookings.some(b => b.isOverlapping);

              // Calculate dynamic row height: Expand if multiple overlapping sub-lanes exist
              const maxLanes = Math.max(1, ...venueBookings.map(b => b.totalLanes || 1));
              const rowHeightPx = Math.max(88, maxLanes * 58);

              return (
                <div
                  key={venue.name}
                  className="flex transition-colors group"
                  style={{ minHeight: `${rowHeightPx}px` }}
                >
                  
                  {/* Sticky Venue Column */}
                  <div className="sticky left-0 z-20 w-56 shrink-0 bg-white group-hover:bg-slate-50/80 px-3 py-2.5 border-r border-slate-300 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${venue.bgClass}`} />
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {venue.name}
                        </h4>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{venueBookings.length} tempahan</span>
                        {hasOverlaps && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Bertindih
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {hasBookings ? 'Berjadual aktif' : 'Sedia untuk ditempah'}
                    </div>
                  </div>

                  {/* Timeline Lane with 19 30-min background grid lines */}
                  <div className="flex-1 relative flex bg-white group-hover:bg-slate-50/30">
                    
                    {/* Unbooked 30-min Grid Background cells */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timeSlots.map((slot) => {
                        const isFullHour = slot.startMinutes % 60 === 0;
                        return (
                          <div
                            key={slot.index}
                            className={`flex-1 border-r border-slate-100 ${
                              isFullHour ? 'border-r-slate-200' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Rendered Colored Booking Blocks */}
                    {venueBookings.map((booking) => {
                      const geom = calculateBlockGeometry(booking);
                      const isSelected = selectedBookingId === booking.id;

                      // Calculate sub-lane vertical positioning if overlapping
                      const laneHeight = booking.totalLanes > 1 ? 100 / booking.totalLanes : 100;
                      const topPercent = booking.laneIndex * laneHeight;

                      // Block color styling based on venue category
                      let blockBgColor = 'bg-blue-600 hover:bg-blue-700';
                      let blockBorderColor = 'border-blue-700';
                      if (booking.venueCategory === 'PSS') {
                        blockBgColor = 'bg-emerald-600 hover:bg-emerald-700';
                        blockBorderColor = 'border-emerald-700';
                      } else if (booking.venueCategory === 'Laptop / Komputer Riba') {
                        blockBgColor = 'bg-violet-600 hover:bg-violet-700';
                        blockBorderColor = 'border-violet-700';
                      } else if (booking.venueCategory === 'Dewan') {
                        blockBgColor = 'bg-rose-600 hover:bg-rose-700';
                        blockBorderColor = 'border-rose-700';
                      } else if (booking.venueCategory === 'Surau') {
                        blockBgColor = 'bg-teal-600 hover:bg-teal-700';
                        blockBorderColor = 'border-teal-700';
                      } else if (booking.venueCategory === 'Bilik Khas / Lain-lain') {
                        blockBgColor = 'bg-amber-600 hover:bg-amber-700';
                        blockBorderColor = 'border-amber-700';
                      }

                      return (
                        <div
                          key={booking.id}
                          id={booking.id}
                          onClick={() => onSelectBooking(booking)}
                          className={`absolute z-10 p-1.5 text-white rounded-md cursor-pointer transition-all duration-150 overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border ${blockBgColor} ${blockBorderColor} ${
                            isSelected
                              ? 'ring-3 ring-amber-400 ring-offset-1 z-30 animate-pulse'
                              : ''
                          } ${booking.isOverlapping ? 'ring-1 ring-amber-300' : ''}`}
                          style={{
                            left: `${geom.leftPercent}%`,
                            width: `${geom.widthPercent}%`,
                            top: `${topPercent}%`,
                            height: `${laneHeight - 3}%`,
                          }}
                          title={`Klik untuk butiran: ${booking.facility} | ${booking.name} (${booking.formattedTimeRange})`}
                        >
                          <div className="h-full flex flex-col justify-between leading-tight">
                            
                            {/* Block Header: Venue Name & Overlap/Laptop badge */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] truncate tracking-tight text-white/95">
                                {booking.facility}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {booking.hasLaptopEquipment && (
                                  <span title="Termasuk Laptop">
                                    <Laptop className="w-3 h-3 text-white/80" />
                                  </span>
                                )}
                                {booking.isOverlapping && (
                                  <span className="inline-flex items-center px-1 rounded text-[9px] font-bold bg-amber-400 text-amber-950">
                                    Bertindih
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Block Middle: Applicant Full Name */}
                            <div className="font-semibold text-xs text-white truncate my-0.5">
                              {booking.name}
                            </div>

                            {/* Block Footer: Time & Class / Purpose */}
                            <div className="flex items-center justify-between gap-1 text-[10px] text-white/90 font-mono tabular-nums">
                              <span className="truncate">
                                {booking.formattedTimeRange}
                              </span>
                              {booking.extractedClass !== '-' && (
                                <span className="bg-black/25 px-1 py-0.2 rounded font-sans font-semibold text-[9px] shrink-0">
                                  {booking.extractedClass}
                                </span>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Day State Indicator */}
                    {!hasBookings && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <span className="text-xs text-slate-400 italic">
                          Tiada tempahan pada tarikh ini
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      </div>

      {/* Footer Notes on Out-of-hours bookings */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
          <span>Klik mana-mana blok untuk melihat maklumat penuh tempahan.</span>
        </div>
        <div className="text-slate-400">
          Semua masa diselaraskan dengan zon waktu Malaysia (Asia/Kuala_Lumpur)
        </div>
      </div>

    </div>
  );
};

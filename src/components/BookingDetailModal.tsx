import React from 'react';
import { X, Calendar, Clock, MapPin, User, BookOpen, AlertTriangle, Laptop, Info } from 'lucide-react';
import { NormalizedBooking } from '../types/booking';
import { formatMalayDate } from '../utils/scheduleMath';

interface BookingDetailModalProps {
  booking: NormalizedBooking | null;
  onClose: () => void;
  allBookings: NormalizedBooking[];
  onSelectOtherBooking: (b: NormalizedBooking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  allBookings,
  onSelectOtherBooking,
}) => {
  if (!booking) return null;

  // Find other overlapping bookings if any
  const overlappingBookings = booking.isOverlapping
    ? allBookings.filter(b => booking.overlapIds.includes(b.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              Butiran Lengkap Tempahan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Overlap Alert Banner if Overlapping */}
          {booking.isOverlapping && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">
                    Amaran: Pertindihan Tempahan Dikesan!
                  </span>
                  Ruang/kemudahan ini telah ditempah serentak oleh lebih daripada seorang pengguna dalam tempoh masa yang sama.
                </div>
              </div>
            </div>
          )}

          {/* Applicant & Venue Hero */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Nama Guru / Pemohon
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{booking.name}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Tempat / Kemudahan Ditempah
              </div>
              <div className="text-sm font-bold text-teal-800 mt-0.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{booking.facility}</span>
                <span className="text-[11px] font-medium text-slate-500">
                  ({booking.normalizedVenue})
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tarikh Tempahan
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {formatMalayDate(booking.date)}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {booking.date}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Masa & Tempoh
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1 tabular-nums">
                {booking.formattedTimeRange}
              </div>
              <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                Tempoh: {booking.durationMinutes} minit
              </div>
            </div>
          </div>

          {/* Class & Equipment Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Kelas Berkaitan
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {booking.extractedClass !== '-' ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-xs">
                    {booking.extractedClass}
                  </span>
                ) : (
                  <span className="text-slate-400">Tiada dinyatakan</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                Peralatan Tambahan
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {booking.hasLaptopEquipment ? (
                  <span className="text-violet-700 font-medium text-[11px]">
                    {booking.laptopNote || 'Termasuk Laptop'}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Tiada</span>
                )}
              </div>
            </div>
          </div>

          {/* Purpose / Tujuan */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Tujuan Tempahan
            </div>
            <div className="text-xs font-medium text-slate-800 mt-1.5 whitespace-pre-wrap leading-relaxed">
              {booking.purpose || 'Tiada catatan tujuan dibekalkan dalam rekod.'}
            </div>
          </div>

          {/* If overlapping, show conflicting bookings */}
          {overlappingBookings.length > 0 && (
            <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/50">
              <div className="text-xs font-bold text-amber-900 mb-2">
                Tempahan Lain yang Bertindih ({overlappingBookings.length}):
              </div>
              <div className="space-y-1.5">
                {overlappingBookings.map((other) => (
                  <div
                    key={other.id}
                    onClick={() => onSelectOtherBooking(other)}
                    className="p-2 rounded bg-white border border-amber-200 text-xs flex items-center justify-between hover:bg-amber-100/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{other.name}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600 font-mono tabular-nums">{other.formattedTimeRange}</span>
                    </div>
                    <span className="text-teal-700 font-semibold text-[11px]">
                      Buka &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup Butiran
          </button>
        </div>

      </div>
    </div>
  );
};

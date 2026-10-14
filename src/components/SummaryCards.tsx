import React from 'react';
import { CalendarCheck, MapPin, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { ScheduleMetrics } from '../types/booking';

interface SummaryCardsProps {
  metrics: ScheduleMetrics;
  onFilterOverlapsOnly?: () => void;
  isOverlapsFiltered?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  metrics,
  onFilterOverlapsOnly,
  isOverlapsFiltered,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      {/* Card 1: Jumlah Tempahan */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Jumlah Tempahan
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {metrics.totalBookings}
          </span>
          <span className="text-xs text-slate-500">sesi berdaftar</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{metrics.activeTeachersCount} guru/staf terlibat</span>
        </div>
      </div>

      {/* Card 2: Tempat Ditempah */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tempat Ditempah
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {metrics.distinctVenuesBooked}
          </span>
          <span className="text-xs text-slate-500">ruang aktif</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Daripada senarai ruang prasekolah/sekolah
        </div>
      </div>

      {/* Card 3: Tempat Masih Kosong */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tempat Kosong
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
            {metrics.availableVenuesCount}
          </span>
          <span className="text-xs text-slate-500">sumber lapang</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Sedia untuk tempahan baharu
        </div>
      </div>

      {/* Card 4: Pengesanan Pertindihan */}
      <div
        onClick={onFilterOverlapsOnly}
        className={`rounded-xl border p-4 shadow-2xs transition-all ${
          metrics.overlapCount > 0
            ? 'bg-amber-50/70 border-amber-300 cursor-pointer hover:border-amber-400'
            : 'bg-white border-slate-200'
        } ${isOverlapsFiltered ? 'ring-2 ring-amber-500' : ''}`}
        title={metrics.overlapCount > 0 ? 'Klik untuk tapis tempahan yang bertindih sahaja' : undefined}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            metrics.overlapCount > 0 ? 'text-amber-800' : 'text-slate-500'
          }`}>
            Pertindihan
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            metrics.overlapCount > 0 ? 'bg-amber-200/80 text-amber-800' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${
            metrics.overlapCount > 0 ? 'text-amber-800' : 'text-slate-700'
          }`}>
            {metrics.overlapCount}
          </span>
          <span className={`text-xs ${metrics.overlapCount > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
            {metrics.overlapCount > 0 ? 'kes bertindih dikesan' : 'tiada pertindihan'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {metrics.overlapCount > 0 ? (
            <span className="text-amber-800 font-medium underline">
              {isOverlapsFiltered ? 'Menapis pertindihan (Klik untuk reset)' : 'Blok disusun bertingkat (Klik lihat)'}
            </span>
          ) : (
            'Jadual teratur tanpa konflik'
          )}
        </div>
      </div>

    </div>
  );
};

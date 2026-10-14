import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { formatMalayDate } from '../utils/scheduleMath';

interface DateNavigationProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onJumpToday: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  activeDatesWithBookings: { date: string; count: number }[];
  isToday: boolean;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  onSelectDate,
  onJumpToday,
  onPrevDate,
  onNextDate,
  activeDatesWithBookings,
  isToday,
}) => {
  const malayFormattedDate = formatMalayDate(selectedDate);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title and Date indicator */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Jadual Tempahan
            </h2>
            {isToday && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Hari Ini
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-teal-700 mt-0.5">
            {malayFormattedDate}
          </p>
        </div>

        {/* Date Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Date Jumper Dropdown */}
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg py-2 pl-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              title="Pilih tarikh yang mempunyai tempahan"
            >
              <option value={selectedDate}>Pilih Tarikh Pantas...</option>
              {activeDatesWithBookings.map(({ date, count }) => (
                <option key={date} value={date}>
                  {date} ({count} tempahan) {formatMalayDate(date).split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Today Button */}
          <button
            onClick={onJumpToday}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isToday
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Hari Ini
          </button>

          {/* Previous Date Button */}
          <button
            onClick={onPrevDate}
            className="inline-flex items-center justify-center p-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Tarikh Sebelumnya"
            aria-label="Tarikh Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* HTML Date Picker Input */}
          <div className="relative inline-flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDate(e.target.value);
                }
              }}
              className="text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs cursor-pointer"
            />
          </div>

          {/* Next Date Button */}
          <button
            onClick={onNextDate}
            className="inline-flex items-center justify-center p-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Tarikh Seterusnya"
            aria-label="Tarikh Seterusnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
};

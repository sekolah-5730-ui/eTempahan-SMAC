import React from 'react';
import { Search, User, BookOpen, Layers, X, Globe, Calendar } from 'lucide-react';
import { SearchFilters } from '../types/booking';

interface SearchBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  totalMatches: number;
  currentDateLabel: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalMatches,
  currentDateLabel,
}) => {
  const isFiltered = Boolean(
    filters.nameQuery.trim() ||
    filters.classQuery.trim() ||
    filters.generalQuery.trim() ||
    filters.allDates
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      
      {/* Header of Search Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Fungsi Carian Pintar
          </h3>
          {isFiltered && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {totalMatches} {totalMatches === 1 ? 'padanan' : 'padanan dijumpai'}
            </span>
          )}
        </div>

        {/* Search Scope Toggle (Hari Ini vs Semua Tarikh) */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.allDates}
              onChange={(e) => onFilterChange({ ...filters, allDates: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              {filters.allDates ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-teal-800 font-semibold">Cari Semua Tarikh</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600">Tarikh Pilihan Sahaja ({currentDateLabel})</span>
                </>
              )}
            </span>
          </label>

          {isFiltered && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
              title="Kosongkan carian"
            >
              <X className="w-3.5 h-3.5" />
              <span>Kosongkan Carian</span>
            </button>
          )}
        </div>
      </div>

      {/* The 3 Targeted Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        
        {/* A. Cari Nama */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari Nama Guru / Pemohon..."
            value={filters.nameQuery}
            onChange={(e) => onFilterChange({ ...filters, nameQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          />
          {filters.nameQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, nameQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* B. Cari Kelas */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari Kelas (cth. LAM, 3IK, 4IS, 1IS)..."
            value={filters.classQuery}
            onChange={(e) => onFilterChange({ ...filters, classQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          />
          {filters.classQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, classQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* C. Cari Semua (General Search) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Layers className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Cari Semua (Tempat, Tujuan, Subjek)..."
            value={filters.generalQuery}
            onChange={(e) => onFilterChange({ ...filters, generalQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          />
          {filters.generalQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, generalQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Helpful Search Hints */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600">Cadangan Carian:</span>
        <button
          onClick={() => onFilterChange({ ...filters, nameQuery: 'Hanis' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;Hanis&quot;
        </button>
        <span>·</span>
        <button
          onClick={() => onFilterChange({ ...filters, nameQuery: 'Roszita' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;Roszita&quot;
        </button>
        <span>·</span>
        <button
          onClick={() => onFilterChange({ ...filters, classQuery: 'LAM' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;LAM&quot;
        </button>
        <span>·</span>
        <button
          onClick={() => onFilterChange({ ...filters, classQuery: '3IK' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;3IK&quot;
        </button>
        <span>·</span>
        <button
          onClick={() => onFilterChange({ ...filters, generalQuery: 'Bilik Mesyuarat' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;Bilik Mesyuarat&quot;
        </button>
        <span>·</span>
        <button
          onClick={() => onFilterChange({ ...filters, generalQuery: 'PSS' })}
          className="hover:text-teal-700 hover:underline cursor-pointer"
        >
          &quot;PSS&quot;
        </button>
      </div>

    </div>
  );
};

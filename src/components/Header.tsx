import React from 'react';
import { RefreshCw, Database, Printer, Calendar } from 'lucide-react';
import { DataSourceStatus } from '../types/booking';

interface HeaderProps {
  status: DataSourceStatus;
  onRefresh: () => void;
  onOpenSheetsModal: () => void;
  onPrint: () => void;
  isRefreshing: boolean;
  onJumpToday: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onRefresh,
  onOpenSheetsModal,
  onPrint,
  isRefreshing,
  onJumpToday,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand wordmark & institutional identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Calendar className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  e-Tempahan Prasekolah
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200/80 rounded px-1.5 py-0.5">
                  Sistem Rasmi
                </span>
              </div>
              <div className="text-xs text-slate-500 hidden md:block">
                Semakan Jadual Ruang & Kemudahan Prasekolah
              </div>
            </div>
          </div>

          {/* Zone 2: Informational data source connection status */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Google Sheets:</span>
            <span className="text-slate-500">
              {status.sourceType === 'custom-url' ? 'Pautan Khusus' : 'Pangkalan Data Rasmi'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {status.totalRecords} rekod dimuat
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 tabular-nums">
              Kemaskini: {status.lastUpdated}
            </span>
          </div>

          {/* Zone 3: Functional actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onJumpToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Pergi ke jadual hari ini"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Hari Ini</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Muat semula data daripada Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Muat Semula</span>
            </button>

            <button
              onClick={onOpenSheetsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Konfigurasi sumber data Google Sheets"
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Sumber Data</span>
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Cetak Jadual Waktu"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

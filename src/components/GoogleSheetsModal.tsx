import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertCircle, RefreshCw, ExternalLink, HelpCircle, FileText } from 'lucide-react';
import { DataSourceStatus } from '../types/booking';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DataSourceStatus;
  onConnectCustomUrl: (url: string) => Promise<void>;
  onResetDefault: () => Promise<void>;
  onImportCSV: (csvText: string) => void;
  isProcessing: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  status,
  onConnectCustomUrl,
  onResetDefault,
  onImportCSV,
  isProcessing,
}) => {
  const [inputUrl, setInputUrl] = useState(status.sheetUrl || '');
  const [activeTab, setActiveTab] = useState<'url' | 'paste' | 'guide'>('url');
  const [pastedCSV, setPastedCSV] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!inputUrl.trim()) {
      setFeedback('Sila masukkan URL Google Sheets yang sah.');
      return;
    }
    setFeedback(null);
    await onConnectCustomUrl(inputUrl.trim());
  };

  const handlePasteImport = () => {
    if (!pastedCSV.trim()) {
      setFeedback('Sila tampal teks CSV yang sah.');
      return;
    }
    onImportCSV(pastedCSV.trim());
    setFeedback('Data CSV berjaya diimport ke dalam sistem.');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Sumber Data Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Pengurusan sambungan data dinamik e-Tempahan Prasekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Box */}
        <div className="px-6 pt-4 pb-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">
                  {status.sourceType === 'custom-url'
                    ? 'Pautan Google Sheets Khusus'
                    : status.sourceType === 'cached'
                    ? 'Data Cache Pelayan'
                    : 'Pangkalan Data Spreadsheet Rasmi'}
                </span>
              </div>
              <div className="text-slate-500">
                {status.totalRecords} rekod dimuatkan · Kemas kini: {status.lastUpdated}
              </div>
            </div>

            <button
              onClick={onResetDefault}
              disabled={isProcessing || status.sourceType === 'default-sheet'}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              Pulihkan Asal
            </button>
          </div>

          {status.error && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {feedback && (
            <div className="mt-2 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-2">
          <div className="flex border-b border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'url'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sambung Melalui URL
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tampal CSV Terus
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'guide'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Panduan Google Sheets
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'url' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pautan Spreadsheet Google Sheets
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistem menyokong pautan Google Sheets perkongsian biasa atau pautan CSV &quot;Publish to the Web&quot;.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold block text-slate-800">Prasyarat Akses:</span>
                <div>Pastikan tetapan perkongsian ditetapkan kepada &quot;Anyone with the link can view&quot; atau terbitkan sheet sebagai fail CSV.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleConnect}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyambung...
                    </>
                  ) : (
                    'Sambung & Muat Data'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tampal Kandungan CSV Baharu
                </label>
                <textarea
                  rows={6}
                  placeholder="NAMA,TEMPAT/ALAT TEMPAHAN,TARIKH,MASA GUNA,MASA TAMAT,TUJUAN..."
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handlePasteImport}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                >
                  Import & Kemas Kini Jadual
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                Cara Menyambungkan Google Sheets Prasekolah Anda
              </div>

              <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                <li>
                  Buka fail Google Sheets borang tempahan anda.
                </li>
                <li>
                  Pastikan lajur pertama mengandungi tajuk:
                  <div className="font-mono text-[10px] bg-slate-100 p-1.5 rounded mt-0.5 border border-slate-200">
                    NAMA, TEMPAT/ALAT TEMPAHAN, TARIKH, MASA GUNA, MASA TAMAT, TUJUAN
                  </div>
                </li>
                <li>
                  Klik menu <strong>File (Fail)</strong> &rarr; <strong>Share (Kongsi)</strong> &rarr; <strong>Publish to web (Terbitkan ke web)</strong>.
                </li>
                <li>
                  Pilih format <strong>Comma-separated values (.csv)</strong> dan klik <strong>Publish</strong>.
                </li>
                <li>
                  Salin pautan yang dijana dan tampal pada tab &quot;Sambung Melalui URL&quot;.
                </li>
              </ol>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Kelayakan sulit & token kekal selamat dan tidak didedahkan.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

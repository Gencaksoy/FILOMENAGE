'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Car,
  Users,
  Wrench,
  Droplet,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  Download,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import {
  TargetModuleType,
  MODULE_LABELS,
  applyUniversalMappingToRows,
} from '@/lib/excel-ai';

interface ImportSummary {
  targetModule: TargetModuleType;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  createdCustomersCount?: number;
  errors?: string[];
}

const MODULE_NAV_INFO: Record<
  TargetModuleType,
  { label: string; icon: any; route: string; color: string }
> = {
  VEHICLES: {
    label: 'Araçlar & Filo',
    icon: Car,
    route: '/vehicles',
    color: 'amber',
  },
  CUSTOMERS: {
    label: 'Müşteriler & Belgeler',
    icon: Users,
    route: '/customers',
    color: 'blue',
  },
  MAINTENANCE: {
    label: 'Bakım & Onarım',
    icon: Wrench,
    route: '/maintenances',
    color: 'purple',
  },
  OIL_CHANGE: {
    label: 'Motor Yağı Değişimi',
    icon: Droplet,
    route: '/maintenances',
    color: 'indigo',
  },
  INSPECTION: {
    label: 'Yıllık Muayene & Registracija',
    icon: FileCheck2,
    route: '/inspection',
    color: 'emerald',
  },
  PARKING_TICKETS: {
    label: 'Park Cezaları (eDPK)',
    icon: AlertTriangle,
    route: '/parking-tickets',
    color: 'rose',
  },
};

export default function UniversalExcelImportPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<'UPLOAD' | 'ANALYZING' | 'PREVIEW' | 'SUCCESS'>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedModule, setSelectedModule] = useState<TargetModuleType>('VEHICLES');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setStep('UPLOAD');
    setFile(null);
    setRawRows([]);
    setAnalysisResult(null);
    setSelectedModule('VEHICLES');
    setParsedItems([]);
    setUpdateExisting(false);
    setSearchQuery('');
    setImportSummary(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      toast.error(
        language === 'sr'
          ? 'Molimo izaberite važeći Excel (.xlsx, .xls) ili CSV fajl.'
          : language === 'en'
          ? 'Please select a valid Excel (.xlsx, .xls) or CSV file.'
          : 'Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası seçin.'
      );
      return;
    }
    setFile(selectedFile);
  };

  const handleDownloadSample = (moduleKey: TargetModuleType = selectedModule) => {
    try {
      let sampleData: Record<string, any>[] = [];
      let filename = 'Ornek_Tablo.xlsx';

      if (moduleKey === 'VEHICLES') {
        filename = 'Ornek_Araclar_Filo.xlsx';
        sampleData = [
          {
            'Registracija': 'BG-1122AA',
            'Vozilo': 'Fiat Punto 1.2 8V',
            'Godiste': 2021,
            'Boja': 'Bela',
            'Kilometraza': 124000,
            'Gorivo': 'Benzin',
            'Cena Mesec': 340,
            'Vozac / Klijent': 'Stefan Markovic',
            'Kontakt Telefon': '+381 64 1112233',
            'Vlasnik': 'Filo Kasası',
          },
          {
            'Registracija': 'BG-3344BB',
            'Vozilo': 'Volkswagen Golf 7',
            'Godiste': 2019,
            'Boja': 'Siva',
            'Kilometraza': 185000,
            'Gorivo': 'Dizel',
            'Cena Mesec': 450,
            'Vozac / Klijent': '',
            'Kontakt Telefon': '',
            'Vlasnik': 'Ortak Ali',
          },
        ];
      } else if (moduleKey === 'CUSTOMERS') {
        filename = 'Ornek_Musteriler_Rehber.xlsx';
        sampleData = [
          {
            'Ime i Prezime': 'Stefan Markovic',
            'Broj Telefona': '+381 64 1234567',
            'Broj Pasosa / LK': '009823412',
            'Email': 'stefan.markovic@email.com',
            'Adresa': 'Knez Mihailova 12, Beograd',
            'Napomena': 'Güvenilir müşteri',
          },
          {
            'Ime i Prezime': 'Milos Jovanovic',
            'Broj Telefona': '+381 61 9876543',
            'Broj Pasosa / LK': '007654321',
            'Email': 'milos.j@email.com',
            'Adresa': 'Bulevar Kralja Aleksandra 45',
            'Napomena': 'Şirket ortağı yönlendirdi',
          },
        ];
      } else if (moduleKey === 'MAINTENANCE') {
        filename = 'Ornek_Bakim_Onarim.xlsx';
        sampleData = [
          {
            'Tablica': 'BG-1122AA',
            'Datum Servisa': '2026-09-15',
            'Naziv Servisa': 'Auto Centar Zvezdara',
            'Opis Kvara / Rada': 'Ön fren disk ve balata değişimi + ön takım kontrolü',
            'Usluga (Rukotvorina)': 40,
            'Cena Delova': 85,
            'Ukupan Iznos': 125,
            'Valuta': 'EUR',
            'Platio': 'Şirket Kasası',
          },
        ];
      } else if (moduleKey === 'OIL_CHANGE') {
        filename = 'Ornek_Yag_Degisimi.xlsx';
        sampleData = [
          {
            'Tablica': 'BG-1122AA',
            'Datum': '2026-09-20',
            'Kilometraza': 142000,
            'Vrsta Ulja': '5W-30 Castrol Edge',
            'Zamenjen Filter': 'DA',
            'Cena': 65,
            'Valuta': 'EUR',
            'Servis': 'Mobil Oil Beograd',
          },
        ];
      } else if (moduleKey === 'INSPECTION') {
        filename = 'Ornek_Muayene_Registracija.xlsx';
        sampleData = [
          {
            'Tablica': 'BG-1122AA',
            'Datum Pregleda': '2026-08-10',
            'Registracija Vazi Do': '2027-08-10',
            'Iznos Registracije': 320,
            'Valuta': 'EUR',
            'Tehnicki Centar': 'AMSS Beograd',
            'Platio': 'Filo Kasası',
          },
        ];
      } else if (moduleKey === 'PARKING_TICKETS') {
        filename = 'Ornek_Park_Cezalari.xlsx';
        sampleData = [
          {
            'Tablica': 'BG-1122AA',
            'Broj Kazne (eDPK)': 'EDPK-782194',
            'Datum i Vreme': '2026-10-02',
            'Iznos RSD': 1870,
            'Iznos EUR': 16,
            'Zona': 'Zona 2 (Zuta)',
            'Ulica': 'Njegoseva 18',
            'Razlog': 'Isteklo vreme parkiranja',
            'Status': 'NEPLACENO',
          },
        ];
      }

      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sablon');
      XLSX.writeFile(workbook, filename);

      toast.success(
        language === 'sr'
          ? `Preuzet šablon za: ${MODULE_LABELS[moduleKey].sr}`
          : language === 'en'
          ? `Sample downloaded for: ${MODULE_LABELS[moduleKey].en}`
          : `Örnek şablon indirildi: ${MODULE_LABELS[moduleKey].tr}`
      );
    } catch (err) {
      console.error(err);
      toast.error('Şablon indirilemedi.');
    }
  };

  const handleStartAnalysis = async () => {
    if (!file) return;

    setStep('ANALYZING');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/vehicles/import-excel/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Excel analiz edilemedi.');
      }

      setAnalysisResult(data);
      const mod = data.targetModule || 'VEHICLES';
      setSelectedModule(mod);
      setParsedItems(data.items || data.vehicles || []);
      setStep('PREVIEW');

      toast.success(
        `Yapay zeka "${MODULE_LABELS[mod as TargetModuleType]?.tr || mod}" içeriği tespit etti (${data.items?.length || 0} satır).`
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Analiz sırasında hata oluştu.');
      setStep('UPLOAD');
    }
  };

  // User manually switches target module
  const handleSwitchModule = (newModule: TargetModuleType) => {
    setSelectedModule(newModule);
    if (analysisResult?.sampleRows && analysisResult.columnMapping) {
      // Re-map with existing rows if available
      const mapped = applyUniversalMappingToRows(
        analysisResult.sampleRows,
        newModule,
        analysisResult.columnMapping
      );
      if (mapped.length > 0) {
        setParsedItems(mapped);
      }
    }
  };

  const handleRemoveRow = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) {
      toast.warning('Aktarılacak geçerli satır bulunamadı.');
      return;
    }

    setStep('ANALYZING');
    try {
      const res = await fetch('/api/vehicles/import-excel/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetModule: selectedModule,
          items: parsedItems,
          updateExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İçe aktarma başarısız oldu.');
      }

      setImportSummary({
        targetModule: selectedModule,
        createdCount: data.createdCount || 0,
        updatedCount: data.updatedCount || 0,
        skippedCount: data.skippedCount || 0,
        createdCustomersCount: data.createdCustomersCount || 0,
        errors: data.errors,
      });

      setStep('SUCCESS');
      toast.success(data.message || 'Veriler ilgili modüle başarıyla aktarıldı!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Veriler kaydedilirken hata oluştu.');
      setStep('PREVIEW');
    }
  };

  const filteredItems = parsedItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(q);
  });

  return (
    <AppLayout currentUser={user}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Evrensel Yapay Zeka Veri Entegratörü</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>🤖 AI Akıllı Çoklu Modül Veri Aktarımı</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Elinizdeki herhangi bir Excel veya CSV dosyasını yükleyin. Google Gemini 2.5 Flash tablonuzu (araçlar, müşteriler,
              bakımlar, yağ değişimleri, muayene veya cezalar) otomatik tanır ve sidebar&apos;daki ilgili modüle eksiksiz işler.
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadSample(selectedModule)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Aktif modüle uygun örnek Excel şablonunu indirin"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Örnek Excel Şablonu</span>
            </button>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'UPLOAD' && (
          <div className="space-y-6">
            {/* Target Module Pills Guide */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Yapay Zekanın Otomatik Tanıyıp Eşleştirdiği Sidebar Modülleri:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(Object.keys(MODULE_NAV_INFO) as TargetModuleType[]).map((key) => {
                  const info = MODULE_NAV_INFO[key];
                  const Icon = info.icon;
                  return (
                    <div
                      key={key}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) handleFileSelect(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 scale-[0.99]'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700/80 hover:border-amber-400/80 bg-white dark:bg-slate-900/60 shadow-sm'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                  {file ? <FileSpreadsheet className="w-9 h-9 text-emerald-600 dark:text-emerald-400" /> : <Upload className="w-9 h-9" />}
                </div>

                {file ? (
                  <div className="space-y-1">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({(file.size / 1024).toFixed(1)} KB) • Dosyayı değiştirmek için tıklayın
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      Excel / CSV Dosyanızı Buraya Sürükleyin veya Dosya Seçin
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">
                      Desteklenen formatlar: .xlsx, .xls, .csv (Sütun isimlerinin ne olduğu veya sıralaması fark etmez)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {file ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Dosya seçildi. Gemini AI modülü otomatik tespit edecek.
                  </span>
                ) : (
                  <span>Henüz bir dosya seçilmedi.</span>
                )}
              </div>

              <button
                type="button"
                disabled={!file}
                onClick={handleStartAnalysis}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka ile Analiz Et & Eşleştir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ANALYZING */}
        {step === 'ANALYZING' && (
          <div className="py-20 text-center space-y-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Sparkles className="w-9 h-9 text-amber-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Google Gemini 2.5 Flash Tablonuzu ve Hedef Modülü Çözümlüyor...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Yüklediğiniz verilerin araç, müşteri, bakım faturası, yağ değişimi veya park cezası olup olmadığı belirleniyor.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & REVIEW */}
        {step === 'PREVIEW' && analysisResult && (
          <div className="space-y-6">
            {/* AI Detected Module Banner + Switcher Tabs */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">🎯 Yapay Zeka Tespiti:</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {analysisResult.detectedModuleLabel || MODULE_LABELS[selectedModule].tr}
                  </span>
                  <span className="text-[11px] text-slate-400">({analysisResult.aiConfidence})</span>
                </div>
                <span className="text-[11px] text-slate-400">Farklı bir modüle aktarmak için sekmelere tıklayabilirsiniz:</span>
              </div>

              {/* Module Switcher Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(Object.keys(MODULE_NAV_INFO) as TargetModuleType[]).map((key) => {
                  const info = MODULE_NAV_INFO[key];
                  const Icon = info.icon;
                  const isSelected = selectedModule === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSwitchModule(key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Toplam Excel Satırı</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                  {analysisResult.totalRows}
                </span>
              </div>
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <span className="text-xs text-amber-700 dark:text-amber-300 block font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Eşleşen Kayıt Sayısı
                </span>
                <span className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5 block">
                  {parsedItems.length}
                </span>
              </div>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 block font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Hedef Sidebar Modülü
                </span>
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 mt-1 block truncate">
                  {MODULE_NAV_INFO[selectedModule].label}
                </span>
              </div>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 block font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Analiz Modeli
                </span>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 mt-1 block">
                  {analysisResult.method === 'GEMINI_AI' ? 'Gemini 2.5 Flash' : 'Kural Motoru'}
                </span>
              </div>
            </div>

            {/* Column Mapping Pills */}
            {analysisResult.columnMapping && Object.keys(analysisResult.columnMapping).length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Eşleştirilen Sütunlar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysisResult.columnMapping).map(([source, target]) => (
                    <span
                      key={source}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <b className="text-slate-900 dark:text-white">{source}</b>
                      <ArrowRight className="w-3 h-3 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{String(target)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kayıtlar içinde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <span className="text-xs text-slate-500">
                Gösterilen: <b>{filteredItems.length}</b> / {parsedItems.length}
              </span>
            </div>

            {/* Dynamic Preview Table by Module */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      {selectedModule === 'VEHICLES' && (
                        <>
                          <th className="py-3 px-4">Plaka</th>
                          <th className="py-3 px-4">Marka / Model</th>
                          <th className="py-3 px-4">Yıl / KM</th>
                          <th className="py-3 px-4">Durum</th>
                          <th className="py-3 px-4">Kiracı Müşteri</th>
                          <th className="py-3 px-4">Aylık Kira (€)</th>
                        </>
                      )}
                      {selectedModule === 'CUSTOMERS' && (
                        <>
                          <th className="py-3 px-4">Müşteri Adı Soyadı</th>
                          <th className="py-3 px-4">Telefon</th>
                          <th className="py-3 px-4">Pasaport / Kimlik No</th>
                          <th className="py-3 px-4">E-posta</th>
                          <th className="py-3 px-4">Adres</th>
                        </>
                      )}
                      {selectedModule === 'MAINTENANCE' && (
                        <>
                          <th className="py-3 px-4">Plaka</th>
                          <th className="py-3 px-4">Tarih</th>
                          <th className="py-3 px-4">Servis Adı</th>
                          <th className="py-3 px-4">Açıklama / Yapılan İşlem</th>
                          <th className="py-3 px-4">Toplam Tutar</th>
                          <th className="py-3 px-4">Ödeyen</th>
                        </>
                      )}
                      {selectedModule === 'OIL_CHANGE' && (
                        <>
                          <th className="py-3 px-4">Plaka</th>
                          <th className="py-3 px-4">Değişim Tarihi</th>
                          <th className="py-3 px-4">KM</th>
                          <th className="py-3 px-4">Yağ Türü</th>
                          <th className="py-3 px-4">Filtre Değişti mi</th>
                          <th className="py-3 px-4">Tutar</th>
                        </>
                      )}
                      {selectedModule === 'INSPECTION' && (
                        <>
                          <th className="py-3 px-4">Plaka</th>
                          <th className="py-3 px-4">Muayene Tarihi</th>
                          <th className="py-3 px-4">Bitiş / Registracija Do</th>
                          <th className="py-3 px-4">İstasyon</th>
                          <th className="py-3 px-4">Tutar</th>
                        </>
                      )}
                      {selectedModule === 'PARKING_TICKETS' && (
                        <>
                          <th className="py-3 px-4">Plaka</th>
                          <th className="py-3 px-4">eDPK Ceza No</th>
                          <th className="py-3 px-4">Tarih</th>
                          <th className="py-3 px-4">Bölge / Sokak</th>
                          <th className="py-3 px-4">Tutar (RSD / EUR)</th>
                          <th className="py-3 px-4">Durum</th>
                        </>
                      )}
                      <th className="py-3 px-3 text-right">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                        {selectedModule === 'VEHICLES' && (
                          <>
                            <td className="py-2.5 px-4 font-mono font-black text-slate-900 dark:text-white uppercase">
                              {item.plate}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              {item.brand} {item.model}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {item.modelYear} • {item.currentKm ? `${item.currentKm.toLocaleString()} km` : '-'}
                            </td>
                            <td className="py-2.5 px-4">
                              {item.status === 'RENTED' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                                  Kirada
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                  Boşta
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {item.customerName ? (
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block">{item.customerName}</span>
                                  {item.customerPhone && (
                                    <span className="text-[10px] text-slate-500 font-mono">{item.customerPhone}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-black text-slate-900 dark:text-slate-100">
                              €{item.monthlyPrice || 350}
                            </td>
                          </>
                        )}

                        {selectedModule === 'CUSTOMERS' && (
                          <>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                              {item.phone || '-'}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                              {item.identityNo || '-'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {item.email || '-'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {item.address || '-'}
                            </td>
                          </>
                        )}

                        {selectedModule === 'MAINTENANCE' && (
                          <>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white uppercase">
                              {item.plate}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{item.maintenanceDate}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{item.serviceName}</td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">{item.description}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                              {item.currency === 'RSD' ? `${item.totalCost} RSD` : `€${item.totalCost}`}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">{item.paidBy || 'Şirket'}</td>
                          </>
                        )}

                        {selectedModule === 'OIL_CHANGE' && (
                          <>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white uppercase">
                              {item.plate}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{item.changeDate}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {item.km ? `${item.km.toLocaleString()} km` : '-'}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-amber-600 dark:text-amber-400">{item.oilType}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                Değişti
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">€{item.cost}</td>
                          </>
                        )}

                        {selectedModule === 'INSPECTION' && (
                          <>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white uppercase">
                              {item.plate}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{item.inspectionDate}</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                              {item.nextInspectionDate}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{item.station}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">€{item.cost}</td>
                          </>
                        )}

                        {selectedModule === 'PARKING_TICKETS' && (
                          <>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white uppercase">
                              {item.plate}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">{item.ticketNumber}</td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{item.issueDate}</td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {item.zone} {item.street ? `• ${item.street}` : ''}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                              {item.amountRsd} RSD (€{item.amountEur})
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                                Ödenmedi
                              </span>
                            </td>
                          </>
                        )}

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Bu satırı aktarma listesinden çıkar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overwrite option & Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Mevcut Kayıtları Güncelle
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    İşaretlenmezse, sistemde zaten var olan plakalar/müşteriler atlanır.
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setStep('UPLOAD')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  ← Başka Dosya Seç
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Onayla ve {parsedItems.length} Kaydı &ldquo;{MODULE_NAV_INFO[selectedModule].label}&rdquo; Modülüne Aktar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 'SUCCESS' && importSummary && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Aktarım Başarıyla Tamamlandı!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Verileriniz &ldquo;{MODULE_NAV_INFO[importSummary.targetModule].label}&rdquo; modülüne başarıyla eklendi.
              </p>
            </div>

            {/* Results Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium block">Eklenen Kayıt</span>
                <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1 block">
                  {importSummary.createdCount}
                </span>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block">Güncellenen Kayıt</span>
                <span className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1 block">
                  {importSummary.updatedCount}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Atlanan / Mevcut</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.skippedCount}
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={MODULE_NAV_INFO[importSummary.targetModule].route}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                <span>{MODULE_NAV_INFO[importSummary.targetModule].label} Ekranına Git</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yeni Bir Dosya Aktar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

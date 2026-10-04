'use client';

import React, { useState, useRef } from 'react';
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
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { ParsedVehicleRow } from '@/lib/excel-ai';

interface AiExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiExcelImportModal({ isOpen, onClose, onSuccess }: AiExcelImportModalProps) {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<'UPLOAD' | 'ANALYZING' | 'PREVIEW' | 'IMPORTING'>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [parsedVehicles, setParsedVehicles] = useState<ParsedVehicleRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('UPLOAD');
    setFile(null);
    setAnalysisResult(null);
    setParsedVehicles([]);
    setUpdateExisting(false);
  };

  const handleFileChange = (selectedFile: File) => {
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

  const handleAnalyze = async () => {
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
      setParsedVehicles(data.vehicles || []);
      setStep('PREVIEW');
      toast.success(
        language === 'sr'
          ? `Uspešno analizirano: pronađeno ${data.vehicles?.length || 0} vozila.`
          : language === 'en'
          ? `Analysis complete: ${data.vehicles?.length || 0} vehicles detected.`
          : `Yapay zeka analizi tamamlandı: ${data.vehicles?.length || 0} araç tespit edildi.`
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Analiz sırasında hata oluştu.');
      setStep('UPLOAD');
    }
  };

  const handleRemoveVehicle = (index: number) => {
    setParsedVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (parsedVehicles.length === 0) {
      toast.warning('Aktarılacak araç bulunamadı.');
      return;
    }

    setStep('IMPORTING');
    try {
      const res = await fetch('/api/vehicles/import-excel/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicles: parsedVehicles,
          updateExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İçe aktarma başarısız oldu.');
      }

      toast.success(data.message || 'Araçlar başarıyla filoya eklendi!');
      onSuccess();
      onClose();
      resetState();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Araçlar kaydedilirken hata oluştu.');
      setStep('PREVIEW');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetState();
      }}
      title={
        language === 'sr'
          ? 'AI Pametni Uvoz Vozila iz Excela'
          : language === 'en'
          ? 'AI Smart Vehicle Import from Excel'
          : '🤖 Yapay Zeka ile Excel’den Akıllı Araç Aktarımı'
      }
      subtitle={
        language === 'sr'
          ? 'Automatski prepoznaje kolone i povezuje klijente pomoću Google Gemini AI'
          : language === 'en'
          ? 'Automatically maps columns and connects clients using Google Gemini AI'
          : 'Google Gemini AI sütunlarınızı otomatik tanır, plakaları ve kiracıları çözer'
      }
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* STEP 1: UPLOAD */}
        {step === 'UPLOAD' && (
          <div className="space-y-4">
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
                if (droppedFile) handleFileChange(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                  {file ? <FileSpreadsheet className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
                </div>

                {file ? (
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024).toFixed(1)} KB) - Değiştirmek için tıklayın
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      Excel Dosyanızı Buraya Sürükleyin veya Seçin
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                      Desteklenen formatlar: .xlsx, .xls, .csv (Sütun adlarının ne olduğu fark etmez)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Advantage Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Format veya Şablon Zorunluluğu Yoktur!
                </span>
                <p>
                  Kendi tuttuğunuz Excel dosyasını olduğu gibi yükleyebilirsiniz. Google Gemini AI; Sırpça, Türkçe veya
                  İngilizce sütun başlıklarını (örn: <i>Tablica, Vozac, Registracija, Cena, Model</i>) otomatik olarak
                  çözümler ve filoya aktarılmaya hazır hale getirir.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka ile Analiz Et</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ANALYZING ANIMATION */}
        {step === 'ANALYZING' && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Sparkles className="w-7 h-7 text-amber-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Yapay Zeka Tablonuzu Çözümlüyor...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Google Gemini sütun anlamlarını, araç modellerini, aktif kiracıları ve fiyatları ayrıştırıyor.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFIRM */}
        {step === 'PREVIEW' && analysisResult && (
          <div className="space-y-4">
            {/* Badges / Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Toplam Satır</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{analysisResult.totalRows}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[11px] text-amber-700 dark:text-amber-300 block font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" /> Tespit Edilen Araç
                </span>
                <span className="text-base font-black text-amber-900 dark:text-amber-200">{parsedVehicles.length}</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Aktif Kiracı
                </span>
                <span className="text-base font-black text-indigo-900 dark:text-indigo-200">
                  {parsedVehicles.filter((v) => v.status === 'RENTED').length}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Analiz Metodu
                </span>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  {analysisResult.method === 'GEMINI_AI' ? 'Gemini 2.5 Flash' : 'Kural Motoru'}
                </span>
              </div>
            </div>

            {/* Detected Column Mappings Pills */}
            {analysisResult.columnMapping && Object.keys(analysisResult.columnMapping).length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Yapay Zekanın Eşleştirdiği Sütunlar:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(analysisResult.columnMapping).map(([source, target]) => (
                    <span
                      key={source}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300"
                    >
                      <b className="text-slate-900 dark:text-white">{source}</b>
                      <ArrowRight className="w-2.5 h-2.5 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-400 font-bold">{String(target)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Table of Parsed Vehicles */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Plaka</th>
                    <th className="py-2.5 px-3">Marka / Model</th>
                    <th className="py-2.5 px-3">Yıl / KM</th>
                    <th className="py-2.5 px-3">Durum</th>
                    <th className="py-2.5 px-3">Kiracı Müşteri</th>
                    <th className="py-2.5 px-3">Kira (€)</th>
                    <th className="py-2.5 px-2 text-right">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {parsedVehicles.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white uppercase">
                        {v.plate}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {v.brand} {v.model}
                        </div>
                        {v.color && <div className="text-[10px] text-slate-400">{v.color}</div>}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {v.modelYear} • {v.currentKm ? `${v.currentKm.toLocaleString()} km` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        {v.status === 'RENTED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Kirada
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Boşta
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {v.customerName ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{v.customerName}</span>
                            {v.customerPhone && (
                              <span className="text-[10px] text-slate-500 font-mono">{v.customerPhone}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                        €{v.monthlyPrice || 350}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Bu satırı aktarma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overwrite option */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Mevcut Plakaları Güncelle
                </span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (İşaretlenmezse, filoda zaten var olan plakalar atlanır)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                ← Farklı Dosya Seç
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Onayla ve {parsedVehicles.length} Aracı Filoya Ekle</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING */}
        {step === 'IMPORTING' && (
          <div className="py-12 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Araçlar Sisteme Kaydediliyor...</h4>
              <p className="text-xs text-slate-500 mt-1">
                Araçlar, müşteriler ve aktif kiralama sözleşmeleri veritabanına işleniyor. Lütfen bekleyiniz.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

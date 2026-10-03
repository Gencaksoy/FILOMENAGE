'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  Plus,
  Search,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatCurrency, formatRsd, EUR_TO_RSD_RATE } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

function InspectionContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [currency, setCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formVehicleId, setFormVehicleId] = useState('');
  const [formInspectionDate, setFormInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [formCost, setFormCost] = useState('65');
  const [formStation, setFormStation] = useState('Belgrade Auto Pregled Centar');
  const [formNotes, setFormNotes] = useState('Yıllık periyodik muayene (Tehnički Pregled) ve Registracija yapıldı.');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) window.location.href = '/login';
        return null;
      })
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
      })
      .catch(() => {});

    loadData();
    const s = searchParams.get('search');
    if (s) setSearch(s);
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, vRes] = await Promise.all([
        fetch('/api/inspection'),
        fetch('/api/vehicles'),
      ]);

      if (iRes.ok) setInspections(await iRes.json());
      if (vRes.ok) setVehicles(await vRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId) {
      setFormError('Lütfen araç seçiniz.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formVehicleId,
          inspectionDate: formInspectionDate,
          currency,
          cost: formCost,
          station: formStation,
          notes: formNotes,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Muayene kaydedilemedi.');

      setIsNewModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const now = new Date();
  const inspectionsWithDays = inspections.map((i) => {
    const nextDate = new Date(i.nextInspectionDate);
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...i, diffDays };
  });

  const filteredInspections = inspectionsWithDays.filter((i) => {
    const matchesSearch =
      !search ||
      i.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      i.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      i.station.toLowerCase().includes(search.toLowerCase());

    const matchesOwner = ownerFilter === 'ALL' || i.vehicle.owner === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  return (
    <AppLayout currentUser={currentUser} requiredFeature="inspection">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {t.insp_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.insp_subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            if (vehicles.length > 0 && !formVehicleId) setFormVehicleId(vehicles[0].id);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t.insp_btn_new}
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5 text-purple-700 dark:text-purple-300" />
          </div>
          <div>
            <div className="font-bold text-xs text-purple-950 dark:text-purple-200">
              {language === 'sr' ? 'Obavezni Godišnji Ciklus Registracije (1 Godina)' : language === 'en' ? 'Mandatory Annual Registration Cycle (1 Year)' : 'Yıllık 1 Yıl Zorunlu Registracija Döngüsü'}
            </div>
            <div className="text-xs text-purple-800 dark:text-purple-300">
              {language === 'sr'
                ? 'Kada se unese datum pregleda, sledeći tehnički pregled i istek registracije se automatski postavljaju tačno 1 godinu kasnije. Upozorenje se aktivira za vozila ispod 30 dana.'
                : language === 'en'
                ? 'When an inspection date is entered, the next inspection and registration expiry are automatically set to exactly 1 year later. Warnings trigger below 30 days.'
                : 'Muayene tarihi girildiğinde bir sonraki muayene ve tescil bitişi tam 1 yıl sonrasına otomatik ayarlanır. 30 gün altına inen araçlar için uyarı verilir.'}
            </div>
          </div>
        </div>
        <span className="px-3 py-1 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 rounded-xl font-bold text-xs border border-purple-200 dark:border-purple-800 shadow-2xs shrink-0 self-start sm:self-auto">
          {language === 'sr' ? `${inspections.length} Registrovanih Pregleda` : language === 'en' ? `${inspections.length} Recorded Inspections` : `${inspections.length} Kayıtlı Muayene`}
        </span>
      </div>

      {/* Search & Partner Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'sr'
                ? 'Pretraži tablicu (npr: BG 123-AA), vozilo ili stanicu tehničkog pregleda...'
                : language === 'en'
                ? 'Search plate (e.g. BG 123-AA), vehicle, or inspection station...'
                : 'Plaka (Örn: BG 123-AA), araç veya muayene istasyonu ara...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        {currentUser?.isPartnership && (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{t.common_all_owners}</option>
              {(currentUser?.partners || []).map((p) => (
                <option key={p} value={p}>
                  {language === 'sr' ? `Vozila partnera: ${p}` : language === 'en' ? `${p}'s Vehicles` : `${p}'nın Araçları`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.common_loading}</p>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {language === 'sr' ? 'Nisu pronađeni pregledi' : language === 'en' ? 'No inspection records found' : 'Muayene Kaydı Bulunamadı'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'sr' ? 'Nema zapisa koji odgovaraju pretrazi.' : language === 'en' ? 'No records match your search criteria.' : 'Arama kriterlerine uygun muayene bulunamadı.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">{language === 'sr' ? 'Vozilo i Tablica' : language === 'en' ? 'Vehicle & Plate' : 'Araç & Plaka'}</th>
                  <th className="py-3 px-4">{currentUser?.isPartnership ? (language === 'sr' ? 'Partner' : language === 'en' ? 'Partner' : 'Ortak') : (language === 'sr' ? 'Vlasnik' : language === 'en' ? 'Owner' : 'Sahip / Şirket')}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Stanica (Beograd)' : language === 'en' ? 'Station (Belgrade)' : 'İstasyon (Belgrad)'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Datum Pregleda' : language === 'en' ? 'Last Inspection Date' : 'Son Muayene Tarihi'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Sledeći Pregled (1 Godina)' : language === 'en' ? 'Next Inspection (1 Year)' : 'Gelecek Muayene (1 Yıl)'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Preostalo Vreme i Status' : language === 'en' ? 'Remaining & Status' : 'Kalan Süre & Durum'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Cena Pregleda' : language === 'en' ? 'Inspection Fee' : 'Muayene Ücreti'}</th>
                  <th className="py-3 px-4 text-right">{language === 'sr' ? 'Datum Unosa' : language === 'en' ? 'Logged Date' : 'Sisteme Giriş Zamanı'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInspections.map((i) => (
                  <tr key={i.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/vehicles/${i.vehicle.id}`}
                        className="font-mono font-bold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 block text-xs"
                      >
                        {i.vehicle.plate}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {i.vehicle.brand} {i.vehicle.model}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{i.vehicle.owner || (currentUser?.isPartnership ? '-' : (currentUser?.fleetName || 'Filo'))}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {i.station}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {formatDate(i.inspectionDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-900 dark:text-purple-300 font-mono">
                      {formatDate(i.nextInspectionDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                          i.diffDays < 0
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : i.diffDays <= 30
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {i.diffDays < 0
                          ? (language === 'sr' ? `ISTEKAO (${Math.abs(i.diffDays)} d)` : language === 'en' ? `EXPIRED (${Math.abs(i.diffDays)} d)` : `SÜRESİ GEÇTİ (${Math.abs(i.diffDays)} g)`)
                          : (language === 'sr' ? `Još ${i.diffDays} dana` : language === 'en' ? `${i.diffDays} days left` : `${i.diffDays} gün kaldı`)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100 text-xs font-mono">
                      {formatCurrency(i.cost, 'EUR')}
                      {i.currency === 'RSD' && i.originalCost && (
                        <div className="text-xs text-slate-400 font-normal">
                          {formatRsd(i.originalCost)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(i.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Inspection Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title={language === 'sr' ? 'Novi Tehnički Pregled i Registracija' : language === 'en' ? 'Log Annual Vehicle Inspection' : 'Yeni Araç Muayenesi & Registracija Kaydet'}
        subtitle={language === 'sr' ? 'Datum sledećeg pregleda i registracija vozila biće automatski produženi za 1 godinu' : language === 'en' ? 'The next inspection date and registration will automatically be renewed for 1 year' : '1 Yıllık sonraki muayene tarihi ve araç tescili otomatik yenilenecektir'}
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800">
              {language === 'sr' ? 'Valuta Troška Pregleda' : language === 'en' ? 'Inspection Cost Currency' : 'Muayene Masraf Para Birimi'}
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currency === 'EUR' ? 'bg-purple-600 text-white' : 'text-slate-600'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currency === 'RSD' ? 'bg-purple-600 text-white' : 'text-slate-600'
                }`}
              >
                RSD (Dinar)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Izaberite Vozilo *' : language === 'en' ? 'Select Vehicle *' : 'Araç Seçiniz *'}
            </label>
            <select
              required
              value={formVehicleId}
              onChange={(e) => setFormVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-bold"
            >
              <option value="">
                {language === 'sr' ? '-- Izaberite Vozilo --' : language === 'en' ? '-- Select Vehicle --' : '-- Araç Seçin --'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} – {v.brand} {v.model} ({v.owner})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Datum Pregleda *' : language === 'en' ? 'Inspection Date *' : 'Muayene Tarihi *'}
              </label>
              <input
                type="date"
                required
                value={formInspectionDate}
                onChange={(e) => setFormInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? `Cena Pregleda (${currency}) *` : language === 'en' ? `Inspection Fee (${currency}) *` : `Muayene Ücreti (${currency}) *`}
              </label>
              <input
                type="number"
                required
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Stanica Tehničkog Pregleda (Beograd) *' : language === 'en' ? 'Inspection Station (Belgrade) *' : 'Muayene İstasyonu (Belgrad) *'}
            </label>
            <input
              type="text"
              required
              value={formStation}
              onChange={(e) => setFormStation(e.target.value)}
              placeholder="Örn: Belgrade Tehnički Pregled Boban"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Beleške / Detalji Registracije' : language === 'en' ? 'Notes / Registration Details' : 'Notlar / Tescil Bilgisi'}
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {formLoading
                ? (language === 'sr' ? 'Čuvanje...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...')
                : (language === 'sr' ? 'Sačuvaj Pregled (+1 Godina)' : language === 'en' ? 'Save Inspection (+1 Year)' : 'Muayeneyi Kaydet (+1 Yıl)')}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default function InspectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InspectionContent />
    </Suspense>
  );
}

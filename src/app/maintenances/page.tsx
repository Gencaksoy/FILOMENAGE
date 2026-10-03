'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wrench,
  Plus,
  Search,
  Droplet,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Trash2,
  UserCheck,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatCurrency, formatKm, EUR_TO_RSD_RATE, formatRsd } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

interface PartItem {
  partName: string;
  partCode: string;
  changeDate: string;
  cost: number | string;
}

function MaintenancesContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenances' | 'oil'>('maintenances');
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [oilChanges, setOilChanges] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [serviceShops, setServiceShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // Modal: New Maintenance (Bakım & Parçalar)
  const [isNewMaintOpen, setIsNewMaintOpen] = useState(false);
  const [maintCurrency, setMaintCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [maintVehicleId, setMaintVehicleId] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().slice(0, 10));
  const [maintLaborCost, setMaintLaborCost] = useState<number | string>('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintService, setMaintService] = useState('Belgrade Auto Centar');
  const [customMaintService, setCustomMaintService] = useState('');
  const [maintParts, setMaintParts] = useState<PartItem[]>([
    { partName: '', partCode: '', changeDate: new Date().toISOString().slice(0, 10), cost: '' },
  ]);
  const [maintPaidBy, setMaintPaidBy] = useState('Şirket Kasası');
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintError, setMaintError] = useState<string | null>(null);

  // Modal: New Oil Change (Motor Yağı Değişimi)
  const [isNewOilOpen, setIsNewOilOpen] = useState(false);
  const [oilCurrency, setOilCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [oilVehicleId, setOilVehicleId] = useState('');
  const [oilDate, setOilDate] = useState(new Date().toISOString().slice(0, 10));
  const [oilKm, setOilKm] = useState<number | string>('');
  const [oilType, setOilType] = useState('5W-30 Tam Sentetik');
  const [oilService, setOilService] = useState('Belgrade Auto Centar');
  const [oilFilter, setOilFilter] = useState(true);
  const [oilCost, setOilCost] = useState<number | string>(75);
  const [oilNotes, setOilNotes] = useState('');
  const [oilPaidBy, setOilPaidBy] = useState('Şirket Kasası');
  const [oilLoading, setOilLoading] = useState(false);
  const [oilError, setOilError] = useState<string | null>(null);

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

    if (searchParams.get('action') === 'new') {
      const vId = searchParams.get('vehicleId');
      if (vId) {
        setMaintVehicleId(vId);
        setOilVehicleId(vId);
      }
      setIsNewMaintOpen(true);
    }

    const s = searchParams.get('search');
    if (s) {
      setSearch(s);
    }
    const tab = searchParams.get('tab');
    if (tab === 'oil' || tab === 'maintenances') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, oRes, vRes, sRes] = await Promise.all([
        fetch('/api/maintenances'),
        fetch('/api/oil-changes'),
        fetch('/api/vehicles'),
        fetch('/api/service-shops'),
      ]);

      if (mRes.ok) setMaintenances(await mRes.json());
      if (oRes.ok) setOilChanges(await oRes.json());
      if (vRes.ok) setVehicles(await vRes.json());
      if (sRes.ok) setServiceShops(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit Maintenance
  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintVehicleId || !maintDesc) {
      setMaintError('Lütfen araç ve işlem açıklaması giriniz.');
      return;
    }

    setMaintLoading(true);
    setMaintError(null);

    try {
      const resolvedService = maintService === 'OTHER' ? customMaintService : maintService;

      const validParts = maintParts
        .filter((p) => p.partName.trim() !== '')
        .map((p) => ({
          partName: p.partName.trim(),
          partCode: p.partCode.trim(),
          changeDate: p.changeDate || maintDate,
          cost: parseFloat(p.cost.toString()) || 0,
        }));

      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: maintVehicleId,
          maintenanceDate: maintDate,
          currency: maintCurrency,
          laborCost: parseFloat(maintLaborCost.toString()) || 0,
          description: maintDesc,
          serviceName: resolvedService,
          parts: validParts,
          paidBy: maintPaidBy,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Bakım kaydı oluşturulamadı.');

      setIsNewMaintOpen(false);
      setMaintDesc('');
      setMaintLaborCost('');
      setMaintParts([{ partName: '', partCode: '', changeDate: new Date().toISOString().slice(0, 10), cost: '' }]);
      await loadData();
    } catch (err: any) {
      setMaintError(err.message);
    } finally {
      setMaintLoading(false);
    }
  };

  // Submit Oil Change
  const handleOilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oilVehicleId) {
      setOilError('Lütfen araç seçiniz.');
      return;
    }

    setOilLoading(true);
    setOilError(null);

    try {
      const res = await fetch('/api/oil-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: oilVehicleId,
          changeDate: oilDate,
          currency: oilCurrency,
          km: parseInt(oilKm.toString(), 10) || 0,
          oilType,
          serviceName: oilService,
          filterChanged: oilFilter,
          cost: parseFloat(oilCost.toString()) || 0,
          notes: oilNotes,
          paidBy: oilPaidBy,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Motor yağı kaydı oluşturulamadı.');

      setIsNewOilOpen(false);
      setOilNotes('');
      await loadData();
    } catch (err: any) {
      setOilError(err.message);
    } finally {
      setOilLoading(false);
    }
  };

  // Parts list operations in modal
  const addPartRow = () => {
    setMaintParts([
      ...maintParts,
      { partName: '', partCode: '', changeDate: maintDate, cost: '' },
    ]);
  };

  const removePartRow = (idx: number) => {
    setMaintParts(maintParts.filter((_, i) => i !== idx));
  };

  const updatePartRow = (idx: number, field: keyof PartItem, val: any) => {
    const updated = [...maintParts];
    updated[idx] = { ...updated[idx], [field]: val };
    setMaintParts(updated);
  };

  const totalPartsInForm = maintParts.reduce((acc, p) => acc + (parseFloat(p.cost.toString()) || 0), 0);
  const totalMaintCostInForm = (parseFloat(maintLaborCost.toString()) || 0) + totalPartsInForm;

  // Filtered lists
  const filteredMaintenances = maintenances.filter((m) => {
    const matchesSearch =
      !search ||
      m.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      m.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      (m.serviceName && m.serviceName.toLowerCase().includes(search.toLowerCase()));

    const matchesOwner = ownerFilter === 'ALL' || m.vehicle.owner === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  const filteredOilChanges = oilChanges.filter((o) => {
    const matchesSearch =
      !search ||
      o.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      o.oilType.toLowerCase().includes(search.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesOwner = ownerFilter === 'ALL' || o.vehicle.owner === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  // Calculate totals
  const totalMaintCost = maintenances.reduce((acc, m) => acc + m.totalCost, 0);
  const totalOilCost = oilChanges.reduce((acc, o) => acc + o.cost, 0);
  const grandTotalCost = totalMaintCost + totalOilCost;

  return (
    <AppLayout currentUser={currentUser} requiredFeature={['maintenance', 'oilChange']}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t.maint_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.maint_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMaintError(null);
              setIsNewMaintOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            {t.maint_btn_new_service}
          </button>
          <button
            onClick={() => {
              setOilError(null);
              setIsNewOilOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Droplet className="w-4 h-4" />
            {t.maint_btn_new_oil}
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            {language === 'sr' ? 'Ukupni Troškovi (€)' : language === 'en' ? 'Total Expenses (€)' : 'Toplam Harcama (€)'}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(grandTotalCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ~{formatRsd(grandTotalCost * EUR_TO_RSD_RATE)} (117 RSD/€)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">
            {language === 'sr' ? 'Redovno Održavanje i Delovi' : language === 'en' ? 'Periodic Maintenance & Parts' : 'Periyodik Bakım ve Parça'}
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totalMaintCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'sr' ? 'Zbir rada i rezervnih delova' : language === 'en' ? 'Total labor and spare parts' : 'İşçilik ve yedek parça toplamı'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">
            {language === 'sr' ? 'Trošak Motornog Ulja' : language === 'en' ? 'Engine Oil Expenses' : 'Motor Yağı Masrafı'}
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalOilCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'sr' ? 'Ukupno ulje i filteri' : language === 'en' ? 'Total oil & filter cost' : 'Filtre ve yağ toplamı'}
          </div>
        </div>
      </div>

      {/* Search & Partner Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'sr'
                ? 'Pretraži tablicu (npr: BG 123-AA), vozilo, radove ili servis...'
                : language === 'en'
                ? 'Search plate (e.g. BG 123-AA), vehicle, description or shop...'
                : 'Plaka (Örn: BG 123-AA), araç, işlem veya servis ile ara...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
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

      {/* TABS: Bakımlar vs Yağ Değişimleri */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('maintenances')}
            className={`px-6 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'maintenances'
                ? 'border-blue-600 text-blue-800 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            {t.maint_tab_services} ({filteredMaintenances.length})
          </button>

          <button
            onClick={() => setActiveTab('oil')}
            className={`px-6 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'oil'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Droplet className="w-4 h-4" />
            {t.maint_tab_oil} ({filteredOilChanges.length})
          </button>
        </div>

        {/* Tab 1: Periyodik Bakımlar */}
        {activeTab === 'maintenances' && (
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.common_loading}</p>
              </div>
            ) : filteredMaintenances.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sr' ? 'Nisu pronađeni zapisi o održavanju' : language === 'en' ? 'No maintenance records found' : 'Bakım Kaydı Bulunamadı'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'sr' ? 'Nema zapisa koji odgovaraju pretrazi.' : language === 'en' ? 'No records match your search criteria.' : 'Arama kriterlerine uygun bakım kaydı yok.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaintenances.map((m) => (
                  <div key={m.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/vehicles/${m.vehicle.id}`}
                          className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          {m.vehicle.plate}
                        </Link>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{m.vehicle.brand} {m.vehicle.model}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                              {language === 'sr' ? 'Vozilo: ' : language === 'en' ? 'Car: ' : 'Araç: '} {m.vehicle.owner}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold border ${
                                m.paidBy && m.vehicle.owner && m.paidBy !== m.vehicle.owner
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {language === 'sr' ? 'Platio: ' : language === 'en' ? 'Paid: ' : 'Ödeyen: '} <b>{m.paidBy || m.vehicle.owner || (language === 'sr' ? 'Kasa Preduzeća' : language === 'en' ? 'Company Treasury' : 'Şirket Kasası')}</b>
                              {m.paidBy && m.vehicle.owner && m.paidBy !== m.vehicle.owner && (
                                <span className="ml-1 text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
                                  {language === 'sr' ? '(Trošak partnera)' : language === 'en' ? '(Partner Expense)' : '(Ortak Masrafı)'}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {language === 'sr' ? 'Datum servisa: ' : language === 'en' ? 'Date: ' : 'Bakım Tarihi: '} <b className="text-slate-700 dark:text-slate-300 font-mono">{formatDate(m.maintenanceDate)}</b> • {language === 'sr' ? 'Servis: ' : language === 'en' ? 'Shop: ' : 'Servis: '} <b className="text-slate-700 dark:text-slate-300">{m.serviceName || (language === 'sr' ? 'Beograd Servis' : 'Belgrade Servis')}</b>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'sr' ? 'Rad: ' : language === 'en' ? 'Labor: ' : 'İşçilik: '} <b>{formatCurrency(m.laborCost, 'EUR')}</b> | {language === 'sr' ? 'Delovi: ' : language === 'en' ? 'Parts: ' : 'Parça: '} <b>{formatCurrency(m.partsCost, 'EUR')}</b>
                        </div>
                        <div className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">
                          {language === 'sr' ? 'Ukupno: ' : language === 'en' ? 'Total: ' : 'Toplam: '} {formatCurrency(m.totalCost, 'EUR')}
                          {m.currency === 'RSD' && m.originalCost && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">
                              ({formatRsd(m.originalCost)})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold font-mono">
                          {language === 'sr' ? 'Sledeći servis: ' : language === 'en' ? 'Next Service: ' : 'Gelecek Bakım: '} {formatDate(m.nextMaintenanceDate)} (+1 {language === 'sr' ? 'Mesec' : language === 'en' ? 'Month' : 'Ay'})
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 font-medium">{m.description}</p>

                    {/* Nested Parts */}
                    {m.parts && m.parts.length > 0 && (
                      <div className="mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                          {language === 'sr' ? `Zamenjeni Delovi (${m.parts.length} stavki)` : language === 'en' ? `Replaced Parts (${m.parts.length} items)` : `Değiştirilen Parçalar (${m.parts.length} Kalem)`}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {m.parts.map((p: any) => (
                            <div key={p.id} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{p.partName}</span>
                                {p.partCode && (
                                  <span className="text-xs font-mono text-slate-400 ml-1">({p.partCode})</span>
                                )}
                                <div className="text-xs text-slate-400 font-mono">{formatDate(p.changeDate)}</div>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.cost, 'EUR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2 text-right">
                      {language === 'sr' ? 'Unos u sistem: ' : language === 'en' ? 'Logged: ' : 'Sisteme Kayıt: '} {formatDateTime(m.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Motor Yağı Değişimleri */}
        {activeTab === 'oil' && (
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.common_loading}</p>
              </div>
            ) : filteredOilChanges.length === 0 ? (
              <div className="p-12 text-center">
                <Droplet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'sr' ? 'Nisu pronađene zamene ulja' : language === 'en' ? 'No oil change records found' : 'Motor Yağı Kaydı Bulunamadı'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'sr' ? 'Nema zapisa koji odgovaraju pretrazi.' : language === 'en' ? 'No records match your search criteria.' : 'Arama kriterlerine uygun yağ değişimi yok.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{language === 'sr' ? 'Tablica i Vozilo' : language === 'en' ? 'Plate & Vehicle' : 'Plaka & Araç'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Datum Zamene' : language === 'en' ? 'Date Changed' : 'Değişim Tarihi'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Kilometraža' : language === 'en' ? 'Mileage' : 'Kilometre'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Tip Ulja' : language === 'en' ? 'Oil Type' : 'Yağ Türü'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Filter' : language === 'en' ? 'Filter' : 'Filtre'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Servis' : language === 'en' ? 'Service Shop' : 'Servis'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Platio' : language === 'en' ? 'Payer' : 'Ödeyen'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Trošak' : language === 'en' ? 'Cost' : 'Maliyet'}</th>
                      <th className="py-3 px-4">{language === 'sr' ? 'Beleške' : language === 'en' ? 'Notes' : 'Notlar'}</th>
                      <th className="py-3 px-4 text-right">{language === 'sr' ? 'Datum Unosa' : language === 'en' ? 'Entry Date' : 'Sisteme Giriş'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOilChanges.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/vehicles/${o.vehicle.id}`}
                            className="font-mono font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-700 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            {o.vehicle.plate}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {o.vehicle.brand} {o.vehicle.model} ({o.vehicle.owner})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatDate(o.changeDate)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatKm(o.km)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {o.oilType}
                        </td>
                        <td className="py-3.5 px-4">
                          {o.filterChanged ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                              <Check className="w-3.5 h-3.5" />
                              {language === 'sr' ? 'Zamenjen' : language === 'en' ? 'Replaced' : 'Değişti'}
                            </span>
                          ) : (
                            <span className="text-slate-400">{language === 'sr' ? 'Nije zamenjen' : language === 'en' ? 'Not replaced' : 'Değişmedi'}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {o.serviceName || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold border ${
                              o.paidBy && o.vehicle.owner && o.paidBy !== o.vehicle.owner
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {o.paidBy || o.vehicle.owner || (language === 'sr' ? 'Kasa Preduzeća' : language === 'en' ? 'Company Treasury' : 'Şirket Kasası')}
                            {o.paidBy && o.vehicle.owner && o.paidBy !== o.vehicle.owner && (
                              <span className="ml-1 text-[11px] text-amber-800 dark:text-amber-400">🤝</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(o.cost, 'EUR')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                          {o.notes || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(o.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Yeni Bakım & Parça Gir */}
      <Modal
        isOpen={isNewMaintOpen}
        onClose={() => setIsNewMaintOpen(false)}
        title={language === 'sr' ? 'Evidencija Redovnog Održavanja' : language === 'en' ? 'New Periodic Maintenance' : 'Yeni Periyodik Bakım Kaydı'}
        subtitle={language === 'sr' ? 'Unesite rad i zamenjene delove sa troškovima' : language === 'en' ? 'Log labor and replacement parts costs separately' : 'İşçilik ve değişen parçaları maliyetiyle ayrı ayrı kaydedin'}
        maxWidth="2xl"
      >
        {maintError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{maintError}</span>
          </div>
        )}

        <form onSubmit={handleMaintSubmit} className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {language === 'sr' ? 'Valuta Troška' : language === 'en' ? 'Expense Currency' : 'Masraf Para Birimi'}
              </span>
              <span className="text-xs text-slate-500">
                {language === 'sr' ? 'Fiksni Kurs: 1 € = 117 RSD' : language === 'en' ? 'Fixed Rate: 1 € = 117 RSD' : 'Sabit Kur: 1 € = 117 RSD'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMaintCurrency('EUR')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  maintCurrency === 'EUR' ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setMaintCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  maintCurrency === 'RSD' ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                RSD (Dinar)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Izaberite Vozilo *' : language === 'en' ? 'Select Vehicle *' : 'Araç Seçiniz *'}
              </label>
              <select
                required
                value={maintVehicleId}
                onChange={(e) => setMaintVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Datum Servisa *' : language === 'en' ? 'Service Date *' : 'Bakım Tarihi *'}
              </label>
              <input
                type="date"
                required
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? `Trošak Rada (${maintCurrency})` : language === 'en' ? `Labor Cost (${maintCurrency})` : `İşçilik Masrafı (${maintCurrency})`}
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={maintLaborCost}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setMaintLaborCost(e.target.value)}
                placeholder="Örn: 80"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Opis Izvedenih Radova *' : language === 'en' ? 'Service Description *' : 'Yapılan İşlem Açıklaması *'}
              </label>
              <input
                type="text"
                required
                value={maintDesc}
                onChange={(e) => setMaintDesc(e.target.value)}
                placeholder={
                  language === 'sr'
                    ? 'Npr: Zamena prednjih kočionih pločica i diskova, provera kočionog ulja'
                    : language === 'en'
                    ? 'E.g.: Front brake pads and discs replacement, fluid check'
                    : 'Örn: Ön disk ve balata değişimi, fren hidroliği kontrolü'
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Registrovan Auto Servis' : language === 'en' ? 'Registered Service Shop' : 'Kayıtlı Servis İstasyonu'}
              </label>
              <select
                value={maintService}
                onChange={(e) => setMaintService(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500"
              >
                {serviceShops.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="OTHER">{language === 'sr' ? '+ Novi / Drugi Servis' : language === 'en' ? '+ New / Other Shop' : '+ Yeni / Başka Servis Yaz'}</option>
              </select>
            </div>
          </div>

          {maintService === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Naziv Novog Servisa *' : language === 'en' ? 'New Shop Name *' : 'Yeni Servis Adı *'}
              </label>
              <input
                type="text"
                required
                value={customMaintService}
                onChange={(e) => setCustomMaintService(e.target.value)}
                placeholder="Örn: Lav Auto Belgrad"
                className="w-full px-3 py-2 text-xs border border-blue-300 rounded-xl"
              />
            </div>
          )}

          {/* Parts Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                {language === 'sr' ? 'Zamenjeni Delovi (Stavke)' : language === 'en' ? 'Replaced Parts (Items)' : 'Değiştirilen Parçalar (Ayrı Kalemler)'}
              </span>
              <button
                type="button"
                onClick={addPartRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'sr' ? 'Dodaj Stavku Dela' : language === 'en' ? 'Add Part Row' : 'Parça Satırı Ekle'}
              </button>
            </div>

            <div className="space-y-2">
              {maintParts.map((p, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center">
                  <div className="sm:col-span-4">
                    <label className="sm:hidden block text-xs font-semibold text-slate-500 mb-0.5">
                      {language === 'sr' ? 'Naziv Dela' : language === 'en' ? 'Part Name' : 'Parça Adı'}
                    </label>
                    <input
                      type="text"
                      value={p.partName}
                      onChange={(e) => updatePartRow(idx, 'partName', e.target.value)}
                      placeholder={language === 'sr' ? 'Naziv Dela (Npr: Prednje Pločice)' : language === 'en' ? 'Part Name (e.g. Brake Pads)' : 'Parça Adı (Örn: Ön Balata)'}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="sm:hidden block text-xs font-semibold text-slate-500 mb-0.5">
                      {language === 'sr' ? 'Kataloški Broj (OEM)' : language === 'en' ? 'Part Code (OEM)' : 'Parça Kodu (OEM)'}
                    </label>
                    <input
                      type="text"
                      value={p.partCode}
                      onChange={(e) => updatePartRow(idx, 'partCode', e.target.value)}
                      placeholder={language === 'sr' ? 'Kataloški Broj (OEM)' : language === 'en' ? 'Part Code (OEM)' : 'Parça Kodu (OEM)'}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:contents gap-2">
                    <div className="sm:col-span-2">
                      <label className="sm:hidden block text-xs font-semibold text-slate-500 mb-0.5">
                        {language === 'sr' ? 'Datum' : language === 'en' ? 'Date' : 'Tarih'}
                      </label>
                      <input
                        type="date"
                        value={p.changeDate}
                        onChange={(e) => updatePartRow(idx, 'changeDate', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden block text-xs font-semibold text-slate-500 mb-0.5">
                        {language === 'sr' ? `Cena (${maintCurrency})` : language === 'en' ? `Price (${maintCurrency})` : `Fiyat (${maintCurrency})`}
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={p.cost}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updatePartRow(idx, 'cost', e.target.value)}
                        placeholder={`Fiyat (${maintCurrency})`}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden font-bold"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end sm:justify-center pt-1 sm:pt-0">
                    {maintParts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartRow(idx)}
                        className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sm:hidden">{language === 'sr' ? 'Obriši' : language === 'en' ? 'Delete' : 'Sil'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-slate-200 font-bold text-slate-700">
              <span>{language === 'sr' ? 'Delovi: ' : language === 'en' ? 'Parts: ' : 'Parçalar: '} {totalPartsInForm} {maintCurrency}</span>
              <span className="text-sm font-black text-slate-900">
                {language === 'sr' ? 'Ukupno: ' : language === 'en' ? 'Total: ' : 'Toplam: '} {totalMaintCostInForm} {maintCurrency}
                {maintCurrency === 'RSD' && (
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    (~{(totalMaintCostInForm / EUR_TO_RSD_RATE).toFixed(1)} €)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Masrafı / Ödemeyi Yapan (Kim Ödedi?) */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 mb-1.5">
              {language === 'sr' ? 'Ko snosi trošak? (Partner / Kasa) *' : language === 'en' ? 'Payer (Partner / Treasury) *' : 'Ödemeyi Yapan (Masrafı Karşılayan Ortak) *'}
            </label>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {(currentUser?.isPartnership && (currentUser?.partners || []).length > 0
                ? [...(currentUser?.partners || []), language === 'sr' ? 'Kasa Preduzeća' : 'Şirket Kasası']
                : [
                    language === 'sr' ? 'Kasa Preduzeća' : 'Şirket Kasası',
                    language === 'sr' ? 'Gotovina' : 'Nakit',
                    language === 'sr' ? 'Kreditna Kartica' : 'Kredi Kartı',
                    language === 'sr' ? 'Bankovni Transfer' : 'Banka Havalesi',
                  ]
              ).map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setMaintPaidBy(person)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    maintPaidBy === person
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={maintPaidBy}
              onChange={(e) => setMaintPaidBy(e.target.value)}
              placeholder={language === 'sr' ? 'Ili unesite drugo ime' : language === 'en' ? 'Or enter another name' : 'Veya başka bir isim girin'}
              className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl bg-white text-slate-800"
            />
            <span className="text-[11px] text-amber-800 mt-1 block">
              {language === 'sr'
                ? '💡 Izborom ko je snosio trošak omogućava se automatski obračun dugovanja i potraživanja među partnerima.'
                : language === 'en'
                ? '💡 Tracking who paid ensures transparent financial accounting between fleet partners.'
                : '💡 Harcamayı kimin yaptığını seçerek ortaklar arası alacak/verecek takibini sağlayabilirsiniz.'}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewMaintOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={maintLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {maintLoading
                ? (language === 'sr' ? 'Čuvanje...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...')
                : (language === 'sr' ? 'Sačuvaj Održavanje (+1 Mesec)' : language === 'en' ? 'Save Service (+1 Month)' : 'Bakımı Kaydet (+1 Ay Ata)')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Yeni Motor Yağı Değişimi Gir */}
      <Modal
        isOpen={isNewOilOpen}
        onClose={() => setIsNewOilOpen(false)}
        title={language === 'sr' ? 'Zabeleži Zamenu Motornog Ulja' : language === 'en' ? 'Log Engine Oil Change' : 'Motor Yağı Değişimi Kaydet'}
        subtitle={language === 'sr' ? 'Odvojeno od servisa, samo motorno ulje i filter' : language === 'en' ? 'Separate from periodic service, engine oil & filter' : 'Bakımdan ayrı, sadece motor yağı ve filtre değişimi'}
        maxWidth="md"
      >
        {oilError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{oilError}</span>
          </div>
        )}

        <form onSubmit={handleOilSubmit} className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800">
              {language === 'sr' ? 'Valuta Troška' : language === 'en' ? 'Cost Currency' : 'Maliyet Para Birimi'}
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setOilCurrency('EUR')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  oilCurrency === 'EUR' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setOilCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  oilCurrency === 'RSD' ? 'bg-emerald-600 text-white' : 'text-slate-600'
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
              value={oilVehicleId}
              onChange={(e) => setOilVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden font-medium"
            >
              <option value="">
                {language === 'sr' ? '-- Izaberite Vozilo --' : language === 'en' ? '-- Select Vehicle --' : '-- Araç Seçin --'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} – {v.brand} {v.model} ({v.owner} - {formatKm(v.currentKm)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Datum Zamene *' : language === 'en' ? 'Date Changed *' : 'Değişim Tarihi *'}
              </label>
              <input
                type="date"
                required
                value={oilDate}
                onChange={(e) => setOilDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Kilometraža (KM) *' : language === 'en' ? 'Vehicle KM *' : 'Araç KM *'}
              </label>
              <input
                type="number"
                required
                value={oilKm}
                onChange={(e) => setOilKm(e.target.value)}
                placeholder="Örn: 65000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? 'Tip Ulja' : language === 'en' ? 'Oil Type' : 'Yağ Cinsi'}
              </label>
              <input
                type="text"
                value={oilType}
                onChange={(e) => setOilType(e.target.value)}
                placeholder="5W-30 Tam Sentetik"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'sr' ? `Trošak (${oilCurrency}) *` : language === 'en' ? `Cost (${oilCurrency}) *` : `Maliyet (${oilCurrency}) *`}
              </label>
              <input
                type="number"
                required
                value={oilCost}
                onChange={(e) => setOilCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-950">
                {language === 'sr' ? 'Da li je zamenjen filter ulja?' : language === 'en' ? 'Was oil filter replaced?' : 'Yağ Filtresi Değiştirildi mi?'}
              </div>
              <div className="text-xs text-emerald-700">
                {language === 'sr' ? 'Uključujući set filtera' : language === 'en' ? 'Filter kit included' : 'Filtre seti dahil'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={oilFilter}
              onChange={(e) => setOilFilter(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'sr' ? 'Beleške' : language === 'en' ? 'Notes' : 'Notlar'}
            </label>
            <textarea
              rows={2}
              value={oilNotes}
              onChange={(e) => setOilNotes(e.target.value)}
              placeholder={language === 'sr' ? 'Marka ulja, šifra filtera...' : language === 'en' ? 'Oil brand, filter code...' : 'Yağ markası, filtre kodu...'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Masrafı / Ödemeyi Yapan (Kim Ödedi?) */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 mb-1.5">
              {language === 'sr' ? 'Ko snosi trošak? (Partner / Kasa) *' : language === 'en' ? 'Payer (Partner / Treasury) *' : 'Ödemeyi Yapan (Masrafı Karşılayan Ortak) *'}
            </label>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {(currentUser?.isPartnership && (currentUser?.partners || []).length > 0
                ? [...(currentUser?.partners || []), language === 'sr' ? 'Kasa Preduzeća' : 'Şirket Kasası']
                : [
                    language === 'sr' ? 'Kasa Preduzeća' : 'Şirket Kasası',
                    language === 'sr' ? 'Gotovina' : 'Nakit',
                    language === 'sr' ? 'Kreditna Kartica' : 'Kredi Kartı',
                    language === 'sr' ? 'Bankovni Transfer' : 'Banka Havalesi',
                  ]
              ).map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setOilPaidBy(person)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    oilPaidBy === person
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={oilPaidBy}
              onChange={(e) => setOilPaidBy(e.target.value)}
              placeholder={language === 'sr' ? 'Ili unesite drugo ime' : language === 'en' ? 'Or enter another name' : 'Veya başka bir isim girin'}
              className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl bg-white text-slate-800"
            />
            <span className="text-[11px] text-amber-800 mt-1 block">
              {language === 'sr'
                ? '💡 Izborom ko je snosio trošak omogućava se automatski obračun dugovanja i potraživanja među partnerima.'
                : language === 'en'
                ? '💡 Tracking who paid ensures transparent financial accounting between fleet partners.'
                : '💡 Harcamayı kimin yaptığını seçerek ortaklar arası alacak/verecek takibini sağlayabilirsiniz.'}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewOilOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={oilLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {oilLoading
                ? (language === 'sr' ? 'Čuvanje...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...')
                : (language === 'sr' ? 'Sačuvaj Zamenu Ulja' : language === 'en' ? 'Save Oil Change' : 'Yağ Değişimini Kaydet')}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default function MaintenancesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Yükleniyor...</div>}>
      <MaintenancesContent />
    </Suspense>
  );
}

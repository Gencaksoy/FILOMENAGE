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
import { AuthUser } from '@/lib/auth';

interface PartItem {
  partName: string;
  partCode: string;
  changeDate: string;
  cost: number | string;
}

function MaintenancesContent() {
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
  const [maintLaborCost, setMaintLaborCost] = useState<number | string>(0);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintService, setMaintService] = useState('Belgrade Auto Centar');
  const [customMaintService, setCustomMaintService] = useState('');
  const [maintParts, setMaintParts] = useState<PartItem[]>([
    { partName: '', partCode: '', changeDate: new Date().toISOString().slice(0, 10), cost: 0 },
  ]);
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
  const [oilLoading, setOilLoading] = useState(false);
  const [oilError, setOilError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    loadData();

    if (searchParams.get('action') === 'new') {
      const vId = searchParams.get('vehicleId');
      if (vId) {
        setMaintVehicleId(vId);
        setOilVehicleId(vId);
      }
      setIsNewMaintOpen(true);
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
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Bakım kaydı oluşturulamadı.');

      setIsNewMaintOpen(false);
      setMaintDesc('');
      setMaintLaborCost(0);
      setMaintParts([{ partName: '', partCode: '', changeDate: new Date().toISOString().slice(0, 10), cost: 0 }]);
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
      { partName: '', partCode: '', changeDate: maintDate, cost: 0 },
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
    <AppLayout currentUser={currentUser}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Bakım ve Motor Yağı Takip Merkezi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Periyodik bakımlar (+1 ay planlama), motor yağı, parça & işçilik maliyetleri (Sabit Kur: 1 € = 117 RSD)
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
            Yeni Bakım Ekle
          </button>
          <button
            onClick={() => {
              setOilError(null);
              setIsNewOilOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Droplet className="w-4 h-4" />
            Motor Yağı Gir
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Toplam Harcama (€)</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(grandTotalCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 mt-1">
            ~{formatRsd(grandTotalCost * EUR_TO_RSD_RATE)} (117 RSD/€)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-blue-700 uppercase">Periyodik Bakım ve Parça</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(totalMaintCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 mt-1">İşçilik ve yedek parça toplamı</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-amber-700 uppercase">Motor Yağı Masrafı</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalOilCost, 'EUR')}</div>
          <div className="text-xs text-slate-500 mt-1">Filtre ve yağ toplamı</div>
        </div>
      </div>

      {/* Search & Partner Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka (Örn: BG 123-AA), araç, işlem veya servis ile ara..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
          >
            <option value="ALL">Tüm Ortaklar</option>
            <option value="Atilla">Atilla'nın Araçları</option>
            <option value="Onur">Onur'un Araçları</option>
          </select>
        </div>
      </div>

      {/* TABS: Bakımlar vs Yağ Değişimleri */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('maintenances')}
            className={`px-6 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'maintenances'
                ? 'border-blue-600 text-blue-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Periyodik Bakımlar & Parçalar ({filteredMaintenances.length})
          </button>

          <button
            onClick={() => setActiveTab('oil')}
            className={`px-6 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'oil'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-4 h-4" />
            Motor Yağı Değişimleri ({filteredOilChanges.length})
          </button>
        </div>

        {/* Tab 1: Periyodik Bakımlar */}
        {activeTab === 'maintenances' && (
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Bakım kayıtları yükleniyor...</p>
              </div>
            ) : filteredMaintenances.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Bakım Kaydı Bulunamadı</h3>
                <p className="text-xs text-slate-500 mt-1">Arama kriterlerine uygun bakım kaydı yok.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredMaintenances.map((m) => (
                  <div key={m.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/vehicles/${m.vehicle.id}`}
                          className="font-mono font-bold text-sm text-slate-900 bg-slate-100 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-slate-200 transition-colors"
                        >
                          {m.vehicle.plate}
                        </Link>
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <span>{m.vehicle.brand} {m.vehicle.model}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                              {m.vehicle.owner}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Bakım Tarihi: <b className="text-slate-700 font-mono">{formatDate(m.maintenanceDate)}</b> • Servis: <b className="text-slate-700">{m.serviceName || 'Belgrade Servis'}</b>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          İşçilik: <b>{formatCurrency(m.laborCost, 'EUR')}</b> | Parça: <b>{formatCurrency(m.partsCost, 'EUR')}</b>
                        </div>
                        <div className="text-base font-black text-blue-700 mt-0.5">
                          Toplam: {formatCurrency(m.totalCost, 'EUR')}
                          {m.currency === 'RSD' && m.originalCost && (
                            <span className="text-xs text-slate-500 font-normal ml-1">
                              ({formatRsd(m.originalCost)})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-700 font-semibold font-mono">
                          Gelecek Bakım: {formatDate(m.nextMaintenanceDate)} (+1 Ay)
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mb-2 font-medium">{m.description}</p>

                    {/* Nested Parts */}
                    {m.parts && m.parts.length > 0 && (
                      <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Değiştirilen Parçalar ({m.parts.length} Kalem)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {m.parts.map((p: any) => (
                            <div key={p.id} className="bg-white p-2 rounded-lg border border-slate-200/80 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">{p.partName}</span>
                                {p.partCode && (
                                  <span className="text-xs font-mono text-slate-400 ml-1">({p.partCode})</span>
                                )}
                                <div className="text-xs text-slate-400 font-mono">{formatDate(p.changeDate)}</div>
                              </div>
                              <span className="font-bold text-slate-900">{formatCurrency(p.cost, 'EUR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 font-mono mt-2 text-right">
                      Sisteme Kayıt: {formatDateTime(m.createdAt)}
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
                <p className="text-xs text-slate-500">Yağ kayıtları yükleniyor...</p>
              </div>
            ) : filteredOilChanges.length === 0 ? (
              <div className="p-12 text-center">
                <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Motor Yağı Kaydı Bulunamadı</h3>
                <p className="text-xs text-slate-500 mt-1">Arama kriterlerine uygun yağ değişimi yok.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Plaka & Araç</th>
                      <th className="py-3 px-4">Değişim Tarihi</th>
                      <th className="py-3 px-4">Kilometre</th>
                      <th className="py-3 px-4">Yağ Türü</th>
                      <th className="py-3 px-4">Filtre</th>
                      <th className="py-3 px-4">Servis</th>
                      <th className="py-3 px-4">Maliyet</th>
                      <th className="py-3 px-4">Notlar</th>
                      <th className="py-3 px-4 text-right">Sisteme Giriş</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOilChanges.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/vehicles/${o.vehicle.id}`}
                            className="font-mono font-bold text-slate-900 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                          >
                            {o.vehicle.plate}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {o.vehicle.brand} {o.vehicle.model} ({o.vehicle.owner})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {formatDate(o.changeDate)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {formatKm(o.km)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {o.oilType}
                        </td>
                        <td className="py-3.5 px-4">
                          {o.filterChanged ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-3.5 h-3.5" />
                              Değişti
                            </span>
                          ) : (
                            <span className="text-slate-400">Değişmedi</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {o.serviceName || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                          {formatCurrency(o.cost, 'EUR')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          {o.notes || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
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
        title="Yeni Periyodik Bakım Kaydı"
        subtitle="İşçilik ve değişen parçaları maliyetiyle ayrı ayrı kaydedin"
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
              <span className="text-xs font-bold text-slate-800 block">Masraf Para Birimi</span>
              <span className="text-xs text-slate-500">Sabit Kur: 1 € = 117 RSD</span>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Seçiniz *</label>
              <select
                required
                value={maintVehicleId}
                onChange={(e) => setMaintVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
              >
                <option value="">-- Araç Seçin --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} – {v.brand} {v.model} ({v.owner})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bakım Tarihi *</label>
              <input
                type="date"
                required
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">İşçilik Masrafı ({maintCurrency})</label>
              <input
                type="number"
                value={maintLaborCost}
                onChange={(e) => setMaintLaborCost(e.target.value)}
                placeholder="Örn: 80"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yapılan İşlem Açıklaması *</label>
              <input
                type="text"
                required
                value={maintDesc}
                onChange={(e) => setMaintDesc(e.target.value)}
                placeholder="Örn: Ön disk ve balata değişimi, fren hidroliği kontrolü"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kayıtlı Servis İstasyonu</label>
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
                <option value="OTHER">+ Yeni / Başka Servis Yaz</option>
              </select>
            </div>
          </div>

          {maintService === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yeni Servis Adı *</label>
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
              <span className="text-xs font-bold text-slate-800">Değiştirilen Parçalar (Ayrı Kalemler)</span>
              <button
                type="button"
                onClick={addPartRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Parça Satırı Ekle
              </button>
            </div>

            <div className="space-y-2">
              {maintParts.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={p.partName}
                      onChange={(e) => updatePartRow(idx, 'partName', e.target.value)}
                      placeholder="Parça Adı (Örn: Ön Balata)"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={p.partCode}
                      onChange={(e) => updatePartRow(idx, 'partCode', e.target.value)}
                      placeholder="Parça Kodu (OEM)"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="date"
                      value={p.changeDate}
                      onChange={(e) => updatePartRow(idx, 'changeDate', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={p.cost}
                      onChange={(e) => updatePartRow(idx, 'cost', e.target.value)}
                      placeholder={`Fiyat (${maintCurrency})`}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden font-bold"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {maintParts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartRow(idx)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-slate-200 font-bold text-slate-700">
              <span>Parçalar: {totalPartsInForm} {maintCurrency}</span>
              <span className="text-sm font-black text-slate-900">
                Toplam: {totalMaintCostInForm} {maintCurrency}
                {maintCurrency === 'RSD' && (
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    (~{(totalMaintCostInForm / EUR_TO_RSD_RATE).toFixed(1)} €)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewMaintOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={maintLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {maintLoading ? 'Kaydediliyor...' : 'Bakımı Kaydet (+1 Ay Ata)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Yeni Motor Yağı Değişimi Gir */}
      <Modal
        isOpen={isNewOilOpen}
        onClose={() => setIsNewOilOpen(false)}
        title="Motor Yağı Değişimi Kaydet"
        subtitle="Bakımdan ayrı, sadece motor yağı ve filtre değişimi"
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
            <span className="text-xs font-bold text-slate-800">Maliyet Para Birimi</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Seçiniz *</label>
            <select
              required
              value={oilVehicleId}
              onChange={(e) => setOilVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden font-medium"
            >
              <option value="">-- Araç Seçin --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} – {v.brand} {v.model} ({v.owner} - {formatKm(v.currentKm)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Değişim Tarihi *</label>
              <input
                type="date"
                required
                value={oilDate}
                onChange={(e) => setOilDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Araç KM *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yağ Cinsi</label>
              <input
                type="text"
                value={oilType}
                onChange={(e) => setOilType(e.target.value)}
                placeholder="5W-30 Tam Sentetik"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maliyet ({oilCurrency}) *</label>
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
              <div className="text-xs font-bold text-emerald-950">Yağ Filtresi Değiştirildi mi?</div>
              <div className="text-xs text-emerald-700">Filtre seti dahil</div>
            </div>
            <input
              type="checkbox"
              checked={oilFilter}
              onChange={(e) => setOilFilter(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notlar</label>
            <textarea
              rows={2}
              value={oilNotes}
              onChange={(e) => setOilNotes(e.target.value)}
              placeholder="Yağ markası, filtre kodu..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewOilOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={oilLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {oilLoading ? 'Kaydediliyor...' : 'Yağ Değişimini Kaydet'}
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

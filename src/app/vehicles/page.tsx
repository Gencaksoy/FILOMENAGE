'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  KeyRound,
  Wrench,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Droplet,
  UserCheck,
  Fuel,
  Sparkles,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatKm, formatCurrency } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth';

const ACCESSORY_OPTIONS = [
  'Telefon Tutucu',
  'Çakmaklık Şarj Aleti',
  'İlk Yardım Çantası',
  'Reflektör & Yangın Tüpü',
  'Paspas Seti',
  'Yedek Lastik & Kriko',
];

function VehiclesContent() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // New Vehicle Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const initialForm = {
    plate: '',
    brand: '',
    model: '',
    modelYear: new Date().getFullYear(),
    color: '',
    currentKm: 0,
    fuelType: 'Dizel',
    fuelConsumptionRsd: 1100,
    registrationExpiry: oneYearLater.toISOString().slice(0, 10),
    purchasePrice: 6500,
    initialExpenses: 350,
    dailyPrice: 25,
    monthlyPrice: 350,
    status: 'AVAILABLE',
    owner: '',
    accessories: ['Telefon Tutucu', 'Çakmaklık Şarj Aleti', 'İlk Yardım Çantası', 'Reflektör & Yangın Tüpü', 'Paspas Seti'],
    vin: '',
    engineNo: '',
    chronicIssues: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const handleMarkAsAvailable = async (vId: string, plate: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Araç durumu güncellenemedi');
        return;
      }
      setVehicles((prev) =>
        prev.map((v) => (v.id === vId ? { ...v, status: 'AVAILABLE' } : v))
      );
    } catch (e) {
      console.error(e);
      alert('Araç güncellenirken hata oluştu.');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
        else window.location.href = '/login';
      });

    loadVehicles();

    const statusParam = searchParams.get('status');
    if (statusParam) {
      const up = statusParam.toUpperCase();
      if (up === 'RETURNING_SOON' || up === 'RETURNS_7_DAYS' || up === 'RETURNS_SOON') {
        setStatusFilter('RETURNING_SOON');
      } else if (up === 'REGISTRATION_EXPIRING' || up === 'REGI_SOON' || up === 'REG_EXPIRING') {
        setStatusFilter('REGISTRATION_EXPIRING');
      } else {
        setStatusFilter(up);
      }
    }
    const ownerParam = searchParams.get('owner');
    if (ownerParam) {
      setOwnerFilter(ownerParam);
    }
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
    }
  }, [searchParams]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Araç kaydedilemedi.');

      setIsNewModalOpen(false);
      setFormData(initialForm);
      await loadVehicles();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleFormAccessory = (acc: string) => {
    const current = formData.accessories || [];
    if (current.includes(acc)) {
      setFormData({ ...formData, accessories: current.filter((x) => x !== acc) });
    } else {
      setFormData({ ...formData, accessories: [...current, acc] });
    }
  };

  // Category counts
  const totalCount = vehicles.length;
  const rentedCount = vehicles.filter((v) => v.status === 'RENTED').length;
  const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const returningSoonCount = vehicles.filter(
    (v) =>
      v.status === 'RENTED' &&
      v.activeRental &&
      v.activeRental.remainingDays !== null &&
      v.activeRental.remainingDays <= 7
  ).length;
  const regExpiringCount = vehicles.filter((v) => {
    const daysLeft =
      v.regDaysLeft !== null
        ? v.regDaysLeft
        : v.registrationExpiry
        ? Math.ceil((new Date(v.registrationExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    return daysLeft !== null && daysLeft <= 30;
  }).length;
  const postCheckCount = vehicles.filter((v) => v.status === 'POST_RENTAL_CHECK').length;
  const maintCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const faultsCount = vehicles.filter(
    (v) => v.hasActiveFault || (v.activeFaultsCount && v.activeFaultsCount > 0)
  ).length;

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      !search ||
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.owner && v.owner.toLowerCase().includes(search.toLowerCase())) ||
      (v.activeRental?.customerName &&
        v.activeRental.customerName.toLowerCase().includes(search.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else if (statusFilter === 'RETURNING_SOON') {
      matchesStatus =
        v.status === 'RENTED' &&
        v.activeRental &&
        v.activeRental.remainingDays !== null &&
        v.activeRental.remainingDays <= 7;
    } else if (statusFilter === 'REGISTRATION_EXPIRING') {
      const daysLeft =
        v.regDaysLeft !== null
          ? v.regDaysLeft
          : v.registrationExpiry
          ? Math.ceil((new Date(v.registrationExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
      matchesStatus = daysLeft !== null && daysLeft <= 30;
    } else if (statusFilter === 'FAULTS') {
      matchesStatus = !!v.hasActiveFault || (v.activeFaultsCount && v.activeFaultsCount > 0);
    } else {
      matchesStatus = v.status === statusFilter;
    }

    const matchesOwner = ownerFilter === 'ALL' || v.owner === ownerFilter;

    return matchesSearch && matchesStatus && matchesOwner;
  });

  return (
    <AppLayout currentUser={currentUser}>
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-amber-500" />
            Filo Araçları ve Envanter Takibi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Filo envanterindeki araçlar, Registracija muayene takvimi, yakıt tüketimi ve kiralama durumu
          </p>
        </div>

        <button
          onClick={() => {
            const isPartnership = currentUser?.isPartnership ?? false;
            const partners = currentUser?.partners || [];
            const defaultOwner = isPartnership ? (partners[0] || '') : (currentUser?.fleetName || '');
            setFormData({
              ...initialForm,
              owner: defaultOwner,
            });
            setFormError(null);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Yeni Araç Ekle
        </button>
      </div>

      {/* Category / Status Tabs (Hızlı Sekmeler) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Tüm Araçlar</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'ALL' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RENTED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'RENTED'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Kirada</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'RENTED' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-amber-50 text-amber-900 font-bold'}`}>
            {rentedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Boşta (Hazır)</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'AVAILABLE' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 font-bold'}`}>
            {availableCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RETURNING_SOON')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'RETURNING_SOON'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>1 Hafta İçinde Dönecek</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'RETURNING_SOON' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900 font-black'}`}>
            {returningSoonCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REGISTRATION_EXPIRING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'REGISTRATION_EXPIRING'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50/50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Regi (Tescil) Yaklaşan</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'REGISTRATION_EXPIRING' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-900 font-black'}`}>
            {regExpiringCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('POST_RENTAL_CHECK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'POST_RENTAL_CHECK'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Kira Sonrası Kontrol</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'POST_RENTAL_CHECK' ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-800'}`}>
            {postCheckCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('MAINTENANCE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'MAINTENANCE'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-rose-600" />
          <span>Serviste</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'MAINTENANCE' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800'}`}>
            {maintCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('FAULTS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'FAULTS'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Arızalı Araçlar</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'FAULTS' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900 font-bold'}`}>
            {faultsCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka (Örn: BG 123-AA), marka, model, ortak veya müşteri ara..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Partner Filter (Sadece ortaklı filolarda gösterilir) */}
        {currentUser?.isPartnership && (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-bold text-slate-700"
            >
              <option value="ALL">Tüm Ortaklar</option>
              {(currentUser?.partners && currentUser.partners.length > 0
                ? currentUser.partners
                : Array.from(new Set(vehicles.map((v) => v.owner).filter(Boolean)))
              ).map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-semibold text-slate-700"
          >
            <option value="ALL">Tüm Durumlar (Tümü)</option>
            <option value="RENTED">Müşteride (Kirada)</option>
            <option value="AVAILABLE">Boşta (Kiralanabilir)</option>
            <option value="RETURNING_SOON">🕒 1 Hafta İçinde Dönecek ({returningSoonCount})</option>
            <option value="REGISTRATION_EXPIRING">📋 Regi (Tescil) Yaklaşan / Biten ({regExpiringCount})</option>
            <option value="POST_RENTAL_CHECK">Kira Sonrası Kontrol / Bakımda</option>
            <option value="MAINTENANCE">Serviste (Bakım)</option>
            <option value="FAULTS">⚠️ Arızalı Araçlar ({faultsCount})</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table / Mobile Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Araçlar listeleniyor...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Aramanıza Uygun Araç Bulunamadı</h3>
          <p className="text-xs text-slate-500 mt-1">Lütfen farklı bir filtre veya arama kelimesi deneyiniz.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Plaka</th>
                  <th className="py-3 px-4">Marka & Model</th>
                  <th className="py-3 px-4">{currentUser?.isPartnership ? 'Ortak' : 'Sahip / Şirket'}</th>
                  <th className="py-3 px-4">Yakıt & 100km</th>
                  <th className="py-3 px-4">Registracija (Tescil)</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Araç Kimde?</th>
                  <th className="py-3 px-4">Kalan Süre</th>
                  <th className="py-3 px-4">Son Bakım & Masraf</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((v) => {
                  const isRented = v.status === 'RENTED';
                  const isAvail = v.status === 'AVAILABLE';
                  const isPostCheck = v.status === 'POST_RENTAL_CHECK';
                  const isMaint = v.status === 'MAINTENANCE';

                  // Registration days calculation
                  let regWarning = null;
                  if (v.registrationExpiry) {
                    const days = Math.ceil(
                      (new Date(v.registrationExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    if (days < 0) {
                      regWarning = { text: `DOLDU (${Math.abs(days)} g önce)`, danger: true };
                    } else if (days <= 30) {
                      regWarning = { text: `${days} gün kaldı`, warning: true };
                    } else {
                      regWarning = { text: `${days} gün`, ok: true };
                    }
                  }

                  return (
                    <tr key={v.id} className="hover:bg-amber-50/40 transition-colors group">
                      {/* Plaka */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="font-mono font-bold text-slate-900 group-hover:text-amber-700 bg-slate-100 group-hover:bg-amber-100/80 px-2.5 py-1 rounded-md border border-slate-200 group-hover:border-amber-300 transition-colors inline-block"
                        >
                          {v.plate}
                        </Link>
                      </td>

                      {/* Marka & Model */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{v.brand} {v.model}</div>
                        <div className="text-xs text-slate-500">
                          {v.modelYear} • {formatKm(v.currentKm)}
                        </div>
                        {v.vin && (
                          <div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
                            VIN: {v.vin}
                          </div>
                        )}
                        {v.chronicIssues && (
                          <div
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded-md mt-1 max-w-[220px]"
                            title={`Kronik Arıza / Not: ${v.chronicIssues}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{v.chronicIssues}</span>
                          </div>
                        )}
                      </td>

                      {/* Araç Sahibi (Ortak) */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {v.owner || (currentUser?.isPartnership ? '-' : (currentUser?.fleetName || 'Filo'))}
                        </span>
                      </td>

                      {/* Yakıt & 100km Tüketim */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Fuel className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{v.fuelType || 'Dizel'}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {v.fuelConsumptionRsd ? `${v.fuelConsumptionRsd} RSD/100km` : '-'}
                        </div>
                      </td>

                      {/* Registracija (Zorunlu Tescil) */}
                      <td className="py-3.5 px-4">
                        {v.registrationExpiry ? (
                          <div>
                            <Link
                              href={`/inspection?search=${encodeURIComponent(v.plate)}`}
                              className="text-slate-800 font-semibold flex items-center gap-1 hover:text-purple-700 hover:underline transition-colors"
                              title={`${v.plate} aracının muayene & registracija geçmişini gör`}
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
                              <span>{formatDate(v.registrationExpiry)}</span>
                            </Link>
                            {regWarning && (
                              <Link
                                href={`/inspection?search=${encodeURIComponent(v.plate)}`}
                                className={`text-xs font-bold mt-0.5 flex items-center gap-1 hover:underline ${
                                  regWarning.danger
                                    ? 'text-rose-600'
                                    : regWarning.warning
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                                title="Muayene sayfasına git"
                              >
                                {regWarning.danger && <ShieldAlert className="w-2.5 h-2.5" />}
                                {regWarning.text}
                              </Link>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/inspection?search=${encodeURIComponent(v.plate)}`}
                            className="text-rose-500 text-xs font-bold hover:underline"
                          >
                            Girilmedi (Uyarı!)
                          </Link>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="py-3.5 px-4">
                        {isRented && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <KeyRound className="w-3 h-3" />
                            Müşteride
                          </span>
                        )}
                        {isAvail && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Boşta
                          </span>
                        )}
                        {isPostCheck && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              <Sparkles className="w-3 h-3 text-sky-600" />
                              Yıkama / Kontrol Bekliyor
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleMarkAsAvailable(v.id, v.plate)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                                title="Temizlik ve kontrol tamamlandı, aracı Müsait yap"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ✓ Müsait Yap
                              </button>
                            </div>
                          </div>
                        )}
                        {isMaint && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Wrench className="w-3 h-3" />
                            Bakımda
                          </span>
                        )}
                        {v.activeFaultsCount > 0 && (
                          <div className="mt-1">
                            <Link
                              href={`/vehicles/${v.id}?tab=faults`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-colors"
                              title={`${v.activeFaultsCount} aktif arıza/hasar kaydı`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                              {v.activeFaultsCount} Arıza
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Araç Kimde? */}
                      <td className="py-3.5 px-4">
                        {v.activeRental ? (
                          <div>
                            <Link
                              href={`/customers?search=${encodeURIComponent(v.activeRental.customerName)}`}
                              className="font-bold text-slate-900 hover:text-amber-600 hover:underline flex items-center gap-1 group/c"
                              title={`${v.activeRental.customerName} müşterisinin detayına git`}
                            >
                              <span>{v.activeRental.customerName}</span>
                              <span className="text-[10px] text-amber-600 opacity-0 group-hover/c:opacity-100 transition-opacity">↗</span>
                            </Link>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {v.activeRental.customerPhone}
                            </div>
                          </div>
                        ) : isPostCheck ? (
                          <span className="text-sky-700 font-semibold italic">Muayene / Temizlikte</span>
                        ) : (
                          <span className="text-slate-400 italic">Boşta (Otopark)</span>
                        )}
                      </td>

                      {/* Kalan Süre */}
                      <td className="py-3.5 px-4">
                        {v.activeRental ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                              v.activeRental.remainingDays < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : v.activeRental.remainingDays <= 3
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {v.activeRental.remainingText}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Son Bakım & Masraf */}
                      <td className="py-3.5 px-4">
                        {v.latestMaintenance ? (
                          <div>
                            <Link
                              href={`/vehicles/${v.id}?tab=maintenances`}
                              className="text-slate-800 font-semibold hover:text-blue-600 hover:underline flex items-center gap-1"
                              title="Aracın bakım geçmişini incele"
                            >
                              <span>{formatDate(v.latestMaintenance.maintenanceDate)}</span>
                              <span className="text-[10px] text-blue-600">↗</span>
                            </Link>
                            <div className="text-xs text-slate-500 font-medium">
                              Toplam: <b className="text-slate-900">{formatCurrency(v.latestMaintenance.totalCost, 'EUR')}</b>
                              {v.latestMaintenance.partsCount > 0 && (
                                <span className="ml-1 text-blue-600">({v.latestMaintenance.partsCount} parça)</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Kayıt yok</span>
                        )}
                      </td>

                      {/* Detay Butonu */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-xl text-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          İncele
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Vehicle Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Araç Ekle"
        subtitle="Belgrad operasyonuna yeni filo aracı ve tescil bilgilerini kaydedin"
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plaka (Sırbistan) *
              </label>
              <input
                type="text"
                required
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="Örn: BG 123-AA"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {currentUser?.isPartnership ? 'Araç Sahibi (Ortak) *' : 'Araç Sahibi / Şirket'}
              </label>
              {currentUser?.isPartnership && (currentUser?.partners || []).length > 0 ? (
                <select
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold text-slate-800"
                >
                  {(currentUser.partners || []).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder={currentUser?.fleetName || 'Şirket / Filo Sahibi'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium text-slate-800"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marka *
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Örn: Renault"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Örn: Clio 1.5 dCi"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Yılı *
              </label>
              <input
                type="number"
                required
                value={formData.modelYear}
                onChange={(e) => setFormData({ ...formData, modelYear: parseInt(e.target.value, 10) || 2024 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Renk
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Beyaz, Gri, Siyah..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mevcut Kilometre (KM) *
              </label>
              <input
                type="number"
                required
                value={formData.currentKm}
                onChange={(e) => setFormData({ ...formData, currentKm: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registracija Bitiş Tarihi *
              </label>
              <input
                type="date"
                required
                value={formData.registrationExpiry}
                onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Detaylı Araç Kimliği (Şasi No & Motor No) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Şasi Numarası (VIN - 17 Haneli)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="Örn: VF1BZ0A0548123456"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold uppercase bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Motor Numarası
              </label>
              <input
                type="text"
                value={formData.engineNo}
                onChange={(e) => setFormData({ ...formData, engineNo: e.target.value.toUpperCase() })}
                placeholder="Örn: K9K 836 D012345"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold uppercase bg-white"
              />
            </div>
          </div>

          {/* Kronik Arızalar / Bilinen Sorunlar */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-300/80">
            <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Kronik Arızalar / Bilinen Sıkıntılar / Önemli Notlar
            </label>
            <textarea
              rows={2}
              value={formData.chronicIssues}
              onChange={(e) => setFormData({ ...formData, chronicIssues: e.target.value })}
              placeholder="Örn: Yağ yakma eğilimi var her 2000 km'de bir kontrol edilmeli, klima sağ menfezden az üflüyor, debriyaj pedalı sert..."
              className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:border-amber-500 bg-white text-slate-800 placeholder:text-slate-400"
            />
            <span className="text-[11px] text-amber-800 mt-1 block">
              Bu bilgi araç detayında ve kiralama öncesinde dikkat çekici uyarı olarak gösterilir.
            </span>
          </div>

          {/* Yakıt & Tüketim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yakıt Türü *
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-semibold"
              >
                <option value="Dizel">Dizel</option>
                <option value="Benzin">Benzin</option>
                <option value="Benzin+LPG">Benzin + LPG</option>
                <option value="Benzin+Metan">Benzin + Metan (CNG)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                100 KM Ortalama Yakıt Tüketimi (Sırp Dinarı - RSD)
              </label>
              <input
                type="number"
                value={formData.fuelConsumptionRsd}
                onChange={(e) => setFormData({ ...formData, fuelConsumptionRsd: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 1100"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold"
              />
              <span className="text-xs text-slate-500">Müşteri sorduğunda söylenecek 100km dinar maliyeti</span>
            </div>
          </div>

          {/* Satın Alma & Devir Masrafları (Amortisman Hesabı İçin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Araç Satın Alınma Bedeli (€) *
              </label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 6500"
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:border-amber-500 font-mono font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Alınırken Yapılan Masraflar (Devir/Registracija/Plaka €)
              </label>
              <input
                type="number"
                value={formData.initialExpenses}
                onChange={(e) => setFormData({ ...formData, initialExpenses: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 350"
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:border-amber-500 font-mono font-bold bg-white"
              />
            </div>
          </div>

          {/* Kiralama Fiyatları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standart Aylık Kira Bedeli (€) *
              </label>
              <input
                type="number"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold"
              />
              <span className="text-xs text-slate-500">Varsayılan 30 günlük kira bedeli</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Günlük Kiralama (€)
              </label>
              <input
                type="number"
                value={formData.dailyPrice}
                onChange={(e) => setFormData({ ...formData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Başlangıç Durumu
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-semibold"
              >
                <option value="AVAILABLE">Boşta (Kiralanabilir)</option>
                <option value="POST_RENTAL_CHECK">Kira Sonrası Kontrol / Temizlik</option>
                <option value="MAINTENANCE">Bakımda</option>
              </select>
            </div>
          </div>

          {/* Araç İçi Aksesuarlar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Araç İçi Aksesuarlar (Teslimat ve İadede Kontrol Edilecekler)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {ACCESSORY_OPTIONS.map((acc) => {
                const isSelected = formData.accessories?.includes(acc);
                return (
                  <label
                    key={acc}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFormAccessory(acc)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span>{acc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notlar
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Araçla ilgili genel notlar..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Kaydediliyor...' : 'Aracı Sisteme Ekle'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Yükleniyor...</div>}>
      <VehiclesContent />
    </Suspense>
  );
}

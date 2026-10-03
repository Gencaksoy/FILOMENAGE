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
import { formatDate, formatKm, formatCurrency, getVehicleStatusLabel } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

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
  const { t, language } = useLanguage();
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
    <AppLayout currentUser={currentUser} requiredFeature="vehicles">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-amber-500" />
            {t.veh_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.veh_subtitle}
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
          {t.veh_add_new}
        </button>
      </div>

      {/* Category / Status Tabs (Hızlı Sekmeler) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>{t.veh_tab_all}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'ALL' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RENTED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'RENTED'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{t.veh_tab_rented}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'RENTED' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-bold'}`}>
            {rentedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t.veh_tab_available}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'AVAILABLE' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold'}`}>
            {availableCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RETURNING_SOON')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'RETURNING_SOON'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{t.veh_tab_returning_soon}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'RETURNING_SOON' ? 'bg-blue-700 text-white' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-black'}`}>
            {returningSoonCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REGISTRATION_EXPIRING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'REGISTRATION_EXPIRING'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50/50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t.veh_tab_reg_expiring}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'REGISTRATION_EXPIRING' ? 'bg-purple-800 text-white' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-black'}`}>
            {regExpiringCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('POST_RENTAL_CHECK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'POST_RENTAL_CHECK'
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-sky-50/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t.kpi_post_check}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'POST_RENTAL_CHECK' ? 'bg-sky-700 text-white' : 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300'}`}>
            {postCheckCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('MAINTENANCE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'MAINTENANCE'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-rose-50/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>{t.kpi_maintenance}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'MAINTENANCE' ? 'bg-rose-700 text-white' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'}`}>
            {maintCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('FAULTS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
            statusFilter === 'FAULTS'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t.veh_tab_faults}</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'FAULTS' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold'}`}>
            {faultsCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.veh_search_placeholder}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Partner Filter (Sadece ortaklı filolarda gösterilir) */}
        {currentUser?.isPartnership && (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-bold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{t.common_all_owners}</option>
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
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">{t.common_status}: {t.common_all}</option>
            <option value="RENTED">{t.veh_tab_rented}</option>
            <option value="AVAILABLE">{t.veh_tab_available}</option>
            <option value="RETURNING_SOON">🕒 {t.veh_tab_returning_soon} ({returningSoonCount})</option>
            <option value="REGISTRATION_EXPIRING">📋 {t.veh_tab_reg_expiring} ({regExpiringCount})</option>
            <option value="POST_RENTAL_CHECK">{t.kpi_post_check}</option>
            <option value="MAINTENANCE">{t.kpi_maintenance}</option>
            <option value="FAULTS">⚠️ {t.veh_tab_faults} ({faultsCount})</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table / Mobile Cards */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.common_loading}</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.veh_no_vehicles}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.common_no_data}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.common_plate}</th>
                  <th className="py-3 px-4">{t.veh_modal_brand} & {t.veh_modal_model}</th>
                  <th className="py-3 px-4">{currentUser?.isPartnership ? t.veh_modal_owner : t.veh_card_owner}</th>
                  <th className="py-3 px-4">{t.veh_card_fuel}</th>
                  <th className="py-3 px-4">{t.dash_col_regi}</th>
                  <th className="py-3 px-4">{t.common_status}</th>
                  <th className="py-3 px-4">{t.cust_col_active_car}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Preostalo Vreme' : language === 'en' ? 'Remaining Time' : 'Kalan Süre'}</th>
                  <th className="py-3 px-4">{language === 'sr' ? 'Poslednji Servis' : language === 'en' ? 'Last Service' : 'Son Bakım & Masraf'}</th>
                  <th className="py-3 px-4 text-right">{t.common_actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                      regWarning = {
                        text: language === 'sr' ? `ISTEKLO (pre ${Math.abs(days)} dana)` : language === 'en' ? `EXPIRED (${Math.abs(days)}d ago)` : `DOLDU (${Math.abs(days)} g önce)`,
                        danger: true,
                      };
                    } else if (days <= 30) {
                      regWarning = {
                        text: language === 'sr' ? `Još ${days} dana` : language === 'en' ? `${days} days left` : `${days} gün kaldı`,
                        warning: true,
                      };
                    } else {
                      regWarning = {
                        text: language === 'sr' ? `${days} dana` : language === 'en' ? `${days} days` : `${days} gün`,
                        ok: true,
                      };
                    }
                  }

                  return (
                    <tr key={v.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors group">
                      {/* Plaka */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-100/80 dark:group-hover:bg-amber-950/40 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 group-hover:border-amber-300 transition-colors inline-block"
                        >
                          {v.plate}
                        </Link>
                      </td>

                      {/* Marka & Model */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{v.brand} {v.model}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {v.modelYear} • {formatKm(v.currentKm)}
                        </div>
                        {v.vin && (
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                            VIN: {v.vin}
                          </div>
                        )}
                        {v.chronicIssues && (
                          <div
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded-md mt-1 max-w-[220px]"
                            title={`Kronik Arıza / Not: ${v.chronicIssues}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">{v.chronicIssues}</span>
                          </div>
                        )}
                      </td>

                      {/* Araç Sahibi (Ortak) */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        >
                          {v.owner || (currentUser?.isPartnership ? '-' : (currentUser?.fleetName || 'Filo'))}
                        </span>
                      </td>

                      {/* Yakıt & 100km Tüketim */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <Fuel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{v.fuelType || 'Dizel'}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {v.fuelConsumptionRsd ? `${v.fuelConsumptionRsd} RSD/100km` : '-'}
                        </div>
                      </td>

                      {/* Registracija (Zorunlu Tescil) */}
                      <td className="py-3.5 px-4">
                        {v.registrationExpiry ? (
                          <div>
                            <Link
                              href={`/inspection?search=${encodeURIComponent(v.plate)}`}
                              className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1 hover:text-purple-700 dark:hover:text-purple-400 hover:underline transition-colors"
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
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : regWarning.warning
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
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
                            className="text-rose-500 dark:text-rose-400 text-xs font-bold hover:underline"
                          >
                            {language === 'sr' ? 'Nije uneto' : language === 'en' ? 'Not recorded' : 'Girilmedi (Uyarı!)'}
                          </Link>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="py-3.5 px-4">
                        {isRented && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <KeyRound className="w-3 h-3" />
                            {t.veh_tab_rented}
                          </span>
                        )}
                        {isAvail && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.veh_tab_available}
                          </span>
                        )}
                        {isPostCheck && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              <Sparkles className="w-3 h-3 text-sky-600" />
                              {t.kpi_post_check}
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleMarkAsAvailable(v.id, v.plate)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                                title="Temizlik ve kontrol tamamlandı, aracı Müsait yap"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t.veh_btn_make_available}
                              </button>
                            </div>
                          </div>
                        )}
                        {isMaint && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Wrench className="w-3 h-3" />
                            {t.kpi_maintenance}
                          </span>
                        )}
                        {v.activeFaultsCount > 0 && (
                          <div className="mt-1">
                            <Link
                              href={`/vehicles/${v.id}?tab=faults`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 transition-colors"
                              title={`${v.activeFaultsCount} aktif arıza/hasar kaydı`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                              {v.activeFaultsCount} {language === 'sr' ? 'Kvar' : language === 'en' ? 'Faults' : 'Arıza'}
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
                              className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-1 group/c"
                              title={`${v.activeRental.customerName} müşterisinin detayına git`}
                            >
                              <span>{v.activeRental.customerName}</span>
                              <span className="text-[10px] text-amber-600 opacity-0 group-hover/c:opacity-100 transition-opacity">↗</span>
                            </Link>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {v.activeRental.customerPhone}
                            </div>
                          </div>
                        ) : isPostCheck ? (
                          <span className="text-sky-700 dark:text-sky-400 font-semibold italic">
                            {language === 'sr' ? 'Na pregledu / čišćenju' : language === 'en' ? 'In post-rental check' : 'Muayene / Temizlikte'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            {t.veh_tab_available}
                          </span>
                        )}
                      </td>

                      {/* Kalan Süre */}
                      <td className="py-3.5 px-4">
                        {v.activeRental ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                              v.activeRental.remainingDays < 0
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                : v.activeRental.remainingDays <= 3
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
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
                              className="text-slate-800 dark:text-slate-200 font-semibold hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1"
                              title="Aracın bakım geçmişini incele"
                            >
                              <span>{formatDate(v.latestMaintenance.maintenanceDate)}</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400">↗</span>
                            </Link>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {t.common_total}: <b className="text-slate-900 dark:text-white">{formatCurrency(v.latestMaintenance.totalCost, 'EUR')}</b>
                              {v.latestMaintenance.partsCount > 0 && (
                                <span className="ml-1 text-blue-600 dark:text-blue-400">({v.latestMaintenance.partsCount} {language === 'sr' ? 'delova' : language === 'en' ? 'parts' : 'parça'})</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t.common_no_data}</span>
                        )}
                      </td>

                      {/* Detay Butonu */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-slate-950 dark:hover:text-slate-950 font-bold rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t.veh_btn_details}
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
        title={t.veh_modal_add_title}
        subtitle={t.veh_subtitle}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_plate} *
              </label>
              <input
                type="text"
                required
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="Örn: BG 123-AA"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-mono font-bold uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {currentUser?.isPartnership ? `${t.veh_modal_owner} *` : t.veh_card_owner}
              </label>
              {currentUser?.isPartnership && (currentUser?.partners || []).length > 0 ? (
                <select
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
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
                  placeholder={currentUser?.fleetName || 'Filo Sahibi'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_brand} *
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Örn: Renault"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_model} *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Örn: Clio 1.5 dCi"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_year} *
              </label>
              <input
                type="number"
                required
                value={formData.modelYear}
                onChange={(e) => setFormData({ ...formData, modelYear: parseInt(e.target.value, 10) || 2024 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_color}
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Beyaz, Gri, Siyah..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_km} *
              </label>
              <input
                type="number"
                required
                value={formData.currentKm}
                onChange={(e) => setFormData({ ...formData, currentKm: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_reg_expiry} *
              </label>
              <input
                type="date"
                required
                value={formData.registrationExpiry}
                onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Detaylı Araç Kimliği (Şasi No & Motor No) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                VIN / Broj Šasije (17 Haneli)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="Örn: VF1BZ0A0548123456"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl focus:border-amber-500 font-mono font-bold uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Broj Motora / Motor No
              </label>
              <input
                type="text"
                value={formData.engineNo}
                onChange={(e) => setFormData({ ...formData, engineNo: e.target.value.toUpperCase() })}
                placeholder="Örn: K9K 836 D012345"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl focus:border-amber-500 font-mono font-bold uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Kronik Arızalar / Bilinen Sorunlar */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-300/80 dark:border-amber-800">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              {language === 'sr' ? 'Poznati kvarovi / Napomene' : language === 'en' ? 'Known Issues / Special Notes' : 'Kronik Arızalar / Bilinen Sıkıntılar / Önemli Notlar'}
            </label>
            <textarea
              rows={2}
              value={formData.chronicIssues}
              onChange={(e) => setFormData({ ...formData, chronicIssues: e.target.value })}
              placeholder={language === 'sr' ? 'npr. provera ulja na 2000 km...' : 'Örn: Yağ kontrolü vb...'}
              className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Yakıt & Tüketim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_fuel_type} *
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Dizel">Dizel (Euro Diesel)</option>
                <option value="Benzin">Benzin (BMB 95)</option>
                <option value="Benzin+LPG">Benzin + TNG (LPG)</option>
                <option value="Benzin+Metan">Benzin + Metan (CNG)</option>
                <option value="Hibrid">Hibrid (Hybrid)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                100 KM Ortalama Tüketim (RSD / Dinar)
              </label>
              <input
                type="number"
                value={formData.fuelConsumptionRsd}
                onChange={(e) => setFormData({ ...formData, fuelConsumptionRsd: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 1100"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Satın Alma & Devir Masrafları (Amortisman Hesabı İçin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {t.veh_modal_purchase_price} *
              </label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 6500"
                className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-xl focus:border-amber-500 font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {t.veh_modal_initial_expense}
              </label>
              <input
                type="number"
                value={formData.initialExpenses}
                onChange={(e) => setFormData({ ...formData, initialExpenses: parseFloat(e.target.value) || 0 })}
                placeholder="Örn: 350"
                className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-xl focus:border-amber-500 font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Kiralama Fiyatları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_monthly_price} *
              </label>
              <input
                type="number"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.veh_modal_daily_price}
              </label>
              <input
                type="number"
                value={formData.dailyPrice}
                onChange={(e) => setFormData({ ...formData, dailyPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.common_status}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="AVAILABLE">{t.veh_tab_available}</option>
                <option value="POST_RENTAL_CHECK">{t.kpi_post_check}</option>
                <option value="MAINTENANCE">{t.kpi_maintenance}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.common_notes}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'sr' ? 'Opšte napomene o vozilu...' : 'Araçla ilgili genel notlar...'}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              {t.common_cancel}
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {formLoading ? t.common_saving : t.common_save}
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

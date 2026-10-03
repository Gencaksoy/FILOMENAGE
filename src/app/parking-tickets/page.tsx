'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Car,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertCircle,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate, generateParkingFineWhatsAppUrl } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

function ParkingTicketsContent() {
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [companyName, setCompanyName] = useState('Filo Yönetim');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UNPAID, PAID

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [singleScanningId, setSingleScanningId] = useState<string | null>(null);

  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
        else window.location.href = '/login';
      });

    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam.toUpperCase());
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/parking-tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setStats(data.stats || null);
        if (data.companyName) setCompanyName(data.companyName);
      }
    } catch (e) {
      console.error('Ceza listesi yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  // Tüm araçları tara
  const handleScanAll = async () => {
    if (scanning) return;
    try {
      setScanning(true);
      setScanMessage('Belgrade Parking Servis üzerinden tüm filonun araçları taranıyor...');
      const res = await fetch('/api/parking-tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.message || 'Tarama tamamlandı.');
        await loadTickets();
      } else {
        setScanMessage(data.error || 'Tarama sırasında bir hata oluştu.');
      }
    } catch (err: any) {
      console.error('Scan all error:', err);
      setScanMessage('Tarama yapılamadı. Lütfen internet bağlantısını kontrol edin.');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(null), 7000);
    }
  };

  // Tek aracı tara
  const handleScanVehicle = async (vehicleId: string, plate: string) => {
    try {
      setSingleScanningId(vehicleId);
      const res = await fetch('/api/parking-tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `${plate} plakalı araç tarandı.\n${
            data.newTicketsCount > 0
              ? `${data.newTicketsCount} adet YENİ ceza bulundu!`
              : 'Yeni bir ceza tespit edilmedi.'
          }`
        );
        await loadTickets();
      } else {
        alert(data.error || 'Tarama hatası.');
      }
    } catch (err) {
      console.error('Scan vehicle error:', err);
      alert('Araç taranamadı.');
    } finally {
      setSingleScanningId(null);
    }
  };

  // Ceza ödeme durumunu güncelle
  const handleToggleStatus = async (ticket: any) => {
    const newStatus = ticket.status === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      const res = await fetch(`/api/parking-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket?.id === ticket.id) {
          setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
        }
        // İstatistikleri güncelle
        loadTickets();
      } else {
        const err = await res.json();
        alert(err.error || 'Durum güncellenemedi.');
      }
    } catch (e) {
      console.error(e);
      alert('İşlem başarısız.');
    }
  };

  // WhatsApp bildirimi gönder ve durumu otomatik "bildirildi" yap
  const handleNotifyCustomerWhatsApp = async (ticket: any) => {
    if (!ticket.customer?.phone) {
      alert('Bu cezaya bağlı kayıtlı bir müşteri telefonu bulunamadı.');
      return;
    }

    const waUrl = generateParkingFineWhatsAppUrl(
      ticket.customer.phone,
      ticket.customer.name,
      {
        plate: ticket.plate,
        ticketNumber: ticket.ticketNumber,
        street: ticket.street,
        zone: ticket.zone,
        amountRsd: ticket.amountRsd,
        amountEur: ticket.amountEur,
        issueDate: ticket.issueDate,
        referenceNumber: ticket.referenceNumber,
      },
      companyName
    );

    // WhatsApp'ı aç
    window.open(waUrl, '_blank');

    // Eğer bildirilmemişse, bildirildi olarak işaretle
    if (!ticket.isCustomerNotified) {
      try {
        const res = await fetch(`/api/parking-tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCustomerNotified: true }),
        });
        if (res.ok) {
          setTickets((prev) =>
            prev.map((t) => (t.id === ticket.id ? { ...t, isCustomerNotified: true } : t))
          );
        }
      } catch (e) {
        console.error('Bildirim durumu güncellenemedi:', e);
      }
    }
  };

  return (
    <AppLayout currentUser={currentUser} requiredFeature="parkingTickets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t.parking_title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t.parking_subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button: Toplu Tara */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleScanAll}
              disabled={scanning}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                scanning
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/20 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? t.parking_scanning : t.parking_scan_all}</span>
            </button>
          </div>
        </div>

        {/* Scan Message Alert */}
        {scanMessage && (
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="font-semibold">{scanMessage}</span>
            </div>
            <button
              onClick={() => setScanMessage(null)}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-white text-xs font-bold"
            >
              {t.common_close}
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Toplam Ceza */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{t.parking_kpi_total}</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats?.totalCount || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.common_total}: {stats?.totalAmountRsd?.toLocaleString(language === 'sr' ? 'sr-RS' : language === 'en' ? 'en-US' : 'tr-TR') || 0} RSD (~{stats?.totalAmountEur || 0} €)
            </div>
          </div>

          {/* Ödenmemiş Aktif Ceza */}
          <div className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{t.parking_kpi_unpaid}</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats?.unpaidCount || 0}
            </div>
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1">
              {stats?.totalUnpaidAmountRsd?.toLocaleString(language === 'sr' ? 'sr-RS' : language === 'en' ? 'en-US' : 'tr-TR') || 0} RSD (~{stats?.totalUnpaidAmountEur || 0} €)
            </div>
          </div>

          {/* Müşteri Bildirimi */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">{t.parking_kpi_notified}</span>
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {tickets.filter((t) => t.isCustomerNotified).length}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {tickets.length}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tickets.filter((t) => !t.isCustomerNotified && t.status === 'UNPAID').length} {t.parking_kpi_waiting}
            </div>
          </div>

          {/* Otomatik Tarayıcı Durumu */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t.parking_kpi_bot}
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white leading-tight">
              {t.parking_kpi_bot_status}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t.parking_kpi_bot_desc}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.parking_tab_all} ({stats?.totalCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'UNPAID'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {t.parking_tab_unpaid} ({stats?.unpaidCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t.parking_tab_paid} ({stats?.paidCount || 0})
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.parking_search_placeholder}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-slate-50/50 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              {t.common_search}
            </button>
          </form>
        </div>

        {/* Tickets Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.common_loading}</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
              {t.parking_no_tickets}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {search || statusFilter !== 'ALL'
                ? t.common_no_data
                : (language === 'sr' ? 'Čestitamo! Nema evidentiranih parking kazni za vozila u floti.' : language === 'en' ? 'Great news! No parking tickets recorded for your fleet.' : 'Tebrikler! Belgrade Parking Servis sisteminde araçlarınıza ait herhangi bir ceza bulunamadı.')}
            </p>
            <button
              onClick={handleScanAll}
              disabled={scanning}
              className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.parking_scan_all}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700 font-bold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{t.parking_col_plate}</th>
                    <th className="py-3.5 px-4">{t.parking_col_location}</th>
                    <th className="py-3.5 px-4">{t.parking_col_ticket_no}</th>
                    <th className="py-3.5 px-4">{t.parking_col_amount}</th>
                    <th className="py-3.5 px-4">{t.parking_col_customer}</th>
                    <th className="py-3.5 px-4">{t.parking_col_status}</th>
                    <th className="py-3.5 px-4 text-right">{t.parking_col_actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((t) => {
                    const isUnpaid = t.status === 'UNPAID';
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isUnpaid ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Araç */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Link
                              href={`/vehicles/${t.vehicleId}`}
                              className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-amber-100 hover:border-amber-300 transition-colors text-xs font-mono"
                            >
                              {t.plate}
                            </Link>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">
                                {t.vehicle?.brand} {t.vehicle?.model}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Sahibi: {t.vehicle?.owner || 'Belirtilmedi'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Zaman & Konum */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-900 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(t.issueDate)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[200px]" title={t.street || ''}>
                              {t.street || 'Belgrad'}, {t.zone || ''}
                            </span>
                          </div>
                        </td>

                        {/* eDPK No */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {t.ticketNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Ref: {t.referenceNumber || '-'}
                          </div>
                        </td>

                        {/* Tutar */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 text-sm">
                            {t.amountRsd?.toLocaleString('tr-TR')} RSD
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            ~{t.amountEur || 0} €
                          </div>
                        </td>

                        {/* Müşteri */}
                        <td className="py-3.5 px-4">
                          {t.customer ? (
                            <div>
                              <Link
                                href={`/customers?search=${encodeURIComponent(t.customer.name)}`}
                                className="font-bold text-slate-900 hover:text-amber-600 transition-colors"
                              >
                                {t.customer.name}
                              </Link>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {t.customer.phone || '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Kirada Değildi / Müşteri Yok
                            </span>
                          )}
                        </td>

                        {/* Durum */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <button
                              onClick={() => handleToggleStatus(t)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                                isUnpaid
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              }`}
                              title="Durumu değiştirmek için tıklayın"
                            >
                              {isUnpaid ? (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  {t.parking_status_unpaid}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {t.parking_status_paid}
                                </>
                              )}
                            </button>

                            {/* WhatsApp Bildirildi Rozeti */}
                            {t.customer && (
                              <div>
                                {t.isCustomerNotified ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    {t.parking_notified}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    {language === 'sr' ? 'Nije Obavešten' : language === 'en' ? 'Not Notified' : 'Bildirilmedi'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Aksiyonlar */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Bildir butonu */}
                            {t.customer?.phone && (
                              <button
                                onClick={() => handleNotifyCustomerWhatsApp(t)}
                                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all shadow-xs cursor-pointer"
                                title={t.parking_notify_wa}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Tekil aracı yeniden tara */}
                            <button
                              onClick={() => handleScanVehicle(t.vehicleId, t.plate)}
                              disabled={singleScanningId === t.vehicleId}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                              title={t.parking_scan_all}
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${
                                  singleScanningId === t.vehicleId ? 'animate-spin text-amber-600' : ''
                                }`}
                              />
                            </button>

                            {/* Detay modal aç */}
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                              title={t.common_details}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {tickets.map((t) => {
                const isUnpaid = t.status === 'UNPAID';
                return (
                  <div
                    key={t.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs space-y-3 ${
                      isUnpaid ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/10' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header: Plaka & Durum */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/vehicles/${t.vehicleId}`}
                          className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-mono"
                        >
                          {t.plate}
                        </Link>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t.vehicle?.brand} {t.vehicle?.model}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(t)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isUnpaid
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        }`}
                      >
                        {isUnpaid ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            {t.parking_status_unpaid}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {t.parking_status_paid}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Detay Bilgileri */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-slate-400 font-semibold">{t.common_date}:</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDate(t.issueDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">{t.common_amount}:</div>
                        <div className="font-black text-rose-600 dark:text-rose-400 text-sm">
                          {t.amountRsd?.toLocaleString(language === 'sr' ? 'sr-RS' : language === 'en' ? 'en-US' : 'tr-TR')} RSD (~{t.amountEur} €)
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-slate-400 font-semibold">{t.parking_col_location}:</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {t.street || 'Belgrad'}, {t.zone || ''}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-slate-400 font-semibold">eDPK No:</div>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {t.ticketNumber} (Ref: {t.referenceNumber || '-'})
                        </div>
                      </div>
                    </div>

                    {/* Müşteri Bilgisi */}
                    {t.customer && (
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 font-medium">{t.common_customer}:</div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{t.customer.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.customer.phone}</div>
                        </div>
                        <div className="text-right">
                          {t.isCustomerNotified ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> {t.parking_notified}
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3" /> {language === 'sr' ? 'Nije Obavešten' : language === 'en' ? 'Not Notified' : 'Bildirilmedi'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-2 pt-1">
                      {t.customer?.phone && (
                        <button
                          onClick={() => handleNotifyCustomerWhatsApp(t)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{t.parking_notify_wa}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>{t.common_details}</span>
                      </button>

                      <button
                        onClick={() => handleScanVehicle(t.vehicleId, t.plate)}
                        disabled={singleScanningId === t.vehicleId}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                        title={t.parking_scan_all}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            singleScanningId === t.vehicleId ? 'animate-spin text-amber-600' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <Modal
            isOpen={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            title={language === 'sr' ? `Detalji Parking Kazne: ${selectedTicket.plate}` : language === 'en' ? `Parking Ticket Details: ${selectedTicket.plate}` : `Park Cezası Detayı: ${selectedTicket.plate}`}
          >
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Plaka ve Özet Kartı */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">{t.common_plate}</div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {selectedTicket.plate}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedTicket.vehicle?.brand} {selectedTicket.vehicle?.model}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase">{t.common_amount}</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {selectedTicket.amountRsd?.toLocaleString(language === 'sr' ? 'sr-RS' : language === 'en' ? 'en-US' : 'tr-TR')} RSD
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    ~{selectedTicket.amountEur} €
                  </div>
                </div>
              </div>

              {/* Bilgi Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold">
                    {language === 'sr' ? 'Broj eDPK Naloga:' : language === 'en' ? 'eDPK Ticket Number:' : 'eDPK Bilet Numarası:'}
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.ticketNumber}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold">
                    {language === 'sr' ? 'Poziv na broj (Referenca):' : language === 'en' ? 'Reference Number:' : 'Referans / Poziv na broj:'}
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.referenceNumber || selectedTicket.ticketNumber}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold">{t.common_date}:</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatDate(selectedTicket.issueDate)}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold">{t.parking_col_location}:</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.street || 'Belgrad'} ({selectedTicket.zone || 'Genel'})
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 sm:col-span-2">
                  <div className="text-slate-400 text-xs font-semibold">
                    {language === 'sr' ? 'Račun za uplatu Parking Servisu:' : language === 'en' ? 'Parking Servis Bank Account:' : 'Parking Servis Ödeme Hesabı:'}
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    205-251954-50 (Belgrade Parking Servis)
                  </div>
                </div>
              </div>

              {/* 50% İndirim Uyarısı */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t.parking_early_discount}: </span>
                  {language === 'sr'
                    ? 'Prema propisima Parking Servisa Beograd, ukoliko se kazna izmiri u roku od 20 dana od dana izdavanja, važi 50% popusta.'
                    : language === 'en'
                    ? 'Under Belgrade Parking Servis regulations, if paid within 20 days of issuance, a 50% discount applies.'
                    : 'Belgrad kurallarına göre eDPK cezasının kesildiği tarihten itibaren 20 gün içinde ödenmesi durumunda %50 indirimli ödeme hakkı bulunur.'}
                </div>
              </div>

              {/* Müşteri İletişim & WhatsApp */}
              {selectedTicket.customer && (
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                        {language === 'sr' ? 'Vozač / Klijent na dan kazne' : language === 'en' ? 'Customer on ticket date' : 'Ceza Tarihindeki Sürücü / Müşteri'}
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedTicket.customer.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{selectedTicket.customer.phone}</div>
                    </div>
                    <button
                      onClick={() => handleNotifyCustomerWhatsApp(selectedTicket)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t.parking_notify_wa}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Aksiyonlar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleToggleStatus(selectedTicket)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTicket.status === 'UNPAID'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {selectedTicket.status === 'UNPAID'
                    ? `✓ ${t.parking_mark_paid}`
                    : `✕ ${t.parking_status_unpaid}`}
                </button>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.common_close}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}

export default function ParkingTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <ParkingTicketsContent />
    </Suspense>
  );
}

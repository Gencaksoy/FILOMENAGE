'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Car,
  Users,
  Wrench,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  KeyRound,
  FileCheck2,
  Phone,
  ArrowRight,
  ShieldAlert,
  Droplet,
  UserCheck,
  TrendingUp,
  MessageCircle,
  Camera,
  CheckSquare,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  BarChart3,
  Flame,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { formatDate, formatCurrency, formatKm, formatRsd, EUR_TO_RSD_RATE, VEHICLE_STATUS_MAP } from '@/lib/formatters';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');

  // Modal: Return Rental (Teslim Alma + Aksesuar Checklist + Son Fotoğraflar + Bakıma Gönder)
  const [returningRental, setReturningRental] = useState<any | null>(null);
  const [returnKm, setReturnKm] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [sentToPostCheck, setSentToPostCheck] = useState<boolean>(false); // Varsayılan olarak serbest bırak, hatırlatıcı isteğe bağlı
  const [accessoriesChecklist, setAccessoriesChecklist] = useState<Record<string, boolean>>({
    'Telefon Tutucu': true,
    'Çakmaklık Şarj Aleti': true,
    'İlk Yardım Çantası': true,
    'Reflektör': true,
    'Paspas Seti': true,
  });
  const [showDeliveryPhotosModal, setShowDeliveryPhotosModal] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title?: string } | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Modal: Rental Extension (Süre Uzatma)
  const [extendingRental, setExtendingRental] = useState<any | null>(null);
  const [extendDays, setExtendDays] = useState<number | string>(30);
  const [extendAmount, setExtendAmount] = useState<number | string>(350);
  const [extendIsPaid, setExtendIsPaid] = useState<boolean>(true);
  const [extendNotes, setExtendNotes] = useState<string>('');
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);

  // Modal: Quick Rent (Araç Kirala + Yeni Müşteri Sekmesi + İskonto + 4 Fotoğraf)
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentCustomerMode, setRentCustomerMode] = useState<'existing' | 'new'>('existing');
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // New Customer within Rent Modal
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustIdNo, setNewCustIdNo] = useState('');

  // Rental details
  const [rentStartDate, setRentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentEndDate, setRentEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Varsayılan 1 ay
  );
  const [rentMonthlyRate, setRentMonthlyRate] = useState<number | string>(350);
  const [rentDiscount, setRentDiscount] = useState<number | string>(0);
  const [rentIsPaid, setRentIsPaid] = useState<boolean>(true);
  const [rentNotes, setRentNotes] = useState('');
  
  // 4 Delivery Photos
  const [photoFront, setPhotoFront] = useState<string>('/uploads/sample_car_front.svg');
  const [photoBack, setPhotoBack] = useState<string>('/uploads/sample_car_back.svg');
  const [photoRight, setPhotoRight] = useState<string>('/uploads/sample_car_right.svg');
  const [photoLeft, setPhotoLeft] = useState<string>('/uploads/sample_car_left.svg');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);

  // Modal: Quick Oil Change / Maintenance
  const [showOilModal, setShowOilModal] = useState(false);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [registeredShops, setRegisteredShops] = useState<any[]>([]);
  const [oilVehicleId, setOilVehicleId] = useState('');
  const [oilDate, setOilDate] = useState(new Date().toISOString().split('T')[0]);
  const [oilKm, setOilKm] = useState<number | string>('');
  const [oilType, setOilType] = useState('5W-30 Tam Sentetik');
  const [oilFilter, setOilFilter] = useState(true);
  const [oilCurrency, setOilCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [oilCost, setOilCost] = useState('75');
  const [oilService, setOilService] = useState('');
  const [oilNotes, setOilNotes] = useState('');
  const [oilPaidBy, setOilPaidBy] = useState('Atilla');
  const [isSubmittingOil, setIsSubmittingOil] = useState(false);

  // Analytics table filters & sorting
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsPartnerFilter, setAnalyticsPartnerFilter] = useState('ALL');
  const [analyticsSortBy, setAnalyticsSortBy] = useState<'totalExpense' | 'revenue' | 'netProfit' | 'serviceCount' | 'faultCount'>('totalExpense');

  const fetchData = async (owner: string = selectedOwner) => {
    try {
      const [meRes, dashRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/dashboard?owner=${encodeURIComponent(owner)}`),
      ]);

      if (meRes.ok) {
        const u = await meRes.json();
        setUser(u.user);
      } else {
        window.location.href = '/login';
        return;
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setData(dashData);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedOwner);

    // Emniyet kilidi: 5 saniye içinde yükleme tamamlanmazsa otomatik aç
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(safetyTimer);
  }, [selectedOwner]);

  const openRentModal = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        fetch('/api/vehicles?status=RENTABLE'),
        fetch('/api/customers'),
      ]);
      if (vRes.ok) {
        const vList = await vRes.json();
        setAvailableVehicles(vList);
        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].id);
          setRentMonthlyRate(vList[0].monthlyPrice || 350);
        }
      }
      if (cRes.ok) setCustomers(await cRes.json());
      setRentDiscount(0);
      setRentIsPaid(true);
      setShowRentModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVehicleSelectChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const found = availableVehicles.find((v) => v.id === vId);
    if (found) {
      setRentMonthlyRate(found.monthlyPrice || 350);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: data });
    if (!res.ok) throw new Error('Fotoğraf yüklenemedi');
    const json = await res.json();
    const url = json.fileUrl || json.url;
    if (!url) throw new Error('Fotoğraf adresi oluşturulamadı');
    return url;
  };

  const openOilModal = async (preselectedVehicleId?: string) => {
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/service-shops'),
      ]);
      if (vRes.ok) {
        const vList = await vRes.json();
        setAllVehicles(vList);
        if (preselectedVehicleId) {
          setOilVehicleId(preselectedVehicleId);
          const found = vList.find((v: any) => v.id === preselectedVehicleId);
          if (found) setOilKm(found.currentKm);
        } else if (vList.length > 0) {
          setOilVehicleId(vList[0].id);
          setOilKm(vList[0].currentKm);
        }
      }
      if (sRes.ok) {
        const shops = await sRes.json();
        setRegisteredShops(shops);
        if (shops.length > 0) setOilService(shops[0].name);
      }
      setShowOilModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Return Rental Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningRental) return;
    setIsSubmittingReturn(true);
    try {
      const checkedAccessoriesList = Object.entries(accessoriesChecklist)
        .filter(([_, checked]) => checked)
        .map(([name]) => name);

      const res = await fetch('/api/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: returningRental.rentalId,
          returnKm: returnKm ? parseInt(returnKm, 10) : undefined,
          notes: returnNotes,
          sentToPostCheck,
          returnAccessories: checkedAccessoriesList,
          returnInspectionNotes: `Aksesuarlar kontrol edildi (${checkedAccessoriesList.length} adet mevcut).`,
        }),
      });
      if (res.ok) {
        setReturningRental(null);
        setReturnKm('');
        setReturnNotes('');
        await fetchData(selectedOwner);
      } else {
        const err = await res.json();
        alert(err.error || 'İade işlemi yapılamadı');
      }
    } catch (e) {
      console.error(e);
      alert('İade işlemi sırasında hata oluştu.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Rent Submit
  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Lütfen araç seçiniz.');
      return;
    }

    let customerId = selectedCustomerId;

    setIsSubmittingRent(true);
    try {
      // Eğer "Yeni Müşteri Ekle" modundaysa önce müşteriyi oluştur
      if (rentCustomerMode === 'new') {
        if (!newCustName || !newCustPhone) {
          alert('Lütfen yeni müşteri adı ve telefonunu giriniz.');
          setIsSubmittingRent(false);
          return;
        }

        const cRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCustName,
            phone: newCustPhone,
            identityNo: newCustIdNo,
            notes: 'Hızlı kiralama modalından eklendi.',
          }),
        });

        if (!cRes.ok) {
          const err = await cRes.json();
          throw new Error(err.error || 'Yeni müşteri eklenemedi');
        }

        const newCust = await cRes.json();
        customerId = newCust.id;
      } else {
        if (!customerId) {
          alert('Lütfen kayıtlı bir müşteri seçiniz.');
          setIsSubmittingRent(false);
          return;
        }
      }

      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          customerId,
          startDate: rentStartDate,
          endDate: rentEndDate,
          monthlyRate: parseFloat(String(rentMonthlyRate)) || 350,
          discountAmount: parseFloat(String(rentDiscount)) || 0,
          isPaid: rentIsPaid,
          photoFront,
          photoBack,
          photoRight,
          photoLeft,
          notes: rentNotes,
        }),
      });

      if (res.ok) {
        setShowRentModal(false);
        setSelectedVehicleId('');
        setSelectedCustomerId('');
        setNewCustName('');
        setNewCustPhone('');
        setNewCustIdNo('');
        setRentNotes('');
        await fetchData(selectedOwner);
      } else {
        const err = await res.json();
        alert(err.error || 'Kiralama başlatılamadı');
      }
    } catch (e: any) {
      alert(e.message || 'Kiralama başlatılamadı');
    } finally {
      setIsSubmittingRent(false);
    }
  };

  // Oil Change Submit
  const handleOilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oilVehicleId) {
      alert('Lütfen araç seçiniz.');
      return;
    }
    setIsSubmittingOil(true);
    try {
      const res = await fetch('/api/oil-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: oilVehicleId,
          changeDate: oilDate,
          km: oilKm ? parseInt(String(oilKm), 10) : undefined,
          oilType,
          filterChanged: oilFilter,
          cost: parseFloat(oilCost) || 0,
          currency: oilCurrency,
          serviceName: oilService,
          notes: oilNotes,
          paidBy: oilPaidBy,
        }),
      });
      if (res.ok) {
        setShowOilModal(false);
        setOilNotes('');
        await fetchData(selectedOwner);
      } else {
        const err = await res.json();
        alert(err.error || 'Yağ değişimi eklenemedi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingOil(false);
    }
  };

  // Extend Rental Submit
  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingRental) return;
    setIsSubmittingExtend(true);
    try {
      const res = await fetch('/api/rentals/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: extendingRental.rentalId,
          additionalDays: parseInt(String(extendDays), 10) || 30,
          additionalAmount: parseFloat(String(extendAmount)) || 0,
          isPaid: extendIsPaid,
          notes: extendNotes,
        }),
      });
      if (res.ok) {
        setExtendingRental(null);
        setExtendNotes('');
        await fetchData(selectedOwner);
      } else {
        const err = await res.json();
        alert(err.error || 'Süre uzatma işlemi başarısız oldu.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Süre uzatma sırasında bir hata oluştu.');
    } finally {
      setIsSubmittingExtend(false);
    }
  };



  const isStaff = data?.isStaff || user?.role === 'STAFF';
  const kpi = data?.kpi || {
    totalVehicles: 0,
    rentedVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    postRentalCheckVehicles: 0,
  };

  const forecast = data?.forecast || {
    returnsOverdueCount: 0,
    returnsTodayCount: 0,
    returnsNext3DaysCount: 0,
    returnsNext7DaysCount: 0,
    returnsNext14DaysCount: 0,
    returnsLaterCount: 0,
  };

  const upcomingReturns = data?.upcomingReturns || [];
  const registrationAlerts = data?.registrationAlerts || [];
  const activeFaults = data?.activeFaults || [];
  const activeFaultsCount = data?.activeFaultsCount || 0;
  const ownersList = data?.ownersList || [];
  const partnerStats = data?.partnerStats || {};
  const fleetFinancials = data?.fleetFinancials;
  const topExpenseVehicles = data?.topExpenseVehicles || [];
  const topFaultVehicles = data?.topFaultVehicles || [];
  const vehicleAnalytics = data?.vehicleAnalytics || [];

  const filteredVehicleAnalytics = (vehicleAnalytics || [])
    .filter((item: any) => {
      if (analyticsPartnerFilter !== 'ALL' && item.owner !== analyticsPartnerFilter) return false;
      if (!analyticsSearch) return true;
      const s = analyticsSearch.toLowerCase();
      return (
        item.plate.toLowerCase().includes(s) ||
        item.brand.toLowerCase().includes(s) ||
        item.model.toLowerCase().includes(s) ||
        (item.chronicIssues && item.chronicIssues.toLowerCase().includes(s))
      );
    })
    .sort((a: any, b: any) => {
      if (analyticsSortBy === 'totalExpense') return (b.totalExpense || 0) - (a.totalExpense || 0);
      if (analyticsSortBy === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
      if (analyticsSortBy === 'netProfit') return (b.netProfit || 0) - (a.netProfit || 0);
      if (analyticsSortBy === 'serviceCount') return (b.serviceCount || 0) - (a.serviceCount || 0);
      if (analyticsSortBy === 'faultCount') return (b.faultCount || 0) - (a.faultCount || 0);
      return 0;
    });

  // Final calculated monthly rent in form
  const formBasePrice = parseFloat(String(rentMonthlyRate)) || 350;
  const formDiscountVal = parseFloat(String(rentDiscount)) || 0;
  const formFinalPrice = Math.max(0, formBasePrice - formDiscountVal);

  return (
    <AppLayout currentUser={user}>
      {/* Top Banner & Quick Switch */}
      <div className="mb-5 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
                BELGRAD OPERASYON
              </span>
              <span className="text-xs text-slate-400 font-mono">1 EUR = 117 RSD</span>
              {isStaff && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  Çalışan Modu (Veri Girişi Aktif)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 text-white tracking-tight">
              Filo Yönetim & Kiralama Takip Paneli
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Filo araçları, Registracija muayene takvimi, teslimat kontrolleri ve amortisman takibi.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={openRentModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Araç Kirala
            </button>
            <button
              onClick={() => openOilModal()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Droplet className="w-4 h-4" />
              Yağ Değişimi
            </button>
          </div>
        </div>

        {/* Partner Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-700/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/70 p-1 rounded-xl border border-slate-700/50 flex-wrap">
            <button
              onClick={() => setSelectedOwner('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOwner === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tüm Filo ({kpi.totalVehicles})
            </button>
            {(ownersList || []).map((ownerName: string) => (
              <button
                key={ownerName}
                onClick={() => setSelectedOwner(ownerName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedOwner === ownerName
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ownerName} ({partnerStats[ownerName]?.totalVehicles || 0})
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData(selectedOwner)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CRITICAL ALERTS: Zorunlu Registracija Bitiş Uyarıları (Register olmadan trafiğe çıkamaz!) */}
      {registrationAlerts.length > 0 && (
        <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-sm font-black text-rose-950 uppercase tracking-wide">
              Zorunlu Araç Registracija (Tescil) Süresi Biten / Yaklaşan Araçlar
            </h3>
          </div>
          <p className="text-xs text-rose-800 mb-3">
            Sırbistan yasalarına göre register süresi biten araç trafiğe çıkamaz. Lütfen süresi bitmeden yenileyiniz.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {registrationAlerts.map((ra: any) => (
              <div
                key={ra.vehicleId}
                className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <Link
                    href={`/vehicles/${ra.vehicleId}`}
                    className="font-mono font-bold text-xs text-rose-900 hover:underline"
                  >
                    {ra.plate}
                  </Link>
                  <div className="text-xs text-slate-600">
                    {ra.brand} {ra.model} ({ra.owner})
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-black font-mono ${
                    ra.isExpired
                      ? 'bg-rose-600 text-white'
                      : ra.isUrgent
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {ra.isExpired ? 'SÜRESİ BİTTİ!' : `${ra.diffDays} gün kaldı`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AKTİF ARAÇ ARIZALARI & HASAR BİLDİRİMLERİ (DÜZELTİLDİYE ÇEVİRME) */}
      {activeFaults.length > 0 && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Bekleyen Araç Arızaları & Hasar Kayıtları ({activeFaultsCount})
              </h3>
            </div>
            <Link
              href="/vehicles?status=FAULTS"
              className="text-xs font-bold text-amber-900 hover:text-amber-700 underline flex items-center gap-1"
            >
              Tüm Arızalı Araçları Gör <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-amber-800 mb-3">
            Aşağıdaki araçlarda aktif arıza bildirimleri var. Arıza giderildiğinde aracın detayından "Düzeltildi" olarak işaretleyin.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activeFaults.slice(0, 6).map((af: any) => (
              <div
                key={af.id}
                className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                      {af.vehicle?.plate}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-black uppercase ${
                        af.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : af.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : af.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {af.severity === 'CRITICAL'
                        ? 'Kritik / Acil'
                        : af.severity === 'HIGH'
                        ? 'Yüksek'
                        : af.severity === 'MEDIUM'
                        ? 'Orta'
                        : 'Düşük'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">{af.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {af.vehicle?.brand} {af.vehicle?.model} • Sahip: <b>{af.vehicle?.owner}</b>
                  </div>
                  {af.description && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                      "{af.description}"
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {formatDate(af.reportedDate || af.createdAt)}
                  </span>
                  <Link
                    href={`/vehicles/${af.vehicleId}?tab=faults`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span>İncele & Düzelt</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {/* 1. Aktif Kirada */}
        <Link
          href="/vehicles?status=RENTED"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-600">Kirada</span>
            <KeyRound className="w-4 h-4 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 group-hover:text-amber-600">{kpi.rentedVehicles}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Müşteride çalışan</span>
            <span className="text-xs font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Listele →</span>
          </div>
        </Link>

        {/* 2. Boşta (Hazır) */}
        <Link
          href="/vehicles?status=AVAILABLE"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-600">Boşta (Hazır)</span>
            <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{kpi.availableVehicles}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Kiralanmaya hazır</span>
            <span className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Listele →</span>
          </div>
        </Link>

        {/* 3. Kiradan Sonra Bakım */}
        <Link
          href="/vehicles?status=POST_RENTAL_CHECK"
          className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Kira Sonrası Kontrol</span>
            <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{kpi.postRentalCheckVehicles}</div>
          <div className="text-xs text-purple-600 mt-1 flex items-center justify-between">
            <span>Yıkama & kontrol</span>
            <span className="text-xs font-bold text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity">Listele →</span>
          </div>
        </Link>

        {/* 4. Serviste / Bakımda */}
        <Link
          href="/vehicles?status=MAINTENANCE"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-400 hover:shadow-md transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600">Serviste</span>
            <Wrench className="w-4 h-4 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{kpi.maintenanceVehicles}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Tamir & bakımda</span>
            <span className="text-xs font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Listele →</span>
          </div>
        </Link>

        {/* 5. 1 Hafta Sonra Boşa Çıkacak */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">1 Hafta İçinde Dönecek</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">{forecast.returnsNext7DaysCount}</div>
          <div className="text-xs text-blue-600 mt-1">Gelecek 7 günde iade</div>
        </div>
      </div>

      {/* FİLO İSTATİSTİKLERİ, ARAÇ BAŞINA MASRAF & ARIZA ANALİTİĞİ (YALNIZCA ADMIN / ORTAKLAR GÖRÜR) */}
      {!isStaff && fleetFinancials && (
        <div className="mb-6 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
          {/* 1. Üst Başlık & Özet Barı */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Filo Bütünü & İstatistik Paneli
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filo bütünü, araç başına masraf ve ciro analizi, en çok masraf çıkaran ve arıza yapan araçlar
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                %{fleetFinancials.fleetAmortizationPercent} Amorti Edildi
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Doluluk: %{fleetFinancials.occupancyRate}
              </span>
            </div>
          </div>

          {/* 2. Filo Bütünü - 6 Temel Metrik Kartı */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Toplam Ciro (Kira)</div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {formatCurrency(fleetFinancials.totalFleetRevenue, 'EUR')}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                Ort. {formatCurrency(fleetFinancials.avgRevenuePerVehicle, 'EUR')} / araç
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Toplam Masraflar</div>
              <div className="text-lg sm:text-xl font-black text-rose-700 mt-1">
                {formatCurrency(fleetFinancials.totalFleetExpenses, 'EUR')}
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5 font-medium truncate" title="Bakım + Yağ + Muayene">
                Bakım: {formatCurrency(fleetFinancials.breakdown?.maintenance || 0, 'EUR')}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Kâr / Bakiye</div>
              <div className={`text-lg sm:text-xl font-black mt-1 ${fleetFinancials.fleetNetProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatCurrency(fleetFinancials.fleetNetProfit, 'EUR')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                {fleetFinancials.fleetNetProfit >= 0 ? 'Pozitif Nakit Akışı' : 'Zararda'}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Araç Başı Masraf</div>
              <div className="text-lg sm:text-xl font-black text-amber-900 mt-1">
                {formatCurrency(fleetFinancials.avgExpensePerVehicle, 'EUR')}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                Ortalama maliyet
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Filo Doluluk</div>
              <div className="text-lg sm:text-xl font-black text-blue-700 mt-1">
                %{fleetFinancials.occupancyRate}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5 font-medium">
                {kpi.rentedVehicles} / {kpi.totalVehicles} araç kirada
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Amorti Kalan</div>
              <div className="text-lg sm:text-xl font-black text-purple-900 mt-1">
                {formatCurrency(fleetFinancials.fleetRemainingAmortization, 'EUR')}
              </div>
              <div className="text-[10px] text-purple-600 mt-0.5 font-medium">
                Yatırım: {formatCurrency(fleetFinancials.totalFleetInvestment, 'EUR')}
              </div>
            </div>
          </div>

          {/* Kompakt Amortisman İlerleme Çubuğu */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Yatırımın Kendini Çıkarma İlerlemesi (Satın Alma + İlk Masraflar vs Net Kira Geliri)
              </span>
              <span className="text-emerald-700 font-extrabold">%{fleetFinancials.fleetAmortizationPercent}</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${fleetFinancials.fleetAmortizationPercent}%` }}
              />
            </div>
          </div>

          {/* 3. İKİ SÜTUNLU HIZLI ANALİZ: EN ÇOK MASRAF ÇIKARANLAR & EN ÇOK ARIZA YAPANLAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SOL KART: EN ÇOK MASRAF ÇIKARAN ARAÇLAR */}
            <div className="bg-gradient-to-br from-rose-50/40 via-white to-slate-50/50 rounded-2xl border border-rose-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                    <Flame className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">En Çok Masraf Çıkaran Araçlar</h3>
                    <p className="text-[11px] text-slate-500">Bakım, parça, yağ ve muayene dahil en maliyetli araçlar</p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                  TOP {topExpenseVehicles.length}
                </span>
              </div>

              {topExpenseVehicles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Henüz masraf kaydı bulunan araç bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {topExpenseVehicles.map((v: any, idx: number) => {
                    const maxVal = topExpenseVehicles[0]?.totalExpense || 1;
                    const percent = Math.min(100, Math.round((v.totalExpense / maxVal) * 100));

                    return (
                      <div key={v.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-rose-300 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 truncate">
                              {v.plate}
                            </span>
                            <span className="text-xs text-slate-600 truncate hidden sm:inline">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 shrink-0">
                              {v.owner}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-rose-600">
                              {formatCurrency(v.totalExpense, 'EUR')}
                            </span>
                          </div>
                        </div>

                        {/* Alt Kırılım Hapları */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 mb-2">
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100">
                            🔧 Bakım: <strong className="text-slate-800">{formatCurrency(v.maintCost, 'EUR')}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100">
                            🛢️ Yağ: <strong className="text-slate-800">{formatCurrency(v.oilCost, 'EUR')}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100">
                            📋 Tescil: <strong className="text-slate-800">{formatCurrency(v.inspCost, 'EUR')}</strong>
                          </span>
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="ml-auto text-amber-600 hover:text-amber-700 font-bold hover:underline"
                          >
                            İncele →
                          </Link>
                        </div>

                        {/* Harcama Oran Çubuğu */}
                        <div className="w-full bg-rose-50 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SAĞ KART: EN ÇOK ARIZA YAPAN & KRONİK SORUNLU ARAÇLAR */}
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50/50 rounded-2xl border border-amber-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">En Çok Arıza & Kronik Sorunlu Araçlar</h3>
                    <p className="text-[11px] text-slate-500">Arıza sıklığı, devam eden sorunlar ve kronik arızalar</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  TOP {topFaultVehicles.length}
                </span>
              </div>

              {topFaultVehicles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Filoda açık arızası veya kronik problemi olan araç bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {topFaultVehicles.map((v: any, idx: number) => {
                    return (
                      <div key={v.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 truncate">
                              {v.plate}
                            </span>
                            <span className="text-xs text-slate-600 truncate hidden sm:inline">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 shrink-0">
                              {v.owner}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {v.activeFaultCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                🔴 {v.activeFaultCount} Devam Eden
                              </span>
                            ) : v.faultCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                ⚠️ {v.faultCount} Arıza
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                🛠️ {v.serviceCount} Servis
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kronik Arıza Varsa Belirgin Uyarı */}
                        {v.hasChronic && (
                          <div className="mt-1.5 p-2 bg-amber-50/80 rounded-lg border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Kronik Sorun:</strong> {v.chronicIssues}
                            </div>
                          </div>
                        )}

                        {/* Alt Bilgi & Detay Linki */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                          <span>
                            Toplam <strong>{v.serviceCount}</strong> kez servise/bakıma girdi
                          </span>
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                          >
                            Aracı İncele →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. ARAÇ BAŞINA DETAYLI MASRAF, GELİR & KÂR/ZARAR TABLOSU */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  Araç Başına Detaylı Masraf, Gelir & Performans Tablosu
                </h3>
                <p className="text-xs text-slate-500">
                  Her aracın kazandırdığı kira cirosu, yapılan toplam masrafı ve net kârlılığı ({filteredVehicleAnalytics.length} araç)
                </p>
              </div>

              {/* Filtre ve Arama Barı */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={analyticsSearch}
                    onChange={(e) => setAnalyticsSearch(e.target.value)}
                    placeholder="Plaka, marka, model ara..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <select
                  value={analyticsPartnerFilter}
                  onChange={(e) => setAnalyticsPartnerFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">Tüm Ortaklar</option>
                  {(ownersList || []).map((o: string) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>

                <select
                  value={analyticsSortBy}
                  onChange={(e) => setAnalyticsSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="totalExpense">En Çok Masraf Çıkaran</option>
                  <option value="revenue">En Yüksek Ciro</option>
                  <option value="netProfit">En Yüksek Net Kâr</option>
                  <option value="serviceCount">En Çok Servise Giren</option>
                  <option value="faultCount">En Çok Arıza Yapan</option>
                </select>
              </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Araç</th>
                    <th className="py-3 px-3">Sahip</th>
                    <th className="py-3 px-3">Durum</th>
                    <th className="py-3 px-3 text-right">Kira Geliri</th>
                    <th className="py-3 px-3 text-right">Bakım</th>
                    <th className="py-3 px-3 text-right">Yağ</th>
                    <th className="py-3 px-3 text-right">Tescil/Muayene</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900">Toplam Masraf</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900">Net Katkı</th>
                    <th className="py-3 px-3 text-center">Masraf/Ciro</th>
                    <th className="py-3 px-3 text-center">Arıza & Servis</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium">
                  {filteredVehicleAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-xs text-slate-400">
                        Kriterlere uygun araç bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicleAnalytics.map((v: any) => {
                      const isProfitPositive = (v.netProfit || 0) >= 0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-black text-slate-900">{v.plate}</div>
                            <div className="text-[11px] text-slate-500">
                              {v.brand} {v.model} ({v.modelYear})
                            </div>
                            {v.hasChronic && (
                              <div className="text-[10px] text-amber-700 font-semibold truncate max-w-xs mt-0.5" title={v.chronicIssues}>
                                ⚠️ {v.chronicIssues}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {v.owner}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.status === 'RENTED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : v.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : v.status === 'MAINTENANCE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {VEHICLE_STATUS_MAP[v.status]?.label || v.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {formatCurrency(v.revenue || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {formatCurrency(v.maintCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {formatCurrency(v.oilCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {formatCurrency(v.inspCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-600">
                            {formatCurrency(v.totalExpense || 0, 'EUR')}
                          </td>
                          <td className={`py-3 px-3 text-right font-black ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(v.netProfit || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              (v.expenseRatio || 0) > 50 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              %{v.expenseRatio || 0}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {v.activeFaultCount > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                                  🔴 {v.activeFaultCount}
                                </span>
                              ) : null}
                              <span className="text-[11px] text-slate-600">
                                {v.serviceCount} Servis
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Link
                              href={`/vehicles/${v.id}`}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors inline-block"
                            >
                              Detay →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* YAKLAŞAN GERİ ALIMLAR & 3 GÜN WHATSAPP HATIRLATMA PANELİ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Araç Geri Alımları & WhatsApp İade Hatırlatmaları
            </h2>
            <p className="text-xs text-slate-500">
              Kira süresi dolan veya 3 gün kalan müşterilere tek tıkla WhatsApp bildirimi gönderin
            </p>
          </div>
        </div>

        {upcomingReturns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Şu anda aktif kirada araç bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReturns.map((item: any) => (
              <div
                key={item.rentalId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  item.badgeType === 'DANGER'
                    ? 'bg-rose-50/50 border-rose-200'
                    : item.diffDays <= 3
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      item.badgeType === 'DANGER'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/vehicles/${item.vehicleId}`}
                        className="font-mono font-black text-sm text-slate-900 hover:text-amber-600"
                      >
                        {item.plate}
                      </Link>
                      <span className="text-xs font-bold text-slate-700">
                        {item.brand} {item.model}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        Sahip: {item.owner}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                      <span>Müşteri: <b className="text-slate-900">{item.customerName}</b></span>
                      <span>•</span>
                      <span className="font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.customerPhone}
                      </span>
                      <span>•</span>
                      <span>İade Tarihi: <b className="font-mono">{formatDate(item.endDate)}</b></span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black ${
                          item.badgeType === 'DANGER'
                            ? 'bg-rose-600 text-white'
                            : item.diffDays <= 3
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.statusText}
                      </span>

                      {item.extensionCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          🔄 {item.extensionCount} Kez Uzatıldı
                        </span>
                      )}

                      {/* Teslimat Fotoğraflarını İncele */}
                      {item.photos?.front && (
                        <button
                          type="button"
                          onClick={() => setShowDeliveryPhotosModal(item)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          4 Teslimat Fotoğrafı
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: WhatsApp Link + Süre Uzat + Return Car Button */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  {/* WhatsApp Reminder Button */}
                  <a
                    href={item.whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Müşteriye WhatsApp ile iade hatırlatma mesajı gönder"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp ile Hatırlat
                  </a>

                  {/* Süre Uzat Button */}
                  <button
                    onClick={() => {
                      setExtendingRental(item);
                      setExtendDays(30);
                      setExtendAmount(item.monthlyRate || 350);
                      setExtendIsPaid(true);
                      setExtendNotes('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Kiralama süresini uzat"
                  >
                    <Clock className="w-4 h-4" />
                    Süre Uzat
                  </button>

                  {/* Aracı Teslim Al */}
                  <button
                    onClick={() => {
                      setReturningRental(item);
                      setReturnKm('');
                      setSentToPostCheck(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Aracı Teslim Al
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: KİRALAMA SÜRESİ UZATMA (Varsayılan 30 Gün + Tutar + Ödeme Durumu) */}
      {extendingRental && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto pt-safe pb-safe">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Kiralama Süresini Uzat ({extendingRental.plate})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Müşteri: <b className="text-slate-800">{extendingRental.customerName}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendingRental(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Mevcut İade Tarihi:</span>
                <span className="font-bold font-mono text-slate-800">{formatDate(extendingRental.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mevcut Toplam Tutar:</span>
                <span className="font-bold font-mono text-slate-800">{extendingRental.totalAmount ? `${extendingRental.totalAmount} €` : '-'}</span>
              </div>
              {extendingRental.extensionCount > 0 && (
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>Daha Önceki Uzatmalar:</span>
                  <span>{extendingRental.extensionCount} kez uzatıldı</span>
                </div>
              )}
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uzatılacak Gün Sayısı (Varsayılan 30 Gün) *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[7, 15, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setExtendDays(days);
                        const monthly = extendingRental.monthlyRate || 350;
                        const calculated = Math.round((monthly / 30) * days);
                        setExtendAmount(calculated);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        Number(extendDays) === days
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{days} Gün
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  required
                  min={1}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold font-mono"
                  placeholder="Örn: 30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ek Dönem Kira Bedeli (€) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={extendAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExtendAmount(e.target.value)}
                  required
                  min={0}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold font-mono"
                  placeholder="Örn: 350"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Bu tutar mevcut sözleşme toplamına otomatik eklenecektir.
                </span>
              </div>

              {/* Kira Bedeli Ödendi mi Teyidi */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Uzatma Ücreti Tahsil Edildi mi?</div>
                  <div className="text-[11px] text-emerald-700">Ödeme alındı olarak işaretle</div>
                </div>
                <input
                  type="checkbox"
                  checked={extendIsPaid}
                  onChange={(e) => setExtendIsPaid(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uzatma Notu (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  placeholder="Müşteri telefonla teyit etti, ödeme elden alındı..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendingRental(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExtend}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingExtend ? 'Uzatılıyor...' : 'Süreyi Uzat & Onayla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ARACI TESLİM AL (Aksesuar Checklist + Bakıma Gönder + Fotoğraf Karşılaştırma) */}
      {returningRental && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto pt-safe pb-safe">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              Aracı Müşteriden Teslim Al ({returningRental.plate})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aksesuarları kontrol edip aracın kiradan sonraki durumunu belirleyiniz.
            </p>

            {/* Süre Uzatma Yönlendirme Banner */}
            <div className="mt-3 p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-950">Müşteri teslim yerine süreyi uzatmak mı istiyor?</div>
                <div className="text-[11px] text-indigo-700">Aracı teslim almadan 30 gün uzatabilirsiniz.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = returningRental;
                  setReturningRental(null);
                  setExtendingRental(target);
                  setExtendDays(30);
                  setExtendAmount(target.monthlyRate || 350);
                  setExtendIsPaid(true);
                  setExtendNotes('');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                ⏱️ Süre Uzatmaya Geç
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teslim Alınan Güncel KM
                </label>
                <input
                  type="number"
                  value={returnKm}
                  onChange={(e) => setReturnKm(e.target.value)}
                  placeholder="Örn: 78900"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 font-mono font-bold"
                />
              </div>

              {/* Aksesuar Checklist Kontrolü (İstenen Özellik!) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Araç İçi Aksesuar Kontrolü (Teslim Alınırken)
                </span>
                <div className="space-y-2 text-xs">
                  {Object.keys(accessoriesChecklist).map((acc) => (
                    <label key={acc} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accessoriesChecklist[acc]}
                        onChange={(e) =>
                          setAccessoriesChecklist({
                            ...accessoriesChecklist,
                            [acc]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-amber-500 rounded-md focus:ring-amber-400"
                      />
                      <span className="text-slate-700 font-medium">{acc} (Araçta Mevcut)</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kiradan Sonra Bakım / Temizliğe Gönderilsin mi? (İstenen Özellik!) */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-950">Kiradan Sonra Bakım & Temizliğe Alınsın mı?</div>
                  <div className="text-xs text-purple-700">
                    Yeni kiracıya verilmeden önce iç-dış yıkama ve kontrol aşamasına geçer.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sentToPostCheck}
                  onChange={(e) => setSentToPostCheck(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded-md focus:ring-purple-400 cursor-pointer"
                />
              </div>

              {/* Teslimat Fotoğraflarını Aç & Karşılaştır */}
              {returningRental.photos?.front && (
                <button
                  type="button"
                  onClick={() => setShowDeliveryPhotosModal(returningRental)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  Kira Başındaki 4 Kondisyon Fotoğrafını Aç & İncele
                </button>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İade Notları & Varsa Yeni Çizik/Hasar
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Araç temiz teslim alındı, aksesuarlar tam..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturningRental(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingReturn ? 'İşleniyor...' : 'Teslimatı Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 4 TESLİMAT FOTOĞRAFINI GÖRÜNTÜLE */}
      {showDeliveryPhotosModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Kira Başlangıcı 4 Cephe Fotoğrafları ({showDeliveryPhotosModal.plate})
                </h3>
                <p className="text-xs text-slate-500">
                  Teslim anındaki kondisyon fotoğraflarını inceleyerek hasar karşılaştırması yapın.
                </p>
              </div>
              <button
                onClick={() => setShowDeliveryPhotosModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <div className="p-2 text-xs font-bold text-slate-700 bg-slate-100 flex items-center justify-between">
                  <span>1. ÖN CEPHE</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> Büyüt
                  </span>
                </div>
                <div
                  onClick={() =>
                    setLightboxImage({
                      src: showDeliveryPhotosModal.photos?.front || '/uploads/sample_car_front.svg',
                      title: `1. Ön Cephe Fotoğrafı - ${showDeliveryPhotosModal.plate || ''}`,
                    })
                  }
                  className="cursor-zoom-in relative group"
                >
                  <img
                    src={showDeliveryPhotosModal.photos?.front || '/uploads/sample_car_front.svg'}
                    alt="Ön Fotoğraf"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[1px]">
                    <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <div className="p-2 text-xs font-bold text-slate-700 bg-slate-100 flex items-center justify-between">
                  <span>2. ARKA CEPHE</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> Büyüt
                  </span>
                </div>
                <div
                  onClick={() =>
                    setLightboxImage({
                      src: showDeliveryPhotosModal.photos?.back || '/uploads/sample_car_back.svg',
                      title: `2. Arka Cephe Fotoğrafı - ${showDeliveryPhotosModal.plate || ''}`,
                    })
                  }
                  className="cursor-zoom-in relative group"
                >
                  <img
                    src={showDeliveryPhotosModal.photos?.back || '/uploads/sample_car_back.svg'}
                    alt="Arka Fotoğraf"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[1px]">
                    <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <div className="p-2 text-xs font-bold text-slate-700 bg-slate-100 flex items-center justify-between">
                  <span>3. SAĞ CEPHE</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> Büyüt
                  </span>
                </div>
                <div
                  onClick={() =>
                    setLightboxImage({
                      src: showDeliveryPhotosModal.photos?.right || '/uploads/sample_car_right.svg',
                      title: `3. Sağ Cephe Fotoğrafı - ${showDeliveryPhotosModal.plate || ''}`,
                    })
                  }
                  className="cursor-zoom-in relative group"
                >
                  <img
                    src={showDeliveryPhotosModal.photos?.right || '/uploads/sample_car_right.svg'}
                    alt="Sağ Fotoğraf"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[1px]">
                    <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <div className="p-2 text-xs font-bold text-slate-700 bg-slate-100 flex items-center justify-between">
                  <span>4. SOL CEPHE</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> Büyüt
                  </span>
                </div>
                <div
                  onClick={() =>
                    setLightboxImage({
                      src: showDeliveryPhotosModal.photos?.left || '/uploads/sample_car_left.svg',
                      title: `4. Sol Cephe Fotoğrafı - ${showDeliveryPhotosModal.plate || ''}`,
                    })
                  }
                  className="cursor-zoom-in relative group"
                >
                  <img
                    src={showDeliveryPhotosModal.photos?.left || '/uploads/sample_car_left.svg'}
                    alt="Sol Fotoğraf"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[1px]">
                    <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDeliveryPhotosModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARAÇ KİRALA (Yeni Müşteri Sekmesi + İskonto + Ödeme Teyit + 4 Fotoğraf) */}
      {showRentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Yeni Araç Kiralama Başlat (Belgrad)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Varsayılan aylık periyot, isteğe bağlı iskonto, ödeme teyidi ve 4 teslimat fotoğrafı.
            </p>

            <form onSubmit={handleRentSubmit} className="space-y-4 mt-4">
              {/* Araç Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiralanacak Araç (Boşta & Kiralanabilir Araçlar) *
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleSelectChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 font-bold bg-white"
                >
                  <option value="">-- Araç Seçin --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} – {v.brand} {v.model} ({v.owner}) - Standart: {v.monthlyPrice || 350} €/ay
                      {v.status === 'POST_RENTAL_CHECK' ? ' [🧼 Yıkama/Kontrol Bekliyor - Kiralanabilir]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Müşteri Seçimi / Yeni Müşteri Ekle Sekmesi (İstenen Özellik!) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Müşteri Tanımı</span>
                  <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRentCustomerMode('existing')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                        rentCustomerMode === 'existing'
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Kayıtlı Müşteri
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentCustomerMode('new')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                        rentCustomerMode === 'new'
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      + Yeni Müşteri Ekle
                    </button>
                  </div>
                </div>

                {rentCustomerMode === 'existing' ? (
                  <div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 bg-white"
                    >
                      <option value="">-- Kayıtlı Müşterilerden Seçiniz --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Müşteri Ad Soyad *"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Telefon (+381 ...) *"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Pasaport / Kimlik No"
                      value={newCustIdNo}
                      onChange={(e) => setNewCustIdNo(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Kiralama Tarihleri (Varsayılan 1 Ay) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={rentStartDate}
                    onChange={(e) => setRentStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitiş Tarihi (Varsayılan 1 Ay) *
                  </label>
                  <input
                    type="date"
                    value={rentEndDate}
                    onChange={(e) => setRentEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Sabit Kira & İskonto Yapabilme (İstenen Özellik!) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Standart Aylık Kira (€)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={rentMonthlyRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRentMonthlyRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    İskonto / İndirim (€)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={rentDiscount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRentDiscount(e.target.value)}
                    placeholder="Örn: 30"
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl font-bold bg-white text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Net Anlaşılan Kira (€)
                  </label>
                  <div className="px-3 py-2 bg-amber-200/80 rounded-xl font-black text-sm text-slate-950">
                    {formFinalPrice} € / Ay
                  </div>
                </div>
              </div>

              {/* Kira Bedeli Ödendi mi Teyidi (İstenen Özellik!) */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Kira Bedeli Ödendi mi / Tahsil Edildi mi?</div>
                  <div className="text-xs text-emerald-700">Kira başlangıcı için ödeme teyidi</div>
                </div>
                <input
                  type="checkbox"
                  checked={rentIsPaid}
                  onChange={(e) => setRentIsPaid(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* 4 Kondisyon Fotoğrafı (Ön, Arka, Sağ, Sol) (İstenen Özellik!) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Teslim Anı 4 Cephe Fotoğrafları (Ön, Arka, Sağ, Sol)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ön Fotoğraf</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          setPhotoFront(url);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Arka Fotoğraf</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          setPhotoBack(url);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Sağ Fotoğraf</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          setPhotoRight(url);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Sol Fotoğraf</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          setPhotoLeft(url);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={rentNotes}
                  onChange={(e) => setRentNotes(e.target.value)}
                  placeholder="Kiralama koşulları, ek aksesuarlar..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRent}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingRent ? 'İşleniyor...' : 'Kiralamayı Başlat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOTOR YAĞI DEĞİŞİMİ (EUR / Dinar Çift Para Birimi + Kayıtlı Servis Seçimi) */}
      {showOilModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-emerald-600" />
              Hızlı Motor Yağı Değişimi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              EUR veya Dinar olarak girin (1 EUR = 117 RSD sabit kur ile hesaplanır).
            </p>

            <form onSubmit={handleOilSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Seçiniz *</label>
                <select
                  required
                  value={oilVehicleId}
                  onChange={(e) => {
                    setOilVehicleId(e.target.value);
                    const found = allVehicles.find((v) => v.id === e.target.value);
                    if (found) setOilKm(found.currentKm);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="">-- Araç Seçin --</option>
                  {allVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} – {v.brand} {v.model} ({formatKm(v.currentKm)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Değişim Tarihi *</label>
                  <input
                    type="date"
                    value={oilDate}
                    onChange={(e) => setOilDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Güncel KM *</label>
                  <input
                    type="number"
                    value={oilKm}
                    onChange={(e) => setOilKm(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Para Birimi & Maliyet Girişi (EUR / RSD) (İstenen Özellik!) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Para Birimi</label>
                  <select
                    value={oilCurrency}
                    onChange={(e) => setOilCurrency(e.target.value as 'EUR' | 'RSD')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="RSD">RSD (Sırbistan Dinarı)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tutar ({oilCurrency})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={oilCost}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setOilCost(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="col-span-2 text-xs text-slate-500 font-mono">
                  {oilCurrency === 'RSD'
                    ? `EUR Karşılığı: ~${Math.round(((parseFloat(oilCost) || 0) / EUR_TO_RSD_RATE) * 100) / 100} €`
                    : `Dinar Karşılığı: ~${Math.round((parseFloat(oilCost) || 0) * EUR_TO_RSD_RATE)} RSD`}
                </div>
              </div>

              {/* Kayıtlı Servis Seçimi veya Yeni Servis (İstenen Özellik!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Servis (Kayıtlı Servis Seçin veya Yazın)
                </label>
                <div className="space-y-1.5">
                  {registeredShops.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setOilService(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-700"
                    >
                      <option value="">-- Kayıtlı Servislerden Seçin --</option>
                      {registeredShops.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={oilService}
                    onChange={(e) => setOilService(e.target.value)}
                    placeholder="Örn: Belgrade Auto Centar veya yeni servis adı"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Masrafı / Ödemeyi Yapan (Kim Ödedi?) */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-950 mb-1.5">
                  Ödemeyi Yapan (Masrafı Karşılayan) *
                </label>
                <div className="grid grid-cols-3 gap-2 mb-1.5">
                  {['Atilla', 'Onur', 'Ortak Kasa'].map((person) => (
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
                  placeholder="Veya başka bir isim girin"
                  className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl bg-white text-slate-800"
                />
                <span className="text-[11px] text-amber-800 mt-1 block">
                  💡 Ortaklar arasında hesap karışıklığını önlemek için harcamayı yapan kişiyi seçiniz.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOilModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOil}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingOil ? 'Kaydediliyor...' : 'Yağ Değişimini Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </AppLayout>
  );
}

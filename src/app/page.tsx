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
import { LandingPage } from '@/components/landing/LandingPage';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { formatDate, formatCurrency, formatKm, formatRsd, EUR_TO_RSD_RATE, VEHICLE_STATUS_MAP, getVehicleStatusLabel } from '@/lib/formatters';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import { KpiSkeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/lib/i18n';

function getUpcomingStatusLabel(diffDays: number, lang: 'tr' | 'en' | 'sr') {
  if (diffDays < 0) {
    const d = Math.abs(diffDays);
    return lang === 'sr' ? `Kasni ${d} d.` : lang === 'en' ? `${d} days overdue!` : `${d} gün gecikti!`;
  }
  if (diffDays === 0) {
    return lang === 'sr' ? 'Danas se vraća' : lang === 'en' ? 'Due today' : 'Bugün teslim edilecek';
  }
  if (diffDays <= 3) {
    return lang === 'sr' ? `Još ${diffDays} d. (Hitno)` : lang === 'en' ? `${diffDays} days left (Urgent)` : `${diffDays} gün kaldı (Acil)`;
  }
  if (diffDays <= 7) {
    return lang === 'sr' ? `Još ${diffDays} d. (Ove nedelje)` : lang === 'en' ? `${diffDays} days left (This week)` : `${diffDays} gün kaldı (Bu Hafta)`;
  }
  if (diffDays <= 14) {
    return lang === 'sr' ? `Još ${diffDays} d. (Sledeće nedelje)` : lang === 'en' ? `${diffDays} days left (Next week)` : `${diffDays} gün kaldı (Gelecek Hafta)`;
  }
  return lang === 'sr' ? `Još ${diffDays} dana` : lang === 'en' ? `${diffDays} days left` : `${diffDays} gün kaldı`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const toast = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(authUser);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

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
  const [rentDiscount, setRentDiscount] = useState<number | string>('');
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
  const [oilCost, setOilCost] = useState<number | string>('');
  const [oilService, setOilService] = useState('');
  const [oilNotes, setOilNotes] = useState('');
  const [oilPaidBy, setOilPaidBy] = useState('Şirket Kasası');
  const [isSubmittingOil, setIsSubmittingOil] = useState(false);

  // Analytics table filters & sorting
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsPartnerFilter, setAnalyticsPartnerFilter] = useState('ALL');
  const [analyticsSortBy, setAnalyticsSortBy] = useState<'totalExpense' | 'revenue' | 'netProfit' | 'serviceCount' | 'faultCount'>('totalExpense');

  const fetchData = async (owner: string = selectedOwner, isBackground: boolean = false) => {
    try {
      if (!isBackground && !data) {
        setLoading(true);
      }

      const [meRes, dashRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/dashboard?owner=${encodeURIComponent(owner)}`),
      ]);

      if (meRes.ok) {
        const u = await meRes.json();
        if (u?.user) {
          setUser(u.user);
        }
      } else if (meRes.status === 401 && !authUser) {
        setUser(null);
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

    // Emniyet kilidi: 3 saniye içinde yükleme tamamlanmazsa otomatik aç
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

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
      setRentDiscount('');
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
        await fetchData(selectedOwner, true);
        toast.success(
          language === 'sr'
            ? 'Vozilo je uspešno vraćeno i operativni status je ažuriran.'
            : language === 'en'
            ? 'Vehicle returned successfully and status updated.'
            : 'Araç başarıyla teslim alındı ve operasyon güncellendi.',
          language === 'sr' ? 'Uspešno vraćeno' : language === 'en' ? 'Returned' : 'Teslim Alındı'
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'İade işlemi yapılamadı', 'İşlem Başarısız');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'İade işlemi sırasında hata oluştu.', 'Hata');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Rent Submit
  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.warning('Lütfen kiralanacak aracı seçiniz.', 'Eksik Seçim');
      return;
    }

    let customerId = selectedCustomerId;

    setIsSubmittingRent(true);
    try {
      // Eğer "Yeni Müşteri Ekle" modundaysa önce müşteriyi oluştur
      if (rentCustomerMode === 'new') {
        if (!newCustName || !newCustPhone) {
          toast.warning('Lütfen yeni müşteri adı ve telefonunu giriniz.', 'Eksik Bilgi');
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
          toast.warning('Lütfen kayıtlı bir müşteri seçiniz.', 'Eksik Müşteri');
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
        await fetchData(selectedOwner, true);
        toast.success(
          language === 'sr'
            ? 'Vozilo je uspešno iznajmljeno i ugovor je aktivan.'
            : language === 'en'
            ? 'Vehicle rented successfully and agreement started.'
            : 'Araç başarıyla kiralandı ve sözleşme başlatıldı.',
          language === 'sr' ? 'Uspešno' : language === 'en' ? 'Success' : 'Kiralama Başlatıldı'
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'Kiralama başlatılamadı', 'Kiralama Hatası');
      }
    } catch (e: any) {
      toast.error(e.message || 'Kiralama başlatılamadı', 'Hata');
    } finally {
      setIsSubmittingRent(false);
    }
  };

  // Oil Change Submit
  const handleOilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oilVehicleId) {
      toast.warning('Lütfen araç seçiniz.', 'Eksik Seçim');
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
          cost: parseFloat(String(oilCost)) || 0,
          currency: oilCurrency,
          serviceName: oilService,
          notes: oilNotes,
          paidBy: oilPaidBy,
        }),
      });
      if (res.ok) {
        setShowOilModal(false);
        setOilNotes('');
        await fetchData(selectedOwner, true);
        toast.success(
          language === 'sr'
            ? 'Zamena ulja i servisa uspešno zabeležena.'
            : language === 'en'
            ? 'Oil change and maintenance successfully recorded.'
            : 'Motor yağı ve bakım kaydı başarıyla eklendi.',
          language === 'sr' ? 'Servis sačuvan' : language === 'en' ? 'Saved' : 'Bakım Kaydedildi'
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'Yağ değişimi eklenemedi', 'Kayıt Hatası');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Yağ değişimi kaydedilirken hata oluştu.', 'Hata');
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
        await fetchData(selectedOwner, true);
        toast.success(
          language === 'sr'
            ? 'Ugovor o zakupu je uspešno produžen.'
            : language === 'en'
            ? 'Rental duration extended successfully.'
            : 'Araç kiralama süresi başarıyla uzatıldı.',
          language === 'sr' ? 'Produženo' : language === 'en' ? 'Extended' : 'Süre Uzatıldı'
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'Süre uzatma işlemi başarısız oldu.', 'İşlem Başarısız');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Süre uzatma sırasında bir hata oluştu.', 'Hata');
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

  if (!authLoading && !user && !loading && !data) {
    return <LandingPage />;
  }

  if (user && loading && !data) {
    return (
      <AppLayout currentUser={user}>
        <div className="space-y-6">
          <KpiSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if ((authLoading && !user) || (loading && !data && !user)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-800 dark:text-slate-200 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center shadow-xl mb-4 animate-pulse">
          <img src="/icon.png" alt="Filo Yönetim" className="w-full h-full object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.dash_loading_portal}</span>
      </div>
    );
  }

  if (!user && !data) {
    return <LandingPage />;
  }

  return (
    <AppLayout currentUser={user}>
      {/* Top Banner & Quick Switch */}
      <div className="mb-5 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                {language === 'sr' ? 'BEOGRAD OPERACIJE' : language === 'en' ? 'BELGRADE OPERATIONS' : 'BELGRAD OPERASYON'}
              </span>
              {user?.fleetCode && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono">
                  {language === 'sr' ? 'Kod: ' : language === 'en' ? 'Code: ' : 'Kod: '}{user.fleetCode}
                </span>
              )}
              {isStaff && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                  {t.header_staff_mode}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-2 text-slate-900 dark:text-white tracking-tight">
              {t.dash_top_banner_title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {t.dash_top_banner_subtitle}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {user?.features?.rentals !== false && (
              <button
                onClick={openRentModal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                {t.action_rent_vehicle}
              </button>
            )}
            {(user?.features?.oilChange !== false || user?.features?.maintenance !== false) && (
              <button
                onClick={() => openOilModal()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Droplet className="w-4 h-4" />
                {t.action_oil_change}
              </button>
            )}
          </div>
        </div>

        {/* Partner Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          {user?.isPartnership && (ownersList || []).length > 0 ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 flex-wrap">
              <button
                onClick={() => setSelectedOwner('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedOwner === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.dash_all_fleet} ({kpi.totalVehicles})
              </button>
              {(ownersList || []).map((ownerName: string) => (
                <button
                  key={ownerName}
                  onClick={() => setSelectedOwner(ownerName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedOwner === ownerName
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {ownerName} ({partnerStats[ownerName]?.totalVehicles || 0})
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'sr' ? 'Inventar Flote: ' : language === 'en' ? 'Fleet Inventory: ' : 'Filo Envanteri: '}
              <span className="text-slate-900 dark:text-white font-mono font-bold">
                {kpi.totalVehicles} {language === 'sr' ? 'Vozila' : language === 'en' ? 'Vehicles' : 'Araç Kayıtlı'}
              </span>
            </div>
          )}

          <button
            onClick={() => fetchData(selectedOwner)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.action_refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CRITICAL ALERTS: Zorunlu Registracija Bitiş Uyarıları (Register olmadan trafiğe çıkamaz!) */}
      {user?.features?.inspection !== false && registrationAlerts.length > 0 && (
        <div className="mb-5 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 dark:border-rose-900/50 rounded-2xl p-4 text-slate-900 dark:text-white transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <h3 className="text-sm font-black text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                {t.alert_registration_expiring}
              </h3>
            </div>
            <Link
              href="/vehicles?status=REGISTRATION_EXPIRING"
              className="text-xs font-bold text-rose-900 dark:text-rose-300 hover:underline flex items-center gap-1 shrink-0"
            >
              {language === 'sr' ? `Vidi sva vozila (${registrationAlerts.length})` : language === 'en' ? `View all expiring (${registrationAlerts.length})` : `Tüm Regi Yaklaşan Araçları Gör (${registrationAlerts.length})`} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300/80 mb-3">
            {t.alert_registration_desc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {registrationAlerts.map((ra: any) => (
              <div
                key={ra.vehicleId}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <Link
                    href={`/vehicles/${ra.vehicleId}`}
                    className="font-mono font-bold text-xs text-rose-900 dark:text-rose-400 hover:underline"
                  >
                    {ra.plate}
                  </Link>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {ra.brand} {ra.model} ({ra.owner})
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-black font-mono ${
                    ra.isExpired
                      ? 'bg-rose-600 text-white'
                      : ra.isUrgent
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {ra.isExpired ? (language === 'sr' ? 'ISTEKLA!' : language === 'en' ? 'EXPIRED!' : 'SÜRESİ BİTTİ!') : `${ra.diffDays} ${language === 'sr' ? 'd. ostalo' : language === 'en' ? 'days left' : 'gün kaldı'}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BELGRAD PARK CEZASI (eDPK) ALERTI */}
      {user?.features?.parkingTickets !== false && data?.parkingStats?.unpaidCount > 0 && (
        <div className="mb-5 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 dark:border-rose-900/50 rounded-2xl p-4 text-slate-900 dark:text-white transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-950 dark:text-rose-200 uppercase tracking-wide flex items-center gap-2">
                  {language === 'sr' ? `Pronađene Parking Kazne u Beogradu (${data.parkingStats.unpaidCount} Neplaćenih)` : language === 'en' ? `Belgrade Parking Tickets Found (${data.parkingStats.unpaidCount} Unpaid)` : `Belgrad Park Cezası Tespit Edildi (${data.parkingStats.unpaidCount} Adet Ödenmemiş)`}
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-300/80">
                  {language === 'sr' ? 'Ukupan dug za kazne: ' : language === 'en' ? 'Total fine balance: ' : 'Toplam Ceza Borcu: '}
                  <span className="font-black text-rose-900 dark:text-rose-300">
                    {data.parkingStats.unpaidAmountRsd?.toLocaleString(language === 'sr' ? 'sr-RS' : language === 'en' ? 'en-US' : 'tr-TR')} RSD (~
                    {data.parkingStats.unpaidAmountEur} €)
                  </span>
                  . {language === 'sr' ? 'Parking Servis pravilo: 50% popusta u roku od 20 dana!' : language === 'en' ? 'Parking Servis rule: 50% discount within 20 days!' : 'Parking Servis kuralı: 20 gün içinde %50 indirimli ödenebilir!'}
                </p>
              </div>
            </div>
            <Link
              href="/parking-tickets?status=UNPAID"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              <span>{language === 'sr' ? 'Pregledaj Kazne i Pošalji WhatsApp' : language === 'en' ? 'View Fines & Send WhatsApp' : 'Cezaları Gör & WhatsApp Bildir'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* AKTİF ARAÇ ARIZALARI & HASAR BİLDİRİMLERİ (DÜZELTİLDİYE ÇEVİRME) */}
      {user?.features?.faults !== false && activeFaults.length > 0 && (
        <div className="mb-5 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-900/50 rounded-2xl p-4 text-slate-900 dark:text-white transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h3 className="text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                {language === 'sr' ? `Aktivni Kvarovi i Prijave Oštećenja (${activeFaultsCount})` : language === 'en' ? `Pending Vehicle Faults & Damages (${activeFaultsCount})` : `Bekleyen Araç Arızaları & Hasar Kayıtları (${activeFaultsCount})`}
              </h3>
            </div>
            <Link
              href="/vehicles?status=FAULTS"
              className="text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              {language === 'sr' ? 'Vidi sva oštećena vozila' : language === 'en' ? 'View all faulty vehicles' : 'Tüm Arızalı Araçları Gör'} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300/80 mb-3">
            {language === 'sr' ? 'Sledeća vozila imaju aktivne kvarove. Kada se kvar otkloni, označite ga u detaljima vozila.' : language === 'en' ? 'The following vehicles have active faults. Mark as resolved in vehicle details.' : 'Aşağıdaki araçlarda aktif arıza bildirimleri var. Arıza giderildiğinde aracın detayından "Düzeltildi" olarak işaretleyin.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activeFaults.slice(0, 6).map((af: any) => (
              <div
                key={af.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/90 dark:border-amber-900/60 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {af.vehicle?.plate}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-black uppercase ${
                        af.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : af.severity === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : af.severity === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {af.severity === 'CRITICAL'
                        ? (language === 'sr' ? 'Kritično / Hitno' : language === 'en' ? 'Critical / Urgent' : 'Kritik / Acil')
                        : af.severity === 'HIGH'
                        ? (language === 'sr' ? 'Visoko' : language === 'en' ? 'High' : 'Yüksek')
                        : af.severity === 'MEDIUM'
                        ? (language === 'sr' ? 'Srednje' : language === 'en' ? 'Medium' : 'Orta')
                        : (language === 'sr' ? 'Nisko' : language === 'en' ? 'Low' : 'Düşük')}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{af.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {af.vehicle?.brand} {af.vehicle?.model} • {language === 'sr' ? 'Vlasnik: ' : language === 'en' ? 'Owner: ' : 'Sahip: '}<b>{af.vehicle?.owner}</b>
                  </div>
                  {af.description && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic">
                      "{af.description}"
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {formatDate(af.reportedDate || af.createdAt)}
                  </span>
                  <Link
                    href={`/vehicles/${af.vehicleId}?tab=faults`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span>{language === 'sr' ? 'Pogledaj i Popravi' : language === 'en' ? 'Inspect & Resolve' : 'İncele & Düzelt'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {user?.features?.vehicles !== false && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {/* 1. Aktif Kirada */}
          {user?.features?.rentals !== false && (
            <Link
              href="/vehicles?status=RENTED"
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400">{t.kpi_rented}</span>
                <KeyRound className="w-4 h-4 transition-transform group-hover:scale-110" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">{kpi.rentedVehicles}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{language === 'sr' ? 'Aktivni ugovori' : language === 'en' ? 'Active rentals' : 'Müşteride çalışan'}</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </Link>
          )}

          {/* 2. Boşta (Hazır) */}
          <Link
            href="/vehicles?status=AVAILABLE"
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer block"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t.kpi_available}</span>
              <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{kpi.availableVehicles}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>{language === 'sr' ? 'Spremno za izdavanje' : language === 'en' ? 'Ready to rent' : 'Kiralanmaya hazır'}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </Link>

          {/* 3. Kiradan Sonra Bakım */}
          <Link
            href="/vehicles?status=POST_RENTAL_CHECK"
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-xs hover:border-purple-400 hover:shadow-md transition-all group cursor-pointer block"
          >
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">{t.kpi_post_check}</span>
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{kpi.postRentalCheckVehicles}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center justify-between">
              <span>{language === 'sr' ? 'Pranje i provera' : language === 'en' ? 'Washing & check' : 'Yıkama & kontrol'}</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </Link>

          {/* 4. Serviste / Bakımda */}
          <Link
            href="/vehicles?status=MAINTENANCE"
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-400 hover:shadow-md transition-all group cursor-pointer block"
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400">{t.kpi_maintenance}</span>
              <Wrench className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{kpi.maintenanceVehicles}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>{language === 'sr' ? 'Servis i popravka' : language === 'en' ? 'In repair & shop' : 'Tamir & bakımda'}</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </Link>

          {/* 5. 1 Hafta Sonra Boşa Çıkacak */}
          {user?.features?.rentals !== false && (
            <Link
              href="/vehicles?status=RETURNING_SOON"
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-xs col-span-2 sm:col-span-1 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">{t.kpi_return_7days}</span>
                <Clock className="w-4 h-4 transition-transform group-hover:scale-110" />
              </div>
              <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{forecast.returnsNext7DaysCount}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-between">
                <span>{language === 'sr' ? 'Povratak u 7 dana' : language === 'en' ? 'Due in 7 days' : 'Gelecek 7 günde iade'}</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* FİLO İSTATİSTİKLERİ, ARAÇ BAŞINA MASRAF & ARIZA ANALİTİĞİ (YALNIZCA ADMIN / ORTAKLAR GÖRÜR) */}
      {!isStaff && user?.features?.finance !== false && fleetFinancials && (
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6 transition-colors">
          {/* 1. Üst Başlık & Özet Barı */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                {language === 'sr' ? 'Finansije i Statistika Flote' : language === 'en' ? 'Fleet Overview & Analytics' : 'Filo Bütünü & İstatistik Paneli'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'sr' ? 'Analiza prihoda, troškova po vozilu, vozila sa najvećim troškovima i kvarovima' : language === 'en' ? 'Fleet financials, cost per car, revenue analysis, top expense and breakdown' : 'Filo bütünü, araç başına masraf ve ciro analizi, en çok masraf çıkaran ve arıza yapan araçlar'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                %{fleetFinancials.fleetAmortizationPercent} {language === 'sr' ? 'Amortizovano' : language === 'en' ? 'Amortized' : 'Amorti Edildi'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {language === 'sr' ? 'Popunjenost: ' : language === 'en' ? 'Occupancy: ' : 'Doluluk: '}%{fleetFinancials.occupancyRate}
              </span>
            </div>
          </div>

          {/* 2. Filo Bütünü - 6 Temel Metrik Kartı */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{t.kpi_total_revenue}</div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {formatCurrency(fleetFinancials.totalFleetRevenue, 'EUR')}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-0.5 font-medium">
                {language === 'sr' ? 'Pros. ' : language === 'en' ? 'Avg. ' : 'Ort. '}{formatCurrency(fleetFinancials.avgRevenuePerVehicle, 'EUR')} / {language === 'sr' ? 'vozilo' : language === 'en' ? 'car' : 'araç'}
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">{t.kpi_total_expenses}</div>
              <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                {formatCurrency(fleetFinancials.totalFleetExpenses, 'EUR')}
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400/80 mt-0.5 font-medium truncate" title="Bakım + Yağ + Muayene">
                {language === 'sr' ? 'Održavanje: ' : language === 'en' ? 'Maint: ' : 'Bakım: '}{formatCurrency(fleetFinancials.breakdown?.maintenance || 0, 'EUR')}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.kpi_net_profit}</div>
              <div className={`text-lg sm:text-xl font-black mt-1 ${fleetFinancials.fleetNetProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(fleetFinancials.fleetNetProfit, 'EUR')}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {fleetFinancials.fleetNetProfit >= 0 
                  ? (language === 'sr' ? 'Pozitivan novčani tok' : language === 'en' ? 'Positive cash flow' : 'Pozitif Nakit Akışı')
                  : (language === 'sr' ? 'U gubitku' : language === 'en' ? 'In loss' : 'Zararda')}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">{t.kpi_cost_per_car}</div>
              <div className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-400 mt-1">
                {formatCurrency(fleetFinancials.avgExpensePerVehicle, 'EUR')}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5 font-medium">
                {language === 'sr' ? 'Prosečan trošak' : language === 'en' ? 'Average cost' : 'Ortalama maliyet'}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">{t.kpi_occupancy}</div>
              <div className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-400 mt-1">
                %{fleetFinancials.occupancyRate}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400/80 mt-0.5 font-medium">
                {kpi.rentedVehicles} / {kpi.totalVehicles} {language === 'sr' ? 'u zakupu' : language === 'en' ? 'rented' : 'kirada'}
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">{t.kpi_amortization_left}</div>
              <div className="text-lg sm:text-xl font-black text-purple-900 dark:text-purple-400 mt-1">
                {formatCurrency(fleetFinancials.fleetRemainingAmortization, 'EUR')}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400/80 mt-0.5 font-medium">
                {language === 'sr' ? 'Investicija: ' : language === 'en' ? 'Investment: ' : 'Yatırım: '}{formatCurrency(fleetFinancials.totalFleetInvestment, 'EUR')}
              </div>
            </div>
          </div>

          {/* Kompakt Amortisman İlerleme Çubuğu */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t.kpi_investment_progress}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">%{fleetFinancials.fleetAmortizationPercent}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${fleetFinancials.fleetAmortizationPercent}%` }}
              />
            </div>
          </div>

          {/* 3. İKİ SÜTUNLU HIZLI ANALİZ: EN ÇOK MASRAF ÇIKARANLAR & EN ÇOK ARIZA YAPANLAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SOL KART: EN ÇOK MASRAF ÇIKARAN ARAÇLAR */}
            <div className="bg-gradient-to-br from-rose-50/40 via-white to-slate-50/50 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900/60 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-300">
                    <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{t.dash_top_expense_title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'sr' ? 'Najskuplja vozila uključujući servis, delove, ulje i registraciju' : language === 'en' ? 'Most costly vehicles including service, parts, oil and inspection' : 'Bakım, parça, yağ ve muayene dahil en maliyetli araçlar'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                  TOP {topExpenseVehicles.length}
                </span>
              </div>

              {topExpenseVehicles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  {language === 'sr' ? 'Nema vozila sa evidentiranim troškovima.' : language === 'en' ? 'No vehicle expense records yet.' : 'Henüz masraf kaydı bulunan araç bulunmuyor.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {topExpenseVehicles.map((v: any, idx: number) => {
                    const maxVal = topExpenseVehicles[0]?.totalExpense || 1;
                    const percent = Math.min(100, Math.round((v.totalExpense / maxVal) * 100));

                    return (
                      <div key={v.id} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-rose-300 dark:hover:border-rose-700 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                              {v.plate}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate hidden sm:inline">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                              {v.owner}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                              {formatCurrency(v.totalExpense, 'EUR')}
                            </span>
                          </div>
                        </div>

                        {/* Alt Kırılım Hapları */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700/70">
                            {language === 'sr' ? '🔧 Održavanje: ' : language === 'en' ? '🔧 Maint: ' : '🔧 Bakım: '}
                            <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(v.maintCost, 'EUR')}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700/70">
                            {language === 'sr' ? '🛢️ Ulje: ' : language === 'en' ? '🛢️ Oil: ' : '🛢️ Yağ: '}
                            <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(v.oilCost, 'EUR')}</strong>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700/70">
                            {language === 'sr' ? '📋 Regi: ' : language === 'en' ? '📋 Regi: ' : '📋 Tescil: '}
                            <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(v.inspCost, 'EUR')}</strong>
                          </span>
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold hover:underline"
                          >
                            {language === 'sr' ? 'Pregledaj →' : language === 'en' ? 'Inspect →' : 'İncele →'}
                          </Link>
                        </div>

                        {/* Harcama Oran Çubuğu */}
                        <div className="w-full bg-rose-50 dark:bg-rose-950/40 h-1.5 rounded-full overflow-hidden">
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
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-slate-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900/60 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{t.dash_top_fault_title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'sr' ? 'Učestalost kvarova, aktivni problemi i hronične poteškoće' : language === 'en' ? 'Breakdown frequency, ongoing issues, and chronic faults' : 'Arıza sıklığı, devam eden sorunlar ve kronik arızalar'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                  TOP {topFaultVehicles.length}
                </span>
              </div>

              {topFaultVehicles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  {language === 'sr' ? 'Nema vozila sa otvorenim kvarovima ili hroničnim problemima.' : language === 'en' ? 'No vehicles with open faults or chronic issues.' : 'Filoda açık arızası veya kronik problemi olan araç bulunmuyor.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {topFaultVehicles.map((v: any, idx: number) => {
                    return (
                      <div key={v.id} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white truncate">
                              {v.plate}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate hidden sm:inline">
                              {v.brand} {v.model}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                              {v.owner}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {v.activeFaultCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                🔴 {v.activeFaultCount} {language === 'sr' ? 'U toku' : language === 'en' ? 'Active' : 'Devam Eden'}
                              </span>
                            ) : v.faultCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                ⚠️ {v.faultCount} {language === 'sr' ? 'Kvarova' : language === 'en' ? 'Faults' : 'Arıza'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                🛠️ {v.serviceCount} {language === 'sr' ? 'Servisa' : language === 'en' ? 'Services' : 'Servis'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kronik Arıza Varsa Belirgin Uyarı */}
                        {v.hasChronic && (
                          <div className="mt-1.5 p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-lg border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">{language === 'sr' ? 'Hronični problem:' : language === 'en' ? 'Chronic Issue:' : 'Kronik Sorun:'}</strong> {v.chronicIssues}
                            </div>
                          </div>
                        )}

                        {/* Alt Bilgi & Detay Linki */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>
                            {language === 'sr' ? `Ukupno ${v.serviceCount} puta bio na servisu` : language === 'en' ? `Sent to service ${v.serviceCount} times` : `Toplam ${v.serviceCount} kez servise/bakıma girdi`}
                          </span>
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold hover:underline"
                          >
                            {language === 'sr' ? 'Pregledaj vozilo →' : language === 'en' ? 'Inspect vehicle →' : 'Aracı İncele →'}
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
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  {t.dash_analytics_table_title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sr' ? `Prihod od zakupa, ukupni troškovi i neto profit po vozilu (${filteredVehicleAnalytics.length} vozila)` : language === 'en' ? `Rental revenue, total expenses, and net profit per vehicle (${filteredVehicleAnalytics.length} vehicles)` : `Her aracın kazandırdığı kira cirosu, yapılan toplam masrafı ve net kârlılığı (${filteredVehicleAnalytics.length} araç)`}
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
                    placeholder={language === 'sr' ? 'Pretraži tablicu, marku, model...' : language === 'en' ? 'Search plate, brand, model...' : 'Plaka, marka, model ara...'}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <select
                  value={analyticsPartnerFilter}
                  onChange={(e) => setAnalyticsPartnerFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="ALL">{language === 'sr' ? 'Svi Ortaci' : language === 'en' ? 'All Partners' : 'Tüm Ortaklar'}</option>
                  {(ownersList || []).map((o: string) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>

                <select
                  value={analyticsSortBy}
                  onChange={(e) => setAnalyticsSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="totalExpense">{language === 'sr' ? 'Najveći Troškovi' : language === 'en' ? 'Highest Expense' : 'En Çok Masraf Çıkaran'}</option>
                  <option value="revenue">{language === 'sr' ? 'Najveći Prihod' : language === 'en' ? 'Highest Revenue' : 'En Yüksek Ciro'}</option>
                  <option value="netProfit">{language === 'sr' ? 'Najveći Čist Profit' : language === 'en' ? 'Highest Net Profit' : 'En Yüksek Net Kâr'}</option>
                  <option value="serviceCount">{language === 'sr' ? 'Najviše Servisa' : language === 'en' ? 'Most Services' : 'En Çok Servise Giren'}</option>
                  <option value="faultCount">{language === 'sr' ? 'Najviše Kvarova' : language === 'en' ? 'Most Faults' : 'En Çok Arıza Yapan'}</option>
                </select>
              </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">{t.dash_col_vehicle}</th>
                    <th className="py-3 px-3">{t.dash_col_owner}</th>
                    <th className="py-3 px-3">{t.dash_col_status}</th>
                    <th className="py-3 px-3 text-right">{t.dash_col_revenue}</th>
                    <th className="py-3 px-3 text-right">{t.dash_col_maint}</th>
                    <th className="py-3 px-3 text-right">{t.dash_col_oil}</th>
                    <th className="py-3 px-3 text-right">{t.dash_col_regi}</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">{t.dash_col_total_expense}</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">{t.dash_col_net_profit}</th>
                    <th className="py-3 px-3 text-center">{t.dash_col_margin}</th>
                    <th className="py-3 px-3 text-center">{t.dash_col_services}</th>
                    <th className="py-3 px-3 text-center">{t.dash_col_actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
                  {filteredVehicleAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        {language === 'sr' ? 'Nisu pronađena vozila po zadatim kriterijumima.' : language === 'en' ? 'No vehicles found matching criteria.' : 'Kriterlere uygun araç bulunamadı.'}
                      </td>
                    </tr>
                  ) : (
                    filteredVehicleAnalytics.map((v: any) => {
                      const isProfitPositive = (v.netProfit || 0) >= 0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-black text-slate-900 dark:text-white">{v.plate}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {v.brand} {v.model} ({v.modelYear})
                            </div>
                            {v.hasChronic && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold truncate max-w-xs mt-0.5" title={v.chronicIssues}>
                                ⚠️ {v.chronicIssues}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {v.owner}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.status === 'RENTED'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  : v.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : v.status === 'MAINTENANCE'
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {getVehicleStatusLabel(v.status, language)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(v.revenue || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {formatCurrency(v.maintCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {formatCurrency(v.oilCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {formatCurrency(v.inspCost || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(v.totalExpense || 0, 'EUR')}
                          </td>
                          <td className={`py-3 px-3 text-right font-black ${isProfitPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {formatCurrency(v.netProfit || 0, 'EUR')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              (v.expenseRatio || 0) > 50 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              %{v.expenseRatio || 0}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {v.activeFaultCount > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-400">
                                  🔴 {v.activeFaultCount}
                                </span>
                              ) : null}
                              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                {v.serviceCount} {language === 'sr' ? 'Servisa' : language === 'en' ? 'Services' : 'Servis'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Link
                              href={`/vehicles/${v.id}`}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors inline-block"
                            >
                              {language === 'sr' ? 'Detalji →' : language === 'en' ? 'Details →' : 'Detay →'}
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
      {user?.features?.rentals !== false && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs mb-5 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                {language === 'sr' ? 'Predstojeća Vraćanja Vozila i WhatsApp Podsetnici' : language === 'en' ? 'Upcoming Vehicle Returns & WhatsApp Reminders' : 'Araç Geri Alımları & WhatsApp İade Hatırlatmaları'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'sr' ? 'Pošaljite WhatsApp podsetnik jednim klikom klijentima kojima ističe zakup' : language === 'en' ? 'Send one-click WhatsApp reminders to clients whose rental is ending' : 'Kira süresi dolan veya 3 gün kalan müşterilere tek tıkla WhatsApp bildirimi gönderin'}
              </p>
            </div>
          </div>

          {upcomingReturns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              {language === 'sr' ? 'Trenutno nema aktivnih zakupa.' : language === 'en' ? 'No active rentals at the moment.' : 'Şu anda aktif kirada araç bulunmuyor.'}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReturns.map((item: any) => (
                <div
                  key={item.rentalId}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    item.badgeType === 'DANGER'
                      ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                      : item.diffDays <= 3
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        item.badgeType === 'DANGER'
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/vehicles/${item.vehicleId}`}
                          className="font-mono font-black text-sm text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          {item.plate}
                        </Link>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {item.brand} {item.model}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {language === 'sr' ? 'Vlasnik: ' : language === 'en' ? 'Owner: ' : 'Sahip: '}{item.owner}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>
                          {language === 'sr' ? 'Klijent: ' : language === 'en' ? 'Client: ' : 'Müşteri: '}
                          <Link
                            href={`/customers?search=${encodeURIComponent(item.customerName)}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:underline inline-flex items-center gap-0.5"
                            title="Müşteri sayfasına git"
                          >
                            {item.customerName}
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">↗</span>
                          </Link>
                        </span>
                        <span>•</span>
                        <span className="font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.customerPhone}
                        </span>
                        <span>•</span>
                        <span>{language === 'sr' ? 'Datum Vraćanja: ' : language === 'en' ? 'Return Date: ' : 'İade Tarihi: '}<b className="font-mono text-slate-800 dark:text-slate-200">{formatDate(item.endDate)}</b></span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black ${
                            item.badgeType === 'DANGER'
                              ? 'bg-rose-600 text-white'
                              : item.diffDays <= 3
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {getUpcomingStatusLabel(item.diffDays, language)}
                        </span>

                        {item.extensionCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            🔄 {item.extensionCount} {language === 'sr' ? 'puta produženo' : language === 'en' ? 'times extended' : 'Kez Uzatıldı'}
                          </span>
                        )}

                        {/* Teslimat Fotoğraflarını İncele */}
                        {item.photos?.front && (
                          <button
                            type="button"
                            onClick={() => setShowDeliveryPhotosModal(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {language === 'sr' ? '4 Fotografije Isporuke' : language === 'en' ? '4 Delivery Photos' : '4 Teslimat Fotoğrafı'}
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
                      {t.dash_btn_remind}
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
                      {t.dash_btn_extend}
                    </button>

                    {/* Aracı Teslim Al */}
                    <button
                      onClick={() => {
                        setReturningRental(item);
                        setReturnKm('');
                        setSentToPostCheck(true);

                        let parsedChecklist: Record<string, boolean> = {
                          'Telefon Tutucu': true,
                          'Çakmaklık Şarj Aleti': true,
                          'İlk Yardım Çantası': true,
                          'Reflektör & Yangın Tüpü': true,
                          'Paspas Seti': true,
                        };
                        if (item.deliveryAccessories) {
                          try {
                            const arr = typeof item.deliveryAccessories === 'string'
                              ? JSON.parse(item.deliveryAccessories)
                              : item.deliveryAccessories;
                            if (Array.isArray(arr) && arr.length > 0) {
                              parsedChecklist = {};
                              arr.forEach((accName: string) => {
                                parsedChecklist[accName] = true;
                              });
                            }
                          } catch (e) {
                            // keep default
                          }
                        }
                        setAccessoriesChecklist(parsedChecklist);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {t.dash_btn_return}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: KİRALAMA SÜRESİ UZATMA (Varsayılan 30 Gün + Tutar + Ödeme Durumu) */}
      {extendingRental && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto pt-safe pb-safe">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {language === 'sr' ? 'Produži Rok Zakupa' : language === 'en' ? 'Extend Rental Period' : 'Kiralama Süresini Uzat'} ({extendingRental.plate})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'sr' ? 'Klijent: ' : language === 'en' ? 'Client: ' : 'Müşteri: '}<b className="text-slate-800 dark:text-slate-200">{extendingRental.customerName}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendingRental(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'sr' ? 'Trenutni Datum Vraćanja:' : language === 'en' ? 'Current Return Date:' : 'Mevcut İade Tarihi:'}</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatDate(extendingRental.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'sr' ? 'Trenutni Iznos:' : language === 'en' ? 'Current Amount:' : 'Mevcut Toplam Tutar:'}</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{extendingRental.totalAmount ? `${extendingRental.totalAmount} €` : '-'}</span>
              </div>
              {extendingRental.extensionCount > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>{language === 'sr' ? 'Prethodna produženja:' : language === 'en' ? 'Previous extensions:' : 'Daha Önceki Uzatmalar:'}</span>
                  <span>{extendingRental.extensionCount} {language === 'sr' ? 'puta produženo' : language === 'en' ? 'times' : 'kez uzatıldı'}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Broj dana produženja (standardno 30 dana) *' : language === 'en' ? 'Extension days (default 30 days) *' : 'Uzatılacak Gün Sayısı (Varsayılan 30 Gün) *'}
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
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      +{days} {language === 'sr' ? 'Dana' : language === 'en' ? 'Days' : 'Gün'}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={extendDays}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExtendDays(e.target.value)}
                  required
                  min={1}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold font-mono"
                  placeholder="Örn: 30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Naknada za produženje (€) *' : language === 'en' ? 'Extension Rate (€) *' : 'Ek Dönem Kira Bedeli (€) *'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={extendAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExtendAmount(e.target.value)}
                  required
                  min={0}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold font-mono"
                  placeholder="Örn: 350"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                  {language === 'sr' ? 'Ovaj iznos biće automatski dodat na ugovor.' : language === 'en' ? 'This amount will be automatically added to the contract.' : 'Bu tutar mevcut sözleşme toplamına otomatik eklenecektir.'}
                </span>
              </div>

              {/* Kira Bedeli Ödendi mi Teyidi */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">{language === 'sr' ? 'Naknada plaćena?' : language === 'en' ? 'Fee Collected?' : 'Uzatma Ücreti Tahsil Edildi mi?'}</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{language === 'sr' ? 'Označi kao plaćeno' : language === 'en' ? 'Mark as paid' : 'Ödeme alındı olarak işaretle'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={extendIsPaid}
                  onChange={(e) => setExtendIsPaid(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Beleška o produženju (Opciono)' : language === 'en' ? 'Extension Note (Optional)' : 'Uzatma Notu (Opsiyonel)'}
                </label>
                <textarea
                  rows={2}
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  placeholder={language === 'sr' ? 'Potvrđeno telefonom, preuzeta gotovina...' : language === 'en' ? 'Client confirmed by phone, payment collected...' : 'Müşteri telefonla teyit etti, ödeme elden alındı...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtendingRental(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.action_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExtend}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingExtend ? (language === 'sr' ? 'Produžavanje...' : language === 'en' ? 'Extending...' : 'Uzatılıyor...') : (language === 'sr' ? 'Produži i Potvrdi' : language === 'en' ? 'Extend & Confirm' : 'Süreyi Uzat & Onayla')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ARACI TESLİM AL (Aksesuar Checklist + Bakıma Gönder + Fotoğraf Karşılaştırma) */}
      {returningRental && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto pt-safe pb-safe">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              {language === 'sr' ? 'Preuzmi Vozilo od Klijenta' : language === 'en' ? 'Return Vehicle from Client' : 'Aracı Müşteriden Teslim Al'} ({returningRental.plate})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'sr' ? 'Proverite opremu i odredite stanje vozila nakon zakupa.' : language === 'en' ? 'Check accessories and determine vehicle post-rental status.' : 'Aksesuarları kontrol edip aracın kiradan sonraki durumunu belirleyiniz.'}
            </p>

            {/* Süre Uzatma Yönlendirme Banner */}
            <div className="mt-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{language === 'sr' ? 'Klijent želi produženje umesto vraćanja?' : language === 'en' ? 'Client wants to extend instead of returning?' : 'Müşteri teslim yerine süreyi uzatmak mı istiyor?'}</div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-400">{language === 'sr' ? 'Možete produžiti za 30 dana bez preuzimanja.' : language === 'en' ? 'You can extend for 30 days without return.' : 'Aracı teslim almadan 30 gün uzatabilirsiniz.'}</div>
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
                ⏱️ {language === 'sr' ? 'Pređi na Produženje' : language === 'en' ? 'Switch to Extension' : 'Süre Uzatmaya Geç'}
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Trenutna kilometraža pri povratku' : language === 'en' ? 'Current Odometer (KM) at Return' : 'Teslim Alınan Güncel KM'}
                </label>
                <input
                  type="number"
                  value={returnKm}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setReturnKm(e.target.value)}
                  placeholder="Örn: 78900"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500 font-mono font-bold"
                />
              </div>

              {/* Aksesuar Checklist Kontrolü */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  {language === 'sr' ? 'Kontrola opreme u vozilu (Pri povratku)' : language === 'en' ? 'Interior Accessories Checklist (At Return)' : 'Araç İçi Aksesuar Kontrolü (Teslim Alınırken)'}
                </span>
                <div className="space-y-2 text-xs">
                  {Object.keys(accessoriesChecklist).map((acc) => (
                    <label key={acc} className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
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
                      <span className="font-medium">{acc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kiradan Sonra Bakım / Temizliğe Gönderilsin mi? */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-purple-200">{language === 'sr' ? 'Poslati na čišćenje i proveru nakon najma?' : language === 'en' ? 'Send for post-rental check & detailing?' : 'Kiradan Sonra Bakım & Temizliğe Alınsın mı?'}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-400">
                    {language === 'sr' ? 'Pre novog klijenta prolazi pranje i kontrolu.' : language === 'en' ? 'Moves to washing and inspection before next rental.' : 'Yeni kiracıya verilmeden önce iç-dış yıkama ve kontrol aşamasına geçer.'}
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
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {language === 'sr' ? 'Pogledaj 4 početne fotografije za upoređivanje' : language === 'en' ? 'View 4 Initial Condition Photos for Comparison' : 'Kira Başındaki 4 Kondisyon Fotoğrafını Aç & İncele'}
                </button>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Beleške o povratku i oštećenja' : language === 'en' ? 'Return Notes & Damages' : 'İade Notları & Varsa Yeni Çizik/Hasar'}
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder={language === 'sr' ? 'Vozilo vraćeno čisto, oprema kompletna...' : language === 'en' ? 'Vehicle returned clean, all accessories intact...' : 'Araç temiz teslim alındı, aksesuarlar tam...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturningRental(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.action_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingReturn ? (language === 'sr' ? 'Obrađuje se...' : language === 'en' ? 'Processing...' : 'İşleniyor...') : (language === 'sr' ? 'Završi Preuzimanje' : language === 'en' ? 'Complete Return' : 'Teslimatı Tamamla')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 4 TESLİMAT FOTOĞRAFINI GÖRÜNTÜLE */}
      {showDeliveryPhotosModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {language === 'sr' ? 'Fotografije sa 4 strane pri početku zakupa' : language === 'en' ? '4 Side Condition Photos at Rental Start' : 'Kira Başlangıcı 4 Cephe Fotoğrafları'} ({showDeliveryPhotosModal.plate})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'sr' ? 'Uporedite oštećenja pregledom početnog stanja vozila.' : language === 'en' ? 'Inspect initial photos for damage verification.' : 'Teslim anındaki kondisyon fotoğraflarını inceleyerek hasar karşılaştırması yapın.'}
                </p>
              </div>
              <button
                onClick={() => setShowDeliveryPhotosModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span>1. {language === 'sr' ? 'PREDNJA STRANA' : language === 'en' ? 'FRONT SIDE' : 'ÖN CEPHE'}</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> {language === 'sr' ? 'Uvećaj' : language === 'en' ? 'Zoom' : 'Büyüt'}
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
                    <ZoomIn className="w-4 h-4" /> {language === 'sr' ? 'Ceo ekran' : language === 'en' ? 'Fullscreen' : 'Tam Ekran İncele'}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span>2. {language === 'sr' ? 'ZADNJA STRANA' : language === 'en' ? 'REAR SIDE' : 'ARKA CEPHE'}</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> {language === 'sr' ? 'Uvećaj' : language === 'en' ? 'Zoom' : 'Büyüt'}
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
                    <ZoomIn className="w-4 h-4" /> {language === 'sr' ? 'Ceo ekran' : language === 'en' ? 'Fullscreen' : 'Tam Ekran İncele'}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span>3. {language === 'sr' ? 'DESNA STRANA' : language === 'en' ? 'RIGHT SIDE' : 'SAĞ CEPHE'}</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> {language === 'sr' ? 'Uvećaj' : language === 'en' ? 'Zoom' : 'Büyüt'}
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
                    <ZoomIn className="w-4 h-4" /> {language === 'sr' ? 'Ceo ekran' : language === 'en' ? 'Fullscreen' : 'Tam Ekran İncele'}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                  <span>4. {language === 'sr' ? 'LEVA STRANA' : language === 'en' ? 'LEFT SIDE' : 'SOL CEPHE'}</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> {language === 'sr' ? 'Uvećaj' : language === 'en' ? 'Zoom' : 'Büyüt'}
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
                    <ZoomIn className="w-4 h-4" /> {language === 'sr' ? 'Ceo ekran' : language === 'en' ? 'Fullscreen' : 'Tam Ekran İncele'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDeliveryPhotosModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {t.action_close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARAÇ KİRALA (Yeni Müşteri Sekmesi + İskonto + Ödeme Teyit + 4 Fotoğraf) */}
      {showRentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              {language === 'sr' ? 'Pokreni Novo Iznajmljivanje Vozila' : language === 'en' ? 'Start New Vehicle Rental' : 'Yeni Araç Kiralama Başlat'} (Belgrad)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'sr' ? 'Standardni mesečni period, popust, potvrda uplate i 4 fotografije primopredaje.' : language === 'en' ? 'Monthly rental period, discount, payment confirmation, and 4 delivery photos.' : 'Varsayılan aylık periyot, isteğe bağlı iskonto, ödeme teyidi ve 4 teslimat fotoğrafı.'}
            </p>

            <form onSubmit={handleRentSubmit} className="space-y-4 mt-4">
              {/* Araç Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Izbor Vozila (Slobodna vozila) *' : language === 'en' ? 'Select Vehicle (Available vehicles) *' : 'Kiralanacak Araç (Boşta & Kiralanabilir Araçlar) *'}
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleSelectChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:border-amber-500 font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">{language === 'sr' ? '-- Izaberite Vozilo --' : language === 'en' ? '-- Select Vehicle --' : '-- Araç Seçin --'}</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} – {v.brand} {v.model} ({v.owner}) - Standart: {v.monthlyPrice || 350} €/{language === 'sr' ? 'mesec' : language === 'en' ? 'month' : 'ay'}
                      {v.status === 'POST_RENTAL_CHECK' ? ' [🧼 Kontrola/Pranje - Spremno]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Müşteri Seçimi / Yeni Müşteri Ekle Sekmesi */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'sr' ? 'Izbor Klijenta' : language === 'en' ? 'Customer Identification' : 'Müşteri Tanımı'}</span>
                  <div className="flex gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setRentCustomerMode('existing')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                        rentCustomerMode === 'existing'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {language === 'sr' ? 'Postojeći Klijent' : language === 'en' ? 'Existing Client' : 'Kayıtlı Müşteri'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentCustomerMode('new')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                        rentCustomerMode === 'new'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      + {language === 'sr' ? 'Novi Klijent' : language === 'en' ? 'New Client' : 'Yeni Müşteri Ekle'}
                    </button>
                  </div>
                </div>

                {rentCustomerMode === 'existing' ? (
                  <div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">{language === 'sr' ? '-- Izaberite iz liste klijenata --' : language === 'en' ? '-- Select Existing Customer --' : '-- Kayıtlı Müşterilerden Seçiniz --'}</option>
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
                      placeholder={language === 'sr' ? 'Ime i Prezime *' : language === 'en' ? 'Full Name *' : 'Müşteri Ad Soyad *'}
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Telefon (+381 ...) *"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder={language === 'sr' ? 'Broj Pasoša / LK' : language === 'en' ? 'Passport / ID No' : 'Pasaport / Kimlik No'}
                      value={newCustIdNo}
                      onChange={(e) => setNewCustIdNo(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Kiralama Tarihleri (Varsayılan 1 Ay) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Datum Početka *' : language === 'en' ? 'Start Date *' : 'Başlangıç Tarihi *'}
                  </label>
                  <input
                    type="date"
                    value={rentStartDate}
                    onChange={(e) => setRentStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Datum Završetka (1 Mesec) *' : language === 'en' ? 'End Date (1 Month) *' : 'Bitiş Tarihi (Varsayılan 1 Ay) *'}
                  </label>
                  <input
                    type="date"
                    value={rentEndDate}
                    onChange={(e) => setRentEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              {/* Sabit Kira & İskonto Yapabilme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <div>
                  <label className="block text-xs font-semibold text-amber-950 dark:text-amber-300 mb-1">
                    {language === 'sr' ? 'Mesečni Zakup (€)' : language === 'en' ? 'Monthly Rate (€)' : 'Standart Aylık Kira (€)'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={rentMonthlyRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRentMonthlyRate(e.target.value)}
                    placeholder="Örn: 350"
                    className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-950 dark:text-amber-300 mb-1">
                    {language === 'sr' ? 'Popust (€)' : language === 'en' ? 'Discount (€)' : 'İskonto / İndirim (€)'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={rentDiscount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRentDiscount(e.target.value)}
                    placeholder="Örn: 30"
                    className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-950 dark:text-amber-300 mb-1">
                    {language === 'sr' ? 'Neto Dogovoreni Zakup' : language === 'en' ? 'Net Agreed Rent' : 'Net Anlaşılan Kira (€)'}
                  </label>
                  <div className="px-3 py-2 bg-amber-200/80 dark:bg-amber-800/60 rounded-xl font-black text-sm text-slate-950 dark:text-white">
                    {formFinalPrice} € / {language === 'sr' ? 'Mesec' : language === 'en' ? 'Month' : 'Ay'}
                  </div>
                </div>
              </div>

              {/* Kira Bedeli Ödendi mi Teyidi */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">{language === 'sr' ? 'Kira plaćena / preuzeta?' : language === 'en' ? 'Rent Paid / Collected?' : 'Kira Bedeli Ödendi mi / Tahsil Edildi mi?'}</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">{language === 'sr' ? 'Potvrda uplate za početak zakupa' : language === 'en' ? 'Payment confirmation for start of rental' : 'Kira başlangıcı için ödeme teyidi'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={rentIsPaid}
                  onChange={(e) => setRentIsPaid(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-400 cursor-pointer"
                />
              </div>

              {/* 4 Kondisyon Fotoğrafı */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  {language === 'sr' ? '4 Fotografije primopredaje (Napred, Nazad, Desno, Levo)' : language === 'en' ? '4 Handover Photos (Front, Back, Right, Left)' : 'Teslim Anı 4 Cephe Fotoğrafları (Ön, Arka, Sağ, Sol)'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{language === 'sr' ? 'Prednja' : language === 'en' ? 'Front' : 'Ön'}</label>
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
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{language === 'sr' ? 'Zadnja' : language === 'en' ? 'Back' : 'Arka'}</label>
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
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{language === 'sr' ? 'Desna' : language === 'en' ? 'Right' : 'Sağ'}</label>
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
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">{language === 'sr' ? 'Leva' : language === 'en' ? 'Left' : 'Sol'}</label>
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
                      className="w-full text-xs text-slate-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'sr' ? 'Beleške' : language === 'en' ? 'Notes' : 'Notlar'}</label>
                <textarea
                  rows={2}
                  value={rentNotes}
                  onChange={(e) => setRentNotes(e.target.value)}
                  placeholder={language === 'sr' ? 'Uslovi zakupa, dodatna oprema...' : language === 'en' ? 'Rental conditions, extras...' : 'Kiralama koşulları, ek aksesuarlar...'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.action_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRent}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingRent ? (language === 'sr' ? 'Pokretanje...' : language === 'en' ? 'Starting...' : 'İşleniyor...') : (language === 'sr' ? 'Pokreni Zakup' : language === 'en' ? 'Start Rental' : 'Kiralamayı Başlat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOTOR YAĞI DEĞİŞİMİ (EUR / Dinar Çift Para Birimi + Kayıtlı Servis Seçimi) */}
      {showOilModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {language === 'sr' ? 'Brza Zamena Motornog Ulja' : language === 'en' ? 'Quick Engine Oil Change' : 'Hızlı Motor Yağı Değişimi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'sr' ? 'Unesite u EUR ili RSD (1 EUR = 117 RSD fiksni kurs).' : language === 'en' ? 'Enter in EUR or RSD (1 EUR = 117 RSD fixed rate).' : 'EUR veya Dinar olarak girin (1 EUR = 117 RSD sabit kur ile hesaplanır).'}
            </p>

            <form onSubmit={handleOilSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'sr' ? 'Izaberite Vozilo *' : language === 'en' ? 'Select Vehicle *' : 'Araç Seçiniz *'}</label>
                <select
                  required
                  value={oilVehicleId}
                  onChange={(e) => {
                    setOilVehicleId(e.target.value);
                    const found = allVehicles.find((v) => v.id === e.target.value);
                    if (found) setOilKm(found.currentKm);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">{language === 'sr' ? '-- Izaberite Vozilo --' : language === 'en' ? '-- Select Vehicle --' : '-- Araç Seçin --'}</option>
                  {allVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} – {v.brand} {v.model} ({formatKm(v.currentKm)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'sr' ? 'Datum Zamene *' : language === 'en' ? 'Change Date *' : 'Değişim Tarihi *'}</label>
                  <input
                    type="date"
                    value={oilDate}
                    onChange={(e) => setOilDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'sr' ? 'Trenutna KM *' : language === 'en' ? 'Current KM *' : 'Güncel KM *'}</label>
                  <input
                    type="number"
                    value={oilKm}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setOilKm(e.target.value)}
                    placeholder="Örn: 155000"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Para Birimi & Maliyet Girişi (EUR / RSD) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'sr' ? 'Valuta' : language === 'en' ? 'Currency' : 'Para Birimi'}</label>
                  <select
                    value={oilCurrency}
                    onChange={(e) => setOilCurrency(e.target.value as 'EUR' | 'RSD')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="RSD">RSD (Dinar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'sr' ? 'Iznos' : language === 'en' ? 'Cost' : 'Tutar'} ({oilCurrency})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={oilCost}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setOilCost(e.target.value)}
                    placeholder="Örn: 75"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold"
                  />
                </div>
                <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {oilCurrency === 'RSD'
                    ? `${language === 'sr' ? 'U evrima: ~' : language === 'en' ? 'In EUR: ~' : 'EUR Karşılığı: ~'}${Math.round(((parseFloat(String(oilCost)) || 0) / EUR_TO_RSD_RATE) * 100) / 100} €`
                    : `${language === 'sr' ? 'U dinarima: ~' : language === 'en' ? 'In RSD: ~' : 'Dinar Karşılığı: ~'}${Math.round((parseFloat(String(oilCost)) || 0) * EUR_TO_RSD_RATE)} RSD`}
                </div>
              </div>

              {/* Kayıtlı Servis Seçimi veya Yeni Servis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'sr' ? 'Servis (Izaberite sa liste ili upišite)' : language === 'en' ? 'Service Shop (Select or type)' : 'Servis (Kayıtlı Servis Seçin veya Yazın)'}
                </label>
                <div className="space-y-1.5">
                  {registeredShops.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setOilService(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="">{language === 'sr' ? '-- Izaberite registrovani servis --' : language === 'en' ? '-- Select registered service --' : '-- Kayıtlı Servislerden Seçin --'}</option>
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
                    placeholder="Örn: Belgrade Auto Centar"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl"
                  />
                </div>
              </div>

              {/* Masrafı / Ödemeyi Yapan */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <label className="block text-xs font-bold text-amber-950 dark:text-amber-300 mb-1.5">
                  {language === 'sr' ? 'Ko je platio trošak? *' : language === 'en' ? 'Paid By *' : 'Ödemeyi Yapan (Masrafı Karşılayan) *'}
                </label>
                <div className="flex flex-wrap gap-2 mb-1.5">
                  {(user?.isPartnership && (user?.partners || []).length > 0
                    ? [...(user?.partners || []), 'Şirket Kasası']
                    : ['Şirket Kasası', 'Nakit', 'Kredi Kartı', 'Banka Havalesi']
                  ).map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => setOilPaidBy(person)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        oilPaidBy === person
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/50 dark:hover:bg-slate-700'
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
                  className="w-full px-2.5 py-1.5 text-xs border border-amber-300 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOilModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.action_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOil}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {isSubmittingOil ? (language === 'sr' ? 'Čuvanje...' : language === 'en' ? 'Saving...' : 'Kaydediliyor...') : (language === 'sr' ? 'Sačuvaj Zamenu Ulja' : language === 'en' ? 'Save Oil Change' : 'Yağ Değişimini Kaydet')}
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

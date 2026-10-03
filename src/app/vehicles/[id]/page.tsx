'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Car,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Wrench,
  Clock,
  Phone,
  Droplet,
  Receipt,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  FileCheck2,
  Edit,
  Plus,
  Trash2,
  Check,
  Fuel,
  TrendingUp,
  Camera,
  ShieldAlert,
  Sparkles,
  Lock,
  Layers,
  Image as ImageIcon,
  DollarSign,
  UserPlus,
  Copy,
  ZoomIn,
  MessageCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import {
  formatDate,
  formatDateTime,
  formatKm,
  formatCurrency,
  formatRsd,
  EUR_TO_RSD_RATE,
  generateParkingFineWhatsAppUrl,
} from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useLanguage } from '@/lib/i18n';

interface PartItem {
  partName: string;
  partCode: string;
  changeDate: string;
  cost: number | string;
}

const DEFAULT_ACCESSORIES = [
  'Telefon Tutucu',
  'Çakmaklık Şarj Aleti',
  'İlk Yardım Çantası',
  'Reflektör & Yangın Tüpü',
  'Paspas Seti',
];

export default function VehicleDetailPage() {
  const { t, language } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Detail Tab
  const [activeTab, setActiveTab] = useState<'maintenances' | 'oil' | 'rentals' | 'inspections' | 'faults' | 'parking'>('maintenances');
  const [isScanningParking, setIsScanningParking] = useState(false);

  // Service Shops
  const [serviceShops, setServiceShops] = useState<any[]>([]);

  // Modal: Maintenance (Bakım & Parçalar)
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintCurrency, setMaintCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintService, setMaintService] = useState('');
  const [customMaintService, setCustomMaintService] = useState('');
  const [laborCost, setLaborCost] = useState<number | string>('');
  const [parts, setParts] = useState<PartItem[]>([
    { partName: '', partCode: '', changeDate: new Date().toISOString().split('T')[0], cost: '' },
  ]);
  const [maintPaidBy, setMaintPaidBy] = useState('Şirket Kasası');
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

  // Modal: Oil Change (Motor Yağı Değişimi)
  const [showOilModal, setShowOilModal] = useState(false);
  const [oilCurrency, setOilCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [oilDate, setOilDate] = useState(new Date().toISOString().split('T')[0]);
  const [oilKm, setOilKm] = useState<number | string>('');
  const [oilType, setOilType] = useState('5W-30 Tam Sentetik');
  const [oilService, setOilService] = useState('');
  const [filterChanged, setFilterChanged] = useState(true);
  const [oilCost, setOilCost] = useState<number | string>(75);
  const [oilNotes, setOilNotes] = useState('');
  const [oilPaidBy, setOilPaidBy] = useState('Şirket Kasası');
  const [isSubmittingOil, setIsSubmittingOil] = useState(false);

  // Modal: Extend Rental (Süre Uzatma)
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState<number | string>(30);
  const [extendAmount, setExtendAmount] = useState<number | string>(350);
  const [extendIsPaid, setExtendIsPaid] = useState<boolean>(true);
  const [extendNotes, setExtendNotes] = useState<string>('');
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);

  // Modal: Return Rental
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnKm, setReturnKm] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [sentToPostCheck, setSentToPostCheck] = useState(true);
  const [returnAccessories, setReturnAccessories] = useState<string[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Modal: Rent Car
  const [showRentModal, setShowRentModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rentTab, setRentTab] = useState<'SELECT' | 'NEW_CUSTOMER'>('SELECT');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustIdNo, setNewCustIdNo] = useState('');
  const [rentStartDate, setRentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentEndDate, setRentEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [rentMonthlyRate, setRentMonthlyRate] = useState<number | string>(350);
  const [rentDiscount, setRentDiscount] = useState<number | string>(0);
  const [rentIsPaid, setRentIsPaid] = useState(true);
  const [rentNotes, setRentNotes] = useState('');
  const [rentAccessories, setRentAccessories] = useState<string[]>(DEFAULT_ACCESSORIES);
  const [rentPhotos, setRentPhotos] = useState({
    front: '/uploads/sample_car_front.svg',
    back: '/uploads/sample_car_back.svg',
    right: '/uploads/sample_car_right.svg',
    left: '/uploads/sample_car_left.svg',
  });
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);
  const [uploadingPhotoSide, setUploadingPhotoSide] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File, side: 'front' | 'back' | 'right' | 'left') => {
    setUploadingPhotoSide(side);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Fotoğraf yüklenemedi');
      const json = await res.json();
      const url = json.fileUrl || json.url;
      if (url) {
        setRentPhotos((prev) => ({ ...prev, [side]: url }));
      }
    } catch (e: any) {
      alert('Fotoğraf yüklenirken hata: ' + e.message);
    } finally {
      setUploadingPhotoSide(null);
    }
  };

  // Modal: Photo Viewer
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<{ front?: string; back?: string; right?: string; left?: string }>({});
  const [viewerTitle, setViewerTitle] = useState('');

  // Modal: Edit Vehicle
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState<number>(2023);
  const [editColor, setEditColor] = useState('');
  const [editKm, setEditKm] = useState<number>(0);
  const [editFuelType, setEditFuelType] = useState('Dizel');
  const [editFuelConsumptionRsd, setEditFuelConsumptionRsd] = useState<number>(1100);
  const [editRegistrationExpiry, setEditRegistrationExpiry] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(6500);
  const [editInitialExpenses, setEditInitialExpenses] = useState<number>(350);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(350);
  const [editDailyPrice, setEditDailyPrice] = useState<number>(25);
  const [editOwner, setEditOwner] = useState('');
  const [editStatus, setEditStatus] = useState('AVAILABLE');
  const [editAccessories, setEditAccessories] = useState<string[]>(DEFAULT_ACCESSORIES);
  const [editNotes, setEditNotes] = useState('');
  const [editVin, setEditVin] = useState('');
  const [editEngineNo, setEditEngineNo] = useState('');
  const [editChronicIssues, setEditChronicIssues] = useState('');
  const [copiedVin, setCopiedVin] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title?: string } | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Faults State & Modals
  const [faultFilter, setFaultFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [faultTitle, setFaultTitle] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [faultSeverity, setFaultSeverity] = useState('MEDIUM');
  const [faultReportedBy, setFaultReportedBy] = useState('');
  const [faultCost, setFaultCost] = useState<number | string>('');
  const [faultCurrency, setFaultCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [isSubmittingFault, setIsSubmittingFault] = useState(false);

  // Modal: Resolve Fault
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedFaultForResolve, setSelectedFaultForResolve] = useState<any | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveCost, setResolveCost] = useState<number | string>('');
  const [resolveCurrency, setResolveCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) router.push('/login');
        return null;
      })
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'faults' || tabParam === 'oil' || tabParam === 'rentals' || tabParam === 'inspections' || tabParam === 'maintenances') {
        setActiveTab(tabParam as any);
      }
    }

    loadVehicle();
    loadServiceShops();
  }, [vehicleId]);

  const loadServiceShops = async () => {
    try {
      const res = await fetch('/api/service-shops');
      if (res.ok) setServiceShops(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.vehicle) {
          const v = json.vehicle;
          setEditBrand(v.brand);
          setEditModel(v.model);
          setEditYear(v.modelYear);
          setEditColor(v.color || '');
          setEditKm(v.currentKm);
          setEditFuelType(v.fuelType || 'Dizel');
          setEditFuelConsumptionRsd(v.fuelConsumptionRsd || 1100);
          setEditRegistrationExpiry(v.registrationExpiry ? v.registrationExpiry.slice(0, 10) : '');
          setEditPurchasePrice(v.purchasePrice || 0);
          setEditInitialExpenses(v.initialExpenses || 0);
          setEditMonthlyPrice(v.monthlyPrice || 350);
          setEditDailyPrice(v.dailyPrice || 25);
          setEditOwner(v.owner || '');
          setEditStatus(v.status);
          setEditNotes(v.notes || '');
          setEditVin(v.vin || '');
          setEditEngineNo(v.engineNo || '');
          setEditChronicIssues(v.chronicIssues || '');

          let accList = DEFAULT_ACCESSORIES;
          if (v.accessories) {
            try {
              accList = JSON.parse(v.accessories);
            } catch {
              accList = DEFAULT_ACCESSORIES;
            }
          }
          setEditAccessories(accList);
          setOilKm(v.currentKm);
        }
      } else {
        alert('Araç bulunamadı.');
        router.push('/vehicles');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle Maintenance Submit
  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintDesc) {
      alert('Bakım açıklaması zorunludur.');
      return;
    }
    setIsSubmittingMaint(true);
    try {
      const resolvedService = maintService === 'OTHER' ? customMaintService : maintService;

      const validParts = parts
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
          vehicleId,
          maintenanceDate: maintDate,
          currency: maintCurrency,
          laborCost: parseFloat(laborCost.toString()) || 0,
          description: maintDesc,
          serviceName: resolvedService,
          parts: validParts,
          paidBy: maintPaidBy,
        }),
      });

      if (res.ok) {
        setShowMaintModal(false);
        setMaintDesc('');
        setMaintService('');
        setCustomMaintService('');
        setLaborCost('');
        setParts([{ partName: '', partCode: '', changeDate: new Date().toISOString().split('T')[0], cost: '' }]);
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Bakım eklenemedi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMaint(false);
    }
  };

  // Handle Oil Change Submit
  const handleOilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOil(true);
    try {
      const res = await fetch('/api/oil-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          changeDate: oilDate,
          currency: oilCurrency,
          km: parseInt(oilKm.toString(), 10) || data?.vehicle?.currentKm || 0,
          oilType,
          serviceName: oilService,
          filterChanged,
          cost: parseFloat(oilCost.toString()) || 0,
          notes: oilNotes,
          paidBy: oilPaidBy,
        }),
      });

      if (res.ok) {
        setShowOilModal(false);
        setOilNotes('');
        await loadVehicle();
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

  // Handle Extend Submit
  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.activeRental) return;
    setIsSubmittingExtend(true);
    try {
      const res = await fetch('/api/rentals/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: data.activeRental.id,
          additionalDays: parseInt(String(extendDays), 10) || 30,
          additionalAmount: parseFloat(String(extendAmount)) || 0,
          isPaid: extendIsPaid,
          notes: extendNotes,
        }),
      });
      if (res.ok) {
        setShowExtendModal(false);
        setExtendNotes('');
        await loadVehicle();
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

  // Add Part Row
  const addPartRow = () => {
    setParts([
      ...parts,
      { partName: '', partCode: '', changeDate: maintDate, cost: '' },
    ]);
  };

  const removePartRow = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePartRow = (index: number, field: keyof PartItem, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const totalPartsInForm = parts.reduce((acc, p) => acc + (parseFloat(p.cost.toString()) || 0), 0);
  const totalMaintCostInForm = (parseFloat(laborCost.toString()) || 0) + totalPartsInForm;

  // Open Return Modal
  const openReturnModal = () => {
    if (!data?.activeRental) return;
    setReturnKm(data.vehicle.currentKm.toString());
    setReturnNotes('');
    setSentToPostCheck(true);

    // Initial check from delivery accessories
    let delivered: string[] = DEFAULT_ACCESSORIES;
    if (data.activeRental.deliveryAccessories) {
      try {
        delivered = JSON.parse(data.activeRental.deliveryAccessories);
      } catch {
        delivered = DEFAULT_ACCESSORIES;
      }
    }
    setReturnAccessories(delivered);
    setShowReturnModal(true);
  };

  // Handle Return Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.activeRental) return;
    setIsSubmittingReturn(true);
    try {
      const res = await fetch('/api/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: data.activeRental.id,
          returnKm: returnKm ? parseInt(returnKm, 10) : undefined,
          notes: returnNotes,
          sentToPostCheck,
          returnAccessories: JSON.stringify(returnAccessories),
        }),
      });
      if (res.ok) {
        setShowReturnModal(false);
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'İade işlemi yapılamadı');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Open Rent Modal
  const openRentModal = async () => {
    try {
      const cRes = await fetch('/api/customers');
      if (cRes.ok) setCustomers(await cRes.json());
      setRentMonthlyRate(data?.vehicle?.monthlyPrice || 350);
      setRentDiscount(0);
      setRentIsPaid(true);

      let initialAcc = DEFAULT_ACCESSORIES;
      if (data?.vehicle?.accessories) {
        try {
          initialAcc = JSON.parse(data.vehicle.accessories);
        } catch {
          initialAcc = DEFAULT_ACCESSORIES;
        }
      }
      setRentAccessories(initialAcc);
      setShowRentModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Rent Submit
  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetCustomerId = selectedCustomerId;

    if (rentTab === 'NEW_CUSTOMER') {
      if (!newCustName.trim() || !newCustPhone.trim()) {
        alert('Lütfen müşteri ad soyad ve telefon numarasını giriniz.');
        return;
      }

      try {
        const createRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCustName.trim(),
            phone: newCustPhone.trim(),
            identityNo: newCustIdNo.trim() || undefined,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          alert(err.error || 'Yeni müşteri oluşturulamadı');
          return;
        }

        const newCustomer = await createRes.json();
        targetCustomerId = newCustomer.id;
      } catch (err: any) {
        alert('Müşteri oluşturulurken hata: ' + err.message);
        return;
      }
    }

    if (!targetCustomerId) {
      alert('Lütfen müşteri seçiniz.');
      return;
    }

    setIsSubmittingRent(true);
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          customerId: targetCustomerId,
          startDate: rentStartDate,
          endDate: rentEndDate,
          monthlyRate: parseFloat(rentMonthlyRate.toString()) || 350,
          discountAmount: parseFloat(rentDiscount.toString()) || 0,
          isPaid: rentIsPaid,
          notes: rentNotes,
          deliveryAccessories: JSON.stringify(rentAccessories),
          photoFront: rentPhotos.front,
          photoBack: rentPhotos.back,
          photoRight: rentPhotos.right,
          photoLeft: rentPhotos.left,
        }),
      });

      if (res.ok) {
        setShowRentModal(false);
        setSelectedCustomerId('');
        setNewCustName('');
        setNewCustPhone('');
        setNewCustIdNo('');
        setRentNotes('');
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Kiralama başlatılamadı');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingRent(false);
    }
  };

  // Open Photos Viewer
  const openPhotosModal = (rental: any, title: string) => {
    setViewerPhotos({
      front: rental.photoFront || '/uploads/sample_car_front.svg',
      back: rental.photoBack || '/uploads/sample_car_back.svg',
      right: rental.photoRight || '/uploads/sample_car_right.svg',
      left: rental.photoLeft || '/uploads/sample_car_left.svg',
    });
    setViewerTitle(title);
    setPhotoViewerOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: editBrand,
          model: editModel,
          modelYear: editYear,
          color: editColor,
          currentKm: editKm,
          fuelType: editFuelType,
          fuelConsumptionRsd: editFuelConsumptionRsd,
          registrationExpiry: editRegistrationExpiry || null,
          purchasePrice: editPurchasePrice,
          initialExpenses: editInitialExpenses,
          monthlyPrice: editMonthlyPrice,
          dailyPrice: editDailyPrice,
          owner: editOwner,
          status: editStatus,
          accessories: JSON.stringify(editAccessories),
          vin: editVin,
          engineNo: editEngineNo,
          chronicIssues: editChronicIssues,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Güncellenemedi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Quick Action: Mark as Available (Temizlik / Kontrol Tamamlandı)
  const handleMarkAsAvailable = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      if (res.ok) {
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Araç durumu güncellenemedi');
      }
    } catch (e) {
      console.error(e);
      alert('İşlem sırasında hata oluştu.');
    }
  };

  // Handle Delete Vehicle (STAFF protected)
  const handleDeleteVehicle = async () => {
    if (currentUser?.role === 'STAFF') {
      alert('Çalışanların (STAFF) sistemden araç veya veri silme yetkisi yoktur!');
      return;
    }

    if (!confirm('Bu aracı kalıcı olarak silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Araç başarıyla silindi.');
        router.push('/vehicles');
      } else {
        const err = await res.json();
        alert(err.error || 'Araç silinemedi.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Faults Handlers
  const handleFaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultTitle.trim()) {
      alert('Lütfen arıza başlığı giriniz.');
      return;
    }
    setIsSubmittingFault(true);
    try {
      const res = await fetch('/api/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          title: faultTitle.trim(),
          description: faultDescription.trim(),
          severity: faultSeverity,
          reportedBy: faultReportedBy.trim() || currentUser?.name || 'Yönetici',
          cost: faultCost ? parseFloat(faultCost.toString()) : undefined,
          currency: faultCurrency,
        }),
      });
      if (res.ok) {
        setShowFaultModal(false);
        setFaultTitle('');
        setFaultDescription('');
        setFaultCost('');
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Arıza kaydedilemedi');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingFault(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaultForResolve) return;
    setIsSubmittingResolve(true);
    try {
      const res = await fetch(`/api/faults/${selectedFaultForResolve.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolutionNotes: resolveNotes.trim() || 'Arıza giderildi ve kontrol edildi.',
          cost: resolveCost ? parseFloat(resolveCost.toString()) : selectedFaultForResolve.cost,
          currency: resolveCurrency,
        }),
      });
      if (res.ok) {
        setShowResolveModal(false);
        setSelectedFaultForResolve(null);
        setResolveNotes('');
        setResolveCost('');
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'İşlem yapılamadı');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const handleReopenFault = async (faultId: string) => {
    if (!confirm('Bu arızayı tekrar açık duruma getirmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/faults/${faultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'OPEN',
          reopen: true,
        }),
      });
      if (res.ok) {
        await loadVehicle();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteFault = async (faultId: string) => {
    if (currentUser?.role === 'STAFF') {
      alert('Çalışanların arıza kaydı silme yetkisi yoktur!');
      return;
    }
    if (!confirm('Bu arıza kaydını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/faults/${faultId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Arıza silinemedi');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Parking Ticket Handlers
  const handleScanThisVehicle = async () => {
    try {
      setIsScanningParking(true);
      const res = await fetch('/api/parking-tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(
          `${data?.vehicle?.plate || 'Araç'} tarandı.\n${
            resData.newTicketsCount > 0
              ? `${resData.newTicketsCount} adet YENİ ceza bulundu!`
              : 'Yeni bir ceza tespit edilmedi.'
          }`
        );
        await loadVehicle();
      } else {
        alert(resData.error || 'Tarama hatası.');
      }
    } catch (e: any) {
      alert(e.message || 'Sorgulama yapılamadı.');
    } finally {
      setIsScanningParking(false);
    }
  };

  const handleToggleTicketStatus = async (ticketId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      const res = await fetch(`/api/parking-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Güncellenemedi');
      }
    } catch (e) {
      console.error(e);
      alert('İşlem başarısız.');
    }
  };

  const handleNotifyWhatsApp = async (ticket: any) => {
    if (!ticket.customer?.phone) {
      alert('Bu cezaya bağlı kayıtlı müşteri telefonu bulunamadı.');
      return;
    }
    const url = generateParkingFineWhatsAppUrl(
      ticket.customer.phone,
      ticket.customer.name,
      ticket,
      data?.companyName || 'Filo Yönetim'
    );
    window.open(url, '_blank');
    if (!ticket.isCustomerNotified) {
      try {
        await fetch(`/api/parking-tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCustomerNotified: true }),
        });
        await loadVehicle();
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-200">Araç Detayları Getiriliyor...</p>
        </div>
      </div>
    );
  }

  if (!data?.vehicle) return null;

  const {
    vehicle,
    activeRental,
    latestMaintenance,
    latestOilChange,
    latestInspection,
    totalExpenses,
    totalMaintenanceCost,
    totalOilCost,
    totalInspectionCost,
    roi,
    registrationDaysLeft,
    maintenances,
    oilChanges,
    inspections,
    rentalHistory,
  } = data;

  const isRented = vehicle.status === 'RENTED';
  const isAvail = vehicle.status === 'AVAILABLE';
  const isPostCheck = vehicle.status === 'POST_RENTAL_CHECK';
  const isStaff = currentUser?.role === 'STAFF';

  // Accessories list parsed
  let vehicleAccessoriesList: string[] = DEFAULT_ACCESSORIES;
  if (vehicle.accessories) {
    try {
      vehicleAccessoriesList = JSON.parse(vehicle.accessories);
    } catch {
      vehicleAccessoriesList = DEFAULT_ACCESSORIES;
    }
  }

  return (
    <AppLayout currentUser={currentUser} requiredFeature="vehicles">
      {/* Top Breadcrumb & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/vehicles"
            className="text-slate-500 hover:text-amber-600 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'sr' ? 'Lista Vozila' : language === 'en' ? 'Vehicle List' : 'Araçlar Listesi'}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{vehicle.plate}</span>
          <span className="text-slate-400">({vehicle.owner || (currentUser?.isPartnership ? (language === 'sr' ? 'Nije navedeno' : language === 'en' ? 'Unassigned' : 'Belirtilmedi') : (currentUser?.fleetName || (language === 'sr' ? 'Flota' : language === 'en' ? 'Fleet' : 'Filo')))})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRented ? (
            <>
              <button
                onClick={() => {
                  setExtendDays(30);
                  setExtendAmount(activeRental?.monthlyRate || vehicle.monthlyPrice || 350);
                  setExtendIsPaid(true);
                  setExtendNotes('');
                  setShowExtendModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                title={language === 'sr' ? 'Produži ugovor o zakupu' : language === 'en' ? 'Extend rental period' : 'Kiralama süresini uzat'}
              >
                <Clock className="w-4 h-4" />
                {language === 'sr' ? 'Produži Rok' : language === 'en' ? 'Extend Rental' : 'Süre Uzat'}
              </button>
              <button
                onClick={openReturnModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {language === 'sr' ? 'Preuzmi Vozilo' : language === 'en' ? 'Return Vehicle' : 'Aracı Müşteriden İade Al'}
              </button>
            </>
          ) : (
            <button
              onClick={openRentModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {language === 'sr' ? 'Iznajmi Klijentu' : language === 'en' ? 'Rent to Client' : 'Müşteriye Kirala'}
            </button>
          )}

          {/* Action: Add Maintenance */}
          <button
            onClick={() => setShowMaintModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <Wrench className="w-4 h-4" />
            {language === 'sr' ? '+ Servis & Delovi' : language === 'en' ? '+ Service & Parts' : '+ Bakım & Parça Gir'}
          </button>

          {/* Action: Add Oil Change */}
          <button
            onClick={() => {
              setOilKm(vehicle.currentKm);
              setShowOilModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <Droplet className="w-4 h-4" />
            {language === 'sr' ? '+ Motorno Ulje' : language === 'en' ? '+ Engine Oil' : '+ Motor Yağı'}
          </button>

          {/* Edit Vehicle */}
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            <Edit className="w-4 h-4" />
            {language === 'sr' ? 'Izmeni' : language === 'en' ? 'Edit' : 'Düzenle'}
          </button>

          {/* Action: Add Vehicle Fault */}
          <button
            onClick={() => {
              setFaultTitle('');
              setFaultDescription('');
              setFaultSeverity('MEDIUM');
              setFaultCost('');
              setShowFaultModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {language === 'sr' ? '+ Prijavi Kvar' : language === 'en' ? '+ Report Fault' : '+ Arıza Bildir'}
          </button>

          {/* Action: Belgrade Parking Servis Tara */}
          <button
            onClick={handleScanThisVehicle}
            disabled={isScanningParking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            title="Belgrade Parking Servis üzerinden eDPK ceza sorgulaması yap"
          >
            <RefreshCw className={`w-4 h-4 ${isScanningParking ? 'animate-spin' : ''}`} />
            {isScanningParking ? (language === 'sr' ? 'Provera...' : language === 'en' ? 'Scanning...' : 'Taranıyor...') : (language === 'sr' ? 'Proveri Kazne' : language === 'en' ? 'Check Fines' : 'Park Cezası Sorgula')}
          </button>

          {/* Delete Vehicle (Hidden for Staff) */}
          {!isStaff && (
            <button
              onClick={handleDeleteVehicle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              title={language === 'sr' ? 'Samo administratori i ortaci mogu obrisati' : language === 'en' ? 'Only admins and partners can delete' : 'Yalnızca Ortaklar/Yöneticiler silebilir'}
            >
              <Trash2 className="w-4 h-4" />
              {language === 'sr' ? 'Obriši' : language === 'en' ? 'Delete' : 'Sil'}
            </button>
          )}
        </div>
      </div>

      {/* Active Fault Alert Banner */}
      {data?.faults?.some((f: any) => f.status === 'OPEN' || f.status === 'IN_PROGRESS') && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                Bu Araçta Çözüm Bekleyen Aktif Arıza Var! ({data.faults.filter((f: any) => f.status !== 'RESOLVED').length} Arıza)
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Son Bildirilen: <b>{data.faults.find((f: any) => f.status !== 'RESOLVED')?.title}</b>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('faults')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors shrink-0"
          >
            Arızaları Gör & Düzelt
          </button>
        </div>
      )}

      {/* Kiradan Sonra Yıkama / Kontrol Hatırlatma Bannerı */}
      {isPostCheck && (
        <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-300 text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-sky-950">
                Kiradan Sonra Yıkama & Kontrol Hatırlatması
              </h4>
              <p className="text-xs text-sky-800 mt-0.5">
                Bu araç kiradan teslim alındı. İsterseniz hemen yeni müşteriye kiralayabilir ya da temizlik/kontrol tamamlandığında tek tıkla <b>Müsait</b> durumuna getirebilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleMarkAsAvailable}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              ✓ Temizlik Tamamlandı (Müsait Yap)
            </button>
          </div>
        </div>
      )}

      {/* Kronik Arıza & Önemli Not Bannerı */}
      {vehicle.chronicIssues && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  ⚠️ Bu Aracın Kronik Arızası / Dikkat Edilecek Bilgisi Var
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Düzenle
                </button>
              </div>
              <div className="mt-1.5 p-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm font-semibold text-slate-900">
                {vehicle.chronicIssues}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Vehicle Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mb-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 font-bold">
              <Car className="w-10 h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 bg-slate-950 text-amber-400 font-mono font-black text-xl rounded-xl tracking-wider shadow-xs border border-amber-500/30">
                  {vehicle.plate}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isRented
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : isAvail
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isPostCheck
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {isRented
                    ? 'Müşteride (Kirada)'
                    : isAvail
                    ? 'Boşta (Kiralanabilir)'
                    : isPostCheck
                    ? 'Kira Sonrası Kontrol / Temizlik'
                    : 'Bakımda'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  {currentUser?.isPartnership ? 'Ortak: ' : 'Sahip: '}
                  {vehicle.owner || (currentUser?.isPartnership ? 'Belirtilmedi' : (currentUser?.fleetName || 'Filo'))}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span>Model Yılı: <b>{vehicle.modelYear}</b></span>
                <span>•</span>
                <span>KM: <b>{formatKm(vehicle.currentKm)}</b></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  {vehicle.fuelType || 'Dizel'}
                </span>
                {vehicle.fuelConsumptionRsd && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-900 font-mono font-bold rounded-md border border-amber-200">
                    100 km: {vehicle.fuelConsumptionRsd} RSD
                  </span>
                )}
                <span>•</span>
                <span>Aylık Kira: <b>{vehicle.monthlyPrice || 350} €</b></span>
              </div>

              {/* VIN & Motor No Detayları */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">Şasi No (VIN):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {vehicle.vin || 'Belirtilmedi'}
                  </span>
                  {vehicle.vin && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(vehicle.vin);
                        setCopiedVin(true);
                        setTimeout(() => setCopiedVin(false), 2000);
                      }}
                      className="ml-1 p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                      title="Şasi Numarasını Kopyala"
                    >
                      {copiedVin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold">Motor No:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {vehicle.engineNo || 'Belirtilmedi'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="text-right pr-4 border-r border-slate-200">
              <div className="text-xs font-bold uppercase text-slate-400">Toplam Gider (€)</div>
              <div className="text-xl font-black text-rose-600">
                {formatCurrency(totalExpenses, 'EUR')}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Bakım: {formatCurrency(totalMaintenanceCost, 'EUR')} | Yağ: {formatCurrency(totalOilCost, 'EUR')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase text-slate-400">Sabit Kur</div>
              <div className="text-xs font-mono font-bold text-slate-800">
                1 € = 117 RSD
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Kayıt: {formatDate(vehicle.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AMORTIZATION / ROI SUMMARY (ADMIN ONLY - HIDDEN/MASKED FOR STAFF) */}
      <div className="mb-6">
        {isStaff ? (
          <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Araç Satın Alma, Amortisman ve Finansal Kazanç İstatistikleri çalışan (STAFF) rolüne gizlenmiştir.</span>
          </div>
        ) : roi ? (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-lg border border-slate-700/60 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Araç Yatırım Geri Dönüşü (Amortisman & Kârlılık Takibi)
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {roi.isAmortized ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 inline" />
                      Araç Kendini Amorti Etti! Net Kâr Dönemi.
                    </span>
                  ) : (
                    <span>
                      Amortisman İçin Gerekli Kalan Tutar: <b className="text-amber-400">{formatCurrency(roi.remainingAmortization, 'EUR')}</b>
                    </span>
                  )}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  İlerleme: %{roi.amortizationPercent}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/60 rounded-full h-3 mb-6 overflow-hidden border border-slate-600/50">
              <div
                className={`h-full transition-all duration-500 ${
                  roi.isAmortized
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300'
                }`}
                style={{ width: `${Math.min(100, roi.amortizationPercent)}%` }}
              />
            </div>

            {/* ROI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700/60">
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Satın Alınma Fiyatı</div>
                <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                  {formatCurrency(roi.purchasePrice, 'EUR')}
                </div>
                <div className="text-xs text-slate-400">
                  Devir/Masraf: {formatCurrency(roi.initialExpenses, 'EUR')}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Toplam Yatırım Tutarı</div>
                <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                  {formatCurrency(roi.totalInvestment, 'EUR')}
                </div>
                <div className="text-xs text-slate-400">
                  Alış + Tescil Maliyeti
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Kazanılan Kira Geliri</div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(roi.rentalRevenue, 'EUR')}
                </div>
                <div className="text-xs text-slate-400">
                  Toplam Kiralamalardan
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Net Kâr / Durum</div>
                <div
                  className={`text-base font-black font-mono mt-0.5 ${
                    roi.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(roi.netProfit, 'EUR')}
                </div>
                <div className="text-xs text-slate-400">
                  {roi.isAmortized ? 'Net Şirket Kazancı' : 'Amorti Edilmek Üzere'}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 5 CRITICAL OPERATIONAL CARDS */}
      <div className="mb-2">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Kritik Operasyonel Kartlar & Zaman Damgaları
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* 1. SIRBİSTAN REGISTRACIJA (MUAYENE & TESCİL) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                1. Registracija (Zorunlu Tescil)
              </span>
              {vehicle.registrationExpiry && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-purple-50 text-purple-800">
                  Sırbistan
                </span>
              )}
            </div>

            {vehicle.registrationExpiry ? (
              <>
                <div className="text-lg font-black text-slate-900">
                  {formatDate(vehicle.registrationExpiry)}
                </div>
                <div className="mt-1">
                  {registrationDaysLeft !== null && registrationDaysLeft < 0 ? (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>SÜRESİ DOLDU! Araç trafiğe çıkamaz!</span>
                    </div>
                  ) : registrationDaysLeft !== null && registrationDaysLeft <= 30 ? (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{registrationDaysLeft} gün kaldı. Yenileme randevusu alınız!</span>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Geçerli ({registrationDaysLeft} gün var)</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-3 text-xs text-rose-600 font-bold">
                Registracija tarihi girilmedi! Hemen düzenleyiniz.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Yılda 1 Kez Zorunlu</span>
            <Link
              href={`/inspection?search=${encodeURIComponent(vehicle.plate)}`}
              className="font-bold text-purple-700 hover:text-purple-900 hover:underline inline-flex items-center gap-1"
            >
              <span>Muayene Kayıtları</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 2. EN SON NE ZAMAN BAKIM YAPILDI? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                2. En Son Bakım & Parçalar
              </span>
              {latestMaintenance && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-800">
                  {latestMaintenance.serviceName || 'Servis'}
                </span>
              )}
            </div>

            {latestMaintenance ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenances')}
                  className="text-lg font-black text-slate-900 hover:text-blue-600 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>{formatDate(latestMaintenance.maintenanceDate)}</span>
                  <span className="text-xs font-normal text-blue-600">↗ İncele</span>
                </button>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {latestMaintenance.description}
                </p>
                <div className="mt-2 text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>İşçilik: {formatCurrency(latestMaintenance.laborCost, 'EUR')}</span>
                  <span>•</span>
                  <span>Parça: {formatCurrency(latestMaintenance.partsCost, 'EUR')}</span>
                </div>
                <div className="text-xs font-black text-blue-700 mt-0.5">
                  Toplam: {formatCurrency(latestMaintenance.totalCost, 'EUR')} ({latestMaintenance.parts?.length || 0} Parça)
                </div>
              </>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                Bu araç için henüz bakım kaydı girilmedi.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              {latestMaintenance ? formatDateTime(latestMaintenance.createdAt) : '-'}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('maintenances')}
              className="font-bold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Bakımları Gör ({maintenances?.length || 0})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3. YENİ BAKIM TARİHİ NE ZAMAN? (1 Ay Döngüsü) */}
        <div className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                3. Yeni Bakım Tarihi (+1 Ay)
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900">
                1 Aylık Periyot
              </span>
            </div>

            {latestMaintenance?.nextMaintenanceDate ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('maintenances')}
                  className="text-xl font-black text-amber-600 hover:text-amber-700 hover:underline font-mono text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>{formatDate(latestMaintenance.nextMaintenanceDate)}</span>
                  <span className="text-xs font-normal text-amber-700">↗ Plan</span>
                </button>
                <p className="text-xs text-slate-600 mt-1">
                  Son bakımdan itibaren tam 1 ay süreyle otomatik planlanmıştır.
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Periyodik Bakım Aktif
                  </span>
                </div>
              </>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                İlk bakım yapıldığında 1 aylık sonraki bakım tarihi otomatik hesaplanacaktır.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">1 Aylık Periyot</span>
            <button
              type="button"
              onClick={() => setActiveTab('maintenances')}
              className="font-bold text-amber-800 hover:text-amber-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Bakım Planına Git</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 4. EN SON MOTOR YAĞI DEĞİŞİMİ */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-emerald-600" />
                4. Motor Yağı Değişimi
              </span>
              {latestOilChange && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Değişti
                </span>
              )}
            </div>

            {latestOilChange ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('oil')}
                  className="text-lg font-black text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>{formatDate(latestOilChange.changeDate)}</span>
                  <span className="text-xs font-normal text-emerald-700">↗ Yağ Kayıtları</span>
                </button>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  {latestOilChange.oilType} • {formatKm(latestOilChange.km)}
                </p>
                <div className="text-xs text-slate-600 mt-0.5">
                  Filtre: {latestOilChange.filterChanged ? 'Yenilendi' : 'Değişmedi'} • Tutar: <b>{formatCurrency(latestOilChange.cost, 'EUR')}</b>
                </div>
                {latestOilChange.nextChangeKm && (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    Gelecek Yağ Değişimi: {formatKm(latestOilChange.nextChangeKm)}
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                Kayıtlı motor yağı değişimi bulunmuyor.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              {latestOilChange ? formatDateTime(latestOilChange.createdAt) : '-'}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('oil')}
              className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Yağ Değişimleri ({oilChanges?.length || 0})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 5. ARAÇ KİMDE? VE NE KADAR SÜRESİ KALDI? */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                5. Kiralama Durumu: Araç Kimde? Ne Kadar Süresi Kaldı?
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                  activeRental
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : isPostCheck
                    ? 'bg-sky-100 text-sky-900 border border-sky-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeRental
                  ? 'Müşteride Kirada'
                  : isPostCheck
                  ? 'Kira Sonrası Bakımda'
                  : 'Şirkette Boşta'}
              </span>
            </div>

            {activeRental ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <Link
                    href={`/customers?search=${encodeURIComponent(activeRental.customerName)}`}
                    className="text-lg font-black text-slate-900 hover:text-amber-600 hover:underline inline-flex items-center gap-1.5 group/c"
                    title={`${activeRental.customerName} müşterisinin detayına git`}
                  >
                    <span>{activeRental.customerName}</span>
                    <span className="text-xs text-amber-600 opacity-0 group-hover/c:opacity-100 transition-opacity">↗ Müşteri Profili</span>
                  </Link>
                  <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeRental.customerPhone}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Başlangıç: {formatDate(activeRental.startDate)} • Bitiş: <b>{formatDate(activeRental.endDate)}</b>
                  </div>
                  <div className="text-xs text-slate-700 font-bold mt-1">
                    Aylık Fiyat: {formatCurrency(activeRental.monthlyRate || 350, 'EUR')}
                    {activeRental.discountAmount > 0 && (
                      <span className="ml-2 text-rose-600">(-{formatCurrency(activeRental.discountAmount, 'EUR')} İskonto)</span>
                    )}
                  </div>
                  {activeRental.extensionCount > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        🔄 {activeRental.extensionCount} Kez Uzatıldı
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center sm:items-end">
                  <div
                    className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      activeRental.remainingDays < 0
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : activeRental.remainingDays <= 3
                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 mr-1.5" />
                    {activeRental.remainingText}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {/* Condition Photos Button */}
                    <button
                      onClick={() => openPhotosModal(activeRental, `${vehicle.plate} - ${activeRental.customerName} Teslimat Fotoğrafları`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      4 Fotoğraf
                    </button>

                    {/* Süre Uzat Button */}
                    <button
                      onClick={() => {
                        setExtendDays(30);
                        setExtendAmount(activeRental?.monthlyRate || vehicle.monthlyPrice || 350);
                        setExtendIsPaid(true);
                        setExtendNotes('');
                        setShowExtendModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                      title="Kiralama süresini uzat"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Süreyi Uzat
                    </button>
                  </div>
                </div>
              </div>
            ) : isPostCheck ? (
              <div className="py-2">
                <p className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Araç son kiralamadan teslim alındı; kontrol ve temizlik aşamasındadır.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Kontrolü tamamlamak veya bakım kaydı girmek için "+ Bakım & Parça Gir" butonunu kullanabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-500">
                Araç şu anda filoda boştadır. Yeni müşteriye kiralamak için sağ üstteki <b>"Müşteriye Kirala"</b> butonunu kullanınız.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              {activeRental ? formatDateTime(activeRental.createdAt) : '-'}
            </span>
            {activeRental && (
              <Link
                href={`/customers?search=${encodeURIComponent(activeRental.customerName)}`}
                className="font-bold text-purple-700 hover:text-purple-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Müşteri Sayfasına Git</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ARAÇ İÇİ AKSESUARLAR ÇUBUĞU */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            Araç İçi Kayıtlı Aksesuarlar
          </span>
          <span className="text-xs text-slate-400">
            Teslim alma ve verme süreçlerinde bu aksesuarlar kontrol edilir.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {vehicleAccessoriesList.length > 0 ? (
            vehicleAccessoriesList.map((acc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                {acc}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Kayıtlı aksesuar yok.</span>
          )}
        </div>
      </div>

      {/* TABS FOR HISTORICAL LOGS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('maintenances')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'maintenances'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'sr' ? 'Istorija Servisa' : language === 'en' ? 'Service History' : 'Bakım ve Masraf Geçmişi'} ({maintenances?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('oil')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'oil'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'sr' ? 'Zamene Ulja' : language === 'en' ? 'Oil Changes' : 'Motor Yağı Değişimleri'} ({oilChanges?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'rentals'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'sr' ? 'Istorija Najmova' : language === 'en' ? 'Rental History' : 'Kiralama Geçmişi'} ({rentalHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'inspections'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'sr' ? 'Tehnički Pregledi' : language === 'en' ? 'Inspections' : 'Muayene Kayıtları'} ({inspections?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('faults')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'faults'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'sr' ? 'Kvarovi i Oštećenja' : language === 'en' ? 'Faults & Damage' : 'Arıza & Hasarlar'} ({data?.faults?.length || 0})</span>
            {data?.faults?.some((f: any) => f.status !== 'RESOLVED') && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                {data.faults.filter((f: any) => f.status !== 'RESOLVED').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('parking')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'parking'
                ? 'border-amber-500 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'sr' ? 'Parking Kazne' : language === 'en' ? 'Parking Fines' : 'Park Cezaları'} ({vehicle.parkingTickets?.length || 0})</span>
            {vehicle.parkingTickets?.some((t: any) => t.status === 'UNPAID') && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                {vehicle.parkingTickets.filter((t: any) => t.status === 'UNPAID').length}
              </span>
            )}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB 1: MAINTENANCES */}
          {activeTab === 'maintenances' && (
            <div>
              {maintenances?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Bu araç için henüz bakım kaydı girilmedi.
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenances.map((m: any) => (
                    <div
                      key={m.id}
                      className="border border-slate-200 rounded-2xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatDate(m.maintenanceDate)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {m.serviceName || 'Servis Belirtilmedi'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                              m.paidBy && vehicle.owner && m.paidBy !== vehicle.owner
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Ödeyen: <b>{m.paidBy || vehicle.owner || 'Şirket Kasası'}</b>
                            {m.paidBy && vehicle.owner && m.paidBy !== vehicle.owner && (
                              <span className="ml-1 text-[11px] text-amber-800 font-semibold">(Araç: {vehicle.owner})</span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-700">
                            Toplam: {formatCurrency(m.totalCost, 'EUR')}
                          </div>
                          <div className="text-xs text-slate-400">
                            İşçilik: {formatCurrency(m.laborCost, 'EUR')} • Parça: {formatCurrency(m.partsCost, 'EUR')}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium mb-3">{m.description}</p>

                      {/* Parts Table */}
                      {m.parts && m.parts.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                          <div className="text-xs font-bold text-slate-600 mb-2">
                            Değişen / Satın Alınan Parçalar ({m.parts.length}):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {m.parts.map((p: any) => (
                              <div
                                key={p.id}
                                className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-bold text-slate-800">{p.partName}</div>
                                  <div className="text-xs text-slate-400">
                                    {p.partCode || 'Kodu Yok'} • {formatDate(p.changeDate)}
                                  </div>
                                </div>
                                <div className="font-mono font-bold text-slate-900">
                                  {formatCurrency(p.cost, 'EUR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OIL CHANGES */}
          {activeTab === 'oil' && (
            <div>
              {oilChanges?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Motor yağı değişimi kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="py-2.5 px-3">Değişim Tarihi</th>
                        <th className="py-2.5 px-3">Kilometre</th>
                        <th className="py-2.5 px-3">Yağ Türü</th>
                        <th className="py-2.5 px-3">Filtre Durumu</th>
                        <th className="py-2.5 px-3">Servis</th>
                        <th className="py-2.5 px-3">Ödeyen</th>
                        <th className="py-2.5 px-3">Maliyet</th>
                        <th className="py-2.5 px-3">Gelecek Yağ Değişimi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {oilChanges.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatDate(o.changeDate)}</td>
                          <td className="py-2.5 px-3 font-mono">{formatKm(o.km)}</td>
                          <td className="py-2.5 px-3">{o.oilType}</td>
                          <td className="py-2.5 px-3">
                            {o.filterChanged ? (
                              <span className="text-emerald-700 font-bold">✓ Değişti</span>
                            ) : (
                              <span className="text-slate-400">Değişmedi</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{o.serviceName || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                                o.paidBy && vehicle.owner && o.paidBy !== vehicle.owner
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {o.paidBy || vehicle.owner || 'Şirket Kasası'}
                              {o.paidBy && vehicle.owner && o.paidBy !== vehicle.owner && (
                                <span className="ml-1 text-[11px] text-amber-800">🤝</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(o.cost, 'EUR')}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                            {o.nextChangeKm ? formatKm(o.nextChangeKm) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RENTAL HISTORY */}
          {activeTab === 'rentals' && (
            <div>
              {rentalHistory?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Bu araç için kiralama geçmişi bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="py-2.5 px-3">Müşteri</th>
                        <th className="py-2.5 px-3">Başlangıç</th>
                        <th className="py-2.5 px-3">Bitiş</th>
                        <th className="py-2.5 px-3">Aylık / Günlük</th>
                        <th className="py-2.5 px-3">Durum</th>
                        <th className="py-2.5 px-3">Teslim / İade KM</th>
                        <th className="py-2.5 px-3 text-right">Fotoğraflar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rentalHistory.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            {r.customer?.name ? (
                              <Link
                                href={`/customers?search=${encodeURIComponent(r.customer.name)}`}
                                className="font-bold text-slate-900 hover:text-amber-600 hover:underline inline-flex items-center gap-1 group/c"
                                title={`${r.customer.name} müşterisinin profiline git`}
                              >
                                <span>{r.customer.name}</span>
                                <span className="text-[10px] text-amber-600 opacity-0 group-hover/c:opacity-100 transition-opacity">↗</span>
                              </Link>
                            ) : (
                              <div className="font-bold text-slate-900">-</div>
                            )}
                            <div className="text-xs text-slate-400">{r.customer?.phone}</div>
                          </td>
                          <td className="py-2.5 px-3">{formatDate(r.startDate)}</td>
                          <td className="py-2.5 px-3">{formatDate(r.endDate)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {formatCurrency(r.monthlyRate || 350, 'EUR')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.status === 'ACTIVE'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.status === 'ACTIVE'
                                ? (language === 'sr' ? 'Aktivan' : language === 'en' ? 'Active' : 'Aktif')
                                : (language === 'sr' ? 'Završeno' : language === 'en' ? 'Completed' : 'Tamamlandı')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {r.startKm ? formatKm(r.startKm) : '-'} / {r.returnKm ? formatKm(r.returnKm) : (language === 'sr' ? 'Kod klijenta' : language === 'en' ? 'With client' : 'Müşteride')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => openPhotosModal(r, `${vehicle.plate} - ${r.customer?.name} Teslimat Fotoğrafları`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              <Camera className="w-3 h-3 text-amber-600" />
                              {language === 'sr' ? 'Fotografije' : language === 'en' ? 'Photos' : 'Fotoğraflar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INSPECTIONS */}
          {activeTab === 'inspections' && (
            <div>
              {inspections?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  Muayene kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="py-2.5 px-3">Muayene Tarihi</th>
                        <th className="py-2.5 px-3">İstasyon (Tehnički Pregled)</th>
                        <th className="py-2.5 px-3">Gelecek Muayene (1 Yıl)</th>
                        <th className="py-2.5 px-3">Maliyet</th>
                        <th className="py-2.5 px-3">Notlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspections.map((i: any) => (
                        <tr key={i.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatDate(i.inspectionDate)}</td>
                          <td className="py-2.5 px-3">{i.station || 'Belirtilmedi'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                            {formatDate(i.nextInspectionDate)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(i.cost, 'EUR')}</td>
                          <td className="py-2.5 px-3 text-slate-600">{i.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FAULTS (ARIZALAR & HASARLAR) */}
          {activeTab === 'faults' && (
            <div>
              {/* Faults Header with Filter and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFaultFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      faultFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tüm Arızalar ({data.faults?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaultFilter('OPEN')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      faultFilter === 'OPEN'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                    <span>Açık / Bekliyor ({data.faults?.filter((f: any) => f.status !== 'RESOLVED').length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaultFilter('RESOLVED')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                      faultFilter === 'RESOLVED'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Düzeltildi ({data.faults?.filter((f: any) => f.status === 'RESOLVED').length || 0})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFaultTitle('');
                    setFaultDescription('');
                    setFaultSeverity('MEDIUM');
                    setFaultCost('');
                    setShowFaultModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yeni Arıza Bildir
                </button>
              </div>

              {/* Faults List */}
              {(!data.faults || data.faults.length === 0) ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Bu araçta kayıtlı herhangi bir arıza bulunmuyor.</p>
                  <p className="mt-1">Araç mekanik ve kaporta olarak sorunsuz durumda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.faults
                    .filter((f: any) => {
                      if (faultFilter === 'OPEN') return f.status !== 'RESOLVED';
                      if (faultFilter === 'RESOLVED') return f.status === 'RESOLVED';
                      return true;
                    })
                    .map((fault: any) => {
                      const isResolved = fault.status === 'RESOLVED';
                      const isCritical = fault.severity === 'CRITICAL';
                      const isHigh = fault.severity === 'HIGH';

                      return (
                        <div
                          key={fault.id}
                          className={`rounded-2xl border p-4 transition-all ${
                            isResolved
                              ? 'bg-slate-50/60 border-slate-200'
                              : isCritical
                              ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                              : 'bg-white border-amber-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                                  isResolved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : fault.status === 'IN_PROGRESS'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                }`}
                              >
                                {isResolved ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Düzeltildi
                                  </>
                                ) : fault.status === 'IN_PROGRESS' ? (
                                  'Tamirde'
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3" />
                                    Açık / Bekliyor
                                  </>
                                )}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                                  isCritical
                                    ? 'bg-rose-600 text-white border-rose-700'
                                    : isHigh
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : fault.severity === 'LOW'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {isCritical
                                  ? 'KRİTİK (Trafiğe Çıkamaz)'
                                  : isHigh
                                  ? 'Yüksek Önem'
                                  : fault.severity === 'LOW'
                                  ? 'Düşük'
                                  : 'Orta Önem'}
                              </span>

                              <span className="text-xs text-slate-400 font-mono">
                                Bildirim: {formatDate(fault.reportedDate)} • {fault.reportedBy || 'Yetkili'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isResolved ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFaultForResolve(fault);
                                    setResolveNotes('');
                                    setResolveCost(fault.cost || '');
                                    setResolveCurrency(fault.currency || 'EUR');
                                    setShowResolveModal(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                  Düzeltildi Olarak İşaretle
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReopenFault(fault.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                  title="Arıza tekrar nüksettiyse açık duruma getir"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Tekrar Aç
                                </button>
                              )}

                              {!isStaff && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFault(fault.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Arıza kaydını sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 mb-1">
                            {fault.title}
                          </h4>

                          {fault.description && (
                            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                              {fault.description}
                            </p>
                          )}

                          {/* Resolution Details Card */}
                          {isResolved && (
                            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs">
                              <div className="flex items-center justify-between text-emerald-950 font-bold mb-1">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  Çözüm & Onarım Bilgisi:
                                </span>
                                {fault.resolvedDate && (
                                  <span className="font-mono text-xs text-emerald-800">
                                    Düzeltilme: {formatDate(fault.resolvedDate)}
                                  </span>
                                )}
                              </div>
                              <p className="text-emerald-900 font-medium">
                                {fault.resolutionNotes || 'Sorun giderildi ve araç kontrol edildi.'}
                              </p>
                              {fault.cost && (
                                <div className="mt-1 font-bold text-emerald-950 font-mono">
                                  Onarım / Parça Masrafı: {formatCurrency(fault.cost, fault.currency || 'EUR')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PARKING TICKETS (eDPK) */}
          {activeTab === 'parking' && (
            <div className="space-y-4">
              {/* Header & Scan Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Belgrade Parking Servis (eDPK) Kayıtları
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu araca ait elektronik günlük park biletleri (e-Dnevna Parking Karta).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScanThisVehicle}
                  disabled={isScanningParking}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningParking ? 'animate-spin' : ''}`} />
                  {isScanningParking ? 'Parking Servis Sorgulanıyor...' : 'Şimdi Cezaları Sorgula'}
                </button>
              </div>

              {/* 50% İndirim Bilgilendirmesi */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Önemli Kural:</strong> Belgrad Parking Servis kurallarına göre, cezanın
                  düzenlendiği tarihten itibaren 20 gün içinde ödenmesi durumunda %50 indirim hakkı
                  bulunmaktadır.
                </span>
              </div>

              {(!vehicle.parkingTickets || vehicle.parkingTickets.length === 0) ? (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Kayıtlı Park Cezası Bulunamadı
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Bu araç için sistemde aktif veya geçmiş park cezası bulunmuyor.
                  </p>
                  <button
                    type="button"
                    onClick={handleScanThisVehicle}
                    disabled={isScanningParking}
                    className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Şimdi Kontrol Et</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicle.parkingTickets.map((t: any) => {
                    const isUnpaid = t.status === 'UNPAID';
                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isUnpaid
                            ? 'bg-rose-50/20 border-rose-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                                isUnpaid
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isUnpaid ? (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Ödenmedi
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Ödendi
                                </>
                              )}
                            </span>

                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              eDPK: {t.ticketNumber}
                            </span>

                            <span className="text-xs text-slate-500 font-mono">
                              Ref: {t.referenceNumber || '-'}
                            </span>
                          </div>

                          {/* Aksiyon Butonları */}
                          <div className="flex items-center gap-2">
                            {/* WhatsApp Bildir */}
                            {t.customer?.phone && (
                              <button
                                type="button"
                                onClick={() => handleNotifyWhatsApp(t)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Bildir</span>
                              </button>
                            )}

                            {/* Ödendi/Ödenmedi Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleTicketStatus(t.id, t.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                isUnpaid
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isUnpaid ? 'Ödendi İşaretle' : 'Ödenmedi Yap'}
                            </button>
                          </div>
                        </div>

                        {/* Detay Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block font-semibold">Tarih & Saat:</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(t.issueDate)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-semibold">Konum:</span>
                            <span className="font-bold text-slate-800 truncate block mt-0.5" title={t.street || ''}>
                              {t.street || 'Belgrad'} ({t.zone || 'Genel'})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-semibold">Tutar:</span>
                            <span className="font-black text-rose-600 text-sm block mt-0.5">
                              {t.amountRsd?.toLocaleString('tr-TR')} RSD (~{t.amountEur || 0} €)
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block font-semibold">O Tarihteki Müşteri:</span>
                            {t.customer ? (
                              <div className="mt-0.5">
                                <span className="font-bold text-slate-900 block">{t.customer.name}</span>
                                <span className="text-[11px] text-slate-500">{t.customer.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic block mt-0.5">
                                Kirada Değildi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EXTEND RENTAL (SÜRE UZATMA) */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Kiralama Süresini Uzat"
        subtitle={`${vehicle.plate} • ${activeRental?.customerName} için yeni kiralama dönemi`}
        maxWidth="md"
      >
        <div className="mb-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Mevcut İade Tarihi:</span>
            <span className="font-bold font-mono text-slate-800">{activeRental ? formatDate(activeRental.endDate) : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mevcut Toplam:</span>
            <span className="font-bold font-mono text-slate-800">{activeRental?.totalAmount ? `${activeRental.totalAmount} €` : '-'}</span>
          </div>
          {activeRental?.extensionCount > 0 && (
            <div className="flex justify-between text-indigo-600 font-semibold">
              <span>Daha Önceki Uzatmalar:</span>
              <span>{activeRental.extensionCount} kez uzatıldı</span>
            </div>
          )}
        </div>

        <form onSubmit={handleExtendSubmit} className="space-y-4">
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
                    const monthly = activeRental?.monthlyRate || vehicle.monthlyPrice || 350;
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
              placeholder="Müşteri talebiyle 30 gün uzatıldı..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowExtendModal(false)}
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
      </Modal>

      {/* MODAL: RETURN RENTAL */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Aracı Müşteriden Teslim Al"
        subtitle={`${vehicle.plate} • ${activeRental?.customerName} kiralama sözleşmesi sonlandırılıyor`}
        maxWidth="lg"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {/* Süre Uzatma Yönlendirme Banner */}
          <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-indigo-950">Müşteri aracı iade etmek yerine süreyi uzatmak mı istiyor?</div>
              <div className="text-[11px] text-indigo-700">Aracı iade almadan yeni dönemi uzatabilirsiniz.</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowReturnModal(false);
                setExtendDays(30);
                setExtendAmount(activeRental?.monthlyRate || vehicle.monthlyPrice || 350);
                setExtendIsPaid(true);
                setExtendNotes('');
                setShowExtendModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              ⏱️ Süre Uzatmaya Geç
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dönüş Kilometresi (KM) *
            </label>
            <input
              type="number"
              required
              value={returnKm}
              onChange={(e) => setReturnKm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-bold"
            />
          </div>

          {/* Accessories verification checklist */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Araç İçi Aksesuarlar Teslim Kontrolü
              </span>
              {activeRental && (
                <button
                  type="button"
                  onClick={() => openPhotosModal(activeRental, 'Teslim Alma Öncesi Fotoğraflar')}
                  className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <Camera className="w-3 h-3" />
                  Teslimat Fotoğraflarını Karşılaştır
                </button>
              )}
            </div>
            <div className="space-y-2">
              {DEFAULT_ACCESSORIES.map((acc) => {
                const checked = returnAccessories.includes(acc);
                return (
                  <label
                    key={acc}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setReturnAccessories(returnAccessories.filter((x) => x !== acc));
                        } else {
                          setReturnAccessories([...returnAccessories, acc]);
                        }
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>{acc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sent to post check */}
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sentToPostCheck}
                onChange={(e) => setSentToPostCheck(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-sky-950 block">
                  Kira Sonrası Kontrol ve Temizliğe Al (Önerilen)
                </span>
                <span className="text-xs text-sky-800 block mt-0.5">
                  Araç yeni kiracıya verilmeden önce temizlik ve genel kontrol aşamasına alınır.
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              İade Notları & Hasar Tespiti
            </label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Araçta yeni çizik, eksik aksesuar veya not var mı?.."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingReturn}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingReturn ? 'İşleniyor...' : 'Aracı Teslim Al'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RENT VEHICLE */}
      <Modal
        isOpen={showRentModal}
        onClose={() => setShowRentModal(false)}
        title="Aracı Müşteriye Kirala"
        subtitle={`${vehicle.plate} • ${vehicle.brand} ${vehicle.model} (Ortak: ${vehicle.owner})`}
        maxWidth="2xl"
      >
        <form onSubmit={handleRentSubmit} className="space-y-4">
          {/* Customer Selection Tabs */}
          <div className="flex border-b border-slate-200 mb-3">
            <button
              type="button"
              onClick={() => setRentTab('SELECT')}
              className={`pb-2 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                rentTab === 'SELECT'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Kayıtlı Müşteri Seç ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setRentTab('NEW_CUSTOMER')}
              className={`pb-2 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                rentTab === 'NEW_CUSTOMER'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Yeni Müşteri Ekle
            </button>
          </div>

          {rentTab === 'SELECT' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kayıtlı Müşteri Seç *
              </label>
              <select
                required={rentTab === 'SELECT'}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-semibold"
              >
                <option value="">-- Müşteri Seçiniz --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Müşteri Ad Soyad *
                </label>
                <input
                  type="text"
                  required={rentTab === 'NEW_CUSTOMER'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Örn: Marko Jovanovic"
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Telefon Numarası *
                </label>
                <input
                  type="text"
                  required={rentTab === 'NEW_CUSTOMER'}
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+381 6..."
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Pasaport / Kimlik No
                </label>
                <input
                  type="text"
                  value={newCustIdNo}
                  onChange={(e) => setNewCustIdNo(e.target.value)}
                  placeholder="Opsiyonel"
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Dates & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Başlangıç Tarihi *
              </label>
              <input
                type="date"
                required
                value={rentStartDate}
                onChange={(e) => setRentStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bitiş Tarihi (Varsayılan 1 Ay) *
              </label>
              <input
                type="date"
                required
                value={rentEndDate}
                onChange={(e) => setRentEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aylık Kira (€) *
              </label>
              <input
                type="number"
                required
                value={rentMonthlyRate}
                onChange={(e) => setRentMonthlyRate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İskonto / İndirim (€)
              </label>
              <input
                type="number"
                value={rentDiscount}
                onChange={(e) => setRentDiscount(e.target.value)}
                placeholder="Örn: 25"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-bold text-rose-600"
              />
            </div>
          </div>

          {/* Payment confirmed */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rentIsPaid}
                onChange={(e) => setRentIsPaid(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-emerald-950">
                Kira Bedeli Alındı / Ödeme Teyit Edildi (Kira Peşin Tahsilatı)
              </span>
            </label>
          </div>

          {/* Accessories delivered */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-2">
              Müşteriye Teslim Edilen Aksesuarlar
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_ACCESSORIES.map((acc) => {
                const checked = rentAccessories.includes(acc);
                return (
                  <label
                    key={acc}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setRentAccessories(rentAccessories.filter((x) => x !== acc));
                        } else {
                          setRentAccessories([...rentAccessories, acc]);
                        }
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span>{acc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4 Delivery Photos */}
          <div className="border border-slate-200 rounded-xl p-3">
            <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              Teslimat Öncesi 4 Araç Fotoğrafı (Ön, Arka, Sağ, Sol)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['front', 'back', 'right', 'left'] as const).map((side) => {
                const labelMap = { front: 'Ön Cephe', back: 'Arka Cephe', right: 'Sağ Yan', left: 'Sol Yan' };
                const isUploadingThis = uploadingPhotoSide === side;
                return (
                  <div key={side} className="border border-slate-200 rounded-xl p-2 text-center bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1">{labelMap[side]}</span>
                      <div className="relative w-full h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 mb-2">
                        <img
                          src={rentPhotos[side]}
                          alt={side}
                          className="w-full h-full object-cover"
                        />
                        {isUploadingThis && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold">
                            Yükleniyor...
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="block cursor-pointer">
                      <span className="inline-block w-full py-1 px-2 text-xs font-bold text-slate-800 bg-white hover:bg-amber-500 hover:text-slate-950 border border-slate-300 rounded-lg transition-colors text-center shadow-2xs">
                        {isUploadingThis ? 'Bekleyiniz...' : 'Fotoğraf Çek / Seç'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingThis}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file, side);
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kiralama Notları
            </label>
            <textarea
              rows={2}
              value={rentNotes}
              onChange={(e) => setRentNotes(e.target.value)}
              placeholder="Sözleşme şartları, özel istekler..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRentModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingRent}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingRent ? 'Kaydediliyor...' : 'Kiralamayı Başlat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MAINTENANCE (BAKIM & PARÇALAR) */}
      <Modal
        isOpen={showMaintModal}
        onClose={() => setShowMaintModal(false)}
        title="Yeni Bakım & Parça Masrafı Ekle"
        subtitle={`${vehicle.plate} • 1 Aylık yeni periyot otomatik hesaplanacaktır`}
        maxWidth="2xl"
      >
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
                  maintCurrency === 'EUR' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setMaintCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  maintCurrency === 'RSD' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RSD (Dinar)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bakım Tarihi *
              </label>
              <input
                type="date"
                required
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kayıtlı Servis İstasyonu
              </label>
              <select
                value={maintService}
                onChange={(e) => setMaintService(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 font-semibold"
              >
                <option value="">-- Servis Seçiniz --</option>
                {serviceShops.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="OTHER">+ Yeni / Başka Servis Yaz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İşçilik Maliyeti ({maintCurrency}) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                required
                value={laborCost}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="Örn: 80"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 font-mono font-bold"
              />
            </div>
          </div>

          {maintService === 'OTHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yeni Servis Adı Yazın *
              </label>
              <input
                type="text"
                required
                value={customMaintService}
                onChange={(e) => setCustomMaintService(e.target.value)}
                placeholder="Örn: Lav Auto Belgrad"
                className="w-full px-3 py-2 text-xs border border-blue-300 rounded-xl focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yapılan İşlemin Açıklaması *
            </label>
            <textarea
              rows={2}
              required
              value={maintDesc}
              onChange={(e) => setMaintDesc(e.target.value)}
              placeholder="Örn: Fren balataları değişti, ön takım kontrol edildi..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500"
            />
          </div>

          {/* Parts Form */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                Değişen Parçalar Listesi ({parts.length})
              </span>
              <button
                type="button"
                onClick={addPartRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Parça Ekle
              </button>
            </div>

            <div className="space-y-2">
              {parts.map((p, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                  <input
                    type="text"
                    value={p.partName}
                    onChange={(e) => updatePartRow(idx, 'partName', e.target.value)}
                    placeholder="Parça Adı (Örn: Ön Fren Balatası)"
                    className="w-full sm:flex-2 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={p.partCode}
                    onChange={(e) => updatePartRow(idx, 'partCode', e.target.value)}
                    placeholder="Parça Kodu"
                    className="w-full sm:flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={p.cost}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updatePartRow(idx, 'cost', e.target.value)}
                      placeholder={`Tutar (${maintCurrency})`}
                      className="flex-1 sm:w-28 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 font-mono font-bold"
                    />
                    {parts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Toplam Bakım Maliyeti:</span>
              <span className="text-blue-700 text-sm font-black">
                {totalMaintCostInForm} {maintCurrency}
                {maintCurrency === 'RSD' && (
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    (~{(totalMaintCostInForm / EUR_TO_RSD_RATE).toFixed(1)} €)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Masrafı / Ödemeyi Yapan (Kim Ödedi?) */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 mb-1.5">
              Ödemeyi Yapan (Masrafı Karşılayan Ortak) *
            </label>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {(currentUser?.isPartnership && (currentUser?.partners || []).length > 0
                ? [...(currentUser?.partners || []), 'Şirket Kasası']
                : ['Şirket Kasası', 'Nakit', 'Kredi Kartı', 'Banka Havalesi']
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
              placeholder="Veya başka bir isim girin"
              className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl bg-white text-slate-800"
            />
            <span className="text-[11px] text-amber-800 mt-1 block">
              💡 Araç Sahibi: <b>{vehicle.owner}</b>. Başka ortak ödediyse hesap mutabakatında alacak/verecek olarak görünür.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMaintModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingMaint}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingMaint ? 'Kaydediliyor...' : 'Bakımı Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: OIL CHANGE */}
      <Modal
        isOpen={showOilModal}
        onClose={() => setShowOilModal(false)}
        title="Motor Yağı Değişimi Ekle"
        subtitle={`${vehicle.plate} • Ayrı Motor Yağı Takip Formu`}
        maxWidth="lg"
      >
        <form onSubmit={handleOilSubmit} className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800">Maliyet Para Birimi</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setOilCurrency('EUR')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  oilCurrency === 'EUR' ? 'bg-amber-500 text-slate-950' : 'text-slate-600'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setOilCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  oilCurrency === 'RSD' ? 'bg-amber-500 text-slate-950' : 'text-slate-600'
                }`}
              >
                RSD (Dinar)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Değişim Tarihi *
              </label>
              <input
                type="date"
                required
                value={oilDate}
                onChange={(e) => setOilDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Değişim Kilometresi (KM) *
              </label>
              <input
                type="number"
                required
                value={oilKm}
                onChange={(e) => setOilKm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yağ Türü / Viskozite *
              </label>
              <input
                type="text"
                required
                value={oilType}
                onChange={(e) => setOilType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Toplam Tutar ({oilCurrency}) *
              </label>
              <input
                type="number"
                required
                value={oilCost}
                onChange={(e) => setOilCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterChanged}
                onChange={(e) => setFilterChanged(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-emerald-950">
                Yağ Filtresi De Değiştirildi
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notlar
            </label>
            <input
              type="text"
              value={oilNotes}
              onChange={(e) => setOilNotes(e.target.value)}
              placeholder="Marka, istasyon veya ek açıklamalar..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
            />
          </div>

          {/* Masrafı / Ödemeyi Yapan (Kim Ödedi?) */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 mb-1.5">
              Ödemeyi Yapan (Masrafı Karşılayan Ortak) *
            </label>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {(currentUser?.isPartnership && (currentUser?.partners || []).length > 0
                ? [...(currentUser?.partners || []), 'Şirket Kasası']
                : ['Şirket Kasası', 'Nakit', 'Kredi Kartı', 'Banka Havalesi']
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
              placeholder="Veya başka bir isim girin"
              className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-xl bg-white text-slate-800"
            />
            <span className="text-[11px] text-amber-800 mt-1 block">
              💡 Araç Sahibi: <b>{vehicle.owner}</b>. Başka ortak ödediyse hesap mutabakatında alacak/verecek olarak görünür.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowOilModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingOil}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingOil ? 'Kaydediliyor...' : 'Yağ Değişimini Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: 4 CONDITION PHOTOS VIEWER */}
      <Modal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        title="Araç Teslimat Kondisyon Fotoğrafları"
        subtitle={viewerTitle}
        maxWidth="3xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
            <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                1. Ön Cephe
              </span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Büyüt
              </span>
            </span>
            <div
              onClick={() =>
                setLightboxImage({
                  src: viewerPhotos.front || '/uploads/sample_car_front.svg',
                  title: `1. Ön Cephe Fotoğrafı - ${vehicle.plate}`,
                })
              }
              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img
                src={viewerPhotos.front || '/uploads/sample_car_front.svg'}
                alt="Ön Cephe"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
            <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                2. Arka Cephe
              </span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Büyüt
              </span>
            </span>
            <div
              onClick={() =>
                setLightboxImage({
                  src: viewerPhotos.back || '/uploads/sample_car_back.svg',
                  title: `2. Arka Cephe Fotoğrafı - ${vehicle.plate}`,
                })
              }
              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img
                src={viewerPhotos.back || '/uploads/sample_car_back.svg'}
                alt="Arka Cephe"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
            <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                3. Sağ Yan Cephe
              </span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Büyüt
              </span>
            </span>
            <div
              onClick={() =>
                setLightboxImage({
                  src: viewerPhotos.right || '/uploads/sample_car_right.svg',
                  title: `3. Sağ Yan Cephe Fotoğrafı - ${vehicle.plate}`,
                })
              }
              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img
                src={viewerPhotos.right || '/uploads/sample_car_right.svg'}
                alt="Sağ Yan"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
            <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                4. Sol Yan Cephe
              </span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> Büyüt
              </span>
            </span>
            <div
              onClick={() =>
                setLightboxImage({
                  src: viewerPhotos.left || '/uploads/sample_car_left.svg',
                  title: `4. Sol Yan Cephe Fotoğrafı - ${vehicle.plate}`,
                })
              }
              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-white"
            >
              <img
                src={viewerPhotos.left || '/uploads/sample_car_left.svg'}
                alt="Sol Yan"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                <ZoomIn className="w-4 h-4" /> Tam Ekran İncele
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={() => setPhotoViewerOpen(false)}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Kapat
          </button>
        </div>
      </Modal>

      {/* MODAL: EDIT VEHICLE */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Araç Bilgilerini Düzenle"
        subtitle={`${vehicle.plate} filo kaydı güncelleniyor`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {currentUser?.isPartnership ? 'Ortak *' : 'Sahip / Şirket'}
              </label>
              {currentUser?.isPartnership && (currentUser?.partners || []).length > 0 ? (
                <select
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
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
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  placeholder={currentUser?.fleetName || 'Şirket Adı'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marka *</label>
              <input
                type="text"
                required
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                type="text"
                required
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Yılı *</label>
              <input
                type="number"
                required
                value={editYear}
                onChange={(e) => setEditYear(parseInt(e.target.value, 10) || 2023)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Renk</label>
              <input
                type="text"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Güncel KM *</label>
              <input
                type="number"
                required
                value={editKm}
                onChange={(e) => setEditKm(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Durum</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
              >
                <option value="AVAILABLE">Boşta</option>
                <option value="RENTED">Kirada</option>
                <option value="POST_RENTAL_CHECK">Kira Sonrası Kontrol</option>
                <option value="MAINTENANCE">Bakımda</option>
              </select>
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
                value={editVin}
                onChange={(e) => setEditVin(e.target.value.toUpperCase())}
                placeholder="Örn: VF1BZ0A0548123456"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold uppercase bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Motor Numarası
              </label>
              <input
                type="text"
                value={editEngineNo}
                onChange={(e) => setEditEngineNo(e.target.value.toUpperCase())}
                placeholder="Örn: K9K 836 D012345"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold uppercase bg-white"
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
              value={editChronicIssues}
              onChange={(e) => setEditChronicIssues(e.target.value)}
              placeholder="Örn: Yağ yakma eğilimi var, klima sağ menfezden az üflüyor..."
              className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Fuel & Registration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yakıt Türü *</label>
              <select
                value={editFuelType}
                onChange={(e) => setEditFuelType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
              >
                <option value="Dizel">Dizel</option>
                <option value="Benzin">Benzin</option>
                <option value="Benzin+LPG">Benzin + LPG</option>
                <option value="Benzin+Metan">Benzin + Metan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">100km Tüketim (RSD)</label>
              <input
                type="number"
                value={editFuelConsumptionRsd}
                onChange={(e) => setEditFuelConsumptionRsd(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registracija Bitiş</label>
              <input
                type="date"
                value={editRegistrationExpiry}
                onChange={(e) => setEditRegistrationExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Financials (Purchase & Initial) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Satın Alınma Bedeli (€)</label>
              <input
                type="number"
                value={editPurchasePrice}
                onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Alış / Tescil Masrafı (€)</label>
              <input
                type="number"
                value={editInitialExpenses}
                onChange={(e) => setEditInitialExpenses(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Standart Aylık Kira (€)</label>
              <input
                type="number"
                value={editMonthlyPrice}
                onChange={(e) => setEditMonthlyPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notlar</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-colors"
            >
              {isSubmittingEdit ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD FAULT */}
      <Modal
        isOpen={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        title="Yeni Araç Arızası / Hasar Bildir"
        subtitle={`${vehicle.plate} • ${vehicle.brand} ${vehicle.model}`}
        maxWidth="lg"
      >
        <form onSubmit={handleFaultSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Arıza / Sorun Başlığı *
            </label>
            <input
              type="text"
              required
              value={faultTitle}
              onChange={(e) => setFaultTitle(e.target.value)}
              placeholder="Örn: Sağ ön amortisörden kasislerde ses geliyor"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Önem / Aciliyet Seviyesi *
              </label>
              <select
                value={faultSeverity}
                onChange={(e) => setFaultSeverity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 font-bold"
              >
                <option value="LOW">Düşük (Kozmetik / Önemsiz)</option>
                <option value="MEDIUM">Orta (Kısa sürede kontrol edilmeli)</option>
                <option value="HIGH">Yüksek (Acil tamir gerekli)</option>
                <option value="CRITICAL">Kritik (Araç trafiğe çıkamaz!)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arızayı Bildiren Kişi
              </label>
              <input
                type="text"
                value={faultReportedBy}
                onChange={(e) => setFaultReportedBy(e.target.value)}
                placeholder={currentUser?.name || 'Müşteri / Çalışan'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahmini Maliyet (Opsiyonel)
              </label>
              <input
                type="number"
                value={faultCost}
                onChange={(e) => setFaultCost(e.target.value)}
                placeholder="Örn: 80"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Para Birimi
              </label>
              <select
                value={faultCurrency}
                onChange={(e) => setFaultCurrency(e.target.value as 'EUR' | 'RSD')}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 font-bold"
              >
                <option value="EUR">EUR (€)</option>
                <option value="RSD">RSD (Dinar)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detaylı Açıklama / Belirtiler
            </label>
            <textarea
              rows={3}
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="Arıza ne zaman fark edildi, araç sürüşünü nasıl etkiliyor, arıza lambası yanıyor mu?.."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowFaultModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingFault}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingFault ? 'Kaydediliyor...' : 'Arıza Kaydını Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESOLVE FAULT */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Arızayı 'Düzeltildi' Olarak İşaretle"
        subtitle={selectedFaultForResolve ? `${vehicle.plate} • ${selectedFaultForResolve.title}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <span className="font-bold block mb-0.5">Tamamlanma Onayı</span>
            Bu arıza düzeltildi olarak arşivlenecek ve aracın aktif arıza listesinden çıkarılacaktır.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yapılan İşlem ve Çözüm Açıklaması *
            </label>
            <textarea
              rows={3}
              required
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Örn: Parça değiştirildi, test sürüşü yapıldı ve sorun giderildi."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tamir / Onarım Masrafı
              </label>
              <input
                type="number"
                value={resolveCost}
                onChange={(e) => setResolveCost(e.target.value)}
                placeholder="Örn: 90"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Para Birimi
              </label>
              <select
                value={resolveCurrency}
                onChange={(e) => setResolveCurrency(e.target.value as 'EUR' | 'RSD')}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 font-bold"
              >
                <option value="EUR">EUR (€)</option>
                <option value="RSD">RSD (Dinar)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowResolveModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmittingResolve}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmittingResolve ? 'İşleniyor...' : '✓ Düzeltildi Olarak Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

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

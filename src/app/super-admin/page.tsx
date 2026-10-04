'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Car,
  KeyRound,
  ShieldCheck,
  Plus,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Power,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Edit,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  FolderLock,
  Layers,
  Archive,
  Database,
  Eye,
  UserPlus,
  Droplet,
  Wrench,
  FileCheck2,
  BarChart3,
  History,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth-client';
import { useToast } from '@/components/ui/Toast';

const AVAILABLE_MODULES = [
  { key: 'vehicles', label: 'Araç Yönetimi & Envanter', icon: Car, desc: 'Araç listesi, envanter ve plaka kayıtları' },
  { key: 'rentals', label: 'Kiralama & Teslimat Takibi', icon: Calendar, desc: 'Aktif kiralamalar, rezervasyon ve teslim formları' },
  { key: 'customers', label: 'Müşteri & Belge Yönetimi', icon: Users, desc: 'Müşteri profilleri, ehliyet ve pasaport belgeleri' },
  { key: 'maintenance', label: 'Periyodik Bakım & Onarım', icon: Wrench, desc: 'Bakım kayıtları, servis ve masraf dökümleri' },
  { key: 'oilChange', label: 'Motor Yağı Takibi', icon: Droplet, desc: 'Yağ değişim periyotları ve kilometre takibi' },
  { key: 'inspection', label: 'Yıllık Muayene & Registracija', icon: FileCheck2, desc: 'Muayene ve yıllık tescil bitiş bildirimleri' },
  { key: 'parkingTickets', label: 'Park Cezaları (eDPK)', icon: AlertTriangle, desc: 'Elektronik park cezaları ve borç sorguları' },
  { key: 'faults', label: 'Hasar & Arıza Takibi', icon: AlertTriangle, desc: 'Araç hasarları, kaza ve arıza kayıtları' },
  { key: 'finance', label: 'Finansal Analiz & Kasa', icon: BarChart3, desc: 'Gelir/gider raporları ve ortak hakediş kasaları' },
  { key: 'auditLogs', label: 'İşlem Geçmişi (Audit)', icon: History, desc: 'Kullanıcı hareketleri ve sistem denetim izi' },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [fleets, setFleets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'fleets' | 'users' | 'archives'>('fleets');

  // Archive States
  const [archives, setArchives] = useState<any[]>([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [selectedArchiveTable, setSelectedArchiveTable] = useState('ALL');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [viewingArchiveData, setViewingArchiveData] = useState<any | null>(null);

  // Modal: New Fleet
  const [showNewFleetModal, setShowNewFleetModal] = useState(false);
  const [newFleetName, setNewFleetName] = useState('');
  const [newFleetCode, setNewFleetCode] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('filo123');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Belgrad');
  const [newMaxVehicles, setNewMaxVehicles] = useState<number | string>(20);
  const [newExpiresMonths, setNewExpiresMonths] = useState(12);
  const [newNotes, setNewNotes] = useState('');
  const [newIsPartnership, setNewIsPartnership] = useState(false);
  const [newPartnersInput, setNewPartnersInput] = useState('');
  const [newFeatures, setNewFeatures] = useState<Record<string, boolean>>({
    vehicles: true,
    rentals: true,
    customers: true,
    maintenance: true,
    oilChange: true,
    inspection: true,
    parkingTickets: true,
    faults: true,
    finance: true,
    auditLogs: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Full Fleet Edit & Module Access & Extend License
  const [editingFleet, setEditingFleet] = useState<any | null>(null);
  const [editFleetName, setEditFleetName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('Belgrad');
  const [editMaxVehicles, setEditMaxVehicles] = useState<number | string>(20);
  const [editIsPartnership, setEditIsPartnership] = useState(false);
  const [editPartnersInput, setEditPartnersInput] = useState('');
  const [editFeatures, setEditFeatures] = useState<Record<string, boolean>>({
    vehicles: true,
    rentals: true,
    customers: true,
    maintenance: true,
    oilChange: true,
    inspection: true,
    parkingTickets: true,
    faults: true,
    finance: true,
    auditLogs: true,
  });
  const [extendMonths, setExtendMonths] = useState('0');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal: Add User to Fleet
  const [fleetForNewUser, setFleetForNewUser] = useState<any | null>(null);
  const [fleetUserName, setFleetUserName] = useState('');
  const [fleetUserEmail, setFleetUserEmail] = useState('');
  const [fleetUserPassword, setFleetUserPassword] = useState('filo123');
  const [fleetUserRole, setFleetUserRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [isSubmittingFleetUser, setIsSubmittingFleetUser] = useState(false);
  const [fleetUserError, setFleetUserError] = useState<string | null>(null);

  // Modal: Super Admin Reset User Password
  const [userForPasswordReset, setUserForPasswordReset] = useState<any | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [isSubmittingPasswordReset, setIsSubmittingPasswordReset] = useState(false);

  const openAddUserToFleetModal = (fleet: any) => {
    setFleetForNewUser(fleet);
    setFleetUserName('');
    setFleetUserEmail('');
    setFleetUserPassword('filo123');
    setFleetUserRole('ADMIN');
    setFleetUserError(null);
  };

  const handleAddUserToFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fleetForNewUser) return;
    setIsSubmittingFleetUser(true);
    setFleetUserError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fleetUserName,
          email: fleetUserEmail,
          password: fleetUserPassword,
          role: fleetUserRole,
          fleetId: fleetForNewUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kullanıcı eklenemedi.');
      }

      setFleetForNewUser(null);
      await loadData();
      toast.success(`${fleetUserName} kullanıcısı ${fleetForNewUser.name} filosuna başarıyla eklendi.`);
    } catch (err: any) {
      setFleetUserError(err.message);
      toast.error(err.message || 'Kullanıcı eklenemedi.');
    } finally {
      setIsSubmittingFleetUser(false);
    }
  };

  const handleToggleUserSuspend = async (u: any) => {
    const actionText = u.isActive ? 'askıya almak (erişimini engellemek)' : 'tekrar aktif etmek';
    if (!confirm(`${u.name} kullanıcısını ${actionText} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (res.ok) {
        await loadData();
        toast.success(u.isActive ? `${u.name} askıya alındı.` : `${u.name} aktif edildi.`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'İşlem başarısız.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu.');
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordReset || newPasswordForUser.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setIsSubmittingPasswordReset(true);
    try {
      const res = await fetch(`/api/users/${userForPasswordReset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPasswordForUser }),
      });
      if (res.ok) {
        setUserForPasswordReset(null);
        setNewPasswordForUser('');
        toast.success('Kullanıcı şifresi başarıyla sıfırlandı.');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Şifre sıfırlanamadı.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu.');
    } finally {
      setIsSubmittingPasswordReset(false);
    }
  };

  const fetchArchives = async (tbl: string = selectedArchiveTable, q: string = archiveSearch) => {
    try {
      setArchivesLoading(true);
      const res = await fetch(`/api/archives?table=${encodeURIComponent(tbl)}&search=${encodeURIComponent(q)}`);
      if (res.ok) {
        setArchives(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setArchivesLoading(false);
    }
  };

  const handleDeleteArchiveItem = async (id: string) => {
    if (!confirm('Bu arşiv kaydını veritabanından kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }
    try {
      const res = await fetch(`/api/archives?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setArchives((prev) => prev.filter((a) => a.id !== id));
        toast.success('Arşiv kaydı başarıyla silindi.');
      } else {
        toast.error('Kayıt silinemedi.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Hata oluştu.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, fleetsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/fleets'),
      ]);

      if (meRes.ok) {
        const u = await meRes.json();
        const isSuper =
          u.user &&
          (u.user.role === 'SUPER_ADMIN' ||
            u.user.email === 'super-admin@company.local' ||
            u.user.email === 'super-admin@company.local');

        if (!isSuper) {
          router.push('/');
          return;
        }
        setCurrentUser(u.user);
      } else if (meRes.status === 401) {
        router.push('/login');
        return;
      }

      if (fleetsRes.ok) {
        setFleets(await fleetsRes.json());
      }
      await fetchArchives();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewFleetCode(`FL-${num}`);
  };

  const handleCreateFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const partnersArray = newIsPartnership
        ? newPartnersInput.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/fleets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFleetName,
          code: newFleetCode,
          ownerName: newOwnerName,
          ownerEmail: newOwnerEmail,
          ownerPassword: newOwnerPassword,
          phone: newPhone,
          city: newCity,
          maxVehicles: parseInt(String(newMaxVehicles), 10) || 20,
          expiresMonths: newExpiresMonths,
          notes: newNotes,
          isPartnership: newIsPartnership,
          partners: partnersArray,
          features: newFeatures,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Filo oluşturulamadı.');

      setShowNewFleetModal(false);
      setNewFleetName('');
      setNewFleetCode('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewPhone('');
      setNewNotes('');
      setNewIsPartnership(false);
      setNewPartnersInput('');
      setNewFeatures({
        vehicles: true,
        rentals: true,
        customers: true,
        maintenance: true,
        oilChange: true,
        inspection: true,
        parkingTickets: true,
        faults: true,
        finance: true,
        auditLogs: true,
      });
      await loadData();
      toast.success('Yeni filo ve yönetici hesabı başarıyla tanımlandı.');
    } catch (err: any) {
      setFormError(err.message);
      toast.error(err.message || 'Filo oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (fleetId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/fleets/${fleetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditFleetModal = (fleet: any) => {
    setEditingFleet(fleet);
    setEditFleetName(fleet.name || '');
    setEditOwnerName(fleet.ownerName || '');
    setEditOwnerEmail(fleet.ownerEmail || '');
    setEditPhone(fleet.phone || '');
    setEditCity(fleet.city || 'Belgrad');
    setEditMaxVehicles(fleet.maxVehicles || 20);
    setEditIsPartnership(fleet.isPartnership ?? false);

    let pStr = '';
    if (fleet.partners) {
      try {
        const parsed = JSON.parse(fleet.partners);
        pStr = Array.isArray(parsed) ? parsed.join(', ') : fleet.partners;
      } catch {
        pStr = fleet.partners;
      }
    }
    setEditPartnersInput(pStr);

    const defaultFeat = {
      vehicles: true,
      rentals: true,
      customers: true,
      maintenance: true,
      oilChange: true,
      inspection: true,
      parkingTickets: true,
      faults: true,
      finance: true,
      auditLogs: true,
    };
    let fObj = { ...defaultFeat };
    if (fleet.features) {
      try {
        fObj = { ...defaultFeat, ...JSON.parse(fleet.features) };
      } catch {}
    }
    setEditFeatures(fObj);
    setExtendMonths('0');
    setEditError(null);
  };

  const handleSaveFleetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFleet) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const partnersArray = editIsPartnership
        ? editPartnersInput.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const payload: any = {
        name: editFleetName,
        ownerName: editOwnerName,
        ownerEmail: editOwnerEmail,
        phone: editPhone,
        city: editCity,
        maxVehicles: parseInt(String(editMaxVehicles), 10) || 20,
        isPartnership: editIsPartnership,
        partners: partnersArray,
        features: editFeatures,
      };

      if (parseInt(extendMonths) > 0) {
        payload.extendMonths = extendMonths;
      }

      const res = await fetch(`/api/fleets/${editingFleet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Filo güncellenemedi.');

      setEditingFleet(null);
      await loadData();
      toast.success('Filo bilgileri, ortaklık yapısı ve modül erişimleri başarıyla güncellendi.');
    } catch (err: any) {
      setEditError(err.message);
      toast.error(err.message || 'Filo güncellenemedi.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteFleet = async (fleetId: string, fleetName: string) => {
    if (!confirm(`"${fleetName}" filosunu ve bu filoya ait tüm araç/kullanıcı verilerini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fleets/${fleetId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
        toast.success(`"${fleetName}" filosu başarıyla silindi.`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Filo silinemedi.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Hata oluştu.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // KPI Calculations
  const totalFleets = fleets.length;
  const activeFleets = fleets.filter((f) => f.status === 'ACTIVE').length;
  const totalVehiclesCount = fleets.reduce((acc, f) => acc + (f._count?.vehicles || 0), 0);
  const totalUsersCount = fleets.reduce((acc, f) => acc + (f._count?.users || 0), 0);

  // Filtered Fleets
  const filteredFleets = fleets.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      (f.ownerEmail && f.ownerEmail.toLowerCase().includes(search.toLowerCase())) ||
      (f.ownerName && f.ownerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Super Admin Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs pt-[env(safe-area-inset-top,0px)] w-full">
        <div className="h-16 px-3 sm:px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <FolderLock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">SÜPER YÖNETİCİ</span>
                <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  SaaS Master
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                Sahibi: <b className="text-slate-800">System Owner</b>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Car className="w-4 h-4 text-slate-600" />
              <span>Filo Operasyon Ekranı</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Welcome & Quick Action Hero Banner */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md inline-block">
              Çoklu Filo (Multi-Tenant) Yönetim Merkezi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2.5">
              Hoş Geldiniz, System Owner
            </h2>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Anlaştığınız yeni filolara buradan filo alanı tanımlayabilir, <b>Filo Kodu</b> üreterek sisteme dahil edebilir ve lisans sürelerini denetleyebilirsiniz.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              handleGenerateRandomCode();
              setShowNewFleetModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Yeni Filo Tanımla & Kod Üret
          </button>
        </div>

        {/* Global SaaS KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Toplam Filo</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">{totalFleets}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Sistemdeki kayıtlı filo şirketi</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Aktif Filolar</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-2">{activeFleets}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Çalışan ve lisansı aktif filolar</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Toplam Filo Araçları</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-sky-600 tracking-tight mt-2">{totalVehiclesCount}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Tüm filoların kayıtlı araçları</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Toplam Kullanıcı</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-600 tracking-tight mt-2">{totalUsersCount}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Filo yöneticileri ve çalışanlar</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3 w-full">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveTab('fleets')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'fleets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Filo Yönetimi & Lisanslar ({fleets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tüm Sistem Hesapları ({totalUsersCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('archives');
                fetchArchives(selectedArchiveTable, archiveSearch);
              }}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'archives'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Silinen Veriler & Arşiv ({archives.length})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer bg-white"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: FLEETS LIST */}
        {activeTab === 'fleets' && (
          <div className="space-y-4">
            {/* Search and status filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filo adı, filo kodu (Örn: FL-1001) veya sahip e-postası ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:border-amber-500 focus:outline-hidden"
              >
                <option value="ALL">Tüm Durumlar (Tümü)</option>
                <option value="ACTIVE">Aktif Filolar</option>
                <option value="SUSPENDED">Askıya Alınanlar</option>
              </select>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Filolar yükleniyor...</p>
              </div>
            ) : filteredFleets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Henüz Kayıtlı Filo Bulunmuyor</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Yukarıdaki &quot;Yeni Filo Tanımla&quot; butonu ile anlaştığınız araç filoları için kod üretip ilk kurulumu yapabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFleets.map((fleet) => {
                  const isActive = fleet.status === 'ACTIVE';
                  const daysLeft = fleet.expiresAt
                    ? Math.ceil((new Date(fleet.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={fleet.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Name, Code & Status */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">{fleet.name}</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isActive ? 'Aktif' : 'Askıda'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{fleet.city || 'Belgrad'}</div>
                          </div>

                          {/* Fleet Code Badge & Copy */}
                          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1 font-mono font-bold text-xs text-slate-900">
                            <span className="text-slate-400 uppercase text-xs">Kod:</span>
                            <span className="text-slate-900">{fleet.code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(fleet.code)}
                              className="text-slate-500 hover:text-slate-900 p-0.5 transition-colors cursor-pointer ml-0.5"
                              title="Kodu Kopyala"
                            >
                              {copiedCode === fleet.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Owner & Contact info */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Yetkili: <b className="text-slate-900">{fleet.ownerName || 'Belirtilmedi'}</b></span>
                          </div>
                          {fleet.ownerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-700">{fleet.ownerEmail}</span>
                            </div>
                          )}
                          {fleet.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-700">{fleet.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Partnership & Features Info */}
                        <div className="flex flex-wrap gap-2 items-center mb-3">
                          {fleet.isPartnership ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Users className="w-3.5 h-3.5 text-purple-600" />
                              Ortaklı Filo: {(() => {
                                try {
                                  const p = JSON.parse(fleet.partners || '[]');
                                  return p.length > 0 ? p.join(', ') : 'Ortak atanmadı';
                                } catch {
                                  return fleet.partners || 'Ortaklı';
                                }
                              })()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                              Standart / Tek Sahip
                            </span>
                          )}

                          {fleet.features && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {(() => {
                                try {
                                  const f = JSON.parse(fleet.features);
                                  const activeCount = Object.values(f).filter(Boolean).length;
                                  return `${activeCount} Modül Aktif`;
                                } catch {
                                  return 'Modüller Aktif';
                                }
                              })()}
                            </span>
                          )}
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-2.5 text-center text-xs mb-4">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 font-semibold uppercase">Araç Kotası</div>
                            <div className="font-bold text-sm text-sky-600 mt-0.5">
                              {fleet._count?.vehicles || 0} / {fleet.maxVehicles}
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 font-semibold uppercase">Müşteriler</div>
                            <div className="font-bold text-sm text-emerald-600 mt-0.5">
                              {fleet._count?.customers || 0}
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-500 font-semibold uppercase">Kullanıcılar</div>
                            <div className="font-bold text-sm text-purple-600 mt-0.5">
                              {fleet._count?.users || 0}
                            </div>
                          </div>
                        </div>

                        {/* License / Expiration */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Bitiş: {formatDate(fleet.expiresAt)}</span>
                          </div>
                          {daysLeft !== null && (
                            <span
                              className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-md ${
                                daysLeft <= 15
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {daysLeft <= 0 ? 'SÜRESİ DOLDU' : `${daysLeft} gün kaldı`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(fleet.id, fleet.status)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Askıya Al' : 'Aktif Et'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditFleetModal(fleet)}
                            className="px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Filo Ayarları, Ortaklar ve Modül İzinlerini Yönet"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-700" />
                            <span>Yönet & Yetkiler</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openAddUserToFleetModal(fleet)}
                            className="px-2.5 sm:px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Bu filoya kullanıcı / personel ata"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-purple-700" />
                            <span>+ Kullanıcı</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteFleet(fleet.id, fleet.name)}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
                          title="Filoyu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL USERS LIST ACROSS FLEETS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Sistemdeki Tüm Filo Yöneticileri ve Personeller
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Kullanıcı</th>
                    <th className="py-3.5 px-4">E-posta</th>
                    <th className="py-3.5 px-4">Bağlı Olduğu Filo</th>
                    <th className="py-3.5 px-4">Rol</th>
                    <th className="py-3.5 px-4">Kayıt Tarihi</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* System Owner (Süper Yönetici) */}
                  <tr className="bg-amber-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        {currentUser?.name?.charAt(0) || 'A'}
                      </div>
                      <span>{currentUser?.name || 'SaaS Yöneticisi'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{currentUser?.email || 'admin@filoyonetim.com'}</td>
                    <td className="py-3.5 px-4 text-amber-900 font-bold">Tüm Sistem (SaaS Sahibi)</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        SUPER_ADMIN
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">-</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-bold">Aktif</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setUserForPasswordReset(currentUser);
                          setNewPasswordForUser('');
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Süper Admin Şifresini Değiştir"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Şifremi Değiştir</span>
                      </button>
                    </td>
                  </tr>

                  {/* Fleet Users */}
                  {fleets.flatMap((f) =>
                    (f.users || []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{f.name}</span>
                          <span className="ml-1.5 text-xs font-mono text-slate-500">({f.code})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Filo Sahibi (ADMIN)' : 'Çalışan (STAFF)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="py-3.5 px-4">
                          <span className={u.isActive ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {u.isActive ? 'Aktif' : 'Askıya Alındı'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setUserForPasswordReset(u);
                                setNewPasswordForUser('');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Şifre Sıfırla"
                            >
                              Şifre Sıfırla
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserSuspend(u)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                u.isActive
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'Askıya Al' : 'Aktif Et'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHIVES (SİLİNEN VERİLER & ARŞİV) */}
        {activeTab === 'archives' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => {
                    setArchiveSearch(e.target.value);
                    fetchArchives(selectedArchiveTable, e.target.value);
                  }}
                  placeholder="Arşivde ara (Başlık, silen kişi veya neden...)"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedArchiveTable}
                onChange={(e) => {
                  setSelectedArchiveTable(e.target.value);
                  fetchArchives(e.target.value, archiveSearch);
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:border-amber-500 focus:outline-hidden"
              >
                <option value="ALL">Tüm Veri Türleri (Tümü)</option>
                <option value="Fleet">🏢 Silinen Filolar</option>
                <option value="Vehicle">🚗 Silinen Araçlar</option>
                <option value="Customer">👤 Silinen Müşteriler</option>
                <option value="User">🔑 Silinen Kullanıcılar</option>
              </select>
            </div>

            {/* Info Notice */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-start gap-3 text-xs">
              <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-400">Özel Güvenlikli Veri Arşivi:</strong> Bu tablodaki veriler ana aktif tablolardan tamamen izole edilmiştir. Normal kullanıcılar veya çalışanlar bu verilere asla erişemez. Yalnızca siz (SaaS Yöneticisi) ve doğrudan Supabase SQL konsolu üzerinden görüntülenebilir.
              </div>
            </div>

            {archivesLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Arşiv verileri yükleniyor...</p>
              </div>
            ) : archives.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Arşivde Silinmiş Kayıt Bulunmuyor</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Sistemden silinen filo, araç, müşteri veya kullanıcılar bu güvenli alanda JSON yedeğiyle otomatik arşivlenir.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Tür</th>
                        <th className="py-3 px-4">Kayıt Başlığı</th>
                        <th className="py-3 px-4">Silen Kişi</th>
                        <th className="py-3 px-4">Silinme Tarihi</th>
                        <th className="py-3 px-4">Silinme Nedeni</th>
                        <th className="py-3 px-4 text-center">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {archives.map((item) => {
                        let typeBadge = (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.tableName}
                          </span>
                        );
                        if (item.tableName === 'Fleet') {
                          typeBadge = (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              🏢 Filo
                            </span>
                          );
                        } else if (item.tableName === 'Vehicle') {
                          typeBadge = (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              🚗 Araç
                            </span>
                          );
                        } else if (item.tableName === 'Customer') {
                          typeBadge = (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              👤 Müşteri
                            </span>
                          );
                        } else if (item.tableName === 'User') {
                          typeBadge = (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              🔑 Kullanıcı
                            </span>
                          );
                        }

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">{typeBadge}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{item.title}</td>
                            <td className="py-3.5 px-4 text-slate-600 font-medium">{item.deletedBy || 'Bilinmiyor'}</td>
                            <td className="py-3.5 px-4 text-slate-500">{formatDate(item.deletedAt)}</td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={item.reason}>
                              {item.reason || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setViewingArchiveData(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Tüm JSON Yedeğini Gör"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>JSON İncele</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteArchiveItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Veritabanından Kalıcı Olarak Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: VIEW ARCHIVED JSON */}
      <Modal
        isOpen={Boolean(viewingArchiveData)}
        onClose={() => setViewingArchiveData(null)}
        title={viewingArchiveData ? `Arşiv Detayı: ${viewingArchiveData.title}` : 'Arşiv Detayı'}
        subtitle="Veritabanından silinen kaydın tüm alt ilişkileriyle kaydedilmiş orijinal anlık görüntüsü"
        maxWidth="2xl"
      >
        {viewingArchiveData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kayıt Türü</span>
                <strong className="text-slate-900">{viewingArchiveData.tableName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Silen Kişi</span>
                <strong className="text-slate-900">{viewingArchiveData.deletedBy || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Silinme Tarihi</span>
                <strong className="text-slate-900">{formatDate(viewingArchiveData.deletedAt)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Orijinal ID</span>
                <strong className="text-slate-900 font-mono text-[11px] truncate block" title={viewingArchiveData.recordId}>
                  {viewingArchiveData.recordId}
                </strong>
              </div>
            </div>

            {viewingArchiveData.reason && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Silinme Nedeni:</strong> {viewingArchiveData.reason}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                JSON Ham Veri Yedeği
              </label>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs overflow-auto max-h-96 font-mono leading-relaxed border border-slate-800">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(viewingArchiveData.data), null, 2);
                  } catch {
                    return viewingArchiveData.data;
                  }
                })()}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingArchiveData(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: NEW FLEET & GENERATE CODE */}
      <Modal
        isOpen={showNewFleetModal}
        onClose={() => setShowNewFleetModal(false)}
        title="Yeni Filo Tanımla & Filo Kodu Üret"
        subtitle="Müşterinize vereceğiniz filo kodunu ve ilk yönetici hesabını oluşturun"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateFleet} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filo / Şirket Adı *
              </label>
              <input
                type="text"
                required
                value={newFleetName}
                onChange={(e) => setNewFleetName(e.target.value)}
                placeholder="Örn: Belgrad Star Rent a Car"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Filo Kodu (Benzersiz) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="text-xs text-amber-600 hover:underline font-bold"
                >
                  Kod Üret
                </button>
              </div>
              <input
                type="text"
                required
                value={newFleetCode}
                onChange={(e) => setNewFleetCode(e.target.value.toUpperCase())}
                placeholder="Örn: FL-1001"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 font-mono font-black uppercase text-amber-700"
              />
            </div>
          </div>

          {/* Owner info */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">
              Filo Sahibi / İlk Giriş Bilgileri
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Yetkili Ad Soyad
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Örn: Marko Jovanović"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Yetkili E-posta (Giriş İçin) *
                </label>
                <input
                  type="email"
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="musteri@belgradrent.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  İlk Giriş Şifresi *
                </label>
                <input
                  type="text"
                  required
                  value={newOwnerPassword}
                  onChange={(e) => setNewOwnerPassword(e.target.value)}
                  placeholder="Şifre"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+381 64 000 0000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>

          {/* Limits and License */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şehir / Lokasyon
              </label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Belgrad"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Araç Kotası (Limit)
              </label>
              <input
                type="number"
                min="1"
                value={newMaxVehicles}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNewMaxVehicles(e.target.value)}
                placeholder="Örn: 20"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lisans Süresi (Ay)
              </label>
              <select
                value={newExpiresMonths}
                onChange={(e) => setNewExpiresMonths(parseInt(e.target.value) || 12)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value={1}>1 Ay (Deneme)</option>
                <option value={6}>6 Ay</option>
                <option value={12}>12 Ay (1 Yıl)</option>
                <option value={24}>24 Ay (2 Yıl)</option>
              </select>
            </div>
          </div>

          {/* Partnership Model */}
          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
            <span className="text-xs font-bold text-purple-950 block">
              Filo Ortaklık Modeli
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewIsPartnership(false)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                  !newIsPartnership
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <div>
                  <div>Standart / Tek Sahip</div>
                  <div className="text-[10px] font-normal opacity-80">Tek şirket/şahıs kasası</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewIsPartnership(true)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                  newIsPartnership
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <div>
                  <div>Ortaklı Filo</div>
                  <div className="text-[10px] font-normal opacity-80">Ayrı araç sahipleri & ortak kasalar</div>
                </div>
              </button>
            </div>

            {newIsPartnership && (
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Ortak İsimleri (Virgülle ayırarak giriniz) *
                </label>
                <input
                  type="text"
                  required={newIsPartnership}
                  value={newPartnersInput}
                  onChange={(e) => setNewPartnersInput(e.target.value)}
                  placeholder="Örn: Atilla, Onur"
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white font-bold text-purple-950 focus:border-purple-500"
                />
                <span className="text-[11px] text-purple-700 mt-1 block">
                  Bu ortaklar, araç eklerken araç sahibi ve masraf öderken ödeyen listesinde listelenir. Diğer filolar bunları göremez!
                </span>
              </div>
            )}
          </div>

          {/* Module & Feature Access Toggles */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Yetkilendirilen Modüller (SaaS Özellik Kontrolü)
              </span>
              <span className="text-[11px] text-slate-500">
                Seçili olmayan modüller filonun menüsünde gizlenir
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isChecked = newFeatures[mod.key] !== false;
                return (
                  <label
                    key={mod.key}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white border-amber-300 text-slate-900 shadow-xs'
                        : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setNewFeatures({ ...newFeatures, [mod.key]: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400 mt-0.5"
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{mod.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{mod.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Özel Notlar (İsteğe Bağlı)
            </label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Örn: 20 araçlık sözleşme yapıldı, nakit peşin ödendi."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewFleetModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Filoyu Oluştur & Hesabı Aç'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: FULL FLEET EDIT, PARTNERSHIP & MODULE ACCESS */}
      <Modal
        isOpen={!!editingFleet}
        onClose={() => setEditingFleet(null)}
        title="Filo Yönetimi & Modül Yetkileri"
        subtitle={`${editingFleet?.name} (${editingFleet?.code})`}
        maxWidth="2xl"
      >
        {editError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleSaveFleetEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filo / Şirket Adı *
              </label>
              <input
                type="text"
                required
                value={editFleetName}
                onChange={(e) => setEditFleetName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Şehir / Lokasyon
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yetkili Ad Soyad
              </label>
              <input
                type="text"
                value={editOwnerName}
                onChange={(e) => setEditOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yetkili E-posta
              </label>
              <input
                type="email"
                value={editOwnerEmail}
                onChange={(e) => setEditOwnerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefon Numarası
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Araç Kotası (Maksimum Araç Limiti)
              </label>
              <input
                type="number"
                min="1"
                value={editMaxVehicles}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setEditMaxVehicles(e.target.value)}
                placeholder="Örn: 20"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lisans Süresi Ekle (Uzatma)
              </label>
              <select
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="0">Süreyi Değiştirme (Aynı Bırak)</option>
                <option value="1">+1 Ay Uzat</option>
                <option value="3">+3 Ay Uzat</option>
                <option value="6">+6 Ay Uzat</option>
                <option value="12">+12 Ay (1 Yıl) Uzat</option>
                <option value="24">+24 Ay (2 Yıl) Uzat</option>
              </select>
            </div>
          </div>

          {/* Edit Partnership Model */}
          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-3">
            <span className="text-xs font-bold text-purple-950 block">
              Filo Ortaklık Modeli Yapılandırması
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditIsPartnership(false)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                  !editIsPartnership
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <div>
                  <div>Standart / Tek Sahip</div>
                  <div className="text-[10px] font-normal opacity-80">Ortaksız şahıs/şirket</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEditIsPartnership(true)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                  editIsPartnership
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <div>
                  <div>Ortaklı Filo</div>
                  <div className="text-[10px] font-normal opacity-80">Ayrı araç sahipleri & ortak kasalar</div>
                </div>
              </button>
            </div>

            {editIsPartnership && (
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Ortak İsimleri (Virgülle ayırarak giriniz) *
                </label>
                <input
                  type="text"
                  required={editIsPartnership}
                  value={editPartnersInput}
                  onChange={(e) => setEditPartnersInput(e.target.value)}
                  placeholder="Örn: Atilla, Onur"
                  className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl bg-white font-bold text-purple-950 focus:border-purple-500"
                />
                <span className="text-[11px] text-purple-700 mt-1 block">
                  Bu filo araç eklerken yalnızca burada belirlediğiniz ortakları görebilir.
                </span>
              </div>
            )}
          </div>

          {/* Edit Module & Feature Access Toggles */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Erişilebilir Modüller (SaaS Özellik İzinleri)
              </span>
              <span className="text-[11px] text-slate-500">
                Bu filo için açmak/kapatmak istediğiniz özellikleri seçin
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isChecked = editFeatures[mod.key] !== false;
                return (
                  <label
                    key={mod.key}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white border-amber-300 text-slate-900 shadow-xs'
                        : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setEditFeatures({ ...editFeatures, [mod.key]: e.target.checked })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400 mt-0.5"
                    />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{mod.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{mod.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingFleet(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmittingEdit ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD USER TO FLEET */}
      {fleetForNewUser && (
        <Modal
          isOpen={!!fleetForNewUser}
          onClose={() => setFleetForNewUser(null)}
          title={`${fleetForNewUser.name} Filosuna Kullanıcı Ekle`}
          subtitle={`Filo Kodu: ${fleetForNewUser.code} • Yeni yönetici veya çalışan hesabı oluşturun`}
          maxWidth="md"
        >
          {fleetUserError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fleetUserError}</span>
            </div>
          )}

          <form onSubmit={handleAddUserToFleet} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={fleetUserName}
                onChange={(e) => setFleetUserName(e.target.value)}
                placeholder="Örn: Marko Nikolić"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-posta Adresi *
              </label>
              <input
                type="email"
                required
                value={fleetUserEmail}
                onChange={(e) => setFleetUserEmail(e.target.value)}
                placeholder="marko@filo.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giriş Şifresi *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={fleetUserPassword}
                onChange={(e) => setFleetUserPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yetki Rolü *
              </label>
              <select
                value={fleetUserRole}
                onChange={(e) => setFleetUserRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              >
                <option value="ADMIN">Filo Sahibi / Yönetici (ADMIN - Tam Yetki)</option>
                <option value="STAFF">Filo Personeli (STAFF - Operasyonel Yetki)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFleetForNewUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingFleetUser}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFleetUser ? 'Ekleniyor...' : 'Kullanıcıyı Filoya Ekle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RESET PASSWORD (SUPER ADMIN) */}
      {userForPasswordReset && (
        <Modal
          isOpen={!!userForPasswordReset}
          onClose={() => setUserForPasswordReset(null)}
          title={`Şifre Sıfırla: ${userForPasswordReset.name}`}
          subtitle={`${userForPasswordReset.email} hesabına yeni bir giriş şifresi tanımlayın`}
          maxWidth="sm"
        >
          <form onSubmit={handleResetUserPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yeni Şifre *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPasswordForUser}
                onChange={(e) => setNewPasswordForUser(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserForPasswordReset(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingPasswordReset}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPasswordReset ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

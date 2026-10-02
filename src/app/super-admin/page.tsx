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
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth';

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [fleets, setFleets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'fleets' | 'users'>('fleets');

  // Modal: New Fleet
  const [showNewFleetModal, setShowNewFleetModal] = useState(false);
  const [newFleetName, setNewFleetName] = useState('');
  const [newFleetCode, setNewFleetCode] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('filo123');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Belgrad');
  const [newMaxVehicles, setNewMaxVehicles] = useState(20);
  const [newExpiresMonths, setNewExpiresMonths] = useState(12);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Extend License / Edit
  const [editingFleet, setEditingFleet] = useState<any | null>(null);
  const [extendMonths, setExtendMonths] = useState('12');

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, fleetsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/fleets'),
      ]);

      if (meRes.ok) {
        const u = await meRes.json();
        if (!u.user || (u.user.role !== 'SUPER_ADMIN' && u.user.email !== 'akif@filoyonetim.com')) {
          router.push('/');
          return;
        }
        setCurrentUser(u.user);
      } else {
        router.push('/login');
        return;
      }

      if (fleetsRes.ok) {
        setFleets(await fleetsRes.json());
      }
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
          maxVehicles: newMaxVehicles,
          expiresMonths: newExpiresMonths,
          notes: newNotes,
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
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
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

  const handleExtendLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFleet) return;

    try {
      const res = await fetch(`/api/fleets/${editingFleet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendMonths }),
      });
      if (res.ok) {
        setEditingFleet(null);
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFleet = async (fleetId: string, fleetName: string) => {
    if (!confirm(`"${fleetName}" filosunu ve bu filoya ait tüm araç/kullanıcı verilerini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fleets/${fleetId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
      else {
        const err = await res.json();
        alert(err.error || 'Filo silinemedi.');
      }
    } catch (e: any) {
      alert(e.message);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Super Admin Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs pt-[env(safe-area-inset-top,0px)]">
        <div className="h-16 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">SÜPER YÖNETİCİ PANELİ</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  SaaS Master
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Panel Sahibi & Yapımcısı: <b className="text-slate-800">Akif Aksoy</b>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Car className="w-4 h-4 text-slate-600" />
              <span>Filo Operasyon Ekranı</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
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
              Hoş Geldiniz, Akif Aksoy
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
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('fleets')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tüm Sistem Hesapları ({totalUsersCount})</span>
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
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(fleet.id, fleet.status)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
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
                            onClick={() => setEditingFleet(fleet)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Lisans Uzat</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteFleet(fleet.id, fleet.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Kullanıcı</th>
                    <th className="py-3.5 px-4">E-posta</th>
                    <th className="py-3.5 px-4">Bağlı Olduğu Filo</th>
                    <th className="py-3.5 px-4">Rol</th>
                    <th className="py-3.5 px-4">Kayıt Tarihi</th>
                    <th className="py-3.5 px-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Akif Aksoy (Süper Yönetici) */}
                  <tr className="bg-amber-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        A
                      </div>
                      <span>Akif Aksoy</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">akif@filoyonetim.com</td>
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
                            {u.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

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
                onChange={(e) => setNewMaxVehicles(parseInt(e.target.value) || 20)}
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

      {/* MODAL: EXTEND LICENSE */}
      <Modal
        isOpen={!!editingFleet}
        onClose={() => setEditingFleet(null)}
        title="Filo Lisansını Uzat"
        subtitle={`${editingFleet?.name} (${editingFleet?.code})`}
        maxWidth="sm"
      >
        <form onSubmit={handleExtendLicense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uzatılacak Süre
            </label>
            <select
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="1">+1 Ay Uzat</option>
              <option value="3">+3 Ay Uzat</option>
              <option value="6">+6 Ay Uzat</option>
              <option value="12">+12 Ay (1 Yıl) Uzat</option>
            </select>
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
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs cursor-pointer"
            >
              Süreyi Uzat
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

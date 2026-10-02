'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Plus,
  Search,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatCurrency, formatRsd, EUR_TO_RSD_RATE } from '@/lib/formatters';
import { AuthUser } from '@/lib/auth';

export default function InspectionPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [currency, setCurrency] = useState<'EUR' | 'RSD'>('EUR');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formVehicleId, setFormVehicleId] = useState('');
  const [formInspectionDate, setFormInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [formCost, setFormCost] = useState('65');
  const [formStation, setFormStation] = useState('Belgrade Auto Pregled Centar');
  const [formNotes, setFormNotes] = useState('Yıllık periyodik muayene (Tehnički Pregled) ve Registracija yapıldı.');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, vRes] = await Promise.all([
        fetch('/api/inspection'),
        fetch('/api/vehicles'),
      ]);

      if (iRes.ok) setInspections(await iRes.json());
      if (vRes.ok) setVehicles(await vRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId) {
      setFormError('Lütfen araç seçiniz.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formVehicleId,
          inspectionDate: formInspectionDate,
          currency,
          cost: formCost,
          station: formStation,
          notes: formNotes,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Muayene kaydedilemedi.');

      setIsNewModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const now = new Date();
  const inspectionsWithDays = inspections.map((i) => {
    const nextDate = new Date(i.nextInspectionDate);
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { ...i, diffDays };
  });

  const filteredInspections = inspectionsWithDays.filter((i) => {
    const matchesSearch =
      !search ||
      i.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      i.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      i.station.toLowerCase().includes(search.toLowerCase());

    const matchesOwner = ownerFilter === 'ALL' || i.vehicle.owner === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  return (
    <AppLayout currentUser={currentUser}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-purple-600" />
            Yıllık Muayene & Registracija Takvimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sırbistan (Tehnički Pregled & Registracija) senede 1 kez zorunludur. Tescilsiz araç trafiğe çıkamaz!
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            if (vehicles.length > 0 && !formVehicleId) setFormVehicleId(vehicles[0].id);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Yeni Muayene Kaydet (+1 Yıl)
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="font-bold text-xs text-purple-950">Yıllık 1 Yıl Zorunlu Registracija Döngüsü</div>
            <div className="text-xs text-purple-800">
              Muayene tarihi girildiğinde bir sonraki muayene ve tescil bitişi tam 1 yıl sonrasına otomatik ayarlanır. 30 gün altına inen araçlar için uyarı verilir.
            </div>
          </div>
        </div>
        <span className="px-3 py-1 bg-white text-purple-900 rounded-xl font-bold text-xs border border-purple-200 shadow-2xs shrink-0 self-start sm:self-auto">
          {inspections.length} Kayıtlı Muayene
        </span>
      </div>

      {/* Search & Partner Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka (Örn: BG 123-AA), araç veya muayene istasyonu ara..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-hidden"
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Muayeneler yükleniyor...</p>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Muayene Kaydı Bulunamadı</h3>
          <p className="text-xs text-slate-500 mt-1">Arama kriterlerine uygun muayene bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Araç & Plaka</th>
                  <th className="py-3 px-4">Ortak</th>
                  <th className="py-3 px-4">İstasyon (Belgrad)</th>
                  <th className="py-3 px-4">Son Muayene Tarihi</th>
                  <th className="py-3 px-4">Gelecek Muayene (1 Yıl)</th>
                  <th className="py-3 px-4">Kalan Süre & Durum</th>
                  <th className="py-3 px-4">Muayene Ücreti</th>
                  <th className="py-3 px-4 text-right">Sisteme Giriş Zamanı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map((i) => (
                  <tr key={i.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/vehicles/${i.vehicle.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-purple-600 block text-xs"
                      >
                        {i.vehicle.plate}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {i.vehicle.brand} {i.vehicle.model}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700">{i.vehicle.owner || 'Atilla'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {i.station}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {formatDate(i.inspectionDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-900 font-mono">
                      {formatDate(i.nextInspectionDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                          i.diffDays < 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : i.diffDays <= 30
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {i.diffDays < 0
                          ? `SÜRESİ GEÇTİ (${Math.abs(i.diffDays)} g)`
                          : `${i.diffDays} gün kaldı`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-xs font-mono">
                      {formatCurrency(i.cost, 'EUR')}
                      {i.currency === 'RSD' && i.originalCost && (
                        <div className="text-xs text-slate-400 font-normal">
                          {formatRsd(i.originalCost)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                      {formatDateTime(i.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Inspection Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Araç Muayenesi & Registracija Kaydet"
        subtitle="1 Yıllık sonraki muayene tarihi ve araç tescili otomatik yenilenecektir"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800">Muayene Masraf Para Birimi</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currency === 'EUR' ? 'bg-purple-600 text-white' : 'text-slate-600'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('RSD')}
                className={`px-3 py-1 text-xs font-bold rounded-md ${
                  currency === 'RSD' ? 'bg-purple-600 text-white' : 'text-slate-600'
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
              value={formVehicleId}
              onChange={(e) => setFormVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-bold"
            >
              <option value="">-- Araç Seçin --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} – {v.brand} {v.model} (Ortak: {v.owner})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Muayene Tarihi *</label>
              <input
                type="date"
                required
                value={formInspectionDate}
                onChange={(e) => setFormInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Muayene Ücreti ({currency}) *
              </label>
              <input
                type="number"
                required
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Muayene İstasyonu (Belgrad) *</label>
            <input
              type="text"
              required
              value={formStation}
              onChange={(e) => setFormStation(e.target.value)}
              placeholder="Örn: Belgrade Tehnički Pregled Boban"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notlar / Tescil Bilgisi</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-500"
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
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Kaydediliyor...' : 'Muayeneyi Kaydet (+1 Yıl)'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

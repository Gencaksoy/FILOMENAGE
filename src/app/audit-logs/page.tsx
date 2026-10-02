'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  FileSpreadsheet,
  Download,
  Calendar,
  User,
  Shield,
  Tag,
  Car,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { exportToExcel, exportToCSV } from '@/lib/exportExcel';
import { AuthUser } from '@/lib/auth';

export default function AuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.user) setCurrentUser(u.user);
        else window.location.href = '/login';
      });

    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.target && l.target.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportExcel = () => {
    const data = filteredLogs.map((l) => ({
      Tarih: formatDateTime(l.createdAt),
      'İşlemi Yapan': l.userName,
      'İlgili Araç / Hedef': l.target || '-',
      İşlem: l.action,
      Açıklama: l.description,
    }));
    exportToExcel(data, `Denetim_Izi_Loglari_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Audit Log');
  };

  const handleExportCSV = () => {
    const data = filteredLogs.map((l) => ({
      Tarih: formatDate(l.createdAt),
      Kullanici: l.userName,
      Hedef: l.target || '-',
      Islem: l.action,
      Aciklama: l.description,
    }));
    exportToCSV(data, `Denetim_Izi_Loglari_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('RENTAL') || action.includes('ASSIGN')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (action.includes('OIL')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('MAINTENANCE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('INSPECTION')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('DELETE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <AppLayout currentUser={currentUser}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            İşlem Geçmişi (Denetim İzi / Audit Log)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kimin, hangi tarihte, hangi araba veya müşteri üzerinde hangi işlemi yaptığı
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı, plaka (Örn: BG 123-AA), işlem türü veya detay ara..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Denetim logları yükleniyor...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tarih & Saat</th>
                  <th className="py-3 px-4">İşlemi Yapan</th>
                  <th className="py-3 px-4">İlgili Araç / Hedef</th>
                  <th className="py-3 px-4">İşlem Türü</th>
                  <th className="py-3 px-4">Yapılan İşlem Açıklaması</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.target ? (
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1">
                          <Car className="w-3 h-3 text-amber-500" />
                          {log.target}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Genel Sistem</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

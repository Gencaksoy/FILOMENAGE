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
import { AuthUser } from '@/lib/auth-client';

function formatFriendlyAudit(log: any): { actionTitle: string; friendlyDesc: string; badgeStyle: string } {
  const action = (log.action || '').toUpperCase();
  const target = log.target || '';
  const desc = log.description || '';

  // 1. Rental start (araba verildi)
  if (action.includes('RENTAL') && (action.includes('CREATE') || action.includes('START'))) {
    return {
      actionTitle: 'Araba Verildi',
      friendlyDesc: target ? `${target} aracı kiralandı ve müşteriye teslim edildi.` : (desc || 'Araç kiralandı.'),
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  // 2. Rental return (araba alındı)
  if (action.includes('RETURN') || desc.toLowerCase().includes('teslim alındı') || desc.toLowerCase().includes('iade')) {
    return {
      actionTitle: 'Araba Alındı',
      friendlyDesc: target ? `${target} aracı müşteriden geri teslim alındı.` : (desc || 'Araç teslim alındı.'),
      badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    };
  }

  // 3. Rental extension (süre uzatıldı)
  if (action.includes('EXTEND') || desc.toLowerCase().includes('uzat')) {
    return {
      actionTitle: 'Süre Uzatıldı',
      friendlyDesc: target ? `${target} aracının kiralama süresi uzatıldı.` : (desc || 'Kira süresi uzatıldı.'),
      badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
    };
  }

  // 4. Oil change (yağ değiştirildi)
  if (action.includes('OIL') || desc.toLowerCase().includes('yağ')) {
    return {
      actionTitle: 'Yağ Değiştirildi',
      friendlyDesc: target ? `${target} aracının motor yağı ve filtresi değiştirildi.` : (desc || 'Motor yağı değişimi yapıldı.'),
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  // 5. Maintenance (bakım yapıldı)
  if (action.includes('MAINTENANCE') || desc.toLowerCase().includes('bakım')) {
    return {
      actionTitle: 'Bakım Yapıldı',
      friendlyDesc: target ? `${target} aracına servis bakımı yapıldı.` : (desc || 'Servis bakımı yapıldı.'),
      badgeStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    };
  }

  // 6. Inspection (muayene yapıldı)
  if (action.includes('INSPECTION') || desc.toLowerCase().includes('muayene')) {
    return {
      actionTitle: 'Muayene Yapıldı',
      friendlyDesc: target ? `${target} aracının yıllık araç muayenesi tamamlandı.` : (desc || 'Araç muayenesi yapıldı.'),
      badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    };
  }

  // 7. Parking ticket (park cezası)
  if (action.includes('PARKING') || desc.toLowerCase().includes('ceza') || desc.toLowerCase().includes('edpk')) {
    return {
      actionTitle: 'Park Cezası',
      friendlyDesc: target ? `${target} aracı için Belgrad park cezası (eDPK) işlendi.` : (desc || 'Park cezası kaydedildi.'),
      badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }

  // 8. Vehicle fault (arıza kaydı)
  if (action.includes('FAULT') || desc.toLowerCase().includes('arıza')) {
    return {
      actionTitle: 'Arıza Kaydı',
      friendlyDesc: target ? `${target} aracı için arıza kaydı girildi / güncellendi.` : (desc || 'Arıza bildirimi yapıldı.'),
      badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200',
    };
  }

  // 9. Vehicle create (araba eklendi)
  if (action.includes('VEHICLE') && action.includes('CREATE')) {
    return {
      actionTitle: 'Araba Eklendi',
      friendlyDesc: target ? `${target} yeni araç olarak filoya kaydedildi.` : (desc || 'Yeni araç eklendi.'),
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  // 10. Customer create (müşteri eklendi)
  if (action.includes('CUSTOMER') && action.includes('CREATE')) {
    return {
      actionTitle: 'Müşteri Eklendi',
      friendlyDesc: target ? `${target} sisteme yeni müşteri olarak eklendi.` : (desc || 'Yeni müşteri kaydedildi.'),
      badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
    };
  }

  // 11. User password change / suspend
  if (action.includes('PASSWORD') || action.includes('SUSPEND') || action.includes('USER')) {
    return {
      actionTitle: action.includes('SUSPEND') ? 'Kullanıcı Askıya Alındı' : 'Kullanıcı Güncellendi',
      friendlyDesc: desc || `${target} kullanıcısı işlem gördü.`,
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    };
  }

  // Default clean fallback
  return {
    actionTitle: action.replace(/_/g, ' '),
    friendlyDesc: desc || 'Sistem işlemi yapıldı.',
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

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
    const data = filteredLogs.map((l) => {
      const friendly = formatFriendlyAudit(l);
      return {
        Tarih: formatDateTime(l.createdAt),
        'İşlemi Yapan': l.userName,
        'İlgili Araç / Hedef': l.target || '-',
        İşlem: friendly.actionTitle,
        Açıklama: friendly.friendlyDesc,
      };
    });
    exportToExcel(data, `Islem_Gecmisi_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Audit Log');
  };

  const handleExportCSV = () => {
    const data = filteredLogs.map((l) => {
      const friendly = formatFriendlyAudit(l);
      return {
        Tarih: formatDate(l.createdAt),
        Kullanici: l.userName,
        Hedef: l.target || '-',
        Islem: friendly.actionTitle,
        Aciklama: friendly.friendlyDesc,
      };
    });
    exportToCSV(data, `Islem_Gecmisi_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AppLayout currentUser={currentUser} requiredFeature="auditLogs" adminOnly={true}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            İşlem Geçmişi (Denetim İzi)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Hangi araca ne yapıldı, hangi araba verildi, hangi araba geri alındı veya masraf girildi
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
            placeholder="Plaka (Örn: BG 1709-OT), işlem veya kullanıcı ara..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">İşlem kayıtları yükleniyor...</p>
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
                  <th className="py-3 px-4">İşlem</th>
                  <th className="py-3 px-4">Yapılan İşlem Açıklaması</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => {
                  const friendly = formatFriendlyAudit(log);
                  return (
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
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${friendly.badgeStyle}`}
                        >
                          {friendly.actionTitle}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {friendly.friendlyDesc}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const defaultSettings: Record<string, string> = {
  company_name: 'Filo Yönetim & Rent a Car',
  company_phone: '+381 11 123 4567',
  company_email: 'operasyon@filoyonetim.com',
  default_currency: 'EUR',
  maintenance_interval_months: '1',
  inspection_interval_years: '1',
  warn_days_yellow: '7',
  warn_days_orange: '3',
};

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }
    if (currentUser.role === 'STAFF') {
      return NextResponse.json({ error: 'Personel (STAFF) hesaplarının sistem ayarlarına erişim yetkisi yoktur.' }, { status: 403 });
    }

    const dbSettings = await prisma.systemSetting.findMany();
    const result: Record<string, string> = { ...defaultSettings };
    for (const item of dbSettings) {
      result[item.key] = item.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }
    if (currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) şirket adını ve sistem ayarlarını değiştirme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' || typeof value === 'number') {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'UPDATE_SETTINGS',
      target: 'Sistem Parametreleri',
      description: `Şirket ve sistem parametreleri güncellendi (Firma Adı: ${body.company_name || 'Değiştirilmedi'}).`,
    });

    const updated = await prisma.systemSetting.findMany();
    const result: Record<string, string> = { ...defaultSettings };
    for (const item of updated) {
      result[item.key] = item.value;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: error.message || 'Ayarlar güncellenemedi.' }, { status: 500 });
  }
}

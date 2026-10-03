import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    if (currentUser.role === 'STAFF') {
      return NextResponse.json({ error: 'Personel (STAFF) hesaplarının işlem geçmişi kayıtlarına erişim yetkisi yoktur.' }, { status: 403 });
    }

    if (!isSuper && currentUser.features?.auditLogs === false) {
      return NextResponse.json({ error: 'İşlem geçmişi (audit) modülü filonuz için devre dışıdır.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const fleetIdFilter = searchParams.get('fleetId')?.trim();

    const conditions: any[] = [];

    // Filo İzolasyonu: Filo yöneticisi ve çalışanları SADECE kendi filosunun işlem geçmişini görebilir!
    if (!isSuper) {
      if (currentUser.fleetId) {
        conditions.push({ fleetId: currentUser.fleetId });
      } else {
        // Filosu olmayan admin hiçbir filonun logunu görmez
        conditions.push({ fleetId: '__none__' });
      }
      // Süper Admin'in gizli sistem hareketlerini filo kullanıcıları göremez
      conditions.push({
        userName: { not: 'Akif Aksoy' },
        userRole: { not: 'SUPER_ADMIN' },
      });
    } else if (fleetIdFilter && fleetIdFilter !== 'ALL') {
      conditions.push({ fleetId: fleetIdFilter });
    }

    if (search) {
      conditions.push({
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { target: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Audit Logs GET error:', error);
    return NextResponse.json({ error: 'Loglar alınamadı.' }, { status: 500 });
  }
}

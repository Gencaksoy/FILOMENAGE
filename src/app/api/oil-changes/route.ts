import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';
import { EUR_TO_RSD_RATE } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    if (!isSuper && currentUser.features?.oilChange === false && currentUser.features?.maintenance === false) {
      return NextResponse.json({ error: 'Motor yağı takip modülü filonuz için devre dışıdır.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    const conditions: any[] = [];
    if (vehicleId) conditions.push({ vehicleId });
    if (!isSuper) {
      if (!currentUser.fleetId) {
        return NextResponse.json({ error: 'Bağlı bir filo bulunamadı.' }, { status: 403 });
      }
      conditions.push({
        vehicle: {
          fleetId: currentUser.fleetId,
        },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const records = await prisma.oilChangeRecord.findMany({
      where,
      orderBy: { changeDate: 'desc' },
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Oil Changes GET error:', error);
    return NextResponse.json({ error: 'Yağ değişimleri alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    if (!isSuper && currentUser.features?.oilChange === false) {
      return NextResponse.json({ error: 'Motor yağı ekleme özelliği filonuz için devre dışıdır.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      vehicleId,
      changeDate,
      km,
      oilType,
      filterChanged,
      cost,
      currency = 'EUR', // 'EUR' veya 'RSD'
      serviceName,
      notes,
    } = body;

    if (!vehicleId || !oilType) {
      return NextResponse.json(
        { error: 'Araç seçimi ve motor yağı tipi zorunludur.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const oDate = changeDate ? new Date(changeDate) : new Date();
    const inputCost = parseFloat(cost) || 0;
    const costEur = currency === 'RSD'
      ? Math.round((inputCost / EUR_TO_RSD_RATE) * 100) / 100
      : inputCost;
    const currentKm = km ? parseInt(km, 10) : vehicle.currentKm;

    // Servis adını kaydet
    if (serviceName && serviceName.trim()) {
      try {
        await prisma.serviceShop.upsert({
          where: { name: serviceName.trim() },
          update: {},
          create: { name: serviceName.trim() },
        });
      } catch (e) {
        // Ignore duplicate
      }
    }

    const [record] = await prisma.$transaction([
      prisma.oilChangeRecord.create({
        data: {
          vehicleId,
          changeDate: oDate,
          km: currentKm,
          oilType: oilType.trim(),
          filterChanged: filterChanged !== false,
          cost: costEur,
          originalCost: inputCost,
          currency,
          exchangeRate: EUR_TO_RSD_RATE,
          serviceName: serviceName?.trim() || null,
          paidBy: body.paidBy?.trim() || vehicle.owner || 'Şirket Kasası',
          notes: notes?.trim() || null,
        },
        include: { vehicle: true },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          currentKm: Math.max(vehicle.currentKm, currentKm),
        },
      }),
    ]);

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'OIL_CHANGE',
      target: vehicle.plate,
      fleetId: vehicle.fleetId || currentUser?.fleetId,
      description: `${vehicle.plate} motor yağı değişimi yapıldı (${costEur} €, Ödeyen: ${record.paidBy}, Sahibi: ${vehicle.owner}, Servis: ${record.serviceName || 'Belirtilmedi'}).`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Oil Change POST error:', error);
    return NextResponse.json({ error: error.message || 'Yağ değişimi eklenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden yağ değişimi kaydı silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Kayıt ID zorunludur.' }, { status: 400 });
    }

    await prisma.oilChangeRecord.delete({ where: { id } });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_OIL_CHANGE',
      description: `Motor yağı kaydı silindi (ID: ${id}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Oil Change DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Kayıt silinemedi.' }, { status: 500 });
  }
}

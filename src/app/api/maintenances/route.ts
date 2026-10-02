import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';
import { EUR_TO_RSD_RATE } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    const conditions: any[] = [];
    if (vehicleId) conditions.push({ vehicleId });
    if (!isSuper && currentUser?.fleetId) {
      conditions.push({
        vehicle: {
          fleetId: currentUser.fleetId,
        },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const maintenances = await prisma.maintenanceRecord.findMany({
      where,
      orderBy: { maintenanceDate: 'desc' },
      include: {
        vehicle: true,
        parts: {
          orderBy: { changeDate: 'desc' },
        },
      },
    });

    return NextResponse.json(maintenances);
  } catch (error) {
    console.error('Maintenances GET error:', error);
    return NextResponse.json({ error: 'Bakımlar alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const {
      vehicleId,
      maintenanceDate,
      nextMaintenanceDate,
      laborCost,
      currency = 'EUR', // 'EUR' veya 'RSD'
      description,
      serviceName,
      markVehicleAvailable,
      notes,
      parts,
    } = body;

    if (!vehicleId || !description) {
      return NextResponse.json(
        { error: 'Araç seçimi ve işlem açıklaması zorunludur.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const mDate = maintenanceDate ? new Date(maintenanceDate) : new Date();
    // 1 aylık periyodik bakım tarihi: girilmemişse otomatik +1 ay hesapla
    const nextDate = nextMaintenanceDate
      ? new Date(nextMaintenanceDate)
      : new Date(mDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const inputLabor = parseFloat(laborCost) || 0;
    const laborEur = currency === 'RSD'
      ? Math.round((inputLabor / EUR_TO_RSD_RATE) * 100) / 100
      : inputLabor;

    const partsArray = Array.isArray(parts) ? parts : [];
    let partsTotalEur = 0;
    const partsData = partsArray
      .filter((p: any) => p.partName && p.partName.trim().length > 0)
      .map((p: any) => {
        const itemRaw = parseFloat(p.cost) || 0;
        const itemEur = p.currency === 'RSD' || currency === 'RSD'
          ? Math.round((itemRaw / EUR_TO_RSD_RATE) * 100) / 100
          : itemRaw;
        const qty = parseInt(p.quantity, 10) || 1;
        partsTotalEur += itemEur * qty;

        return {
          partName: p.partName.trim(),
          partCode: p.partCode?.trim() || null,
          changeDate: p.changeDate ? new Date(p.changeDate) : mDate,
          cost: itemEur,
          originalCost: itemRaw,
          currency: p.currency || currency,
          quantity: qty,
        };
      });

    const totalCostEur = laborEur + partsTotalEur;

    // Eğer servis adı verilmişse ve ServiceShop tablosunda yoksa otomatik kaydet
    if (serviceName && serviceName.trim()) {
      try {
        await prisma.serviceShop.upsert({
          where: { name: serviceName.trim() },
          update: {},
          create: { name: serviceName.trim() },
        });
      } catch (e) {
        // Ignore duplicate key
      }
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        maintenanceDate: mDate,
        nextMaintenanceDate: nextDate,
        laborCost: laborEur,
        partsCost: partsTotalEur,
        totalCost: totalCostEur,
        currency,
        originalCost: currency === 'RSD' ? Math.round(totalCostEur * EUR_TO_RSD_RATE) : totalCostEur,
        exchangeRate: EUR_TO_RSD_RATE,
        description: description.trim(),
        serviceName: serviceName?.trim() || null,
        paidBy: body.paidBy?.trim() || vehicle.owner || 'Şirket Kasası',
        notes: notes?.trim() || null,
        parts: {
          create: partsData,
        },
      },
      include: {
        vehicle: true,
        parts: true,
      },
    });

    // Eğer araç POST_RENTAL_CHECK veya MAINTENANCE durumundaysa ve markVehicleAvailable istendiyse aracı Boşta yap
    if (markVehicleAvailable || vehicle.status === 'POST_RENTAL_CHECK' || vehicle.status === 'MAINTENANCE') {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'MAINTENANCE',
      target: vehicle.plate,
      fleetId: vehicle.fleetId || currentUser?.fleetId,
      description: `${vehicle.plate} aracına ${totalCostEur} € tutarında bakım yapıldı (Ödeyen: ${record.paidBy}, Sahibi: ${vehicle.owner}, İşçilik: ${laborEur} €, Parça: ${partsTotalEur} €). Servis: ${serviceName || 'Genel'}.`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Maintenance POST error:', error);
    return NextResponse.json({ error: error.message || 'Bakım eklenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden bakım kaydı silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Bakım ID zorunludur.' }, { status: 400 });
    }

    await prisma.maintenanceRecord.delete({ where: { id } });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_MAINTENANCE',
      description: `Bakım kaydı silindi (ID: ${id}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Maintenance DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Bakım silinemedi.' }, { status: 500 });
  }
}

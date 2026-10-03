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

    if (!isSuper && currentUser.features?.inspection === false) {
      return NextResponse.json({ error: 'Registracija ve muayene modülü filonuz için devre dışıdır.' }, { status: 403 });
    }

    const where: any = {};
    if (!isSuper) {
      if (!currentUser.fleetId) {
        return NextResponse.json({ error: 'Bağlı bir filo bulunamadı.' }, { status: 403 });
      }
      where.vehicle = {
        fleetId: currentUser.fleetId,
      };
    }

    const inspections = await prisma.inspectionRecord.findMany({
      where,
      orderBy: { nextInspectionDate: 'asc' },
      include: { vehicle: true },
    });
    return NextResponse.json(inspections);
  } catch (error) {
    console.error('Inspection GET error:', error);
    return NextResponse.json({ error: 'Muayeneler alınamadı.' }, { status: 500 });
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

    if (!isSuper && currentUser.features?.inspection === false) {
      return NextResponse.json({ error: 'Muayene kaydı ekleme özelliği filonuz için devre dışıdır.' }, { status: 403 });
    }

    const body = await req.json();
    const { vehicleId, inspectionDate, cost, currency = 'EUR', station, notes } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Araç seçimi zorunludur.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const inspDate = inspectionDate ? new Date(inspectionDate) : new Date();
    // Yıllık 1 yıl muayene periyodu
    const nextInspDate = new Date(inspDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const inputCost = parseFloat(cost) || 0;
    const costEur = currency === 'RSD'
      ? Math.round((inputCost / EUR_TO_RSD_RATE) * 100) / 100
      : inputCost;

    const insp = await prisma.inspectionRecord.create({
      data: {
        vehicleId,
        inspectionDate: inspDate,
        nextInspectionDate: nextInspDate,
        cost: costEur,
        originalCost: inputCost,
        currency,
        station: station?.trim() || 'Auto Centar Beograd',
        paidBy: body.paidBy?.trim() || vehicle.owner || 'Şirket Kasası',
        notes: notes?.trim() || null,
      },
      include: { vehicle: true },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'CREATE_INSPECTION',
      target: vehicle.plate,
      fleetId: vehicle.fleetId || currentUser?.fleetId,
      description: `${vehicle.plate} muayene kaydı oluşturuldu (${costEur} €, Ödeyen: ${insp.paidBy}, Sahibi: ${vehicle.owner}, İstasyon: ${insp.station}).`,
    });

    return NextResponse.json(insp, { status: 201 });
  } catch (error: any) {
    console.error('Inspection POST error:', error);
    return NextResponse.json({ error: error.message || 'Muayene eklenemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden muayene kaydı silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Muayene ID zorunludur.' }, { status: 400 });
    }

    await prisma.inspectionRecord.delete({ where: { id } });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_INSPECTION',
      description: `Muayene kaydı silindi (ID: ${id}).`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inspection DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Muayene silinemedi.' }, { status: 500 });
  }
}

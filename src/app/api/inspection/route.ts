import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';
import { EUR_TO_RSD_RATE } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inspections = await prisma.inspectionRecord.findMany({
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
        notes: notes?.trim() || null,
      },
      include: { vehicle: true },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'CREATE_INSPECTION',
      target: vehicle.plate,
      description: `${vehicle.plate} için ${insp.station} yıllık muayene kaydı oluşturuldu (Maliyet: ${costEur} €). Sonraki muayene: ${nextInspDate.toISOString().slice(0, 10)}.`,
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

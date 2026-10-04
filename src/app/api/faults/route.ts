import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

import { EUR_TO_RSD_RATE } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

// GET /api/faults - List faults
export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'super-admin@company.local' ||
        currentUser.email === 'super-admin@company.local');

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status');

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status && status !== 'ALL') where.status = status;
    if (!isSuper && currentUser?.fleetId) {
      where.vehicle = { fleetId: currentUser.fleetId };
    }

    const faults = await prisma.vehicleFault.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // OPEN first, then RESOLVED
        { createdAt: 'desc' },
      ],
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            owner: true,
          },
        },
      },
    });

    return NextResponse.json(faults);
  } catch (error: any) {
    console.error('Faults GET error:', error);
    return NextResponse.json({ error: 'Arıza kayıtları alınamadı.' }, { status: 500 });
  }
}

// POST /api/faults - Create new fault
export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const {
      vehicleId,
      title,
      description,
      severity = 'MEDIUM',
      reportedBy,
      cost,
      currency = 'EUR',
    } = body;

    if (!vehicleId || !title?.trim()) {
      return NextResponse.json(
        { error: 'Araç seçimi ve arıza başlığı zorunludur.' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json({ error: 'Araç bulunamadı.' }, { status: 404 });
    }

    const fault = await prisma.vehicleFault.create({
      data: {
        vehicleId,
        title: title.trim(),
        description: description?.trim() || null,
        severity: severity || 'MEDIUM',
        status: 'OPEN',
        reportedBy: reportedBy?.trim() || currentUser?.name || 'Belirtilmedi',
        cost: cost
          ? currency === 'RSD'
            ? Math.round(((parseFloat(cost) || 0) / EUR_TO_RSD_RATE) * 100) / 100
            : parseFloat(cost) || 0
          : null,
        currency: currency || 'EUR',
        reportedDate: new Date(),
      },
      include: {
        vehicle: true,
      },
    });

    // Also create a high priority Notification
    await prisma.notification.create({
      data: {
        title: `Araç Arızası Bildirildi: ${vehicle.plate}`,
        message: `${vehicle.plate} (${vehicle.brand} ${vehicle.model}) için arıza kaydı: "${fault.title}" (${fault.severity})`,
        type: 'WARNING',
        targetPlate: vehicle.plate,
        fleetId: vehicle.fleetId,
        link: `/vehicles/${vehicle.id}`,
      },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'REPORT_FAULT',
      target: vehicle.plate,
      fleetId: vehicle.fleetId,
      description: `${vehicle.plate} için yeni arıza bildirildi: "${fault.title}" (${fault.severity}).`,
    });

    return NextResponse.json(fault, { status: 201 });
  } catch (error: any) {
    console.error('Faults POST error:', error);
    return NextResponse.json({ error: error.message || 'Arıza kaydedilemedi.' }, { status: 500 });
  }
}

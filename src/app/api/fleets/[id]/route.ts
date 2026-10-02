import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.email !== 'akif@filoyonetim.com')) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const fleet = await prisma.fleet.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        vehicles: {
          select: { id: true, plate: true, brand: true, model: true, status: true },
        },
        customers: {
          select: { id: true, name: true, phone: true },
        },
        _count: {
          select: { vehicles: true, customers: true, users: true },
        },
      },
    });

    if (!fleet) {
      return NextResponse.json({ error: 'Filo bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(fleet);
  } catch (error) {
    console.error('Fleet detail GET error:', error);
    return NextResponse.json({ error: 'Filo detayları alınamadı.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.email !== 'akif@filoyonetim.com')) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, ownerName, ownerEmail, phone, city, maxVehicles, status, notes, extendMonths } = body;

    const currentFleet = await prisma.fleet.findUnique({ where: { id: params.id } });
    if (!currentFleet) {
      return NextResponse.json({ error: 'Filo bulunamadı.' }, { status: 404 });
    }

    let updatedExpiresAt = currentFleet.expiresAt;
    if (extendMonths && parseInt(extendMonths) > 0) {
      const baseDate = currentFleet.expiresAt && currentFleet.expiresAt > new Date()
        ? new Date(currentFleet.expiresAt)
        : new Date();
      baseDate.setMonth(baseDate.getMonth() + parseInt(extendMonths));
      updatedExpiresAt = baseDate;
    }

    const updated = await prisma.fleet.update({
      where: { id: params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(ownerName !== undefined ? { ownerName: ownerName?.trim() || null } : {}),
        ...(ownerEmail !== undefined ? { ownerEmail: ownerEmail?.trim().toLowerCase() || null } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(city !== undefined ? { city: city?.trim() || 'Belgrad' } : {}),
        ...(maxVehicles ? { maxVehicles: parseInt(maxVehicles) } : {}),
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(extendMonths ? { expiresAt: updatedExpiresAt } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE_FLEET',
        target: updated.name,
        description: `Filo güncellendi: ${updated.name} (Durum: ${updated.status}, Kota: ${updated.maxVehicles})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Fleet PUT error:', error);
    return NextResponse.json({ error: error.message || 'Filo güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.email !== 'akif@filoyonetim.com')) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const fleet = await prisma.fleet.findUnique({ where: { id: params.id } });
    if (!fleet) {
      return NextResponse.json({ error: 'Filo bulunamadı.' }, { status: 404 });
    }

    await prisma.fleet.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: 'SUPER_ADMIN',
        action: 'DELETE_FLEET',
        target: fleet.name,
        description: `Filo ve tüm verileri silindi: ${fleet.name} (${fleet.code})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fleet DELETE error:', error);
    return NextResponse.json({ error: 'Filo silinemedi.' }, { status: 500 });
  }
}

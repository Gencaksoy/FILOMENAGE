import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function checkIsSuper(user: any) {
  return (
    user &&
    (user.role === 'SUPER_ADMIN' ||
      user.email === 'akif@filoyonetim.com' ||
      user.email === 'gencaksoy@outlook.com')
  );
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!checkIsSuper(currentUser)) {
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
    if (!checkIsSuper(currentUser)) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      ownerName,
      ownerEmail,
      phone,
      city,
      maxVehicles,
      status,
      notes,
      extendMonths,
      isPartnership,
      partners,
      features,
    } = body;

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

    let formattedPartners: string | undefined = undefined;
    if (partners !== undefined) {
      if (Array.isArray(partners)) {
        formattedPartners = JSON.stringify(partners.map((p: any) => String(p).trim()).filter(Boolean));
      } else if (typeof partners === 'string') {
        try {
          const parsed = JSON.parse(partners);
          formattedPartners = Array.isArray(parsed) ? JSON.stringify(parsed) : '[]';
        } catch {
          formattedPartners = JSON.stringify(partners.split(',').map((p) => p.trim()).filter(Boolean));
        }
      }
    }

    let formattedFeatures: string | undefined = undefined;
    if (features !== undefined) {
      formattedFeatures = typeof features === 'string' ? features : JSON.stringify(features);
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
        ...(isPartnership !== undefined ? { isPartnership: Boolean(isPartnership) } : {}),
        ...(formattedPartners !== undefined ? { partners: formattedPartners } : {}),
        ...(formattedFeatures !== undefined ? { features: formattedFeatures } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(extendMonths ? { expiresAt: updatedExpiresAt } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userName: currentUser?.name || 'SaaS Yönetici',
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
    if (!checkIsSuper(currentUser)) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const fleet = await prisma.fleet.findUnique({
      where: { id: params.id },
      include: {
        users: true,
        vehicles: {
          include: {
            rentals: true,
            maintenances: true,
            oilChanges: true,
            inspections: true,
            faults: true,
          },
        },
        customers: {
          include: {
            documents: true,
            rentals: true,
          },
        },
      },
    });

    if (!fleet) {
      return NextResponse.json({ error: 'Filo bulunamadı.' }, { status: 404 });
    }

    // 1. Silinen filo ve tüm ilişkili verilerini ArchivedRecord tablosuna arşivle
    await prisma.archivedRecord.create({
      data: {
        tableName: 'Fleet',
        recordId: fleet.id,
        title: `${fleet.name} (${fleet.code})`,
        data: JSON.stringify(fleet),
        fleetId: fleet.id,
        deletedBy: currentUser?.name || currentUser?.email || 'SaaS Yöneticisi',
        reason: 'Süper Yönetici tarafından filo ve tüm ilişkili alt verileri arşivlendi ve silindi.',
      },
    });

    // 2. Filonun tüm kullanıcılarını tek tek de arşivle
    for (const u of fleet.users) {
      await prisma.archivedRecord.create({
        data: {
          tableName: 'User',
          recordId: u.id,
          title: `${u.name} (${u.email})`,
          data: JSON.stringify(u),
          fleetId: fleet.id,
          deletedBy: currentUser?.name || currentUser?.email || 'SaaS Yöneticisi',
          reason: `Bağlı olduğu filo (${fleet.name}) silindiği için kullanıcı arşivlendi.`,
        },
      });
    }

    // 3. Filonun tüm araçlarını tek tek de arşivle
    for (const v of fleet.vehicles) {
      await prisma.archivedRecord.create({
        data: {
          tableName: 'Vehicle',
          recordId: v.id,
          title: `${v.plate} - ${v.brand} ${v.model}`,
          data: JSON.stringify(v),
          fleetId: fleet.id,
          deletedBy: currentUser?.name || currentUser?.email || 'SaaS Yöneticisi',
          reason: `Bağlı olduğu filo (${fleet.name}) silindiği için araç arşivlendi.`,
        },
      });
    }

    // 4. Filoyu sil (Cascade sayesinde users, vehicles, customers aktif tablolardan tamamen temizlenir)
    await prisma.fleet.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        userName: currentUser?.name || 'SaaS Yönetici',
        userRole: 'SUPER_ADMIN',
        action: 'DELETE_FLEET',
        target: fleet.name,
        description: `Filo ve tüm verileri silinip arşive aktarıldı: ${fleet.name} (${fleet.code})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Filo ve bağlı tüm veriler başarıyla arşive aktarılarak silindi.' });
  } catch (error) {
    console.error('Fleet DELETE error:', error);
    return NextResponse.json({ error: 'Filo silinemedi.' }, { status: 500 });
  }
}

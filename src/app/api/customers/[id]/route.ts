import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          include: { vehicle: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!customer || customer.isDeleted) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json({ error: 'Müşteri bilgisi alınamadı.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim(),
        phone: body.phone?.trim(),
        identityNo: body.identityNo?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    await logAudit({
      userName: 'Yönetici',
      action: 'UPDATE_CUSTOMER',
      target: updated.name,
      fleetId: updated.fleetId,
      description: `Müşteri bilgileri güncellendi: ${updated.name}`,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Customer PUT error:', error);
    return NextResponse.json({ error: error.message || 'Müşteri güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser();
    if (currentUser && currentUser.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Çalışanların (STAFF) sistemden veri veya müşteri silme yetkisi yoktur!' },
        { status: 403 }
      );
    }

    const fullCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
        rentals: true,
      },
    });

    if (!fullCustomer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const hasActiveRentals = fullCustomer.rentals.some((r) => r.status === 'ACTIVE');
    if (hasActiveRentals) {
      return NextResponse.json(
        { error: 'Bu müşterinin üzerinde aktif araç bulunmaktadır! Önce aracı teslim alınız.' },
        { status: 400 }
      );
    }

    // 1. Arşiv tablosuna aktar
    await prisma.archivedRecord.create({
      data: {
        tableName: 'Customer',
        recordId: fullCustomer.id,
        title: `${fullCustomer.name} (${fullCustomer.phone})`,
        data: JSON.stringify(fullCustomer),
        fleetId: fullCustomer.fleetId,
        deletedBy: currentUser?.name || 'Yönetici',
        reason: 'Müşteri silindi ve arşiv tablosuna aktarıldı.',
      },
    });

    // 2. Ana tablodan sil
    await prisma.customer.delete({
      where: { id: params.id },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_CUSTOMER',
      target: fullCustomer.name,
      fleetId: fullCustomer.fleetId,
      description: `Müşteri arşivlendi ve silindi: ${fullCustomer.name}`,
    });

    return NextResponse.json({ success: true, message: 'Müşteri başarıyla arşive aktarılarak silindi.' });
  } catch (error: any) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Müşteri silinemedi.' }, { status: 500 });
  }
}

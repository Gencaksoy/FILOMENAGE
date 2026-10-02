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

    const activeRentals = await prisma.rental.count({
      where: { customerId: params.id, status: 'ACTIVE' },
    });

    if (activeRentals > 0) {
      return NextResponse.json(
        { error: 'Bu müşterinin üzerinde aktif araç bulunmaktadır! Önce aracı teslim alınız.' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'DELETE_CUSTOMER',
      target: customer.name,
      description: `Müşteri silindi: ${customer.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Müşteri silinemedi.' }, { status: 500 });
  }
}

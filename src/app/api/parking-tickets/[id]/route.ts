import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, isCustomerNotified } = body;

    const isSuper =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.email === 'akif@filoyonetim.com' ||
      currentUser.email === 'gencaksoy@outlook.com';

    // Find ticket first
    const ticket = await prisma.parkingTicket.findUnique({
      where: { id },
      include: {
        vehicle: true,
        customer: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Park cezası bulunamadı.' }, { status: 404 });
    }

    // Tenant check
    if (!isSuper && currentUser.fleetId && ticket.fleetId && ticket.fleetId !== currentUser.fleetId) {
      return NextResponse.json({ error: 'Bu cezaya erişim yetkiniz yok.' }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (typeof status === 'string' && (status === 'PAID' || status === 'UNPAID')) {
      dataToUpdate.status = status;
    }
    if (typeof isCustomerNotified === 'boolean') {
      dataToUpdate.isCustomerNotified = isCustomerNotified;
    }

    const updated = await prisma.parkingTicket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        vehicle: {
          select: { id: true, plate: true, brand: true, model: true, owner: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
        rental: {
          select: { id: true, startDate: true, endDate: true },
        },
      },
    });

    // Audit log
    if (status && status !== ticket.status) {
      await logAudit({
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATE_PARKING_TICKET_STATUS',
        target: ticket.plate || ticket.ticketNumber,
        description: `${ticket.plate} plakalı araca ait ${ticket.ticketNumber} numaralı ceza durumu '${status}' olarak güncellendi.`,
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update parking ticket error:', error);
    return NextResponse.json({ error: error.message || 'Ceza güncellenemedi.' }, { status: 500 });
  }
}

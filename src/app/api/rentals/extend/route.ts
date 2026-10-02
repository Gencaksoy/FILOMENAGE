import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    const body = await req.json();
    const { rentalId, additionalDays = 30, additionalAmount = 0, isPaid = true, notes } = body;

    if (!rentalId) {
      return NextResponse.json({ error: 'Kiralama ID zorunludur.' }, { status: 400 });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { vehicle: true, customer: true },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Kiralama kaydı bulunamadı.' }, { status: 404 });
    }

    if (rental.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Yalnızca aktif kiralamalarda süre uzatılabilir.' },
        { status: 400 }
      );
    }

    const daysToAdd = parseInt(additionalDays, 10) || 30;
    const extraAmount = parseFloat(additionalAmount) || 0;

    // Calculate new end date based on current endDate
    const currentEnd = new Date(rental.endDate);
    const newEndDate = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const newTotalAmount = (rental.totalAmount || 0) + extraAmount;

    const extensionNote = `[Süre Uzatma: +${daysToAdd} Gün, +${extraAmount} € (${isPaid ? 'Ödendi' : 'Ödeme Bekliyor'}), Yeni Bitiş: ${newEndDate.toISOString().slice(0, 10)}${notes ? ' - ' + notes.trim() : ''}]`;
    const updatedNotes = rental.notes ? `${rental.notes} | ${extensionNote}` : extensionNote;

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        endDate: newEndDate,
        totalAmount: newTotalAmount,
        extensionCount: { increment: 1 },
        lastExtensionDays: daysToAdd,
        notes: updatedNotes,
      },
      include: { vehicle: true, customer: true },
    });

    await logAudit({
      userName: currentUser?.name || 'Yönetici',
      userRole: currentUser?.role || 'ADMIN',
      action: 'RENTAL_EXTEND',
      target: rental.vehicle.plate,
      fleetId: rental.vehicle?.fleetId || currentUser?.fleetId,
      description: `${rental.vehicle.plate} aracı ${rental.customer.name} için ${daysToAdd} gün uzatıldı (+${extraAmount} €, Yeni İade: ${newEndDate.toISOString().slice(0, 10)}).`,
    });

    return NextResponse.json({
      success: true,
      rental: updatedRental,
      newEndDate,
      newTotalAmount,
    });
  } catch (error: any) {
    console.error('Rental Extend error:', error);
    return NextResponse.json(
      { error: error.message || 'Kiralama süresi uzatılamadı.' },
      { status: 500 }
    );
  }
}

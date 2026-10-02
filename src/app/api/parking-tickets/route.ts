import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { initBackgroundWorker } from '@/lib/background-worker';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  initBackgroundWorker();
  try {
    const currentUser = await getSessionUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search')?.trim() || '';
    const vehicleId = searchParams.get('vehicleId');

    const conditions: any[] = [];

    // Multi-tenant filo filtrelemesi
    if (!isSuper && currentUser?.fleetId) {
      conditions.push({
        OR: [
          { vehicle: { fleetId: currentUser.fleetId } },
          { vehicle: { fleetId: null } },
          { fleetId: currentUser.fleetId },
          { fleetId: null },
        ],
      });
    }

    if (status !== 'ALL') {
      conditions.push({ status });
    }

    if (vehicleId) {
      conditions.push({ vehicleId });
    }

    if (search) {
      conditions.push({
        OR: [
          { plate: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
          { street: { contains: search, mode: 'insensitive' } },
          { zone: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { phone: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [tickets, companySetting] = await Promise.all([
      prisma.parkingTicket.findMany({
        where,
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
        orderBy: { issueDate: 'desc' },
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'company_name' },
      }),
    ]);

    const companyName = companySetting?.value || 'Filo Yönetim';

    // Özet istatistikler
    const totalTickets = tickets.length;
    const unpaidTickets = tickets.filter((t) => t.status === 'UNPAID');
    const paidTickets = tickets.filter((t) => t.status === 'PAID');
    const totalUnpaidAmountRsd = unpaidTickets.reduce((sum, t) => sum + (t.amountRsd || 0), 0);
    const totalUnpaidAmountEur = unpaidTickets.reduce((sum, t) => sum + (t.amountEur || 0), 0);
    const totalAmountRsd = tickets.reduce((sum, t) => sum + (t.amountRsd || 0), 0);
    const totalAmountEur = tickets.reduce((sum, t) => sum + (t.amountEur || 0), 0);

    return NextResponse.json({
      tickets,
      companyName,
      stats: {
        totalCount: totalTickets,
        unpaidCount: unpaidTickets.length,
        paidCount: paidTickets.length,
        totalUnpaidAmountRsd,
        totalUnpaidAmountEur,
        totalAmountRsd,
        totalAmountEur,
      },
    });
  } catch (error: any) {
    console.error('Parking tickets GET error:', error);
    return NextResponse.json({ error: 'Park cezaları alınamadı.' }, { status: 500 });
  }
}

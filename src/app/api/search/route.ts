import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ vehicles: [], customers: [] });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ vehicles: [], customers: [] });
    }

    const isSuper = isSuperAdmin(currentUser);
    const searchVehicles = isSuper || currentUser.features?.vehicles !== false;
    const searchCustomers = isSuper || currentUser.features?.customers !== false;

    // Multi-tenant filo filtreleri
    const vehicleConditions: any[] = [{ isDeleted: false }];
    if (!isSuper && currentUser.fleetId) {
      vehicleConditions.push({ fleetId: currentUser.fleetId });
    }
    vehicleConditions.push({
      OR: [
        { plate: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ],
    });

    const customerConditions: any[] = [{ isDeleted: false }];
    if (!isSuper && currentUser.fleetId) {
      customerConditions.push({ fleetId: currentUser.fleetId });
    }
    customerConditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { identityNo: { contains: q, mode: 'insensitive' } },
      ],
    });

    const [vehicles, customers] = await Promise.all([
      searchVehicles
        ? prisma.vehicle.findMany({
            where: { AND: vehicleConditions },
            take: 6,
            select: {
              id: true,
              plate: true,
              brand: true,
              model: true,
              currentKm: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      searchCustomers
        ? prisma.customer.findMany({
            where: { AND: customerConditions },
            take: 6,
            select: {
              id: true,
              name: true,
              phone: true,
              identityNo: true,
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ vehicles, customers });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ vehicles: [], customers: [] });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ vehicles: [], customers: [] });
    }

    const [vehicles, customers] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          isDeleted: false,
          OR: [
            { plate: { contains: q } },
            { brand: { contains: q } },
            { model: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          currentKm: true,
          status: true,
        },
      }),
      prisma.customer.findMany({
        where: {
          isDeleted: false,
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { identityNo: { contains: q } },
          ],
        },
        take: 6,
        select: {
          id: true,
          name: true,
          phone: true,
          identityNo: true,
        },
      }),
    ]);

    return NextResponse.json({ vehicles, customers });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ vehicles: [], customers: [] });
  }
}

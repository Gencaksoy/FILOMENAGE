import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { description: { contains: search } },
        { action: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Audit Logs GET error:', error);
    return NextResponse.json({ error: 'Loglar alınamadı.' }, { status: 500 });
  }
}

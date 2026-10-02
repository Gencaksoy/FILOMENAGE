import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};

    // Kullanıcılar Süper Admin'in (Akif Aksoy) yaptığı değişiklikleri ASLA göremez!
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.email !== 'akif@filoyonetim.com') {
      where.AND = [
        { userName: { not: 'Akif Aksoy' } },
        { userRole: { not: 'SUPER_ADMIN' } },
      ];
    }

    if (search) {
      const searchCondition = {
        OR: [
          { userName: { contains: search } },
          { description: { contains: search } },
          { action: { contains: search } },
        ],
      };
      if (where.AND) {
        where.AND.push(searchCondition);
      } else {
        where.OR = searchCondition.OR;
      }
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

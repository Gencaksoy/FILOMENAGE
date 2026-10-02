import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    if (!isSuper) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Arşiv kayıtlarına yalnızca SaaS Yöneticisi erişebilir.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table') || 'ALL';
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (table !== 'ALL') {
      where.tableName = table;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { deletedBy: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { tableName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const archives = await prisma.archivedRecord.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(archives);
  } catch (error: any) {
    console.error('Archives GET error:', error);
    return NextResponse.json({ error: 'Arşiv kayıtları alınamadı.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const isSuper =
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.email === 'akif@filoyonetim.com' ||
        currentUser.email === 'gencaksoy@outlook.com');

    if (!isSuper) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Arşiv kayıt ID zorunludur.' }, { status: 400 });
    }

    await prisma.archivedRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Arşiv kaydı veritabanından kalıcı olarak silindi.' });
  } catch (error: any) {
    console.error('Archives DELETE error:', error);
    return NextResponse.json({ error: 'Kayıt kalıcı olarak silinemedi.' }, { status: 500 });
  }
}

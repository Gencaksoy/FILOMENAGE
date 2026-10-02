import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const { id } = params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Ana yönetici Akif Aksoy veya aktif oturumdaki kullanıcının silinmesini engelle
    if (userToDelete.email === 'akif@filoyonetim.com' || userToDelete.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Ana yönetici hesabı veya aktif oturum silinemez.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'DELETE_USER',
        target: userToDelete.name,
        description: `Kullanıcı silindi: ${userToDelete.name} (${userToDelete.email})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Kullanıcı silinemedi.' }, { status: 500 });
  }
}

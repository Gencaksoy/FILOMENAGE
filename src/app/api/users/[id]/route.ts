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
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const isSuper = currentUser.role === 'SUPER_ADMIN' || currentUser.email === 'akif@filoyonetim.com';
    const { id } = params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Normal kullanıcılar süper yöneticiyi silemez veya sorgulayamaz (yokmuş gibi davran)
    if (!isSuper && (userToDelete.role === 'SUPER_ADMIN' || userToDelete.email === 'akif@filoyonetim.com')) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Aktif oturumdaki kullanıcının kendini silmesini engelle
    if (userToDelete.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Aktif oturum açmış kullanıcı silinemez.' },
        { status: 400 }
      );
    }

    // Filo yöneticisi başka filonun kullanıcısını silemez
    if (!isSuper && currentUser.fleetId && userToDelete.fleetId !== currentUser.fleetId) {
      return NextResponse.json({ error: 'Bu kullanıcıyı silme yetkiniz yok.' }, { status: 403 });
    }

    // 1. Kullanıcıyı ArchivedRecord tablosuna aktar
    await prisma.archivedRecord.create({
      data: {
        tableName: 'User',
        recordId: userToDelete.id,
        title: `${userToDelete.name} (${userToDelete.email})`,
        data: JSON.stringify(userToDelete),
        fleetId: userToDelete.fleetId,
        deletedBy: currentUser.name,
        reason: 'Kullanıcı silindi ve arşive aktarıldı.',
      },
    });

    // 2. Ana tablodan sil
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'DELETE_USER',
        target: userToDelete.name,
        description: `Kullanıcı silindi ve arşive aktarıldı: ${userToDelete.name} (${userToDelete.email})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Kullanıcı başarıyla arşive aktarılarak silindi.' });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Kullanıcı silinemedi.' }, { status: 500 });
  }
}

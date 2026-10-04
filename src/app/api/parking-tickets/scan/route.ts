import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { checkAndSaveVehicleTickets, scanAllFleetTickets } from '@/lib/parking-servis';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Oturum açmanız gerekmektedir.' }, { status: 401 });
    }

    const isSuper =
      currentUser.role === 'SUPER_ADMIN';

    if (!isSuper && currentUser.features?.parkingTickets === false) {
      return NextResponse.json({ error: 'Park cezaları (eDPK) modülü filonuz için devre dışıdır.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { vehicleId } = body;

    if (vehicleId) {
      // Tek araç için Parking Servis sorgulaması
      const result = await checkAndSaveVehicleTickets(vehicleId);

      await logAudit({
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SCAN_PARKING_TICKETS',
        target: result.plate || vehicleId,
        description: `${result.plate || vehicleId} plakalı araç için Belgrade Parking Servis sorgusu yapıldı. (Yeni Ceza: ${result.newTicketsCount || 0})`,
      });

      return NextResponse.json(result);
    } else {
      // Filonun tüm araçları için toplu sorgulama
      const fleetId = currentUser.role === 'SUPER_ADMIN' ? null : currentUser.fleetId;
      const result = await scanAllFleetTickets(fleetId);

      await logAudit({
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SCAN_ALL_PARKING_TICKETS',
        target: currentUser.fleetName || 'Tüm Filo',
        description: `Tüm filo araçları için Belgrade Parking Servis toplu taraması tamamlandı (${result.scannedCount} araç tarandı, ${result.newTicketsTotal} yeni ceza bulundu).`,
      });

      return NextResponse.json({
        success: true,
        message: `${result.scannedCount} araç başarıyla tarandı. Toplam ${result.newTicketsTotal} yeni park cezası tespit edildi.`,
        ...result,
      });
    }
  } catch (error: any) {
    console.error('Parking tickets scan error:', error);
    return NextResponse.json({ error: error.message || 'Tarama sırasında hata oluştu.' }, { status: 500 });
  }
}

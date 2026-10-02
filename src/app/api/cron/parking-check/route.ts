import { NextResponse } from 'next/server';
import { scanAllFleetTickets } from '@/lib/parking-servis';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds maximum execution for serverless

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const secretQuery = searchParams.get('secret');

    // Güvenlik doğrulaması: Eğer CRON_SECRET tanımlıysa kontrol et
    if (cronSecret) {
      const isAuthValid =
        authHeader === `Bearer ${cronSecret}` || secretQuery === cronSecret;
      if (!isAuthValid) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
      }
    }

    console.log('[CRON] Belgrade Parking Servis otomatik park cezası taraması başlatıldı...');
    const startTime = Date.now();

    // Tüm filoların aktif araçlarını tara
    const result = await scanAllFleetTickets(null);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[CRON] Belgrade Parking Servis taraması bitti. Süre: ${duration}s, Taranan araç: ${result.scannedCount}, Yeni ceza: ${result.newTicketsTotal}`
    );

    // Sistem logu düş
    await logAudit({
      userName: 'Sistem (Zamanlanmış Görev)',
      userRole: 'SUPER_ADMIN',
      action: 'CRON_PARKING_CHECK',
      target: 'Tüm Filo Araçları',
      description: `Otomatik arka plan park cezası taraması tamamlandı (${result.scannedCount} araç tarandı, ${result.newTicketsTotal} yeni ceza bulundu, Süre: ${duration}s).`,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationSeconds: Number(duration),
      ...result,
    });
  } catch (error: any) {
    console.error('[CRON] Park cezası tarama hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron taraması sırasında hata oluştu.' },
      { status: 500 }
    );
  }
}

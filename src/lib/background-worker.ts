// Arka planda 90 dakikada bir otomatik park cezası tarayıcısı
let isWorkerRunning = false;

export function initBackgroundWorker() {
  if (typeof window !== 'undefined') return;
  if (isWorkerRunning) return;
  
  isWorkerRunning = true;
  console.log('🚗 [Background Worker] Belgrade Parking Servis arka plan tarayıcısı devrede.');

  // 90 dakikada bir (5400000 ms) arka planda otomatik çalışır
  const INTERVAL_MS = 90 * 60 * 1000;

  setInterval(async () => {
    try {
      console.log('🔍 [Background Worker] Periyodik araç park cezası taraması yapılıyor...');
      const { scanAllFleetTickets } = await import('@/lib/parking-servis');
      const res = await scanAllFleetTickets(null);
      console.log(`✅ [Background Worker] Tarama bitti: ${res.scannedCount} araç kontrol edildi, ${res.newTicketsTotal} yeni ceza bulundu.`);
    } catch (err) {
      console.error('❌ [Background Worker] Periyodik ceza taramasında hata:', err);
    }
  }, INTERVAL_MS);
}

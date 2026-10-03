import dns from 'dns';

/**
 * Sunucu tarafında e-posta alan adının (domain) aktif bir MX (posta sunucusu) veya A kaydı
 * olup olmadığını DNS sorgusu ile doğrular. Bu sayede sahte alan adları (@blabla123.com) reddedilir.
 */
export async function verifyEmailDomainDns(email: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parts = (email || '').trim().toLowerCase().split('@');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Geçersiz e-posta biçimi.' };
    }

    const domain = parts[1];

    // Test ve geliştirme istisnaları
    if (domain === 'localhost' || domain === 'filoyonetim.com' || domain.endsWith('.local')) {
      return { valid: true };
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // DNS sorgusu 3 saniyede yanıt vermezse kullanıcıyı bekletmemek için geçişe izin ver
        resolve({ valid: true });
      }, 3000);

      // 1. Adım: MX (Mail Exchanger) kayıtlarını sorgula
      dns.resolveMx(domain, (err, mxAddresses) => {
        if (!err && mxAddresses && mxAddresses.length > 0) {
          clearTimeout(timeout);
          return resolve({ valid: true });
        }

        // 2. Adım: MX yoksa ana domain A kaydını sorgula
        dns.resolve4(domain, (errA, aAddresses) => {
          clearTimeout(timeout);
          if (!errA && aAddresses && aAddresses.length > 0) {
            return resolve({ valid: true });
          }

          return resolve({
            valid: false,
            reason: `"${domain}" alan adına ait aktif bir posta sunucusu bulunamadı. Lütfen gerçek ve aktif bir e-posta adresi giriniz.`,
          });
        });
      });
    });
  } catch {
    return { valid: true };
  }
}

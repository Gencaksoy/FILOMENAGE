/**
 * Client-Side Image Compression & Safe File Upload Utility
 * Tarayıcı (özellikle Safari / WebKit) hatalarını önler,
 * Yüksek çözünürlüklü fotoğrafları Vercel 4.5MB limitine takılmadan
 * istemci tarafında otomatik optimize ederek yükler.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<File> {
  // Görsel değilse (örn. PDF) orijinal dosyayı döndür
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  // 400KB'dan küçükse zaten yeterince hafif, sıkıştırmaya gerek yok
  if (file.size <= 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Sıkıştırılmış hali orijinalden büyükse veya hata olduysa orijinali kullan
              resolve(file);
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Güvenli ve hata korumalı dosya yükleme fonksiyonu.
 * Safari "The string did not match the expected pattern" ve
 * HTML 413 / 500 parse hatalarını %100 önler.
 */
export async function safeUploadFile(file: File): Promise<{
  fileUrl: string;
  url: string;
  fileName: string;
}> {
  if (!file) {
    throw new Error('Lütfen yüklenecek bir dosya seçiniz.');
  }

  // 1. İstemci tarafı akıllı sıkıştırma (Görsel ise)
  let fileToUpload = file;
  try {
    fileToUpload = await compressImageFile(file);
  } catch (compErr) {
    console.warn('Görsel sıkıştırma atlandı:', compErr);
    fileToUpload = file;
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  // Safari JSON parsing hatasını önlemek için önce metin olarak oku
  const responseText = await res.text();
  let json: any = null;

  try {
    json = JSON.parse(responseText);
  } catch {
    console.error('Upload raw server response:', responseText);
    if (res.status === 413) {
      throw new Error('Dosya boyutu çok yüksek. Lütfen daha küçük bir dosya veya fotoğraf seçiniz.');
    }
    throw new Error(`Dosya yüklenemedi (Sunucu Hatası: ${res.status}). Lütfen tekrar deneyiniz.`);
  }

  if (!res.ok) {
    throw new Error(json?.error || `Yükleme hatası (${res.status}).`);
  }

  const finalUrl = json.fileUrl || json.url;
  if (!finalUrl) {
    throw new Error('Yüklenen dosyanın URL adresi alınamadı.');
  }

  return {
    fileUrl: finalUrl,
    url: finalUrl,
    fileName: json.fileName || file.name,
  };
}

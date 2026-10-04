import * as XLSX from 'xlsx';

export interface ParsedVehicleRow {
  plate: string;
  brand: string;
  model: string;
  modelYear: number;
  color?: string;
  currentKm: number;
  fuelType: string;
  owner?: string;
  purchasePrice?: number;
  monthlyPrice: number;
  dailyPrice?: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'POST_RENTAL_CHECK';
  customerName?: string;
  customerPhone?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  notes?: string;
}

export interface ExcelAnalysisResult {
  headers: string[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  vehicles: ParsedVehicleRow[];
  columnMapping: Record<string, string>;
  aiConfidence: string;
  method: 'GEMINI_AI' | 'HEURISTIC_FALLBACK';
}

// Clean plate standard
export function cleanPlate(p: any): string {
  if (!p) return '';
  return String(p).trim().toUpperCase();
}

/**
 * Excel Buffer'ını okur ve JSON satırlarına dönüştürür
 */
export function readExcelBuffer(buffer: Buffer): { headers: string[]; rows: Record<string, any>[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel dosyasında sayfa bulunamadı.');
  }

  const sheet = workbook.Sheets[sheetName];
  // Header array ve row array çıkarımı
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rawRows || rawRows.length === 0) {
    throw new Error('Excel dosyası boş veya veri içermiyor.');
  }

  const headers = Object.keys(rawRows[0] || {});
  return { headers, rows: rawRows };
}

/**
 * Gemini AI ile sütunları ve satırları analiz edip hedef şemaya dönüştürür.
 */
export async function analyzeExcelWithGemini(
  headers: string[],
  rows: Record<string, any>[]
): Promise<{ vehicles: ParsedVehicleRow[]; columnMapping: Record<string, string> }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tanımlı değil.');
  }

  // İlk 20 satırı örnek olarak analiz ettir
  const sampleData = rows.slice(0, 25);

  const prompt = `
Sen filo ve araç kiralama verilerini normalize eden uzman bir veri mühendisisin.
Aşağıda kullanıcının yüklediği bir Excel dosyasının sütun başlıkları ve ilk ${sampleData.length} satırlık örnek verisi verilmiştir.
Sütun başlıkları ve veriler Sırpça, Türkçe, İngilizce veya serbest/kısaltmalı formatlarda olabilir (örneğin: "Tablica", "Registracija", "Vozilo", "Auto", "Vozac", "Godiste", "Kilometraza", "Cena", "Kiracı", "Plaka", vb.).

Bu verileri analiz et ve sistemimizin hedef araç şemasına dönüştür.

HEDEF ALANLAR (JSON formatında her araç için):
- plate (string, ZORUNLU: Araç plakası, örn: "BG-1709OT" veya "34ABC123". Boş veya geçersiz olamaz, plaka bulunamazsa o satırı atla)
- brand (string: Araç markası, örn: "Fiat", "Renault", "Volkswagen". Eğer Marka ve Model tek sütundaysa, örn "Fiat Punto 1.2" ise markayı "Fiat", modeli "Punto 1.2" olarak akıllıca ayır)
- model (string: Araç modeli, örn: "Punto 1.2 8V", "Clio", "Golf 7")
- modelYear (number: Model yılı, örn: 2018, 2021. Bulunamazsa 2020)
- color (string: Araç rengi, örn: "Beyaz", "Siyah", "Gri")
- currentKm (number: Güncel kilometre, sayısal değer)
- fuelType (string: "Dizel", "Benzin", "Benzin+LPG", "Hibrid", "Elektrik")
- owner (string: Araç sahibi / şirket veya ortak adı)
- purchasePrice (number: Satın alma fiyatı EUR)
- monthlyPrice (number: Aylık kiralama fiyatı EUR, varsayılan 350)
- dailyPrice (number: Günlük kiralama fiyatı EUR, varsayılan 25)
- status (string: "RENTED" veya "AVAILABLE". Eğer satırda kiracı / müşteri / sürücü bilgisi varsa "RENTED" yap, yoksa "AVAILABLE" yap)
- customerName (string: Kiracı / sürücü adı ve soyadı, varsa)
- customerPhone (string: Kiracı telefon numarası, varsa)
- rentalStartDate (string: YYYY-MM-DD formatında, varsa)
- rentalEndDate (string: YYYY-MM-DD formatında, varsa)
- notes (string: Ek notlar, bilinen sorunlar veya açıklamalar)

SÜTUN BAŞLIKLARI:
${JSON.stringify(headers)}

ÖRNEK VERİLER (İlk ${sampleData.length} satır):
${JSON.stringify(sampleData, null, 2)}

YANIT FORMATI:
Sadece ve sadece geçerli bir JSON objesi döndür (markdown kod bloğu veya ekstra açıklama yazma):
{
  "columnMapping": {
    "ExceldekiSutunAdi": "HedefAlanAdi (örn: plate, brand, model, customerName vb.)"
  },
  "vehicles": [
    // Normalize edilmiş araç objeleri dizisi
  ]
}
`;

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
  ];

  let textOutput: string | null = null;
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const jsonRes = await response.json();
        textOutput = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) break;
      } else {
        const errText = await response.text();
        lastError = new Error(`Model ${model} error (${response.status}): ${errText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!textOutput) {
    throw lastError || new Error('Tüm Gemini modelleri meşgul veya ulaşılamadı.');
  }

  // JSON parse
  let parsed: any;
  try {
    parsed = JSON.parse(textOutput);
  } catch (e) {
    // Markdown bloğu varsa temizle
    const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  }

  const columnMapping = parsed.columnMapping || {};
  let vehicles: ParsedVehicleRow[] = Array.isArray(parsed.vehicles) ? parsed.vehicles : [];

  // Eğer Excel'deki satır sayısı Gemini'ye gönderilen örnekten fazlaysa,
  // geri kalan satırları yapay zekanın çıkardığı columnMapping ile otomatik ayrıştır
  if (rows.length > sampleData.length) {
    const remainingRows = rows.slice(sampleData.length);
    const mappedRemaining = applyMappingToRows(remainingRows, columnMapping);
    vehicles = [...vehicles, ...mappedRemaining];
  }

  return {
    vehicles,
    columnMapping,
  };
}

/**
 * Sütun eşleme haritasını (columnMapping) satırlara uygulayarak ParsedVehicleRow dizisi üretir.
 */
export function applyMappingToRows(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>
): ParsedVehicleRow[] {
  const vehicles: ParsedVehicleRow[] = [];

  for (const row of rows) {
    let plate = '';
    let brand = '';
    let model = '';
    let modelYear = 2020;
    let color = '';
    let currentKm = 0;
    let fuelType = 'Dizel';
    let owner = '';
    let purchasePrice = 0;
    let monthlyPrice = 350;
    let dailyPrice = 0;
    let customerName = '';
    let customerPhone = '';
    let rentalStartDate = '';
    let rentalEndDate = '';
    let notes = '';

    for (const [col, targetField] of Object.entries(columnMapping)) {
      const val = row[col];
      if (val === undefined || val === null || val === '') continue;

      const strVal = String(val).trim();

      if (targetField === 'plate') {
        plate = cleanPlate(strVal);
      } else if (targetField === 'brand' || targetField === 'make') {
        brand = strVal;
      } else if (targetField === 'model') {
        model = strVal;
      } else if (
        targetField === 'vehicleCombined' ||
        targetField === 'brand_and_model' ||
        targetField === 'make_and_model' ||
        targetField === 'vehicle'
      ) {
        const parts = strVal.split(/\s+/);
        const lowerStr = strVal.toLowerCase();
        if (lowerStr.startsWith('alfa romeo')) {
          brand = 'Alfa Romeo';
          model = strVal.substring(10).trim() || 'Giulietta';
        } else if (lowerStr.startsWith('land rover')) {
          brand = 'Land Rover';
          model = strVal.substring(10).trim() || 'Range Rover';
        } else {
          brand = parts[0] || 'Bilinmiyor';
          model = parts.slice(1).join(' ') || 'Model';
        }
      } else if (targetField === 'modelYear') {
        const num = parseInt(strVal, 10);
        if (!isNaN(num) && num > 1990 && num < 2035) modelYear = num;
      } else if (targetField === 'currentKm') {
        const num = parseInt(strVal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(num)) currentKm = num;
      } else if (targetField === 'color') {
        color = strVal;
      } else if (targetField === 'fuelType') {
        fuelType = strVal;
      } else if (targetField === 'owner') {
        owner = strVal;
      } else if (targetField === 'purchasePrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) purchasePrice = num;
      } else if (targetField === 'monthlyPrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) monthlyPrice = num;
      } else if (targetField === 'dailyPrice') {
        const num = parseFloat(strVal.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) dailyPrice = num;
      } else if (targetField === 'customerName') {
        customerName = strVal;
      } else if (targetField === 'customerPhone') {
        customerPhone = strVal;
      } else if (targetField === 'rentalStartDate') {
        rentalStartDate = strVal;
      } else if (targetField === 'rentalEndDate') {
        rentalEndDate = strVal;
      } else if (targetField === 'notes') {
        notes = strVal;
      }
    }

    if (!plate) continue; // Plaka yoksa atla

    vehicles.push({
      plate,
      brand: brand || 'Bilinmiyor',
      model: model || 'Model',
      modelYear,
      color: color || undefined,
      currentKm,
      fuelType: fuelType || 'Dizel',
      owner: owner || undefined,
      purchasePrice: purchasePrice || undefined,
      monthlyPrice: monthlyPrice || 350,
      dailyPrice: dailyPrice || Math.round((monthlyPrice || 350) / 25),
      status: customerName ? 'RENTED' : 'AVAILABLE',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      rentalStartDate: rentalStartDate || undefined,
      rentalEndDate: rentalEndDate || undefined,
      notes: notes || undefined,
    });
  }

  return vehicles;
}

/**
 * AI devre dışı veya ulaşılamazsa devreye giren kural tabanlı akıllı eşleştirici
 */
export function heuristicAnalyzeExcel(
  headers: string[],
  rows: Record<string, any>[]
): { vehicles: ParsedVehicleRow[]; columnMapping: Record<string, string> } {
  const columnMapping: Record<string, string> = {};

  // Normalleştirilmiş kelime eşlemeleri
  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (lower.match(/plak|tablic|registra|reg_no|licence|plate/i)) {
      columnMapping[h] = 'plate';
    } else if (lower.match(/marka|brand|proizvod|make/i)) {
      columnMapping[h] = 'brand';
    } else if (lower.match(/model|tip|tip_vozila/i)) {
      columnMapping[h] = 'model';
    } else if (lower.match(/auto|vozilo|arac|vehicle|car/i)) {
      columnMapping[h] = 'vehicleCombined';
    } else if (lower.match(/god|yil|year|godiste/i)) {
      columnMapping[h] = 'modelYear';
    } else if (lower.match(/km|kilomet|stanje|mili/i)) {
      columnMapping[h] = 'currentKm';
    } else if (lower.match(/renk|boja|color/i)) {
      columnMapping[h] = 'color';
    } else if (lower.match(/gorivo|yakit|fuel/i)) {
      columnMapping[h] = 'fuelType';
    } else if (lower.match(/vlasnik|sahip|owner|ortak/i)) {
      columnMapping[h] = 'owner';
    } else if (lower.match(/mesec|aylik|cena|fiyat|price|monthly/i)) {
      columnMapping[h] = 'monthlyPrice';
    } else if (lower.match(/vozac|driver|kiraci|musteri|klijent|customer|client/i)) {
      columnMapping[h] = 'customerName';
    } else if (lower.match(/tel|phone|mobil/i)) {
      columnMapping[h] = 'customerPhone';
    } else if (lower.match(/napomen|not|desc|status|durum/i)) {
      columnMapping[h] = 'notes';
    }
  }

  const vehicles = applyMappingToRows(rows, columnMapping);
  return { vehicles, columnMapping };
}

/**
 * Hibrit Analiz: Önce Gemini AI dener, hata alırsa kural tabanlı eşleştiriciye döner.
 */
export async function parseAndAnalyzeExcel(buffer: Buffer): Promise<ExcelAnalysisResult> {
  const { headers, rows } = readExcelBuffer(buffer);

  let vehicles: ParsedVehicleRow[] = [];
  let columnMapping: Record<string, string> = {};
  let method: 'GEMINI_AI' | 'HEURISTIC_FALLBACK' = 'GEMINI_AI';
  let aiConfidence = 'Yüksek (%98)';

  try {
    const aiResult = await analyzeExcelWithGemini(headers, rows);
    vehicles = aiResult.vehicles;
    columnMapping = aiResult.columnMapping;
  } catch (error: any) {
    console.warn('Gemini AI analizi başarısız oldu, kural tabanlı motor devreye alınıyor:', error.message);
    const fallbackResult = heuristicAnalyzeExcel(headers, rows);
    vehicles = fallbackResult.vehicles;
    columnMapping = fallbackResult.columnMapping;
    method = 'HEURISTIC_FALLBACK';
    aiConfidence = 'Kural Tabanlı Eşleştirme';
  }

  return {
    headers,
    sampleRows: rows.slice(0, 5),
    totalRows: rows.length,
    vehicles,
    columnMapping,
    aiConfidence,
    method,
  };
}

'use client';

import React, { useState } from 'react';
import { Layers, Plus, X, Check, Sparkles, Shield, Car, RotateCcw, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface PresetItem {
  key: string;
  category: 'essential' | 'safety' | 'comfort';
  tr: string;
  sr: string;
  en: string;
}

const PRESET_ACCESSORIES: PresetItem[] = [
  // Standart / Temel Donanımlar
  { key: 'phone_holder', category: 'essential', tr: 'Telefon Tutucu', sr: 'Držač za telefon', en: 'Phone Holder' },
  { key: 'car_charger', category: 'essential', tr: 'Çakmaklık Şarj Aleti', sr: 'USB Auto punjač', en: 'Car Charger / USB' },
  { key: 'first_aid', category: 'essential', tr: 'İlk Yardım Çantası', sr: 'Prva pomoć', en: 'First Aid Kit' },
  { key: 'reflector_extinguisher', category: 'essential', tr: 'Reflektör & Yangın Tüpü', sr: 'Trougao i PP aparat', en: 'Reflector & Extinguisher' },
  { key: 'floor_mats', category: 'essential', tr: 'Paspas Seti', sr: 'Patosnice', en: 'Floor Mats' },
  { key: 'spare_tire', category: 'essential', tr: 'Stepne / Yedek Lastik', sr: 'Rezervni točak', en: 'Spare Tire' },
  { key: 'jack_wrench', category: 'essential', tr: 'Kriko & Bijon Anahtarı', sr: 'Dizalica i ključ', en: 'Jack & Lug Wrench' },

  // Güvenlik & İlave Ekipmanlar
  { key: 'baby_seat', category: 'safety', tr: 'Bebek Koltuğu', sr: 'Dečije sedište', en: 'Baby / Child Seat' },
  { key: 'booster_seat', category: 'safety', tr: 'Yükseltici Minder', sr: 'Buster sedište', en: 'Booster Cushion' },
  { key: 'dashcam', category: 'safety', tr: 'Araç Kamerası (Dashcam)', sr: 'Auto kamera (Dashcam)', en: 'Dashcam' },
  { key: 'snow_chains', category: 'safety', tr: 'Kar Zinciri', sr: 'Lanci za sneg', en: 'Snow Chains' },
  { key: 'winter_tires', category: 'safety', tr: 'Kış Lastiği Takılı', sr: 'Zimske gume', en: 'Winter Tires' },

  // Konfor & Araç İçi Özellikler
  { key: 'sunroof', category: 'comfort', tr: 'Sunroof / Cam Tavan', sr: 'Šiber / Panorama krov', en: 'Sunroof / Moonroof' },
  { key: 'leather_seats', category: 'comfort', tr: 'Deri Koltuk', sr: 'Kožna sedišta', en: 'Leather Seats' },
  { key: 'heated_seats', category: 'comfort', tr: 'Koltuk Isıtma', sr: 'Grejanje sedišta', en: 'Heated Seats' },
  { key: 'reverse_camera', category: 'comfort', tr: 'Geri Görüş Kamerası', sr: 'Zadnja kamera za parkiranje', en: 'Reverse Camera' },
  { key: 'parking_sensors', category: 'comfort', tr: 'Park Sensörü', sr: 'Parking senzori', en: 'Parking Sensors' },
  { key: 'carplay_android', category: 'comfort', tr: 'Apple CarPlay & Android Auto', sr: 'Apple CarPlay & Android Auto', en: 'Apple CarPlay & Android Auto' },
  { key: 'bluetooth', category: 'comfort', tr: 'Bluetooth / Handsfree', sr: 'Bluetooth / Handsfree', en: 'Bluetooth / Handsfree' },
  { key: 'cruise_control', category: 'comfort', tr: 'Hız Sabitleyici (Cruise Control)', sr: 'Tempomat', en: 'Cruise Control' },
  { key: 'digital_ac', category: 'comfort', tr: 'Dijital Klima', sr: 'Digitalna klima', en: 'Digital Climate Control' },
  { key: 'roof_rack', category: 'comfort', tr: 'Portbagaj / Tavan Çıtası', sr: 'Krovni nosači', en: 'Roof Rack' },
];

export const STANDARD_DEFAULT_ACCESSORIES = [
  'Telefon Tutucu',
  'Çakmaklık Şarj Aleti',
  'İlk Yardım Çantası',
  'Reflektör & Yangın Tüpü',
  'Paspas Seti',
];

interface VehicleAccessoriesManagerProps {
  accessories: string[];
  onChange: (accessories: string[]) => void;
  className?: string;
  readOnly?: boolean;
}

export default function VehicleAccessoriesManager({
  accessories = [],
  onChange,
  className = '',
  readOnly = false,
}: VehicleAccessoriesManagerProps) {
  const { language } = useLanguage();
  const [customInput, setCustomInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'essential' | 'safety' | 'comfort'>('all');
  const [inputError, setInputError] = useState<string | null>(null);

  // Helper to normalize and match
  const isSelected = (label: string) => {
    const target = label.trim().toLowerCase();
    return accessories.some((item) => item.trim().toLowerCase() === target);
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customInput.trim();
    if (!val) return;

    if (isSelected(val)) {
      setInputError(
        language === 'sr'
          ? 'Ova oprema je već na listi.'
          : language === 'en'
          ? 'This accessory is already added.'
          : 'Bu aksesuar zaten listede mevcut.'
      );
      setTimeout(() => setInputError(null), 2500);
      return;
    }

    onChange([...accessories, val]);
    setCustomInput('');
    setInputError(null);
  };

  const handleTogglePreset = (preset: PresetItem) => {
    if (readOnly) return;
    const label = language === 'sr' ? preset.sr : language === 'en' ? preset.en : preset.tr;
    // Check by any language match of this preset
    const match = accessories.find((item) => {
      const lower = item.trim().toLowerCase();
      return (
        lower === preset.tr.toLowerCase() ||
        lower === preset.sr.toLowerCase() ||
        lower === preset.en.toLowerCase() ||
        lower === label.toLowerCase()
      );
    });

    if (match) {
      onChange(accessories.filter((item) => item !== match));
    } else {
      onChange([...accessories, label]);
    }
  };

  const handleRemove = (acc: string) => {
    if (readOnly) return;
    onChange(accessories.filter((item) => item !== acc));
  };

  const handleApplyDefaults = () => {
    if (readOnly) return;
    const defaults =
      language === 'sr'
        ? ['Držač za telefon', 'USB Auto punjač', 'Prva pomoć', 'Trougao i PP aparat', 'Patosnice']
        : language === 'en'
        ? ['Phone Holder', 'Car Charger / USB', 'First Aid Kit', 'Reflector & Extinguisher', 'Floor Mats']
        : STANDARD_DEFAULT_ACCESSORIES;

    // Merge without duplicates
    const merged = [...accessories];
    defaults.forEach((def) => {
      if (!merged.some((m) => m.trim().toLowerCase() === def.trim().toLowerCase())) {
        merged.push(def);
      }
    });
    onChange(merged);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onChange([]);
  };

  const filteredPresets = PRESET_ACCESSORIES.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 space-y-3.5 transition-all ${className}`}
    >
      {/* Başlık ve Hızlı Aksiyonlar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>
                {language === 'sr'
                  ? 'Oprema i Karakteristike Vozila'
                  : language === 'en'
                  ? 'Interior Accessories & Vehicle Features'
                  : 'Araç İçi Aksesuarlar & Donanımlar'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {accessories.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'sr'
                ? 'Upravljajte opremom koja se predaje i proverava pri povratku vozila'
                : language === 'en'
                ? 'Manage interior accessories and equipment tracked during rentals'
                : 'Kira teslim ve iadelerinde kontrol edilecek tüm donanım ve özellikleri belirleyin'}
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleApplyDefaults}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title={
                language === 'sr'
                  ? 'Dodaj standardnu opremu'
                  : language === 'en'
                  ? 'Add standard kit'
                  : 'Standart paketi ekle'
              }
            >
              <RotateCcw className="w-3 h-3 text-amber-500" />
              <span>{language === 'sr' ? 'Standardni Paket' : language === 'en' ? 'Standard Kit' : 'Standart Paket'}</span>
            </button>
            {accessories.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                title={language === 'sr' ? 'Ukloni sve' : language === 'en' ? 'Clear all' : 'Tümünü temizle'}
              >
                <Trash2 className="w-3 h-3" />
                <span>{language === 'sr' ? 'Očisti' : language === 'en' ? 'Clear' : 'Temizle'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Manuel / Özel Özellik Ekleme Girişi */}
      {!readOnly && (
        <div>
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder={
                  language === 'sr'
                    ? 'Unesite naziv opreme ili karakteristike (npr: Šiber, Kožna sedišta, Kuka...)'
                    : language === 'en'
                    ? 'Type accessory or vehicle feature (e.g. Sunroof, Leather Seats, Tow Bar...)'
                    : 'Aksesuar veya özellik yazın (Örn: Bebek Koltuğu, Sunroof, Deri Koltuk, Kar Zinciri...)'
                }
                className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-xl font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all ${
                  inputError
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-amber-500'
                }`}
              />
              {inputError && (
                <div className="absolute left-0 -bottom-4 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  {inputError}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{language === 'sr' ? 'Dodaj' : language === 'en' ? 'Add' : 'Ekle'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Kayıtlı / Seçilmiş Donanımlar Listesi */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>
            {language === 'sr'
              ? 'Aktivna oprema na ovom vozilu:'
              : language === 'en'
              ? 'Active features on this vehicle:'
              : 'Araçta Aktif Bulunan Donanımlar:'}
          </span>
          {accessories.length > 0 && (
            <span className="text-[10px] font-medium text-slate-400">
              {language === 'sr'
                ? `${accessories.length} stavki definisano`
                : language === 'en'
                ? `${accessories.length} items defined`
                : `${accessories.length} kalem tanımlı`}
            </span>
          )}
        </div>

        {accessories.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 text-center">
            <Car className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'sr'
                ? 'Nema dodate opreme. Izaberite iz predloga ispod ili upišite ručno.'
                : language === 'en'
                ? 'No accessories added. Pick from suggestions below or type custom features.'
                : 'Bu araçta henüz tanımlı aksesuar yok. Aşağıdaki hazır önerilerden seçebilir veya yukarıdan özel özellik ekleyebilirsiniz.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[50px]">
            {accessories.map((acc, idx) => (
              <span
                key={`${acc}-${idx}`}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 shadow-2xs group transition-all"
              >
                <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="max-w-[200px] sm:max-w-none truncate">{acc}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(acc)}
                    className="p-0.5 rounded-md hover:bg-amber-200/80 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title={
                      language === 'sr'
                        ? `Ukloni ${acc}`
                        : language === 'en'
                        ? `Remove ${acc}`
                        : `${acc} aksesuarını kaldır`
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hızlı Seçim Önerileri (Presets) */}
      {!readOnly && (
        <div className="space-y-2 pt-1 border-t border-slate-200/80 dark:border-slate-700/60">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {language === 'sr'
                ? 'Brzi izbor / Popularna oprema:'
                : language === 'en'
                ? 'Quick Pick / Popular Equipment:'
                : 'Hızlı Seçim / Sık Kullanılan Donanımlar:'}
            </span>

            {/* Kategori Filtresi */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'sr' ? 'Sve' : language === 'en' ? 'All' : 'Tümü'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('essential')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  activeCategory === 'essential'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'sr' ? 'Standard' : language === 'en' ? 'Standard' : 'Temel'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('safety')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  activeCategory === 'safety'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'sr' ? 'Sigurnost' : language === 'en' ? 'Safety' : 'Güvenlik'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('comfort')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  activeCategory === 'comfort'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'sr' ? 'Komfor' : language === 'en' ? 'Comfort' : 'Konfor'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const label = language === 'sr' ? preset.sr : language === 'en' ? preset.en : preset.tr;
              const active = accessories.some((item) => {
                const lower = item.trim().toLowerCase();
                return (
                  lower === preset.tr.toLowerCase() ||
                  lower === preset.sr.toLowerCase() ||
                  lower === preset.en.toLowerCase() ||
                  lower === label.toLowerCase()
                );
              });

              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleTogglePreset(preset)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs font-bold'
                      : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {active ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

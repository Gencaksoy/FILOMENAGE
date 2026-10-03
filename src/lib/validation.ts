// E-posta ve Şifre Güvenlik & Gerçekçilik Doğrulama Kütüphanesi

export interface PasswordChecklist {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 - 4
  checklist: PasswordChecklist;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const minLength = (password || '').length >= 6;
  const hasUppercase = /[A-Z]/.test(password || '');
  const hasLowercase = /[a-z]/.test(password || '');
  const hasNumber = /[0-9]/.test(password || '');

  const checklist: PasswordChecklist = {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
  };

  const score = [minLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
  const errors: string[] = [];

  if (!minLength) errors.push('Şifre en az 6 karakter olmalıdır.');
  if (!hasUppercase) errors.push('Şifre en az 1 büyük harf (A-Z) içermelidir.');
  if (!hasLowercase) errors.push('Şifre en az 1 küçük harf (a-z) içermelidir.');
  if (!hasNumber) errors.push('Şifre en az 1 rakam (0-9) içermelidir.');

  return {
    isValid: score === 4,
    score,
    checklist,
    errors,
  };
}

// Bilinen geçici / tek kullanımlık e-posta sağlayıcıları
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'yopmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'mohmal.com',
  'crazymailing.com',
  'emailondeck.com',
  'mytemp.email',
  'nada.ltd',
  'inboxkitten.com',
  'burnermail.io',
  'generator.email',
  'tempail.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'fakemailgenerator.com',
]);

// Bariz sahte / çöp e-posta kullanıcı adı kalıpları
const FAKE_USER_PATTERNS = [
  /^test$/i,
  /^asdf+$/i,
  /^qwer+$/i,
  /^123+$/i,
  /^aaa+$/i,
  /^bbb+$/i,
  /^ccc+$/i,
  /^abc$/i,
  /^deneme$/i,
  /^dummy$/i,
  /^fake$/i,
  /^admin$/i,
  /^user$/i,
  /^(.)\1{4,}$/, // 5 veya daha fazla aynı harf tekrarı örn: aaaaa@
];

// Yaygın alan adı yazım hataları
const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
};

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export function validateRealisticEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'E-posta adresi gereklidir.' };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Temel RFC 5322 regex format kontrolü
  const basicRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!basicRegex.test(trimmed)) {
    return { isValid: false, error: 'Geçersiz e-posta formatı. Lütfen kontrol ediniz.' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Geçersiz e-posta adresi.' };
  }

  const [localPart, domain] = parts;

  // 2. Yerel kısım (kullanıcı adı) uzunluk ve mantık kontrolleri
  if (localPart.length < 2) {
    return { isValid: false, error: 'E-posta kullanıcı adı çok kısa.' };
  }

  for (const pattern of FAKE_USER_PATTERNS) {
    if (pattern.test(localPart)) {
      return {
        isValid: false,
        error: 'Lütfen test/sahte kalıpları yerine gerçek bir e-posta adresi giriniz.',
      };
    }
  }

  // 3. Alan adı (domain) kontrolleri
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, error: 'E-posta alan adı geçersiz.' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, error: 'E-posta uzantısı (TLD) geçersiz.' };
  }

  // 4. Tek kullanımlık / geçici posta siteleri kontrolü
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Geçici (tek kullanımlık) e-posta sağlayıcıları sistemde kabul edilmemektedir.',
    };
  }

  // 5. Yaygın yazım hatası önerisi
  if (DOMAIN_TYPO_MAP[domain]) {
    const suggestedDomain = DOMAIN_TYPO_MAP[domain];
    return {
      isValid: true,
      suggestion: `${localPart}@${suggestedDomain}`,
    };
  }

  return { isValid: true };
}

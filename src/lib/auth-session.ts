import type { AuthUser } from './auth-client';

function getSessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️ [SECURITY WARNING] NEXTAUTH_SECRET, AUTH_SECRET, or JWT_SECRET is not set in environment variables! Using fallback secret for deployment.'
    );
  }

  return 'filo-yonetim-production-default-jwt-secret-key-change-in-env';
}


function encodeBase64Url(value: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < value.length; i += 0x8000) {
    const end = Math.min(i + 0x8000, value.length);
    for (let j = i; j < end; j += 1) {
      binary += String.fromCharCode(value[j]);
    }
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function getHmacKey(usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(getSessionSecret())),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  );
}

export async function createSessionCookie(user: AuthUser): Promise<string> {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(user)));
  const key = await getHmacKey(['sign']);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    toArrayBuffer(new TextEncoder().encode(payload))
  );
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function parseSessionCookie(cookieValue: string): Promise<AuthUser | null> {
  try {
    const [payload, signature, ...extraParts] = cookieValue.split('.');
    if (!payload || !signature || extraParts.length > 0) return null;

    const key = await getHmacKey(['verify']);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(decodeBase64Url(signature)),
      toArrayBuffer(new TextEncoder().encode(payload))
    );
    if (!isValid) return null;

    const user = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as AuthUser;
    if (
      !user ||
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.role !== 'string'
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

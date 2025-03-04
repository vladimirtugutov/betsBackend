import crypto from 'crypto';

/**
 * Функция для создания HMAC SHA-512 подписи.
 */
export function createSignature(body: Record<string, any> | null, secretKey: string): string {
  const payload = JSON.stringify(body || {});
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(payload);
  return hmac.digest('hex');
}

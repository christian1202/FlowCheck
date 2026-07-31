/**
 * Stateless HMAC token generation utility for QR codes.
 * Edge-compatible with Cloudflare Workers using the native Web Crypto API.
 */

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generates an HMAC-SHA256 signed token for an attendee registration.
 *
 * @param eventId The event ID
 * @param email The attendee email
 * @returns A JWT-style string in the format Base64(payload).Base64(signature)
 */
export async function generateHmacToken(eventId: string, email: string): Promise<string> {
  const payloadStr = `${eventId}:${email}`;
  const secretKey = process.env.SCANNER_SECRET_KEY || 'default_scanner_secret_key';

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const payloadData = encoder.encode(payloadStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    payloadData
  );

  const base64Payload = arrayBufferToBase64(payloadData);
  const base64Signature = arrayBufferToBase64(signatureBuffer);

  return `${base64Payload}.${base64Signature}`;
}

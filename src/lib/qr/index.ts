import QRCode from 'qrcode';

/**
 * Generates a base64 encoded PNG of a QR code containing the given text.
 * We use high error correction (H) so it can be scanned easily even if slightly damaged/distorted.
 * The output is a base64 string suitable for embedding directly in an email (e.g., via CID).
 *
 * @param text The string to encode (usually a UUID)
 * @returns A promise that resolves to the base64 representation of the image
 */
export async function generateQRBase64(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // The dataUrl is in the format "data:image/png;base64,iVBORw0KGgo..."
    // We strip the prefix to get just the base64 string
    return dataUrl.replace(/^data:image\/png;base64,/, '');
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

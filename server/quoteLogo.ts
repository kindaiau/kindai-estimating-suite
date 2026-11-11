export const INLINE_LOGO_MAX_BYTES = 48_000;

// PDFs render offline. Only bounded embedded raster images are accepted; URLs,
// SVG, local files and redirects must never turn this renderer into a fetch proxy.
export function safeEmbeddedLogo(value?: string, maxBytes = 2_000_000): string | null {
  if (!value || value.length > Math.ceil(maxBytes / 3) * 4 + 64) return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > maxBytes || bytes.toString('base64') !== match[2]) return null;
  const valid = match[1] === 'png' ? bytes.length >= 45 && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0 && bytes.readUInt32BE(16) <= 4096 && bytes.readUInt32BE(20) <= 4096 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : match[1] === 'jpeg' ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217
    : bytes.length >= 20 && bytes.readUInt32LE(4) === bytes.length - 8 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return valid ? value : null;
}

export function inlineUploadedLogo(base64: string, contentType: string): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) return null;
  // 48KB expands to64KB, safely within the existing MySQL TEXT column.
  if (base64.length > 64_000) return null;
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > INLINE_LOGO_MAX_BYTES) return null;
  return safeEmbeddedLogo(`data:${contentType};base64,${base64}`);
}

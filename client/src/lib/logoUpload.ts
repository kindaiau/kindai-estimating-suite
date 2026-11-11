// Resize locally before upload: the server can embed this logo without network
// access during PDF rendering or a database schema change.
export async function prepareInlineLogo(file: File): Promise<{ fileBase64: string; contentType: 'image/png'; fileName: string }> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use a PNG, JPEG or WebP logo for PDF branding.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('This logo image could not be read.')); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This logo has no readable dimensions.');
    let scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    for (let attempt = 0; attempt < 10; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser cannot prepare your logo. Try a smaller PNG image.');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const fileBase64 = canvas.toDataURL('image/png').split(',')[1];
      if (fileBase64 && fileBase64.length <= 64_000) return { fileBase64, contentType: 'image/png', fileName: file.name.replace(/\.[^.]+$/, '') + '.png' };
      scale *= 0.75;
    }
    throw new Error('Logo could not be reduced safely. Choose a simpler image.');
  } finally { URL.revokeObjectURL(url); }
}

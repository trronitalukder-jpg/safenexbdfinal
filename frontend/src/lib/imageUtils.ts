/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Downscales oversized camera/phone photos and compresses to high-quality JPEG.
 * Drastically reduces payload size (e.g. 15MB -> ~40-60KB) while maintaining sharp quality.
 */
export async function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.8
): Promise<{ base64Data: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    // If SVG, don't compress via canvas
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          base64Data: reader.result as string,
          fileName: file.name,
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
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
          resolve({
            base64Data: e.target?.result as string,
            fileName: file.name,
          });
          return;
        }

        // Draw and convert to JPEG with specified quality
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';

        resolve({
          base64Data: dataUrl,
          fileName: cleanFileName,
        });
      };

      img.onerror = () => {
        resolve({
          base64Data: e.target?.result as string,
          fileName: file.name,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Resolves an image URL to an absolute path pointing to the backend static file server,
 * or returns the URL directly if already absolute or base64.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${backendBase}${cleanPath}`;
}

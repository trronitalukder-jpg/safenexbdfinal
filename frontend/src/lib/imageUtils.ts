/**
 * Draws a professional SafnexBD watermark badge on the image canvas.
 * - Positioned at the bottom-right corner with responsive margins & scaling.
 * - Sleek dark translucent pill badge with border and amber shield icon.
 * - Crisp 'SafnexBD' text.
 * - Subtle diagonal center watermark for maximum copyright protection.
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string = 'SafnexBD'
) {
  const baseDim = Math.min(width, height);

  // 1. Subtle Center Watermark (Diagonal, very light opacity 0.08)
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-25 * Math.PI) / 180);
  const centerFontSize = Math.max(16, Math.round(baseDim * 0.075));
  ctx.font = `bold ${centerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // 2. Corner Badge Watermark (Bottom-Right)
  ctx.save();
  const fontSize = Math.max(12, Math.round(baseDim * 0.032));
  const paddingX = Math.round(fontSize * 0.8);
  const paddingY = Math.round(fontSize * 0.42);
  const margin = Math.round(baseDim * 0.035);

  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const iconSize = Math.round(fontSize * 0.95);
  const iconGap = Math.round(fontSize * 0.45);
  const badgeWidth = textWidth + iconSize + iconGap + paddingX * 2;
  const badgeHeight = fontSize + paddingY * 2;

  const badgeX = width - badgeWidth - margin;
  const badgeY = height - badgeHeight - margin;
  const radius = Math.round(badgeHeight / 2);

  // Draw rounded pill background
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
  } else {
    ctx.moveTo(badgeX + radius, badgeY);
    ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeHeight, radius);
    ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX, badgeY + badgeHeight, radius);
    ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY, radius);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeWidth, badgeY, radius);
    ctx.closePath();
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // sleek slate-900 translucent
  ctx.fill();
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.06));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.stroke();

  // Draw Amber Shield Icon
  const iconX = badgeX + paddingX;
  const iconCenterY = badgeY + badgeHeight / 2;
  const sW = iconSize * 0.8;
  const sH = iconSize;
  const sTop = iconCenterY - sH / 2;

  ctx.fillStyle = '#f59e0b'; // amber-500
  ctx.beginPath();
  ctx.moveTo(iconX, sTop);
  ctx.lineTo(iconX + sW, sTop);
  ctx.lineTo(iconX + sW, sTop + sH * 0.55);
  ctx.quadraticCurveTo(iconX + sW * 0.5, sTop + sH, iconX + sW * 0.5, sTop + sH);
  ctx.quadraticCurveTo(iconX, sTop + sH * 0.55, iconX, sTop + sH * 0.55);
  ctx.closePath();
  ctx.fill();

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, iconX + sW + iconGap, iconCenterY);

  ctx.restore();
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Downscales oversized camera/phone photos and compresses to high-quality JPEG.
 * Supports optional automatic SafnexBD watermarking for product copyright protection.
 */
export async function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.8,
  watermarkText?: string | boolean
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

        // 1. Draw base image
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Apply watermark if requested
        if (watermarkText) {
          const text = typeof watermarkText === 'string' ? watermarkText : 'SafnexBD';
          drawWatermark(ctx, width, height, text);
        }

        // 3. Convert to JPEG with specified quality
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
 * or returns the URL directly if already absolute, base64, or blob.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return cleanPath;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${backendBase}${cleanPath}`;
}

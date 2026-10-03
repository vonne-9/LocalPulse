/**
 * Utility for client-side device image import & compression
 * Resizes large device/camera photos (up to 15MB) into lightweight, high-quality Data URLs (~100-250KB)
 */

export interface ProcessedImage {
  dataUrl: string;
  fileName: string;
  sizeKb: number;
}

export function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawKb = Math.round(src.length * 0.75 / 1024);
          resolve({ dataUrl: src, fileName: file.name, sizeKb: rawKb });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round(dataUrl.length * 0.75 / 1024);

        resolve({
          dataUrl,
          fileName: file.name,
          sizeKb,
        });
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

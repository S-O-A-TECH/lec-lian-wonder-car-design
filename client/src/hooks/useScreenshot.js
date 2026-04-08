import { useCallback } from 'react';
import { uploadImage } from '../api';

export default function useScreenshot() {
  const capture = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(null);
        try {
          const result = await uploadImage(blob);
          resolve(result.path);
        } catch {
          resolve(null);
        }
      }, 'image/png');
    });
  }, []);

  const download = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `wonder-car-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return { capture, download };
}

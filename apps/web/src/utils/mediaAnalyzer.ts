/**
 * SecureChat Client-Side On-Device Media Sensitivity & Anti-Leak Analyzer.
 * Runs 100% locally in the browser via HTML5 Canvas before any encryption or upload.
 */

export interface MediaScanResult {
  isSensitive: boolean;
  skinRatio: number;
  confidence: number;
  reason?: string;
}

export class MediaAnalyzer {
  /**
   * Scans an image locally using skin-color cluster heuristics in YCbCr / RGB space.
   */
  public static async scanImage(file: File): Promise<MediaScanResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ isSensitive: false, skinRatio: 0, confidence: 0 });
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            let skinPixels = 0;
            const totalPixels = width * height;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Skin detection rule in RGB & YCbCr approximation
              // Standard Kovac, Peer and Solina skin tone bounds
              const isRgbSkin =
                r > 95 &&
                g > 40 &&
                b > 20 &&
                r - g > 15 &&
                r > b &&
                Math.max(r, g, b) - Math.min(r, g, b) > 15;

              if (isRgbSkin) {
                skinPixels++;
              }
            }

            const ratio = skinPixels / totalPixels;
            // High skin pixel coverage (>38%) in portrait/personal shots triggers sensitive intimacy advisory
            const isSensitive = ratio > 0.38;

            resolve({
              isSensitive,
              skinRatio: Math.round(ratio * 100) / 100,
              confidence: isSensitive ? Math.min(0.95, 0.6 + ratio) : 0.9,
              reason: isSensitive
                ? 'High skin-surface exposure detected. Possible intimate or private photograph.'
                : 'Standard media characteristics.',
            });
          } catch {
            resolve({ isSensitive: false, skinRatio: 0, confidence: 0 });
          }
        };
        img.onerror = () => resolve({ isSensitive: false, skinRatio: 0, confidence: 0 });
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ isSensitive: false, skinRatio: 0, confidence: 0 });
      reader.readAsDataURL(file);
    });
  }

  /**
   * Applies an anti-leak forensic watermark on the image with the recipient identifier.
   */
  public static async applyWatermark(file: File, recipientInfo: string): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Forensic diagonal watermark overlay
          ctx.save();
          ctx.font = `bold ${Math.max(16, Math.round(canvas.width / 24))}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 6);
          ctx.textAlign = 'center';
          ctx.fillText(`PROTECTED • CONFIDENTIAL TO: ${recipientInfo}`, 0, 0);
          ctx.fillText(`LEAKING IS A CRIME UNDER PECA 2016`, 0, Math.max(24, Math.round(canvas.width / 20)));
          ctx.restore();

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}

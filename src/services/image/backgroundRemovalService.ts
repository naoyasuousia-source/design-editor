/**
 * Service層: 画像の背景除去（特定色の透過処理）を担当
 */
export const backgroundRemovalService = {
    /**
     * 指定された画像URLの特定色を透明に変換した Blob URL を生成する
     * @param imageUrl 対象画像のURL
     * @param targetColorHex 透過したい色の16進数（例: '#ffffff'）。未指定の場合は左上のピクセル色を採用
     * @param tolerance 色の許容誤差 (0-255)
     */
    async removeBackground(
        imageUrl: string,
        targetColorHex?: string,
        tolerance: number = 40
    ): Promise<string> {
        console.log('[bgService] Starting Smart Connected Removal for:', imageUrl);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                console.log('[bgService] Image loaded:', width, 'x', height);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const visited = new Uint8Array(width * height);

                let tr: number, tg: number, tb: number;
                if (targetColorHex) {
                    tr = parseInt(targetColorHex.slice(1, 3), 16);
                    tg = parseInt(targetColorHex.slice(3, 5), 16);
                    tb = parseInt(targetColorHex.slice(5, 7), 16);
                } else {
                    tr = data[0]; tg = data[1]; tb = data[2];
                }
                console.log('[bgService] Target Color (RGB):', tr, tg, tb);

                // Flood Fill (BFS)
                const queue: number[] = [];

                // 四隅をシード点として追加
                const seeds = [
                    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]
                ];

                for (const [sx, sy] of seeds) {
                    const idx = sy * width + sx;
                    if (!visited[idx]) {
                        queue.push(sx, sy);
                        visited[idx] = 1;
                    }
                }

                let count = 0;
                let head = 0;
                while (head < queue.length) {
                    const x = queue[head++];
                    const y = queue[head++];

                    const pixelIdx = (y * width + x) * 4;
                    const r = data[pixelIdx];
                    const g = data[pixelIdx + 1];
                    const b = data[pixelIdx + 2];

                    const diff = Math.sqrt(
                        Math.pow(r - tr, 2) +
                        Math.pow(g - tg, 2) +
                        Math.pow(b - tb, 2)
                    );

                    if (diff < tolerance) {
                        data[pixelIdx + 3] = 0; // Alpha 0
                        count++;

                        // 4近傍探索
                        const neighbors = [
                            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
                        ];

                        for (const [nx, ny] of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIdx = ny * width + nx;
                                if (!visited[nIdx]) {
                                    visited[nIdx] = 1;
                                    queue.push(nx, ny);
                                }
                            }
                        }
                    }
                }

                console.log('[bgService] Process complete. Transparent pixels (connected):', count);

                ctx.putImageData(imageData, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newUrl = URL.createObjectURL(blob);
                        resolve(newUrl);
                    } else {
                        reject(new Error('Blob generation failed'));
                    }
                }, 'image/png');
            };
            img.onerror = (e) => {
                console.error('[bgService] Error loading image:', e);
                reject(new Error('Failed to load image'));
            };
            img.src = imageUrl;
        });
    }
};

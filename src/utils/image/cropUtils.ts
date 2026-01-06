/**
 * Logic層: トリミングに関する純粋な計算（数学的処理）を担当。
 * 副作用や DOM 操作は一切行わない。
 */

import type { CropRect, Size } from '@/types/image';

export const cropUtils = {
    /**
     * 要素の背景情報やオブジェクト情報を解析し、内部の画像スケールとオフセットを計算する
     */
    parseImageLayout(params: {
        rect: DOMRect;
        style: CSSStyleDeclaration;
        naturalSize: Size;
        zoom: number;
    }) {
        const { rect, style, naturalSize, zoom } = params;
        const NW = naturalSize.width;
        const NH = naturalSize.height;

        const borderL = parseFloat(style.borderLeftWidth) || 0;
        const borderT = parseFloat(style.borderTopWidth) || 0;
        const borderR = parseFloat(style.borderRightWidth) || 0;
        const borderB = parseFloat(style.borderBottomWidth) || 0;
        const paddingL = parseFloat(style.paddingLeft) || 0;
        const paddingT = parseFloat(style.paddingTop) || 0;

        const contentW = (rect.width / zoom) - borderL - borderR - paddingL - (parseFloat(style.paddingRight) || 0);
        const contentH = (rect.height / zoom) - borderT - borderB - paddingT - (parseFloat(style.paddingBottom) || 0);

        let s = 1;
        let offX = 0;
        let offY = 0;

        const bgImg = style.backgroundImage;
        if (bgImg && bgImg !== 'none') {
            const bgSizeStr = style.backgroundSize;
            if (bgSizeStr.includes('px')) {
                s = parseFloat(bgSizeStr.split(' ')[0]) / NW;
            } else {
                s = (parseFloat(bgSizeStr.split(' ')[0]) || 100) / 100 * contentW / NW;
            }

            const bgPosStr = style.backgroundPosition;
            if (bgPosStr.includes('px')) {
                offX = parseFloat(bgPosStr.split(' ')[0]);
                offY = parseFloat(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]);
            } else {
                const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
                offX = (contentW - NW * s) * (parsePct(bgPosStr.split(' ')[0]) / 100);
                offY = (contentH - NH * s) * (parsePct(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]) / 100);
            }
        } else {
            // object-fit: cover 相当の推論
            s = Math.max(contentW / NW, contentH / NH);
            const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
            const pos = (style.objectPosition || '50% 50%').split(' ');
            offX = (contentW - NW * s) * (parsePct(pos[0]) / 100);
            offY = (contentH - NH * s) * (parsePct(pos[1] || pos[0]) / 100);
        }

        return {
            scale: s,
            offX,
            offY,
            fullW: NW * s,
            fullH: NH * s,
            contentW,
            contentH,
            borders: { left: borderL, top: borderT },
            paddings: { left: paddingL, top: paddingT }
        };
    },

    /**
     * アスペクト比に応じた初期トリミング枠を計算
     */
    calculateInitialCropRect(fullSize: Size, aspectRatio: number | null): CropRect {
        let finalW = fullSize.width;
        let finalH = fullSize.height;
        let startX = 0;
        let startY = 0;

        if (aspectRatio) {
            if (fullSize.width / fullSize.height > aspectRatio) {
                finalW = fullSize.height * aspectRatio;
                startX = (fullSize.width - finalW) / 2;
            } else {
                finalH = fullSize.width / aspectRatio;
                startY = (fullSize.height - finalH) / 2;
            }
        }

        return { x: startX, y: startY, width: finalW, height: finalH };
    },

    /**
     * ドラッグ移動後の矩形を計算
     */
    calculateMove(params: {
        startRect: CropRect;
        deltaX: number;
        deltaY: number;
        elementSize: Size;
    }): { x: number; y: number } {
        const { startRect, deltaX, deltaY, elementSize } = params;
        return {
            x: Math.max(0, Math.min(elementSize.width - startRect.width, startRect.x + deltaX)),
            y: Math.max(0, Math.min(elementSize.height - startRect.height, startRect.y + deltaY))
        };
    },

    /**
     * リサイズ後の矩形を計算
     */
    calculateResize(params: {
        startRect: CropRect;
        deltaX: number;
        deltaY: number;
        elementSize: Size;
        aspectRatio: number | null;
    }): { width: number; height: number } {
        const { startRect, deltaX, deltaY, elementSize, aspectRatio } = params;
        let w = startRect.width + deltaX;
        let h = startRect.height + deltaY;

        if (aspectRatio) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) h = w / aspectRatio;
            else w = h * aspectRatio;
        }

        w = Math.max(10, Math.min(elementSize.width - startRect.x, w));
        h = Math.max(10, Math.min(elementSize.height - startRect.y, h));

        if (aspectRatio) {
            if (w / h > aspectRatio) w = h * aspectRatio;
            else h = w / aspectRatio;
        }

        return { width: w, height: h };
    },

    /**
     * トリミング後の最終的な transform 文字列を計算する
     */
    calculateFinalTransform(params: {
        currentTransform: string;
        cropRect: CropRect;
        initialOffsets: { offX: number; offY: number };
    }): string {
        const { currentTransform, cropRect, initialOffsets } = params;
        const moveX = cropRect.x + initialOffsets.offX;
        const moveY = cropRect.y + initialOffsets.offY;

        const tMatch = currentTransform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        if (tMatch) {
            const bx = parseFloat(tMatch[1]);
            const by = parseFloat(tMatch[2]);
            return currentTransform.replace(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/, `translate(${bx + moveX}px, ${by + moveY}px)`);
        }
        return `${currentTransform} translate(${moveX}px, ${moveY}px)`.trim();
    },

    /**
     * 背景画像用のスタイルオブジェクトを生成
     */
    generateBackgroundStyles(params: {
        cropRect: CropRect;
        fullSize: Size;
        url: string;
    }) {
        const { cropRect, fullSize, url } = params;

        // 1. Background Size (percentage)
        // [Image Size] / [Element Size] * 100%
        const bgSizeX = cropRect.width > 0 ? (fullSize.width / cropRect.width) * 100 : 100;
        const bgSizeY = cropRect.height > 0 ? (fullSize.height / cropRect.height) * 100 : 100;

        // 2. Background Position (percentage)
        // CSS position % = (offset) / (container_size - image_size) * 100%
        // We want image offset to be -(cropRect.x), meaning:
        // -cropRect.x = (cropRect.width - fullSize.width) * X%
        // X% = cropRect.x / (fullSize.width - cropRect.width)
        const diffX = fullSize.width - cropRect.width;
        const diffY = fullSize.height - cropRect.height;

        const posX = diffX > 0 ? (cropRect.x / diffX) * 100 : 0;
        const posY = diffY > 0 ? (cropRect.y / diffY) * 100 : 0;

        return {
            backgroundImage: `url('${url}')`,
            backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: 'no-repeat',
            width: `${cropRect.width || 0}px`,
            height: `${cropRect.height || 0}px`
        };
    }
};
